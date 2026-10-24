"use client";

/**
 * /bookings — Booking history + wallet
 *
 * 1. Wallet balance card (getWalletBalance) + top-up button (topUpWallet)
 * 2. Booking history list (getMyBookings) with status badges + receipt links
 * 3. Loading, empty, error states
 */

import * as React from "react";
import Link from "next/link";
import {
  Wallet, Plus, Download, AlertTriangle, Zap, Clock,
  CheckCircle, XCircle, Ban, Timer, Search, Loader2,
  BatteryCharging, MapPin,
} from "lucide-react";
import {
  getMyBookings, getWalletBalance, topUpWallet,
} from "@/lib/data";
import type { Booking, BookingStatus, WalletBalance } from "@/lib/data";
import { Button } from "@/components/chargemate/button";
import { Card, CardContent } from "@/components/chargemate/card";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function fmtCurrency(n: number | null): string {
  if (n == null) return "—";
  return `₹${n.toFixed(2)}`;
}

const STATUS_CONFIG: Record<BookingStatus, {
  label: string; icon: React.ReactNode; cls: string;
}> = {
  requested:  { label: "Pending",   icon: <Timer className="size-3" />,       cls: "bg-ochre-fixed text-ochre" },
  accepted:   { label: "Accepted",  icon: <CheckCircle className="size-3" />, cls: "bg-host-fixed text-forest" },
  declined:   { label: "Declined",  icon: <XCircle className="size-3" />,     cls: "bg-recessed text-destructive" },
  charging:   { label: "Charging",  icon: <Zap className="size-3" />,         cls: "bg-charge-fixed text-charge" },
  completed:  { label: "Completed", icon: <CheckCircle className="size-3" />, cls: "bg-host-fixed text-forest" },
  cancelled:  { label: "Cancelled", icon: <Ban className="size-3" />,         cls: "bg-recessed text-muted-foreground" },
  expired:    { label: "Expired",   icon: <Clock className="size-3" />,       cls: "bg-recessed text-muted-foreground" },
};

