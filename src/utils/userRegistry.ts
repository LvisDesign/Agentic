import { UserProfile, BookingRecord } from '../types/marketplace';
import { isLocalUrl } from './environment';
import { supabase, isSupabaseConfigured, getSupabaseClient } from './supabaseClient';
import { broadcastRealtimeEvent } from '../services/realtimeSync';

// Clean production registry (strictly real registered accounts from database/local session)
export const DEFAULT_REGISTERED_USERS: UserProfile[] = [];

const STORAGE_KEY = 'setlla_registered_users';
const LEGACY_STORAGE_KEY = 'deltarent_registered_users';

/**
 * Normalizes Nigerian mobile phone numbers for robust, format-agnostic comparison.
 * Handles formats like:
 *   "0803 891 0293" -> "08038910293"
 *   "+234 803 891 0293" -> "08038910293"
 *   "2348038910293" -> "08038910293"
 *   "0803-891-0293" -> "08038910293"
 *   "8038910293" -> "08038910293"
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.trim().replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+234')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (cleaned.startsWith('234') && cleaned.length >= 13) {
    cleaned = '0' + cleaned.slice(3);
  }

  // Remove any remaining non-digit symbols
  cleaned = cleaned.replace(/\D/g, '');

  // If user entered 10 digits without leading zero (e.g. "8038910293"), add leading "0"
  if (cleaned.length === 10 && (cleaned.startsWith('7') || cleaned.startsWith('8') || cleaned.startsWith('9'))) {
    cleaned = '0' + cleaned;
  }

  return cleaned;
}

/**
 * Normalizes email address for case-insensitive comparison.
 */
export function normalizeEmail(email?: string): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

const DELETED_USERS_STORAGE_KEY = 'setlla_deleted_user_ids';
const LEGACY_DELETED_USERS_STORAGE_KEY = 'deltarent_deleted_user_ids';

/**
 * Returns a Set of user IDs that were explicitly deleted by the Super Administrator.
 */
export function getDeletedUserIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(DELETED_USERS_STORAGE_KEY) || localStorage.getItem(LEGACY_DELETED_USERS_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch (_) {}
  return new Set();
}

/**
 * Records a deleted user ID so that explicitly deleted users do not resurface.
 */
export function recordDeletedUserId(id: string): void {
  if (typeof window === 'undefined' || !id) return;
  try {
    const set = getDeletedUserIds();
    set.add(id);
    localStorage.setItem(DELETED_USERS_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch (_) {}
}

/**
 * Retrieves all registered users from storage and defaults.
 * Provides all available registered agents, tenants, and platform administrators.
 */
export function getRegisteredUsers(): UserProfile[] {
  if (typeof window === 'undefined') return DEFAULT_REGISTERED_USERS;

  const deletedIds = getDeletedUserIds();
  const usersMap = new Map<string, UserProfile>();

  // 1. Seed all default registered agents, tenants, and administrators
  DEFAULT_REGISTERED_USERS.forEach((user) => {
    if (!deletedIds.has(user.id)) {
      usersMap.set(user.id, user);
    }
  });

  // 2. Load from localStorage registered users registry
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      const parsed: UserProfile[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((user) => {
          if (user && user.id && !deletedIds.has(user.id)) {
            usersMap.set(user.id, user);
          }
        });
      }
    }
  } catch (err) {
    console.warn('[UserRegistry] Failed to parse registered users:', err);
  }

  // 3. Include currently active user from setlla_user / deltarent_user if present
  try {
    const rawCurrent = localStorage.getItem('setlla_user') || localStorage.getItem('deltarent_user');
    if (rawCurrent) {
      const current: UserProfile = JSON.parse(rawCurrent);
      if (current && current.id && current.id !== 'GUEST_USER' && current.id !== 'DT-USR-GUEST' && !deletedIds.has(current.id)) {
        usersMap.set(current.id, current);
      }
    }
  } catch (err) {
    // ignore
  }

  return Array.from(usersMap.values());
}


/**
 * Maps a raw Supabase platform_users database record into a clean UserProfile object.
 */
