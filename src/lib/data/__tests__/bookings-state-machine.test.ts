// ─────────────────────────────────────────────────────────────────────────────
// ChargeMate — Mock booking state machine tests
//
// Tests every valid + illegal state transition and double-booking prevention.
// These run entirely in-memory (no Supabase required).
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach } from "vitest";

// We import directly from the mock module (not index) so we can reset state.
// The mock module uses module-level mutable arrays.
// We need a fresh import per test suite. Use vi.resetModules().
import { vi } from "vitest";

// ── Helpers to get a fresh module instance ────────────────────────────────────
async function freshBookings() {
  vi.resetModules();
  const mod = await import("@/lib/data/bookings");
  return mod;
}

// ── State machine: valid transitions ─────────────────────────────────────────
describe("Booking state machine — valid transitions (mock layer)", () => {
  it("requested → accepted (by host action)", async () => {
    const B = await freshBookings();
    const booking = await B.requestBooking({
      spotId: "spot-001", vehicleId: "vehicle-pooja-001", startBatteryPct: 20,
    });
    expect(booking.status).toBe("requested");
    expect(booking.gate_pin).toBeNull();

    const accepted = await B.acceptBooking(booking.id);
    expect(accepted.status).toBe("accepted");
    expect(accepted.gate_pin).toMatch(/^\d{4}$/);
  });

  it("requested → declined (by host action)", async () => {
    const B = await freshBookings();
    const booking = await B.requestBooking({
      spotId: "spot-001", vehicleId: "vehicle-pooja-001", startBatteryPct: 15,
    });
    const declined = await B.declineBooking(booking.id);
    expect(declined.status).toBe("declined");
  });

  it("requested → cancelled (by rider action)", async () => {
    const B = await freshBookings();
    const booking = await B.requestBooking({
      spotId: "spot-001", vehicleId: "vehicle-pooja-001", startBatteryPct: 10,
    });
    const cancelled = await B.cancelBooking(booking.id);
    expect(cancelled.status).toBe("cancelled");
  });

  it("accepted → cancelled (rider can cancel even after acceptance)", async () => {
    const B = await freshBookings();
    const booking = await B.requestBooking({
      spotId: "spot-001", vehicleId: "vehicle-pooja-001", startBatteryPct: 30,
    });
    await B.acceptBooking(booking.id);
    const cancelled = await B.cancelBooking(booking.id);
    expect(cancelled.status).toBe("cancelled");
  });

  it("accepted → charging → completed (full happy path)", async () => {
    const B = await freshBookings();
    const booking = await B.requestBooking({
      spotId: "spot-001", vehicleId: "vehicle-pooja-001", startBatteryPct: 25,
    });
    const accepted = await B.acceptBooking(booking.id);
    expect(accepted.status).toBe("accepted");

    const charging = await B.startSession(booking.id);
    expect(charging.status).toBe("charging");
    expect(charging.started_at).toBeTruthy();

    const progress = await B.getSessionProgress(booking.id);
    expect(progress.elapsedSec).toBeGreaterThanOrEqual(0);
    expect(progress.kwhUsed).toBeGreaterThanOrEqual(0);
    expect(progress.batteryPct).toBeGreaterThanOrEqual(25);

    const completed = await B.endSession(booking.id);
    expect(completed.status).toBe("completed");
    expect(completed.ended_at).toBeTruthy();
    expect(completed.kwh_used).not.toBeNull();
    expect(completed.amount_inr).not.toBeNull();
  });
});

