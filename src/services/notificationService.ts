import { UserProfile } from '../types/marketplace';
import { normalizeEmail, normalizePhoneNumber } from '../utils/userRegistry';

export type SetllaNotificationCategory =
  | 'inspection_request'
  | 'inspection_confirmed'
  | 'inspection_declined'
  | 'new_listing'
  | 'listing_published'
  | 'listing_updated'
  | 'job_published'
  | 'job_application_received'
  | 'job_status_updated'
  | 'advert_status'
  | 'freshness_reminder'
  | 'account_deleted'
  | 'general';

export interface SetllaNotificationItem {
  id: string;
  eventKey?: string;
  title: string;
  body: string;
  type: SetllaNotificationCategory;
  createdAt: string;
  isRead: boolean;
  recipientId?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  isBroadcast?: boolean;
  propertyId?: string;
  bookingId?: string;
  jobId?: string;
  applicationId?: string;
  actionLabel?: string;
}

export interface NotificationPreferences {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  pushBannerEnabled: boolean;
}

const NOTIFICATIONS_STORAGE_KEY = 'setlla_notifications_inbox_v1';
const NOTIFICATION_PREFS_KEY = 'setlla_notification_prefs_v1';
const MAX_STORED_NOTIFICATIONS = 80;

// In-memory deduplication map (eventKey -> timestamp ms) to prevent duplicate Broadcast + Postgres_changes popups
const recentEventKeys = new Map<string, number>();
const DEDUP_WINDOW_MS = 45_000;

/**
 * Checks whether an eventKey was already processed within the deduplication window,
 * and records it if not.
 */
export function shouldProcessNotificationEvent(eventKey?: string): boolean {
  if (!eventKey) return true;
  const now = Date.now();

  // Prune expired keys
  for (const [key, ts] of recentEventKeys.entries()) {
    if (now - ts > DEDUP_WINDOW_MS) {
      recentEventKeys.delete(key);
    }
  }

  const lastSeen = recentEventKeys.get(eventKey);
  if (lastSeen && now - lastSeen < DEDUP_WINDOW_MS) {
    return false;
  }

  recentEventKeys.set(eventKey, now);
  return true;
}

/**
 * Retrieves user notification preferences (sound, vibration, push banner).
 */
export function getNotificationPreferences(): NotificationPreferences {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(NOTIFICATION_PREFS_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        soundEnabled: parsed.soundEnabled !== false,
        vibrationEnabled: parsed.vibrationEnabled !== false,
        pushBannerEnabled: parsed.pushBannerEnabled !== false,
      };
    }
  } catch (_) {}

  return {
    soundEnabled: true,
    vibrationEnabled: true,
    pushBannerEnabled: true,
  };
}

/**
 * Updates user notification preferences and notifies listeners.
 */
export function saveNotificationPreferences(prefs: Partial<NotificationPreferences>): NotificationPreferences {
  const current = getNotificationPreferences();
  const updated: NotificationPreferences = {
    ...current,
    ...prefs,
  };
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('setlla:notifications-updated'));
    }
  } catch (_) {}
  return updated;
}

/**
 * Reads all stored notifications from local storage.
 */
function readAllStoredNotifications(): SetllaNotificationItem[] {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(NOTIFICATIONS_STORAGE_KEY) : null;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

/**
 * Writes notifications list to local storage and dispatches a sync event.
 */
function writeAllStoredNotifications(items: SetllaNotificationItem[]): void {
  try {
    if (typeof window !== 'undefined') {
      const trimmed = items.slice(0, MAX_STORED_NOTIFICATIONS);
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(trimmed));
      window.dispatchEvent(new CustomEvent('setlla:notifications-updated'));
    }
  } catch (_) {}
}

/**
 * Determines if a notification item belongs to the given user profile.
 */
export function isNotificationForUser(item: SetllaNotificationItem, user?: UserProfile | null): boolean {
  if (item.isBroadcast) return true;
  if (!user) return false;

  const userPhone = user.phone ? normalizePhoneNumber(user.phone) : '';
  const userEmail = user.email ? normalizeEmail(user.email) : '';
  const itemPhone = item.recipientPhone ? normalizePhoneNumber(item.recipientPhone) : '';
  const itemEmail = item.recipientEmail ? normalizeEmail(item.recipientEmail) : '';

  if (item.recipientId && user.id && item.recipientId === user.id) return true;
  if (itemPhone && userPhone && itemPhone === userPhone) return true;
  if (itemEmail && userEmail && itemEmail === userEmail) return true;

  // If notification was saved on this device without specific recipient filter, show it to the active user
  if (!item.recipientId && !item.recipientPhone && !item.recipientEmail) return true;

  return false;
}

