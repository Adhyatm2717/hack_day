// ─────────────────────────────────────────────────────────────────────────────
// ChargeMate — Supabase browser client
// Use this in Client Components / browser-side code.
//
// Usage:
//   import { createBrowserClient } from "@/lib/supabase/client";
//   const supabase = createBrowserClient();
// ─────────────────────────────────────────────────────────────────────────────

import { createBrowserClient as _createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

/**
 * Creates a Supabase client for use in browser (Client Components).
 * Re-use the same singleton across renders by calling this once at module level
 * or storing in state.
 */
export function createBrowserClient() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Copy .env.local.example → .env.local and fill in your project credentials."
    );
  }

  return _createBrowserClient<Database>(url, key);
}