// ── Illegal transitions ───────────────────────────────────────────────────────
describe("Booking state machine — illegal transitions (mock layer)", () => {
  it("cannot accept a booking that is already accepted", async () => {
    const B = await freshBookings();
    const booking = await B.requestBooking({
      spotId: "spot-001", vehicleId: "vehicle-pooja-001", startBatteryPct: 20,
    });
    await B.acceptBooking(booking.id);
    await expect(B.acceptBooking(booking.id)).rejects.toThrow();
  });

  it("cannot accept a declined booking", async () => {
    const B = await freshBookings();
    const booking = await B.requestBooking({
      spotId: "spot-001", vehicleId: "vehicle-pooja-001", startBatteryPct: 20,
    });
    await B.declineBooking(booking.id);
    await expect(B.acceptBooking(booking.id)).rejects.toThrow();
  });

  it("cannot accept a cancelled booking", async () => {
    const B = await freshBookings();
    const booking = await B.requestBooking({
      spotId: "spot-001", vehicleId: "vehicle-pooja-001", startBatteryPct: 20,
    });
    await B.cancelBooking(booking.id);
    await expect(B.acceptBooking(booking.id)).rejects.toThrow();
  });

  it("cannot cancel a charging session", async () => {
    const B = await freshBookings();
    const booking = await B.requestBooking({
      spotId: "spot-001", vehicleId: "vehicle-pooja-001", startBatteryPct: 20,
    });
    await B.acceptBooking(booking.id);
    await B.startSession(booking.id);
    await expect(B.cancelBooking(booking.id)).rejects.toThrow();
  });

  it("cannot cancel a completed booking", async () => {
    const B = await freshBookings();
    const booking = await B.requestBooking({
      spotId: "spot-001", vehicleId: "vehicle-pooja-001", startBatteryPct: 20,
    });
    await B.acceptBooking(booking.id);
    await B.startSession(booking.id);
    await B.endSession(booking.id);
    await expect(B.cancelBooking(booking.id)).rejects.toThrow();
  });

  it("cannot start session if not in accepted state", async () => {
    const B = await freshBookings();
    const booking = await B.requestBooking({
      spotId: "spot-001", vehicleId: "vehicle-pooja-001", startBatteryPct: 20,
    });
    // Still 'requested' — not accepted yet
    await expect(B.startSession(booking.id)).rejects.toThrow();
  });

  it("cannot start session if declined", async () => {
    const B = await freshBookings();
    const booking = await B.requestBooking({
      spotId: "spot-001", vehicleId: "vehicle-pooja-001", startBatteryPct: 20,
    });
    await B.declineBooking(booking.id);
    await expect(B.startSession(booking.id)).rejects.toThrow();
  });

  it("cannot end a session that is not charging", async () => {
    const B = await freshBookings();
    const booking = await B.requestBooking({
      spotId: "spot-001", vehicleId: "vehicle-pooja-001", startBatteryPct: 20,
    });
    await expect(B.endSession(booking.id)).rejects.toThrow();
  });

  it("cannot get session progress if not in charging state", async () => {
    const B = await freshBookings();
    const booking = await B.requestBooking({
      spotId: "spot-001", vehicleId: "vehicle-pooja-001", startBatteryPct: 20,
    });
    await expect(B.getSessionProgress(booking.id)).rejects.toThrow("Session is not active");
  });

  it("cannot end a session twice", async () => {
    const B = await freshBookings();
    const booking = await B.requestBooking({
      spotId: "spot-001", vehicleId: "vehicle-pooja-001", startBatteryPct: 20,
    });
    await B.acceptBooking(booking.id);
    await B.startSession(booking.id);
    await B.endSession(booking.id);
    await expect(B.endSession(booking.id)).rejects.toThrow();
  });

  it("throws when booking does not exist", async () => {
    const B = await freshBookings();
    await expect(B.getBooking("non-existent-id")).rejects.toThrow("Booking not found");
    await expect(B.acceptBooking("non-existent-id")).rejects.toThrow("Booking not found");
    await expect(B.cancelBooking("non-existent-id")).rejects.toThrow("Booking not found");
  });
});

// ── Full state-machine transition table ───────────────────────────────────────
describe("State machine exhaustive table", () => {
  const ILLEGAL: Array<{
    from: string;
    action: string;
    setup: (B: Awaited<ReturnType<typeof freshBookings>>, id: string) => Promise<void>;
    act:   (B: Awaited<ReturnType<typeof freshBookings>>, id: string) => Promise<unknown>;
  }> = [
    {
      from: "declined",  action: "decline again",
      setup: async (B, id) => { await B.declineBooking(id); },
      act:   async (B, id) => B.declineBooking(id),
    },
    {
      from: "cancelled", action: "decline",
      setup: async (B, id) => { await B.cancelBooking(id); },
      act:   async (B, id) => B.declineBooking(id),
    },
    {
      from: "charging",  action: "accept",
      setup: async (B, id) => { await B.acceptBooking(id); await B.startSession(id); },
      act:   async (B, id) => B.acceptBooking(id),
    },
    {
      from: "completed", action: "start session",
      setup: async (B, id) => {
        await B.acceptBooking(id); await B.startSession(id); await B.endSession(id);
      },
      act: async (B, id) => B.startSession(id),
    },
  ];

  for (const tc of ILLEGAL) {
    it(`[${tc.from}] → ${tc.action} is rejected`, async () => {
      const B = await freshBookings();
      const booking = await B.requestBooking({
        spotId: "spot-001", vehicleId: "vehicle-pooja-001", startBatteryPct: 20,
      });
      await tc.setup(B, booking.id);
      await expect(tc.act(B, booking.id)).rejects.toThrow();
    });
  }
});
