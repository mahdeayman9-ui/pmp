import { supabase } from './supabase';
import { Database } from './database.types';

export class DatabaseService {
  // Generic CRUD operations
  static async create<T extends keyof Database['public']['Tables']>(
    table: T,
    data: Database['public']['Tables'][T]['Insert']
  ) {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  static async findMany<T extends keyof Database['public']['Tables']>(
    table: T,
    options?: {
      select?: string;
      filters?: Record<string, any>;
      orderBy?: { column: string; ascending?: boolean };
      limit?: number;
    }
  ) {
    let query = supabase.from(table).select(options?.select || '*');

    if (options?.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    if (options?.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? true
      });
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async findById<T extends keyof Database['public']['Tables']>(
    table: T,
    id: string,
    select?: string
  ) {
    const { data, error } = await supabase
      .from(table)
      .select(select || '*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async update<T extends keyof Database['public']['Tables']>(
    table: T,
    id: string,
    updates: Database['public']['Tables'][T]['Update']
  ) {
    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete<T extends keyof Database['public']['Tables']>(
    table: T,
    id: string
  ) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
}