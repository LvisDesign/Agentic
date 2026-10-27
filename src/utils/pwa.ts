import { useState, useEffect, useMemo, useCallback } from 'react';

// PWA (Progressive Web App) Utility Module
// Provides Service Worker registration, Web Push subscription, App Badging, and installation helpers

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<(prompt: BeforeInstallPromptEvent | null) => void>();

let globalUpdateAvailable = false;
const updateListeners = new Set<(hasUpdate: boolean) => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    promptListeners.forEach((fn) => fn(globalDeferredPrompt));
  });

  window.addEventListener('appinstalled', () => {
    try {
      localStorage.setItem('setlla_pwa_installed', 'true');
    } catch (_) {}
    globalDeferredPrompt = null;
    promptListeners.forEach((fn) => fn(null));
  });
}

export function getDeferredPrompt(): BeforeInstallPromptEvent | null {
  return globalDeferredPrompt;
}

export function subscribePrompt(fn: (prompt: BeforeInstallPromptEvent | null) => void): () => void {
  promptListeners.add(fn);
  fn(globalDeferredPrompt);
  return () => {
    promptListeners.delete(fn);
  };
}

/**
 * Checks if an application update is currently available
 */
export function isAppUpdateAvailable(): boolean {
  return globalUpdateAvailable;
}

/**
 * Subscribes to application update availability changes
 */
export function subscribeUpdate(fn: (hasUpdate: boolean) => void): () => void {
  updateListeners.add(fn);
  fn(globalUpdateAvailable);
  return () => {
    updateListeners.delete(fn);
  };
}

/**
 * Notifies all subscribers that an app update is available
 */
export function notifyUpdateAvailable(isAvailable: boolean = true): void {
  globalUpdateAvailable = isAvailable;
  updateListeners.forEach((fn) => fn(isAvailable));
}

/**
 * Applies the available update by signaling the waiting service worker
 * to skip waiting and reloading the client with fresh assets
 */
export function applyAppUpdate(): void {
  if (typeof window === 'undefined') return;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg?.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      } else {
        window.location.reload();
      }
    }).catch(() => {
      window.location.reload();
    });
  } else {
    window.location.reload();
  }
}

/**
 * Checks for updates from the service worker registration
 */
export async function checkForAppUpdate(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
      await reg.update();
      if (reg.waiting) {
        notifyUpdateAvailable(true);
        return true;
      }
    }
    return globalUpdateAvailable;
  } catch (_) {
    return false;
  }
}

export async function triggerPWAInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!globalDeferredPrompt) {
    return 'unavailable';
  }
  try {
    await globalDeferredPrompt.prompt();
    const choice = await globalDeferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      try {
        localStorage.setItem('setlla_pwa_installed', 'true');
      } catch (_) {}
      globalDeferredPrompt = null;
      promptListeners.forEach((fn) => fn(null));
    }
    return choice.outcome;
  } catch (err) {
    console.error('[PWA] Error launching install prompt:', err);
    return 'unavailable';
  }
}

/**
 * React hook to reactively track PWA installation state, device installation presence,
 * and pending updates
 */
export function usePWA() {
  const [standalone, setStandalone] = useState<boolean>(() => isStandalone());
  const [isInstalled, setIsInstalled] = useState<boolean>(() => isAppInstalled());
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(() => isAppUpdateAvailable());
  const [hasPrompt, setHasPrompt] = useState<boolean>(() => Boolean(globalDeferredPrompt));
  const isApple = useMemo(() => isIOS(), []);

  useEffect(() => {
    // Check device installation asynchronously (via getInstalledRelatedApps)
    checkDeviceHasAppInstalled().then((installed) => {
      if (installed) {
        setIsInstalled(true);
      }
    });

    const unsubPrompt = subscribePrompt((p) => {
      setHasPrompt(Boolean(p));
      setStandalone(isStandalone());
      setIsInstalled(isAppInstalled());
    });

    const unsubUpdate = subscribeUpdate((hasUp) => {
      setUpdateAvailable(hasUp);
    });

    const checkStandalone = () => {
      setStandalone(isStandalone());
      setIsInstalled(isAppInstalled());
    };

    const handleAppInstalled = () => {
      try {
        localStorage.setItem('setlla_pwa_installed', 'true');
      } catch (_) {}
      setIsInstalled(true);
      setStandalone(isStandalone());
    };

    if (typeof window !== 'undefined') {
      const mql = window.matchMedia('(display-mode: standalone)');
      mql.addEventListener('change', checkStandalone);
      window.addEventListener('appinstalled', handleAppInstalled);

      return () => {
        unsubPrompt();
        unsubUpdate();
        mql.removeEventListener('change', checkStandalone);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }

    return () => {
      unsubPrompt();
      unsubUpdate();
    };
  }, []);

  const installApp = useCallback(async () => {
    const outcome = await triggerPWAInstall();
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    return outcome;
  }, []);

  const applyUpdate = useCallback(() => {
    applyAppUpdate();
  }, []);

  const checkForUpdates = useCallback(async () => {
    return await checkForAppUpdate();
  }, []);

  return {
    isStandalone: standalone,
    isInstalled,
    canInstall: !isInstalled && !standalone,
    hasPrompt,
    isIOS: isApple,
    updateAvailable,
    installApp,
    applyUpdate,
    checkForUpdates,
  };
}

export interface PWAState {
  isSupported: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  permission: NotificationPermission;
  hasPushManager: boolean;
}

/**
 * Checks if the current app is running in standalone PWA mode
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Checks if the device already has Setlla PWA installed (running standalone,
 * marked in persistent storage after installation, or detected via getInstalledRelatedApps)
 */
export function isAppInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  if (isStandalone()) return true;
  try {
    if (localStorage.getItem('setlla_pwa_installed') === 'true') {
      return true;
    }
  } catch (_) {}
  return false;
}

