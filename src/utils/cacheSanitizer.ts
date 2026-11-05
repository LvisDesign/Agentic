/**
 * Client Cache Sanitizer
 * Ensures that stale mock data (demo jobs, demo listings, stale user profiles) cached in
 * mobile or desktop browsers during previous visits is thoroughly purged on startup.
 */

const SYNC_VERSION_KEY = 'setlla_clean_slate_v20_complete';

export function runClientCacheSanitization(): void {
  if (typeof window === 'undefined') return;

  try {
    // 0. Complete Unconditional Session Purge:
    // Only admin@setlla.com survives. Any legacy accounts (e.g. Obaro Uti, Fgag, demo agents, test users) are wiped.
    try {
      const rawUser = localStorage.getItem('setlla_user') || localStorage.getItem('deltarent_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        const email = (u?.email || '').toLowerCase().trim();
        const isOfficialSuperAdmin = (email === 'admin@setlla.com' || u?.id === 'DT-ADMIN-ELVIS');
        if (!isOfficialSuperAdmin) {
          console.log('[Setlla] Clean Slate: Purged legacy user session from device:', u.fullName || email || u.id);
          [
            'setlla_user', 'deltarent_user',
            'setlla_auth', 'deltarent_auth',
            'setlla_active_role', 'deltarent_active_role',
            'setlla_active_view', 'deltarent_active_view',
            'setlla_active_room', 'setlla_registered_users',
            'deltarent_registered_users', 'setlla_adverts', 'deltarent_adverts',
            'setlla_last_email', 'setlla_last_phone'
          ].forEach((k) => localStorage.removeItem(k));
        }
      }
    } catch (_) {}

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

    console.log('[Setlla] Performing complete clean slate purge v20...');

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
    ['setlla_registered_users', 'deltarent_registered_users', 'setlla_last_email', 'setlla_last_phone'].forEach((key) => {
      localStorage.removeItem(key);
    });

    // 5. Wipe stale local bookings cache so device fetches fresh from Supabase
    localStorage.removeItem('setlla_bookings');
    localStorage.removeItem('deltarent_bookings');

    // 6. Purge stale local deletion tombstones
    ['setlla_deleted_user_ids', 'setlla_deleted_phones', 'setlla_deleted_emails'].forEach((key) => {
      localStorage.removeItem(key);
    });

    // 7. Clear non-admin user sessions for clean launch
    const rawCheck = localStorage.getItem('setlla_user') || localStorage.getItem('deltarent_user');
    let isSuperAdmin = false;
    if (rawCheck) {
      try {
        const u = JSON.parse(rawCheck);
        if (u && (u.email === 'admin@setlla.com' || u.id === 'DT-ADMIN-ELVIS')) {
          isSuperAdmin = true;
        }
      } catch (_) {}
    }
    if (!isSuperAdmin) {
      localStorage.removeItem('setlla_user');
      localStorage.removeItem('deltarent_user');
      localStorage.removeItem('setlla_auth');
      localStorage.removeItem('deltarent_auth');
      localStorage.removeItem('setlla_active_role');
      localStorage.removeItem('deltarent_active_role');
      localStorage.removeItem('setlla_active_view');
      localStorage.removeItem('deltarent_active_view');
    }

    // 8. Mark client as synced to v20
    localStorage.setItem(SYNC_VERSION_KEY, 'v20_purged');
  } catch (err) {
    console.warn('[Setlla] Cache sanitizer notice:', err);
  }
}
