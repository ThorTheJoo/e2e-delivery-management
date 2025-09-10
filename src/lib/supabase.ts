import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Browser-aware client that can use UI-saved config (localStorage) for testing
export function getBrowserSupabaseClient(): SupabaseClient {
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem('supabaseConfig');
      if (raw) {
        const cfg = JSON.parse(raw);
        const url = cfg?.url as string | undefined;
        const anonKey = cfg?.anonKey as string | undefined;
        if (url && anonKey && url.includes('https://')) {
          return createClient(url, anonKey);
        }
      }
    } catch {}
  }
  return supabase;
}

// Database table names
export const TABLES = {
  TMF_REFERENCE_DOMAINS: 'tmf_reference_domains',
  TMF_REFERENCE_CAPABILITIES: 'tmf_reference_capabilities',
  USER_DOMAINS: 'user_domains',
  USER_CAPABILITIES: 'user_capabilities',
  SPECSYNC_ITEMS: 'specsync_items',
  BLUE_DOLPHIN_OBJECTS: 'blue_dolphin_objects',
  CETV22_DATA: 'cetv22_data',
  FILTER_CATEGORIES: 'filter_categories',
  FILTER_OPTIONS: 'filter_options',
} as const;
