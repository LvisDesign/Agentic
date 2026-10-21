// Service Worker for Setlla Progressive Web App (setlla.com)
// Handles static caching, offline fallback, web push notifications, and app badging API

const CACHE_NAME = 'setlla-pwa-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon.svg',
];

// Badge counter state within SW lifecycle
let currentBadgeCount = 0;

// Listen for SKIP_WAITING message to immediately take over
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 1. Install Event: Pre-cache static shell & activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn('[SW] Pre-caching partial failure:', err);
        });
      })
  );
});

// 2. Activate Event: Clean up stale caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              console.log('[SW] Purging stale cache:', name);
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Network-first for navigation & code, Cache-first for static media only
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Ignore cross-origin non-http schemes (e.g. chrome-extension)
  if (!url.protocol.startsWith('http')) return;

  // Never intercept or cache localhost development, Supabase storage/REST, or API calls
  if (
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1' ||
    url.hostname.includes('supabase.co') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('/@vite/') ||
    url.pathname.includes('/@fs/')
  ) {
    return;
  }

  // Navigation requests (HTML pages): Network First with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const offlineFallback = await caches.match('/offline.html');
          return offlineFallback || new Response('Offline', { status: 503, statusText: 'Offline' });
        })
    );
    return;
  }

  // For HTML, JS scripts, CSS stylesheets, Vite bundles: STRICT Network First so updates are instant
  const isCodeAsset =
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('.tsx') ||
    url.pathname.includes('/assets/');

  if (isCodeAsset) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || new Response('Offline', { status: 503 });
        })
    );
    return;
  }

  // Static media assets (Images, SVGs, Fonts)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached and update cache in background (Stale-While-Revalidate)
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      });
    })
  );
});

// 4. Web Push Notification Event Listener
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: event.data.text() };
    }
  }

  const title = data.title || 'Inspection Accepted by Agent';
  const options = {
    body: data.body || 'Your physical apartment inspection pass has been confirmed with direct agent phone coordinates.',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      inspectionId: data.inspectionId || null,
      timestamp: Date.now(),
    },
    actions: [
      { action: 'open_pass', title: 'View Pass' },
      { action: 'dismiss', title: 'Close' },
    ],
    tag: data.tag || 'setlla-inspection-alert',
    renotify: true,
  };

  // Sync dynamic badge count
  currentBadgeCount += 1;
  if ('setAppBadge' in navigator) {
    navigator.setAppBadge(data.badgeCount || currentBadgeCount).catch(() => {});
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

// 5. Notification Click Event Listener (Deep-linking)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  // If user clicked dismiss action, just close
  if (event.action === 'dismiss') {
    return;
  }

  // Open or focus application window to deep-link
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If window already open, focus it and navigate
        for (const client of clientList) {
          if (client.url && 'focus' in client) {
            client.focus();
            if ('navigate' in client && targetUrl !== '/') {
              client.navigate(targetUrl);
            }
            return;
          }
        }
        // If not open, open a new window
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
      .then(() => {
        // Clear app badge upon opening the notification
        currentBadgeCount = 0;
        if ('clearAppBadge' in navigator) {
          return navigator.clearAppBadge().catch(() => {});
        }
      })
  );
});

// 6. Message Event: Sync with Client UI (Badge clearing, manual checks, etc.)
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'SET_BADGE') {
    const count = event.data.count || 1;
    currentBadgeCount = count;
    if ('setAppBadge' in navigator) {
      navigator.setAppBadge(count).catch(() => {});
    }
  } else if (event.data.type === 'CLEAR_BADGE') {
    currentBadgeCount = 0;
    if ('clearAppBadge' in navigator) {
      navigator.clearAppBadge().catch(() => {});
    }
  }
});
