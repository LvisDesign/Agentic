/**
 * Setlla Listing Lifecycle & Proof-of-Life Verification Engine
 * 
 * Rules:
 * 1. 48-Hour Availability Check: After 48 hours from listing (or last confirmation),
 *    the lister receives an availability verification prompt.
 * 2. 72-Hour Auto-Delist: If the lister does not confirm availability by 72 hours,
 *    the listing is safely delisted from the public feed (preserved in agent dashboard for 1-tap renewal).
 * 3. 24-Hour Taken Cleanup: Listings marked as "Rented Out" or "Closed" remain visible for 24 hours
 *    as market proof of completed deals, and are then automatically purged.
 */

export const FRESHNESS_CHECK_HOURS = 48;
export const LISTING_MAX_ACTIVE_HOURS = 72;
export const TAKEN_CLEANUP_HOURS = 24;

export type LifecycleStage = 
  | 'fresh'
  | 'needs_confirmation'
  | 'expired'
  | 'taken_grace'
  | 'taken_expired'
  | 'deleted';

export interface ListingLifecycleInfo {
  stage: LifecycleStage;
  hoursSinceConfirmed: number;
  hoursUntilDelist: number;
  hoursSinceTaken?: number;
  hoursUntilTakenCleanup?: number;
  isPubliclyVisible: boolean;
  needsListerCheck: boolean;
  statusBadgeText: string;
  statusBadgeVariant: 'fresh' | 'warning' | 'expired' | 'taken';
}

interface CommonListingRecord {
  id: string;
  createdAt: string;
  lastConfirmedAt?: string;
  takenAt?: string;
  availabilityStatus?: string;
  status?: string;
  isArchived?: boolean;
}

/**
 * Computes exact lifecycle status, time windows, and visibility for any rental or job listing
 */
export function getListingLifecycleInfo(item: CommonListingRecord, nowMs: number = Date.now()): ListingLifecycleInfo {
  if (!item) {
    return {
      stage: 'deleted',
      hoursSinceConfirmed: 0,
      hoursUntilDelist: 0,
      isPubliclyVisible: false,
      needsListerCheck: false,
      statusBadgeText: 'Deleted',
      statusBadgeVariant: 'expired'
    };
  }

  // Explicit deletion or archival
  if (item.availabilityStatus === 'Deleted' || item.isArchived) {
    return {
      stage: 'deleted',
      hoursSinceConfirmed: 999,
      hoursUntilDelist: 0,
      isPubliclyVisible: false,
      needsListerCheck: false,
      statusBadgeText: 'Archived / Deleted',
      statusBadgeVariant: 'expired'
    };
  }

  const isTaken = item.availabilityStatus === 'Rented Out' || item.status === 'closed';

  if (isTaken) {
    const rawTakenTime = item.takenAt || item.lastConfirmedAt || item.createdAt;
    const takenTimeMs = rawTakenTime ? new Date(rawTakenTime).getTime() : nowMs;
    const safeTakenMs = isNaN(takenTimeMs) ? nowMs : takenTimeMs;
    const hoursSinceTaken = Math.max(0, (nowMs - safeTakenMs) / (1000 * 60 * 60));
    const hoursUntilTakenCleanup = Math.max(0, TAKEN_CLEANUP_HOURS - hoursSinceTaken);

    if (hoursSinceTaken >= TAKEN_CLEANUP_HOURS) {
      return {
        stage: 'taken_expired',
        hoursSinceConfirmed: 999,
        hoursUntilDelist: 0,
        hoursSinceTaken,
        hoursUntilTakenCleanup: 0,
        isPubliclyVisible: false,
        needsListerCheck: false,
        statusBadgeText: 'Auto-Deleted (Completed)',
        statusBadgeVariant: 'taken'
      };
    }

    return {
      stage: 'taken_grace',
      hoursSinceConfirmed: 0,
      hoursUntilDelist: 0,
      hoursSinceTaken,
      hoursUntilTakenCleanup,
      isPubliclyVisible: true,
      needsListerCheck: false,
      statusBadgeText: `Taken (${Math.ceil(hoursUntilTakenCleanup)}h display left)`,
      statusBadgeVariant: 'taken'
    };
  }

  // Active / Available listing
  const rawConfirmedTime = item.lastConfirmedAt || item.createdAt;
  const confirmedTimeMs = rawConfirmedTime ? new Date(rawConfirmedTime).getTime() : nowMs;
  const safeConfirmedMs = isNaN(confirmedTimeMs) ? nowMs : confirmedTimeMs;
  const hoursSinceConfirmed = Math.max(0, (nowMs - safeConfirmedMs) / (1000 * 60 * 60));
  const hoursUntilDelist = Math.max(0, LISTING_MAX_ACTIVE_HOURS - hoursSinceConfirmed);

  if (hoursSinceConfirmed >= LISTING_MAX_ACTIVE_HOURS) {
    return {
      stage: 'expired',
      hoursSinceConfirmed,
      hoursUntilDelist: 0,
      isPubliclyVisible: false,
      needsListerCheck: false,
      statusBadgeText: 'Delisted (72h expired)',
      statusBadgeVariant: 'expired'
    };
  }

  if (hoursSinceConfirmed >= FRESHNESS_CHECK_HOURS) {
    const remainingHours = Math.ceil(hoursUntilDelist);
    return {
      stage: 'needs_confirmation',
      hoursSinceConfirmed,
      hoursUntilDelist,
      isPubliclyVisible: true,
      needsListerCheck: true,
      statusBadgeText: `Confirm Available (${remainingHours}h left)`,
      statusBadgeVariant: 'warning'
    };
  }

  const hoursUntilCheck = Math.ceil(FRESHNESS_CHECK_HOURS - hoursSinceConfirmed);
  return {
    stage: 'fresh',
    hoursSinceConfirmed,
    hoursUntilDelist,
    isPubliclyVisible: true,
    needsListerCheck: false,
    statusBadgeText: `Verified Active (${hoursUntilCheck}h until check)`,
    statusBadgeVariant: 'fresh'
  };
}

/**
 * Fast boolean check for whether a listing should render in the public search/explore feeds
 */
export function isListingVisibleInPublicFeed(item: CommonListingRecord, nowMs: number = Date.now()): boolean {
  const info = getListingLifecycleInfo(item, nowMs);
  return info.isPubliclyVisible;
}

/**
 * Filter a list of listings to only those currently active in public feeds
 */
export function filterPublicActiveListings<T extends CommonListingRecord>(listings: T[], nowMs: number = Date.now()): T[] {
  if (!Array.isArray(listings)) return [];
  return listings.filter((item) => isListingVisibleInPublicFeed(item, nowMs));
}

