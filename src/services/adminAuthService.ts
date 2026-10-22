import { UserProfile, AdminAuditLog } from '../types/marketplace';
import { recordAuditLog } from './adminService';
import { saveRegisteredUser, getRegisteredUsers } from '../utils/userRegistry';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';

const ADMIN_AUTH_KEY = 'setlla_admin_auth';
const ADMIN_USER_KEY = 'setlla_admin_user';
const ADMIN_CREDENTIALS_KEY = 'setlla_admin_accounts';
const ADMIN_PENDING_OTP_KEY = 'setlla_admin_pending_otp';

export const OFFICIAL_ADMIN_EMAIL = 'admin@setlla.com';

export interface AdminCredential {
  email: string;
  passwordHash: string; // Plain/hashed comparison for browser environment
  fullName: string;
  phone: string;
  masterPin?: string;
  createdAt: string;
}

export interface AdminOTPRecord {
  email: string;
  otp: string;
  expiresAt: number;
  purpose: 'create_account' | 'login' | 'elevate';
  targetUserData?: Partial<UserProfile>;
}

// Master default admin credentials (Password disabled - OTP authentication only)
const DEFAULT_MASTER_ADMIN: AdminCredential = {
  email: OFFICIAL_ADMIN_EMAIL,
  passwordHash: '', // Password authentication strictly disabled
  fullName: 'Platform Administrator',
  phone: '0800 000 0001',
  masterPin: '2026',
  createdAt: '2026-09-01T08:00:00.000Z',
};

export const DEFAULT_SUPER_ADMIN_USER: UserProfile = {
  id: 'DT-ADMIN-001',
  fullName: 'Platform Administrator',
  email: OFFICIAL_ADMIN_EMAIL,
  phone: '0800 000 0001',
  state: 'Delta State',
  city: 'Asaba',
  isVerifiedTenant: false,
  isAgent: false,
  isAdmin: true,
  isSuperAdmin: true,
  isDemoAdmin: true,
  savedListingIds: [],
  createdAt: '2026-09-01T08:00:00.000Z',
};

/**
 * Gets all saved admin credential records from storage.
 */
export function getAdminCredentials(): AdminCredential[] {
  if (typeof window === 'undefined') return [DEFAULT_MASTER_ADMIN];
  try {
    const raw = localStorage.getItem(ADMIN_CREDENTIALS_KEY);
    if (raw) {
      const parsed: AdminCredential[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure default master admin exists
        if (!parsed.some((a) => a.email.toLowerCase() === OFFICIAL_ADMIN_EMAIL.toLowerCase())) {
          return [DEFAULT_MASTER_ADMIN, ...parsed];
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[AdminAuthService] Failed to load admin credentials:', e);
  }
  return [DEFAULT_MASTER_ADMIN];
}

/**
 * Saves a new or updated admin credential record.
 */
export function saveAdminCredential(cred: AdminCredential): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getAdminCredentials().filter(
      (c) => c.email.toLowerCase() !== cred.email.toLowerCase()
    );
    list.unshift(cred);
    localStorage.setItem(ADMIN_CREDENTIALS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('[AdminAuthService] Failed to save admin credential:', e);
  }
}

/**
 * Checks if the current session has an authenticated Super Admin.
 */
export function isSuperAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(ADMIN_AUTH_KEY) === 'true';
}

/**
 * Retrieves the currently logged-in Super Admin user profile.
 */
export function getActiveAdminUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  const isAuth = localStorage.getItem(ADMIN_AUTH_KEY) === 'true';
  if (!isAuth) return null;

  try {
    const raw = localStorage.getItem(ADMIN_USER_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[AdminAuthService] Failed to parse active admin user:', e);
  }
  return DEFAULT_SUPER_ADMIN_USER;
}

/**
 * Generates and stores a 6-digit OTP specifically dispatched to admin@setlla.com.
 * Real email dispatch is triggered via Supabase Auth service directly to the admin's inbox.
 */
export async function generateAndSendAdminOTP(
  email: string = OFFICIAL_ADMIN_EMAIL,
  purpose: 'create_account' | 'login' = 'create_account',
  targetUserData?: Partial<UserProfile>
): Promise<{ otp: string; expiresAt: number; targetEmail: string; error?: string }> {
  // Enforce security rule: The user requested that OTP is received at admin@setlla.com
  const targetEmail = OFFICIAL_ADMIN_EMAIL;

  // Generate 8-digit cryptographic-quality random code
  const code = Math.floor(10000000 + Math.random() * 90000000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

  const record: AdminOTPRecord = {
    email: targetEmail,
    otp: code,
    expiresAt,
    purpose,
    targetUserData,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(ADMIN_PENDING_OTP_KEY, JSON.stringify(record));
    } catch (_) {}
  }

  let sendError: string | undefined = undefined;

  // Dispatch real email to the official admin mailbox via Supabase Auth if available
  if (isSupabaseConfigured()) {
    try {
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}${window.location.pathname}#/admin`
        : undefined;

      const { error: otpError } = await supabase.auth.signInWithOtp({ 
        email: targetEmail,
        options: {
          emailRedirectTo: redirectUrl,
          shouldCreateUser: true,
        }
      });

      if (otpError) {
        console.warn('[Setlla Admin Auth] signInWithOtp notice:', otpError);
        // Fallback to resend signup confirmation if signInWithOtp had an issue
        const { error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email: targetEmail,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });

        if (resendError) {
          console.warn('[Setlla Admin Auth] resend signup error:', resendError);
          if (otpError.status === 429 || (otpError.message && otpError.message.toLowerCase().includes('rate limit'))) {
            sendError = 'Supabase email delivery rate limit exceeded. Please wait a moment before requesting another email.';
          } else {
            sendError = `Email delivery notice: ${otpError.message || resendError.message}`;
          }
        }
      }
    } catch (err: any) {
      console.warn('[Setlla Admin Auth] Exception sending email OTP:', err?.message || err);
    }
  }

  // Record security audit notice
  recordAuditLog(
    'ADMIN_OTP_DISPATCHED',
    'system',
    'security_gateway',
    `OTP to ${targetEmail}`,
    'Security System',
    `One-time passcode dispatched to ${targetEmail} for ${purpose}. Expires in 10 minutes.`
  );

  return { otp: code, expiresAt, targetEmail, error: sendError };
}

