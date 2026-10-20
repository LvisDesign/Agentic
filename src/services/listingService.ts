import { supabase, isSupabaseConfigured, getSupabaseClient } from '../utils/supabaseClient';
import { PropertyListing, ListingAvailability } from '../types/marketplace';
import { INITIAL_LISTINGS } from '../data/mockListings';
import { FALLBACK_PROPERTY_IMAGES, DEFAULT_WALKTHROUGH_VIDEO, getBlobFromIDB, uploadMediaToSupabaseStorage } from '../utils/mediaStorage';

const LOCAL_STORAGE_KEY = 'deltarent_listings';

/**
 * Normalizes and sanitizes a listing item's media for cross-device consistency:
 * - Videos always receive a verified, playable streaming video URL (never an image Data URL).
 * - Captured poster snapshots are preserved so listings display their authentic property photo.
 */
export function sanitizeListingMedia(item: PropertyListing, index: number = 0): PropertyListing {
  const sanitizedMedia = (item.media || []).map((m, mIdx) => {
    // 1. Video items: guarantee URL is a valid, playable video stream and NEVER a JPEG Data URL
    if (m.type === 'video') {
      const isInvalidVideo = 
        !m.url || 
        m.url.startsWith('blob:') || 
        m.url.startsWith('data:image/') || 
        m.url.includes('mixkit.co');

      return {
        ...m,
        type: 'video' as const,
        url: isInvalidVideo ? DEFAULT_WALKTHROUGH_VIDEO : m.url,
        poster: m.poster || FALLBACK_PROPERTY_IMAGES[(index + mIdx) % FALLBACK_PROPERTY_IMAGES.length],
      };
    }

    // 2. Image items: resolve ephemeral blobs to poster snapshot or fallback image
    const isBlob = typeof m.url === 'string' && m.url.startsWith('blob:');
    if (isBlob) {
      const fallback = FALLBACK_PROPERTY_IMAGES[(index + mIdx) % FALLBACK_PROPERTY_IMAGES.length];
      return {
        ...m,
        type: 'image' as const,
        url: m.poster || fallback,
        poster: m.poster || fallback,
      };
    }
    return m;
  });

  return {
    ...item,
    media: sanitizedMedia.length > 0 ? sanitizedMedia : [{
      type: 'image' as const,
      url: FALLBACK_PROPERTY_IMAGES[index % FALLBACK_PROPERTY_IMAGES.length],
      caption: 'Verified Property Exterior',
    }],
  };
}

export interface ForceSyncResult {
  uploaded: number;
  totalLocal: number;
  error?: string;
}

/**
 * Force-syncs all local agent listings to Supabase cloud database
 * Returns an object with the count of listings uploaded and any error message.
 */
export async function forceSyncLocalListings(): Promise<ForceSyncResult> {
  const client = getSupabaseClient();
  if (!isSupabaseConfigured() || !client) {
    return {
      uploaded: 0,
      totalLocal: 0,
      error: 'Supabase database is not connected yet. Please check your Supabase URL & Anon Key.',
    };
  }

  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) {
      return { uploaded: 0, totalLocal: 0, error: 'No listings found in browser storage on this device.' };
    }

    const localListings: PropertyListing[] = JSON.parse(saved);
    if (!Array.isArray(localListings) || localListings.length === 0) {
      return { uploaded: 0, totalLocal: 0, error: 'No listings in local storage.' };
    }

    const agentListings = localListings.filter(
      (item) => item.id && (item.id.startsWith('prop-agent-') || !INITIAL_LISTINGS.some((m) => m.id === item.id))
    );

    if (agentListings.length === 0) {
      return { uploaded: 0, totalLocal: 0, error: 'No custom agent listings found to upload.' };
    }

    let uploaded = 0;
    for (const item of agentListings) {
      await saveNewListing(item);
      uploaded++;
    }

    return { uploaded, totalLocal: agentListings.length };
  } catch (err: any) {
    return { uploaded: 0, totalLocal: 0, error: err?.message || 'Failed syncing to Supabase cloud.' };
  }
}

/**
 * Automatically syncs any local agent listings to Supabase
 * Runs when an agent opens the app so existing listings are uploaded to cloud
 */
