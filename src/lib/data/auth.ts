// ─────────────────────────────────────────────────────────────────────────────
// ChargeMate — Auth data layer (mock)
// Never call Supabase directly from pages/components — always go through here.
// ─────────────────────────────────────────────────────────────────────────────

import type { Profile, HostProfile, Vehicle, VehiclePayload, ActiveMode, VerificationStatus } from "@/types/db";
import { MOCK_RIDER_ID, MOCK_HOST_ID } from "./constants";

// ── Dev mode fixed OTP ────────────────────────────────────────────────────────
export const DEV_OTP = "123456";

// ── Auth session state (module-level, resets on hot-reload) ───────────────────

export type AuthSession = {
  userId: string;
  phone: string;
};

let currentSession: AuthSession | null = null;

// Seed profiles (shared with profile.ts via constants)
const PROFILES: Profile[] = [
  {
    id: MOCK_HOST_ID,
    full_name: "Ramesh Verma",
    phone: "+919876543210",
    avatar_url: "https://i.pravatar.cc/150?u=ramesh-verma",
    is_rider: false,
    is_host: true,
    active_mode: "host",
    created_at: "2026-05-01T10:00:00.000Z",
    updated_at: "2026-10-20T08:00:00.000Z",
  },
  {
    id: MOCK_RIDER_ID,
    full_name: "Pooja Hegde",
    phone: "+919823456789",
    avatar_url: "https://i.pravatar.cc/150?u=pooja-hegde",
    is_rider: true,
    is_host: false,
    active_mode: "charge",
    created_at: "2026-06-10T09:00:00.000Z",
    updated_at: "2026-10-22T12:00:00.000Z",
  },
];

const HOST_PROFILES: HostProfile[] = [
  {
    user_id: MOCK_HOST_ID,
    verification_status: "verified",
    id_doc_url: "https://example.com/mock-id-doc.jpg",
    bank_upi: "ramesh@upi",
    created_at: "2026-05-01T10:00:00.000Z",
    updated_at: "2026-10-20T08:00:00.000Z",
  },
];

const VEHICLES: Vehicle[] = [];

// ── OTP flow ──────────────────────────────────────────────────────────────────

/**
 * Step 1: Send OTP to phone.
 * In mock mode always succeeds. Real impl would call Supabase Auth.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function sendOtp(_phone: string): Promise<{ success: boolean }> {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 600));
  return { success: true };
}

/**
 * Step 2: Verify OTP.
 * Mock: accepts DEV_OTP (123456) or "000000" always succeeds.
 */
