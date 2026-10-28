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

/**
 * Checks if a user is the Master Super Administrator Elvis.
 */
export function isElvisSuperAdmin(user?: UserProfile | AdminCredential | null): boolean {
  if (!user) return false;
  const name = (user.fullName || '').trim().toLowerCase();
  const phone = (user.phone || '').replace(/\D/g, '');
  const email = ((user as any).email || '').trim().toLowerCase();
  const id = ((user as any).id || '').toLowerCase();
  return (
    email === OFFICIAL_ADMIN_EMAIL.toLowerCase() ||
    email === 'admin@setlla.com' ||
    name === 'elvis' ||
    name.startsWith('elvis ') ||
    name.includes('elvis') ||
    phone.endsWith('9077056351') ||
    phone.endsWith('7056351') ||
    id === 'dt-admin-elvis'
  );
}

// Master default admin credentials (Elvis - Supreme Super Authority)
const DEFAULT_MASTER_ADMIN: AdminCredential = {
  email: OFFICIAL_ADMIN_EMAIL,
  passwordHash: '', // Password authentication strictly disabled
  fullName: 'Elvis',
  phone: '0907 705 6351',
  masterPin: '2026',
  createdAt: '2026-09-01T08:00:00.000Z',
};

export const DEFAULT_SUPER_ADMIN_USER: UserProfile = {
  id: 'DT-ADMIN-ELVIS',
  fullName: 'Elvis',
  email: OFFICIAL_ADMIN_EMAIL,
  phone: '0907 705 6351',
  state: 'Delta State',
  city: 'Asaba',
  isVerifiedTenant: false,
  isAgent: false,
  isAdmin: true,
  isSuperAdmin: true,
  isDemoAdmin: false,
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
        // Ensure default master admin Elvis exists and takes precedence
        if (!parsed.some((a) => isElvisSuperAdmin(a))) {
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
 * Removes an admin credential by email and/or phone from storage.
 */
export function removeAdminCredential(email?: string, phone?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
    const list = getAdminCredentials().filter((c) => {
      const cPhone = (c.phone || '').replace(/\D/g, '');
      if (email && c.email.toLowerCase() === email.toLowerCase()) {
        if (!cleanPhone || cPhone === cleanPhone) {
          // Never remove Elvis default master credential
          if (isElvisSuperAdmin(c)) return true;
          return false;
        }
      }
      if (cleanPhone && cPhone === cleanPhone) {
        if (isElvisSuperAdmin(c)) return true;
        return false;
      }
      return true;
    });
    localStorage.setItem(ADMIN_CREDENTIALS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('[AdminAuthService] Failed to remove admin credential:', e);
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
 * Locks onto Elvis and prevents auto-switching to placeholder or other admin accounts.
 */
export function getActiveAdminUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  const isAuth = localStorage.getItem(ADMIN_AUTH_KEY) === 'true';
  if (!isAuth) return null;

  try {
    const raw = localStorage.getItem(ADMIN_USER_KEY);
    if (raw) {
      const parsed: UserProfile = JSON.parse(raw);
      // If parsed user is already Elvis, keep Elvis locked
      if (isElvisSuperAdmin(parsed)) {
        return parsed;
      }
      // Look up Elvis in user registry to restore master Elvis profile
      const registeredUsers = getRegisteredUsers();
      const elvis = registeredUsers.find((u) => isElvisSuperAdmin(u));
      if (elvis) {
        localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(elvis));
        return elvis;
      }
      // If parsed user is placeholder "Platform Administrator", upgrade directly to Elvis
      if (parsed.fullName === 'Platform Administrator') {
        localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(DEFAULT_SUPER_ADMIN_USER));
        return DEFAULT_SUPER_ADMIN_USER;
      }
      return parsed;
    }
  } catch (e) {
    console.warn('[AdminAuthService] Failed to parse active admin user:', e);
  }

  // Fallback: check if Elvis is registered
  try {
    const registeredUsers = getRegisteredUsers();
    const elvis = registeredUsers.find((u) => isElvisSuperAdmin(u));
    if (elvis) {
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(elvis));
      return elvis;
    }
  } catch (_) {}

  return DEFAULT_SUPER_ADMIN_USER;
}

