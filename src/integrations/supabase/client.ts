
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gqulqtialfsoabpqrkqs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxdWxxdGlhbGZzb2FicHFya3FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwOTY3MjIsImV4cCI6MjA1MzY3MjcyMn0.kdD-Y72BxIJYG9K_FFjfUPwrg_tUKdWCwCXID-2pD1A';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storage: window.localStorage
  }
});