export function mapDbToUserProfile(row: any): UserProfile {
  return {
    id: row.id,
    fullName: row.full_name || '',
    email: row.email || undefined,
    password: row.password || undefined,
    phone: row.phone || '',
    state: row.state || 'Delta State',
    city: row.city || 'Asaba',
    preferredPropertyType: row.preferred_property_type || undefined,
    budget: row.budget !== null && row.budget !== undefined ? Number(row.budget) : undefined,
    nin: row.nin || undefined,
    isVerifiedTenant: Boolean(row.is_verified_tenant),
    avatarUrl: row.avatar_url || undefined,
    isAgent: Boolean(row.is_agent),
    agencyName: row.agency_name || undefined,
    cacNumber: row.cac_number || undefined,
    whatsapp: row.whatsapp || undefined,
    operatingState: row.operating_state || row.state || 'Delta State',
    operatingCity: row.operating_city || row.city || 'Asaba',
    agentType: row.agent_type || (row.is_agent ? 'agency' : undefined),
    savedListingIds: Array.isArray(row.saved_listing_ids) ? row.saved_listing_ids : [],
    isAdmin: Boolean(row.is_admin),
    isSuperAdmin: Boolean(row.is_super_admin),
    isDemoAdmin: false,
    isSuspended: Boolean(row.is_suspended),
    suspensionReason: row.suspension_reason || undefined,
    kycStatus: row.kyc_status || 'not_submitted',
    kycDocuments: row.kyc_documents && typeof row.kyc_documents === 'object' ? row.kyc_documents : undefined,
    createdAt: row.created_at || new Date().toISOString(),
    lastProfileEditAt: row.last_profile_edit_at || undefined,
    persona: row.persona || row.role || (row.is_agent ? 'lister' : 'tenant'),
    cvUrl: row.cv_url || undefined,
    cvFileName: row.cv_file_name || undefined,
    targetRole: row.target_role || row.preferred_property_type || undefined,
    companyName: row.company_name || row.agency_name || undefined,
  };
}

/**
 * Maps a UserProfile object into a Supabase platform_users database record format.
 */
export function mapUserProfileToDb(user: UserProfile): Record<string, any> {
  const resolvedRole = user.persona || (user.isAgent ? 'lister' : 'tenant');
  return {
    id: user.id,
    full_name: user.fullName,
    phone: user.phone,
    email: user.email || null,
    password: user.password || null,
    state: user.state || 'Delta State',
    city: user.city || 'Asaba',
    preferred_property_type: user.preferredPropertyType || null,
    budget: user.budget ?? 0,
    nin: user.nin || null,
    is_verified_tenant: Boolean(user.isVerifiedTenant),
    avatar_url: user.avatarUrl || null,
    is_agent: Boolean(user.isAgent),
    agency_name: user.agencyName || user.companyName || null,
    cac_number: user.cacNumber || null,
    whatsapp: user.whatsapp || null,
    operating_state: user.operatingState || user.state || 'Delta State',
    operating_city: user.operatingCity || user.city || 'Asaba',
    agent_type: user.agentType || (user.isAgent ? 'agency' : null),
    saved_listing_ids: Array.isArray(user.savedListingIds) ? user.savedListingIds : [],
    is_admin: Boolean(user.isAdmin),
    is_super_admin: Boolean(user.isSuperAdmin),
    is_suspended: Boolean(user.isSuspended),
    suspension_reason: user.suspensionReason || null,
    kyc_status: user.kycStatus || 'not_submitted',
    kyc_documents: user.kycDocuments || {},
    created_at: user.createdAt || new Date().toISOString(),
    last_profile_edit_at: user.lastProfileEditAt || null,
    persona: resolvedRole,
    role: resolvedRole,
    cv_url: user.cvUrl || null,
    cv_file_name: user.cvFileName || null,
    target_role: user.targetRole || null,
    company_name: user.companyName || user.agencyName || null,
    updated_at: new Date().toISOString(),
  };
}

export type PlatformUserPersona = 'agent' | 'tenant' | 'job_seeker' | 'employer' | 'advertiser' | 'admin';

/**
 * Resolves a UserProfile to its unambiguous platform persona for filtering and administration.
 */
export function resolveUserPersona(
  user: UserProfile,
  hasActiveListings?: boolean,
  hasPostedJobs?: boolean,
  hasActiveAdverts?: boolean
): PlatformUserPersona {
  if (user.isAdmin || user.isSuperAdmin) return 'admin';
  if (user.persona === 'job_seeker' || Boolean(user.cvUrl) || Boolean(user.cvFileName)) return 'job_seeker';
  if (user.persona === 'employer' || hasPostedJobs) return 'employer';
  if (user.persona === 'partner' || user.persona === 'advertiser' || hasActiveAdverts) return 'advertiser';
  if (user.isAgent || user.persona === 'lister' || Boolean(user.cacNumber) || hasActiveListings) return 'agent';
  return 'tenant';
}