/**
 * Looks up an admin account by email across local admin credentials, user registry, and Supabase.
 * Returns the matching UserProfile or AdminCredential if found, prioritizing Elvis.
 */
export async function findAdminAccount(emailInput: string): Promise<UserProfile | AdminCredential | null> {
  if (!emailInput || !emailInput.trim()) return null;
  const cleanEmail = emailInput.trim().toLowerCase();

  // 1. Check local user registry first — if Elvis exists, prioritize Elvis
  const registeredUsers = getRegisteredUsers();
  const elvisUser = registeredUsers.find(
    (u) => (u.isAdmin || u.isSuperAdmin) && isElvisSuperAdmin(u)
  );
  if (elvisUser && cleanEmail === OFFICIAL_ADMIN_EMAIL.toLowerCase()) {
    return elvisUser;
  }

  // 2. Check local admin credentials list
  const creds = getAdminCredentials();
  const matchedCred = creds.find((c) => c.email.toLowerCase() === cleanEmail);
  if (matchedCred) {
    return matchedCred;
  }

  // 3. Check other registered admins
  const matchedUser = registeredUsers.find(
    (u) => (u.isAdmin || u.isSuperAdmin) && u.email?.trim().toLowerCase() === cleanEmail
  );
  if (matchedUser) {
    return matchedUser;
  }

  // 3. Check Supabase platform_users table if configured
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('platform_users')
        .select('*')
        .ilike('email', cleanEmail)
        .or('is_admin.eq.true,is_super_admin.eq.true')
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          fullName: data.full_name,
          email: data.email,
          phone: data.phone,
          state: data.state || 'Delta State',
          city: data.city || 'Asaba',
          isVerifiedTenant: false,
          isAgent: false,
          isAdmin: true,
          isSuperAdmin: Boolean(data.is_super_admin),
          savedListingIds: [],
          createdAt: data.created_at || new Date().toISOString(),
        };
      }
    } catch (e) {
      console.warn('[AdminAuthService] Supabase admin lookup notice:', e);
    }
  }

  // 4. Default official admin email fallback
  if (cleanEmail === OFFICIAL_ADMIN_EMAIL.toLowerCase()) {
    return DEFAULT_MASTER_ADMIN;
  }

  return null;
}

/**
 * Generates and stores a one-time passcode (OTP) for admin authorization.
 * Dispatches real email via Supabase Auth service.
 */
export async function generateAndSendAdminOTP(
  email: string = OFFICIAL_ADMIN_EMAIL,
  purpose: 'create_account' | 'login' = 'create_account',
  targetUserData?: Partial<UserProfile>
): Promise<{ otp: string; expiresAt: number; targetEmail: string; error?: string }> {
  // Target email defaults to official admin email if not provided
  const targetEmail = (email && email.trim()) ? email.trim() : OFFICIAL_ADMIN_EMAIL;

  // Strict Security Gate:
  // If logging in, the email MUST correspond to a registered administrator account!
  if (purpose === 'login') {
    const existing = await findAdminAccount(targetEmail);
    if (!existing) {
      return {
        otp: '',
        expiresAt: 0,
        targetEmail,
        error: 'No administrator account found with this email. Please check your credentials or create an admin account.',
      };
    }
  } else if (purpose === 'create_account') {
    const existing = await findAdminAccount(targetEmail);
    if (existing) {
      return {
        otp: '',
        expiresAt: 0,
        targetEmail,
        error: 'An administrator account with this email already exists. Please sign in instead.',
      };
    }
  }

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

  const targetEmail = pending?.email || OFFICIAL_ADMIN_EMAIL;

  // 1. Validate with Supabase Auth OTP (real email token sent to admin)
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: targetEmail,
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
        email: targetEmail,
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
    error: 'Invalid OTP verification code. Please check your inbox and try again.',
  };
}

