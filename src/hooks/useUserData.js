import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const useUserData = (user, signOut) => {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  const fetchUserData = useCallback(async () => {
    setLoading(true);

    if (!user) {
      setUserData(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error, status } = await supabase
        .from('users')
        .select('role, access, app_valid_till')
        .eq('id', user.id)
        .single();

      if (error) {
         if (signOut && (status === 401 || status === 403 || error.message.includes('Auth session not found'))) {
           console.log("Authentication error on user fetch, signing out.", { status, message: error.message });
           await signOut();
        } else if (error.code !== 'PGRST116') { // PGRST116: row not found, valid for new users
          console.error('Error fetching user data:', { status, ...error });
        }
        setUserData(null);
      } else {
        setUserData(data);
      }
    } catch (err) {
      console.error('Exception fetching user data:', err);
      // This catch block can handle network errors like "failed to fetch"
      if (signOut && (err?.message?.toLowerCase().includes('failed to fetch') || err?.message?.includes('401') || err?.message?.includes('403'))) {
        console.log("Network or auth exception detected, signing out.");
        await signOut();
      }
      setUserData(null);
    } finally {
      setLoading(false);
    }
  }, [user, signOut]);

  useEffect(() => {
    fetchUserData();
  }, [user, fetchUserData]);

  return { userData, loadingUserData: loading, refetchUserData: fetchUserData };
};