/**
 * Fetches all registered users from the shared Supabase database.
 * Syncs the local storage cache so that accounts created on mobile or web correlate automatically.
 */
export async function fetchRegisteredUsersFromDb(): Promise<UserProfile[]> {
  const deletedIds = getDeletedUserIds();
  const localUsers = getRegisteredUsers();

  if (!isSupabaseConfigured()) {
    return localUsers;
  }

  try {
    const client = getSupabaseClient();
    if (!client) return localUsers;

    const { data, error } = await client
      .from('platform_users')
      .select('*')
      .order('created_at', { ascending: false });

    // When Supabase responds successfully, its data is the single source of truth
    if (!error && Array.isArray(data)) {
      const dbUsersMap = new Map<string, UserProfile>();

      data.forEach((row) => {
        const u = mapDbToUserProfile(row);
        if (u && u.id && !deletedIds.has(u.id)) {
          dbUsersMap.set(u.id, u);
        }
      });

      // Auto-harvest live agents ONLY from verified 'Available' listings in Supabase
      try {
        const { data: listingRows } = await client
          .from('listings')
          .select('id, title, agent, city, state, availability_status')
          .eq('availability_status', 'Available');

        if (Array.isArray(listingRows)) {
          listingRows.forEach((row: any) => {
            const agent = row.agent;
            if (agent && (agent.fullName || agent.name || agent.phone)) {
              const rawPhone = agent.phone || '';
              const phone = rawPhone.trim();
              const id = agent.id || (phone ? `DT-AGT-${normalizePhoneNumber(phone).slice(-4)}` : `agent-${row.id}`);
              if (!deletedIds.has(id)) {
                const existing = dbUsersMap.get(id);
                if (existing) {
                  existing.isAgent = true;
                  existing.agentType = 'agency';
                  if (agent.agencyName) existing.agencyName = agent.agencyName;
                  if (agent.fullName) existing.fullName = agent.fullName;
                  dbUsersMap.set(existing.id, existing);
                }
              }
            }
          });
        }
      } catch (e) {}

      const cleanList = Array.from(dbUsersMap.values());
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanList));
      } catch (_) {}

      return cleanList;
    }
  } catch (err) {
    console.warn('[UserRegistry] Network error fetching platform users:', err);
  }

  return localUsers;
}

/**
 * Saves a new or updated user profile to the registry AND automatically
 * synchronizes to the shared Supabase database so all accounts correlate across
 * mobile, desktop, and all screens automatically.
 */
export function saveRegisteredUser(user: UserProfile): void {
  if (typeof window === 'undefined' || !user) return;

  const allUsers = getRegisteredUsers();
  const existingIndex = allUsers.findIndex(
    (u) =>
      u.id === user.id ||
      (user.phone && normalizePhoneNumber(u.phone) === normalizePhoneNumber(user.phone)) ||
      (user.email && u.email && normalizeEmail(u.email) === normalizeEmail(user.email))
  );

  if (existingIndex >= 0) {
    allUsers[existingIndex] = { 
      ...allUsers[existingIndex], 
      ...user,
      ...(user.isAgent ? { isAgent: true, isVerifiedTenant: false } : {})
    };
  } else {
    allUsers.push(user);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allUsers));
  } catch (err) {
    console.error('[UserRegistry] Failed to save user to registry:', err);
  }

  // Synchronize to central Supabase platform_users table
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      const dbRow = mapUserProfileToDb(user);
      Promise.resolve(client.from('platform_users').upsert(dbRow, { onConflict: 'id' }))
        .then(async (res: any) => {
          if (res?.error) {
            // Fallback retry with core columns if extra columns caused the failure
            const { avatar_url, saved_listing_ids, last_profile_edit_at, password, ...coreDbRow } = dbRow;
            const retryRes = await client.from('platform_users').upsert(coreDbRow, { onConflict: 'id' });
            if (!retryRes?.error) {
              broadcastRealtimeEvent('USER_REGISTERED', { user });
            } else {
              console.warn('[UserRegistry] Supabase platform_users sync notice:', res.error.message);
            }
          } else {
            broadcastRealtimeEvent('USER_REGISTERED', { user });
          }
        })
        .catch((err: any) => {
          console.warn('[UserRegistry] Network error syncing user to DB:', err);
        });

      // Synchronize to Supabase `profiles` table (profiles.role)
      const resolvedRole = user.persona || (user.isAgent ? 'lister' : 'tenant');
      Promise.resolve(client.from('profiles').upsert({
        id: user.id,
        role: resolvedRole,
        full_name: user.fullName,
        phone: user.phone,
        email: user.email || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })).catch(() => {});
    }
  }
}

