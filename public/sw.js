// Service Worker for DeltaRent Progressive Web App
// Handles static caching, offline fallback, web push notifications, and app badging API

const CACHE_NAME = 'deltarent-pwa-v1';
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

// 1. Install Event: Pre-cache static shell & activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn('[SW] Pre-caching partial failure:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Clean up stale caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Network-first for navigation with offline fallback, Cache-first for assets
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Ignore cross-origin non-http schemes (e.g. chrome-extension)
  if (!url.protocol.startsWith('http')) return;

  // Navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache fresh copy of navigation
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          // Network failed: try cache, or fallback to offline.html
          const cached = await caches.match(request);
          if (cached) return cached;
          const offlineFallback = await caches.match('/offline.html');
          return offlineFallback || new Response('Offline', { status: 503, statusText: 'Offline' });
        })
    );
    return;
  }

  // Static assets (CSS, JS, WebP, PNG, SVGs, Fonts)
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

  const title = data.title || 'Inspection Accepted by Lister';
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
    tag: data.tag || 'deltarent-inspection-alert',
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