export async function verifyOtp(
  phone: string,
  otp: string
): Promise<{ session: AuthSession | null; isNewUser: boolean }> {
  await new Promise((r) => setTimeout(r, 500));

  const useMock = process.env.NEXT_PUBLIC_USE_MOCK === "true";
  const valid = useMock ? (otp === DEV_OTP || otp === "000000") : otp.length === 6;

  if (!valid) {
    return { session: null, isNewUser: false };
  }

  // Find existing profile by phone
  const existing = PROFILES.find((p) => p.phone === phone);
  if (existing) {
    currentSession = { userId: existing.id, phone };
    return { session: currentSession, isNewUser: false };
  }

  // New user — create a stub profile (will be completed in onboarding)
  const newId = `user-${Date.now()}`;
  const stub: Profile = {
    id: newId,
    full_name: "",
    phone,
    avatar_url: null,
    is_rider: false,
    is_host: false,
    active_mode: "charge",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  PROFILES.push(stub);
  currentSession = { userId: newId, phone };
  return { session: currentSession, isNewUser: true };
}

/** Google sign-in (mock — always returns mock rider session) */
export async function signInWithGoogle(): Promise<{ session: AuthSession; isNewUser: boolean }> {
  await new Promise((r) => setTimeout(r, 800));
  const profile = PROFILES.find((p) => p.id === MOCK_RIDER_ID)!;
  currentSession = { userId: profile.id, phone: profile.phone };
  return { session: currentSession, isNewUser: false };
}

/** Sign out */
export async function signOut(): Promise<void> {
  currentSession = null;
}

/** Get current session (synchronous — reads module state) */
export function getSession(): AuthSession | null {
  return currentSession;
}

// ── Onboarding ────────────────────────────────────────────────────────────────

export type OnboardingPayload = {
  fullName: string;
  role: "rider" | "host";           // primary role picked at onboarding
  vehicle?: Omit<VehiclePayload, never>; // required for riders
};

/**
 * Complete first-time onboarding.
 * Sets is_rider / is_host on the profile and optionally adds a vehicle.
 */
export async function completeOnboarding(
  userId: string,
  payload: OnboardingPayload
): Promise<Profile> {
  await new Promise((r) => setTimeout(r, 400));

  const idx = PROFILES.findIndex((p) => p.id === userId);
  if (idx === -1) throw new Error("Profile not found");

  PROFILES[idx] = {
    ...PROFILES[idx],
    full_name: payload.fullName,
    is_rider: payload.role === "rider",
    is_host: payload.role === "host",
    active_mode: payload.role === "rider" ? "charge" : "host",
    updated_at: new Date().toISOString(),
  };

  if (payload.role === "rider" && payload.vehicle) {
    VEHICLES.push({
      ...payload.vehicle,
      id: `vehicle-${Date.now()}`,
      owner_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  return { ...PROFILES[idx] };
}

// ── Profile helpers used by route guards ─────────────────────────────────────

/** Get full profile for any userId */
export async function getProfileById(userId: string): Promise<Profile | null> {
  return PROFILES.find((p) => p.id === userId) ?? null;
}

/** Get host profile (for verification check) */
export async function getHostProfile(userId: string): Promise<HostProfile | null> {
  return HOST_PROFILES.find((h) => h.user_id === userId) ?? null;
}

/**
 * Host onboarding: upload mock ID doc and create pending host_profile.
 */
export async function submitHostOnboarding(
  userId: string,
  _idDocFile: File
): Promise<HostProfile> {
  await new Promise((r) => setTimeout(r, 700));

  const existing = HOST_PROFILES.find((h) => h.user_id === userId);
  if (existing) {
    // Already submitted — return existing
    return { ...existing };
  }

  const hostProfile: HostProfile = {
    user_id: userId,
    verification_status: "pending",
    id_doc_url: `https://mock-storage.chargemate.in/${userId}/id-doc.jpg`,
    bank_upi: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  HOST_PROFILES.push(hostProfile);

  // Also mark profile as host
  const idx = PROFILES.findIndex((p) => p.id === userId);
  if (idx !== -1) {
    PROFILES[idx] = {
      ...PROFILES[idx],
      is_host: true,
      active_mode: "host",
      updated_at: new Date().toISOString(),
    };
  }

  return { ...hostProfile };
}

/** Update host verification status (admin mock) */
export async function updateHostVerificationStatus(
  userId: string,
  status: VerificationStatus
): Promise<HostProfile> {
  const idx = HOST_PROFILES.findIndex((h) => h.user_id === userId);
  if (idx === -1) throw new Error("Host profile not found");
  HOST_PROFILES[idx] = { ...HOST_PROFILES[idx], verification_status: status, updated_at: new Date().toISOString() };
  return { ...HOST_PROFILES[idx] };
}

/** Set active mode (called from ModeSwitcher) */
export async function setActiveModeForUser(userId: string, mode: ActiveMode): Promise<Profile> {
  const idx = PROFILES.findIndex((p) => p.id === userId);
  if (idx === -1) throw new Error("Profile not found");
  PROFILES[idx] = { ...PROFILES[idx], active_mode: mode, updated_at: new Date().toISOString() };
  return { ...PROFILES[idx] };
}