/**
 * Async version of saveRegisteredUser that waits for database confirmation.
 */
export async function saveRegisteredUserAsync(user: UserProfile): Promise<boolean> {
  saveRegisteredUser(user);
  if (!isSupabaseConfigured()) return true;

  try {
    const client = getSupabaseClient();
    if (!client) return true;
    const dbRow = mapUserProfileToDb(user);
    const { error } = await client.from('platform_users').upsert(dbRow, { onConflict: 'id' });
    if (!error) {
      broadcastRealtimeEvent('USER_REGISTERED', { user });
      return true;
    } else {
      // Retry with core columns if extra columns don't exist in Supabase
      const { avatar_url, saved_listing_ids, last_profile_edit_at, password, ...coreDbRow } = dbRow;
      const retryRes = await client.from('platform_users').upsert(coreDbRow, { onConflict: 'id' });
      if (!retryRes.error) {
        broadcastRealtimeEvent('USER_REGISTERED', { user });
        return true;
      }
    }
  } catch (e) {
    console.warn('[UserRegistry] Async user save error:', e);
  }
  return false;
}

/**
 * Super Admin function: forces an update to any user record in the registry and database.
 */
export function adminUpdateUser(user: UserProfile): void {
  if (typeof window === 'undefined' || !user) return;
  const allUsers = getRegisteredUsers();
  const existingIndex = allUsers.findIndex((u) => u.id === user.id);
  if (existingIndex >= 0) {
    allUsers[existingIndex] = { ...allUsers[existingIndex], ...user };
  } else {
    allUsers.push(user);
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allUsers));
  } catch (err) {
    console.error('[UserRegistry] Failed to admin update user:', err);
  }

  // Sync to database
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      const dbRow = mapUserProfileToDb(user);
      Promise.resolve(client.from('platform_users').upsert(dbRow, { onConflict: 'id' }))
        .then((res: any) => {
          if (res?.error) {
            console.warn('[UserRegistry] Supabase admin update error:', res.error.message);
          } else {
            broadcastRealtimeEvent('USER_UPDATED', { user });
          }
        })
        .catch(() => {});
    }
  }
}

/**
 * Super Admin function: removes a user from the registry and central database.
 */
export function deleteUserFromRegistry(userId: string): void {
  if (typeof window === 'undefined' || !userId) return;
  recordDeletedUserId(userId);
  const allUsers = getRegisteredUsers().filter((u) => u.id !== userId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allUsers));
  } catch (err) {
    console.error('[UserRegistry] Failed to delete user from registry:', err);
  }

  // Delete from Supabase platform_users
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      Promise.resolve(client.from('platform_users').delete().eq('id', userId))
        .then((res: any) => {
          if (res?.error) {
            console.warn('[UserRegistry] Supabase delete user error:', res.error.message);
          }
        })
        .catch(() => {});
    }
  }
}



export interface DuplicateCheckResult {
  exists: boolean;
  reason?: 'phone' | 'email' | 'both';
  field?: 'phone' | 'email' | 'both';
  message?: string;
  matchedUser?: UserProfile;
}

/**
 * Checks whether an account already exists with the given phone number or email address in local storage.
 * Excludes the currently signed-in user's own ID if specified.
 */
