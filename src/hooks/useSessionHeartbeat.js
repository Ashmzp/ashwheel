import { useEffect } from "react";
import { supabase } from "@/lib/customSupabaseClient";

export default function useSessionHeartbeat(user) {
  useEffect(() => {
    if (!user) return;

    const deviceId = localStorage.getItem("device_id");
    if (!deviceId) return;

    const updateHeartbeat = async () => {
      try {
        const { error } = await supabase
          .from("active_sessions")
          .update({
            last_active: new Date().toISOString(),
            is_active: true,
          })
          .eq("user_id", user.id)
          .eq("session_id", deviceId);

        if (error) {
          console.error('Heartbeat update failed:', error);
        }
      } catch (err) {
        console.error('Heartbeat error:', err);
      }
    };

    // Initial heartbeat
    updateHeartbeat();

    // Update every minute
    const interval = setInterval(updateHeartbeat, 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);
}