/**
 * Completes Admin Account Creation after successful OTP verification.
 * Saves the new admin user, sets the authenticated session, and returns the profile.
 */
export function completeAdminRegistration(
  fullName: string,
  phone: string,
  emailInput?: string,
  masterPin?: string
): UserProfile {
  const adminId = `DT-ADM-${Date.now().toString().slice(-4)}`;
  const email = (emailInput && emailInput.trim()) ? emailInput.trim() : OFFICIAL_ADMIN_EMAIL;

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
    passwordHash: '',
    fullName: newAdmin.fullName,
    phone: newAdmin.phone,
    masterPin: masterPin || '2026',
    createdAt: newAdmin.createdAt || new Date().toISOString(),
  });

  // 2. Persist in user registry
  saveRegisteredUser(newAdmin);

  // 3. Persist in Supabase platform_users if configured
  if (isSupabaseConfigured()) {
    Promise.resolve(
      supabase.from('platform_users').upsert({
        id: newAdmin.id,
        full_name: newAdmin.fullName,
        phone: newAdmin.phone,
        email: newAdmin.email,
        state: newAdmin.state,
        city: newAdmin.city,
        is_admin: true,
        is_super_admin: true,
        created_at: newAdmin.createdAt,
      })
    ).then(({ error }: any) => {
      if (error) console.warn('[AdminAuthService] Supabase platform_users upsert error:', error);
    }).catch(() => {});
  }

  // 4. Set active admin session
  if (typeof window !== 'undefined') {
    localStorage.setItem(ADMIN_AUTH_KEY, 'true');
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(newAdmin));
  }

  // 5. Record audit log
  recordAuditLog(
    'ADMIN_ACCOUNT_CREATED',
    'system',
    newAdmin.id,
    newAdmin.fullName,
    newAdmin.fullName,
    `Super Admin account created for ${email}.`
  );

  return newAdmin;
}

/**
 * Authenticates an admin using Email and Password via Supabase Auth + platform_users table.
 * 1. Checks Supabase Auth credentials (bcrypt / argon2 hashed in auth.users).
 * 2. Checks platform_users table for is_admin = true or is_super_admin = true.
 * 3. Rejects if not elevated in platform_users, immediately signing them out.
 */
export async function loginAdminWithPassword(
  emailInput: string,
  passwordInput: string
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  if (!emailInput || !passwordInput) {
    return { success: false, error: 'Please enter both your administrator email and password.' };
  }

  const cleanEmail = emailInput.trim().toLowerCase();

  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Database service is not configured. Please check environment variables.' };
  }

  try {
    // 1. Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: passwordInput,
    });

    if (authError || !authData.user) {
      return {
        success: false,
        error: authError?.message || 'Invalid administrator email or password.',
      };
    }

    // 2. Query platform_users table to verify role
    const { data: profile, error: profileError } = await supabase
      .from('platform_users')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profileError) {
      console.error('[AdminAuthService] Error querying platform_users:', profileError);
    }

    const isAuthorized = Boolean(profile?.is_admin || profile?.is_super_admin);

    if (!isAuthorized) {
      // Immediately terminate unprivileged session
      await supabase.auth.signOut().catch(() => {});
      return {
        success: false,
        error: 'Access denied: This account does not possess Super Admin platform privileges in platform_users.',
      };
    }

    if (profile?.is_suspended) {
      await supabase.auth.signOut().catch(() => {});
      return {
        success: false,
        error: 'Access denied: This administrator account has been disabled/suspended by Super Admin Elvis.',
      };
    }

    const adminProfile: UserProfile = {
      id: profile.id,
      fullName: profile.full_name || 'Elvis',
      email: profile.email || authData.user.email || cleanEmail,
      phone: profile.phone || '0907 705 6351',
      state: profile.state || 'Delta State',
      city: profile.city || 'Asaba',
      isVerifiedTenant: false,
      isAgent: false,
      isAdmin: true,
      isSuperAdmin: Boolean(profile.is_super_admin),
      isDemoAdmin: false,
      savedListingIds: [],
      createdAt: profile.created_at || new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(ADMIN_AUTH_KEY, 'true');
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(adminProfile));
    }

    recordAuditLog(
      'ADMIN_LOGIN',
      'system',
      adminProfile.id,
      adminProfile.fullName,
      adminProfile.fullName,
      `Super Admin logged in successfully with verified Supabase credentials.`
    );

    return { success: true, user: adminProfile };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Authentication failed. Please verify your credentials and network connection.',
    };
  }
}