export async function syncLocalListingsToCloud(): Promise<void> {
  const client = getSupabaseClient();
  if (!isSupabaseConfigured() || !client) return;

  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) return;
    const localListings: PropertyListing[] = JSON.parse(saved);
    if (!Array.isArray(localListings) || localListings.length === 0) return;

    // Filter to real agent listings (exclude any mock/demo listings)
    const agentListings = localListings.filter(
      (item) => item.id && (item.id.startsWith('prop-agent-') || !INITIAL_LISTINGS.some((m) => m.id === item.id))
    );
    if (agentListings.length === 0) return;

    // Check which listings already exist in Supabase
    const { data: cloudData, error } = await client.from('listings').select('id');
    if (error) {
      console.warn('[DeltaRent Supabase] Table check error (table may need creation):', error.message);
      return;
    }

    const cloudIdSet = new Set((cloudData || []).map((r) => r.id));
    const unuploaded = agentListings.filter((item) => !cloudIdSet.has(item.id));

    if (unuploaded.length > 0) {
      console.log(`[DeltaRent Supabase] Syncing ${unuploaded.length} local listing(s) to cloud database...`);
      for (const item of unuploaded) {
        await saveNewListing(item);
      }
    }
  } catch (err) {
    console.warn('[DeltaRent Supabase] Auto-sync error:', err);
  }
}

/**
 * Scans listings for any agent walkthrough videos stored in client IndexedDB,
 * and automatically uploads the real video file to Supabase Storage if the bucket is enabled.
 * Once uploaded, updates the listing URL in Supabase database so all mobile devices stream the real video.
 */
export async function syncLocalVideosToCloudStorage(listingsToCheck?: PropertyListing[]): Promise<void> {
  const client = getSupabaseClient();
  if (!isSupabaseConfigured() || !client) return;

  try {
    let listings = listingsToCheck;
    if (!listings) {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        listings = JSON.parse(saved);
      }
    }
    if (!Array.isArray(listings) || listings.length === 0) return;

    for (const listing of listings) {
      if (!Array.isArray(listing.media)) continue;

      let listingMediaChanged = false;
      const updatedMedia = await Promise.all(
        listing.media.map(async (m) => {
          if (m.type === 'video' && m.id) {
            const isCloudCDN = m.url && m.url.includes('/storage/v1/object/public/property-media/');
            if (!isCloudCDN) {
              const blob = await getBlobFromIDB(m.id);
              if (blob) {
                const cloudUrl = await uploadMediaToSupabaseStorage(blob, `walkthrough-${listing.id}.mp4`);
                if (cloudUrl) {
                  console.log(`[DeltaRent Media] Successfully uploaded agent video to cloud for listing ${listing.id}:`, cloudUrl);
                  listingMediaChanged = true;
                  return { ...m, url: cloudUrl };
                }
              }
            }
          }
          return m;
        })
      );

      if (listingMediaChanged) {
        listing.media = updatedMedia;
        // Update in Supabase
        await client.from('listings').update({ media: updatedMedia }).eq('id', listing.id);
        // Also update localStorage cache
        try {
          const savedNow = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (savedNow) {
            const all: PropertyListing[] = JSON.parse(savedNow);
            const replaced = all.map((it) => (it.id === listing.id ? { ...it, media: updatedMedia } : it));
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(replaced));
          }
        } catch (e) {}
      }
    }
  } catch (err) {
    console.warn('[DeltaRent Media] Cloud video background sync notice:', err);
  }
}

/**
 * Fetches all active property listings from Supabase (or fallback to local storage)
 */
export async function fetchAllListings(): Promise<PropertyListing[]> {
  const client = getSupabaseClient();
  // If Supabase is configured, sync local listings first then load from cloud database
  if (isSupabaseConfigured() && client) {
    try {
      // 1. Sync any existing local listings and videos up to Supabase
      await syncLocalListingsToCloud();
      syncLocalVideosToCloudStorage().catch(() => {});

      // 2. Fetch all real listings from Supabase
      const { data, error } = await client
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[DeltaRent Supabase Error] Could not fetch listings from Supabase:', error.message);
      }

      if (!error && Array.isArray(data)) {
        const cloudListings: PropertyListing[] = data.map((row, idx) => {
          const item: PropertyListing = {
            id: row.id,
            title: row.title,
            state: row.state,
            city: row.city,
            neighborhood: row.neighborhood,
            fullAddress: row.full_address || row.fullAddress,
            propertyType: row.property_type || row.propertyType,
            bedrooms: row.bedrooms,
            bathrooms: row.bathrooms,
            toilets: row.toilets,
            isServiced: row.is_serviced ?? row.isServiced,
            isFurnished: row.is_furnished ?? row.isFurnished,
            electricityStatus: row.electricity_status || row.electricityStatus,
            waterSupply: row.water_supply || row.waterSupply,
            description: row.description,
            media: row.media || [],
            fees: row.fees,
            inspectionFee: row.inspection_fee || row.inspectionFee || 0,
            agent: row.agent,
            inspectionSlots: row.inspection_slots || row.inspectionSlots || [],
            inspectionDays: row.inspection_days || row.inspectionDays || [],
            tags: row.tags || [],
            addons: row.addons || [],
            createdAt: row.created_at || row.createdAt || new Date().toISOString(),
            availabilityStatus: row.availability_status || row.availabilityStatus || 'Available',
            lastConfirmedAt: row.last_confirmed_at || row.lastConfirmedAt,
          };
          return sanitizeListingMedia(item, idx);
        });

        // Only return real listings created by agents (exclude any mock/demo listings)
        const realCloudListings = cloudListings.filter(
          (l) => !INITIAL_LISTINGS.some((m) => m.id === l.id)
        );

        // Check if any real listings have local video blobs on this machine waiting to upload
        syncLocalVideosToCloudStorage(realCloudListings).catch(() => {});

        // Cache in localStorage
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(realCloudListings));
        } catch (e) {}

        return realCloudListings;
      }
    } catch (err) {
      console.warn('[DeltaRent Supabase] Failed to fetch cloud listings:', err);
    }
  }

  // Fallback: Local storage (strictly real agent listings, no demo listings)
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const customAgentListings = parsed
          .filter((item: PropertyListing) => 
            item.id && 
            !INITIAL_LISTINGS.some((init) => init.id === item.id)
          )
          .map((item: PropertyListing, idx: number) => sanitizeListingMedia(item, idx));

        return customAgentListings;
      }
    } catch (e) {}
  }

  return [];
}

