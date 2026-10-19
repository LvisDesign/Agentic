import { UserProfile } from '../types/marketplace';

// Default seeded accounts for instant marketplace testing
export const DEFAULT_REGISTERED_USERS: UserProfile[] = [
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
    savedListingIds: [],
    createdAt: '2026-10-01T10:00:00.000Z',
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
];

const STORAGE_KEY = 'deltarent_registered_users';

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

/**
 * Retrieves all registered users from storage and defaults.
 */
export function getRegisteredUsers(): UserProfile[] {
  if (typeof window === 'undefined') return DEFAULT_REGISTERED_USERS;

  const usersMap = new Map<string, UserProfile>();

  // 1. Seed defaults
  DEFAULT_REGISTERED_USERS.forEach((user) => {
    usersMap.set(user.id, user);
  });

  // 2. Load from localStorage registered users registry
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: UserProfile[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((user) => {
          if (user && user.id) {
            usersMap.set(user.id, user);
          }
        });
      }
    }
  } catch (err) {
    console.warn('[UserRegistry] Failed to parse registered users:', err);
  }

  // 3. Include currently active user from deltarent_user if present
  try {
    const rawCurrent = localStorage.getItem('deltarent_user');
    if (rawCurrent) {
      const current: UserProfile = JSON.parse(rawCurrent);
      if (current && current.id) {
        usersMap.set(current.id, current);
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
