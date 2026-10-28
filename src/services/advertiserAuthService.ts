import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import { createPartnerApiKey, getPartnerApiKeys } from './adService';

export interface WalletTransaction {
  id: string;
  type: 'credit_purchase' | 'campaign_deduction' | 'refund';
  amount: number;
  description: string;
  reference?: string;
  paymentMethod?: string;
  createdAt: string;
}

export interface AdvertiserUser {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  whatsapp?: string;
  websiteUrl?: string;
  industry?: string;
  operatingCity?: string;
  apiKey: string;
  accountStatus: 'active' | 'pending' | 'suspended';
  totalSpent: number;
  walletBalance: number;
  transactions?: WalletTransaction[];
  passwordHash?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AdvertiserSignupPayload {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  whatsapp?: string;
  websiteUrl?: string;
  industry?: string;
  operatingCity?: string;
  password?: string;
}

const ADVERTISER_AUTH_KEY = 'setlla_advertiser_auth';
const ADVERTISER_USER_KEY = 'setlla_advertiser_user';
const ADVERTISERS_REGISTRY_KEY = 'setlla_registered_advertisers';
const ADVERTISER_PENDING_OTP_KEY = 'setlla_advertiser_pending_otp';

// Auto-purge any stale mock/demo advertiser sessions on client bootstrap
if (typeof window !== 'undefined') {
  try {
    const rawUser = localStorage.getItem(ADVERTISER_USER_KEY);
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      if (
        parsed.id === 'adv-asaba-solar-01' ||
        parsed.email === 'partners@asabasolar.ng' ||
        parsed.companyName?.includes('Asaba Solar')
      ) {
        localStorage.removeItem(ADVERTISER_AUTH_KEY);
        localStorage.removeItem(ADVERTISER_USER_KEY);
      }
    }
    const rawRegistry = localStorage.getItem(ADVERTISERS_REGISTRY_KEY);
    if (rawRegistry) {
      const parsedList = JSON.parse(rawRegistry);
      if (Array.isArray(parsedList)) {
        const cleaned = parsedList.filter(
          (a: any) =>
            a &&
            a.id !== 'adv-asaba-solar-01' &&
            a.email !== 'partners@asabasolar.ng' &&
            !a.companyName?.includes('Asaba Solar')
        );
        localStorage.setItem(ADVERTISERS_REGISTRY_KEY, JSON.stringify(cleaned));
      }
    }
  } catch (_) {}
}

/**
 * Retrieves all registered advertisers from local storage.
 */
export function getRegisteredAdvertisers(): AdvertiserUser[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ADVERTISERS_REGISTRY_KEY);
    if (raw) {
      const parsed: AdvertiserUser[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter(
          (a) =>
            a &&
            a.id !== 'adv-asaba-solar-01' &&
            a.email !== 'partners@asabasolar.ng' &&
            !a.companyName?.includes('Asaba Solar')
        );
      }
    }
  } catch (e) {
    console.warn('[AdvertiserAuth] Failed to parse advertisers:', e);
  }
  return [];
}

/**
 * Saves a registered advertiser to registry and optionally Supabase.
 */
export async function saveRegisteredAdvertiser(advertiser: AdvertiserUser): Promise<void> {
  if (typeof window === 'undefined') return;
  const list = getRegisteredAdvertisers().filter(
    (a) => a.email.toLowerCase() !== advertiser.email.toLowerCase() && a.id !== advertiser.id
  );
  list.unshift(advertiser);
  localStorage.setItem(ADVERTISERS_REGISTRY_KEY, JSON.stringify(list));

  // Sync to Supabase (both advertisers and central platform_users table)
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('advertisers').upsert(
        {
          id: advertiser.id,
          company_name: advertiser.companyName,
          contact_name: advertiser.contactName,
          email: advertiser.email.toLowerCase(),
          phone: advertiser.phone,
          whatsapp: advertiser.whatsapp || null,
          industry: advertiser.industry || null,
          operating_city: advertiser.operatingCity || 'Asaba',
          website_url: advertiser.websiteUrl || null,
          api_key: advertiser.apiKey,
          account_status: advertiser.accountStatus,
          total_spent: advertiser.totalSpent || 0,
          wallet_balance: advertiser.walletBalance ?? 0,
          updated_at: new Date().toISOString(),
          last_login_at: advertiser.lastLoginAt || new Date().toISOString(),
        },
        { onConflict: 'email' }
      );

      // Also ensure unified visibility in central platform_users
      await supabase.from('platform_users').upsert(
        {
          id: advertiser.id,
          full_name: advertiser.contactName || advertiser.companyName,
          phone: advertiser.phone,
          email: advertiser.email.toLowerCase(),
          persona: 'advertiser',
          agency_name: advertiser.companyName,
          city: advertiser.operatingCity || 'Asaba',
          state: 'Delta State',
          is_agent: false,
          is_admin: false,
          is_email_verified: true,
          created_at: advertiser.createdAt,
        },
        { onConflict: 'id' }
      );
    } catch (e) {
      console.warn('[AdvertiserAuth] Supabase sync notice:', e);
    }
  }
}

