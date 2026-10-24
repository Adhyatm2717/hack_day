"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, TrendingUp, Battery, Star, CheckCircle, XCircle,
  MapPin, IndianRupee, AlertTriangle, Info,
} from "lucide-react";
import { StatCard } from "@/components/chargemate/stat-card";
import { RevenueChart } from "@/components/chargemate/revenue-chart";
import { Badge } from "@/components/chargemate/badge";
import { Button } from "@/components/chargemate/button";
import { ConnectorChip } from "@/components/chargemate/connector-chip";
import {
  getEarningsSummary,
  getMonthlyRevenue,
  getIncomingRequests,
  getMyBookings,
  getMySpot,
  setSpotOnline,
  acceptBooking,
  declineBooking,
  type EarningsSummary,
  type MonthlyRevenue,
  type Booking,
  type ChargingSpot,
} from "@/lib/data";

// ── Loading skeleton ──────────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-recessed rounded-lg ${className}`} />
  );
}

// ── Online/Offline toggle ─────────────────────────────────────────────────────
interface SpotToggleProps {
  spot: ChargingSpot;
  onToggle: (isOnline: boolean) => Promise<void>;
}

function SpotToggle({ spot, onToggle }: SpotToggleProps) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      await onToggle(!spot.is_online);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-md self-start lg:self-auto bg-card p-sm rounded-xl shadow-sm">
      <div className="flex flex-col text-left">
        <div className="flex items-center gap-1.5">
          <span className={`size-2.5 rounded-full shadow-sm ${spot.is_online ? "bg-forest" : "bg-border"}`} />
          <span className="font-heading text-label-lg text-forest uppercase tracking-wide">
            {spot.is_online ? "Open For Charging" : "Spot Offline"}
          </span>
        </div>
        <span className="font-body text-body-sm text-muted-foreground">
          {spot.is_online
            ? `Accepting requests until ${spot.available_to}`
            : "Toggle to start accepting sessions"}
        </span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={spot.is_online}
        aria-label={spot.is_online ? "Take spot offline" : "Put spot online"}
        disabled={pending}
        onClick={handleClick}
        className={`relative inline-flex h-9 w-16 shrink-0 cursor-pointer rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 shadow-sm
          ${spot.is_online ? "bg-forest" : "bg-border"}`}
      >
        <span
          className={`pointer-events-none inline-flex size-7 transform rounded-full bg-card shadow-md transition duration-200 ease-in-out items-center justify-center
            ${spot.is_online ? "translate-x-7" : "translate-x-0"}`}
        >
          <Zap className={`size-3.5 ${spot.is_online ? "text-charge" : "text-muted-foreground"}`} />
        </span>
      </button>
    </div>
  );
}

// ── Incoming request card ─────────────────────────────────────────────────────
interface IncomingRequestCardProps {
  booking: Booking;
  onAccept: (id: string) => Promise<void>;
  onDecline: (id: string) => Promise<void>;
}

