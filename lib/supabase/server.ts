import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | undefined;

export function getSupabase(): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error('lib/supabase/server is server-only and must not be imported from client code');
  }

  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error('SUPABASE_URL is not set');
  if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');

  cached = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return cached;
}