/**
 * Publishes a new property listing to Supabase and caches locally
 */
export async function saveNewListing(listing: PropertyListing): Promise<void> {
  const sanitized = sanitizeListingMedia(listing);
  const client = getSupabaseClient();

  // Save to Supabase if connected
  if (isSupabaseConfigured() && client) {
    try {
      const row = {
        id: sanitized.id,
        title: sanitized.title,
        state: sanitized.state,
        city: sanitized.city,
        neighborhood: sanitized.neighborhood,
        full_address: sanitized.fullAddress,
        property_type: sanitized.propertyType,
        bedrooms: sanitized.bedrooms,
        bathrooms: sanitized.bathrooms,
        toilets: sanitized.toilets,
        is_serviced: sanitized.isServiced,
        is_furnished: sanitized.isFurnished,
        electricity_status: sanitized.electricityStatus || null,
        water_supply: sanitized.waterSupply || null,
        description: sanitized.description,
        media: sanitized.media,
        fees: sanitized.fees,
        inspection_fee: sanitized.inspectionFee,
        agent: sanitized.agent,
        inspection_slots: sanitized.inspectionSlots,
        inspection_days: sanitized.inspectionDays,
        tags: sanitized.tags || [],
        addons: sanitized.addons || [],
        availability_status: sanitized.availabilityStatus || 'Available',
        created_at: sanitized.createdAt || new Date().toISOString(),
        last_confirmed_at: sanitized.lastConfirmedAt || new Date().toISOString(),
      };

      const { error } = await client.from('listings').upsert([row]);
      if (error) {
        console.error('[DeltaRent Supabase] Error saving listing to database:', error);
      } else {
        console.log('[DeltaRent Supabase] Listing saved to cloud successfully:', sanitized.id);
      }
    } catch (err) {
      console.warn('[DeltaRent Supabase] Network exception saving listing:', err);
    }
  }

  // Also update local cache
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    const existing: PropertyListing[] = saved ? JSON.parse(saved) : [];
    const updated = [sanitized, ...existing.filter((item) => item.id !== sanitized.id)];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {}
}

/**
 * Updates listing availability status in Supabase and locally
 */
export async function updateAvailability(listingId: string, status: ListingAvailability): Promise<void> {
  const client = getSupabaseClient();
  if (isSupabaseConfigured() && client) {
    try {
      await client
        .from('listings')
        .update({ availability_status: status })
        .eq('id', listingId);
    } catch (err) {
      console.warn('[DeltaRent Supabase] Failed updating availability:', err);
    }
  }

  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const existing: PropertyListing[] = JSON.parse(saved);
      const updated = existing.map((item) =>
        item.id === listingId ? { ...item, availabilityStatus: status } : item
      );
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (e) {}
}

/**
 * Confirms listing freshness / vacant proof-of-life timestamp
 */
export async function confirmFreshness(listingId: string): Promise<void> {
  const now = new Date().toISOString();
  const client = getSupabaseClient();

  if (isSupabaseConfigured() && client) {
    try {
      await client
        .from('listings')
        .update({ last_confirmed_at: now, availability_status: 'Available' })
        .eq('id', listingId);
    } catch (err) {
      console.warn('[DeltaRent Supabase] Failed confirming freshness:', err);
    }
  }

  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const existing: PropertyListing[] = JSON.parse(saved);
      const updated = existing.map((item) =>
        item.id === listingId
          ? { ...item, lastConfirmedAt: now, availabilityStatus: 'Available' as ListingAvailability }
          : item
      );
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (e) {}
}
