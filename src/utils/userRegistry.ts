import { UserProfile, BookingRecord } from '../types/marketplace';
import { isLocalUrl } from './environment';
import { supabase, isSupabaseConfigured, getSupabaseClient } from './supabaseClient';
import { broadcastRealtimeEvent } from '../services/realtimeSync';
import { sendAccountDeletionEmail } from '../services/accountDeletionEmailService';

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
const DELETED_PHONES_STORAGE_KEY = 'setlla_deleted_user_phones';
const DELETED_EMAILS_STORAGE_KEY = 'setlla_deleted_user_emails';

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

export function getDeletedPhones(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(DELETED_PHONES_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch (_) {}
  return new Set();
}

export function getDeletedEmails(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(DELETED_EMAILS_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch (_) {}
  return new Set();
}

/**
 * Records deleted user identifiers (ID, phone, email) in local storage and optionally cloud tombstones
 * so they never resurface on admin dashboards or via stale background tab syncs.
 */
export function recordDeletedUser(
  user: { id?: string; phone?: string; email?: string },
  syncToCloud: boolean = true
): void {
  if (typeof window === 'undefined' || !user) return;
  const cloudTombstoneIds: string[] = [];
  try {
    if (user.id) {
      const cleanId = user.id.trim();
      if (cleanId) {
        const ids = getDeletedUserIds();
        ids.add(cleanId);
        localStorage.setItem(DELETED_USERS_STORAGE_KEY, JSON.stringify(Array.from(ids)));
        cloudTombstoneIds.push(`usr_id:${cleanId}`);
      }
    }
    const normPhone = user.phone ? normalizePhoneNumber(user.phone) : '';
    if (normPhone) {
      const phones = getDeletedPhones();
      phones.add(normPhone);
      const last10 = normPhone.slice(-10);
      if (last10.length === 10) {
        phones.add(`0${last10}`);
      }
      localStorage.setItem(DELETED_PHONES_STORAGE_KEY, JSON.stringify(Array.from(phones)));
      cloudTombstoneIds.push(`usr_phone:${normPhone}`);
      if (last10.length === 10) {
        cloudTombstoneIds.push(`usr_phone:0${last10}`);
      }
    }
    const normEmail = user.email ? normalizeEmail(user.email) : '';
    if (normEmail) {
      const emails = getDeletedEmails();
      emails.add(normEmail);
      localStorage.setItem(DELETED_EMAILS_STORAGE_KEY, JSON.stringify(Array.from(emails)));
      cloudTombstoneIds.push(`usr_email:${normEmail}`);
    }
  } catch (_) {}

  if (syncToCloud && cloudTombstoneIds.length > 0 && isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      if (client) {
        const now = new Date().toISOString();
        const rows = Array.from(new Set(cloudTombstoneIds)).map((id) => ({
          id,
          deleted_at: now,
        }));
        Promise.resolve(client.from('deleted_adverts').upsert(rows, { onConflict: 'id' })).catch(() => {});
      }
    } catch (_) {}
  }
}

export function recordDeletedUserId(id: string): void {
  if (typeof window === 'undefined' || !id) return;
  recordDeletedUser({ id });
}

/**
 * Removes a deleted user identifier from local and cloud tombstone sets ONLY when an explicit
 * fresh signup occurs using that phone/email.
 */
export function unrecordDeletedUser(user: { id?: string; phone?: string; email?: string }): void {
  if (typeof window === 'undefined' || !user) return;
  const cloudTombstonesToRemove: string[] = [];
  try {
    if (user.id) {
      const cleanId = user.id.trim();
      const ids = getDeletedUserIds();
      ids.delete(cleanId);
      localStorage.setItem(DELETED_USERS_STORAGE_KEY, JSON.stringify(Array.from(ids)));
      cloudTombstonesToRemove.push(`usr_id:${cleanId}`);
    }
    const normPhone = user.phone ? normalizePhoneNumber(user.phone) : '';
    if (normPhone) {
      const last10 = normPhone.slice(-10);
      const phones = getDeletedPhones();
      for (const existing of Array.from(phones)) {
        if (existing === normPhone || (last10.length === 10 && existing.slice(-10) === last10)) {
          phones.delete(existing);
          cloudTombstonesToRemove.push(`usr_phone:${existing}`);
        }
      }
      cloudTombstonesToRemove.push(`usr_phone:${normPhone}`);
      if (last10.length === 10) {
        cloudTombstonesToRemove.push(`usr_phone:0${last10}`);
      }
      localStorage.setItem(DELETED_PHONES_STORAGE_KEY, JSON.stringify(Array.from(phones)));
    }
    const normEmail = user.email ? normalizeEmail(user.email) : '';
    if (normEmail) {
      const emails = getDeletedEmails();
      emails.delete(normEmail);
      localStorage.setItem(DELETED_EMAILS_STORAGE_KEY, JSON.stringify(Array.from(emails)));
      cloudTombstonesToRemove.push(`usr_email:${normEmail}`);
    }
  } catch (_) {}

  if (cloudTombstonesToRemove.length > 0 && isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      if (client) {
        Promise.resolve(
          client.from('deleted_adverts').delete().in('id', Array.from(new Set(cloudTombstonesToRemove)))
        ).catch(() => {});
      }
    } catch (_) {}
  }
}

export function unrecordDeletedUserId(id: string): void {
  if (typeof window === 'undefined' || !id) return;
  unrecordDeletedUser({ id });
}

const ZOMBIE_PURGE_MIGRATION_KEY = 'setlla_purged_zombie_1350_v1';
let zombieMigrationChecked = false;

/**
 * One-time migration on every client device/browser that guarantees the recurring
 * deleted zombie account (DT-AGT-1350 / Augustine / 08094444363 / utiobaro@gmail.com)
 * is recorded in local and cloud tombstones and purged from stale local sessions.
 * Because it runs once per browser, if this user ever explicitly signs up again in the future
 * via SignupModal (allowReRegistration: true), their new registration will succeed cleanly.
 */
