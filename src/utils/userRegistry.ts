import { UserProfile, BookingRecord } from '../types/marketplace';
import { isLocalUrl } from './environment';

// Default seeded accounts for instant marketplace testing
export const DEFAULT_REGISTERED_USERS: UserProfile[] = [
  {
    id: 'DT-ADMIN-001',
    fullName: 'Platform Administrator',
    email: 'admin@setlla.com',
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
  },
  {
    id: 'DT-USR-8492',
    fullName: 'Chinedu Okafor',
    email: 'chinedu.okafor@gmail.com',
    phone: '0803 891 0293',
    state: 'Delta State',
    city: 'Asaba',
    preferredPropertyType: 'Bedseater',
    budget: 2000000,
    nin: 'NIN-2910-***-9021',
    isVerifiedTenant: true,
    isAgent: false,
    savedListingIds: ['prop-asaba-01'],
    createdAt: '2026-10-01T10:00:00.000Z',
  },
  {
    id: 'DT-AGT-9012',
    fullName: 'Victor Ossai',
    agencyName: 'Apex Real Estate Ltd',
    agentType: 'agency',
    phone: '0803 555 1234',
    whatsapp: '0803 555 1234',
    email: 'victor@apexrealty.ng',
    operatingState: 'Delta State',
    operatingCity: 'Asaba',
    state: 'Delta State',
    city: 'Asaba',
    cacNumber: 'RC-1849204',
    isVerifiedTenant: false,
    isAgent: true,
    kycStatus: 'verified',
    kycDocuments: {
      ninNumber: 'NIN-8910-***-2011',
      cacCertificateUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
      submittedAt: '2026-09-15T12:00:00.000Z',
    },
    savedListingIds: [],
    createdAt: '2026-10-01T10:00:00.000Z',
  },
  {
    id: 'DT-AGT-1021',
    fullName: 'Chief Oghenetega Macaulay',
    agencyName: 'Delta Heritage Realty Ltd',
    agentType: 'agency',
    phone: '0803 492 8172',
    whatsapp: '2348034928172',
    email: 'oghene@deltaheritage.ng',
    operatingState: 'Delta State',
    operatingCity: 'Asaba',
    state: 'Delta State',
    city: 'Asaba',
    cacNumber: 'RC-2910482',
    isVerifiedTenant: false,
    isAgent: true,
    kycStatus: 'verified',
    kycDocuments: {
      ninNumber: 'NIN-1029-***-4821',
      cacCertificateUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
      submittedAt: '2026-09-10T10:30:00.000Z',
    },
    savedListingIds: [],
    createdAt: '2026-09-10T10:00:00.000Z',
  },
  {
    id: 'DT-AGT-2044',
    fullName: 'Barrister Emeka Danladi',
    agencyName: 'Prime Crest Properties',
    agentType: 'agency',
    phone: '0812 491 0294',
    whatsapp: '2348124910294',
    email: 'emeka@primecrest.ng',
    operatingState: 'Delta State',
    operatingCity: 'Warri',
    state: 'Delta State',
    city: 'Warri',
    cacNumber: 'RC-3918201',
    isVerifiedTenant: false,
    isAgent: true,
    kycStatus: 'pending',
    kycDocuments: {
      ninNumber: 'NIN-5521-***-9018',
      submittedAt: '2026-10-18T14:20:00.000Z',
    },
    savedListingIds: [],
    createdAt: '2026-10-18T14:00:00.000Z',
  },
  {
    id: 'DT-AGT-3055',
    fullName: 'Ngozi Blessing Eze',
    agencyName: 'Campus Nest Agencies',
    agentType: 'individual',
    phone: '0816 772 1902',
    whatsapp: '2348167721902',
    email: 'ngozi@campusnest.ng',
    operatingState: 'Delta State',
    operatingCity: 'Abraka',
    state: 'Delta State',
    city: 'Abraka',
    isVerifiedTenant: false,
    isAgent: true,
    kycStatus: 'verified',
    savedListingIds: [],
    createdAt: '2026-09-25T11:00:00.000Z',
  },
  {
    id: 'DT-WRI-3918',
    fullName: 'Tariere Ebi',
    phone: '0814 391 8291',
    email: 'tariere.ebi@outlook.com',
    state: 'Delta State',
    city: 'Warri',
    isVerifiedTenant: true,
    isAgent: false,
    savedListingIds: ['prop-warri-02'],
    createdAt: '2026-10-01T10:00:00.000Z',
  },
  {
    id: 'DT-USR-5520',
    fullName: 'Blessing Okon',
    phone: '0802 334 1122',
    email: 'blessing.okon@yahoo.com',
    state: 'Delta State',
    city: 'Abraka',
    preferredPropertyType: 'Single Room',
    isVerifiedTenant: false,
    isAgent: false,
    savedListingIds: [],
    createdAt: '2026-10-15T09:00:00.000Z',
  },
];

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

