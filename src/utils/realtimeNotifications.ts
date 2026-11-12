/**
 * Setlla Real-Time Notification & Audio Alert Engine
 * Provides instant device notifications, audio chimes, and haptic feedback
 * across desktop and mobile devices without requiring third-party audio assets.
 */

import { getNotificationPreferences } from '../services/notificationService';

// Synthesize pleasant, clean notification chimes using the browser's native Web Audio API
export function playNotificationSound(type: 'success' | 'alert' | 'info' = 'alert'): void {
  if (typeof window === 'undefined') return;
  if (!getNotificationPreferences().soundEnabled) return;

  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'success') {
      // Pleasant high-pitch two-tone chime for confirmed bookings (D5 587Hz -> A5 880Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.12);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'alert') {
      // Urgent yet pleasant bell chime for new inspection requests (A4 440Hz -> E5 659Hz)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440.0, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.15);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.start(now);
      osc.stop(now + 0.5);
    } else {
      // Soft gentle bubble chime for new listings (C5 523Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch (err) {
    // Graceful fallback if audio is autoplay-restricted before user gesture
  }
}

/**
 * Native device vibration with safety checks
 */
export function triggerDeviceVibration(pattern: number[] = [150, 75, 150]): void {
  if (!getNotificationPreferences().vibrationEnabled) return;
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (_) {}
  }
}

/**
 * Shows an OS-level device notification (via Service Worker first for lock-screen & background reliability,
 * with fallback to standard Notification API).
 */
export async function showDeviceNotification(
  title: string,
  options?: NotificationOptions & { onClick?: () => void }
): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  const cleanTitle = title.replace(/^[🔔🎉✅⚠️🚀💼🏢]+\s*/, '').trim();

  // Trigger haptic vibration regardless
  triggerDeviceVibration();

  if (Notification.permission === 'granted') {
    const tag = options?.tag || `setlla-${cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
    const { onClick, ...restOptions } = options || {};

    // Increment OS app icon badge if supported (Android / iOS / Desktop PWA)
    if ('setAppBadge' in navigator) {
      try {
        (navigator as any).setAppBadge().catch(() => {});
      } catch (_) {}
    }

    // 1. Prefer Service Worker showNotification so alerts surface on mobile lock screens & backgrounded tabs
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && 'showNotification' in reg) {
          await reg.showNotification(cleanTitle, {
            icon: '/icons/icon-192x192.png',
            badge: '/icons/notification-badge.png',
            tag,
            renotify: true,
            vibrate: [200, 100, 200],
            data: {
              url: window.location.href,
              timestamp: Date.now(),
            },
            ...restOptions,
          } as NotificationOptions);
          return;
        }
      } catch (_) {
        // Fall through to standard Notification constructor
      }
    }

    // 2. Fallback: Standard Window Notification API
    try {
      const notification = new Notification(cleanTitle, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/notification-badge.png',
        tag,
        ...restOptions,
      });

      notification.onclick = () => {
        window.focus();
        onClick?.();
        notification.close();
      };
    } catch (_) {}
  }
}

/**
 * Requests device notification permissions with clean status response
 */
export async function requestDeviceNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    return await Notification.requestPermission();
  } catch (e) {
    return 'denied';
  }
}