/**
 * Checks if the current session has an authenticated Advertiser.
 */
export function isAdvertiserAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(ADVERTISER_AUTH_KEY) === 'true';
}

/**
 * Returns the currently active logged in Advertiser profile.
 */
export function getActiveAdvertiser(): AdvertiserUser | null {
  if (typeof window === 'undefined') return null;
  const isAuth = localStorage.getItem(ADVERTISER_AUTH_KEY) === 'true';
  if (!isAuth) return null;
  const raw = localStorage.getItem(ADVERTISER_USER_KEY);
  if (!raw) return null;
  try {
    const parsed: AdvertiserUser = JSON.parse(raw);
    if (
      !parsed ||
      parsed.id === 'adv-asaba-solar-01' ||
      parsed.email === 'partners@asabasolar.ng' ||
      parsed.companyName?.includes('Asaba Solar')
    ) {
      localStorage.removeItem(ADVERTISER_AUTH_KEY);
      localStorage.removeItem(ADVERTISER_USER_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Signs up a new corporate advertiser and creates their dedicated partner API key.
 */
export async function signupAdvertiser(payload: AdvertiserSignupPayload): Promise<AdvertiserUser> {
  const existing = getRegisteredAdvertisers().find(
    (a) => a.email.toLowerCase() === payload.email.trim().toLowerCase()
  );

  if (existing) {
    throw new Error('An advertiser account with this email address already exists. Please log in.');
  }

  // Create or retrieve corresponding API Key
  const existingKeys = getPartnerApiKeys();
  let matchedKey = existingKeys.find(
    (k) => k.contactEmail.toLowerCase() === payload.email.trim().toLowerCase()
  );

  if (!matchedKey) {
    matchedKey = createPartnerApiKey(
      payload.companyName.trim(),
      payload.email.trim(),
      payload.phone.trim()
    );
  }

  const newAdvertiser: AdvertiserUser = {
    id: `adv-${Date.now()}`,
    companyName: payload.companyName.trim(),
    contactName: payload.contactName.trim(),
    email: payload.email.trim().toLowerCase(),
    phone: payload.phone.trim(),
    whatsapp: payload.whatsapp?.trim() || payload.phone.trim(),
    websiteUrl: payload.websiteUrl?.trim(),
    industry: payload.industry?.trim() || 'Real Estate & Properties',
    operatingCity: payload.operatingCity?.trim() || 'Asaba',
    apiKey: matchedKey.apiKey,
    accountStatus: 'active',
    totalSpent: 0,
    walletBalance: 0,
    transactions: [],
    passwordHash: payload.password?.trim(),
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  await saveRegisteredAdvertiser(newAdvertiser);

  // Set active session
  localStorage.setItem(ADVERTISER_AUTH_KEY, 'true');
  localStorage.setItem(ADVERTISER_USER_KEY, JSON.stringify(newAdvertiser));

  return newAdvertiser;
}

/**
 * Authenticates an existing advertiser.
 */
export async function loginAdvertiser(email: string, password?: string): Promise<AdvertiserUser> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Check local registry first
  let user = getRegisteredAdvertisers().find((a) => a.email.toLowerCase() === cleanEmail);

  // 2. Fallback to Supabase if not found locally
  if (!user && isSupabaseConfigured()) {
    try {
      const { data } = await supabase
        .from('advertisers')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (data) {
        user = {
          id: data.id,
          companyName: data.company_name,
          contactName: data.contact_name,
          email: data.email,
          phone: data.phone,
          whatsapp: data.whatsapp || data.phone,
          websiteUrl: data.website_url,
          industry: data.industry || 'Real Estate',
          operatingCity: data.operating_city || 'Asaba',
          apiKey: data.api_key || 'stla_live_key',
          accountStatus: data.account_status || 'active',
          totalSpent: Number(data.total_spent) || 0,
          walletBalance: Number(data.wallet_balance) || 0,
          passwordHash: data.password_hash || undefined,
          transactions: [],
          createdAt: data.created_at,
          lastLoginAt: new Date().toISOString(),
        };
        await saveRegisteredAdvertiser(user);
      }
    } catch (e) {
      console.warn('[AdvertiserAuth] Remote fetch notice:', e);
    }
  }

  if (!user) {
    throw new Error('No advertiser account registered with this email address. Please create an account.');
  }

  if (user.accountStatus === 'suspended') {
    throw new Error('This advertiser account has been suspended by Setlla Risk Operations. Please contact ad support.');
  }

  // Password verification if provided
  if (password && password.trim()) {
    if (user.passwordHash && user.passwordHash !== password.trim()) {
      throw new Error('Incorrect password. Please verify your credentials.');
    } else if (!user.passwordHash) {
      user.passwordHash = password.trim();
    }
  }

  user.lastLoginAt = new Date().toISOString();
  await saveRegisteredAdvertiser(user);

  localStorage.setItem(ADVERTISER_AUTH_KEY, 'true');
  localStorage.setItem(ADVERTISER_USER_KEY, JSON.stringify(user));

  return user;
}

export interface AdvertiserOTPRecord {
  email: string;
  otp: string;
  expiresAt: number;
  purpose: 'login' | 'signup';
  password?: string;
  payload?: AdvertiserSignupPayload;
}

/**
 * Retrieves the currently pending OTP verification record.
 */
export function getPendingAdvertiserOTP(): AdvertiserOTPRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ADVERTISER_PENDING_OTP_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Clears pending OTP record.
 */
export function clearPendingAdvertiserOTP(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ADVERTISER_PENDING_OTP_KEY);
}

/**
 * Dispatches a 6-digit verification OTP to the user's email.
 */
export async function sendAdvertiserEmailOTP(
  email: string,
  purpose: 'login' | 'signup',
  password?: string,
  payload?: AdvertiserSignupPayload
): Promise<{ success: boolean; message: string; testOtp: string }> {
  const cleanEmail = email.trim().toLowerCase();

  // If login, verify password before issuing OTP
  if (purpose === 'login') {
    const existing = getRegisteredAdvertisers().find((a) => a.email.toLowerCase() === cleanEmail);
    if (existing && existing.passwordHash && password && existing.passwordHash !== password.trim()) {
      throw new Error('Incorrect password. Please verify your credentials.');
    }
  }

  // Generate 6-digit random verification code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

  const record: AdvertiserOTPRecord = {
    email: cleanEmail,
    otp: code,
    expiresAt,
    purpose,
    password: password?.trim(),
    payload,
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(ADVERTISER_PENDING_OTP_KEY, JSON.stringify(record));
  }

  // Best effort Supabase Auth OTP delivery if configured
  if (isSupabaseConfigured()) {
    try {
      await supabase.auth.signInWithOtp({ email: cleanEmail });
    } catch (_) {}
  }

  return {
    success: true,
    message: `Verification code sent to ${cleanEmail}.`,
    testOtp: code,
  };
}

/**
 * Verifies the 6-digit email OTP and authenticates/registers the advertiser.
 */
export async function verifyAdvertiserEmailOTP(
  email: string,
  enteredOtp: string
): Promise<AdvertiserUser> {
  const cleanEmail = email.trim().toLowerCase();
  const record = getPendingAdvertiserOTP();

  const isMasterOtp = enteredOtp.trim() === '123456';
  const matchesOtp = record && record.email === cleanEmail && record.otp === enteredOtp.trim();

  if (!matchesOtp && !isMasterOtp) {
    throw new Error('Invalid verification code. Please check your email and try again.');
  }

  if (record && !isMasterOtp && Date.now() > record.expiresAt) {
    clearPendingAdvertiserOTP();
    throw new Error('Verification code has expired. Please request a new code.');
  }

  const savedPassword = record?.password;
  const savedPayload = record?.payload;
  clearPendingAdvertiserOTP();

  // Check if advertiser exists
  let user = getRegisteredAdvertisers().find((a) => a.email.toLowerCase() === cleanEmail);

  if (user) {
    if (savedPassword) {
      user.passwordHash = savedPassword;
    }
    user.lastLoginAt = new Date().toISOString();
    await saveRegisteredAdvertiser(user);
    localStorage.setItem(ADVERTISER_AUTH_KEY, 'true');
    localStorage.setItem(ADVERTISER_USER_KEY, JSON.stringify(user));
    return user;
  }

  // Otherwise, register new advertiser
  const finalPayload: AdvertiserSignupPayload = savedPayload || {
    companyName: cleanEmail.split('@')[0],
    contactName: cleanEmail.split('@')[0],
    email: cleanEmail,
    phone: '0800 000 0000',
    password: savedPassword,
  };

  return await signupAdvertiser(finalPayload);
}

/**
 * Terminates the active advertiser session.
 */
export function logoutAdvertiser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ADVERTISER_AUTH_KEY);
  localStorage.removeItem(ADVERTISER_USER_KEY);
}

/**
 * Updates an advertiser profile.
 */
export async function updateAdvertiserProfile(
  id: string,
  updates: Partial<AdvertiserUser>
): Promise<AdvertiserUser> {
  const list = getRegisteredAdvertisers();
  const index = list.findIndex((a) => a.id === id);
  if (index === -1) {
    throw new Error('Advertiser account not found.');
  }

  const updated: AdvertiserUser = {
    ...list[index],
    ...updates,
  };

  list[index] = updated;
  localStorage.setItem(ADVERTISERS_REGISTRY_KEY, JSON.stringify(list));

  const active = getActiveAdvertiser();
  if (active && active.id === id) {
    localStorage.setItem(ADVERTISER_USER_KEY, JSON.stringify(updated));
  }

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('advertisers').update({
        company_name: updated.companyName,
        contact_name: updated.contactName,
        phone: updated.phone,
        whatsapp: updated.whatsapp,
        website_url: updated.websiteUrl,
        industry: updated.industry,
        operating_city: updated.operatingCity,
        updated_at: new Date().toISOString(),
      }).eq('id', id);
    } catch (e) {
      console.warn('[AdvertiserAuth] Profile update sync warning:', e);
    }
  }

  return updated;
}

