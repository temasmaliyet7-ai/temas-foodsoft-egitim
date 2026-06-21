import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

// Service-role istemci: RLS'i bypass eder. SADECE sunucuda kullanılır.
// Anahtar tarayıcıya asla gönderilmez.
export const supabase: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

export const STORAGE_BUCKET = env.SUPABASE_STORAGE_BUCKET;