/**
 * Retrieves notifications visible to the current user, sorted newest first.
 */
export function getNotificationsForUser(user?: UserProfile | null): SetllaNotificationItem[] {
  const all = readAllStoredNotifications();
  return all
    .filter((item) => isNotificationForUser(item, user))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Returns the count of unread inbox notifications for the current user.
 */
export function getUnreadNotificationsCount(user?: UserProfile | null): number {
  return getNotificationsForUser(user).filter((n) => !n.isRead).length;
}

/**
 * Adds a notification to the persistent inbox with automatic deduplication.
 */
export function recordNotificationInInbox(
  params: Omit<SetllaNotificationItem, 'id' | 'createdAt' | 'isRead'> & {
    id?: string;
    createdAt?: string;
    isRead?: boolean;
  }
): SetllaNotificationItem | null {
  const all = readAllStoredNotifications();

  // Deduplicate by eventKey if present within last 60 seconds
  if (params.eventKey) {
    const existingByKey = all.find(
      (item) =>
        item.eventKey === params.eventKey &&
        Date.now() - new Date(item.createdAt).getTime() < 60_000
    );
    if (existingByKey) {
      return existingByKey;
    }
  }

  const cleanTitle = params.title.replace(/^[🔔🎉✅⚠️🚀💼🏢]+\s*/, '').trim();

  const newItem: SetllaNotificationItem = {
    id: params.id || `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    eventKey: params.eventKey,
    title: cleanTitle || params.title,
    body: params.body,
    type: params.type,
    createdAt: params.createdAt || new Date().toISOString(),
    isRead: params.isRead ?? false,
    recipientId: params.recipientId,
    recipientEmail: params.recipientEmail,
    recipientPhone: params.recipientPhone,
    isBroadcast: params.isBroadcast,
    propertyId: params.propertyId,
    bookingId: params.bookingId,
    jobId: params.jobId,
    applicationId: params.applicationId,
    actionLabel: params.actionLabel,
  };

  writeAllStoredNotifications([newItem, ...all.filter((i) => i.id !== newItem.id)]);
  return newItem;
}

/**
 * Marks a single notification item as read.
 */
export function markNotificationRead(notificationId: string): void {
  const all = readAllStoredNotifications();
  let changed = false;
  const updated = all.map((item) => {
    if (item.id === notificationId && !item.isRead) {
      changed = true;
      return { ...item, isRead: true };
    }
    return item;
  });
  if (changed) {
    writeAllStoredNotifications(updated);
  }
}

/**
 * Marks all notifications for the current user as read.
 */
export function markAllUserNotificationsRead(user?: UserProfile | null): void {
  const all = readAllStoredNotifications();
  let changed = false;
  const updated = all.map((item) => {
    if (!item.isRead && isNotificationForUser(item, user)) {
      changed = true;
      return { ...item, isRead: true };
    }
    return item;
  });
  if (changed) {
    writeAllStoredNotifications(updated);
  }
}

/**
 * Deletes a single notification item from the inbox.
 */
export function removeNotificationItem(notificationId: string): void {
  const all = readAllStoredNotifications();
  const filtered = all.filter((item) => item.id !== notificationId);
  if (filtered.length !== all.length) {
    writeAllStoredNotifications(filtered);
  }
}

/**
 * Clears all stored notifications for the current user.
 */
export function clearUserNotifications(user?: UserProfile | null): void {
  const all = readAllStoredNotifications();
  const remaining = all.filter((item) => !isNotificationForUser(item, user));
  writeAllStoredNotifications(remaining);
}

/**
 * Formats a timestamp into a clean human-readable relative time string ("Just now", "4m ago", "2h ago", etc.)
 */
export function formatNotificationRelativeTime(isoDate?: string): string {
  if (!isoDate) return 'Just now';
  const ts = new Date(isoDate).getTime();
  if (Number.isNaN(ts)) return 'Just now';
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 45) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(ts).toLocaleDateString();
}
