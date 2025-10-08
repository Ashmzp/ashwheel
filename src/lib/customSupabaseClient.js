import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rwavbbhqpjazcopiljol.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3YXZiYmhxcGphemNvcGlsam9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgzNDQsImV4cCI6MjA2NzIwNDM0NH0._1b3kfU8rqlDQL0TGIcymyvxV_ebJWgkyG6Hj_62g2I';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});