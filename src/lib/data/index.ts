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

// ── Bookings — conditional real/mock ──────────────────────────────────────────
import * as mockBookings from "./bookings";
import * as realBookings from "./real/bookings";

export const requestBooking    = USE_MOCK ? mockBookings.requestBooking    : realBookings.requestBooking;
export const getBooking        = USE_MOCK ? mockBookings.getBooking        : realBookings.getBooking;
export const getMyBookings     = USE_MOCK ? mockBookings.getMyBookings     : realBookings.getMyBookings;
export const getIncomingRequests = USE_MOCK ? mockBookings.getIncomingRequests : realBookings.getIncomingRequests;
export const acceptBooking     = USE_MOCK ? mockBookings.acceptBooking     : realBookings.acceptBooking;
export const declineBooking    = USE_MOCK ? mockBookings.declineBooking    : realBookings.declineBooking;
export const cancelBooking     = USE_MOCK ? mockBookings.cancelBooking     : realBookings.cancelBooking;
export const startSession      = USE_MOCK ? mockBookings.startSession      : realBookings.startSession;
export const getSessionProgress = USE_MOCK ? mockBookings.getSessionProgress : realBookings.getSessionProgress;
export const endSession        = USE_MOCK ? mockBookings.endSession        : realBookings.endSession;

// Real-only helpers (no-op stubs in mock mode)
export const onBookingChange = USE_MOCK
  ? (_id: string, _handler: (b: import("@/types/db").Booking) => void) => () => {}
  : realBookings.onBookingChange;

export const onIncomingBookingChanges = USE_MOCK
  ? (_handler: (b: import("@/types/db").Booking) => void) => () => {}
  : realBookings.onIncomingBookingChanges;

export const setMeterProvider = USE_MOCK
  ? (_m: import("./meter-provider").MeterProvider) => {}
  : realBookings.setMeterProvider;

// ── Other modules — still mock-only barrel exports ────────────────────────────
export * from "./spots";
export * from "./vehicles";
export * from "./earnings";
export * from "./reviews";
export * from "./profile";
export * from "./payments";

// ── MeterProvider re-exports ──────────────────────────────────────────────────
export type { MeterProvider, MeterReading } from "./meter-provider";
export { SimulatedMeterProvider, simulatedMeter } from "./meter-provider";

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
