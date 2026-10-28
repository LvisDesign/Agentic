/**
 * Client Cache Sanitizer
 * Ensures that stale mock data (demo jobs, demo listings, stale user profiles) cached in
 * mobile or desktop browsers during previous visits is thoroughly purged on startup.
 */

const SYNC_VERSION_KEY = 'setlla_live_sync_v4';

export function runClientCacheSanitization(): void {
  if (typeof window === 'undefined') return;

  try {
    const currentVersion = localStorage.getItem(SYNC_VERSION_KEY);
    if (currentVersion === 'v4') return;

    console.log('[Setlla] Performing client cache purge v4 for live production sync...');

    // 1. Wipe all local job listings cache completely so device fetches fresh from Supabase
    localStorage.removeItem('setlla_job_listings');
    localStorage.removeItem('deltarent_job_listings');

    // 2. Wipe all local property listings cache completely so device fetches fresh from Supabase
    localStorage.removeItem('setlla_listings');
    localStorage.removeItem('deltarent_listings');

    // 3. Purge legacy mock users and deleted users from local user registry cache
    ['setlla_registered_users', 'deltarent_registered_users'].forEach((key) => {
      localStorage.removeItem(key);
    });

    // 4. Check active user session: if the stored user is a legacy demo account or was deleted, purge session
    try {
      const rawUser = localStorage.getItem('setlla_user') || localStorage.getItem('deltarent_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        const deletedIds = new Set(JSON.parse(localStorage.getItem('setlla_deleted_user_ids') || '[]'));

        // Elvis is protected and kept
        const isElvis = Boolean(
          u &&
          (u.email === 'admin@setlla.com' ||
            (u.phone && (u.phone.includes('09077056351') || u.phone.includes('7056351'))) ||
            u.fullName?.toLowerCase().includes('elvis'))
        );

        if (!isElvis && u && u.id) {
          const isMockUser =
            u.id === 'DT-USR-8492' ||
            u.id === 'DT-AGT-9012' ||
            u.email === 'chinedu.okafor@gmail.com' ||
            u.id.startsWith('mock-') ||
            u.id.startsWith('demo-') ||
            deletedIds.has(u.id);

          if (isMockUser) {
            console.log('[Setlla] Purging legacy/deleted user session from device:', u.id);
            localStorage.removeItem('setlla_user');
            localStorage.removeItem('deltarent_user');
            localStorage.removeItem('setlla_auth');
            localStorage.removeItem('deltarent_auth');
            localStorage.removeItem('setlla_active_role');
            localStorage.removeItem('deltarent_active_role');
          }
        }
      }
    } catch (_) {}

    // 5. Purge any stale Service Worker caches from older versions
    if (typeof caches !== 'undefined') {
      caches.keys().then((names) => {
        names.forEach((name) => {
          if (name !== 'setlla-pwa-v4') {
            console.log('[Setlla] Purging legacy SW cache:', name);
            caches.delete(name);
          }
        });
      }).catch(() => {});
    }

    // 6. Mark client as synced to v4
    localStorage.setItem(SYNC_VERSION_KEY, 'v4');
  } catch (err) {
    console.warn('[Setlla] Cache sanitizer notice:', err);
  }
}
