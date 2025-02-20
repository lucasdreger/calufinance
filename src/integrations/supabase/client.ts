
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gqulqtialfsoabpqrkqs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxdWxxdGlhbGZzb2FicHFya3FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwOTY3MjIsImV4cCI6MjA1MzY3MjcyMn0.kdD-Y72BxIJYG9K_FFjfUPwrg_tUKdWCwCXID-2pD1A';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'supabase.auth.token',
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-debug'
    }
  }
});

// Add debug logging for all Supabase queries
if (process.env.NODE_ENV === 'development') {
  const originalFrom = supabase.from.bind(supabase);
  supabase.from = function (table: string) {
    console.log('Supabase query to table:', table);
    return originalFrom(table);
  };
}

// Add global type for debugging
declare global {
  interface Window {
    supabase: typeof supabase;
  }
}

// Expose Supabase client globally for debugging
if (typeof window !== 'undefined') {
  window.supabase = supabase;
}
