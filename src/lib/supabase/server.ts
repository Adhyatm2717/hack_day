// ─────────────────────────────────────────────────────────────────────────────
// ChargeMate — Supabase server client
// Use this in Server Components, Server Actions, and Route Handlers.
//
// Usage:
//   import { createServerClient } from "@/lib/supabase/server";
//   const supabase = await createServerClient();
// ─────────────────────────────────────────────────────────────────────────────

import { createServerClient as _createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "./types";

/**
 * Creates a Supabase client for use in Next.js Server Components / Actions.
 * Reads and writes cookies via next/headers so auth tokens persist correctly.
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Copy .env.local.example → .env.local and fill in your project credentials."
    );
  }

  return _createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // setAll can throw in Server Components (read-only context).
          // This is safe to ignore — the middleware will refresh the session.
        }
      },
    },
  });
}

/**
 * Creates a Supabase admin client using the service_role key.
 * Only call this from trusted server-side code (Route Handlers, Server Actions).
 * Never expose the service_role key to the browser.
 */
export function createAdminClient() {
  const url         = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
      "Only use createAdminClient() in trusted server-side code."
    );
  }

  // Use the base supabase-js client (no cookie handling needed for service role)
  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