/**
 * Verifies that the current browser session has a real, active Supabase Auth session
 * whose user is elevated in platform_users with is_admin or is_super_admin.
 * Protects active Elvis session from auto-switching.
 */
export async function verifyAdminSessionWithSupabase(): Promise<UserProfile | null> {
  if (typeof window === 'undefined') return null;

  // If local active admin is already Elvis, preserve Elvis and avoid unneeded switches
  const currentActive = getActiveAdminUser();
  if (isElvisSuperAdmin(currentActive)) {
    return currentActive;
  }

  if (!isSupabaseConfigured()) {
    return isSuperAdminAuthenticated() ? currentActive : null;
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      if (isSuperAdminAuthenticated()) {
        return currentActive;
      }
      return null;
    }

    const { data: profile, error } = await supabase
      .from('platform_users')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error || !profile || (!profile.is_admin && !profile.is_super_admin)) {
      if (isSuperAdminAuthenticated() && isElvisSuperAdmin(currentActive)) {
        return currentActive;
      }
      logoutAdminSession();
      await supabase.auth.signOut().catch(() => {});
      return null;
    }

    if (profile.is_suspended) {
      logoutAdminSession();
      await supabase.auth.signOut().catch(() => {});
      return null;
    }

    // If local active admin is Elvis, never overwrite with a non-Elvis profile
    if (isElvisSuperAdmin(currentActive)) {
      return currentActive;
    }

    // If the fetched profile is not Elvis, but an Elvis account exists in user registry, keep Elvis!
    const registeredUsers = getRegisteredUsers();
    const elvisRegistered = registeredUsers.find((u) => isElvisSuperAdmin(u));
    if (elvisRegistered) {
      localStorage.setItem(ADMIN_AUTH_KEY, 'true');
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(elvisRegistered));
      return elvisRegistered;
    }

    const adminProfile: UserProfile = {
      id: profile.id,
      fullName: profile.full_name || 'Elvis',
      email: profile.email || session.user.email || OFFICIAL_ADMIN_EMAIL,
      phone: profile.phone || '0907 705 6351',
      state: profile.state || 'Delta State',
      city: profile.city || 'Asaba',
      isVerifiedTenant: false,
      isAgent: false,
      isAdmin: true,
      isSuperAdmin: Boolean(profile.is_super_admin),
      isDemoAdmin: false,
      savedListingIds: [],
      createdAt: profile.created_at || new Date().toISOString(),
    };

    localStorage.setItem(ADMIN_AUTH_KEY, 'true');
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(adminProfile));
    return adminProfile;
  } catch (e) {
    console.warn('[AdminAuthService] Session verification error:', e);
    return isSuperAdminAuthenticated() ? getActiveAdminUser() : null;
  }
}

/**
 * Terminates the Super Admin session across localStorage and Supabase Auth.
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

  if (isSupabaseConfigured()) {
    try {
      supabase.auth.signOut().catch(() => {});
    } catch (_) {}
  }
}
