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

  const fetchData = useCallback(async () => {
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
  }, [user, tableName, select, order, ascending, page, pageSize, filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`public:${tableName}:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName, filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setData((prevData) => [payload.new, ...prevData].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
            setCount((prevCount) => prevCount + 1);
          } else if (payload.eventType === 'UPDATE') {
            setData((prevData) =>
              prevData.map((item) => (item.id === payload.new.id ? payload.new : item))
            );
          } else if (payload.eventType === 'DELETE') {
            setData((prevData) => prevData.filter((item) => item.id !== payload.old.id));
            setCount((prevCount) => prevCount - 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName, user]);

  return { data, loading, error, count, refetch: fetchData };
};