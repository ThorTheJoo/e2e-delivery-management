import { getActiveDataSource } from '@/lib/data-source';
import { supabase } from '@/lib/supabase';

export interface FilterOption {
  value: string;
  label: string;
  sort_order?: number;
  metadata?: Record<string, unknown>;
}

export async function getFilterOptions(
  categoryKey: string,
  fallback: string[] | FilterOption[] = [],
): Promise<FilterOption[]> {
  try {
    if (getActiveDataSource() === 'supabase') {
      const { data, error } = await supabase
        .from('filter_options')
        .select('value,label,sort_order,metadata,category_key')
        .eq('category_key', categoryKey)
        .order('sort_order', { ascending: true })
        .order('label', { ascending: true });
      if (error) throw error;
      if (Array.isArray(data) && data.length > 0) {
        return data.map((r: any) => ({
          value: String(r.value),
          label: String(r.label || r.value),
          sort_order: r.sort_order ?? undefined,
          metadata: r.metadata || undefined,
        }));
      }
    }
  } catch (err) {
    console.warn(`Filter options read failed for ${categoryKey}`, err);
  }
  // Normalize fallback to FilterOption[]
  if (Array.isArray(fallback) && fallback.length > 0) {
    if (typeof (fallback as any[])[0] === 'string') {
      return (fallback as string[]).map((v) => ({ value: v, label: v }));
    }
    return fallback as FilterOption[];
  }
  return [];
}