function IncomingRequestCard({ booking, onAccept, onDecline }: IncomingRequestCardProps) {
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [accepted, setAccepted] = useState<string | null>(null);

  async function handleAccept() {
    setAccepting(true);
    try {
      const updated = await onAccept(booking.id);
      // onAccept returns void — gate_pin is set in the parent
      setAccepted("Accepted");
    } finally {
      setAccepting(false);
    }
  }

  async function handleDecline() {
    setDeclining(true);
    try {
      await onDecline(booking.id);
    } finally {
      setDeclining(false);
    }
  }

  return (
    <section className="relative bg-card rounded-xl p-md lg:p-lg shadow-md overflow-hidden">
      {/* Orange accent top strip */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-charge" />

      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-lg">
        <div className="flex-1 space-y-md">
          {/* Badge row */}
          <div className="flex items-center justify-between flex-wrap gap-xs">
            <div className="inline-flex items-center gap-2 bg-charge-fixed text-charge px-3 py-1 rounded-full font-heading text-label-md">
              <Zap className="size-4 animate-bounce" />
              <span>Immediate Charge Request</span>
              <span className="font-body text-label-sm opacity-75">· 2 mins ago</span>
            </div>
            <div className="flex items-center gap-1 text-charge font-heading text-label-md">
              <span>ETA: <strong>5 min</strong></span>
            </div>
          </div>

          {/* Rider context */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-md items-center">
            <div className="md:col-span-7 flex items-start gap-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://i.pravatar.cc/150?u=pooja-hegde"
                alt="Pooja Hegde"
                className="w-14 h-14 rounded-full object-cover shrink-0 shadow-sm"
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-xs">
                  <span className="font-heading text-headline-sm text-foreground">Pooja Hegde</span>
                  <CheckCircle className="size-4 text-forest" aria-hidden />
                </div>
                <span className="font-body text-body-sm text-muted-foreground">
                  Tata Tiago EV · <span className="font-mono text-forest font-semibold">KA 01 EK 8812</span>
                </span>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-destructive/10 text-destructive font-heading text-label-sm self-start">
                  <AlertTriangle className="size-3.5" />
                  Critical: Battery at {booking.start_battery_pct}% · Stranded nearby
                </div>
              </div>
            </div>

            {/* Specs pills */}
            <div className="md:col-span-5 bg-recessed p-sm rounded-lg flex items-center justify-around text-center">
              {[
                { label: "Need",   value: "12 kWh",    sub: "~1 hr 45 m" },
                { label: "Socket", value: "Type 2 AC", sub: "Fast 7.2 kW" },
                { label: "Payout", value: "₹162",      sub: "Direct UPI" },
              ].map((item, i) => (
                <div key={i} className="flex flex-col">
                  <span className="font-heading text-label-sm text-muted-foreground uppercase">{item.label}</span>
                  <span className="font-heading text-headline-sm text-forest">{item.value}</span>
                  <span className="font-body text-body-sm text-muted-foreground">{item.sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action stack */}
        <div className="flex lg:flex-col items-center justify-end gap-sm shrink-0 w-full lg:w-52">
          {accepted ? (
            <div className="w-full bg-host-fixed text-forest font-heading text-label-lg rounded-xl px-md py-sm flex items-center justify-center gap-2">
              <CheckCircle className="size-5" />
              Gate PIN Shared!
            </div>
          ) : (
            <>
              <Button
                variant="host"
                size="lg"
                id="accept-request-btn"
                className="flex-1 lg:flex-none w-full"
                disabled={accepting}
                onClick={handleAccept}
              >
                {accepting ? (
                  <span className="animate-spin">⟳</span>
                ) : (
                  <CheckCircle className="size-5" />
                )}
                Accept & Reveal PIN
              </Button>
              <button
                type="button"
                className="flex-1 lg:flex-none w-full min-h-[48px] px-md py-sm bg-recessed text-muted-foreground rounded-xl font-heading text-label-md hover:bg-surface-high transition-colors text-center"
                disabled={declining}
                onClick={handleDecline}
              >
                {declining ? "Declining…" : "✕ Decline (Not Home)"}
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Booking queue row ─────────────────────────────────────────────────────────
function BookingQueueRow({ booking }: { booking: Booking }) {
  const time = booking.started_at
    ? new Date(booking.started_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
    : "--";
  const [hh, mm] = time.split(":");
  const ampm = mm?.split(" ")[1] ?? "";
  const mmOnly = mm?.split(" ")[0] ?? mm;

  const STATUS_LABEL: Record<string, string> = {
    charging:  "Active",
    accepted:  "Confirmed",
    completed: "Done",
    requested: "Pending",
  };

  return (
    <div className="p-md bg-recessed rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-md hover:bg-surface-high transition-colors">
      <div className="flex items-start gap-md">
        {/* Time badge */}
        <div className="w-12 h-12 rounded-xl bg-card flex flex-col items-center justify-center text-forest shadow-sm shrink-0">
          <span className="font-heading text-headline-sm leading-none">{hh}</span>
          <span className="font-heading text-label-sm uppercase text-muted-foreground">{ampm}</span>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-heading text-label-lg text-foreground">Booking #{booking.id.slice(-4)}</span>
            <Badge variant={booking.status === "charging" ? "charge" : booking.status === "completed" ? "success" : "muted"} size="sm">
              {STATUS_LABEL[booking.status] ?? booking.status}
            </Badge>
          </div>
          <div className="flex items-center gap-sm mt-1 text-muted-foreground font-heading text-label-sm">
            {booking.gate_pin && (
              <span className="flex items-center gap-1">
                🔒 PIN: <span className="font-mono font-bold text-forest">{booking.gate_pin}</span>
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-border pt-2 sm:pt-0">
        {booking.amount_inr ? (
          <span className="font-heading text-headline-sm text-forest">₹{booking.amount_inr.toFixed(2)}</span>
        ) : (
          <span className="font-body text-body-sm text-muted-foreground">Est. pending</span>
        )}
      </div>
    </div>
  );
}

// ── Main dashboard client ─────────────────────────────────────────────────────
export function HostDashboardClient() {
  const [spot, setSpot]         = useState<ChargingSpot | null>(null);
  const [summary, setSummary]   = useState<EarningsSummary | null>(null);
  const [revenue, setRevenue]   = useState<MonthlyRevenue[]>([]);
  const [incoming, setIncoming] = useState<Booking[]>([]);
  const [queue, setQueue]       = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [s, summ, rev, inc, bks] = await Promise.all([
        getMySpot(),
        getEarningsSummary(),
        getMonthlyRevenue(3),
        getIncomingRequests(),
        getMyBookings(),
      ]);
      setSpot(s);
      setSummary(summ);
      setRevenue(rev);
      setIncoming(inc);
      setQueue(bks.filter((b) => ["charging", "accepted", "completed"].includes(b.status)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleToggle(isOnline: boolean) {
    if (!spot) return;
    const updated = await setSpotOnline(isOnline);
    setSpot(updated);
  }

  async function handleAccept(id: string) {
    await acceptBooking(id);
    setIncoming((prev) => prev.filter((b) => b.id !== id));
    await load(); // refresh queue
  }

  async function handleDecline(id: string) {
    await declineBooking(id);
    setIncoming((prev) => prev.filter((b) => b.id !== id));
  }

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-gutter lg:p-margin flex flex-col gap-lg max-w-screen-xl mx-auto" aria-busy="true" aria-label="Loading dashboard">
        <Skeleton className="h-28 w-full" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="p-gutter lg:p-margin flex flex-col items-center justify-center min-h-[40vh] gap-md text-center">
        <AlertTriangle className="size-10 text-destructive" />
        <p className="font-heading text-headline-sm text-foreground">{error}</p>
        <Button variant="outline" onClick={load}>Try again</Button>
      </div>
    );
  }

  const co2Offset = summary ? Math.round(summary.energyKwh * 0.82) : 0;
  const monthTarget = 10000;
  const monthPct = summary ? Math.round((summary.thisMonth / monthTarget) * 100) : 0;

  return (
    <div className="p-gutter lg:p-margin flex flex-col gap-lg max-w-screen-xl mx-auto">

      {/* ── Banner: Welcome + online toggle ── */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-md bg-recessed p-md lg:p-lg rounded-xl shadow-sm">
        <div className="flex flex-col gap-xs">
          <div className="flex items-center gap-sm flex-wrap">
            <span className="font-heading text-label-sm uppercase tracking-wider text-ochre bg-ochre-fixed px-2 py-0.5 rounded">
              {spot?.title ?? "Driveway Bay"}
            </span>
            <span className="inline-flex items-center gap-1.5 font-heading text-label-md text-forest font-semibold">
              <span className="size-2 rounded-full bg-forest animate-pulse-subtle" />
              Submeter: 238.4V · 50Hz Stable
            </span>
          </div>
          <h1 className="font-heading text-headline-lg text-forest tracking-tight">Welcome back, Ramesh</h1>
          <p className="font-body text-body-sm text-muted-foreground">
            {spot?.connector} · {spot?.power_kw} kW · {spot?.locality}, {spot?.city}
          </p>
        </div>
        {spot && <SpotToggle spot={spot} onToggle={handleToggle} />}
      </section>

      {/* ── Incoming request ── */}
      <AnimatePresence>
        {incoming.map((b) => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.25 }}
          >
            <IncomingRequestCard
              booking={b}
              onAccept={handleAccept}
              onDecline={handleDecline}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* ── 4 metric cards ── */}
      {summary && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md" aria-label="Earnings overview">
          <StatCard
            id="stat-today"
            label="Today's Earnings"
            value={`₹${summary.today.toLocaleString("en-IN")}`}
            subtitle={`${summary.sessionCount} sessions`}
            icon={IndianRupee}
            accentColor="ochre"
            footerLeft="Instant UPI Payout"
            footerRight="Processed"
          />
          <StatCard
            id="stat-month"
            label="This Month"
            value={`₹${summary.thisMonth.toLocaleString("en-IN")}`}
            subtitle="+22% vs last month"
            icon={TrendingUp}
            accentColor="host"
            footerLeft={`Target: ₹${monthTarget.toLocaleString("en-IN")}`}
            footerRight={`${monthPct}% achieved`}
          />
          <StatCard
            id="stat-energy"
            label="Energy Dispensed"
            value={String(summary.energyKwh)}
            unit="kWh"
            subtitle={`${co2Offset} kg CO₂ offset`}
            icon={Battery}
            accentColor="charge"
            footerLeft="BESCOM tariff"
            footerRight="₹6.50/unit"
          />
          <StatCard
            id="stat-rating"
            label="Host Rating"
            value={String(summary.rating)}
            unit="★"
            subtitle="Top 5% in Indiranagar"
            icon={Star}
            accentColor="forest"
            footerLeft="38 Verified Reviews"
            footerRight="Superhost"
          />
        </section>
      )}

      {/* ── Bento grid: chart + queue / spot card ── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">

        {/* Left (8 cols): revenue chart + booking queue */}
        <div className="lg:col-span-8 flex flex-col gap-lg">

          {/* Revenue chart card */}
          <div className="bg-card p-md lg:p-lg rounded-xl shadow-sm flex flex-col gap-md">
            <div className="flex items-center justify-between flex-wrap gap-sm">
              <div>
                <h2 className="font-heading text-headline-sm text-forest">3-Month Revenue</h2>
                <p className="font-body text-body-sm text-muted-foreground">August → October 2026 progression</p>
              </div>
              <div className="flex items-center gap-xs bg-recessed p-1 rounded-lg">
                {revenue.map((m) => (
                  <span key={m.month} className="px-2 py-0.5 rounded font-heading text-label-sm text-muted-foreground">
                    {m.month}
                  </span>
                ))}
              </div>
            </div>
            <RevenueChart data={revenue} />
            <div className="flex items-center justify-between border-t border-border pt-sm font-body text-body-sm text-muted-foreground">
              <span>Domestic Margin: <strong className="text-foreground">68% profit</strong> after utility bill</span>
              <button type="button" className="font-heading text-label-md text-forest font-semibold hover:underline flex items-center gap-1">
                Download GST Sheet
              </button>
            </div>
          </div>

          {/* Booking queue */}
          <div className="bg-card p-md lg:p-lg rounded-xl shadow-sm flex flex-col gap-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-sm">
                <h2 className="font-heading text-headline-sm text-forest">Scheduled Sessions Queue</h2>
                <Badge variant="muted" size="sm">{queue.length} sessions</Badge>
              </div>
              <span className="font-body text-body-sm text-muted-foreground">Gate Code Auto-Sync ON</span>
            </div>

            {queue.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground font-body text-body-md">
                No sessions scheduled right now.
              </div>
            ) : (
              <div className="flex flex-col gap-sm">
                {queue.map((b) => <BookingQueueRow key={b.id} booking={b} />)}
              </div>
            )}

            <div className="p-sm rounded-lg bg-recessed flex items-center gap-sm text-muted-foreground font-body text-body-sm">
              <Info className="size-4 text-forest shrink-0" />
              <span>15-minute gap auto-enforced between consecutive sessions.</span>
            </div>
          </div>
        </div>

        {/* Right (4 cols): spot config + UPI card */}
        <div className="lg:col-span-4 flex flex-col gap-lg">

          {/* Spot hardware card */}
          {spot && (
            <div className="bg-card rounded-xl shadow-sm overflow-hidden flex flex-col">
              {/* Photo banner */}
              <div className="relative h-44 w-full bg-recessed flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
                  <div>
                    <span className="font-heading text-label-sm uppercase tracking-wider text-white/70">Hardware</span>
                    <h3 className="font-heading text-headline-sm">Schneider EVlink 7.4kW</h3>
                  </div>
                  <Badge variant={spot.is_online ? "success" : "muted"} size="sm">
                    {spot.is_online ? "Active" : "Offline"}
                  </Badge>
                </div>
              </div>

              <div className="p-md flex flex-col gap-md">
                {/* Spot details */}
                <div className="space-y-xs">
                  {[
                    { label: "Gate Access Code", value: "#9412", mono: true },
                    { label: "MCB Safety", value: "Normal (32A C-Curve)", dot: true },
                    { label: "Submeter", value: "1,489.20 kWh", mono: true },
                    { label: "Clearance", value: "SUV Friendly (9ft)" },
                  ].map(({ label, value, mono, dot }) => (
                    <div key={label} className="flex justify-between items-center font-heading text-label-md">
                      <span className="text-muted-foreground">{label}</span>
                      <span className={`text-foreground ${mono ? "font-mono bg-recessed px-2 py-0.5 rounded" : ""} flex items-center gap-1`}>
                        {dot && <span className="size-1.5 rounded-full bg-forest" />}
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Connector chips */}
                <div className="flex flex-wrap gap-xs">
                  <ConnectorChip type={spot.connector as "type2"} power={`${spot.power_kw} kW`} />
                </div>

                <a
                  href="/host/spot"
                  className="w-full py-2.5 bg-recessed hover:bg-surface-high text-forest font-heading text-label-md rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  Configure Spot & Rates →
                </a>
              </div>
            </div>
          )}

          {/* UPI payout card */}
          <div className="bg-forest text-forest-foreground p-md rounded-xl shadow-md flex flex-col gap-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="size-5 text-host-fixed" />
                <span className="font-heading text-label-md tracking-wider uppercase font-bold text-host-fixed">
                  UPI Auto-Settlement
                </span>
              </div>
              <span className="font-heading text-label-sm text-forest-foreground/60 bg-forest-foreground/10 px-2 py-0.5 rounded">
                ICICI Bank
              </span>
            </div>
            <p className="font-body text-body-sm text-forest-foreground/70">
              Sessions escrowed on check-in, deposited to{" "}
              <span className="font-mono text-forest-foreground font-semibold">ramesh.verma@okhdfcbank</span>{" "}
              within 10 minutes of plug-out.
            </p>
            <div className="pt-2 flex items-center justify-between border-t border-forest-foreground/20">
              <span className="font-heading text-label-sm text-forest-foreground/60">Next sweep: Tonight 11:59 PM</span>
              <a href="/host/earnings" className="font-heading text-label-sm text-host-fixed hover:underline flex items-center">
                View Ledger →
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="pt-md border-t border-border flex flex-col sm:flex-row items-center justify-between text-muted-foreground font-body text-body-sm gap-2">
        <p>© 2026 ChargeMate. All rights reserved.</p>
        <p>Host Operations Indiranagar Hub · Active Tariff Cycle: October 2026</p>
      </footer>
    </div>
  );
}
