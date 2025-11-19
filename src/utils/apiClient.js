/**
 * Secure API Client with error handling and retry logic
 * Fixes HIGH severity issues related to API calls
 */

import { supabase } from '@/lib/customSupabaseClient';
import { retryOperation, isNetworkError, isAuthError } from './errorHandling';

class ApiClient {
  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  async query(table, options = {}) {
    const operation = async () => {
      try {
        let query = supabase.from(table).select(options.select || '*', { count: 'exact' });

        if (options.eq) {
          Object.entries(options.eq).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }

        if (options.filter) {
          query = options.filter(query);
        }

        if (options.order) {
          query = query.order(options.order.column, { ascending: options.order.ascending ?? false });
        }

        if (options.limit) {
          query = query.limit(options.limit);
        }

        if (options.range) {
          query = query.range(options.range.from, options.range.to);
        }

        const { data, error, count } = await query;

        if (error) throw error;

        return { data: data || [], count: count || 0, error: null };
      } catch (error) {
        console.error(`API Error in ${table}:`, error);
        throw error;
      }
    };

    if (isNetworkError) {
      return retryOperation(operation, this.maxRetries, this.retryDelay);
    }

    return operation();
  }

  async insert(table, data) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      return { data: result, error: null };
    } catch (error) {
      console.error(`Insert Error in ${table}:`, error);
      return { data: null, error };
    }
  }

  async update(table, id, data) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { data: result, error: null };
    } catch (error) {
      console.error(`Update Error in ${table}:`, error);
      return { data: null, error };
    }
  }

  async delete(table, id) {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error(`Delete Error in ${table}:`, error);
      return { error };
    }
  }

  async upsert(table, data, options = {}) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .upsert(data, options)
        .select();

      if (error) throw error;

      return { data: result, error: null };
    } catch (error) {
      console.error(`Upsert Error in ${table}:`, error);
      return { data: null, error };
    }
  }
}

export const apiClient = new ApiClient();
export default apiClient;
