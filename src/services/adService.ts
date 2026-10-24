import { AdvertStory } from '../data/mockAdverts';
import { supabase, isSupabaseConfigured, getSupabaseClient } from '../utils/supabaseClient';

export interface PartnerApiKey {
  id: string;
  companyName: string;
  apiKey: string;
  contactEmail: string;
  contactPhone?: string;
  isActive: boolean;
  rateLimitPerDay: number;
  requestsToday: number;
  createdAt: string;
  lastUsedAt?: string;
}

export interface PartnerSubmissionPayload {
  companyName: string;
  headline: string;
  description: string;
  category: 'Property' | 'Estate' | 'Promo' | 'Service';
  mediaUrl: string;
  mediaType: 'image' | 'video';
  ctaText: string;
  actionType: 'website' | 'contact' | 'property';
  websiteUrl?: string;
  whatsappNumber?: string;
  phone?: string;
  location?: string;
  price?: string;
  partnerEmail: string;
  packageTier: 'starter' | 'growth' | 'corporate';
  durationDays: number;
  budgetAmount: number;
  paymentReference?: string;
  paymentMethod?: string;
}

export interface ProgrammaticPushPayload {
  companyName: string;
  headline: string;
  description: string;
  category?: 'Property' | 'Estate' | 'Promo' | 'Service';
  mediaUrl: string;
  mediaType?: 'image' | 'video';
  ctaText?: string;
  actionType?: 'website' | 'contact' | 'property';
  websiteUrl?: string;
  whatsappNumber?: string;
  phone?: string;
  location?: string;
  price?: string;
  durationDays?: number;
}

const ADVERTS_STORAGE_KEY = 'setlla_adverts';
const DELETED_ADVERTS_STORAGE_KEY = 'setlla_deleted_adverts';
const API_KEYS_STORAGE_KEY = 'setlla_partner_api_keys';

/**
 * All known system demo / mock advert IDs.
 * These are strictly flagged as permanently deleted so they NEVER resurrect
 * on desktop or mobile devices once deleted by the user or admin.
 */
export const SYSTEM_DEMO_ADVERT_IDS = new Set([
  'ad-asaba-emerald',
  'ad-warri-movers',
  'ad-delta-solar',
  'ad-warri-willows',
  'ad-delta-paints',
  'ad-abraka-delsu',
  'ad-sapele-palms',
  'ad-ughelli-otovwodo',
  'ad-story-1',
  'ad-story-2',
  'ad-story-3',
  'ad-story-4',
  'ad-story-5',
  'ad-story-6',
  'ad-story-7',
  'ad-story-8',
]);

/**
 * Returns a Set of advert IDs that have been explicitly deleted.
 * Initialized with SYSTEM_DEMO_ADVERT_IDS to guarantee demo ads never resurrect.
 */
export function getDeletedAdvertIds(): Set<string> {
  const set = new Set<string>(SYSTEM_DEMO_ADVERT_IDS);
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(DELETED_ADVERTS_STORAGE_KEY) : null;
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        arr.forEach((id) => set.add(id));
      }
    }
  } catch (e) {}
  return set;
}

export function recordDeletedAdvertId(id: string): void {
  try {
    const set = getDeletedAdvertIds();
    set.add(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(DELETED_ADVERTS_STORAGE_KEY, JSON.stringify(Array.from(set)));
      // Also cleanse local advert storage immediately
      const raw = localStorage.getItem(ADVERTS_STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter((a: any) => a && a.id !== id);
            localStorage.setItem(ADVERTS_STORAGE_KEY, JSON.stringify(filtered));
          }
        } catch (_) {}
      }
    }
  } catch (e) {}
}

export function unrecordDeletedAdvertId(id: string): void {
  try {
    const set = getDeletedAdvertIds();
    if (set.has(id)) {
      set.delete(id);
      if (typeof window !== 'undefined') {
        localStorage.setItem(DELETED_ADVERTS_STORAGE_KEY, JSON.stringify(Array.from(set)));
      }
    }
  } catch (e) {}
}

/**
 * Fetches deleted advert IDs from Supabase to synchronize tombstones to mobile devices
 */
