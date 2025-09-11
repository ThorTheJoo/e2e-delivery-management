// Data source selection utilities for incremental Supabase rollout
// This file is safe to import anywhere; it has no side-effects

export type DataSource = 'local' | 'supabase';

export interface DataSourceStatus {
  selected: DataSource;
  envConfigured: boolean;
  reasons: string[];
}

export type ModuleKey = 'tmf' | 'specsync' | 'bluedolphin' | 'set' | 'cet';

export function getModuleMode(module: ModuleKey): DataSource {
  // UI override per module
  if (typeof window !== 'undefined') {
    const key = `supabase.ui.mode.${module}`;
    const val = window.localStorage.getItem(key);
    if (val === 'local' || val === 'supabase') {
      if (val === 'supabase' && isSupabaseEnvConfigured()) return 'supabase';
      return 'local';
    }
  }
  return getActiveDataSource();
}

export function setModuleMode(module: ModuleKey, mode: DataSource): void {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`supabase.ui.mode.${module}`, mode);
    }
  } catch {}
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
  // Browser override via UI-saved config
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem('supabaseConfig');
      if (raw) {
        const cfg = JSON.parse(raw || '{}');
        const url = cfg?.url as string | undefined;
        const anon = cfg?.anonKey as string | undefined;
        if (isNonEmpty(url) && isNonEmpty(anon) && !isPlaceholder(url) && !isPlaceholder(anon)) {
          return true;
        }
      }
    } catch {}
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!isNonEmpty(url) || !isNonEmpty(anon)) return false;
  if (isPlaceholder(url) || isPlaceholder(anon)) return false;
  return true;
}

export function getActiveDataSource(): DataSource {
  let desired = (process.env.NEXT_PUBLIC_DATA_SOURCE || 'local').toLowerCase();
  if (typeof window !== 'undefined') {
    const uiMode = window.localStorage.getItem('supabase.ui.mode');
    if (uiMode === 'local' || uiMode === 'supabase') desired = uiMode;
  }
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


