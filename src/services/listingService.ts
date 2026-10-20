import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import { PropertyListing, ListingAvailability } from '../types/marketplace';
import { INITIAL_LISTINGS } from '../data/mockListings';
import { FALLBACK_PROPERTY_IMAGES } from '../utils/mediaStorage';

const LOCAL_STORAGE_KEY = 'deltarent_listings';

/**
 * Normalizes and sanitizes a listing item
 */
export function sanitizeListingMedia(item: PropertyListing, index: number = 0): PropertyListing {
  const sanitizedMedia = (item.media || []).map((m, mIdx) => {
    const isBlob = typeof m.url === 'string' && m.url.startsWith('blob:');
    if (isBlob) {
      const fallback = FALLBACK_PROPERTY_IMAGES[(index + mIdx) % FALLBACK_PROPERTY_IMAGES.length];
      return {
        ...m,
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

/**
 * Fetches all active property listings from Supabase (or fallback to local storage)
 */
export async function fetchAllListings(): Promise<PropertyListing[]> {
  // If Supabase is configured, load from cloud database
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
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

        // Merge cloud listings with platform verified listings (if not already in cloud)
        const cloudIds = new Set(cloudListings.map((l) => l.id));
        const platformMissing = INITIAL_LISTINGS.filter((p) => !cloudIds.has(p.id));

        const combined = [...cloudListings, ...platformMissing];
        // Cache in localStorage
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(combined));
        } catch (e) {}

        return combined;
      }
    } catch (err) {
      console.warn('[DeltaRent Supabase] Failed to fetch cloud listings:', err);
    }
  }

  // Fallback: Local storage + platform initial listings
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const customAgentListings = parsed
          .filter((item: PropertyListing) => item.id && (item.id.startsWith('prop-agent-') || !INITIAL_LISTINGS.some((init) => init.id === item.id)))
          .map((item: PropertyListing, idx: number) => sanitizeListingMedia(item, idx));

        const platformIds = new Set(INITIAL_LISTINGS.map((l) => l.id));
        const otherCustomListings = parsed.filter((item: PropertyListing) =>
          !item.id.startsWith('prop-agent-') && !platformIds.has(item.id)
        );

        return [...customAgentListings, ...INITIAL_LISTINGS, ...otherCustomListings];
      }
    } catch (e) {}
  }

  return INITIAL_LISTINGS;
}

/**
 * Publishes a new property listing to Supabase and caches locally
 */
export async function saveNewListing(listing: PropertyListing): Promise<void> {
  const sanitized = sanitizeListingMedia(listing);

  // Save to Supabase if connected
  if (isSupabaseConfigured() && supabase) {
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

      const { error } = await supabase.from('listings').upsert([row]);
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
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase
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

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase
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