export async function syncDeletedAdvertsFromCloud(): Promise<Set<string>> {
  const localSet = getDeletedAdvertIds();
  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase.from('deleted_adverts').select('id');
      if (data && Array.isArray(data)) {
        data.forEach((row) => {
          if (row.id) localSet.add(row.id);
        });
        if (typeof window !== 'undefined') {
          localStorage.setItem(DELETED_ADVERTS_STORAGE_KEY, JSON.stringify(Array.from(localSet)));
        }
      }
    } catch (_) {}
  }
  return localSet;
}

/**
 * Explicit purge helper for system demo adverts
 */
export async function purgeSystemDemoAdverts(): Promise<void> {
  const demoIds = Array.from(SYSTEM_DEMO_ADVERT_IDS);
  demoIds.forEach((id) => recordDeletedAdvertId(id));

  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(ADVERTS_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const clean = parsed.filter((a: any) => a && !SYSTEM_DEMO_ADVERT_IDS.has(a.id));
          localStorage.setItem(ADVERTS_STORAGE_KEY, JSON.stringify(clean));
        }
      } catch (_) {}
    }
  }

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('adverts').delete().in('id', demoIds);
      const tombstoneRows = demoIds.map((id) => ({ id, deleted_at: new Date().toISOString() }));
      await supabase.from('deleted_adverts').upsert(tombstoneRows);
    } catch (_) {}
  }
}

