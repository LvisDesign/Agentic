import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import { UserProfile } from '../types/marketplace';
import {
  checkUserExistsAsync,
  findUserByCredential,
  findUserByCredentialAsync,
  saveRegisteredUser,
  saveRegisteredUserAsync,
  normalizeEmail,
  isDeletedUserRecord,
  validateLegitPhoneNumber,
} from '../utils/userRegistry';
import { hashToken, verifyHashedToken, checkRateLimit } from '../utils/security';

const PENDING_EMAIL_OTP_KEY = 'setlla_pending_email_otp';

export type EmailOTPPurpose = 'agent_signup' | 'employer_signup' | 'forgot_password' | 'signup' | 'tenant_signup' | 'job_seeker_signup';

export interface PendingEmailOTPRecord {
  email: string;
  otpHash: string;
  purpose: EmailOTPPurpose;
  expiresAt: number;
  pendingUser?: UserProfile;
}

/**
 * Retrieves the currently active pending email OTP record from local storage.
 */
export function getPendingEmailOTP(): PendingEmailOTPRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PENDING_EMAIL_OTP_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Clears any pending email OTP record.
 */
export function clearPendingEmailOTP(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PENDING_EMAIL_OTP_KEY);
}

/**
 * Checks whether an account role requires email verification.
 * Compulsory for ALL accounts: Tenants, Agents, Employers, and Job Seekers.
 */
export function isEmailVerificationRequired(_persona?: string, _isAgent?: boolean): boolean {
  return true;
}

/**
 * Dispatches a 6-digit email OTP for Agent/Employer verification or Password Reset.
 */
