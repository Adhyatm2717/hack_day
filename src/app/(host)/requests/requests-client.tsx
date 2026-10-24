"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, CheckCircle, XCircle, AlertTriangle, Clock,
  Battery, Car, User, MapPin, Inbox,
} from "lucide-react";
import { Badge } from "@/components/chargemate/badge";
import { Button } from "@/components/chargemate/button";
import { cn } from "@/lib/utils";
import {
  getIncomingRequests,
  getMyBookings,
  acceptBooking,
  declineBooking,
  type Booking,
} from "@/lib/data";

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-recessed rounded-lg ${className}`} />;
}

// ── Status helpers ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; variant: "charge" | "success" | "muted" | "error"; icon: React.ElementType }> = {
  requested:  { label: "Pending",   variant: "charge",      icon: Clock },
  accepted:   { label: "Accepted",  variant: "success",     icon: CheckCircle },
  charging:   { label: "Charging",  variant: "charge",      icon: Zap },
  completed:  { label: "Completed", variant: "success",     icon: CheckCircle },
  declined:   { label: "Declined",  variant: "muted",       icon: XCircle },
  cancelled:  { label: "Cancelled", variant: "muted",       icon: XCircle },
  expired:    { label: "Expired",   variant: "muted",       icon: Clock },
};

// ── Mock rider data for rendering ─────────────────────────────────────────────
const RIDER_NAMES: Record<string, { name: string; vehicle: string; plate: string; avatar: string }> = {
  "rider-pooja-001": { name: "Pooja Hegde",  vehicle: "Tata Tiago EV",    plate: "KA 01 EK 8812", avatar: "pooja-hegde" },
  "rider-aarav-002": { name: "Aarav Sharma", vehicle: "MG Windsor EV",    plate: "KA 05 MG 2244", avatar: "aarav-sharma" },
  "rider-kavya-003": { name: "Kavya R.",     vehicle: "Nexon EV Max",     plate: "KA 01 NX 5566", avatar: "kavya-r" },
  "rider-deepak-004":{ name: "Deepak M.",    vehicle: "Tata Punch EV",    plate: "KA 03 TP 9900", avatar: "deepak-m" },
  "rider-sarita-005":{ name: "Sarita G.",    vehicle: "Nexon EV",         plate: "KA 02 NE 1188", avatar: "sarita-g" },
};

function getRider(riderId: string) {
  return RIDER_NAMES[riderId] ?? { name: "EV Driver", vehicle: "Electric Vehicle", plate: "KA XX XX XXXX", avatar: "default" };
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Request card ──────────────────────────────────────────────────────────────
interface RequestCardProps {
  booking: Booking;
  onAccept: (id: string) => Promise<void>;
  onDecline: (id: string) => Promise<void>;
}

function RequestCard({ booking, onAccept, onDecline }: RequestCardProps) {
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [result, setResult] = useState<"accepted" | "declined" | null>(null);
  const rider = getRider(booking.rider_id);
  const config = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.requested;
  const StatusIcon = config.icon;

  async function handleAccept() {
    setAccepting(true);
    try {
      await onAccept(booking.id);
      setResult("accepted");
    } finally {
      setAccepting(false);
    }
  }

  async function handleDecline() {
    setDeclining(true);
    try {
      await onDecline(booking.id);
      setResult("declined");
    } finally {
      setDeclining(false);
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -60, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="bg-card rounded-xl shadow-sm overflow-hidden"
    >
      {/* Orange accent top */}
      <div className={cn(
        "h-1",
        booking.status === "requested" ? "bg-charge" : "bg-border"
      )} />

      <div className="p-md lg:p-lg flex flex-col gap-md">
        {/* Header row: rider + status + time */}
        <div className="flex items-start justify-between gap-md">
          <div className="flex items-center gap-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://i.pravatar.cc/150?u=${rider.avatar}`}
              alt={rider.name}
              className="w-12 h-12 rounded-full object-cover shadow-sm shrink-0"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-xs">
                <span className="font-heading text-headline-sm text-foreground">{rider.name}</span>
                <CheckCircle className="size-3.5 text-forest" aria-hidden />
              </div>
              <span className="font-body text-body-sm text-muted-foreground">
                {rider.vehicle} · <span className="font-mono text-forest">{rider.plate}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-sm shrink-0">
            <Badge variant={config.variant} size="sm">
              <StatusIcon className="size-3 mr-0.5" />
              {config.label}
            </Badge>
            <span className="font-body text-body-sm text-muted-foreground whitespace-nowrap">
              {timeAgo(booking.created_at)}
            </span>
          </div>
        </div>

        {/* Specs row */}
        <div className="bg-recessed rounded-lg p-sm grid grid-cols-3 sm:grid-cols-4 gap-sm text-center">
          <div className="flex flex-col">
            <span className="font-heading text-label-sm uppercase text-muted-foreground">Battery</span>
            <span className="font-heading text-headline-sm text-foreground flex items-center justify-center gap-1">
              <Battery className="size-4 text-charge" />
              {booking.start_battery_pct}%
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-label-sm uppercase text-muted-foreground">Need</span>
            <span className="font-heading text-headline-sm text-foreground">
              {Math.round((100 - booking.start_battery_pct) * 0.24)} kWh
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-label-sm uppercase text-muted-foreground">Est. Time</span>
            <span className="font-heading text-headline-sm text-foreground">
              {Math.round(((100 - booking.start_battery_pct) * 0.24 / 7.2) * 60)} min
            </span>
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="font-heading text-label-sm uppercase text-muted-foreground">Payout</span>
            <span className="font-heading text-headline-sm text-forest">
              ₹{Math.round((100 - booking.start_battery_pct) * 0.24 * 12 * 0.874)}
            </span>
          </div>
        </div>

        {/* Gate PIN (if accepted) */}
        {booking.gate_pin && (
          <div className="flex items-center gap-sm p-sm bg-host-fixed rounded-lg">
            <span className="font-heading text-label-md text-forest">🔒 Gate PIN:</span>
            <span className="font-mono text-headline-sm text-forest font-bold tracking-widest">{booking.gate_pin}</span>
          </div>
        )}

        {/* Action buttons (only for pending requests) */}
        {booking.status === "requested" && !result && (
          <div className="flex items-center gap-sm">
            <Button
              variant="host"
              size="default"
              className="flex-1"
              disabled={accepting}
              onClick={handleAccept}
            >
              {accepting ? <span className="animate-spin">⟳</span> : <CheckCircle className="size-4" />}
              {accepting ? "Accepting…" : "Accept & Share PIN"}
            </Button>
            <button
              type="button"
              className="flex-1 min-h-[44px] px-md py-sm bg-recessed text-muted-foreground rounded-xl font-heading text-label-md hover:bg-surface-high transition-colors text-center"
              disabled={declining}
              onClick={handleDecline}
            >
              {declining ? "Declining…" : "Decline"}
            </button>
          </div>
        )}

        {/* Result feedback */}
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "py-sm px-md rounded-xl font-heading text-label-lg flex items-center justify-center gap-2",
              result === "accepted" ? "bg-host-fixed text-forest" : "bg-recessed text-muted-foreground"
            )}
          >
            {result === "accepted" ? <CheckCircle className="size-5" /> : <XCircle className="size-5" />}
            {result === "accepted" ? "Accepted — Gate PIN shared with rider" : "Request declined"}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ── Past session row ──────────────────────────────────────────────────────────
