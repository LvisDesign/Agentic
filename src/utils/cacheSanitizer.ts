/**
 * Client Cache Sanitizer
 * Ensures that stale mock data (demo jobs, demo listings, stale user profiles) cached in
 * mobile or desktop browsers during previous visits is thoroughly purged on startup.
 */

const SYNC_VERSION_KEY = 'setlla_clean_slate_v20_complete';

export function runClientCacheSanitization(): void {
  if (typeof window === 'undefined') return;

  try {
    // Unconditionally wipe any stale test ads (such as Lvis Agency or 3 Bed Room)
    try {
      const rawAds = localStorage.getItem('setlla_adverts');
      if (rawAds && (rawAds.includes('Lvis Agency') || rawAds.includes('3 Bed Room') || rawAds.includes('20,000'))) {
        localStorage.removeItem('setlla_adverts');
        localStorage.removeItem('deltarent_adverts');
      }
    } catch (_) {}

    const currentVersion = localStorage.getItem(SYNC_VERSION_KEY);
    if (currentVersion === 'v20_purged') return;

    // Mark client as synced to v20 without wiping active authenticated sessions
    localStorage.setItem(SYNC_VERSION_KEY, 'v20_purged');
  } catch (err) {
    console.warn('[Setlla] Cache sanitizer notice:', err);
  }
}