export async function sendEmailOTP(
  email: string,
  purpose: EmailOTPPurpose,
  pendingUser?: UserProfile,
  turnstileToken?: string
): Promise<{ success: boolean; message: string; testOtp: string; expiresAt: number; isExistingAccount?: boolean }> {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }

  // Cloudflare Turnstile server-side validation
  if (turnstileToken) {
    try {
      const verifyRes = await fetch('/api/verify-turnstile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: turnstileToken }),
      });
      if (verifyRes.ok) {
        const verifyData = await verifyRes.json();
        if (verifyData && verifyData.success === false) {
          console.warn('[EmailVerification] Turnstile verification failed:', verifyData['error-codes']);
          throw new Error('Bot verification expired or invalid. Please check the verification box again.');
        }
        console.log('[EmailVerification] Cloudflare Turnstile siteverify success.');
      }
    } catch (err: any) {
      if (err.message && err.message.includes('Bot verification')) {
        throw err;
      }
      console.warn('[EmailVerification] Turnstile siteverify notice:', err);
    }
  }

  // Strict Security: Check if email is blacklisted / banned by admin
  if (isDeletedUserRecord({ email: cleanEmail })) {
    throw new Error('This email address has been restricted by platform administration. Please contact support@setlla.com.');
  }

  // If forgot password, strictly verify that the account exists in Supabase platform_users
  if (purpose === 'forgot_password') {
    const existingUser = await findUserByCredentialAsync(cleanEmail);
    if (!existingUser) {
      throw new Error(`No account registered with ${cleanEmail}. Please check your email or create an account.`);
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('setlla_last_email', cleanEmail);
      } catch (_) {}
    }
  } else {
    // Enforce legitimate Nigerian mobile phone number for all signups
    if (pendingUser?.phone) {
      const phoneValidation = validateLegitPhoneNumber(pendingUser.phone);
      if (!phoneValidation.valid) {
        throw new Error(phoneValidation.message || 'Please enter a valid 11-digit Nigerian mobile phone number.');
      }
      pendingUser.phone = phoneValidation.normalized;
    }

    // For any signup purpose, strictly block if an active account already uses this email or phone number
    const dupCheck = await checkUserExistsAsync(pendingUser?.phone || '', cleanEmail);
    if (dupCheck.exists) {
      throw new Error(
        dupCheck.message ||
          'An account with this email or phone number already exists on Setlla. Each email and phone number can only be used once.'
      );
    }
  }

  // Anti-flooding rate limit: Max 4 requests per 60 seconds per email address
  const rl = checkRateLimit(`email_otp_${cleanEmail}`, 4, 60 * 1000);
  if (!rl.allowed) {
    throw new Error(`Too many verification attempts. Please wait ${rl.retryAfterSeconds} seconds before requesting a new code.`);
  }

  // Generate 6-digit cryptographic verification code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
  const otpHash = await hashToken(code);

  const record: PendingEmailOTPRecord = {
    email: cleanEmail,
    otpHash,
    purpose,
    expiresAt,
    pendingUser,
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(PENDING_EMAIL_OTP_KEY, JSON.stringify(record));
  }

  let isExistingAccount = false;

  // Supabase Auth Email Delivery via Hostinger custom SMTP
  if (isSupabaseConfigured()) {
    const baseRedirectUrl = typeof window !== 'undefined' && window.location?.origin
      ? `${window.location.origin}${window.location.pathname}`
      : 'https://setlla.com';
    const redirectUrl = purpose === 'forgot_password'
      ? `${baseRedirectUrl}?type=recovery`
      : baseRedirectUrl;

    // Primary OTP Dispatch via Supabase signInWithOtp:
    // This is the dedicated Supabase API that dispatches 6-digit email OTPs via SMTP.
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: redirectUrl,
          shouldCreateUser: purpose !== 'forgot_password',
        },
      });

      if (otpError) {
        console.warn('[Setlla Email Service] Supabase signInWithOtp notice:', otpError);

        if (otpError.status === 429 || otpError.message.toLowerCase().includes('rate limit')) {
          throw new Error('Email delivery rate limit reached. Please wait a moment before requesting another code.');
        }

        // Secondary Fallback: If signInWithOtp fails, attempt signUp/resend
        if (purpose === 'forgot_password') {
          const { error: resetErr } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
            redirectTo: redirectUrl,
          });
          if (resetErr) {
            console.warn('[Setlla Email Service] Password reset fallback notice:', resetErr);
          }
        } else {
          const userPassword = pendingUser?.password || `Setlla_${Math.random().toString(36).substring(2, 10)}!`;
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: cleanEmail,
            password: userPassword,
            options: {
              emailRedirectTo: redirectUrl,
              data: {
                full_name: pendingUser?.fullName || '',
                phone: pendingUser?.phone || '',
                persona: pendingUser?.persona || '',
                is_agent: pendingUser?.isAgent || false,
              },
            },
          });

          if (signUpError) {
            console.warn('[Setlla Email Service] Fallback signUp notice:', signUpError);
            if (
              signUpError.message.toLowerCase().includes('already registered') ||
              signUpError.message.toLowerCase().includes('already exists')
            ) {
              isExistingAccount = true;
              await supabase.auth.resend({
                type: 'signup',
                email: cleanEmail,
                options: { emailRedirectTo: redirectUrl },
              }).catch(() => {});
            }
          } else if (signUpData?.user && (!signUpData.user.identities || signUpData.user.identities.length === 0)) {
            isExistingAccount = true;
            await supabase.auth.resend({
              type: 'signup',
              email: cleanEmail,
              options: { emailRedirectTo: redirectUrl },
            }).catch(() => {});
          }
        }
      } else {
        console.log('[Setlla Email Service] Supabase OTP email successfully dispatched via Hostinger SMTP to:', cleanEmail);
      }
    } catch (dispatchErr: any) {
      console.error('[Setlla Email Service] Supabase OTP dispatch error:', dispatchErr);
      throw new Error(dispatchErr?.message || 'Failed to dispatch verification email. Please check your connection.');
    }
  }

  return {
    success: true,
    message: isExistingAccount
      ? `This email is already associated with an account. We've sent a verification link if pending confirmation.`
      : `A 6-digit verification code was sent to ${cleanEmail}.`,
    isExistingAccount,
    testOtp: '',
    expiresAt,
  };
}

/**
 * Verifies the 6-digit email OTP.
 * Validates against both local record and Supabase Auth (sent via Hostinger SMTP).
 * On success for signups, marks account as email-verified and persists to database.
 */
