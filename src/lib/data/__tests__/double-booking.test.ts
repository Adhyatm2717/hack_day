// ─────────────────────────────────────────────────────────────────────────────
// ChargeMate — Double-booking + Postgres RPC guard tests
//
// Part 1: Tests that use the Postgres `spot_has_overlap` logic in TypeScript
//         to verify the double-booking rules (no Supabase connection needed).
//
// Part 2: Tests for the real Supabase booking layer using a Supabase test double
//         that simulates RPC error responses, covering every guard rule.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from "vitest";

// ═══════════════════════════════════════════════════════════════════════════════
//  Part 1: Double-booking logic (pure TS mirror of Postgres spot_has_overlap)
// ═══════════════════════════════════════════════════════════════════════════════

import type { Booking } from "@/types/db";

// Mirror of the Postgres `spot_has_overlap` logic in TypeScript (for fast unit tests).
// This is the exact same rule: active booking OR completed < 15 min ago.
function spotHasOverlap(
  bookings: Booking[],
  spotId: string,
  excludeBookingId?: string,
): boolean {
  const now = Date.now();
  return bookings.some((b) => {
    if (b.spot_id !== spotId) return false;
    if (excludeBookingId && b.id === excludeBookingId) return false;

    if (["requested", "accepted", "charging"].includes(b.status)) return true;

    if (b.status === "completed" && b.ended_at) {
      const endedMs = new Date(b.ended_at).getTime();
      return now - endedMs < 15 * 60 * 1000; // within 15 minutes
    }
    return false;
  });
}

function makeBooking(overrides: Partial<Booking>): Booking {
  return {
    id: `booking-${Math.random()}`,
    rider_id: "rider-1",
    spot_id: "spot-001",
    vehicle_id: "vehicle-1",
    status: "requested",
    start_battery_pct: 20,
    started_at: null,
    ended_at: null,
    kwh_used: null,
    amount_inr: null,
    gate_pin: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("Double-booking prevention (spotHasOverlap logic)", () => {
  it("no overlap when no bookings exist", () => {
    expect(spotHasOverlap([], "spot-001")).toBe(false);
  });

  it("blocks: requested booking on same spot", () => {
    const bookings = [makeBooking({ status: "requested" })];
    expect(spotHasOverlap(bookings, "spot-001")).toBe(true);
  });

  it("blocks: accepted booking on same spot", () => {
    const bookings = [makeBooking({ status: "accepted", gate_pin: "1234" })];
    expect(spotHasOverlap(bookings, "spot-001")).toBe(true);
  });

  it("blocks: charging session on same spot", () => {
    const bookings = [makeBooking({ status: "charging", started_at: new Date().toISOString() })];
    expect(spotHasOverlap(bookings, "spot-001")).toBe(true);
  });

  it("blocks: completed session ended less than 15 minutes ago", () => {
    const thirteenMinutesAgo = new Date(Date.now() - 13 * 60 * 1000).toISOString();
    const bookings = [makeBooking({ status: "completed", ended_at: thirteenMinutesAgo })];
    expect(spotHasOverlap(bookings, "spot-001")).toBe(true);
  });

  it("allows: completed session ended more than 15 minutes ago", () => {
    const sixteenMinutesAgo = new Date(Date.now() - 16 * 60 * 1000).toISOString();
    const bookings = [makeBooking({ status: "completed", ended_at: sixteenMinutesAgo })];
    expect(spotHasOverlap(bookings, "spot-001")).toBe(false);
  });

  it("allows: declined/cancelled/expired bookings do NOT block the spot", () => {
    const declined  = makeBooking({ status: "declined" });
    const cancelled = makeBooking({ status: "cancelled" });
    const expired   = makeBooking({ status: "expired" });
    expect(spotHasOverlap([declined, cancelled, expired], "spot-001")).toBe(false);
  });

  it("does not block a DIFFERENT spot", () => {
    const bookings = [makeBooking({ spot_id: "spot-002", status: "charging" })];
    expect(spotHasOverlap(bookings, "spot-001")).toBe(false);
  });

  it("excludeBookingId skips that booking (for checking same booking again)", () => {
    const b = makeBooking({ status: "requested" });
    // Without exclude: blocked
    expect(spotHasOverlap([b], "spot-001")).toBe(true);
    // With exclude: not blocked
    expect(spotHasOverlap([b], "spot-001", b.id)).toBe(false);
  });

  it("two simultaneous requested bookings — second is blocked", () => {
    const first  = makeBooking({ id: "b-1", status: "requested" });
    const second = makeBooking({ id: "b-2", status: "requested" });
    // Check from perspective of adding a new booking (neither is excluded)
    expect(spotHasOverlap([first, second], "spot-001")).toBe(true);
  });

  it("spot becomes available exactly at 15-minute mark", () => {
    // exactly 15 minutes and 1 second ago — should be free
    const fifteenMin1sAgo = new Date(Date.now() - (15 * 60 + 1) * 1000).toISOString();
    const bookings = [makeBooking({ status: "completed", ended_at: fifteenMin1sAgo })];
    expect(spotHasOverlap(bookings, "spot-001")).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  Part 2: Real Supabase layer — guard rule tests via mock client
// ═══════════════════════════════════════════════════════════════════════════════

// We mock createBrowserClient so no actual Supabase connection is made.
// Each test configures the mock to return the appropriate error or success.

type RpcCallArgs = { p_booking_id?: string; p_spot_id?: string };

// Build a minimal Supabase client mock
function makeSupabaseMock(rpcError: string | null, rpcData: unknown = null) {
  const mockRpc = vi.fn().mockResolvedValue(
    rpcError
      ? { data: null, error: { message: rpcError } }
      : { data: rpcData, error: null }
  );
  const mockFrom = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: { message: "mock" } }),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: [], error: null }),
  });
  const mockAuth = {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
  };
  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  };

  return {
    rpc: mockRpc,
    from: mockFrom,
    auth: mockAuth,
    channel: vi.fn().mockReturnValue(mockChannel),
    removeChannel: vi.fn(),
  };
}

