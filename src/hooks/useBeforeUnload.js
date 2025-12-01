import { useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Hook to cleanup session when browser/tab closes
 */
export default function useBeforeUnload(user) {
  useEffect(() => {
    if (!user) return;

    const deviceId = localStorage.getItem('device_id');
    if (!deviceId) return;

    const handleBeforeUnload = (e) => {
      // Synchronous cleanup using sendBeacon (more reliable)
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/active_sessions?user_id=eq.${user.id}&session_id=eq.${deviceId}`;
      
      // Use sendBeacon for reliable cleanup
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify({})], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
      }
      
      // Also try regular delete (best effort)
      supabase
        .from('active_sessions')
        .delete()
        .match({ user_id: user.id, session_id: deviceId })
        .then(() => {})
        .catch(() => {});
    };

    // Handle visibility change (tab hidden)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const deviceId = localStorage.getItem('device_id');
        if (deviceId) {
          supabase
            .from('active_sessions')
            .update({ is_active: false })
            .match({ user_id: user.id, session_id: deviceId })
            .then(() => {})
            .catch(() => {});
        }
      } else if (document.visibilityState === 'visible') {
        // Mark active when tab becomes visible again
        const deviceId = localStorage.getItem('device_id');
        if (deviceId) {
          supabase
            .from('active_sessions')
            .update({ is_active: true, last_active: new Date().toISOString() })
            .match({ user_id: user.id, session_id: deviceId })
            .then(() => {})
            .catch(() => {});
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);
}
