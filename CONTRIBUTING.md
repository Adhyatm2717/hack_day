# ChargeMate — Contributing Guide

> This document is the **shared contract** for the 4-person team.  
> Read it before writing a single line of code.

---

## Folder Ownership

| Area | Owner | Key paths |
|---|---|---|
| **Design system & tokens** | Person 1 | `tailwind.config.ts`, `globals.css`, `src/components/chargemate/` |
| **Rider screens** | Person 2 | `src/app/(rider)/`, `src/components/layout/` (header/nav) |
| **Host screens** | Person 3 | `src/app/(host)/`, host-specific components |
| **Data layer & types** | Person 4 | `src/lib/data/`, `src/types/db.ts`, `src/supabase/` |

Reviewers: any PR touching a path outside your area **requires an approval** from that area's owner before merge.

---

## Branch Naming

```
<type>/<area>/<short-description>

feat/rider/booking-flow
feat/host/earnings-page
fix/design/modeswitcher-contrast
chore/data/supabase-spots
```

**Types:** `feat`, `fix`, `chore`, `refactor`, `docs`  
**Areas:** `rider`, `host`, `design`, `data`, `infra`

---

## Golden Rule — Data Access

> **Never call Supabase (or any backend) directly from a component.**  
> All data access goes through `lib/data/*`.

```
✅  import { getNearbySpots } from "@/lib/data"
❌  import { createClient } from "@/supabase/client" ← in a component
```

This keeps the mock ↔ real switch transparent.  
The switch lives in `src/lib/data/index.ts` and is controlled by `NEXT_PUBLIC_USE_MOCK`.

---

## Data Layer Contract

Every function in `lib/data/` must:

1. **Keep the exact signature** defined in `lib/data/*.ts` — don't add required params without team consensus.
2. **Return the exact type** defined in `src/types/db.ts`.
3. **Throw a plain `Error`** with a human-readable message on failure (no raw Supabase errors to components).
4. **Be async** even if the current impl is synchronous mock data.

---

## Shared Mock Personas

| Persona | Role | Details |
|---|---|---|
| **Ramesh Verma** | Mock logged-in host | Koramangala 4th Block, Bengaluru · verified |
| **Pooja Hegde** | Mock logged-in rider | Tata Tiago EV, CCS2, 24 kWh |

Use `MOCK_HOST_ID = "host-ramesh-001"` and `MOCK_RIDER_ID = "rider-pooja-001"` from `lib/data/index.ts` as the "current user" in all mock functions.

---

## PR Checklist

Before opening a PR, tick all boxes:

- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] `npm run lint` passes with 0 errors
- [ ] No `any` types introduced (use `unknown` + type guards instead)
- [ ] No direct Supabase imports in components
- [ ] New components added to `/dev/components` showcase
- [ ] Commit message follows Conventional Commits: `feat(rider): add booking card`

---

## Environment Setup

```bash
cp .env.local.example .env.local
# Set NEXT_PUBLIC_USE_MOCK=true to use mock data (no Supabase needed)
npm install
npm run dev
```

Browse to **http://localhost:3000/dev/components** to see the design system.

---

## Supabase (when ready)

- Schema migrations live in `supabase/migrations/`
- Types are auto-generated into `src/types/db.ts` via `supabase gen types typescript`
- Set `NEXT_PUBLIC_USE_MOCK=false` and fill in Supabase env vars to go live
- The real implementations go in `src/lib/data/real/` — Person 4 owns this

---

## Colours & Components

- All colours come from CSS variables in `globals.css` — **don't hardcode hex values**
- Use `src/components/chargemate/*` for all UI primitives (Button, Badge, Card, etc.)
- Never use `className="bg-orange-500"` — use `className="bg-charge"` etc.
- No purple, no blue gradients, no glassmorphism — see DESIGN.md