// Seed Partner API Keys for corporate testing
const DEFAULT_PARTNER_KEYS: PartnerApiKey[] = [
  {
    id: 'key-delta-solar-01',
    companyName: 'Asaba Solar & Power Solutions Ltd',
    apiKey: 'stla_live_8f39a01b92c44de88a912bf7',
    contactEmail: 'partners@asabasolar.ng',
    contactPhone: '08031122334',
    isActive: true,
    rateLimitPerDay: 500,
    requestsToday: 14,
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    lastUsedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'key-abraka-properties-02',
    companyName: 'Delta Mega Real Estate Consortium',
    apiKey: 'stla_live_920da83c61ef42a0b12c478e',
    contactEmail: 'marketing@deltamegarealty.com',
    contactPhone: '08129988776',
    isActive: true,
    rateLimitPerDay: 200,
    requestsToday: 4,
    createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
    lastUsedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
];

/**
 * Normalizes an advert database row to the frontend AdvertStory model
 */
export const mapDbToAdvert = (row: any): AdvertStory => ({
  id: row.id,
  title: row.title || row.headline?.slice(0, 20) || 'Featured Ad',
  advertiserName: row.advertiser_name || row.advertiserName || 'Partner',
  advertiserHandle: row.advertiser_handle || row.advertiserHandle,
  avatarUrl: row.avatar_url || row.avatarUrl,
  category: row.category || 'Promo',
  badgeText: row.badge_text || row.badgeText || 'SPONSORED',
  thumbnailUrl: row.thumbnail_url || row.thumbnailUrl || row.media_url || row.mediaUrl,
  mediaUrl: row.media_url || row.mediaUrl,
  mediaType: row.media_type || row.mediaType || 'image',
  headline: row.headline,
  description: row.description || '',
  location: row.location || 'Delta State',
  price: row.price,
  ctaText: row.cta_text || row.ctaText || 'Learn More',
  websiteUrl: row.website_url || row.websiteUrl,
  actionType: row.action_type || row.actionType || 'website',
  whatsappNumber: row.whatsapp_number || row.whatsappNumber,
  phone: row.phone,
  isVerified: Boolean(row.is_verified ?? row.isVerified),
  propertyId: row.property_id || row.propertyId,
  status: row.status || 'active',
  submissionSource: row.submission_source || row.submissionSource || 'admin',
  partnerEmail: row.partner_email || row.partnerEmail,
  packageTier: row.package_tier || row.packageTier || 'growth',
  budgetAmount: Number(row.budget_amount ?? row.budgetAmount ?? 0),
  startDate: row.start_date || row.startDate,
  endDate: row.end_date || row.endDate,
  impressionsCount: Number(row.impressions_count ?? row.impressionsCount ?? 0),
  clicksCount: Number(row.clicks_count ?? row.clicksCount ?? 0),
  likesCount: Number(row.likes_count ?? row.likesCount ?? 0),
  commentsCount: Number(row.comments_count ?? row.commentsCount ?? 0),
  sharesCount: Number(row.shares_count ?? row.sharesCount ?? 0),
  apiKeyRef: row.api_key_ref || row.apiKeyRef,
  createdAt: row.created_at || row.createdAt,
});

/**
 * Normalizes an AdvertStory to DB snake_case columns
 */
export const mapAdvertToDb = (ad: AdvertStory) => ({
  id: ad.id,
  title: ad.title,
  headline: ad.headline,
  advertiser_name: ad.advertiserName,
  advertiser_handle: ad.advertiserHandle || null,
  avatar_url: ad.avatarUrl || null,
  category: ad.category,
  badge_text: ad.badgeText,
  thumbnail_url: ad.thumbnailUrl,
  media_url: ad.mediaUrl,
  media_type: ad.mediaType,
  description: ad.description,
  location: ad.location,
  price: ad.price || null,
  cta_text: ad.ctaText || 'Learn More',
  website_url: ad.websiteUrl || null,
  action_type: ad.actionType || 'website',
  whatsapp_number: ad.whatsappNumber || null,
  phone: ad.phone || null,
  is_verified: ad.isVerified,
  property_id: ad.propertyId || null,
  status: ad.status || 'active',
  submission_source: ad.submissionSource || 'admin',
  partner_email: ad.partnerEmail || null,
  package_tier: ad.packageTier || 'growth',
  budget_amount: ad.budgetAmount || 0,
  start_date: ad.startDate || new Date().toISOString(),
  end_date: ad.endDate || null,
  impressions_count: ad.impressionsCount || 0,
  clicks_count: ad.clicksCount || 0,
  likes_count: ad.likesCount || 0,
  comments_count: ad.commentsCount || 0,
  shares_count: ad.sharesCount || 0,
  api_key_ref: ad.apiKeyRef || null,
});

/**
 * Check if a campaign has expired based on end_date
 */
export const isCampaignExpired = (ad: AdvertStory): boolean => {
  if (!ad.endDate) return false;
  const expiry = new Date(ad.endDate).getTime();
  return !isNaN(expiry) && expiry < Date.now();
};

/**
 * Fetches all adverts with automatic expiration detection.
 * Reads from Supabase if online, seamlessly falls back to localStorage.
 * STRICT RULE: Never resurrects deleted ads or system demo ads.
 */
export const loadAllAdverts = async (): Promise<AdvertStory[]> => {
  // 1. Sync cloud tombstones so this device knows what was deleted
  await syncDeletedAdvertsFromCloud().catch(() => {});
  const deletedIds = getDeletedAdvertIds();

  let list: AdvertStory[] = [];
  let fetchedFromCloud = false;

  // 2. Fetch live adverts from Supabase
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('adverts')
        .select('*')
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        fetchedFromCloud = true;
        list = data
          .map(mapDbToAdvert)
          .filter((ad) => ad && ad.id && !deletedIds.has(ad.id) && ad.status !== 'deleted');

        // Immediately update localStorage with the clean cloud list
        if (typeof window !== 'undefined') {
          localStorage.setItem(ADVERTS_STORAGE_KEY, JSON.stringify(list));
        }
      }
    } catch (err) {
      console.warn('[AdService] Supabase fetch error, using local cache:', err);
    }
  }

  // 3. Fallback to localStorage ONLY if cloud was unreachable/offline
  if (!fetchedFromCloud) {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(ADVERTS_STORAGE_KEY) : null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          list = parsed.filter(
            (ad: AdvertStory) => ad && ad.id && !deletedIds.has(ad.id) && ad.status !== 'deleted'
          );
        }
      } catch {
        list = [];
      }
    }
  }

  // 4. Update localStorage with sanitized list (no demo ads, no deleted ads)
  if (typeof window !== 'undefined') {
    localStorage.setItem(ADVERTS_STORAGE_KEY, JSON.stringify(list));
  }

  // Check and flag expired campaigns
  let changed = false;
  const updated = list.map((ad) => {
    if (ad.status === 'active' && isCampaignExpired(ad)) {
      changed = true;
      return { ...ad, status: 'expired' as const };
    }
    return ad;
  });

  if (changed && typeof window !== 'undefined') {
    localStorage.setItem(ADVERTS_STORAGE_KEY, JSON.stringify(updated));
  }

  return updated;
};

