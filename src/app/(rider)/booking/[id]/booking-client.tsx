"use client";

/**
 * /booking/[id] — Booking status screen
 *
 * - Requested: 5-minute countdown, cancel button, polls every 3s
 * - Accepted: gate PIN, address, Google Maps link, ETA, "Start Session" hint
 * - Charging: auto-redirect to /session/[id]
 * - Declined / Expired / Cancelled: friendly message + find another host
 * - Completed: redirect to /receipt/[id]
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Clock, X, MapPin, Navigation, Key, CheckCircle,
  XCircle, AlertTriangle, Zap, ArrowLeft, ExternalLink,
  Timer, Ban, Search,
} from "lucide-react";
import { getBooking, getSpot, cancelBooking } from "@/lib/data";
import type { Booking, BookingStatus, ChargingSpot } from "@/lib/data";
import { Button } from "@/components/chargemate/button";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/chargemate/card";

// ── Constants ────────────────────────────────────────────────────────────────
const EXPIRY_SECONDS = 5 * 60; // 5 minutes
const POLL_MS = 3000;

// ── Countdown hook ───────────────────────────────────────────────────────────
function useCountdown(createdAt: string) {
  const [remaining, setRemaining] = React.useState(() => {
    const elapsed = (Date.now() - new Date(createdAt).getTime()) / 1000;
    return Math.max(0, Math.floor(EXPIRY_SECONDS - elapsed));
  });

  React.useEffect(() => {
    if (remaining <= 0) return;
    const t = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [remaining]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const label = `${mins}:${String(secs).padStart(2, "0")}`;
  const pct = (remaining / EXPIRY_SECONDS) * 100;

  return { remaining, label, pct, expired: remaining <= 0 };
}

// ── Format helpers ───────────────────────────────────────────────────────────
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Sub-screens ─────────────────────────────────────────────────────────────

function WaitingScreen({
  booking,
  spot,
  onCancel,
  cancelling,
}: {
  booking: Booking;
  spot: ChargingSpot | null;
  onCancel: () => void;
  cancelling: boolean;
}) {
  const cd = useCountdown(booking.created_at);

  return (
    <div className="space-y-6 animate-slide-in-up">
      {/* Countdown ring */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-40 h-40">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke="hsl(var(--recessed))"
              strokeWidth="8"
            />
            <circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke={cd.remaining <= 60 ? "hsl(var(--destructive))" : "hsl(var(--charge))"}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 52}`}
              strokeDashoffset={`${2 * Math.PI * 52 * (1 - cd.pct / 100)}`}
              className="transition-[stroke-dashoffset] duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-heading text-data-display text-foreground">
              {cd.expired ? "0:00" : cd.label}
            </span>
            <span className="font-heading text-label-sm uppercase tracking-widest text-muted-foreground">
              {cd.expired ? "Expired" : "Waiting"}
            </span>
          </div>
        </div>

        <div className="text-center space-y-1">
          <h2 className="font-heading text-headline-sm text-foreground">
            Waiting for host to accept
          </h2>
          <p className="text-body-sm text-muted-foreground max-w-xs">
            {cd.expired
              ? "Your request has expired. The host didn't respond in time."
              : "You'll be notified as soon as the host accepts your request."}
          </p>
        </div>
      </div>

      {/* Spot info */}
      {spot && (
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <MapPin className="size-5 text-charge shrink-0" />
            <div className="min-w-0">
              <p className="font-heading text-label-lg text-foreground">{spot.title}</p>
              <p className="text-body-sm text-muted-foreground truncate">
                {spot.address}, {spot.city}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {cd.expired ? (
          <Link href="/explore">
            <Button variant="charge" size="lg" className="w-full">
              <Search className="size-5" />
              Find another host
            </Button>
          </Link>
        ) : (
          <Button
            id="cancel-booking-btn"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={onCancel}
            disabled={cancelling}
          >
            {cancelling ? (
              <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <X className="size-5" />
            )}
            {cancelling ? "Cancelling…" : "Cancel request"}
          </Button>
        )}
      </div>
    </div>
  );
}

function AcceptedScreen({
  booking,
  spot,
}: {
  booking: Booking;
  spot: ChargingSpot | null;
}) {
  const gmapsUrl = spot
    ? `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`
    : "#";

  return (
    <div className="space-y-5 animate-slide-in-up">
      {/* Success banner */}
      <div className="bg-host-fixed rounded-xl p-5 flex items-start gap-4">
        <CheckCircle className="size-6 text-forest shrink-0 mt-0.5" />
        <div>
          <h2 className="font-heading text-headline-sm text-forest">
            Booking accepted!
          </h2>
          <p className="text-body-sm text-muted-foreground mt-1">
            Head to the host's location now. Show the gate PIN on arrival.
          </p>
        </div>
      </div>

      {/* Gate PIN card */}
      {booking.gate_pin && (
        <Card className="!border-charge/30 !bg-charge-fixed">
          <CardContent className="pt-5 text-center space-y-2">
            <Key className="size-6 text-charge mx-auto" />
            <p className="font-heading text-label-sm uppercase tracking-widest text-muted-foreground">
              Gate PIN
            </p>
            <p
              id="gate-pin-display"
              className="font-heading text-[48px] leading-none tracking-[0.2em] text-foreground"
            >
              {booking.gate_pin}
            </p>
            <p className="text-body-sm text-muted-foreground">
              Show this to the host or enter at the gate
            </p>
          </CardContent>
        </Card>
      )}

      {/* Navigate card */}
      {spot && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="size-4 text-charge" />
              Navigate to spot
            </CardTitle>
            <CardDescription>{spot.address}, {spot.city}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* ETA estimate */}
            <div className="flex items-center gap-3 bg-recessed rounded-lg p-3">
              <Timer className="size-4 text-forest" />
              <div>
                <p className="font-heading text-label-lg text-foreground">
                  ~{spot.distance_km ? Math.max(2, Math.round(spot.distance_km * 4)) : 10} min drive
                </p>
                <p className="text-body-sm text-muted-foreground">
                  {spot.distance_km ?? "?"} km away
                </p>
              </div>
            </div>

            {/* Available hours */}
            <div className="flex items-center gap-3 bg-recessed rounded-lg p-3">
              <Clock className="size-4 text-muted-foreground" />
              <p className="text-body-sm text-muted-foreground">
                Available {spot.available_from} – {spot.available_to}
              </p>
            </div>

            {/* Google Maps button */}
            <a
              id="gmaps-directions-link"
              href={gmapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="
                w-full flex items-center justify-center gap-2
                bg-forest text-white
                font-heading text-label-lg
                py-3 rounded-xl shadow-md
                hover:brightness-110 active:scale-[0.98]
                transition-all
              "
            >
              <ExternalLink className="size-4" />
              Open Google Maps
            </a>
          </CardContent>
        </Card>
      )}

      {/* Proceed hint */}
      <p className="text-body-sm text-muted-foreground text-center italic">
        Once you arrive and plug in, the host will start your charging session.
      </p>
    </div>
  );
}

function DeclinedScreen() {
  return (
    <div className="space-y-5 animate-slide-in-up text-center py-6">
      <XCircle className="size-14 text-destructive mx-auto" />
      <h2 className="font-heading text-headline-md text-foreground">
        Request declined
      </h2>
      <p className="text-body-md text-muted-foreground max-w-sm mx-auto">
        The host couldn't accommodate your request right now.
        Don't worry — there are other spots nearby!
      </p>
      <Link href="/explore">
        <Button variant="charge" size="lg">
          <Search className="size-5" />
          Find another host
        </Button>
      </Link>
    </div>
  );
}

function CancelledScreen() {
  return (
    <div className="space-y-5 animate-slide-in-up text-center py-6">
      <Ban className="size-14 text-muted-foreground mx-auto" />
      <h2 className="font-heading text-headline-md text-foreground">
        Booking cancelled
      </h2>
      <p className="text-body-md text-muted-foreground max-w-sm mx-auto">
        You cancelled this booking request. You can search for another spot any time.
      </p>
      <Link href="/explore">
        <Button variant="outline" size="lg">
          <Search className="size-5" />
          Find another host
        </Button>
      </Link>
    </div>
  );
}

function ExpiredScreen() {
  return (
    <div className="space-y-5 animate-slide-in-up text-center py-6">
      <AlertTriangle className="size-14 text-ochre mx-auto" />
      <h2 className="font-heading text-headline-md text-foreground">
        Request expired
      </h2>
      <p className="text-body-md text-muted-foreground max-w-sm mx-auto">
        The host didn't respond within 5 minutes.
        Try a different spot — the SOS button picks the nearest one instantly.
      </p>
      <Link href="/explore">
        <Button variant="charge" size="lg">
          <Zap className="size-5" />
          SOS CHARGE
        </Button>
      </Link>
    </div>
  );
}

// ── Main page component ─────────────────────────────────────────────────────

interface Props {
  params: { id: string };
}

export default function BookingClient({ params }: Props) {
  const router = useRouter();
  const { id } = params;

  const [booking, setBooking] = React.useState<Booking | null>(null);
  const [spot, setSpot] = React.useState<ChargingSpot | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [cancelling, setCancelling] = React.useState(false);

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
          // Spot fetch failure is non-fatal
        }
      })
      .catch((e) => setError(e.message ?? "Booking not found"))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Poll for status changes (requested / accepted) ─────────────────────────
  React.useEffect(() => {
    if (!booking) return;
    const transitional: BookingStatus[] = ["requested", "accepted"];
    if (!transitional.includes(booking.status)) return;

    const interval = setInterval(async () => {
      try {
        const fresh = await getBooking(id);
        setBooking(fresh);

        // Auto-navigate on status transitions
        if (fresh.status === "charging") {
          router.push(`/session/${fresh.id}`);
        } else if (fresh.status === "completed") {
          router.push(`/receipt/${fresh.id}`);
        }
      } catch {
        // Ignore poll errors
      }
    }, POLL_MS);

    return () => clearInterval(interval);
  }, [booking, id, router]);

  // ── Cancel handler ─────────────────────────────────────────────────────────
  async function handleCancel() {
    setCancelling(true);
    try {
      const updated = await cancelBooking(id);
      setBooking(updated);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Cancel failed";
      setError(msg);
    } finally {
      setCancelling(false);
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-md mx-auto px-gutter py-12 space-y-6 animate-pulse">
        <div className="w-40 h-40 rounded-full bg-recessed mx-auto" />
        <div className="h-6 w-2/3 rounded-lg bg-recessed mx-auto" />
        <div className="h-4 w-1/2 rounded-lg bg-recessed mx-auto" />
        <div className="h-24 rounded-xl bg-recessed" />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !booking) {
    return (
      <div className="max-w-md mx-auto px-gutter py-16 text-center space-y-4">
        <AlertTriangle className="size-12 text-destructive mx-auto" />
        <h1 className="font-heading text-headline-md text-foreground">
          Booking not found
        </h1>
        <p className="text-body-md text-muted-foreground">{error}</p>
        <Link href="/explore">
          <Button variant="outline">← Back to Explore</Button>
        </Link>
      </div>
    );
  }

  // ── Status-based rendering ─────────────────────────────────────────────────
  return (
    <div className="max-w-md mx-auto px-gutter py-8">
      {/* Back link */}
      <Link
        href="/explore"
        className="inline-flex items-center gap-1 text-body-sm text-muted-foreground hover:text-charge transition-colors mb-6"
      >
        <ArrowLeft className="size-4" />
        Back to Explore
      </Link>

      {/* Status badge */}
      <div className="flex items-center gap-2 mb-6">
        <StatusBadge status={booking.status} />
        <span className="text-body-sm text-muted-foreground">
          Booking #{booking.id.slice(-6)}
        </span>
      </div>

      {booking.status === "requested" && (
        <WaitingScreen
          booking={booking}
          spot={spot}
          onCancel={handleCancel}
          cancelling={cancelling}
        />
      )}

      {booking.status === "accepted" && (
        <AcceptedScreen booking={booking} spot={spot} />
      )}

      {booking.status === "declined" && <DeclinedScreen />}
      {booking.status === "cancelled" && <CancelledScreen />}
      {booking.status === "expired" && <ExpiredScreen />}

      {booking.status === "charging" && (
        <div className="text-center py-10 space-y-3">
          <div className="w-8 h-8 border-2 border-charge border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-body-sm text-muted-foreground">Redirecting to live session…</p>
        </div>
      )}

      {booking.status === "completed" && (
        <div className="text-center py-10 space-y-3">
          <CheckCircle className="size-10 text-forest mx-auto" />
          <p className="font-heading text-headline-sm text-foreground">Session complete</p>
          <Link href={`/receipt/${booking.id}`}>
            <Button variant="charge">View receipt</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Status badge component ───────────────────────────────────────────────────

function StatusBadge({ status }: { status: BookingStatus }) {
  const config: Record<BookingStatus, { label: string; cls: string }> = {
    requested:  { label: "Pending",   cls: "bg-ochre-fixed text-ochre" },
    accepted:   { label: "Accepted",  cls: "bg-host-fixed text-forest" },
    declined:   { label: "Declined",  cls: "bg-recessed text-destructive" },
    charging:   { label: "Charging",  cls: "bg-charge-fixed text-charge" },
    completed:  { label: "Completed", cls: "bg-host-fixed text-forest" },
    cancelled:  { label: "Cancelled", cls: "bg-recessed text-muted-foreground" },
    expired:    { label: "Expired",   cls: "bg-recessed text-muted-foreground" },
  };
  const c = config[status] ?? config.requested;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-heading text-label-md uppercase tracking-widest ${c.cls}`}
    >
      <span className={`w-2 h-2 rounded-full ${
        status === "requested" ? "bg-ochre animate-pulse-subtle" :
        status === "charging" ? "bg-charge animate-pulse-subtle" :
        "bg-current opacity-50"
      }`} />
      {c.label}
    </span>
  );
}
