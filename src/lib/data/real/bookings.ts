// ─────────────────────────────────────────────────────────────────────────────
// ChargeMate — Real Supabase booking implementations
//
// Signatures are IDENTICAL to lib/data/bookings.ts (mock layer).
// Booking mutations call Postgres RPC functions that enforce:
//   • State machine transitions
//   • Only-host / only-rider authorization
//   • Double-booking prevention with 15-min gap
//   • Auto gate_pin generation on accept
//   • kWh + amount calculation on endSession
//
// Session progress uses the MeterProvider interface.
// ─────────────────────────────────────────────────────────────────────────────

import type { Booking, SessionProgress } from "@/types/db";
import type { RequestBookingParams } from "../bookings";
import { createBrowserClient } from "@/lib/supabase/client";
import { simulatedMeter } from "../meter-provider";
import type { MeterProvider } from "../meter-provider";

// Allow callers to swap the meter for testing or real hardware.
let currentMeter: MeterProvider = simulatedMeter;
export function setMeterProvider(m: MeterProvider) { currentMeter = m; }

function supabase() { return createBrowserClient(); }

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  if (result.data === null) throw new Error("No data returned");
  return result.data;
}

/** Rider: create a booking request. Returns the new booking. */
export async function requestBooking(params: RequestBookingParams): Promise<Booking> {
  const res = await supabase().rpc("request_booking", {
    p_spot_id:           params.spotId,
    p_vehicle_id:        params.vehicleId,
    p_start_battery_pct: params.startBatteryPct,
  });
  return unwrap(res) as unknown as Booking;
}

/** Returns a single booking by ID. */
export async function getBooking(id: string): Promise<Booking> {
  const res = await supabase()
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single();
  return unwrap(res) as Booking;
}

/** Rider: returns all bookings for the logged-in rider. */
export async function getMyBookings(): Promise<Booking[]> {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const res = await supabase()
    .from("bookings")
    .select("*")
    .eq("rider_id", user.id)
    .order("created_at", { ascending: false });
  return unwrap(res) as Booking[];
}

/** Host: returns all pending booking requests for the host's spots. */
export async function getIncomingRequests(): Promise<Booking[]> {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get host's spot IDs, then fetch requested bookings
  const spotsRes = await supabase()
    .from("charging_spots")
    .select("id")
    .eq("host_id", user.id);
  const spotIds = unwrap(spotsRes).map((s: { id: string }) => s.id);
  if (spotIds.length === 0) return [];

  const res = await supabase()
    .from("bookings")
    .select("*")
    .in("spot_id", spotIds)
    .eq("status", "requested")
    .order("created_at", { ascending: false });
  return unwrap(res) as Booking[];
}

/** Host: accept a booking request. Sets status + generates a gate_pin. */
export async function acceptBooking(id: string): Promise<Booking> {
  const res = await supabase().rpc("accept_booking", { p_booking_id: id });
  return unwrap(res) as unknown as Booking;
}

/** Host: decline a booking request. */
export async function declineBooking(id: string): Promise<Booking> {
  const res = await supabase().rpc("decline_booking", { p_booking_id: id });
  return unwrap(res) as unknown as Booking;
}

/** Rider: cancel a booking. */
export async function cancelBooking(id: string): Promise<Booking> {
  const res = await supabase().rpc("cancel_booking", { p_booking_id: id });
  return unwrap(res) as unknown as Booking;
}

/** Host: mark session as actively charging. */
export async function startSession(id: string): Promise<Booking> {
  const res = await supabase().rpc("start_session", { p_booking_id: id });
  return unwrap(res) as unknown as Booking;
}

/** Rider: poll live session progress via MeterProvider. */
export async function getSessionProgress(id: string): Promise<SessionProgress> {
  // Fetch booking + spot + vehicle info for meter calculation
  const booking = await getBooking(id);
  if (booking.status !== "charging") throw new Error("Session is not active");
  if (!booking.started_at) throw new Error("Session has no start time");

  const spotRes = await supabase()
    .from("charging_spots")
    .select("power_kw, price_per_kwh")
    .eq("id", booking.spot_id)
    .single();
  const spot = unwrap(spotRes);

  const vehicleRes = await supabase()
    .from("vehicles")
    .select("battery_kwh")
    .eq("id", booking.vehicle_id)
    .single();
  const vehicle = unwrap(vehicleRes);

  const reading = currentMeter.getReading(
    booking.started_at,
    Number(spot.power_kw),
    Number(vehicle.battery_kwh),
    booking.start_battery_pct,
    Number(spot.price_per_kwh),
  );

  const costInr = Math.round(reading.kwhUsed * Number(spot.price_per_kwh) * 100) / 100;

  return {
    batteryPct: reading.batteryPct,
    kwhUsed:    Math.round(reading.kwhUsed * 10) / 10,
    costInr,
    elapsedSec: reading.elapsedSec,
  };
}

/** Host/Rider: end charging session, compute final totals. */
export async function endSession(id: string): Promise<Booking> {
  const res = await supabase().rpc("end_session", { p_booking_id: id });
  return unwrap(res) as unknown as Booking;
}

// ── Realtime subscription helper ──────────────────────────────────────────────

export type BookingChangeHandler = (booking: Booking) => void;

/**
 * Subscribe to real-time changes on a specific booking.
 * Returns an unsubscribe function.
 */
export function onBookingChange(bookingId: string, handler: BookingChangeHandler): () => void {
  const channel = supabase()
    .channel(`booking-${bookingId}`)
    .on<Booking>(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "bookings",
        filter: `id=eq.${bookingId}`,
      },
      (payload) => {
        handler(payload.new as Booking);
      }
    )
    .subscribe();

  return () => { supabase().removeChannel(channel); };
}

/**
 * Subscribe to all booking changes for the current user's spots (host view).
 * Returns an unsubscribe function.
 */
export function onIncomingBookingChanges(handler: BookingChangeHandler): () => void {
  const channel = supabase()
    .channel("host-bookings")
    .on<Booking>(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "bookings",
      },
      (payload) => {
        handler(payload.new as Booking);
      }
    )
    .subscribe();

  return () => { supabase().removeChannel(channel); };
}