/**
 * Saves or updates an advert in both Supabase and localStorage
 */
export const saveAdvert = async (ad: AdvertStory): Promise<AdvertStory> => {
  // If this ad ID was previously tombstoned, clear it
  unrecordDeletedAdvertId(ad.id);

  const all = await loadAllAdverts();
  const existingIdx = all.findIndex((item) => item.id === ad.id);
  const now = new Date().toISOString();

  const advertToSave: AdvertStory = {
    ...ad,
    createdAt: ad.createdAt || now,
    status: ad.status || 'active',
  };

  let updatedList: AdvertStory[];
  if (existingIdx >= 0) {
    updatedList = [...all];
    updatedList[existingIdx] = advertToSave;
  } else {
    updatedList = [advertToSave, ...all];
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(ADVERTS_STORAGE_KEY, JSON.stringify(updatedList));
    window.dispatchEvent(new CustomEvent('setlla_adverts_updated'));
  }

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('adverts').upsert(mapAdvertToDb(advertToSave));
    } catch (e) {
      console.warn('[AdService] Failed to upsert advert to Supabase:', e);
    }
  }

  return advertToSave;
};

/**
 * Permanently deletes an advert across all devices (mobile and desktop).
 * Writes tombstone to Supabase deleted_adverts and purges from cloud and localStorage.
 */
export const removeAdvert = async (id: string): Promise<void> => {
  // 1. Record ID in tombstones (cloud + local)
  recordDeletedAdvertId(id);

  // 2. Remove from local storage cache
  const raw = typeof window !== 'undefined' ? localStorage.getItem(ADVERTS_STORAGE_KEY) : null;
  let all: AdvertStory[] = [];
  if (raw) {
    try { all = JSON.parse(raw); } catch {}
  }
  const filtered = all.filter((item) => item.id !== id);

  if (typeof window !== 'undefined') {
    localStorage.setItem(ADVERTS_STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent('setlla_adverts_updated'));
  }

  // 3. Delete from Supabase & record tombstone
  if (isSupabaseConfigured()) {
    try {
      // Update status to 'deleted'
      await supabase.from('adverts').update({ status: 'deleted' }).eq('id', id);
      // Hard delete from adverts table
      await supabase.from('adverts').delete().eq('id', id);
      // Record in deleted_adverts table for cross-device realtime broadcast
      await supabase.from('deleted_adverts').upsert({ id, deleted_at: new Date().toISOString() });
    } catch (e) {
      console.warn('[AdService] Failed to delete from Supabase:', e);
    }
  }
};

/**
 * Subscribes to advert changes via Realtime and local events across tabs/devices
 */
export const subscribeToAdvertChanges = (callback: (adverts: AdvertStory[]) => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  const handler = () => {
    loadAllAdverts().then(callback).catch(() => {});
  };

  window.addEventListener('setlla_adverts_updated', handler);
  window.addEventListener('storage', (e) => {
    if (e.key === ADVERTS_STORAGE_KEY || e.key === DELETED_ADVERTS_STORAGE_KEY) {
      handler();
    }
  });

  let channel: any = null;
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      if (client) {
        channel = client
          .channel('setlla_realtime_adverts')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'adverts' },
            () => {
              loadAllAdverts().then(callback).catch(() => {});
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'deleted_adverts' },
            () => {
              loadAllAdverts().then(callback).catch(() => {});
            }
          )
          .subscribe();
      }
    } catch (e) {}
  }

  return () => {
    window.removeEventListener('setlla_adverts_updated', handler);
    if (channel && isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        client?.removeChannel(channel);
      } catch (e) {}
    }
  };
};

/**
 * Method 1: Admin Direct Approval
 * Approves a pending partner submission and sets live campaign dates
 */
