import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client.
 *
 * Why a module-level singleton:
 *   The service-role client carries no per-user state — every query passes the
 *   same admin credentials. Creating one client and reusing it across requests
 *   is cheaper than constructing one per call and avoids socket churn under
 *   load. Because we never mutate `auth` on this client (no sign-in / sign-out
 *   flow), there is no cross-request leakage risk.
 *
 * Why `server-only`:
 *   The service-role key MUST NEVER ship to the browser. The `server-only`
 *   import makes any accidental client import fail at build time instead of
 *   leaking the key at runtime. The `typeof window` guard is a defence-in-depth
 *   runtime check for edge cases (e.g. SSR contexts where the bundler check
 *   doesn't fire).
 *
 * Env contract:
 *   - SUPABASE_URL              : project URL
 *   - SUPABASE_SERVICE_ROLE_KEY : service-role key (server-only secret)
 *   Both are loaded from `.env.local` in dev / platform env in prod.
 */

let cached: SupabaseClient | undefined;

export function getSupabase(): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error(
      'lib/supabase/server is server-only and must not be imported from client code',
    );
  }

  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error('SUPABASE_URL is not set');
  if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');

  cached = createClient(url, serviceRoleKey, {
    // Service-role key issues a fresh JWT itself; we don't need session storage
    // or refresh logic, and disabling both keeps memory flat across requests.
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return cached;
}
