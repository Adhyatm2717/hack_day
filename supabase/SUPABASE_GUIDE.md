# ChargeMate — Supabase Backend Guide

> **Scope:** This guide covers only the backend files you own.  
> Do **not** edit `lib/data/*` signatures, `types/db.ts`, `components/ui`, or teammates' folders.

---

## Files Created

| File | Purpose |
|---|---|
| `supabase/config.toml` | Supabase CLI local dev config |
| `supabase/migrations/20260801000000_init.sql` | Full schema: tables, enums, RLS, functions, triggers, storage |
| `supabase/seed.sql` | Fake data matching `lib/data/*` mocks |
| `src/lib/supabase/client.ts` | Browser (Client Component) Supabase client |
| `src/lib/supabase/server.ts` | Server Component / Action / Route Handler client |
| `src/lib/supabase/types.ts` | Hand-authored generated types (`Database` interface) |

---

## Prerequisites

### 1. Install Supabase CLI (once)

```bash
brew install supabase/tap/supabase
# or
npm install -g supabase
```

### 2. Install Docker Desktop (for local dev)

The Supabase CLI spins up a local Postgres + PostGIS instance via Docker.  
Download: https://www.docker.com/products/docker-desktop/

---

## Running Locally

```bash
# 1. Start Docker Desktop first, then:
cd hack_day

# 2. Start the local Supabase stack
supabase start

# Output includes:
#   API URL:   http://127.0.0.1:54321
#   DB URL:    postgresql://postgres:postgres@127.0.0.1:54322/postgres
#   Studio:    http://127.0.0.1:54323
#   Anon key:  eyJ... (copy this)
```

The `supabase start` command automatically runs all files in `supabase/migrations/` in filename order.

### 3. Copy environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with the values printed by `supabase start`:

```
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from supabase start output>
SUPABASE_SERVICE_ROLE_KEY=<service_role key from supabase start output>
```

### 4. Seed the database

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -f supabase/seed.sql
```

Or use the Supabase Studio SQL editor at http://127.0.0.1:54323.

### 5. Run the app

```bash
npm run dev
# → http://localhost:3000
```

---

## Deploying to Supabase Cloud

### Link your project

```bash
supabase login
supabase link --project-ref <your-project-ref>
```

### Push migrations

```bash
supabase db push
```

This runs all `supabase/migrations/*.sql` files against the remote project.

### Seed remote database

```bash
# Get connection string from Supabase dashboard → Settings → Database
psql "postgresql://postgres:<password>@<host>:5432/postgres" \
  -f supabase/seed.sql
```

### Regenerate types (after schema changes)

```bash
npx supabase gen types typescript \
  --project-id <your-project-ref> \
  --schema public \
  > src/lib/supabase/types.ts
```

---

## Schema Summary

### Tables

| Table | Key columns | RLS |
|---|---|---|
| `profiles` | `id` (= auth.users.id), `is_rider`, `is_host`, `active_mode` | Owner read/update only |
| `vehicles` | `id`, `owner_id` → profiles | Owner CRUD only |
| `host_profiles` | `user_id` → profiles, `verification_status`, `id_doc_url`, `bank_upi` | Owner CRUD only (id_doc_url private) |
| `charging_spots` | `id`, `host_id`, `location` (PostGIS), `is_online`, `rating` | Authenticated read online; host CRUD own |
| `bookings` | `id`, `rider_id`, `spot_id`, `status`, `gate_pin` | Rider sees own; host sees bookings on their spots |
| `payments` | `id`, `booking_id`, `amount_inr`, `platform_fee_inr`, `host_payout_inr` | Rider/host read; service_role write |
| `reviews` | `id`, `booking_id`, `rater_id`, `host_id`, `rating`, `reply` | Authenticated read; rider insert; host update reply |
| `wallets` | `user_id`, `balance_inr` | Owner read/update; service_role all |

### PostGIS Function: `nearby_spots`

```sql
SELECT * FROM nearby_spots(
  lat        => 12.9784,
  lng        => 77.6408,
  radius_km  => 10,
  connector  => 'CCS2',   -- or NULL for any
  only_online => true
);
```

Returns all columns of `charging_spots` plus `distance_km` (rounded to 1 decimal), ordered nearest first.

### Triggers

| Trigger | Table | Effect |
|---|---|---|
| `on_auth_user_created` | `auth.users` | Creates `profiles` + `wallets` row on signup |
| `trg_charging_spots_location_sync` | `charging_spots` | Syncs `location` geography from `lat`/`lng` |
| `trg_refresh_spot_rating` | `reviews` | Recomputes `charging_spots.rating` + `review_count` after review insert/update |
| `trg_*_updated_at` | all tables | Sets `updated_at = now()` on every UPDATE |

### Storage Buckets

| Bucket | Public | Max size | Allowed types |
|---|---|---|---|
| `id-documents` | ❌ Private | 10 MB | JPEG, PNG, PDF |
| `spot-photos` | ✅ Public | 5 MB | JPEG, PNG, WebP |
| `avatars` | ✅ Public | 2 MB | JPEG, PNG, WebP |

File paths follow the convention `{owner_uuid}/{filename}` so RLS can verify ownership via `(storage.foldername(name))[1]`.

---

## Using the Clients

### Browser / Client Component

```tsx
"use client";
import { createBrowserClient } from "@/lib/supabase/client";

export function MyComponent() {
  const supabase = createBrowserClient();
  // ...
}
```

### Server Component / Action

```tsx
import { createServerClient } from "@/lib/supabase/server";

export async function MyServerComponent() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  // ...
}
```

### Calling the nearby_spots RPC

```tsx
const { data, error } = await supabase
  .rpc("nearby_spots", {
    lat:         12.9784,
    lng:         77.6408,
    radius_km:   10,
    only_online: true,
  });
```

---

## Important Rules

1. **Never call Supabase directly from components.** All data access goes through `lib/data/*`.
2. **Never change `types/db.ts` signatures** — three teammates depend on them. If a change is needed, stop and raise it with the team.
3. **Never change `lib/data/*` signatures** — same reason.
4. **Never expose `SUPABASE_SERVICE_ROLE_KEY`** to the browser.
5. The `NEXT_PUBLIC_USE_MOCK=true` flag keeps the app running entirely off mock data — useful for frontend teammates who haven't set up Supabase yet.