export function checkUserExists(
  phone: string,
  email?: string,
  excludeUserId?: string
): DuplicateCheckResult {
  const normPhone = normalizePhoneNumber(phone);
  const normEmail = normalizeEmail(email);

  if (!normPhone && !normEmail) {
    return { exists: false };
  }

  const registeredUsers = getRegisteredUsers();

  for (const user of registeredUsers) {
    if (excludeUserId && user.id === excludeUserId) {
      continue;
    }

    const userNormPhone = normalizePhoneNumber(user.phone);
    const userNormEmail = normalizeEmail(user.email);

    const phoneMatches = Boolean(normPhone && userNormPhone && normPhone === userNormPhone);
    const emailMatches = Boolean(normEmail && userNormEmail && normEmail === userNormEmail);

    if (phoneMatches && emailMatches) {
      return {
        exists: true,
        reason: 'both',
        field: 'both',
        message: `An account with phone number "${phone}" and email "${email}" already exists.`,
        matchedUser: user,
      };
    }

    if (phoneMatches) {
      return {
        exists: true,
        reason: 'phone',
        field: 'phone',
        message: `An account with phone number "${phone}" already exists.`,
        matchedUser: user,
      };
    }

    if (emailMatches) {
      return {
        exists: true,
        reason: 'email',
        field: 'email',
        message: `An account with email "${email}" already exists.`,
        matchedUser: user,
      };
    }
  }

  return { exists: false };
}

/**
 * Asynchronously checks whether an account already exists with the given phone number or email,
 * inspecting both local cache and the central Supabase database across all devices.
 */
export async function checkUserExistsAsync(
  phone: string,
  email?: string,
  excludeUserId?: string
): Promise<DuplicateCheckResult> {
  // First check local cache
  const localCheck = checkUserExists(phone, email, excludeUserId);
  if (localCheck.exists) {
    return localCheck;
  }

  if (!isSupabaseConfigured()) {
    return { exists: false };
  }

  const normPhone = normalizePhoneNumber(phone);
  const normEmail = normalizeEmail(email);
  const last10 = normPhone.slice(-10);

  try {
    const client = getSupabaseClient();
    if (!client) return { exists: false };

    let queryBuilder = client.from('platform_users').select('*');
    const filters: string[] = [];

    if (last10.length >= 7) {
      filters.push(`phone.ilike.%${last10}%`);
    } else if (phone && phone.trim()) {
      filters.push(`phone.eq.${phone.trim()}`);
    }

    if (normEmail) {
      filters.push(`email.ilike.${normEmail}`);
    }

    if (filters.length > 0) {
      const { data, error } = await queryBuilder.or(filters.join(','));
      if (!error && Array.isArray(data)) {
        for (const row of data) {
          if (excludeUserId && row.id === excludeUserId) continue;

          const user = mapDbToUserProfile(row);
          const userNormPhone = normalizePhoneNumber(user.phone);
          const userNormEmail = normalizeEmail(user.email);

          const phoneMatches = Boolean(
            normPhone && userNormPhone &&
            (normPhone === userNormPhone || (last10.length >= 7 && userNormPhone.slice(-10) === last10))
          );
          const emailMatches = Boolean(normEmail && userNormEmail && normEmail === userNormEmail);

          if (phoneMatches && emailMatches) {
            return {
              exists: true,
              reason: 'both',
              field: 'both',
              message: `An account with phone number "${phone}" and email "${email}" already exists.`,
              matchedUser: user,
            };
          }

          if (phoneMatches) {
            return {
              exists: true,
              reason: 'phone',
              field: 'phone',
              message: `An account with phone number "${phone}" already exists.`,
              matchedUser: user,
            };
          }

          if (emailMatches) {
            return {
              exists: true,
              reason: 'email',
              field: 'email',
              message: `An account with email "${email}" already exists.`,
              matchedUser: user,
            };
          }
        }
      }
    }
  } catch (err) {
    console.warn('[UserRegistry] Exception during checkUserExistsAsync:', err);
  }

  return { exists: false };
}

/**
 * Finds a registered user by phone or email query in local cache.
 */
export function findUserByCredential(query: string): UserProfile | null {
  if (!query || !query.trim()) return null;
  const trimmed = query.trim();
  const isEmailQuery = trimmed.includes('@');
  const normPhone = normalizePhoneNumber(trimmed);
  const normEmail = normalizeEmail(trimmed);
  const last10 = normPhone.slice(-10);

  const registeredUsers = getRegisteredUsers();

  for (const user of registeredUsers) {
    if (isEmailQuery) {
      if (normalizeEmail(user.email) === normEmail) {
        return user;
      }
    } else {
      const uPhone = normalizePhoneNumber(user.phone);
      if (uPhone === normPhone || (last10.length >= 7 && uPhone.slice(-10) === last10)) {
        return user;
      }
    }
  }

  return null;
}

/**
 * Asynchronously finds a user by credential (phone or email) querying both
 * local storage and the shared Supabase database.
 * This guarantees that an account created on Web/Desktop is instantly recognized
 * on Mobile devices and vice versa.
 */
