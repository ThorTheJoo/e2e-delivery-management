import { supabase } from '@/lib/supabase';
import { getActiveDataSource } from '@/lib/data-source';

export interface QueryFilters {
  [key: string]: string | number | boolean;
}

export interface BaseRecord {
  id: string;
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, unknown>;
}

export class SupabaseDataService<T extends BaseRecord> {
  private readonly tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  private isEnabled(): boolean {
    return getActiveDataSource() === 'supabase';
  }

  async create(data: Partial<T>): Promise<T> {
    if (!this.isEnabled()) throw new Error('Supabase is not enabled');
    const { data: result, error } = await supabase
      .from(this.tableName)
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return result as T;
  }

  async read(filters?: QueryFilters): Promise<T[]> {
    if (!this.isEnabled()) return [];
    let query = supabase.from(this.tableName).select('*');
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        query = query.eq(key, value as any);
      }
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as T[];
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    if (!this.isEnabled()) throw new Error('Supabase is not enabled');
    const { data: result, error } = await supabase
      .from(this.tableName)
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return result as T;
  }

  async delete(id: string): Promise<void> {
    if (!this.isEnabled()) throw new Error('Supabase is not enabled');
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
}


