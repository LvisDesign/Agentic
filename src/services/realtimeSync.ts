import { supabase, isSupabaseConfigured, getSupabaseClient } from '../utils/supabaseClient';
import { PropertyListing, BookingRecord, UserProfile } from '../types/marketplace';

export type RealtimeEventType = 
  | 'NEW_BOOKING_REQUEST'
  | 'BOOKING_ACCEPTED'
  | 'BOOKING_REJECTED'
  | 'BOOKING_DELETED'
  | 'LISTING_CREATED'
  | 'LISTING_UPDATED'
  | 'LISTING_DELETED'
  | 'USER_REGISTERED'
  | 'USER_UPDATED'
  | 'USER_DELETED';

export interface RealtimeEventPayload {
  type: RealtimeEventType;
  booking?: BookingRecord;
  listing?: PropertyListing;
  user?: UserProfile;
  listingId?: string;
  bookingId?: string;
  propertyId?: string;
  senderDeviceId?: string;
  timestamp: string;
}

// Generate an ephemeral device/session ID to prevent echoing back notifications to the sender device
const LOCAL_DEVICE_ID = typeof window !== 'undefined'
  ? (window.sessionStorage.getItem('setlla_device_id') || window.sessionStorage.getItem('deltarent_device_id') || (() => {
      const id = 'dev_' + Math.random().toString(36).substring(2, 9);
      try { window.sessionStorage.setItem('setlla_device_id', id); } catch (_) {}
      return id;
    })())
  : 'dev_server';

// Local cross-tab BroadcastChannel
let localBroadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    localBroadcastChannel = new BroadcastChannel('setlla_live_channel');
  } catch (e) {
    // broadcast channel unsupported
  }
}

/**
 * Broadcasts an event across all devices via Supabase Realtime and across tabs via BroadcastChannel
 */
export async function broadcastRealtimeEvent(
  type: RealtimeEventType,
  data: {
    booking?: BookingRecord;
    listing?: PropertyListing;
    user?: UserProfile;
    listingId?: string;
    bookingId?: string;
    propertyId?: string;
  }
): Promise<void> {
  const payload: RealtimeEventPayload = {
    type,
    ...data,
    senderDeviceId: LOCAL_DEVICE_ID,
    timestamp: new Date().toISOString(),
  };

  // 1. Cross-tab local broadcast
  if (localBroadcastChannel) {
    try {
      localBroadcastChannel.postMessage(payload);
    } catch (_) {}
  }

  // 2. Cross-device Supabase Realtime broadcast
  const client = getSupabaseClient();
  if (isSupabaseConfigured() && client) {
    try {
      const channel = client.channel('setlla_realtime_events');
      await channel.send({
        type: 'broadcast',
        event: 'app_update',
        payload,
      });
    } catch (err) {
      console.warn('[Setlla Realtime] Broadcast send notice:', err);
    }
  }
}

/**
 * Subscribes to real-time events across devices & tabs
 */
export function subscribeToRealtimeEvents(
  onEvent: (event: RealtimeEventPayload) => void
): () => void {
  const unsubs: Array<() => void> = [];

  // 1. Listen on local BroadcastChannel
  if (localBroadcastChannel) {
    const handler = (e: MessageEvent<RealtimeEventPayload>) => {
      if (e.data && e.data.type) {
        onEvent(e.data);
      }
    };
    localBroadcastChannel.addEventListener('message', handler);
    unsubs.push(() => localBroadcastChannel?.removeEventListener('message', handler));
  }

  // 2. Listen on Supabase Realtime broadcast channel
  const client = getSupabaseClient();
  if (isSupabaseConfigured() && client) {
    try {
      const channel = client.channel('setlla_realtime_events');
      channel
        .on('broadcast', { event: 'app_update' }, ({ payload }) => {
          if (payload && payload.senderDeviceId !== LOCAL_DEVICE_ID) {
            onEvent(payload as RealtimeEventPayload);
          }
        })
        .subscribe();

      unsubs.push(() => {
        client.removeChannel(channel);
      });
    } catch (err) {
      console.warn('[Setlla Realtime] Subscription notice:', err);
    }
  }

  return () => {
    unsubs.forEach((fn) => fn());
  };
}

export function getLocalDeviceId(): string {
  return LOCAL_DEVICE_ID;
}