export async function findUserByCredentialAsync(query: string): Promise<UserProfile | null> {
  if (!query || !query.trim()) return null;
  const trimmed = query.trim();

  // 1. Check local cache first
  const localMatch = findUserByCredential(trimmed);
  if (localMatch) {
    return localMatch;
  }

  // 2. Query Supabase database
  if (!isSupabaseConfigured()) {
    return null;
  }

  const client = getSupabaseClient();
  if (!client) return null;

  const isEmail = trimmed.includes('@');
  const normPhone = normalizePhoneNumber(trimmed);
  const normEmail = normalizeEmail(trimmed);
  const last10 = normPhone.slice(-10);

  try {
    let queryBuilder = client.from('platform_users').select('*');

    if (isEmail) {
      queryBuilder = queryBuilder.ilike('email', normEmail);
    } else if (last10.length >= 7) {
      queryBuilder = queryBuilder.or(`phone.ilike.%${last10}%,phone.eq.${trimmed}`);
    } else {
      queryBuilder = queryBuilder.eq('phone', trimmed);
    }

    const { data, error } = await queryBuilder;

    if (!error && Array.isArray(data) && data.length > 0) {
      for (const row of data) {
        const user = mapDbToUserProfile(row);
        if (isEmail) {
          if (user.email && normalizeEmail(user.email) === normEmail) {
            saveRegisteredUser(user);
            return user;
          }
        } else {
          const uPhone = normalizePhoneNumber(user.phone);
          if (uPhone === normPhone || (last10.length >= 7 && uPhone.slice(-10) === last10)) {
            saveRegisteredUser(user);
            return user;
          }
        }
      }
    }

    // 3. Fallback: Fetch latest users from DB if targeted indexed query returned no hit
    const allDbUsers = await fetchRegisteredUsersFromDb();
    for (const user of allDbUsers) {
      if (isEmail) {
        if (user.email && normalizeEmail(user.email) === normEmail) {
          return user;
        }
      } else {
        const uPhone = normalizePhoneNumber(user.phone);
        if (uPhone === normPhone || (last10.length >= 7 && uPhone.slice(-10) === last10)) {
          return user;
        }
      }
    }
  } catch (err) {
    console.warn('[UserRegistry] Exception during findUserByCredentialAsync:', err);
  }

  return null;
}


const MY_BOOKINGS_STORAGE_KEY = 'setlla_my_booking_ids';
const LEGACY_MY_BOOKINGS_STORAGE_KEY = 'deltarent_my_booking_ids';

/**
 * Returns a Set of booking IDs explicitly created on this browser / device.
 */
export function getMyDeviceBookingIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(MY_BOOKINGS_STORAGE_KEY) || localStorage.getItem(LEGACY_MY_BOOKINGS_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch (_) {}
  return new Set();
}

/**
 * Records a booking ID created on this browser / device.
 */
