import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import { createPartnerApiKey, getPartnerApiKeys } from './adService';

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

// Seed Corporate Advertiser for initial testing
const SEED_ADVERTISER: AdvertiserUser = {
  id: 'adv-asaba-solar-01',
  companyName: 'Asaba Solar & Power Solutions Ltd',
  contactName: 'Engr. Emeka Nwosu',
  email: 'partners@asabasolar.ng',
  phone: '0803 112 2334',
  whatsapp: '08031122334',
  websiteUrl: 'https://asabasolar.ng',
  industry: 'Clean Energy & Solar Power',
  operatingCity: 'Asaba',
  apiKey: 'stla_live_8f39a01b92c44de88a912bf7',
  accountStatus: 'active',
  totalSpent: 45000,
  createdAt: '2026-10-15T10:00:00.000Z',
  lastLoginAt: new Date().toISOString(),
};

/**
 * Retrieves all registered advertisers from local storage.
 */
export function getRegisteredAdvertisers(): AdvertiserUser[] {
  if (typeof window === 'undefined') return [SEED_ADVERTISER];
  try {
    const raw = localStorage.getItem(ADVERTISERS_REGISTRY_KEY);
    if (raw) {
      const parsed: AdvertiserUser[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (!parsed.some((a) => a.email.toLowerCase() === SEED_ADVERTISER.email.toLowerCase())) {
          return [SEED_ADVERTISER, ...parsed];
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[AdvertiserAuth] Failed to parse advertisers:', e);
  }
  return [SEED_ADVERTISER];
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

  // Sync to Supabase
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
          updated_at: new Date().toISOString(),
          last_login_at: advertiser.lastLoginAt || new Date().toISOString(),
        },
        { onConflict: 'email' }
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
    return JSON.parse(raw);
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
export async function loginAdvertiser(email: string, _password?: string): Promise<AdvertiserUser> {
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

  user.lastLoginAt = new Date().toISOString();
  await saveRegisteredAdvertiser(user);

  localStorage.setItem(ADVERTISER_AUTH_KEY, 'true');
  localStorage.setItem(ADVERTISER_USER_KEY, JSON.stringify(user));

  return user;
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