function PastSessionRow({ booking }: { booking: Booking }) {
  const rider = getRider(booking.rider_id);
  const config = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.completed;
  const date = new Date(booking.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  return (
    <div className="p-sm bg-recessed rounded-xl flex items-center justify-between gap-md hover:bg-surface-high transition-colors">
      <div className="flex items-center gap-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://i.pravatar.cc/150?u=${rider.avatar}`}
          alt={rider.name}
          className="w-9 h-9 rounded-full object-cover shrink-0"
        />
        <div className="flex flex-col">
          <span className="font-heading text-label-md text-foreground">{rider.name}</span>
          <span className="font-body text-body-sm text-muted-foreground">
            {rider.vehicle} · {date}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-sm">
        {booking.kwh_used && (
          <span className="font-heading text-label-sm text-muted-foreground">{booking.kwh_used} kWh</span>
        )}
        {booking.amount_inr ? (
          <span className="font-heading text-headline-sm text-forest">₹{booking.amount_inr}</span>
        ) : (
          <Badge variant={config.variant} size="sm">{config.label}</Badge>
        )}
      </div>
    </div>
  );
}

// ── Main client ───────────────────────────────────────────────────────────────
export function RequestsClient() {
  const [incoming, setIncoming] = useState<Booking[]>([]);
  const [history, setHistory]   = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [tab, setTab]           = useState<"live" | "history">("live");

  const load = useCallback(async () => {
    try {
      setError(null);
      const [inc, all] = await Promise.all([getIncomingRequests(), getMyBookings()]);
      setIncoming(inc);
      // History = everything that isn't "requested"
      const allHostBookings = all.filter((b) =>
        ["accepted", "charging", "completed", "declined", "cancelled"].includes(b.status)
      );
      setHistory(allHostBookings);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAccept(id: string) {
    await acceptBooking(id);
    setIncoming((prev) => prev.filter((b) => b.id !== id));
    await load();
  }

  async function handleDecline(id: string) {
    await declineBooking(id);
    setIncoming((prev) => prev.filter((b) => b.id !== id));
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-gutter lg:p-margin flex flex-col gap-lg max-w-screen-xl mx-auto" aria-busy>
        <Skeleton className="h-16 w-80" />
        <div className="flex gap-sm"><Skeleton className="h-10 w-28" /><Skeleton className="h-10 w-28" /></div>
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48" />)}
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="p-gutter lg:p-margin flex flex-col items-center justify-center min-h-[40vh] gap-md text-center">
        <AlertTriangle className="size-10 text-destructive" />
        <p className="font-heading text-headline-sm">{error}</p>
        <Button variant="outline" onClick={load}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="p-gutter lg:p-margin flex flex-col gap-lg max-w-screen-xl mx-auto">

      {/* Header */}
      <div className="flex flex-col gap-xs">
        <div className="flex items-center gap-sm">
          <h1 className="font-heading text-headline-lg text-forest tracking-tight">Live Requests</h1>
          {incoming.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-charge text-charge-foreground font-heading text-label-md animate-pulse-subtle">
              {incoming.length} pending
            </span>
          )}
        </div>
        <p className="font-body text-body-md text-muted-foreground">
          Manage incoming charge requests and view session history
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-xs bg-recessed p-1 rounded-xl self-start">
        {(["live", "history"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "px-md py-sm rounded-lg font-heading text-label-md transition-colors",
              tab === t
                ? "bg-forest text-forest-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "live" ? `Live Requests (${incoming.length})` : `History (${history.length})`}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {tab === "live" ? (
          <motion.div
            key="live"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-md"
          >
            {incoming.length === 0 ? (
              <div className="py-16 flex flex-col items-center gap-md text-center bg-card rounded-xl shadow-sm">
                <div className="w-16 h-16 rounded-full bg-host-fixed flex items-center justify-center">
                  <Inbox className="size-8 text-forest" />
                </div>
                <h2 className="font-heading text-headline-sm text-foreground">All Clear!</h2>
                <p className="font-body text-body-md text-muted-foreground max-w-sm">
                  No pending requests right now. New charge requests will appear here in real-time.
                </p>
                <div className="flex items-center gap-2 text-forest font-heading text-label-sm bg-host-fixed px-3 py-1.5 rounded-full">
                  <span className="size-2 rounded-full bg-forest animate-pulse-subtle" />
                  Listening for requests…
                </div>
              </div>
            ) : (
              <AnimatePresence>
                {incoming.map((b) => (
                  <RequestCard
                    key={b.id}
                    booking={b}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                  />
                ))}
              </AnimatePresence>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-sm"
          >
            {history.length === 0 ? (
              <div className="py-16 flex flex-col items-center gap-md text-center bg-card rounded-xl shadow-sm">
                <Clock className="size-10 text-muted-foreground" />
                <h2 className="font-heading text-headline-sm text-foreground">No History Yet</h2>
                <p className="font-body text-body-md text-muted-foreground">
                  Completed sessions will appear here.
                </p>
              </div>
            ) : (
              history.map((b) => <PastSessionRow key={b.id} booking={b} />)
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