export function ensureZombiePurgeMigration(): void {
  if (typeof window === 'undefined' || zombieMigrationChecked) return;
  zombieMigrationChecked = true;
  try {
    if (localStorage.getItem(ZOMBIE_PURGE_MIGRATION_KEY) === 'true') return;
    localStorage.setItem(ZOMBIE_PURGE_MIGRATION_KEY, 'true');

    recordDeletedUser(
      {
        id: 'DT-AGT-1350',
        phone: '08094444363',
        email: 'utiobaro@gmail.com',
      },
      true
    );

    // Purge any stale localStorage session for DT-AGT-1350
    const activeRaw = localStorage.getItem('setlla_user') || localStorage.getItem('deltarent_user');
    if (activeRaw) {
      const parsed = JSON.parse(activeRaw);
      if (
        parsed &&
        (parsed.id === 'DT-AGT-1350' ||
          normalizePhoneNumber(parsed.phone || '') === '08094444363' ||
          normalizeEmail(parsed.email) === 'utiobaro@gmail.com')
      ) {
        localStorage.removeItem('setlla_user');
        localStorage.removeItem('deltarent_user');
        localStorage.removeItem('setlla_auth');
        localStorage.removeItem('deltarent_auth');
      }
    }

    // Purge from local registered users cache
    const regRaw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (regRaw) {
      const arr = JSON.parse(regRaw);
      if (Array.isArray(arr)) {
        const cleaned = arr.filter(
          (u: any) =>
            u &&
            u.id !== 'DT-AGT-1350' &&
            normalizePhoneNumber(u.phone || '') !== '08094444363' &&
            normalizeEmail(u.email) !== 'utiobaro@gmail.com'
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      }
    }
  } catch (_) {}
}

/**
 * Checks whether an account record matches any deleted ID, phone, or email tombstone.
 */
export function isDeletedUserRecord(user: { id?: string; phone?: string; email?: string }): boolean {
  if (!user) return false;
  ensureZombiePurgeMigration();
  const deletedIds = getDeletedUserIds();
  if (user.id && deletedIds.has(user.id.trim())) return true;
  const normPhone = user.phone ? normalizePhoneNumber(user.phone) : '';
  if (normPhone) {
    const deletedPhones = getDeletedPhones();
    if (deletedPhones.has(normPhone)) return true;
    const last10 = normPhone.slice(-10);
    if (last10.length === 10) {
      for (const dp of deletedPhones) {
        if (dp.slice(-10) === last10) return true;
      }
    }
  }
  const normEmail = user.email ? normalizeEmail(user.email) : '';
  if (normEmail) {
    const deletedEmails = getDeletedEmails();
    if (deletedEmails.has(normEmail)) return true;
  }
  return false;
}

/**
 * Retrieves all registered users from storage and defaults.
 * Provides all available registered agents, tenants, and platform administrators.
 */
export function getRegisteredUsers(): UserProfile[] {
  if (typeof window === 'undefined') return DEFAULT_REGISTERED_USERS;
  ensureZombiePurgeMigration();

  const usersMap = new Map<string, UserProfile>();

  const addOrMergeUser = (user: UserProfile) => {
    if (!user || !user.id || isDeletedUserRecord(user)) return;
    const isAdmin = Boolean(
      user.isAdmin || 
      user.isSuperAdmin || 
      (user.email && user.email.toLowerCase() === 'admin@setlla.com') ||
      (user.fullName && user.fullName.toLowerCase().includes('elvis'))
    );
    const resolvedUser: UserProfile = {
      ...user,
      ...(isAdmin ? { isAgent: true, kycStatus: 'verified', isVerifiedTenant: false } : {}),
    };

    const phoneNorm = resolvedUser.phone ? normalizePhoneNumber(resolvedUser.phone) : '';
    const emailNorm = resolvedUser.email ? normalizeEmail(resolvedUser.email) : '';

    // Check if user already exists by ID, phone, or email
    for (const [existingId, existingUser] of usersMap.entries()) {
      const existingPhone = existingUser.phone ? normalizePhoneNumber(existingUser.phone) : '';
      const existingEmail = existingUser.email ? normalizeEmail(existingUser.email) : '';
      if (
        existingId === resolvedUser.id ||
        (phoneNorm && existingPhone && phoneNorm === existingPhone) ||
        (emailNorm && existingEmail && emailNorm === existingEmail)
      ) {
        usersMap.set(existingId, {
          ...existingUser,
          ...resolvedUser,
          id: existingId, // preserve canonical ID
        });
        return;
      }
    }
    usersMap.set(resolvedUser.id, resolvedUser);
  };

  // 1. Seed all default registered agents, tenants, and administrators
  DEFAULT_REGISTERED_USERS.forEach((user) => {
    addOrMergeUser(user);
  });

  // 2. Load from localStorage registered users registry
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      const parsed: UserProfile[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((user) => {
          addOrMergeUser(user);
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
      if (current && current.id && current.id !== 'GUEST_USER' && current.id !== 'DT-USR-GUEST') {
        addOrMergeUser(current);
      }
    }
  } catch (err) {
    // ignore
  }

  return Array.from(usersMap.values());
}


/**
 * Safe base columns verified to exist in the platform_users Supabase table.
 * Used for zero-failure fallback if extended columns (e.g. password, persona, nin) are not yet in the DB schema.
 */
export const SAFE_BASE_PLATFORM_USER_COLUMNS = [
  'id',
  'full_name',
  'phone',
  'email',
  'state',
  'city',
  'preferred_property_type',
  'budget',
  'is_verified_tenant',
  'is_agent',
  'agency_name',
  'cac_number',
  'whatsapp',
  'operating_state',
  'operating_city',
  'agent_type',
  'is_admin',
  'is_super_admin',
  'is_suspended',
  'suspension_reason',
  'kyc_status',
  'kyc_documents',
  'saved_listing_ids',
  'avatar_url',
  'last_profile_edit_at',
  'created_at',
  'updated_at'
];

/**
 * Maps a raw Supabase platform_users database record into a clean UserProfile object.
 */
export function mapDbToUserProfile(row: any): UserProfile {
  const meta = row.kyc_documents && typeof row.kyc_documents === 'object' ? (row.kyc_documents._meta || {}) : {};
  const isAdmin = Boolean(
    row.is_admin || 
    row.is_super_admin || 
    (row.email && row.email.toLowerCase() === 'admin@setlla.com') ||
    (row.full_name && row.full_name.toLowerCase().includes('elvis'))
  );
  const isAgent = Boolean(row.is_agent || isAdmin);
  const persona = row.persona || row.role || meta.persona || meta.role || (isAdmin ? 'admin' : isAgent ? 'lister' : 'tenant');

  return {
    id: row.id,
    fullName: row.full_name || '',
    email: row.email || undefined,
    password: row.password || meta.password || undefined,
    phone: row.phone || '',
    state: row.state || 'Delta State',
    city: row.city || 'Asaba',
    preferredPropertyType: row.preferred_property_type || undefined,
    budget: row.budget !== null && row.budget !== undefined ? Number(row.budget) : undefined,
    nin: row.nin || meta.nin || undefined,
    isVerifiedTenant: Boolean(row.is_verified_tenant),
    avatarUrl: row.avatar_url || undefined,
    isAgent: isAgent,
    agencyName: row.agency_name || meta.company_name || (isAdmin ? 'Setlla Executive Office' : undefined),
    cacNumber: row.cac_number || undefined,
    whatsapp: row.whatsapp || undefined,
    operatingState: row.operating_state || row.state || 'Delta State',
    operatingCity: row.operating_city || row.city || 'Asaba',
    agentType: row.agent_type || (isAgent ? 'agency' : undefined),
    savedListingIds: Array.isArray(row.saved_listing_ids) ? row.saved_listing_ids : [],
    isAdmin: Boolean(row.is_admin || isAdmin),
    isSuperAdmin: Boolean(row.is_super_admin || isAdmin),
    isDemoAdmin: false,
    isSuspended: Boolean(row.is_suspended),
    suspensionReason: row.suspension_reason || undefined,
    kycStatus: isAdmin ? 'verified' : (row.kyc_status || 'not_submitted'),
    kycDocuments: row.kyc_documents && typeof row.kyc_documents === 'object' ? row.kyc_documents : undefined,
    createdAt: row.created_at || new Date().toISOString(),
    lastProfileEditAt: row.last_profile_edit_at || undefined,
    persona: persona,
    cvUrl: row.cv_url || meta.cv_url || undefined,
    cvFileName: row.cv_file_name || meta.cv_file_name || undefined,
    targetRole: row.target_role || meta.target_role || row.preferred_property_type || undefined,
    companyName: row.company_name || meta.company_name || row.agency_name || (isAdmin ? 'Setlla Executive Office' : undefined),
  };
}

/**
 * Maps a UserProfile object into a Supabase platform_users database record format.
 * Mirrors extra metadata into kyc_documents._meta for cross-device persistence even if custom DB columns are missing.
 */
export function mapUserProfileToDb(user: UserProfile): Record<string, any> {
  const isAdmin = Boolean(
    user.isAdmin || 
    user.isSuperAdmin || 
    (user.email && user.email.toLowerCase() === 'admin@setlla.com') ||
    (user.fullName && user.fullName.toLowerCase().includes('elvis'))
  );
  const isAgent = Boolean(user.isAgent || isAdmin);
  const resolvedRole = user.persona || (isAdmin ? 'admin' : isAgent ? 'lister' : 'tenant');

  const baseKycDocs = (user.kycDocuments && typeof user.kycDocuments === 'object') ? user.kycDocuments : {};
  const metaKyc = {
    ...baseKycDocs,
    _meta: {
      password: user.password || null,
      persona: resolvedRole,
      role: resolvedRole,
      nin: user.nin || null,
      company_name: user.companyName || user.agencyName || null,
      cv_url: user.cvUrl || null,
      cv_file_name: user.cvFileName || null,
      target_role: user.targetRole || null,
    }
  };

  return {
    id: user.id,
    full_name: user.fullName,
    phone: user.phone,
    email: user.email || null,
    state: user.state || 'Delta State',
    city: user.city || 'Asaba',
    preferred_property_type: user.preferredPropertyType || null,
    budget: user.budget ?? 0,
    is_verified_tenant: Boolean(user.isVerifiedTenant),
    avatar_url: user.avatarUrl || null,
    is_agent: isAgent,
    agency_name: user.agencyName || user.companyName || (isAdmin ? 'Setlla Executive Office' : null),
    cac_number: user.cacNumber || null,
    whatsapp: user.whatsapp || null,
    operating_state: user.operatingState || user.state || 'Delta State',
    operating_city: user.operatingCity || user.city || 'Asaba',
    agent_type: user.agentType || (isAgent ? 'agency' : null),
    saved_listing_ids: Array.isArray(user.savedListingIds) ? user.savedListingIds : [],
    is_admin: Boolean(user.isAdmin || isAdmin),
    is_super_admin: Boolean(user.isSuperAdmin || isAdmin),
    is_suspended: Boolean(user.isSuspended),
    suspension_reason: user.suspensionReason || null,
    kyc_status: isAdmin ? 'verified' : (user.kycStatus || 'not_submitted'),
    kyc_documents: metaKyc,
    created_at: user.createdAt || new Date().toISOString(),
    last_profile_edit_at: user.lastProfileEditAt || null,
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
  const localUsers = getRegisteredUsers();

  if (!isSupabaseConfigured()) {
    return localUsers;
  }

  try {
    const client = getSupabaseClient();
    if (!client) return localUsers;

    const [usersRes, advertisersRes, listingsRes, cloudTombstonesRes] = await Promise.all([
      client.from('platform_users').select('*').order('created_at', { ascending: false }),
      Promise.resolve(client.from('advertisers').select('*').order('created_at', { ascending: false })).catch(() => ({ data: null, error: null })),
      Promise.resolve(client.from('listings').select('id, title, city, state, agent, availability_status, created_at').in('availability_status', ['Available', 'Under Inspection'])).catch(() => ({ data: null, error: null })),
      Promise.resolve(client.from('deleted_adverts').select('id').like('id', 'usr_%')).catch(() => ({ data: null, error: null })),
    ]);

    // 0. Synchronize cloud deletion tombstones into local tombstone sets before processing rows
    if (cloudTombstonesRes && 'data' in cloudTombstonesRes && Array.isArray(cloudTombstonesRes.data)) {
      cloudTombstonesRes.data.forEach((t: any) => {
        const rawId = typeof t?.id === 'string' ? t.id : '';
        if (rawId.startsWith('usr_id:')) {
          recordDeletedUser({ id: rawId.slice(7) }, false);
        } else if (rawId.startsWith('usr_phone:')) {
          recordDeletedUser({ phone: rawId.slice(10) }, false);
        } else if (rawId.startsWith('usr_email:')) {
          recordDeletedUser({ email: rawId.slice(10) }, false);
        }
      });
    }

    const data = usersRes.data;
    const error = usersRes.error;

    // When Supabase responds successfully, its data is the single source of truth
    if (!error && Array.isArray(data)) {
      const dbUsersMap = new Map<string, UserProfile>();

      const addOrMergeToDbMap = (user: UserProfile) => {
        if (!user || !user.id) return;
        if (isDeletedUserRecord(user)) return;

        const isAdmin = Boolean(
          user.isAdmin || 
          user.isSuperAdmin || 
          (user.email && user.email.toLowerCase() === 'admin@setlla.com') ||
          (user.fullName && user.fullName.toLowerCase().includes('elvis'))
        );
        const resolved: UserProfile = {
          ...user,
          ...(isAdmin ? { isAgent: true, kycStatus: 'verified', isVerifiedTenant: false } : {}),
        };

        const phoneNorm = resolved.phone ? normalizePhoneNumber(resolved.phone) : '';
        const emailNorm = resolved.email ? normalizeEmail(resolved.email) : '';

        for (const [existingId, existingUser] of dbUsersMap.entries()) {
          const existingPhone = existingUser.phone ? normalizePhoneNumber(existingUser.phone) : '';
          const existingEmail = existingUser.email ? normalizeEmail(existingUser.email) : '';
          if (
            existingId === resolved.id ||
            (phoneNorm && existingPhone && phoneNorm === existingPhone) ||
            (emailNorm && existingEmail && emailNorm === existingEmail)
          ) {
            dbUsersMap.set(existingId, {
              ...existingUser,
              ...resolved,
              id: existingId,
            });
            return;
          }
        }
        dbUsersMap.set(resolved.id, resolved);
      };

      // 1. Add all registered users from central platform_users (and auto-purge any zombie row matching a tombstone)
      data.forEach((row) => {
        const u = mapDbToUserProfile(row);
        if (!u) return;
        if (isDeletedUserRecord(u)) {
          if (row.id) {
            Promise.resolve(client.from('platform_users').delete().eq('id', row.id)).catch(() => {});
          }
          return;
        }
        addOrMergeToDbMap(u);
      });

      // 2. Merge registered advertisers into unified user registry
      if (advertisersRes && 'data' in advertisersRes && Array.isArray(advertisersRes.data)) {
        advertisersRes.data.forEach((adv: any) => {
          if (!adv || !adv.id) return;
          if (isDeletedUserRecord({ id: adv.id, phone: adv.phone, email: adv.email })) {
            Promise.resolve(client.from('advertisers').delete().eq('id', adv.id)).catch(() => {});
            return;
          }
          const advUser: UserProfile = {
            id: adv.id,
            fullName: adv.contact_name || adv.company_name || 'Advertiser Partner',
            phone: adv.phone || '',
            email: adv.email || '',
            state: 'Delta State',
            city: adv.operating_city || 'Asaba',
            persona: 'advertiser',
            isAgent: false,
            isAdmin: false,
            isEmailVerified: true,
            isVerifiedTenant: false,
            savedListingIds: [],
            createdAt: adv.created_at || new Date().toISOString(),
            agencyName: adv.company_name,
          };
          addOrMergeToDbMap(advUser);
        });
      }

      // 3. FAILSAFE: Ensure any agent who has an active published listing is ALWAYS captured (unless deleted)
      if (listingsRes && 'data' in listingsRes && Array.isArray(listingsRes.data)) {
        listingsRes.data.forEach((listing: any) => {
          const ag = listing.agent;
          if (ag && (ag.id || ag.phone)) {
            // Never harvest or re-upsert an agent that was explicitly deleted
            if (isDeletedUserRecord({ id: ag.id, phone: ag.phone, email: ag.email })) {
              if (listing.id) {
                Promise.resolve(client.from('listings').update({ availability_status: 'Deleted' }).eq('id', listing.id)).catch(() => {});
                Promise.resolve(client.from('listings').delete().eq('id', listing.id)).catch(() => {});
              }
              return;
            }
            const agentId = ag.id || (ag.phone ? `DT-AGT-${normalizePhoneNumber(ag.phone).slice(-4)}` : `DT-AGT-${Date.now()}`);
            const agentPhoneNorm = ag.phone ? normalizePhoneNumber(ag.phone) : '';
            
            let found = false;
            for (const existingUser of dbUsersMap.values()) {
              const existingPhoneNorm = existingUser.phone ? normalizePhoneNumber(existingUser.phone) : '';
              if (
                existingUser.id === agentId ||
                (agentPhoneNorm && existingPhoneNorm && agentPhoneNorm === existingPhoneNorm)
              ) {
                found = true;
                existingUser.isAgent = true;
                if (!existingUser.persona || existingUser.persona === 'tenant') {
                  existingUser.persona = 'lister';
                }
                if (ag.agencyName && !existingUser.agencyName) existingUser.agencyName = ag.agencyName;
                if (ag.cacNumber && !existingUser.cacNumber) existingUser.cacNumber = ag.cacNumber;
                break;
              }
            }

            if (!found) {
              const activeAgentUser: UserProfile = {
                id: agentId,
                fullName: ag.fullName || ag.name || 'Verified Agent',
                phone: ag.phone || '',
                whatsapp: ag.whatsapp || ag.phone || '',
                agencyName: ag.agencyName || ag.fullName || 'Agency',
                cacNumber: ag.cacNumber || 'VERIFIED-REG',
                isAgent: true,
                persona: 'lister',
                state: listing.state || 'Delta State',
                city: listing.city || 'Asaba',
                kycStatus: ag.isVerified ? 'verified' : 'pending',
                isVerifiedTenant: false,
                savedListingIds: [],
                createdAt: listing.created_at || new Date().toISOString(),
              };
              addOrMergeToDbMap(activeAgentUser);
            }
          }
        });
      }

      // 4. Validate local active session user: if deleted in cloud/local tombstones, purge session immediately
      try {
        const rawCurrent = localStorage.getItem('setlla_user') || localStorage.getItem('deltarent_user');
        if (rawCurrent) {
          const current: UserProfile = JSON.parse(rawCurrent);
          if (current && current.id && current.id !== 'GUEST_USER' && current.id !== 'DT-USR-GUEST') {
            if (isDeletedUserRecord(current)) {
              localStorage.removeItem('setlla_user');
              localStorage.removeItem('deltarent_user');
              localStorage.removeItem('setlla_auth');
              localStorage.removeItem('deltarent_auth');
            } else {
              const isCurrentElvis = Boolean(
                current.isAdmin ||
                current.isSuperAdmin ||
                (current.email && current.email.toLowerCase() === 'admin@setlla.com') ||
                (current.fullName && current.fullName.toLowerCase().includes('elvis'))
              );
              if (isCurrentElvis) {
                addOrMergeToDbMap(current);
              }
            }
          }
        }
      } catch (_) {}

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

export interface SaveRegisteredUserOptions {
  allowReRegistration?: boolean;
  skipCloudSync?: boolean;
  skipBroadcast?: boolean;
}

/**
 * Saves a new or updated user profile to the registry AND automatically
 * synchronizes to the shared Supabase database so all accounts correlate across
 * mobile, desktop, and all screens automatically.
 *
 * Strictly refuses to save or re-upsert any account matching a deletion tombstone
 * unless `options.allowReRegistration` is explicitly set to `true` (on a fresh signup).
 */
export function saveRegisteredUser(
  user: UserProfile,
  options?: SaveRegisteredUserOptions
): void {
  if (typeof window === 'undefined' || !user) return;

  if (options?.allowReRegistration) {
    unrecordDeletedUser(user);
  } else if (isDeletedUserRecord(user)) {
    console.warn('[UserRegistry] Blocked saveRegisteredUser for deleted account:', user.id, user.phone, user.email);
    return;
  }

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

  if (options?.skipCloudSync) {
    return;
  }

  // Synchronize to central Supabase platform_users table
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      const dbRow = mapUserProfileToDb(user);
      Promise.resolve(client.from('platform_users').upsert(dbRow, { onConflict: 'id' }))
        .then(async (res: any) => {
          if (isDeletedUserRecord(user)) {
            Promise.resolve(client.from('platform_users').delete().eq('id', user.id)).catch(() => {});
            return;
          }
          if (res?.error) {
            console.warn('[UserRegistry] Full upsert notice, falling back to verified columns:', res.error.message);
            const safeCoreRow: Record<string, any> = {};
            SAFE_BASE_PLATFORM_USER_COLUMNS.forEach((col) => {
              if (dbRow[col] !== undefined) {
                safeCoreRow[col] = dbRow[col];
              }
            });
            const retryRes = await client.from('platform_users').upsert(safeCoreRow, { onConflict: 'id' });
            if (!retryRes?.error && !options?.skipBroadcast && !isDeletedUserRecord(user)) {
              broadcastRealtimeEvent('USER_REGISTERED', { user });
            } else if (retryRes?.error) {
              console.warn('[UserRegistry] Supabase platform_users retry error:', retryRes.error.message);
            }
          } else if (!options?.skipBroadcast && !isDeletedUserRecord(user)) {
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
export async function saveRegisteredUserAsync(
  user: UserProfile,
  options?: SaveRegisteredUserOptions
): Promise<boolean> {
  if (options?.allowReRegistration) {
    unrecordDeletedUser(user);
  } else if (isDeletedUserRecord(user)) {
    console.warn('[UserRegistry] Blocked saveRegisteredUserAsync for deleted account:', user.id, user.phone, user.email);
    return false;
  }

  saveRegisteredUser(user, { ...options, skipCloudSync: true });
  if (!isSupabaseConfigured() || options?.skipCloudSync) return true;

  try {
    const savePromise = (async (): Promise<boolean> => {
      const client = getSupabaseClient();
      if (!client) return true;
      const dbRow = mapUserProfileToDb(user);
      const { error } = await client.from('platform_users').upsert(dbRow, { onConflict: 'id' });
      if (isDeletedUserRecord(user)) {
        await client.from('platform_users').delete().eq('id', user.id);
        return false;
      }
      if (!error) {
        if (!options?.skipBroadcast) {
          broadcastRealtimeEvent('USER_REGISTERED', { user });
        }
        return true;
      } else {
        console.warn('[UserRegistry] Full async upsert notice, retrying with verified columns:', error.message);
        const safeCoreRow: Record<string, any> = {};
        SAFE_BASE_PLATFORM_USER_COLUMNS.forEach((col) => {
          if (dbRow[col] !== undefined) {
            safeCoreRow[col] = dbRow[col];
          }
        });
        const retryRes = await client.from('platform_users').upsert(safeCoreRow, { onConflict: 'id' });
        if (!retryRes.error) {
          if (!options?.skipBroadcast && !isDeletedUserRecord(user)) {
            broadcastRealtimeEvent('USER_REGISTERED', { user });
          }
          return true;
        } else {
          console.error('[UserRegistry] Async save retry error:', retryRes.error.message);
        }
      }
      return false;
    })();

    const timeoutPromise = new Promise<boolean>((resolve) =>
      setTimeout(() => resolve(true), 3000)
    );

    return await Promise.race([savePromise, timeoutPromise]);
  } catch (e) {
    console.warn('[UserRegistry] Async user save error:', e);
  }
  return true;
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
 * Super Admin function: Permanently wipes EVERY trail of a user account across all central Supabase
 * database tables and local device caches so their phone number, email address, and credentials can
 * be freely reused to register a brand-new account without any conflict or "already exists" errors.
 */
export async function deleteUserFromRegistryAsync(
  target: string | UserProfile
): Promise<{ success: boolean; error?: string }> {
  if (typeof window === 'undefined') return { success: false, error: 'Window undefined' };
  if (!target) return { success: false, error: 'No target specified' };

  // 1. Resolve target user profile
  let resolvedUser: UserProfile | undefined;
  let targetId = '';

  if (typeof target === 'string') {
    targetId = target.trim();
    resolvedUser = getRegisteredUsers().find((u) => u.id === targetId);
  } else {
    resolvedUser = target;
    targetId = target.id || '';
  }

  // Strictly protect Super Admin Elvis from accidental deletion
  const isTargetElvis = Boolean(
    (targetId && (targetId.toLowerCase().includes('elvis') || targetId === 'dt-admin-elvis')) ||
    (resolvedUser && (
      (resolvedUser.email && resolvedUser.email.toLowerCase() === 'admin@setlla.com') ||
      (resolvedUser.fullName && resolvedUser.fullName.toLowerCase().includes('elvis')) ||
      (resolvedUser.phone && (resolvedUser.phone.includes('9077056351') || resolvedUser.phone.includes('7056351'))) ||
      resolvedUser.id === 'dt-admin-elvis'
    ))
  );

  if (isTargetElvis) {
    console.warn('[UserRegistry] Prevented deletion of Super Admin Elvis.');
    return { success: false, error: 'Super Admin Elvis cannot be deleted.' };
  }

  // If phone or email is missing and only an ID was supplied, query DB to discover full contact info
  if ((!resolvedUser?.phone && !resolvedUser?.email) && targetId && isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      if (client) {
        const { data } = await client.from('platform_users').select('*').eq('id', targetId).maybeSingle();
        if (data) {
          resolvedUser = mapDbToUserProfile(data);
        }
      }
    } catch (_) {}
  }

  // 2. Extract all identifier variants (ID, phones, emails)
  const ids = new Set<string>();
  if (targetId) ids.add(targetId);
  if (resolvedUser?.id) ids.add(resolvedUser.id);

  const phoneVariants = new Set<string>();
  const rawPhone = resolvedUser?.phone?.trim();
  if (rawPhone) {
    phoneVariants.add(rawPhone);
    const norm = normalizePhoneNumber(rawPhone);
    if (norm) {
      phoneVariants.add(norm);
      if (norm.startsWith('0')) {
        const withoutZero = norm.slice(1);
        phoneVariants.add(withoutZero);
        phoneVariants.add(`+234${withoutZero}`);
        phoneVariants.add(`234${withoutZero}`);
        phoneVariants.add(`0${withoutZero}`);
      } else {
        phoneVariants.add(`0${norm}`);
        phoneVariants.add(`+234${norm}`);
        phoneVariants.add(`234${norm}`);
      }
    }
  }

  const emailVariants = new Set<string>();
  const rawEmail = resolvedUser?.email?.trim();
  if (rawEmail) {
    emailVariants.add(rawEmail);
    emailVariants.add(rawEmail.toLowerCase());
    const norm = normalizeEmail(rawEmail);
    if (norm) emailVariants.add(norm);
  }

  const matchesUser = (u: any): boolean => {
    if (!u) return false;
    if (u.id && ids.has(u.id)) return true;
    const uPhone = u.phone ? normalizePhoneNumber(u.phone) : '';
    if (uPhone && Array.from(phoneVariants).some((p) => normalizePhoneNumber(p) === uPhone)) return true;
    const uEmail = u.email ? normalizeEmail(u.email) : '';
    if (uEmail && Array.from(emailVariants).some((e) => normalizeEmail(e) === uEmail)) return true;
    return false;
  };

  // 3. Purge LocalStorage Registries
  try {
    const purgeRegistry = (key: string) => {
      const raw = localStorage.getItem(key);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          const filtered = arr.filter((u) => !matchesUser(u));
          localStorage.setItem(key, JSON.stringify(filtered));
        }
      }
    };
    purgeRegistry(STORAGE_KEY);
    purgeRegistry(LEGACY_STORAGE_KEY);
    purgeRegistry('setlla_registered_advertisers');
  } catch (err) {
    console.warn('[UserRegistry] Local registry purge notice:', err);
  }

  // 4. Purge Active Sessions if this browser is currently logged into the deleted account
  try {
    const rawSession = localStorage.getItem('setlla_user') || localStorage.getItem('deltarent_user');
    if (rawSession) {
      const sUser = JSON.parse(rawSession);
      if (matchesUser(sUser)) {
        localStorage.removeItem('setlla_user');
        localStorage.removeItem('deltarent_user');
        localStorage.removeItem('setlla_auth');
        localStorage.removeItem('deltarent_auth');
        sessionStorage.removeItem('setlla_user');
        sessionStorage.removeItem('deltarent_user');
      }
    }
    const rawAdvSession = localStorage.getItem('setlla_advertiser_user');
    if (rawAdvSession) {
      const aUser = JSON.parse(rawAdvSession);
      if (matchesUser(aUser)) {
        localStorage.removeItem('setlla_advertiser_user');
        localStorage.removeItem('setlla_advertiser_auth');
      }
    }
  } catch (_) {}

  // 5. Purge Pending OTPs & Tokens matching phone or email
  try {
    const otpKeys = [
      'setlla_pending_email_otp',
      'deltarent_pending_email_otp',
      'setlla_admin_pending_otp',
      'setlla_advertiser_pending_otp',
      'setlla_pending_registration',
      'setlla_candidate_cv'
    ];
    otpKeys.forEach((key) => {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (
            matchesUser(parsed) ||
            (parsed.email && emailVariants.has(parsed.email.toLowerCase())) ||
            (parsed.phone && phoneVariants.has(parsed.phone))
          ) {
            localStorage.removeItem(key);
          }
        } catch (_) {}
      }
    });
  } catch (_) {}

  // 6. Purge matching listings from local storage cache
  try {
    ['setlla_saved_listings', 'deltarent_saved_listings', 'setlla_listings', 'deltarent_listings'].forEach((key) => {
      const raw = localStorage.getItem(key);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          const filtered = arr.filter((item: any) => {
            const ag = item.agent;
            if (!ag) return true;
            if (ag.id && ids.has(ag.id)) return false;
            const agPhoneNorm = ag.phone ? normalizePhoneNumber(ag.phone) : '';
            if (agPhoneNorm && Array.from(phoneVariants).some((p) => normalizePhoneNumber(p) === agPhoneNorm)) return false;
            const agEmailNorm = ag.email ? normalizeEmail(ag.email) : '';
            if (agEmailNorm && Array.from(emailVariants).some((e) => normalizeEmail(e) === agEmailNorm)) return false;
            return true;
          });
          localStorage.setItem(key, JSON.stringify(filtered));
        }
      }
    });
  } catch (_) {}

  // 7. Purge matching bookings from local storage cache
  try {
    ['setlla_saved_bookings', 'deltarent_saved_bookings', 'setlla_bookings', 'deltarent_bookings'].forEach((key) => {
      const raw = localStorage.getItem(key);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          const filtered = arr.filter((b: any) => {
            const bPhone = b.applicantPhone || b.applicant_phone;
            const bEmail = b.applicantEmail || b.applicant_email;
            if (bPhone && Array.from(phoneVariants).some((p) => normalizePhoneNumber(p) === normalizePhoneNumber(bPhone))) return false;
            if (bEmail && Array.from(emailVariants).some((e) => normalizeEmail(e) === normalizeEmail(bEmail))) return false;
            return true;
          });
          localStorage.setItem(key, JSON.stringify(filtered));
        }
      }
    });
  } catch (_) {}

  // 8. Record deleted user tombstone locally & in cloud so this account never resurfaces
  ids.forEach((id) => recordDeletedUser({ id }, true));
  phoneVariants.forEach((p) => recordDeletedUser({ phone: p }, true));
  emailVariants.forEach((e) => recordDeletedUser({ email: e }, true));

  // 9. Dispatch account deletion notice email directly to user's registered email
  const targetEmail = resolvedUser?.email || rawEmail;
  if (targetEmail && targetEmail.includes('@')) {
    sendAccountDeletionEmail({
      email: targetEmail,
      fullName: resolvedUser?.fullName || 'Valued User',
      phone: resolvedUser?.phone || rawPhone,
      id: targetId,
    }).catch((err) => console.warn('[UserRegistry] Failed to send deletion notice email:', err));
  }

  // 10. Broadcast realtime event immediately so all active tabs/devices drop the user & stop syncing
  const broadcastUser: UserProfile = resolvedUser || {
    id: targetId,
    fullName: 'Deleted User',
    phone: rawPhone || '',
    email: rawEmail || undefined,
    state: 'Delta State',
    city: 'Asaba',
    isAgent: false,
    isAdmin: false,
    isSuperAdmin: false,
    isVerifiedTenant: false,
    savedListingIds: [],
    createdAt: new Date().toISOString(),
  };
  try {
    broadcastRealtimeEvent('USER_DELETED', { user: broadcastUser });
  } catch (_) {}

  // 11. Wipe from central Supabase database across all tables
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      if (client) {
        const idList = Array.from(ids);
        const phoneList = Array.from(phoneVariants);
        const emailList = Array.from(emailVariants);
        const normPhoneMain = rawPhone ? normalizePhoneNumber(rawPhone) : '';
        const last10Phone = normPhoneMain.slice(-10);

        const runPlatformUserPurge = async () => {
          const ops: Promise<any>[] = [];
          if (idList.length > 0) {
            ops.push(Promise.resolve(client.from('platform_users').delete().in('id', idList)).catch(() => {}));
            ops.push(Promise.resolve(client.from('profiles').delete().in('id', idList)).catch(() => {}));
            ops.push(Promise.resolve(client.from('advertisers').delete().in('id', idList)).catch(() => {}));
          }
          for (const p of phoneList) {
            ops.push(Promise.resolve(client.from('platform_users').delete().eq('phone', p)).catch(() => {}));
            ops.push(Promise.resolve(client.from('profiles').delete().eq('phone', p)).catch(() => {}));
            ops.push(Promise.resolve(client.from('advertisers').delete().eq('phone', p)).catch(() => {}));
          }
          if (last10Phone.length === 10) {
            ops.push(Promise.resolve(client.from('platform_users').delete().ilike('phone', `%${last10Phone}%`)).catch(() => {}));
          }
          for (const e of emailList) {
            ops.push(Promise.resolve(client.from('platform_users').delete().eq('email', e)).catch(() => {}));
            ops.push(Promise.resolve(client.from('platform_users').delete().ilike('email', e)).catch(() => {}));
            ops.push(Promise.resolve(client.from('profiles').delete().eq('email', e)).catch(() => {}));
            ops.push(Promise.resolve(client.from('advertisers').delete().eq('email', e)).catch(() => {}));
          }
          await Promise.allSettled(ops);
        };

        // A. Table: listings (soft-delete AND hard-delete all properties published by this agent)
        try {
          const { data: listings } = await client.from('listings').select('id, agent');
          if (Array.isArray(listings)) {
            const toDeleteIds: string[] = [];
            for (const item of listings) {
              const ag = item.agent;
              if (!ag) continue;
              if (ag.id && ids.has(ag.id)) {
                toDeleteIds.push(item.id);
                continue;
              }
              const agPhone = ag.phone ? normalizePhoneNumber(ag.phone) : '';
              if (agPhone && phoneList.some((p) => normalizePhoneNumber(p) === agPhone)) {
                toDeleteIds.push(item.id);
                continue;
              }
              const agEmail = ag.email ? normalizeEmail(ag.email) : '';
              if (agEmail && emailList.some((e) => normalizeEmail(e) === agEmail)) {
                toDeleteIds.push(item.id);
                continue;
              }
            }
            if (toDeleteIds.length > 0) {
              await Promise.allSettled([
                Promise.resolve(client.from('listings').update({ availability_status: 'Deleted' }).in('id', toDeleteIds)),
                Promise.resolve(client.from('listings').delete().in('id', toDeleteIds)),
              ]);
            }
          }
        } catch (e) {
          console.warn('[UserRegistry] Listings purge notice:', e);
        }

        // B. Tables: platform_users, profiles, advertisers, bookings, job_applications, job_listings
        const dbDeletions: Promise<any>[] = [runPlatformUserPurge()];

        if (idList.length > 0) {
          dbDeletions.push(Promise.resolve(client.from('job_applications').delete().in('applicant_id', idList)).catch(() => {}));
        }

        for (const p of phoneList) {
          dbDeletions.push(Promise.resolve(client.from('bookings').delete().eq('applicant_phone', p)).catch(() => {}));
          dbDeletions.push(Promise.resolve(client.from('job_applications').delete().eq('applicant_phone', p)).catch(() => {}));
          dbDeletions.push(Promise.resolve(client.from('job_listings').delete().eq('contact_phone', p)).catch(() => {}));
        }

        for (const e of emailList) {
          dbDeletions.push(Promise.resolve(client.from('bookings').delete().eq('applicant_email', e)).catch(() => {}));
          dbDeletions.push(Promise.resolve(client.from('job_applications').delete().eq('applicant_email', e)).catch(() => {}));
          dbDeletions.push(Promise.resolve(client.from('job_listings').delete().eq('contact_email', e)).catch(() => {}));
        }

        await Promise.allSettled(dbDeletions);

        // C. Follow-up sweeps to catch any in-flight upsert that was mid-network when delete was triggered
        setTimeout(() => {
          runPlatformUserPurge().catch(() => {});
          broadcastRealtimeEvent('USER_DELETED', { user: broadcastUser }).catch(() => {});
        }, 1500);
        setTimeout(() => {
          runPlatformUserPurge().catch(() => {});
        }, 4000);
      }
    } catch (err) {
      console.warn('[UserRegistry] Database purge error:', err);
    }
  }

  return { success: true };
}