export const approvePartnerAdvert = async (id: string, durationDays = 30): Promise<AdvertStory | null> => {
  const all = await loadAllAdverts();
  const target = all.find((item) => item.id === id);
  if (!target) return null;

  const now = new Date();
  const end = new Date(now.getTime() + durationDays * 86400000);

  const approvedAd: AdvertStory = {
    ...target,
    status: 'active',
    isVerified: true,
    startDate: now.toISOString(),
    endDate: end.toISOString(),
    badgeText: target.packageTier === 'corporate' ? 'VERIFIED PARTNER' : 'SPONSORED',
  };

  return await saveAdvert(approvedAd);
};

/**
 * Method 1: Admin Rejection
 */
export const rejectPartnerAdvert = async (id: string, _reason?: string): Promise<AdvertStory | null> => {
  const all = await loadAllAdverts();
  const target = all.find((item) => item.id === id);
  if (!target) return null;

  const rejectedAd: AdvertStory = {
    ...target,
    status: 'rejected',
  };

  return await saveAdvert(rejectedAd);
};

/**
 * Method 2: Self-Service Partner Portal Submission
 * Submits an ad for Super Admin review and 1-click activation
 */
export const submitPartnerAdvert = async (payload: PartnerSubmissionPayload): Promise<{
  success: boolean;
  advert: AdvertStory;
  trackingRef: string;
}> => {
  const trackingRef = `STLA-AD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const now = new Date();
  const end = new Date(now.getTime() + payload.durationDays * 86400000);

  const newAdvert: AdvertStory = {
    id: `ad-partner-${Date.now()}`,
    title: payload.headline.slice(0, 24),
    headline: payload.headline,
    advertiserName: payload.companyName,
    advertiserHandle: `@${payload.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    category: payload.category,
    badgeText: payload.packageTier === 'corporate' ? 'PREMIUM PARTNER' : 'SPONSORED',
    thumbnailUrl: payload.mediaUrl,
    mediaUrl: payload.mediaUrl,
    mediaType: payload.mediaType,
    description: payload.description,
    location: payload.location || 'Nationwide',
    price: payload.price,
    ctaText: payload.ctaText || 'Learn More',
    actionType: payload.actionType,
    websiteUrl: payload.websiteUrl,
    whatsappNumber: payload.whatsappNumber,
    phone: payload.phone,
    isVerified: false, // Super admin verifies
    status: 'pending_review',
    submissionSource: 'partner_portal',
    partnerEmail: payload.partnerEmail,
    packageTier: payload.packageTier,
    budgetAmount: payload.budgetAmount,
    paymentReference: payload.paymentReference,
    paymentMethod: payload.paymentMethod,
    paymentStatus: payload.paymentReference ? 'paid' : 'pending',
    startDate: now.toISOString(),
    endDate: end.toISOString(),
    impressionsCount: 0,
    clicksCount: 0,
    createdAt: now.toISOString(),
  };

  const saved = await saveAdvert(newAdvert);
  return {
    success: true,
    advert: saved,
    trackingRef,
  };
};

/**
 * Method 3: Programmatic Push API / Webhook Integration
 * Allows tech companies or corporate ad networks with an API key to push campaigns
 */
