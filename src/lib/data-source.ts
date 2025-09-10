// Data source selection utilities for incremental Supabase rollout
// This file is safe to import anywhere; it has no side-effects

export type DataSource = 'local' | 'supabase';

export interface DataSourceStatus {
  selected: DataSource;
  envConfigured: boolean;
  reasons: string[];
}

function isNonEmpty(value: string | undefined | null): boolean {
  return Boolean(value && value.trim().length > 0);
}

function isPlaceholder(value: string | undefined | null): boolean {
  if (!value) return true;
  const v = value.trim().toLowerCase();
  return v.includes('your-project') || v.includes('your-anon-key');
}

export function isSupabaseEnvConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!isNonEmpty(url) || !isNonEmpty(anon)) return false;
  if (isPlaceholder(url) || isPlaceholder(anon)) return false;
  return true;
}

export function getActiveDataSource(): DataSource {
  const desired = (process.env.NEXT_PUBLIC_DATA_SOURCE || 'local').toLowerCase();
  if (desired === 'supabase' && isSupabaseEnvConfigured()) return 'supabase';
  return 'local';
}

export function getDataSourceStatus(): DataSourceStatus {
  const envConfigured = isSupabaseEnvConfigured();
  const selected = getActiveDataSource();
  const reasons: string[] = [];
  if (!envConfigured) {
    reasons.push('Supabase env not configured (or using placeholders).');
  }
  if (selected === 'local') {
    const desired = process.env.NEXT_PUBLIC_DATA_SOURCE || 'local';
    if (desired.toLowerCase() === 'supabase' && !envConfigured) {
      reasons.push('Falling back to local due to missing env.');
    }
  }
  return { selected, envConfigured, reasons };
}