/**
 * Queries the device asynchronously using navigator.getInstalledRelatedApps
 * to detect if Setlla is already installed on the OS level (Chrome, Edge, Android)
 */
export async function checkDeviceHasAppInstalled(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (isAppInstalled()) return true;

  if ('getInstalledRelatedApps' in navigator) {
    try {
      const relatedApps = await (navigator as unknown as { getInstalledRelatedApps: () => Promise<unknown[]> }).getInstalledRelatedApps();
      if (Array.isArray(relatedApps) && relatedApps.length > 0) {
        try {
          localStorage.setItem('setlla_pwa_installed', 'true');
        } catch (_) {}
        return true;
      }
    } catch (_) {}
  }
  return false;
}

/**
 * Detects whether device is running iOS (iPhone / iPad / iPod)
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent.toLowerCase();
  return (
    /iphone|ipad|ipod/.test(userAgent) ||
    (window.navigator.maxTouchPoints > 1 && /macintosh/.test(userAgent))
  );
}

/**
 * Registers the Service Worker in public/sw.js
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  // In local development or on localhost, DO NOT register service workers.
  // Unregister any existing service worker and purge all cache storage so Vite HMR works instantly.
  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '[::1]' ||
    import.meta.env.DEV;

  if (isLocalhost) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch (err) {
      console.warn('[PWA] Dev cache cleanup notice:', err);
    }
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    // Check if there is already a waiting service worker on register
    if (registration.waiting) {
      notifyUpdateAvailable(true);
    }

    // When an updated service worker is found, notify subscribers
    registration.addEventListener('updatefound', () => {
      const installingWorker = registration.installing;
      if (installingWorker) {
        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[PWA] New version ready! Update available.');
            notifyUpdateAvailable(true);
          }
        });
      }
    });

    // Check for updates on window focus
    window.addEventListener('focus', () => {
      registration.update().catch(() => {});
    });

    // Auto-reload the page when the new service worker takes control (after SKIP_WAITING)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    return registration;
  } catch (error) {
    console.warn('[PWA] Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Gets the current Notification permission
 */
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Requests Notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Clear badge upon granting permission
      clearAppBadge();
      // Try to register push manager subscription
      await subscribeToPushNotifications();
    }
    return permission;
  } catch (error) {
    console.error('[PWA] Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * Automatically requests and activates notification permissions if not already decided,
 * or verifies active push registration if already granted.
 */
export async function autoEnableNotifications(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    clearAppBadge();
    subscribeToPushNotifications().catch(() => {});
    return 'granted';
  }

  if (Notification.permission === 'default') {
    return await requestNotificationPermission();
  }

  return Notification.permission;
}

/**
 * Subscribes to Push Notifications via PushManager
 */
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if (!registration.pushManager) {
      console.warn('[PWA] PushManager not available in this browser');
      return null;
    }

    // Check existing subscription
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      // Subscribe user for push payloads
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        // Using a standard client-safe dummy applicationServerKey fallback if backend VAPID isn't set
        applicationServerKey: urlBase64ToUint8Array(
          'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
        ) as unknown as BufferSource,
      });
    }

    return subscription;
  } catch (error) {
    console.warn('[PWA] Push subscription notice:', error);
    return null;
  }
}

/**
 * Converts a Base64 string to Uint8Array for VAPID applicationServerKey
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Sets the App Badging API count on the home screen icon
 */
export async function setAppBadge(count: number): Promise<void> {
  if (typeof window === 'undefined') return;

  // Modern Badging API
  if ('setAppBadge' in navigator) {
    try {
      await (navigator as unknown as { setAppBadge: (c: number) => Promise<void> }).setAppBadge(count);
    } catch {
      // Fallback: Notify SW
      notifySW({ type: 'SET_BADGE', count });
    }
  } else {
    notifySW({ type: 'SET_BADGE', count });
  }
}

/**
 * Clears the App Badging API count on the home screen icon
 */
export async function clearAppBadge(): Promise<void> {
  if (typeof window === 'undefined') return;

  if ('clearAppBadge' in navigator) {
    try {
      await (navigator as unknown as { clearAppBadge: () => Promise<void> }).clearAppBadge();
    } catch {
      notifySW({ type: 'CLEAR_BADGE' });
    }
  } else {
    notifySW({ type: 'CLEAR_BADGE' });
  }
}

/**
 * Helper to post message to the active Service Worker
 */
function notifySW(message: Record<string, unknown>) {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
  }
}
