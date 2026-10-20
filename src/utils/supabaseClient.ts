import { createClient, SupabaseClient } from '@supabase/supabase-js';

const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export interface SupabaseConfig {
  url: string;
  key: string;
  isConfigured: boolean;
  source: 'env' | 'localStorage' | 'none';
}

export const getSupabaseConfig = (): SupabaseConfig => {
  const localUrl = (typeof window !== 'undefined' ? localStorage.getItem('deltarent_supabase_url') || '' : '').trim();
  const localKey = (typeof window !== 'undefined' ? localStorage.getItem('deltarent_supabase_key') || '' : '').trim();

  if (envUrl && envKey && envUrl.startsWith('https://')) {
    return { url: envUrl, key: envKey, isConfigured: true, source: 'env' };
  }

  if (localUrl && localKey && localUrl.startsWith('https://')) {
    return { url: localUrl, key: localKey, isConfigured: true, source: 'localStorage' };
  }

  return {
    url: envUrl || localUrl,
    key: envKey || localKey,
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
    console.error('[DeltaRent Supabase] Failed to initialize client:', e);
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