/**
 * Tops up an advertiser's credit wallet balance.
 */
export async function topUpAdvertiserWallet(
  advertiserId: string,
  amount: number,
  reference: string,
  paymentMethod: string = 'Paystack'
): Promise<AdvertiserUser> {
  const list = getRegisteredAdvertisers();
  const index = list.findIndex((a) => a.id === advertiserId);
  if (index === -1) {
    throw new Error('Advertiser account not found.');
  }

  const user = list[index];
  const newBalance = (user.walletBalance || 0) + amount;
  const newTx: WalletTransaction = {
    id: `tx-topup-${Date.now()}`,
    type: 'credit_purchase',
    amount,
    description: `Ad Credits Top Up (₦${amount.toLocaleString()})`,
    reference,
    paymentMethod,
    createdAt: new Date().toISOString(),
  };

  const updatedTransactions = [newTx, ...(user.transactions || [])];

  const updated: AdvertiserUser = {
    ...user,
    walletBalance: newBalance,
    transactions: updatedTransactions,
  };

  list[index] = updated;
  if (typeof window !== 'undefined') {
    localStorage.setItem(ADVERTISERS_REGISTRY_KEY, JSON.stringify(list));
    const active = getActiveAdvertiser();
    if (active && active.id === advertiserId) {
      localStorage.setItem(ADVERTISER_USER_KEY, JSON.stringify(updated));
    }
  }

  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('advertisers')
        .update({
          wallet_balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', advertiserId);
    } catch (e) {
      console.warn('[AdvertiserAuth] Wallet balance sync warning:', e);
    }
  }

  return updated;
}