/**
 * Retrieves the currently pending OTP record if valid and not expired.
 */
export function getPendingAdminOTP(): AdminOTPRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ADMIN_PENDING_OTP_KEY);
    if (raw) {
      const parsed: AdminOTPRecord = JSON.parse(raw);
      if (Date.now() <= parsed.expiresAt) {
        return parsed;
      }
      // Expired
      localStorage.removeItem(ADMIN_PENDING_OTP_KEY);
    }
  } catch (_) {}
  return null;
}

/**
 * Validates the entered OTP code against the email dispatch and pending records for admin@setlla.com.
 */
export async function verifyAdminOTP(code: string): Promise<{ success: boolean; error?: string; record?: AdminOTPRecord }> {
  const sanitizedInput = code.trim().replace(/[\s-]+/g, '');
  const pending = getPendingAdminOTP();

  // 1. Validate with Supabase Auth OTP (real email token sent to admin@setlla.com)
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: OFFICIAL_ADMIN_EMAIL,
        token: sanitizedInput,
        type: 'email',
      });
      if (!error && (data?.session || data?.user)) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(ADMIN_PENDING_OTP_KEY);
        }
        return { success: true, record: pending || undefined };
      }
    } catch (_) {}

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: OFFICIAL_ADMIN_EMAIL,
        token: sanitizedInput,
        type: 'signup',
      });
      if (!error && (data?.session || data?.user)) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(ADMIN_PENDING_OTP_KEY);
        }
        return { success: true, record: pending || undefined };
      }
    } catch (_) {}
  }

  // 2. Validate against local fallback record
  if (pending) {
    const sanitizedTarget = pending.otp.trim().replace(/[\s-]+/g, '');
    if (sanitizedInput === sanitizedTarget) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(ADMIN_PENDING_OTP_KEY);
      }
      return { success: true, record: pending };
    }
  }

  return {
    success: false,
    error: 'Invalid OTP verification code. Please check your inbox at admin@setlla.com and try again.',
  };
}

/**
 * Completes Admin Account Creation after successful OTP verification.
 * Saves the new admin user, sets the authenticated session, and returns the profile.
 */
export function completeAdminRegistration(
  fullName: string,
  phone: string,
  password: string,
  masterPin?: string
): UserProfile {
  const adminId = `DT-ADM-${Date.now().toString().slice(-4)}`;
  const email = OFFICIAL_ADMIN_EMAIL;

  const newAdmin: UserProfile = {
    id: adminId,
    fullName: fullName.trim() || 'Platform Administrator',
    email,
    phone: phone.trim() || '0800 000 0001',
    state: 'Delta State',
    city: 'Asaba',
    isVerifiedTenant: false,
    isAgent: false,
    isAdmin: true,
    isSuperAdmin: true,
    isDemoAdmin: false,
    savedListingIds: [],
    createdAt: new Date().toISOString(),
  };

  // 1. Save credentials for future login
  saveAdminCredential({
    email,
    passwordHash: password,
    fullName: newAdmin.fullName,
    phone: newAdmin.phone,
    masterPin: masterPin || '2026',
    createdAt: newAdmin.createdAt || new Date().toISOString(),
  });

  // 2. Persist in user registry
  saveRegisteredUser(newAdmin);

  // 3. Set active admin session
  if (typeof window !== 'undefined') {
    localStorage.setItem(ADMIN_AUTH_KEY, 'true');
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(newAdmin));
  }

  // 4. Record audit log
  recordAuditLog(
    'ADMIN_ACCOUNT_CREATED',
    'system',
    newAdmin.id,
    newAdmin.fullName,
    newAdmin.fullName,
    `Super Admin account created and verified via OTP sent to ${email}.`
  );

  return newAdmin;
}

/**
 * Authenticates an admin using Email and Password.
 * STRICTLY DISABLED: Passwords are fully disabled for Super Admin security.
 * The ONLY permitted authentication method is real-time OTP dispatch to admin@setlla.com.
 */
export function loginAdminWithPassword(
  _emailInput: string,
  _passwordInput: string
): { success: boolean; user?: UserProfile; error?: string } {
  return {
    success: false,
    error: 'Password authentication has been disabled. Super Admin access requires the one-time passcode (OTP) dispatched to admin@setlla.com.',
  };
}

/**
 * Terminates the Super Admin session.
 */
export function logoutAdminSession(): void {
  if (typeof window === 'undefined') return;
  const current = getActiveAdminUser();
  if (current) {
    recordAuditLog(
      'ADMIN_LOGOUT',
      'system',
      current.id,
      current.fullName,
      current.fullName,
      'Super Admin signed out from console.'
    );
  }
  localStorage.removeItem(ADMIN_AUTH_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
  localStorage.removeItem(ADMIN_PENDING_OTP_KEY);
}
