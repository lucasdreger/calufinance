import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gqulqtialfsoabpqrkqs.supabase.co';
const supabaseAnonKey = 'zhdqzyX7aW7ykz_';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storage: window.localStorage
  }
});