export function recordMyDeviceBookingId(id: string): void {
  if (typeof window === 'undefined' || !id) return;
  try {
    const set = getMyDeviceBookingIds();
    set.add(id);
    localStorage.setItem(MY_BOOKINGS_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch (_) {}
}

/**
 * Clears all recorded device booking IDs (e.g. on logout).
 */
export function clearMyDeviceBookingIds(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(MY_BOOKINGS_STORAGE_KEY);
    localStorage.removeItem(LEGACY_MY_BOOKINGS_STORAGE_KEY);
  } catch (_) {}
}

const NOTIFIED_BOOKINGS_STORAGE_KEY = 'setlla_notified_confirmed_bookings';
const LEGACY_NOTIFIED_BOOKINGS_STORAGE_KEY = 'deltarent_notified_confirmed_bookings';

/**
 * Returns a Set of confirmed booking IDs that have already triggered a notification to the tenant.
 */
export function getNotifiedBookingIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(NOTIFIED_BOOKINGS_STORAGE_KEY) || localStorage.getItem(LEGACY_NOTIFIED_BOOKINGS_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch (_) {}
  return new Set();
}

/**
 * Marks a confirmed booking ID as notified.
 */
export function recordNotifiedBookingId(id: string): void {
  if (typeof window === 'undefined' || !id) return;
  try {
    const set = getNotifiedBookingIds();
    set.add(id);
    localStorage.setItem(NOTIFIED_BOOKINGS_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch (_) {}
}

const NOTIFIED_DECLINED_STORAGE_KEY = 'setlla_notified_declined_bookings';
const LEGACY_NOTIFIED_DECLINED_STORAGE_KEY = 'deltarent_notified_declined_bookings';

/**
 * Returns a Set of declined booking IDs that have already triggered a notification to the tenant.
 */
export function getNotifiedDeclinedBookingIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(NOTIFIED_DECLINED_STORAGE_KEY) || localStorage.getItem(LEGACY_NOTIFIED_DECLINED_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch (_) {}
  return new Set();
}

/**
 * Marks a declined booking ID as notified.
 */
export function recordNotifiedDeclinedBookingId(id: string): void {
  if (typeof window === 'undefined' || !id) return;
  try {
    const set = getNotifiedDeclinedBookingIds();
    set.add(id);
    localStorage.setItem(NOTIFIED_DECLINED_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch (_) {}
}

const NOTIFIED_AGENT_REQUESTS_STORAGE_KEY = 'setlla_notified_agent_requests';
const LEGACY_NOTIFIED_AGENT_REQUESTS_STORAGE_KEY = 'deltarent_notified_agent_requests';

/**
 * Returns a Set of incoming booking request IDs that have already triggered an alert to the agent.
 */
export function getNotifiedAgentBookingIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(NOTIFIED_AGENT_REQUESTS_STORAGE_KEY) || localStorage.getItem(LEGACY_NOTIFIED_AGENT_REQUESTS_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch (_) {}
  return new Set();
}

/**
 * Marks an incoming booking request ID as notified for the agent.
 */
export function recordNotifiedAgentBookingId(id: string): void {
  if (typeof window === 'undefined' || !id) return;
  try {
    const set = getNotifiedAgentBookingIds();
    set.add(id);
    localStorage.setItem(NOTIFIED_AGENT_REQUESTS_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch (_) {}
}



/**
 * Determines whether a given booking belongs strictly to the specified user/tenant.
 * Ensures strict user isolation so that approval or booking of one tenant never affects
 * or displays on another tenant's screen.
 */
export function isBookingForUser(
  b: BookingRecord,
  user: UserProfile | null | undefined,
  myDeviceBookingIds?: Set<string>
): boolean {
  if (!b) return false;

  const hasUserIdentity = Boolean(
    user && (user.phone || user.email || (user.fullName && user.fullName !== 'Guest User'))
  );

  // If user is authenticated / has an identity
  if (hasUserIdentity && user) {
    const normUserPhone = normalizePhoneNumber(user.phone || '');
    const normBookingPhone = normalizePhoneNumber(b.applicantPhone || '');

    const normUserEmail = normalizeEmail(user.email);
    const normBookingEmail = normalizeEmail(b.applicantEmail);

    const normUserName = (user.fullName || '').trim().toLowerCase();
    const normBookingName = (b.applicantName || '').trim().toLowerCase();

    // 1. Phone match: definitive identifier
    if (normUserPhone && normBookingPhone) {
      if (normUserPhone === normBookingPhone || normUserPhone.slice(-10) === normBookingPhone.slice(-10)) {
        return true;
      }
      // If both have phone numbers and they don't match, this booking strictly belongs to someone else!
      return false;
    }

    // 2. Email match: definitive identifier
    if (normUserEmail && normBookingEmail) {
      if (normUserEmail === normBookingEmail) {
        return true;
      }
      // If both have emails and they don't match, this booking strictly belongs to someone else!
      return false;
    }

    // 3. Name match: if names are specific and match
    if (normUserName && normBookingName && normUserName !== 'guest user' && normUserName.length > 3) {
      if (normUserName === normBookingName) {
        return true;
      }
      // If booking name is distinct and completely doesn't match
      if (normBookingName !== 'applicant' && normBookingName.length > 3 && !normBookingName.includes(normUserName) && !normUserName.includes(normBookingName)) {
        return false;
      }
    }

    // 4. Fallback to device booking ID only if booking has no contradictory contact info
    if (myDeviceBookingIds && myDeviceBookingIds.has(b.id)) {
      return true;
    }

    return false;
  }

  // If user is a Guest / unauthenticated visitor:
  // Only match bookings created on this specific device
  if (myDeviceBookingIds && myDeviceBookingIds.has(b.id)) {
    return true;
  }

  return false;
}


