/**
 * Client Cache Sanitizer
 * Ensures that stale mock data (demo jobs, demo listings, stale user profiles) cached in
 * mobile or desktop browsers during previous visits is thoroughly purged on startup.
 */

const SYNC_VERSION_KEY = 'setlla_clean_slate_v8_purge';

export function runClientCacheSanitization(): void {
  if (typeof window === 'undefined') return;

  try {
    const currentVersion = localStorage.getItem(SYNC_VERSION_KEY);
    if (currentVersion === 'v8_purged') return;

    console.log('[Setlla] Performing complete clean slate purge v8...');

    // 1. Wipe all local advert caches (removes stale test adverts like Lvis Agency)
    ['setlla_adverts', 'deltarent_adverts', 'setlla_deleted_adverts', 'setlla_partner_api_keys', 'setlla_advertiser_user'].forEach((key) => {
      localStorage.removeItem(key);
    });

    // 2. Wipe all local job listings cache completely so device fetches fresh from Supabase
    localStorage.removeItem('setlla_job_listings');
    localStorage.removeItem('deltarent_job_listings');
    localStorage.removeItem('setlla_jobs');
    localStorage.removeItem('deltarent_jobs');
    localStorage.removeItem('setlla_job_applications');

    // 3. Wipe all local property listings cache completely so device fetches fresh from Supabase
    localStorage.removeItem('setlla_listings');
    localStorage.removeItem('deltarent_listings');

    // 4. Purge legacy mock users from local user registry cache
    ['setlla_registered_users', 'deltarent_registered_users'].forEach((key) => {
      localStorage.removeItem(key);
    });

    // 5. Wipe stale local bookings cache so device fetches fresh from Supabase
    localStorage.removeItem('setlla_bookings');
    localStorage.removeItem('deltarent_bookings');

    // 6. Purge stale local deletion tombstones
    ['setlla_deleted_user_ids', 'setlla_deleted_phones', 'setlla_deleted_emails'].forEach((key) => {
      localStorage.removeItem(key);
    });

    // 7. Clear user sessions for clean launch
    localStorage.removeItem('setlla_user');
    localStorage.removeItem('deltarent_user');
    localStorage.removeItem('setlla_auth');
    localStorage.removeItem('deltarent_auth');
    localStorage.removeItem('setlla_active_role');
    localStorage.removeItem('deltarent_active_role');
    localStorage.removeItem('setlla_active_view');
    localStorage.removeItem('deltarent_active_view');

    // 7. Purge any stale Service Worker caches from older versions
    if (typeof caches !== 'undefined') {
      caches.keys().then((names) => {
        names.forEach((name) => {
          if (name !== 'setlla-pwa-v9') {
            console.log('[Setlla] Purging legacy SW cache:', name);
            caches.delete(name);
          }
        });
      }).catch(() => {});
    }

    // 8. Mark client as synced to v8
    localStorage.setItem(SYNC_VERSION_KEY, 'v8_purged');
  } catch (err) {
    console.warn('[Setlla] Cache sanitizer notice:', err);
  }
}