const DEMO_USER_IDS = new Set([
  'DT-USR-8492',
  'DT-AGT-9012',
  'DT-WRI-3918',
  'DT-ADMIN-001',
  'DT-AGT-1021',
  'DT-AGT-2044',
  'DT-AGT-3055',
  'DT-USR-5520',
]);

/**
 * Retrieves all registered users from storage and defaults.
 * On deployed URLs, demo accounts are excluded so the platform starts clean.
 */
export function getRegisteredUsers(): UserProfile[] {
  const isLocal = isLocalUrl();
  if (typeof window === 'undefined') return isLocal ? DEFAULT_REGISTERED_USERS : [];

  const usersMap = new Map<string, UserProfile>();

  // 1. Seed defaults ONLY on local development environment
  if (isLocal) {
    DEFAULT_REGISTERED_USERS.forEach((user) => {
      usersMap.set(user.id, user);
    });
  }

  // 2. Load from localStorage registered users registry
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      const parsed: UserProfile[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((user) => {
          if (user && user.id) {
            // On deployed view, filter out cached demo users
            if (!isLocal && DEMO_USER_IDS.has(user.id)) {
              return;
            }
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
      if (current && current.id) {
        if (!isLocal && DEMO_USER_IDS.has(current.id)) {
          // ignore demo user on deployed URL
        } else {
          usersMap.set(current.id, current);
        }
      }
    }
  } catch (err) {
    // ignore
  }

  return Array.from(usersMap.values());
}

/**
 * Saves a new or updated user profile to the registry.
 */
export function saveRegisteredUser(user: UserProfile): void {
  if (typeof window === 'undefined' || !user) return;
  if (!isLocalUrl() && DEMO_USER_IDS.has(user.id)) return;

  const allUsers = getRegisteredUsers();
  const existingIndex = allUsers.findIndex(
    (u) =>
      u.id === user.id ||
      (user.phone && normalizePhoneNumber(u.phone) === normalizePhoneNumber(user.phone)) ||
      (user.email && u.email && normalizeEmail(u.email) === normalizeEmail(user.email))
  );

  if (existingIndex >= 0) {
    allUsers[existingIndex] = { ...allUsers[existingIndex], ...user };
  } else {
    allUsers.push(user);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allUsers));
  } catch (err) {
    console.error('[UserRegistry] Failed to save user to registry:', err);
  }
}

/**
 * Super Admin function: forces an update to any user record in the registry.
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
}

/**
 * Super Admin function: removes a user from the registry.
 */
export function deleteUserFromRegistry(userId: string): void {
  if (typeof window === 'undefined' || !userId) return;
  const allUsers = getRegisteredUsers().filter((u) => u.id !== userId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allUsers));
  } catch (err) {
    console.error('[UserRegistry] Failed to delete user from registry:', err);
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
 * Checks whether an account already exists with the given phone number or email address.
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
 * Finds a registered user by phone or email query.
 */
export function findUserByCredential(query: string): UserProfile | null {
  if (!query || !query.trim()) return null;
  const trimmed = query.trim();
  const isEmailQuery = trimmed.includes('@');
  const normPhone = normalizePhoneNumber(trimmed);
  const normEmail = normalizeEmail(trimmed);

  const registeredUsers = getRegisteredUsers();

  for (const user of registeredUsers) {
    if (isEmailQuery) {
      if (normalizeEmail(user.email) === normEmail) {
        return user;
      }
    } else {
      if (normalizePhoneNumber(user.phone) === normPhone) {
        return user;
      }
    }
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