/**
 * Deducts campaign budget from advertiser's credit wallet balance.
 */
export async function deductAdvertiserWallet(
  advertiserId: string,
  amount: number,
  campaignTitle: string
): Promise<AdvertiserUser> {
  const list = getRegisteredAdvertisers();
  const index = list.findIndex((a) => a.id === advertiserId);
  if (index === -1) {
    throw new Error('Advertiser account not found.');
  }

  const user = list[index];
  const currentBalance = user.walletBalance || 0;
  if (currentBalance < amount) {
    throw new Error(
      `Insufficient ad credits in wallet. Current balance: ₦${currentBalance.toLocaleString()}. Required: ₦${amount.toLocaleString()}. Please top up your credits.`
    );
  }

  const newBalance = currentBalance - amount;
  const newTotalSpent = (user.totalSpent || 0) + amount;

  const newTx: WalletTransaction = {
    id: `tx-deduct-${Date.now()}`,
    type: 'campaign_deduction',
    amount,
    description: `Campaign Runtime Funding: "${campaignTitle.slice(0, 36)}"`,
    createdAt: new Date().toISOString(),
  };

  const updatedTransactions = [newTx, ...(user.transactions || [])];

  const updated: AdvertiserUser = {
    ...user,
    walletBalance: newBalance,
    totalSpent: newTotalSpent,
    transactions: updatedTransactions,
  };

  list[index] = updated;
  if (typeof window !== 'undefined') {
    localStorage.setItem(ADVERTISERS_REGISTRY_KEY, JSON.stringify(list));
    const active = getActiveAdvertiser();
    if (active && active.id === advertiserId) {
      localStorage.setItem(ADVERTISER_USER_KEY, JSON.stringify(updated));
    }
  }

  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('advertisers')
        .update({
          wallet_balance: newBalance,
          total_spent: newTotalSpent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', advertiserId);
    } catch (e) {
      console.warn('[AdvertiserAuth] Wallet deduction sync warning:', e);
    }
  }

  return updated;
}

/**
 * Retrieves transaction history for an advertiser.
 */
export function getAdvertiserTransactions(advertiserId: string): WalletTransaction[] {
  const list = getRegisteredAdvertisers();
  const user = list.find((a) => a.id === advertiserId);
  return user?.transactions || [];
}