export const pushProgrammaticAdvert = async (
  payload: ProgrammaticPushPayload,
  apiKey: string
): Promise<{
  success: boolean;
  advert?: AdvertStory;
  error?: string;
  statusCode: number;
}> => {
  // 1. Validate API Key
  const activeKeys = getPartnerApiKeys();
  const matchedKey = activeKeys.find((k) => k.apiKey === apiKey && k.isActive);

  if (!matchedKey) {
    return {
      success: false,
      error: 'Invalid or revoked X-Setlla-Partner-Key. Please verify credentials in the Partner Console.',
      statusCode: 401,
    };
  }

  // 2. Validate Required Fields
  if (!payload.companyName || !payload.headline || !payload.mediaUrl) {
    return {
      success: false,
      error: 'Missing required fields: companyName, headline, and mediaUrl are mandatory.',
      statusCode: 422,
    };
  }

  // 3. Increment key usage metrics
  incrementApiKeyUsage(matchedKey.id);

  // 4. Ingest Campaign
  const duration = payload.durationDays || 30;
  const now = new Date();
  const end = new Date(now.getTime() + duration * 86400000);

  const programmaticAd: AdvertStory = {
    id: `ad-api-${Date.now()}`,
    title: payload.headline.slice(0, 24),
    headline: payload.headline,
    advertiserName: payload.companyName,
    advertiserHandle: `@${payload.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    category: payload.category || 'Promo',
    badgeText: 'VERIFIED SPONSOR',
    thumbnailUrl: payload.mediaUrl,
    mediaUrl: payload.mediaUrl,
    mediaType: payload.mediaType || 'image',
    description: payload.description || '',
    location: payload.location || 'Delta State',
    price: payload.price,
    ctaText: payload.ctaText || 'Learn More',
    actionType: payload.actionType || 'website',
    websiteUrl: payload.websiteUrl,
    whatsappNumber: payload.whatsappNumber,
    phone: payload.phone,
    isVerified: true,
    status: 'active',
    submissionSource: 'api_webhook',
    partnerEmail: matchedKey.contactEmail,
    packageTier: 'corporate',
    startDate: now.toISOString(),
    endDate: end.toISOString(),
    apiKeyRef: apiKey.slice(0, 16) + '...',
    impressionsCount: 0,
    clicksCount: 0,
    createdAt: now.toISOString(),
  };

  const saved = await saveAdvert(programmaticAd);

  return {
    success: true,
    advert: saved,
    statusCode: 201,
  };
};

/**
 * PARTNER API KEYS MANAGEMENT
 */
export const getPartnerApiKeys = (): PartnerApiKey[] => {
  if (typeof window === 'undefined') return DEFAULT_PARTNER_KEYS;
  const raw = localStorage.getItem(API_KEYS_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(DEFAULT_PARTNER_KEYS));
    return DEFAULT_PARTNER_KEYS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PARTNER_KEYS;
  }
};

export const createPartnerApiKey = (
  companyName: string,
  contactEmail: string,
  contactPhone?: string
): PartnerApiKey => {
  const randomHex = Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  const apiKey = `stla_live_${randomHex}`;
  
  const newKey: PartnerApiKey = {
    id: `key-${Date.now()}`,
    companyName,
    apiKey,
    contactEmail,
    contactPhone,
    isActive: true,
    rateLimitPerDay: 500,
    requestsToday: 0,
    createdAt: new Date().toISOString(),
  };

  const list = [newKey, ...getPartnerApiKeys()];
  if (typeof window !== 'undefined') {
    localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(list));
  }

  if (isSupabaseConfigured()) {
    try {
      supabase.from('partner_api_keys').insert({
        id: newKey.id,
        company_name: newKey.companyName,
        api_key: newKey.apiKey,
        contact_email: newKey.contactEmail,
        contact_phone: newKey.contactPhone || null,
        is_active: newKey.isActive,
        rate_limit_per_day: newKey.rateLimitPerDay,
        requests_today: newKey.requestsToday,
      });
    } catch (e) {
      console.warn('[AdService] Failed to insert key to Supabase:', e);
    }
  }

  return newKey;
};

export const togglePartnerApiKey = (id: string): PartnerApiKey[] => {
  const list = getPartnerApiKeys().map((k) =>
    k.id === id ? { ...k, isActive: !k.isActive } : k
  );
  if (typeof window !== 'undefined') {
    localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(list));
  }
  return list;
};

export const deletePartnerApiKey = (id: string): PartnerApiKey[] => {
  const list = getPartnerApiKeys().filter((k) => k.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(list));
  }
  return list;
};

const incrementApiKeyUsage = (id: string) => {
  const list = getPartnerApiKeys().map((k) =>
    k.id === id
      ? { ...k, requestsToday: k.requestsToday + 1, lastUsedAt: new Date().toISOString() }
      : k
  );
  if (typeof window !== 'undefined') {
    localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(list));
  }
};

// Auto-purge any stale system demo adverts on client bootstrap
if (typeof window !== 'undefined') {
  purgeSystemDemoAdverts().catch(() => {});
}
