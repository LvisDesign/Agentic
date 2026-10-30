/**
 * Setlla Listing Lifecycle & Freshness Guarantee Service
 * 
 * Rules:
 * 1. 48-Hour Check: After 48 hours without confirmation, a lister gets a check notification
 *    to confirm if the listing is still available.
 * 2. 72-Hour Auto-Delist: If the lister does not confirm by 72 hours, the listing is automatically
 *    delisted from the public feed (status = 'Expired'). The lister can renew/relist it in 1 tap.
 * 3. 24-Hour Taken Grace Period: When a listing is marked 'Rented Out' or 'closed', it is showcased
 *    on the platform for 24 hours as social proof, then automatically purged from the public feed.
 */

export const LIFECYCLE_HOURS_CHECK = 48;
export const LIFECYCLE_HOURS_EXPIRE = 72;
export const LIFECYCLE_HOURS_TAKEN_PURGE = 24;

export const MS_IN_HOUR = 60 * 60 * 1000;

export type ListingLifecycleState = 
  | 'active'          // Within 0 - 48 hours: Fresh & live
  | 'due_for_check'    // Between 48 - 72 hours: Needs lister confirmation
  | 'expired'         // >= 72 hours without confirmation: Delisted from public feed
  | 'taken_grace'     // Marked taken/rented within last 24 hours: Displayed as social proof
  | 'taken_purged'    // Marked taken/rented > 24 hours: Hidden permanently from feed
  | 'archived'
  | 'deleted';

export interface LifecycleItem {
  id?: string;
  createdAt?: string;
  lastConfirmedAt?: string;
  takenAt?: string;
  closedAt?: string;
  availabilityStatus?: string;
  status?: string;
  isArchived?: boolean;
}

/**
 * Returns the effective last active/confirmed timestamp in epoch ms.
 */
export function getLastConfirmedTimestamp(item: LifecycleItem): number {
  if (item.lastConfirmedAt) {
    const t = new Date(item.lastConfirmedAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (item.createdAt) {
    const t = new Date(item.createdAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  return Date.now();
}

/**
 * Returns the timestamp when the listing was marked taken/rented/closed.
 */
export function getTakenTimestamp(item: LifecycleItem): number | null {
  const raw = item.takenAt || item.closedAt;
  if (raw) {
    const t = new Date(raw).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  return null;
}

/**
 * Calculates the current lifecycle state of any rental or job listing.
 */
export function getListingLifecycleState(item: LifecycleItem, now: number = Date.now()): ListingLifecycleState {
  if (!item) return 'deleted';

  // Explicit Deleted / Archived status
  if (item.availabilityStatus === 'Deleted' || item.status === 'deleted') {
    return 'deleted';
  }
  if (item.isArchived) {
    return 'archived';
  }

  // Taken / Rented Out / Closed Vacancies
  const isTaken = item.availabilityStatus === 'Rented Out' || item.status === 'closed';
  if (isTaken) {
    const takenTime = getTakenTimestamp(item);
    if (!takenTime) {
      // If takenAt timestamp was not recorded yet, consider it in grace period
      return 'taken_grace';
    }
    const elapsedTaken = now - takenTime;
    if (elapsedTaken >= LIFECYCLE_HOURS_TAKEN_PURGE * MS_IN_HOUR) {
      return 'taken_purged';
    }
    return 'taken_grace';
  }

  // Explicit Expired status
  if (item.availabilityStatus === 'Expired' || item.status === 'expired') {
    return 'expired';
  }

  // Calculate elapsed time from last confirmation or listing date
  const lastActive = getLastConfirmedTimestamp(item);
  const elapsed = now - lastActive;

  if (elapsed >= LIFECYCLE_HOURS_EXPIRE * MS_IN_HOUR) {
    return 'expired';
  }

  if (elapsed >= LIFECYCLE_HOURS_CHECK * MS_IN_HOUR) {
    return 'due_for_check';
  }

  return 'active';
}

/**
 * Checks whether the listing should be shown on the public continuous feed.
 */
export function isListingVisibleOnPublicFeed(item: LifecycleItem, now: number = Date.now()): boolean {
  const state = getListingLifecycleState(item, now);
  // Only active, due_for_check, and taken listings within their 24h grace period are visible
  return state === 'active' || state === 'due_for_check' || state === 'taken_grace';
}

/**
 * Returns remaining hours until 72h auto-delist occurs.
 */
export function getRemainingHoursUntilExpire(item: LifecycleItem, now: number = Date.now()): number {
  const lastActive = getLastConfirmedTimestamp(item);
  const totalAllowed = LIFECYCLE_HOURS_EXPIRE * MS_IN_HOUR;
  const remainingMs = totalAllowed - (now - lastActive);
  return Math.max(0, Math.ceil(remainingMs / MS_IN_HOUR));
}

/**
 * Returns remaining hours until the 24h taken purge occurs.
 */
export function getRemainingHoursUntilTakenPurge(item: LifecycleItem, now: number = Date.now()): number {
  const takenTime = getTakenTimestamp(item);
  if (!takenTime) return LIFECYCLE_HOURS_TAKEN_PURGE;
  const totalAllowed = LIFECYCLE_HOURS_TAKEN_PURGE * MS_IN_HOUR;
  const remainingMs = totalAllowed - (now - takenTime);
  return Math.max(0, Math.ceil(remainingMs / MS_IN_HOUR));
}

/**
 * Pinned Policy Information for listers
 */
export const SETLLA_FRESHNESS_POLICY = {
  title: 'Setlla 72-Hour Freshness Guarantee',
  shortSummary: 'To prevent ghost listings and maintain 100% verified availability, listings require confirmation every 48 hours.',
  fullDescription: 
    'All rental properties and job vacancies on Setlla remain active for 72 hours. ' +
    'After 48 hours, you will receive an availability check notification. ' +
    'Confirming availability extends the listing for another 48 hours. ' +
    'If unconfirmed at 72 hours, the listing is delisted from public search until renewed in 1 tap. ' +
    'Listings marked "Rented Out" or "Closed" remain visible for 24 hours as social proof, then are automatically purged.',
};