function StatusBadge({ status }: { status: BookingStatus }) {
  const c = STATUS_CONFIG[status] ?? STATUS_CONFIG.requested;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-heading text-label-sm uppercase tracking-wider ${c.cls}`}>
      {c.icon} {c.label}
    </span>
  );
}

function bookingLink(b: Booking): string {
  if (b.status === "completed") return `/receipt/${b.id}`;
  if (b.status === "charging")  return `/session/${b.id}`;
  return `/booking/${b.id}`;
}

// ── Wallet card ──────────────────────────────────────────────────────────────

function WalletCard({
  wallet,
  loading: walletLoading,
  error: walletError,
  onTopUp,
}: {
  wallet: WalletBalance | null;
  loading: boolean;
  error: string | null;
  onTopUp: (amount: number) => void;
}) {
  const [topUpAmount, setTopUpAmount] = React.useState(500);
  const [topping, setTopping] = React.useState(false);

  async function handleTopUp() {
    setTopping(true);
    onTopUp(topUpAmount);
    // Parent handles the async flow; reset after brief delay
    setTimeout(() => setTopping(false), 1500);
  }

  return (
    <div
      id="wallet-card"
      className="relative overflow-hidden rounded-xl bg-forest text-white p-5 md:p-6 shadow-xl"
    >
      {/* Decorative glow */}
      <div className="absolute -right-10 -bottom-10 w-96 h-96 rounded-full bg-charge/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Wallet className="size-5 text-charge" />
          <span className="font-heading text-label-sm uppercase tracking-wider text-white/60">
            ChargeMate Wallet
          </span>
        </div>

        {walletLoading ? (
          <div className="h-12 w-40 rounded-lg bg-white/10 animate-pulse" />
        ) : walletError ? (
          <p className="text-body-sm text-white/60">{walletError}</p>
        ) : wallet ? (
          <>
            {/* Balance */}
            <div>
              <p className="font-heading text-label-md text-white/60">Available balance</p>
              <p className="font-heading text-display-lg text-white tracking-tight">
                {fmtCurrency(wallet.balanceInr)}
                <span className="text-label-lg text-white/60 font-normal ml-2">INR</span>
              </p>
            </div>

            {/* Top-up row */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden">
                {[200, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopUpAmount(amt)}
                    className={`px-3 py-2 text-label-md font-heading transition-colors ${
                      topUpAmount === amt ? "bg-charge text-white" : "text-white/70 hover:text-white"
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>

              <button
                id="top-up-btn"
                onClick={handleTopUp}
                disabled={topping}
                className="
                  flex items-center gap-2 px-4 py-2.5
                  bg-charge text-white rounded-xl
                  font-heading text-label-lg shadow-md
                  hover:brightness-110 active:scale-[0.98]
                  transition-all disabled:opacity-60
                "
              >
                {topping ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                {topping ? "Adding…" : "Add Funds"}
              </button>
            </div>

            {/* Last top-up */}
            {wallet.lastTopUp && (
              <p className="text-body-sm text-white/40">
                Last top-up: {fmtDate(wallet.lastTopUp)}
              </p>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

// ── Booking row ──────────────────────────────────────────────────────────────

function BookingRow({ booking }: { booking: Booking }) {
  return (
    <Link
      href={bookingLink(booking)}
      className="
        bg-card rounded-xl shadow-card hover:shadow-card-hover transition-shadow
        p-4 md:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3
        border border-border
      "
    >
      {/* Left: info */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-recessed flex items-center justify-center shrink-0 text-charge">
          {booking.status === "charging" ? (
            <BatteryCharging className="size-5" />
          ) : booking.status === "completed" ? (
            <Zap className="size-5 text-forest" />
          ) : (
            <MapPin className="size-5" />
          )}
        </div>
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-heading text-headline-sm text-foreground">
              Booking #{booking.id.slice(-6)}
            </span>
            <StatusBadge status={booking.status} />
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-body-sm text-muted-foreground">
            <span>
              <strong className="text-foreground">{fmtDate(booking.created_at)}</strong>
              {booking.started_at && ` · ${fmtTime(booking.started_at)}`}
              {booking.ended_at && ` – ${fmtTime(booking.ended_at)}`}
            </span>
            {booking.kwh_used != null && (
              <span className="text-charge font-heading text-label-md">
                {booking.kwh_used.toFixed(1)} kWh
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: amount + receipt link */}
      <div className="flex items-center justify-between lg:flex-col lg:items-end gap-1.5 shrink-0">
        {booking.amount_inr != null && (
          <span className="font-heading text-headline-md text-foreground">
            {fmtCurrency(booking.amount_inr)}
          </span>
        )}
        {booking.status === "completed" && (
          <span className="inline-flex items-center gap-1 text-body-sm text-charge font-heading">
            <Download className="size-3.5" />
            View receipt
          </span>
        )}
        {booking.status === "charging" && (
          <span className="inline-flex items-center gap-1 text-body-sm text-charge font-heading animate-pulse-subtle">
            <Zap className="size-3.5" />
            Live session
          </span>
        )}
      </div>
    </Link>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function BookingsClient() {
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [wallet, setWallet] = React.useState<WalletBalance | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [walletLoading, setWalletLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [walletError, setWalletError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLoading(true);
    getMyBookings()
      .then(setBookings)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));

    setWalletLoading(true);
    getWalletBalance()
      .then(setWallet)
      .catch((e) => setWalletError(e instanceof Error ? e.message : "Wallet error"))
      .finally(() => setWalletLoading(false));
  }, []);

  function handleTopUp(amount: number) {
    topUpWallet(amount)
      .then(setWallet)
      .catch((e) => setWalletError(e instanceof Error ? e.message : "Top-up failed"));
  }

  return (
    <>
      {/* Wallet */}
      <WalletCard
        wallet={wallet}
        loading={walletLoading}
        error={walletError}
        onTopUp={handleTopUp}
      />

      {/* Bookings section */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="font-heading text-data-display text-forest">02</span>
          <div>
            <h2 className="font-heading text-headline-md text-foreground">
              Past Charging Sessions
            </h2>
            <p className="text-body-sm text-muted-foreground">
              Peer-to-peer domestic charging history
            </p>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl bg-recessed" />)}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="text-center py-10 space-y-3">
          <AlertTriangle className="size-10 text-destructive mx-auto" />
          <p className="font-heading text-headline-sm text-foreground">Failed to load bookings</p>
          <p className="text-body-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && bookings.length === 0 && (
        <Card className="text-center py-10">
          <CardContent className="space-y-3">
            <Search className="size-12 text-muted-foreground mx-auto" />
            <p className="font-heading text-headline-sm text-foreground">No bookings yet</p>
            <p className="text-body-sm text-muted-foreground max-w-xs mx-auto">
              Find a socket and request your first charge to see your history here.
            </p>
            <Link href="/explore">
              <Button variant="charge">
                <Zap className="size-4" /> Find a Socket
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Booking list */}
      {!loading && !error && bookings.length > 0 && (
        <div className="space-y-3">
          {bookings.map((b) => (
            <BookingRow key={b.id} booking={b} />
          ))}

          <div className="flex items-center justify-between pt-2 text-body-sm text-muted-foreground">
            <span>{bookings.length} session{bookings.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
      )}
    </>
  );
}