/**
 * Super Admin function: removes a user from the registry and central database.
 * Sync wrapper invoking deep purge deleteUserFromRegistryAsync.
 */
export function deleteUserFromRegistry(target: string | UserProfile): void {
  deleteUserFromRegistryAsync(target).catch((err) => {
    console.warn('[UserRegistry] Async delete failed:', err);
  });
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

    const queryPromise = (async (): Promise<DuplicateCheckResult> => {
      const filters: string[] = [];

      if (phone && phone.trim()) {
        filters.push(`phone.eq.${phone.trim()}`);
      }
      if (normPhone && normPhone !== phone.trim()) {
        filters.push(`phone.eq.${normPhone}`);
      }
      if (normEmail) {
        filters.push(`email.eq.${normEmail}`);
      }

      if (filters.length === 0) return { exists: false };

      const { data, error } = await client
        .from('platform_users')
        .select('id, full_name, phone, email, is_agent, agency_name, persona')
        .or(filters.join(','));

      if (!error && Array.isArray(data)) {
        for (const row of data) {
          if (excludeUserId && row.id === excludeUserId) continue;

          const user = mapDbToUserProfile(row);
          if (isDeletedUserRecord(user)) continue;

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
      return { exists: false };
    })();

    const timeoutPromise = new Promise<DuplicateCheckResult>((resolve) =>
      setTimeout(() => resolve({ exists: false }), 2000)
    );

    return await Promise.race([queryPromise, timeoutPromise]);
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
    if (isDeletedUserRecord(user)) continue;
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
        if (isDeletedUserRecord(user)) continue;
        if (isEmail) {
          if (user.email && normalizeEmail(user.email) === normEmail) {
            saveRegisteredUser(user, { skipCloudSync: true, skipBroadcast: true });
            return user;
          }
        } else {
          const uPhone = normalizePhoneNumber(user.phone);
          if (uPhone === normPhone || (last10.length >= 7 && uPhone.slice(-10) === last10)) {
            saveRegisteredUser(user, { skipCloudSync: true, skipBroadcast: true });
            return user;
          }
        }
      }
    }

    // 3. Fallback: Fetch latest users from DB if targeted indexed query returned no hit
    const allDbUsers = await fetchRegisteredUsersFromDb();
    for (const user of allDbUsers) {
      if (isDeletedUserRecord(user)) continue;
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


