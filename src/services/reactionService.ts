import { getSupabaseClient, isSupabaseConfigured, invalidateCache } from '../utils/supabaseClient';
import { broadcastRealtimeEvent } from './realtimeSync';

const STARRED_IDS_STORAGE_KEY = 'setlla_starred_item_ids';
const STAR_COUNTS_CACHE_KEY = 'setlla_star_counts_cache';
const STAR_TAG_PREFIX = '__stars:';

/**
 * Extracts the persisted star count from a listing's tags array (if present)
 */
export function extractStarCountFromTags(tags?: string[]): number {
  if (!Array.isArray(tags)) return 0;
  for (const tag of tags) {
    if (typeof tag === 'string' && tag.startsWith(STAR_TAG_PREFIX)) {
      const parsed = parseInt(tag.slice(STAR_TAG_PREFIX.length), 10);
      if (!isNaN(parsed) && parsed >= 0) {
        return parsed;
      }
    }
  }
  return 0;
}

/**
 * Returns a new tags array with the updated __stars:<count> tag
 */
export function injectStarCountIntoTags(tags: string[] | undefined, count: number): string[] {
  const cleanTags = (tags || []).filter(
    (t) => typeof t === 'string' && !t.startsWith(STAR_TAG_PREFIX)
  );
  if (count > 0) {
    return [...cleanTags, `${STAR_TAG_PREFIX}${count}`];
  }
  return cleanTags;
}

/**
 * Returns the set of item IDs that the current user/device has starred
 */
export function getUserStarredIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STARRED_IDS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch (e) {}
  return new Set();
}

export function isItemStarredByUser(itemId: string): boolean {
  return getUserStarredIds().has(itemId);
}

function getLocalStarCountsCache(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STAR_COUNTS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (e) {}
  return {};
}

function saveLocalStarCount(itemId: string, count: number): void {
  if (typeof window === 'undefined') return;
  try {
    const cache = getLocalStarCountsCache();
    cache[itemId] = Math.max(0, count);
    localStorage.setItem(STAR_COUNTS_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {}
}

/**
 * Resolves the current star count for a listing or job, combining cloud tags and local cache
 */
export function getInitialStarCount(itemId: string, tags?: string[]): { count: number; isStarred: boolean } {
  const isStarred = isItemStarredByUser(itemId);
  const tagCount = extractStarCountFromTags(tags);
  const localCache = getLocalStarCountsCache();
  const cachedCount = typeof localCache[itemId] === 'number' ? localCache[itemId] : 0;

  let count = Math.max(tagCount, cachedCount);
  if (isStarred && count === 0) {
    count = 1;
  }
  return { count, isStarred };
}

/**
 * Toggles a user's star reaction on a property or job card and syncs the count to Supabase
 */
export async function toggleStarReaction(
  itemId: string,
  currentCount: number,
  currentTags?: string[]
): Promise<{ count: number; isStarred: boolean }> {
  const starredSet = getUserStarredIds();
  const wasStarred = starredSet.has(itemId);
  const nextIsStarred = !wasStarred;
  const nextCount = Math.max(0, wasStarred ? currentCount - 1 : currentCount + 1);

  if (nextIsStarred) {
    starredSet.add(itemId);
  } else {
    starredSet.delete(itemId);
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STARRED_IDS_STORAGE_KEY, JSON.stringify(Array.from(starredSet)));
    } catch (e) {}
  }

  saveLocalStarCount(itemId, nextCount);

  // Sync updated star count to Supabase `listings` table via tags array
  const client = getSupabaseClient();
  if (isSupabaseConfigured() && client) {
    try {
      let existingTags = currentTags;
      if (!existingTags) {
        const { data } = await client
          .from('listings')
          .select('tags')
          .eq('id', itemId)
          .maybeSingle();
        if (data && Array.isArray(data.tags)) {
          existingTags = data.tags;
        }
      }
      const updatedTags = injectStarCountIntoTags(existingTags, nextCount);
      await client
        .from('listings')
        .update({ tags: updatedTags })
        .eq('id', itemId);

      invalidateCache('listings_');
      broadcastRealtimeEvent('LISTING_UPDATED', { listingId: itemId });
    } catch (err) {
      // Non-blocking fallback to local state
    }
  }

  return { count: nextCount, isStarred: nextIsStarred };
}
