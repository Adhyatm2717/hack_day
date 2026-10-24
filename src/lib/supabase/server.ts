// ─────────────────────────────────────────────────────────────────────────────
// ChargeMate — Supabase server client
// ─────────────────────────────────────────────────────────────────────────────

import { createServerClient as _createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "./types";

/** Server Component / Action / Route Handler — uses cookies for auth. */
export async function createServerClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars.");

  return _createServerClient<Database>(url, key, {
    cookies: {
      getAll()  { return cookieStore.getAll(); },
      setAll(c) {
        try { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
        catch { /* read-only in Server Components — middleware refreshes */ }
      },
    },
  });
}

/** Admin client using service_role key — never expose to browser. */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase admin env vars.");

  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
