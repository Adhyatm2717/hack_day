"use client";

/**
 * /session/[id] — Active Charging Session
 *
 * Design reference: /design/active_session_chargemate
 *
 * - Dark forest banner with live indicator
 * - Battery gauge (arc SVG) with rising %
 * - Telemetry metrics: kW flow, kWh added, running cost ₹, elapsed timer
 * - Polls getSessionProgress every 2s
 * - "Stop Charge" button → endSession → /receipt/[id]
 * - Host info + spot details sidebar
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Zap, MapPin, ArrowLeft, ExternalLink, Clock,
  StopCircle, ShieldCheck, AlertTriangle, Cable,
  Gauge, Battery, Timer, IndianRupee, BatteryCharging,
} from "lucide-react";
import { getBooking, getSpot, getSessionProgress, endSession } from "@/lib/data";
import type { Booking, ChargingSpot, SessionProgress } from "@/lib/data";
import { Button } from "@/components/chargemate/button";

// ── Format helpers ───────────────────────────────────────────────────────────

function fmtDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtCurrency(n: number): string {
  return `₹${n.toFixed(2)}`;
}

// ── Battery Gauge SVG ────────────────────────────────────────────────────────

function SessionGauge({
  startPct,
  currentPct,
  targetPct = 80,
}: {
  startPct: number;
  currentPct: number;
  targetPct?: number;
}) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = 82;
  const sw = 14;
  const circumference = 2 * Math.PI * r;
  const clampedCurrent = Math.min(currentPct, 100);

  return (
    <div className="relative w-56 h-56 shrink-0 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90 transform" viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="hsl(var(--recessed))"
          strokeWidth={sw}
        />
        {/* Start segment (dim) */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="hsl(var(--muted-foreground) / 0.2)"
          strokeWidth={sw}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - startPct / 100)}
        />
        {/* Charged arc */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="hsl(var(--charge))"
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clampedCurrent / 100)}
          className="transition-[stroke-dashoffset] duration-1000 ease-linear"
        />
        {/* Target notch */}
        <line
          x1={cx} y1={sw / 2}
          x2={cx} y2={sw + 6}
          stroke="hsl(var(--forest))"
          strokeWidth="3"
          transform={`rotate(${(targetPct / 100) * 360} ${cx} ${cy})`}
        />
      </svg>

      {/* Center readout */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-heading text-label-sm uppercase tracking-widest text-muted-foreground">
          Battery Level
        </span>
        <span className="font-heading text-display-lg text-foreground tracking-tighter leading-none my-0.5">
          {clampedCurrent}%
        </span>
        <span className="font-heading text-label-md text-charge font-bold">
          Started: {startPct}%
        </span>
        <span className="font-heading text-label-sm text-muted-foreground mt-1 bg-recessed px-2 py-0.5 rounded">
          Target: {targetPct}%
        </span>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

interface Props {
  params: { id: string };
}

export default function SessionClient({ params }: Props) {
  const router = useRouter();
  const { id } = params;

  const [booking, setBooking] = React.useState<Booking | null>(null);
  const [spot, setSpot] = React.useState<ChargingSpot | null>(null);
  const [progress, setProgress] = React.useState<SessionProgress | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [ending, setEnding] = React.useState(false);

  // ── Initial load ───────────────────────────────────────────────────────────
  React.useEffect(() => {
    setLoading(true);
    getBooking(id)
      .then(async (b) => {
        setBooking(b);
        try {
          const s = await getSpot(b.spot_id);
          setSpot(s);
        } catch {
          // non-fatal
        }
        if (b.status === "charging") {
          const p = await getSessionProgress(b.id);
          setProgress(p);
        }
      })
      .catch((e) => setError(e.message ?? "Session not found"))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Poll progress every 2s ─────────────────────────────────────────────────
  React.useEffect(() => {
    if (!booking || booking.status !== "charging") return;

    const interval = setInterval(async () => {
      try {
        const p = await getSessionProgress(booking.id);
        setProgress(p);
      } catch {
        // polling failure is non-fatal
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [booking]);

  // ── End session ────────────────────────────────────────────────────────────
  async function handleEndSession() {
    if (!booking) return;
    setEnding(true);
    try {
      await endSession(booking.id);
      router.push(`/receipt/${booking.id}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to end session";
      setError(msg);
      setEnding(false);
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-gutter py-8 space-y-6 animate-pulse">
        <div className="h-32 rounded-xl bg-forest/20" />
        <div className="grid md:grid-cols-12 gap-6">
          <div className="md:col-span-7 space-y-4">
            <div className="h-56 rounded-xl bg-recessed mx-auto max-w-[224px]" />
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 rounded-lg bg-recessed" />
              ))}
            </div>
          </div>
          <div className="md:col-span-5">
            <div className="h-64 rounded-xl bg-recessed" />
          </div>
        </div>
      </div>
    );
  }

  // ── Error / not charging ───────────────────────────────────────────────────
  if (error || !booking) {
    return (
      <div className="max-w-md mx-auto px-gutter py-16 text-center space-y-4">
        <AlertTriangle className="size-12 text-destructive mx-auto" />
        <h1 className="font-heading text-headline-md text-foreground">Session not found</h1>
        <p className="text-body-md text-muted-foreground">{error}</p>
        <Link href="/explore">
          <Button variant="outline">← Back to Explore</Button>
        </Link>
      </div>
    );
  }

  if (booking.status !== "charging") {
    return (
      <div className="max-w-md mx-auto px-gutter py-16 text-center space-y-4">
        <Zap className="size-12 text-muted-foreground mx-auto" />
        <h1 className="font-heading text-headline-md text-foreground">No active session</h1>
        <p className="text-body-md text-muted-foreground">
          This booking is &quot;{booking.status}&quot;.
        </p>
        {booking.status === "completed" ? (
          <Link href={`/receipt/${booking.id}`}>
            <Button variant="charge">View receipt</Button>
          </Link>
        ) : (
          <Link href="/explore">
            <Button variant="outline">← Back to Explore</Button>
          </Link>
        )}
      </div>
    );
  }

  const p = progress ?? { batteryPct: booking.start_battery_pct, kwhUsed: 0, costInr: 0, elapsedSec: 0 };

  // ── Render — matches /design/active_session_chargemate ─────────────────────
  return (
    <div className="max-w-5xl mx-auto px-gutter py-6 space-y-6">
      {/* Back */}
      <Link
        href="/explore"
        className="inline-flex items-center gap-1 text-body-sm text-muted-foreground hover:text-charge transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to Explore
      </Link>

      {/* ── Top session banner — dark forest ────────────────────────────────── */}
      <div
        id="session-banner"
        className="relative overflow-hidden rounded-xl bg-forest text-white p-5 md:p-6 shadow-xl"
      >
        {/* Decorative glow */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-charge/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            {/* Live pill */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-charge text-white font-heading text-label-sm uppercase tracking-wider font-bold">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                Live Session
              </span>
              <span className="font-heading text-label-sm uppercase tracking-widest text-white/60">
                Booking #{booking.id.slice(-6)}
              </span>
            </div>

            {/* Title */}
            <h1 className="font-heading text-headline-lg text-white tracking-tight flex items-center gap-2">
              <Zap className="size-6 text-charge" style={{ filter: "drop-shadow(0 0 4px rgba(242,90,14,0.5))" }} />
              Charging in Progress
              {spot && <span className="text-white/70 text-headline-sm font-normal">at {spot.title}</span>}
            </h1>

            {spot && (
              <p className="text-body-sm text-white/60 flex items-center gap-1.5">
                <MapPin className="size-3.5" />
                {spot.address}, {spot.city} · {spot.power_kw} kW ({spot.connector})
              </p>
            )}
          </div>

          {/* Plugged-in time */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-xl shrink-0">
            <div className="text-right">
              <p className="font-heading text-label-sm uppercase tracking-wider text-white/60">Plugged in at</p>
              <p className="font-heading text-headline-sm text-white">{fmtTime(booking.started_at)}</p>
            </div>
            <Cable className="size-6 text-charge" />
          </div>
        </div>
      </div>

      {/* ── Two-column layout ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ── LEFT: Telemetry ──────────────────────────────────────────────── */}
        <div className="lg:col-span-7 space-y-5">

          {/* Gauge + metrics card */}
          <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
            {/* Header bar */}
            <div className="bg-recessed border-b border-border px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="size-4 text-charge" />
                <p className="font-heading text-label-lg text-foreground">Live Power Telemetry</p>
              </div>
              <span className="flex items-center gap-1.5 font-heading text-label-sm text-charge uppercase tracking-widest">
                <span className="size-2 rounded-full bg-charge animate-pulse-subtle" />
                Live
              </span>
            </div>

            {/* Gauge area */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-5">
              <SessionGauge
                startPct={booking.start_battery_pct}
                currentPct={p.batteryPct}
                targetPct={80}
              />

              {/* Metrics grid */}
              <div className="flex-1 w-full grid grid-cols-2 gap-3">
                {/* Active Flow */}
                <div className="bg-recessed p-4 rounded-lg">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Gauge className="size-3.5" />
                    <span className="font-heading text-label-sm uppercase">Active Flow</span>
                  </div>
                  <div className="mt-2">
                    <span className="font-heading text-data-display text-foreground">
                      {spot ? (spot.power_kw * 0.96).toFixed(1) : "6.9"}
                    </span>
                    <span className="font-heading text-label-lg text-muted-foreground ml-1">kW</span>
                  </div>
                  <p className="text-body-sm text-forest font-semibold mt-0.5">96% efficiency</p>
                </div>

                {/* Time elapsed */}
                <div className="bg-recessed p-4 rounded-lg">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Timer className="size-3.5" />
                    <span className="font-heading text-label-sm uppercase">Elapsed</span>
                  </div>
                  <div className="mt-2">
                    <span className="font-heading text-data-display text-charge">
                      {fmtDuration(p.elapsedSec)}
                    </span>
                  </div>
                  <p className="text-body-sm text-muted-foreground mt-0.5">
                    Since {fmtTime(booking.started_at)}
                  </p>
                </div>

                {/* Units added */}
                <div className="bg-recessed p-4 rounded-lg">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <BatteryCharging className="size-3.5" />
                    <span className="font-heading text-label-sm uppercase">Units Added</span>
                  </div>
                  <div className="mt-2">
                    <span className="font-heading text-data-display text-foreground">
                      {p.kwhUsed.toFixed(1)}
                    </span>
                    <span className="font-heading text-label-lg text-muted-foreground ml-1">kWh</span>
                  </div>
                  <p className="text-body-sm text-muted-foreground mt-0.5">
                    ~{Math.round(p.kwhUsed * 6)} km added
                  </p>
                </div>

                {/* Running cost */}
                <div className="bg-recessed p-4 rounded-lg">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <IndianRupee className="size-3.5" />
                    <span className="font-heading text-label-sm uppercase">Running Cost</span>
                  </div>
                  <div className="mt-2">
                    <span className="font-heading text-data-display text-foreground">
                      {fmtCurrency(p.costInr)}
                    </span>
                  </div>
                  <p className="text-body-sm text-muted-foreground mt-0.5">
                    {spot ? `@ ₹${spot.price_per_kwh}/kWh` : ""}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Running bill + Stop button ──────────────────────────────────── */}
          <div className="bg-card border border-border rounded-xl shadow-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-headline-sm text-foreground">Live Ledger</h2>
              <span className="font-heading text-label-sm uppercase tracking-wider text-charge bg-charge-fixed px-2 py-0.5 rounded font-bold">
                Metered Real-time
              </span>
            </div>

            <div className="bg-recessed rounded-lg p-4 flex flex-col md:flex-row items-baseline md:items-center justify-between gap-4">
              <div>
                <p className="font-heading text-label-sm uppercase tracking-wider text-muted-foreground">Current Bill</p>
                <p className="font-heading text-display-lg text-foreground tracking-tight mt-0.5">
                  {fmtCurrency(p.costInr)}
                </p>
                <p className="text-body-sm text-muted-foreground">
                  {p.kwhUsed.toFixed(1)} kWh × {spot ? `₹${spot.price_per_kwh}/kWh` : "—"}
                </p>
              </div>
            </div>

            {/* Session controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                id="stop-charge-btn"
                onClick={handleEndSession}
                disabled={ending}
                className="
                  min-h-[52px] px-5 py-3
                  bg-charge text-white
                  font-heading text-label-lg rounded-lg shadow-md
                  hover:brightness-105 active:scale-[0.98]
                  transition-all flex items-center justify-center gap-2
                  disabled:opacity-60 disabled:cursor-not-allowed
                "
              >
                {ending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <StopCircle className="size-5" />
                )}
                {ending ? "Ending session…" : "Stop Charge & Unplug"}
              </button>

              <div className="min-h-[52px] px-5 py-3 bg-recessed text-foreground font-heading text-label-lg rounded-lg flex items-center justify-center gap-2 text-center">
                <Battery className="size-5 text-forest" />
                {100 - p.batteryPct > 0 ? `${100 - p.batteryPct}% to full` : "Fully charged!"}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Host + Location ───────────────────────────────────────── */}
        <div className="lg:col-span-5 space-y-5">

          {/* Location card */}
          {spot && (
            <div className="bg-card border border-border rounded-xl shadow-card p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-heading text-label-sm uppercase tracking-wider text-muted-foreground">
                    Current Location
                  </p>
                  <h2 className="font-heading text-headline-md text-foreground mt-0.5">
                    {spot.title}
                  </h2>
                  <p className="text-body-sm text-muted-foreground">
                    {spot.address}
                  </p>
                </div>
                <div className="bg-recessed px-3 py-1 rounded-lg text-right">
                  <span className="font-heading text-label-sm uppercase text-muted-foreground block">Bay</span>
                  <span className="font-heading text-headline-sm text-forest font-bold">#01</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2.5 bg-recessed text-foreground rounded-lg font-heading text-label-md flex items-center justify-center gap-1.5 hover:bg-surface-high transition-colors"
                >
                  <ExternalLink className="size-3.5 text-charge" />
                  Google Maps
                </a>
                <button
                  type="button"
                  className="px-3 py-2.5 bg-recessed text-foreground rounded-lg font-heading text-label-md flex items-center justify-center gap-1.5 hover:bg-surface-high transition-colors"
                >
                  <Clock className="size-3.5 text-forest" />
                  {spot.available_from}–{spot.available_to}
                </button>
              </div>
            </div>
          )}

          {/* Safety card */}
          <div className="bg-card border border-border rounded-xl shadow-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-headline-sm text-foreground flex items-center gap-2">
                <ShieldCheck className="size-5 text-forest" />
                Safety Status
              </h2>
              <span className="font-heading text-label-sm uppercase bg-host-fixed text-forest px-2 py-0.5 rounded font-bold">
                Protected
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-recessed p-3 rounded-lg">
                <p className="font-heading text-label-sm text-muted-foreground uppercase">Earthing</p>
                <p className="font-heading text-headline-sm text-forest flex items-center gap-1 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-forest" />
                  1.8 Ω
                </p>
                <p className="text-body-sm text-muted-foreground">Class 1 Safe</p>
              </div>
              <div className="bg-recessed p-3 rounded-lg">
                <p className="font-heading text-label-sm text-muted-foreground uppercase">Voltage</p>
                <p className="font-heading text-headline-sm text-foreground flex items-center gap-1 mt-0.5">
                  <Zap className="size-3.5 text-forest" />
                  234 V
                </p>
                <p className="text-body-sm text-muted-foreground">Surge protector armed</p>
              </div>
            </div>
          </div>

          {/* Gate PIN reminder */}
          {booking.gate_pin && (
            <div className="bg-recessed border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="bg-charge-fixed rounded-lg p-2">
                <Zap className="size-5 text-charge" />
              </div>
              <div>
                <p className="font-heading text-label-sm uppercase tracking-wider text-muted-foreground">Gate PIN</p>
                <p className="font-heading text-headline-md text-foreground tracking-wider">{booking.gate_pin}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
