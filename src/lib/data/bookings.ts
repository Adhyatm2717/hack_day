import type { Booking, BookingStatus, SessionProgress } from "@/types/db";
import { MOCK_RIDER_ID } from "./constants";

// ── Seed data ─────────────────────────────────────────────────────────────────

const MOCK_BOOKINGS: Booking[] = [
  // Active session — rider Pooja at Ramesh's spot
  {
    id:                "booking-001",
    rider_id:          MOCK_RIDER_ID,
    spot_id:           "spot-001",
    vehicle_id:        "vehicle-pooja-001",
    status:            "charging",
    start_battery_pct: 15,
    started_at:        "2026-10-24T17:12:00.000Z",
    ended_at:          null,
    kwh_used:          null,
    amount_inr:        null,
    gate_pin:          "7342",
    created_at:        "2026-10-24T17:00:00.000Z",
    updated_at:        "2026-10-24T17:12:00.000Z",
  },
  // Completed booking — earlier this month
  {
    id:                "booking-002",
    rider_id:          MOCK_RIDER_ID,
    spot_id:           "spot-003",
    vehicle_id:        "vehicle-pooja-001",
    status:            "completed",
    start_battery_pct: 22,
    started_at:        "2026-10-21T14:05:00.000Z",
    ended_at:          "2026-10-21T15:38:00.000Z",
    kwh_used:          8.2,
    amount_inr:        73.8,
    gate_pin:          "4891",
    created_at:        "2026-10-21T14:00:00.000Z",
    updated_at:        "2026-10-21T15:40:00.000Z",
  },
  // Completed — further back
  {
    id:                "booking-003",
    rider_id:          MOCK_RIDER_ID,
    spot_id:           "spot-005",
    vehicle_id:        "vehicle-pooja-001",
    status:            "completed",
    start_battery_pct: 10,
    started_at:        "2026-10-18T09:30:00.000Z",
    ended_at:          "2026-10-18T11:55:00.000Z",
    kwh_used:          13.6,
    amount_inr:        122.4,
    gate_pin:          "1023",
    created_at:        "2026-10-18T09:25:00.000Z",
    updated_at:        "2026-10-18T11:57:00.000Z",
  },
  // Incoming request to Ramesh's spot from another rider
  {
    id:                "booking-004",
    rider_id:          "rider-aarav-002",
    spot_id:           "spot-001",
    vehicle_id:        "vehicle-aarav-001",
    status:            "requested",
    start_battery_pct: 30,
    started_at:        null,
    ended_at:          null,
    kwh_used:          null,
    amount_inr:        null,
    gate_pin:          null,
    created_at:        "2026-10-24T22:30:00.000Z",
    updated_at:        "2026-10-24T22:30:00.000Z",
  },
  // A declined booking (host rejected)
  {
    id:                "booking-005",
    rider_id:          "rider-aarav-002",
    spot_id:           "spot-001",
    vehicle_id:        "vehicle-aarav-001",
    status:            "declined",
    start_battery_pct: 18,
    started_at:        null,
    ended_at:          null,
    kwh_used:          null,
    amount_inr:        null,
    gate_pin:          null,
    created_at:        "2026-10-22T11:00:00.000Z",
    updated_at:        "2026-10-22T11:05:00.000Z",
  },
  // Completed at Ramesh's spot — earns him revenue
  {
    id:                "booking-006",
    rider_id:          "rider-kavya-003",
    spot_id:           "spot-001",
    vehicle_id:        "vehicle-kavya-001",
    status:            "completed",
    start_battery_pct: 8,
    started_at:        "2026-10-24T10:00:00.000Z",
    ended_at:          "2026-10-24T12:30:00.000Z",
    kwh_used:          18.0,
    amount_inr:        216,
    gate_pin:          "9911",
    created_at:        "2026-10-24T09:55:00.000Z",
    updated_at:        "2026-10-24T12:32:00.000Z",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function withStatus(status: BookingStatus): Booking {
  return {
    ...MOCK_BOOKINGS[0],
    status,
    updated_at: new Date().toISOString(),
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface RequestBookingParams {
  spotId:          string;
  vehicleId:       string;
  startBatteryPct: number;
}

/** Rider: create a booking request. Returns the new booking. */
export async function requestBooking(params: RequestBookingParams): Promise<Booking> {
  const booking: Booking = {
    id:                `booking-${Date.now()}`,
    rider_id:          MOCK_RIDER_ID,
    spot_id:           params.spotId,
    vehicle_id:        params.vehicleId,
    status:            "requested",
    start_battery_pct: params.startBatteryPct,
    started_at:        null,
    ended_at:          null,
    kwh_used:          null,
    amount_inr:        null,
    gate_pin:          null,
    created_at:        new Date().toISOString(),
    updated_at:        new Date().toISOString(),
  };
  MOCK_BOOKINGS.push(booking);
  return booking;
}

/** Returns a single booking by ID. */
export async function getBooking(id: string): Promise<Booking> {
  const b = MOCK_BOOKINGS.find((b) => b.id === id);
  if (!b) throw new Error(`Booking not found: ${id}`);
  return { ...b };
}

/** Rider: returns all bookings for the logged-in rider. */
export async function getMyBookings(): Promise<Booking[]> {
  return MOCK_BOOKINGS
    .filter((b) => b.rider_id === MOCK_RIDER_ID)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** Host: returns all pending booking requests for the host's spot. */
export async function getIncomingRequests(): Promise<Booking[]> {
  // Host's spots are identified by host_id matching MOCK_HOST_ID (via spot lookup)
  // For mock, we just return bookings on spot-001 that are "requested"
  return MOCK_BOOKINGS
    .filter((b) => b.spot_id === "spot-001" && b.status === "requested")
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** Host: accept a booking request. Sets status + generates a gate_pin. */
export async function acceptBooking(id: string): Promise<Booking> {
  const idx = MOCK_BOOKINGS.findIndex((b) => b.id === id);
  if (idx === -1) throw new Error(`Booking not found: ${id}`);
  if (MOCK_BOOKINGS[idx].status !== "requested")
    throw new Error("Only 'requested' bookings can be accepted");
  MOCK_BOOKINGS[idx] = {
    ...MOCK_BOOKINGS[idx],
    status:     "accepted",
    gate_pin:   String(Math.floor(1000 + Math.random() * 9000)),
    updated_at: new Date().toISOString(),
  };
  return { ...MOCK_BOOKINGS[idx] };
}

/** Host: decline a booking request. */
export async function declineBooking(id: string): Promise<Booking> {
  const idx = MOCK_BOOKINGS.findIndex((b) => b.id === id);
  if (idx === -1) throw new Error(`Booking not found: ${id}`);
  if (MOCK_BOOKINGS[idx].status !== "requested")
    throw new Error(`Only requested bookings can be declined (current: ${MOCK_BOOKINGS[idx].status})`);
  MOCK_BOOKINGS[idx] = { ...MOCK_BOOKINGS[idx], status: "declined", updated_at: new Date().toISOString() };
  return { ...MOCK_BOOKINGS[idx] };
}

/** Rider: cancel a booking. */
export async function cancelBooking(id: string): Promise<Booking> {
  const idx = MOCK_BOOKINGS.findIndex((b) => b.id === id);
  if (idx === -1) throw new Error(`Booking not found: ${id}`);
  const allowed: BookingStatus[] = ["requested", "accepted"];
  if (!allowed.includes(MOCK_BOOKINGS[idx].status))
    throw new Error("Booking cannot be cancelled at this stage");
  MOCK_BOOKINGS[idx] = { ...MOCK_BOOKINGS[idx], status: "cancelled", updated_at: new Date().toISOString() };
  return { ...MOCK_BOOKINGS[idx] };
}

/** Host: mark session as actively charging. */
export async function startSession(id: string): Promise<Booking> {
  const idx = MOCK_BOOKINGS.findIndex((b) => b.id === id);
  if (idx === -1) throw new Error(`Booking not found: ${id}`);
  const candidate = MOCK_BOOKINGS[idx];
  const recentCompletion = MOCK_BOOKINGS.find((booking) =>
    booking.spot_id === candidate.spot_id && booking.status === "completed" && booking.ended_at &&
    Date.now() - new Date(booking.ended_at).getTime() < 15 * 60 * 1000
  );
  if (recentCompletion) throw new Error("The 15-minute gap rule blocks this booking. Please wait until 15 minutes after the previous session ends.");
  if (MOCK_BOOKINGS[idx].status !== "accepted")
    throw new Error(`Only accepted bookings can start charging (current: ${MOCK_BOOKINGS[idx].status})`);
  MOCK_BOOKINGS[idx] = {
    ...MOCK_BOOKINGS[idx],
    status:     "charging",
    started_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  return { ...MOCK_BOOKINGS[idx] };
}

/** Rider: poll live session progress. Returns mock incrementing values. */
export async function getSessionProgress(id: string): Promise<SessionProgress> {
  const b = MOCK_BOOKINGS.find((b) => b.id === id);
  if (!b) throw new Error(`Booking not found: ${id}`);
  if (b.status !== "charging") throw new Error("Session is not active");

  const startedAt    = b.started_at ? new Date(b.started_at).getTime() : Date.now();
  const elapsedSec   = Math.floor((Date.now() - startedAt) / 1000);
  const powerKw      = 6.9; // mock 7.2kW charger running at ~6.9kW
  const kwhUsed      = Math.min((powerKw * elapsedSec) / 3600, 24); // cap at full battery
  const batteryPct   = Math.min(b.start_battery_pct + Math.round((kwhUsed / 24) * 100), 100);
  const costInr      = Math.round(kwhUsed * 12 * 100) / 100; // ₹12/kWh

  return { batteryPct, kwhUsed: Math.round(kwhUsed * 10) / 10, costInr, elapsedSec };
}

/** Host/Rider: end charging session, compute final totals. */
export async function endSession(id: string): Promise<Booking> {
  const idx = MOCK_BOOKINGS.findIndex((b) => b.id === id);
  if (idx === -1) throw new Error(`Booking not found: ${id}`);
  if (MOCK_BOOKINGS[idx].status !== "charging")
    throw new Error("Session is not currently charging");

  const progress = await getSessionProgress(id);
  // amount_inr = kWh × price (mock: ₹12/kWh), consistent with SQL end_session.
  // The 10% platform fee is recorded in payments; amount_inr is the gross charge.
  MOCK_BOOKINGS[idx] = {
    ...MOCK_BOOKINGS[idx],
    status:     "completed",
    ended_at:   new Date().toISOString(),
    kwh_used:   progress.kwhUsed,
    amount_inr: Math.round(progress.costInr * 100) / 100,
    updated_at: new Date().toISOString(),
  };
  return { ...MOCK_BOOKINGS[idx] };
}
