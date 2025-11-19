/**
 * Database operation wrapper with error handling and retry
 * Fixes HIGH severity issues #34-37
 */

import { supabase } from '@/lib/customSupabaseClient';
import { retryOperation, isNetworkError } from './errorHandling';

class DatabaseWrapper {
  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  async safeQuery(operation, context = 'Database Operation') {
    try {
      const result = await operation();
      return { data: result.data || null, error: null };
    } catch (error) {
      console.error(`${context} failed:`, error);
      
      if (isNetworkError(error)) {
        try {
          const retryResult = await retryOperation(operation, this.maxRetries, this.retryDelay);
          return { data: retryResult.data || null, error: null };
        } catch (retryError) {
          return { data: null, error: retryError };
        }
      }
      
      return { data: null, error };
    }
  }

  async select(table, options = {}) {
    return this.safeQuery(async () => {
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
        query = query.order(options.order.column || 'created_at', { 
          ascending: options.order.ascending ?? false 
        });
      }

      if (options.limit) {
        query = query.limit(Math.min(options.limit, 500)); // Max 500
      }

      if (options.range) {
        query = query.range(options.range.from, options.range.to);
      }

      const result = await query;
      if (result.error) throw result.error;
      
      return { data: result.data || [], count: result.count || 0 };
    }, `Select from ${table}`);
  }

  async insert(table, data) {
    return this.safeQuery(async () => {
      const result = await supabase.from(table).insert(data).select();
      if (result.error) throw result.error;
      return result;
    }, `Insert into ${table}`);
  }

  async update(table, id, data) {
    return this.safeQuery(async () => {
      const result = await supabase.from(table).update(data).eq('id', id).select();
      if (result.error) throw result.error;
      return result;
    }, `Update ${table}`);
  }

  async delete(table, id) {
    return this.safeQuery(async () => {
      const result = await supabase.from(table).delete().eq('id', id);
      if (result.error) throw result.error;
      return result;
    }, `Delete from ${table}`);
  }

  async upsert(table, data, options = {}) {
    return this.safeQuery(async () => {
      const result = await supabase.from(table).upsert(data, options).select();
      if (result.error) throw result.error;
      return result;
    }, `Upsert ${table}`);
  }

  // Transaction-like operation (best effort)
  async transaction(operations) {
    const results = [];
    const rollbackOperations = [];

    try {
      for (const operation of operations) {
        const result = await operation.execute();
        results.push(result);
        
        if (operation.rollback) {
          rollbackOperations.push(operation.rollback);
        }
        
        if (result.error) {
          throw result.error;
        }
      }
      
      return { success: true, results, error: null };
    } catch (error) {
      console.error('Transaction failed, attempting rollback:', error);
      
      // Attempt rollback
      for (const rollback of rollbackOperations.reverse()) {
        try {
          await rollback();
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError);
        }
      }
      
      return { success: false, results, error };
    }
  }

  // Optimistic update helper
  async optimisticUpdate(table, id, data, onSuccess, onError) {
    // Immediately call onSuccess with optimistic data
    if (onSuccess) {
      onSuccess({ ...data, id });
    }

    // Perform actual update
    const result = await this.update(table, id, data);
    
    if (result.error && onError) {
      onError(result.error);
    }
    
    return result;
  }
}

export const db = new DatabaseWrapper();
export default db;
