// ─────────────────────────────────────────────────────────────────────────────
// ChargeMate — Data Layer Index
//
// This is the ONLY import point for data functions in the entire app.
//
//   import { getNearbySpots, getBooking } from "@/lib/data"
//
// When NEXT_PUBLIC_USE_MOCK === "true"  → mock implementations (no Supabase)
// When NEXT_PUBLIC_USE_MOCK !== "true"  → real Supabase implementations
//
// Never import from individual lib/data/*.ts files in components.
// ─────────────────────────────────────────────────────────────────────────────

// ── Shared persona IDs ────────────────────────────────────────────────────────
// In mock files, import from "./constants" (not here) to avoid circular deps.
export { MOCK_HOST_ID, MOCK_RIDER_ID } from "./constants";

// ── Switch ────────────────────────────────────────────────────────────────────
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

// ── Mock implementations ──────────────────────────────────────────────────────
export * from "./spots";
export * from "./bookings";
export * from "./vehicles";
export * from "./earnings";
export * from "./reviews";
export * from "./profile";
export * from "./payments";

// ── Future: Real Supabase implementations ────────────────────────────────────
// When Person 4 implements the real layer:
//
//   import * as mockSpots    from "./spots";
//   import * as realSpots    from "./real/spots";
//   export const getNearbySpots = USE_MOCK ? mockSpots.getNearbySpots : realSpots.getNearbySpots;
//   ... (repeat for every function)
//
// The barrel export above covers mock-only mode.
// When adding real implementations, replace the barrel exports with
// conditional re-exports as shown in the pattern above.

// ── Re-export all types so callers only need one import ───────────────────────
export type {
  // Tables
  Profile,
  Vehicle,
  HostProfile,
  ChargingSpot,
  Booking,
  Payment,
  Review,
  // Primitives / enums
  ConnectorType,
  VehicleType,
  ActiveMode,
  BookingStatus,
  PaymentStatus,
  VerificationStatus,
  // Composites
  SessionProgress,
  EarningsSummary,
  LedgerEntry,
  MonthlyRevenue,
  PayoutSettings,
  PaymentOrder,
  WalletBalance,
  SpotUpdatePayload,
  VehiclePayload,
} from "@/types/db";

export type { GetNearbySpotsParams } from "./spots";
export type { RequestBookingParams }  from "./bookings";
export type { SubmitReviewParams }    from "./reviews";
