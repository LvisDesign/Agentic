import { createClient, SupabaseClient } from '@supabase/supabase-js';

const OFFICIAL_SUPABASE_URL = 'https://qxxheinizxyyrfcrijbs.supabase.co';
const OFFICIAL_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4eGhlaW5penh5eXJmY3JpamJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyNjAzOTksImV4cCI6MjEwODgzNjM5OX0.xMzIyxs9JVluL5kmbcpLSyb1WKRcopnNzJhl8cB41PI';

function isValidActiveSupabaseUrl(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  // Reject decommissioned Oct 27 project iadzihievmbhssqycpol
  if (trimmed.includes('iadzihievmbhssqycpol')) return false;
  return trimmed === OFFICIAL_SUPABASE_URL;
}

function isValidActiveSupabaseKey(key?: string | null): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  if (trimmed.startsWith('sb_publishable_')) return false;
  return trimmed === OFFICIAL_SUPABASE_KEY;
}

const rawEnvUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const rawEnvKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

const envUrl = isValidActiveSupabaseUrl(rawEnvUrl) ? rawEnvUrl : OFFICIAL_SUPABASE_URL;
const envKey = isValidActiveSupabaseKey(rawEnvKey) ? rawEnvKey : OFFICIAL_SUPABASE_KEY;

export interface SupabaseConfig {
  url: string;
  key: string;
  isConfigured: boolean;
  source: 'env' | 'localStorage' | 'default' | 'none';
}

export const getSupabaseConfig = (): SupabaseConfig => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('setlla_supabase_url');
      localStorage.removeItem('deltarent_supabase_url');
      localStorage.removeItem('setlla_supabase_key');
      localStorage.removeItem('deltarent_supabase_key');
    } catch (_) {}
  }

  const url = envUrl || OFFICIAL_SUPABASE_URL;
  const key = envKey || OFFICIAL_SUPABASE_KEY;

  if (url && key && url.startsWith('https://')) {
    return { 
      url, 
      key, 
      isConfigured: true, 
      source: 'default'
    };
  }

  return {
    url,
    key,
    isConfigured: false,
    source: 'none',
  };
};

export const isSupabaseConfigured = (): boolean => {
  return getSupabaseConfig().isConfigured;
};

let clientInstance: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.isConfigured) return null;

  if (clientInstance && lastUrl === config.url && lastKey === config.key) {
    return clientInstance;
  }

  try {
    clientInstance = createClient(config.url, config.key);
    lastUrl = config.url;
    lastKey = config.key;
    return clientInstance;
  } catch (e) {
    console.error('[Setlla Supabase] Failed to initialize client:', e);
    return null;
  }
}

/**
 * Dynamic Proxy export for supabase:
 * Always delegates to the active SupabaseClient instance (env or localStorage override).
 */
export const supabase: SupabaseClient = new Proxy({} as any, {
  get(_target, prop) {
    const client = getSupabaseClient();
    if (!client) return undefined;
    const val = (client as any)[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  },
}) as SupabaseClient;

export interface SupabaseHealth {
  configured: boolean;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  errorMessage?: string;
  listingsCount?: number;
  urlPreview?: string;
  source?: string;
}

export async function checkSupabaseHealth(): Promise<SupabaseHealth> {
  const config = getSupabaseConfig();
  const client = getSupabaseClient();

  if (!config.isConfigured || !client) {
    return {
      configured: false,
      status: 'DISCONNECTED',
      source: config.source,
      errorMessage: !config.url
        ? 'Missing VITE_SUPABASE_URL in Vercel'
        : 'Missing VITE_SUPABASE_ANON_KEY in Vercel',
    };
  }

  try {
    const { data, error, count } = await client
      .from('listings')
      .select('id', { count: 'exact' })
      .limit(1);

    if (error) {
      return {
        configured: true,
        status: 'ERROR',
        source: config.source,
        urlPreview: config.url.replace(/^https:\/\/(.{6}).*(\.supabase\.co.*)$/, 'https://$1...$2'),
        errorMessage: error.message || error.details || 'Database table query failed',
      };
    }

    return {
      configured: true,
      status: 'CONNECTED',
      source: config.source,
      urlPreview: config.url.replace(/^https:\/\/(.{6}).*(\.supabase\.co.*)$/, 'https://$1...$2'),
      listingsCount: count ?? data?.length ?? 0,
    };
  } catch (err: any) {
    return {
      configured: true,
      status: 'ERROR',
      source: config.source,
      urlPreview: config.url,
      errorMessage: err?.message || 'Network exception connecting to Supabase',
    };
  }
}


/**
 * In-memory Request Deduplicator & TTL Cache
 * Prevents multiple components from firing redundant requests for the same query,
 * shielding the database against flooding and denial of service.
 */
const queryCache = new Map<string, { data: any; expiry: number }>();
const inFlightRequests = new Map<string, Promise<any>>();

export async function fetchWithDeduplication<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttlMs: number = 10000 // 10 seconds default TTL
): Promise<T> {
  const now = Date.now();
  const cached = queryCache.get(cacheKey);
  if (cached && now < cached.expiry) {
    return cached.data as T;
  }

  const existingPromise = inFlightRequests.get(cacheKey);
  if (existingPromise) {
    return existingPromise as Promise<T>;
  }

  const promise = (async () => {
    try {
      const result = await fetchFn();
      queryCache.set(cacheKey, { data: result, expiry: Date.now() + ttlMs });
      return result;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, promise);
  return promise;
}

export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    queryCache.clear();
    return;
  }
  for (const key of queryCache.keys()) {
    if (key.startsWith(prefix)) {
      queryCache.delete(key);
    }
  }
}