// Helper to run a real-layer function with an injected mock client
async function withMockClient<T>(
  clientMock: ReturnType<typeof makeSupabaseMock>,
  fn: () => Promise<T>,
): Promise<T> {
  vi.resetModules();
  vi.doMock("@/lib/supabase/client", () => ({
    createBrowserClient: () => clientMock,
  }));
  const mod = await import("@/lib/data/real/bookings");
  return fn.call(mod);
}

describe("Real booking layer — server-enforced guard rules (mock client)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requestBooking: throws when spot is offline (Postgres rejects)", async () => {
    vi.resetModules();
    vi.doMock("@/lib/supabase/client", () => ({
      createBrowserClient: () => makeSupabaseMock("Spot is offline or does not exist"),
    }));
    const { requestBooking } = await import("@/lib/data/real/bookings");
    await expect(
      requestBooking({ spotId: "spot-1", vehicleId: "v-1", startBatteryPct: 20 })
    ).rejects.toThrow("Spot is offline or does not exist");
  });

  it("requestBooking: throws when spot is already busy (double-booking)", async () => {
    vi.resetModules();
    vi.doMock("@/lib/supabase/client", () => ({
      createBrowserClient: () => makeSupabaseMock("Spot is currently busy or in cooldown"),
    }));
    const { requestBooking } = await import("@/lib/data/real/bookings");
    await expect(
      requestBooking({ spotId: "spot-1", vehicleId: "v-1", startBatteryPct: 20 })
    ).rejects.toThrow("Spot is currently busy or in cooldown");
  });

  it("acceptBooking: throws when caller is not the host", async () => {
    vi.resetModules();
    vi.doMock("@/lib/supabase/client", () => ({
      createBrowserClient: () => makeSupabaseMock("Only the host of this spot can accept bookings"),
    }));
    const { acceptBooking } = await import("@/lib/data/real/bookings");
    await expect(acceptBooking("booking-1")).rejects.toThrow("Only the host");
  });

  it("acceptBooking: throws on illegal state (already accepted)", async () => {
    vi.resetModules();
    vi.doMock("@/lib/supabase/client", () => ({
      createBrowserClient: () => makeSupabaseMock(
        "Only requested bookings can be accepted (current: accepted)"
      ),
    }));
    const { acceptBooking } = await import("@/lib/data/real/bookings");
    await expect(acceptBooking("booking-1")).rejects.toThrow("Only requested bookings can be accepted");
  });

  it("declineBooking: throws when caller is not the host", async () => {
    vi.resetModules();
    vi.doMock("@/lib/supabase/client", () => ({
      createBrowserClient: () => makeSupabaseMock("Only the host of this spot can decline bookings"),
    }));
    const { declineBooking } = await import("@/lib/data/real/bookings");
    await expect(declineBooking("booking-1")).rejects.toThrow("Only the host");
  });

  it("cancelBooking: throws when caller is not the rider", async () => {
    vi.resetModules();
    vi.doMock("@/lib/supabase/client", () => ({
      createBrowserClient: () => makeSupabaseMock("Only the rider can cancel a booking"),
    }));
    const { cancelBooking } = await import("@/lib/data/real/bookings");
    await expect(cancelBooking("booking-1")).rejects.toThrow("Only the rider can cancel");
  });

  it("cancelBooking: throws when booking is in charging state", async () => {
    vi.resetModules();
    vi.doMock("@/lib/supabase/client", () => ({
      createBrowserClient: () => makeSupabaseMock(
        "Booking cannot be cancelled at this stage (current: charging)"
      ),
    }));
    const { cancelBooking } = await import("@/lib/data/real/bookings");
    await expect(cancelBooking("booking-1")).rejects.toThrow("cannot be cancelled");
  });

  it("startSession: throws when caller is not the host", async () => {
    vi.resetModules();
    vi.doMock("@/lib/supabase/client", () => ({
      createBrowserClient: () => makeSupabaseMock("Only the host can start a session"),
    }));
    const { startSession } = await import("@/lib/data/real/bookings");
    await expect(startSession("booking-1")).rejects.toThrow("Only the host can start");
  });

  it("startSession: throws when booking is not accepted", async () => {
    vi.resetModules();
    vi.doMock("@/lib/supabase/client", () => ({
      createBrowserClient: () => makeSupabaseMock(
        "Only accepted bookings can start charging (current: requested)"
      ),
    }));
    const { startSession } = await import("@/lib/data/real/bookings");
    await expect(startSession("booking-1")).rejects.toThrow("Only accepted bookings can start charging");
  });

  it("endSession: throws when session is not charging", async () => {
    vi.resetModules();
    vi.doMock("@/lib/supabase/client", () => ({
      createBrowserClient: () => makeSupabaseMock(
        "Session is not currently charging (current: completed)"
      ),
    }));
    const { endSession } = await import("@/lib/data/real/bookings");
    await expect(endSession("booking-1")).rejects.toThrow("not currently charging");
  });

  it("endSession: throws when caller is neither rider nor host", async () => {
    vi.resetModules();
    vi.doMock("@/lib/supabase/client", () => ({
      createBrowserClient: () => makeSupabaseMock("Only the rider or host can end a session"),
    }));
    const { endSession } = await import("@/lib/data/real/bookings");
    await expect(endSession("booking-1")).rejects.toThrow("Only the rider or host");
  });

  it("acceptBooking: succeeds and returns a booking with a gate_pin", async () => {
    const mockBooking = {
      id: "booking-1",
      status: "accepted",
      gate_pin: "4242",
      rider_id: "rider-1",
      spot_id: "spot-1",
      vehicle_id: "v-1",
      start_battery_pct: 20,
      started_at: null,
      ended_at: null,
      kwh_used: null,
      amount_inr: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    vi.resetModules();
    vi.doMock("@/lib/supabase/client", () => ({
      createBrowserClient: () => makeSupabaseMock(null, mockBooking),
    }));
    const { acceptBooking } = await import("@/lib/data/real/bookings");
    const result = await acceptBooking("booking-1");
    expect(result.status).toBe("accepted");
    expect(result.gate_pin).toBe("4242");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  Part 3: Expiry logic test (mirror of expire_stale_bookings SQL)
// ═══════════════════════════════════════════════════════════════════════════════

function expireStaleBookings(bookings: Booking[], nowMs: number): Booking[] {
  const fiveMinMs = 5 * 60 * 1000;
  return bookings.map((b) => {
    if (
      b.status === "requested" &&
      nowMs - new Date(b.created_at).getTime() > fiveMinMs
    ) {
      return { ...b, status: "expired" as const };
    }
    return b;
  });
}

describe("Booking expiry logic (mirror of expire_stale_bookings)", () => {
  it("expires a requested booking older than 5 minutes", () => {
    const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000).toISOString();
    const booking = makeBooking({ status: "requested", created_at: sixMinutesAgo });
    const [result] = expireStaleBookings([booking], Date.now());
    expect(result.status).toBe("expired");
  });

  it("does not expire a requested booking younger than 5 minutes", () => {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const booking = makeBooking({ status: "requested", created_at: twoMinutesAgo });
    const [result] = expireStaleBookings([booking], Date.now());
    expect(result.status).toBe("requested");
  });

  it("does not expire accepted, charging, or completed bookings", () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const bookings = [
      makeBooking({ status: "accepted",  created_at: tenMinutesAgo }),
      makeBooking({ status: "charging",  created_at: tenMinutesAgo, started_at: tenMinutesAgo }),
      makeBooking({ status: "completed", created_at: tenMinutesAgo }),
    ];
    const results = expireStaleBookings(bookings, Date.now());
    expect(results[0].status).toBe("accepted");
    expect(results[1].status).toBe("charging");
    expect(results[2].status).toBe("completed");
  });

  it("returns count of expired bookings correctly", () => {
    const sevenMinutesAgo = new Date(Date.now() - 7 * 60 * 1000).toISOString();
    const oneMinuteAgo   = new Date(Date.now() - 1 * 60 * 1000).toISOString();
    const bookings = [
      makeBooking({ status: "requested", created_at: sevenMinutesAgo }),
      makeBooking({ status: "requested", created_at: sevenMinutesAgo }),
      makeBooking({ status: "requested", created_at: oneMinuteAgo }),
    ];
    const results = expireStaleBookings(bookings, Date.now());
    const expiredCount = results.filter((b) => b.status === "expired").length;
    expect(expiredCount).toBe(2);
  });
});
