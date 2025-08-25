import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database table names
export const TABLES = {
  TMF_REFERENCE_DOMAINS: 'tmf_reference_domains',
  TMF_REFERENCE_CAPABILITIES: 'tmf_reference_capabilities',
  USER_DOMAINS: 'user_domains',
  USER_CAPABILITIES: 'user_capabilities'
} as const;
