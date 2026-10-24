import type { Profile, ActiveMode } from "@/types/db";
import { MOCK_HOST_ID, MOCK_RIDER_ID } from "./constants";

// ── Seed data ─────────────────────────────────────────────────────────────────

const MOCK_PROFILES: Profile[] = [
  {
    id:          MOCK_HOST_ID,
    full_name:   "Ramesh Verma",
    phone:       "+919876543210",
    avatar_url:  "https://i.pravatar.cc/150?u=ramesh-verma",
    is_rider:    false,
    is_host:     true,
    active_mode: "host",
    created_at:  "2026-05-01T10:00:00.000Z",
    updated_at:  "2026-10-20T08:00:00.000Z",
  },
  {
    id:          MOCK_RIDER_ID,
    full_name:   "Pooja Hegde",
    phone:       "+919823456789",
    avatar_url:  "https://i.pravatar.cc/150?u=pooja-hegde",
    is_rider:    true,
    is_host:     false,
    active_mode: "charge",
    created_at:  "2026-06-10T09:00:00.000Z",
    updated_at:  "2026-10-22T12:00:00.000Z",
  },
];

// Which mock persona is "logged in" — set by NEXT_PUBLIC_MOCK_PERSONA or default rider
function getLoggedInId(): string {
  // In a real app this comes from the auth session.
  // In mock mode, we use the rider (Pooja) as the default.
  return MOCK_RIDER_ID;
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Returns the logged-in user's profile. */
export async function getMyProfile(): Promise<Profile> {
  const id = getLoggedInId();
  const profile = MOCK_PROFILES.find((p) => p.id === id);
  if (!profile) throw new Error("Profile not found");
  return { ...profile };
}

/** Sets the logged-in user's active mode (charge | host). */
export async function setActiveMode(mode: ActiveMode): Promise<Profile> {
  const id  = getLoggedInId();
  const idx = MOCK_PROFILES.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error("Profile not found");
  MOCK_PROFILES[idx] = {
    ...MOCK_PROFILES[idx],
    active_mode: mode,
    updated_at:  new Date().toISOString(),
  };
  return { ...MOCK_PROFILES[idx] };
}
