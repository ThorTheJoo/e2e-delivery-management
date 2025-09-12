import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cache a single browser client to avoid multiple GoTrueClient instances
let browserClient: SupabaseClient | null = null;

// Browser-aware client that can use UI-saved config (localStorage) for testing
export function getBrowserSupabaseClient(): SupabaseClient {
  // Return cached instance if already created
  if (browserClient) return browserClient;

  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem('supabaseConfig');
      if (raw) {
        const cfg = JSON.parse(raw);
        const url = cfg?.url as string | undefined;
        const anonKey = cfg?.anonKey as string | undefined;
        if (url && anonKey && url.includes('https://')) {
          // If URL matches env, always reuse the exported singleton to avoid duplicate auth clients
          if (url === supabaseUrl) {
            browserClient = supabase;
            return browserClient;
          }

          browserClient = createClient(url, anonKey);
          return browserClient;
        }
      }
    } catch {}
  }

  // Fallback to the env-configured singleton
  browserClient = supabase;
  return browserClient;
}

// Enhanced client with fallback to UI config for server operations
export function getConfiguredSupabaseClient(serviceRoleKey?: string, supabaseUrl?: string): SupabaseClient | null {
  // First try direct parameters (from API call)
  if (serviceRoleKey && supabaseUrl) {
    try {
      return createClient(supabaseUrl, serviceRoleKey);
    } catch (error) {
      console.warn('Failed to create Supabase client with direct params:', error);
    }
  }

  // Then try environment variables (production)
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const envServiceKey = serviceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (envUrl && envServiceKey) {
    try {
      return createClient(envUrl, envServiceKey);
    } catch (error) {
      console.warn('Failed to create Supabase client with env vars:', error);
    }
  }

  // For server-side operations, we can't access localStorage
  // The UI should pass the credentials directly to the API
  console.warn('No Supabase configuration available. Please configure credentials.');
  return null;
}

// Helper function for UI to get stored config (client-side only)
export function getStoredSupabaseConfig() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem('supabaseConfig');
    const serviceRaw = window.localStorage.getItem('supabase.serviceRole.hint');

    if (raw && serviceRaw) {
      const cfg = JSON.parse(raw);
      return {
        url: cfg?.url,
        serviceKey: serviceRaw
      };
    }
  } catch (error) {
    console.warn('Failed to get stored Supabase config:', error);
  }

  return null;
}

export function getServerSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && serviceKey) {
    try {
      return createClient(url, serviceKey);
    } catch {}
  }
  return null;
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
  PROJECTS: 'projects',
} as const;
