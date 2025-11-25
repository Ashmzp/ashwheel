import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/NewSupabaseAuthContext';

export const useRealtimeData = (tableName, options = {}) => {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [count, setCount] = useState(0);

  const {
    select = '*',
    order = 'created_at',
    ascending = false,
    page = 1,
    pageSize = 1000,
    filter,
  } = options;

  const fetchData = useCallback(async (force = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const from = (page - 1) * pageSize;
      const to = page * pageSize - 1;

      let query = supabase
        .from(tableName)
        .select(select, { count: 'exact' })
        .eq('user_id', user.id);

      if (filter) {
        query = filter(query);
      }

      query = query.order(order, { ascending }).range(from, to);

      const { data: initialData, error: initialError, count: initialCount } = await query;

      if (initialError) {
        throw initialError;
      }

      setData(initialData || []);
      setCount(initialCount || 0);
    } catch (e) {
      setError(e);
      console.error(`Error fetching from ${tableName}:`, e);
    } finally {
      setLoading(false);
    }
  }, [user?.id, tableName, select, order, ascending, page, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // REALTIME SUBSCRIPTIONS COMPLETELY DISABLED
  // Reason: WebSocket connections fail in normal browsers (Chrome, Firefox, Edge) 
  // causing repeated connection attempts that create module refresh/blink visual disruptions
  // Error: "WebSocket is closed before the connection is established"
  //
  // This ONLY worked in Antigravity browser, not in normal browsers
  // To see live updates, users can manually refresh the page or use the refetch function
  //
  // If you need to re-enable realtime in the future, ensure:
  // 1. Supabase local instance is running properly
  // 2. WebSocket connections are stable
  // 3. Proper error handling and retry logic is in place

  return { data, loading, error, count, refetch: fetchData };
};