import { useEffect } from "react";
import { supabase } from "@/lib/customSupabaseClient";

export default function useSessionHeartbeat(user) {
  useEffect(() => {
    if (!user) return;

    const deviceId = localStorage.getItem("device_id");
    if (!deviceId) return;

    const updateHeartbeat = async () => {
      await supabase
        .from("active_sessions")
        .update({
          last_active: new Date().toISOString(),
          is_active: true,
        })
        .eq("user_id", user.id)
        .eq("session_id", deviceId);
    };

    const interval = setInterval(updateHeartbeat, 60 * 1000); // every 1 minute

    return () => clearInterval(interval);
  }, [user]);
}
