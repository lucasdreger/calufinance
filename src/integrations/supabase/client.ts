import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gqulqtialfsoabpqrkqs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxdWxxdGlhbGZzb2FicHFya3FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4MzI1NjcsImV4cCI6MjAyNTQwODU2N30.vxjjXfY9R0tHQSqWZm-jXOZYh9LUW4yNGgzX4GFzEYE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: localStorage
  }
});