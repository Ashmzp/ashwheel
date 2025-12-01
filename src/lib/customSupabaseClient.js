import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
    storage: {
      getItem: (key) => {
        // Use sessionStorage for session data (clears on browser close)
        return sessionStorage.getItem(key);
      },
      setItem: (key, value) => {
        sessionStorage.setItem(key, value);
      },
      removeItem: (key) => {
        sessionStorage.removeItem(key);
      },
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    },
    // Prevent WebSocket errors from crashing the app in dev if offline
    headers: {
      'x-client-info': 'ashwheel-app'
    }
  },
  global: {
    headers: {
      'x-client-info': 'ashwheel-app'
    }
  }
});