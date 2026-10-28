/**
 * Client Cache Sanitizer
 * Ensures that stale mock data (demo jobs, demo listings, stale user profiles) cached in
 * mobile or desktop browsers during previous visits is thoroughly purged on startup.
 */

const SYNC_VERSION_KEY = 'setlla_live_sync_v3';

export function runClientCacheSanitization(): void {
  if (typeof window === 'undefined') return;

  try {
    const currentVersion = localStorage.getItem(SYNC_VERSION_KEY);
    if (currentVersion === 'v3') return;

    console.log('[Setlla] Performing one-time client cache purge for live production sync...');

    // 1. Purge stale mock jobs from local storage
    const rawJobs = localStorage.getItem('setlla_job_listings');
    if (rawJobs) {
      try {
        const jobs = JSON.parse(rawJobs);
        if (Array.isArray(jobs)) {
          const realJobs = jobs.filter(
            (j: any) => j && j.id && !j.id.startsWith('job-asaba-') && !j.id.startsWith('job-warri-')
          );
          localStorage.setItem('setlla_job_listings', JSON.stringify(realJobs));
        }
      } catch (_) {
        localStorage.removeItem('setlla_job_listings');
      }
    }

    // 2. Purge stale demo / archived listings from local storage
    const rawListings = localStorage.getItem('setlla_listings');
    if (rawListings) {
      try {
        const listings = JSON.parse(rawListings);
        if (Array.isArray(listings)) {
          const realListings = listings.filter(
            (l: any) =>
              l &&
              l.id &&
              !l.id.startsWith('prop-asaba-') &&
              !l.id.startsWith('prop-warri-') &&
              l.id !== 'prop-agent-1792514767602' &&
              l.availabilityStatus !== 'Deleted' &&
              l.availabilityStatus !== 'Archived'
          );
          localStorage.setItem('setlla_listings', JSON.stringify(realListings));
        }
      } catch (_) {
        localStorage.removeItem('setlla_listings');
      }
    }

    // 3. Mark client as synced to v3
    localStorage.setItem(SYNC_VERSION_KEY, 'v3');
  } catch (err) {
    console.warn('[Setlla] Cache sanitizer notice:', err);
  }
}