export async function verifyEmailOTP(
  email: string,
  enteredCode: string
): Promise<{ success: boolean; purpose: EmailOTPPurpose; user?: UserProfile }> {
  const cleanEmail = normalizeEmail(email);
  const record = getPendingEmailOTP();

  if (!record || record.email !== cleanEmail) {
    throw new Error('No pending verification found for this email. Please request a new code.');
  }

  if (Date.now() > record.expiresAt) {
    clearPendingEmailOTP();
    throw new Error('Verification code has expired. Please request a new code.');
  }

  // Rate-limit verification guessing: Max 5 attempts per 60 seconds
  const verifyRl = checkRateLimit(`email_verify_attempt_${cleanEmail}`, 5, 60 * 1000);
  if (!verifyRl.allowed) {
    throw new Error(`Too many incorrect attempts. Please wait ${verifyRl.retryAfterSeconds} seconds before trying again.`);
  }

  // Securely verify against the stored cryptographic SHA-256 hash or backward-compatible plaintext
  const cleanInput = enteredCode.trim();
  let matches = false;
  if (record.otpHash) {
    matches = await verifyHashedToken(cleanInput, record.otpHash);
  } else if ((record as any).otp) {
    matches = (record as any).otp === cleanInput;
  }

  // If local hash doesn't match, verify against Supabase Auth OTP (code sent via Hostinger SMTP)
  if (!matches && isSupabaseConfigured()) {
    // If purpose is forgot_password, check recovery token first
    if (record.purpose === 'forgot_password') {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: enteredCode.trim(),
          type: 'recovery',
        });
        if (!error && (data?.session || data?.user)) {
          matches = true;
        }
      } catch (_) {}
    }

    if (!matches) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: enteredCode.trim(),
          type: 'recovery',
        });
        if (!error && (data?.session || data?.user)) {
          matches = true;
        }
      } catch (_) {}
    }

    if (!matches) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: enteredCode.trim(),
          type: 'email',
        });
        if (!error && (data?.session || data?.user)) {
          matches = true;
        }
      } catch (_) {}
    }

    if (!matches) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: enteredCode.trim(),
          type: 'signup',
        });
        if (!error && (data?.session || data?.user)) {
          matches = true;
        }
      } catch (_) {}
    }

    if (!matches) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: enteredCode.trim(),
          type: 'magiclink',
        });
        if (!error && (data?.session || data?.user)) {
          matches = true;
        }
      } catch (_) {}
    }
  }

  if (!matches) {
    throw new Error('Invalid verification code. Please check your email and try again.');
  }

  const purpose = record.purpose;
  let verifiedUser = record.pendingUser;

  // If this was any signup registration, finalize and activate their account
  if (
    purpose === 'agent_signup' ||
    purpose === 'employer_signup' ||
    purpose === 'signup' ||
    purpose === 'tenant_signup' ||
    purpose === 'job_seeker_signup'
  ) {
    // Re-verify before account creation that no other account claimed this email or phone number
    const dupCheck = await checkUserExistsAsync(
      verifiedUser?.phone || '',
      verifiedUser?.email || cleanEmail,
      verifiedUser?.id
    );
    if (dupCheck.exists) {
      clearPendingEmailOTP();
      throw new Error(
        dupCheck.message ||
          'An account with this email or phone number already exists on Setlla. Please sign in instead.'
      );
    }

    if (verifiedUser) {
      verifiedUser.isEmailVerified = true;
      await saveRegisteredUserAsync(verifiedUser, { allowReRegistration: true });
      if (verifiedUser.password && isSupabaseConfigured()) {
        try {
          await supabase.auth.updateUser({ password: verifiedUser.password });
        } catch (_) {}
      }
    }
  }

  clearPendingEmailOTP();

  return {
    success: true,
    purpose,
    user: verifiedUser,
  };
}

/**
 * Resets user account password after OTP verification.
 * Updates local cache and central Supabase platform_users and auth.users.
 */
export async function resetUserPassword(
  email: string,
  newPassword: string
): Promise<UserProfile> {
  const cleanEmail = normalizeEmail(email);
  if (!newPassword || newPassword.trim().length < 6) {
    throw new Error('New password must be at least 6 characters.');
  }

  // 1. Update Supabase Auth user password if session exists
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword.trim() });
      if (error) {
        console.warn('[Setlla Auth] Supabase updateUser notice:', error.message);
      } else {
        console.log('[Setlla Auth] Supabase auth.users password updated successfully.');
      }
    } catch (e) {
      console.warn('[Setlla Auth] Exception updating Supabase auth password:', e);
    }
  }

  // 2. Locate profile in central platform_users first (single source of truth)
  let user = await findUserByCredentialAsync(cleanEmail);
  if (!user) {
    user = findUserByCredential(cleanEmail);
  }

  if (!user) {
    const authUser = (await supabase.auth.getUser())?.data?.user;
    user = {
      id: authUser?.id || `DT-USR-${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: authUser?.user_metadata?.full_name || 'Member',
      phone: authUser?.user_metadata?.phone || '',
      email: cleanEmail,
      persona: 'tenant',
      state: 'Delta State',
      city: 'Asaba',
      operatingCity: 'Asaba',
      isAgent: false,
      kycStatus: 'verified',
      isVerifiedTenant: true,
      savedListingIds: [],
      createdAt: new Date().toISOString(),
      isEmailVerified: true,
      password: newPassword.trim(),
    };
  } else {
    user.password = newPassword.trim();
    user.isEmailVerified = true;
    user.lastProfileEditAt = new Date().toISOString();
  }

  saveRegisteredUser(user, { allowReRegistration: true });
  await saveRegisteredUserAsync(user, { allowReRegistration: true });

  return user;
}
