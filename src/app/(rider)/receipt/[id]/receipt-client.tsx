"use client";

/**
 * /receipt/[id] — Post-session receipt + review form
 *
 * - Printable receipt with line items (kWh, rate, total, duration)
 * - "Rate your host" form using submitReview
 * - Handles all completed/cancelled/etc. statuses
 */

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle, Printer, Star, ArrowLeft,
  AlertTriangle, Zap, Clock, MapPin,
  FileText, MessageSquare, Search,
} from "lucide-react";
import { getBooking, getSpot, submitReview } from "@/lib/data";
import type { Booking, ChargingSpot } from "@/lib/data";
import { Button } from "@/components/chargemate/button";
import {
  Card, CardHeader, CardTitle, CardContent, CardFooter,
} from "@/components/chargemate/card";
import { VerifiedStamp } from "@/components/chargemate/verified-stamp";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDuration(startIso: string | null, endIso: string | null): string {
  if (!startIso || !endIso) return "—";
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  const mins = Math.floor(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

function fmtCurrency(n: number | null): string {
  if (n == null) return "—";
  return `₹${n.toFixed(2)}`;
}

// ── Review form ─────────────────────────────────────────────────────────────

function ReviewForm({
  bookingId,
  onSubmitted,
}: {
  bookingId: string;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = React.useState(5);
  const [comment, setComment] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [hoveredStar, setHoveredStar] = React.useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await submitReview({ bookingId, rating, comment });
      onSubmitted();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit review";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Star rating */}
      <div className="space-y-2">
        <label className="font-heading text-label-sm uppercase tracking-widest text-muted-foreground">
          Your rating
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setRating(s)}
              onMouseEnter={() => setHoveredStar(s)}
              onMouseLeave={() => setHoveredStar(null)}
              className="p-0.5 transition-transform hover:scale-110 active:scale-95"
              aria-label={`${s} star${s !== 1 ? "s" : ""}`}
            >
              <Star
                className={`size-8 transition-colors ${
                  s <= (hoveredStar ?? rating)
                    ? "fill-ochre text-ochre"
                    : "text-border fill-border"
                }`}
              />
            </button>
          ))}
          <span className="ml-2 font-heading text-label-lg text-foreground">
            {rating}/5
          </span>
        </div>
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <label
          htmlFor="review-comment"
          className="font-heading text-label-sm uppercase tracking-widest text-muted-foreground"
        >
          Tell us about your experience
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="The charger worked great, shaded parking was a nice touch…"
          rows={3}
          className="
            w-full bg-recessed border border-border rounded-lg
            px-3 py-2.5 text-body-md font-body text-foreground
            placeholder:text-muted-foreground
            focus:outline-none focus:ring-2 focus:ring-charge/40
            resize-none
          "
        />
      </div>

      {error && (
        <p className="text-body-sm text-destructive flex items-center gap-1.5">
          <AlertTriangle className="size-4" />
          {error}
        </p>
      )}

      <Button
        id="submit-review-btn"
        type="submit"
        variant="charge"
        size="lg"
        className="w-full"
        disabled={submitting}
      >
        {submitting ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <MessageSquare className="size-5" />
        )}
        {submitting ? "Submitting…" : "Submit review"}
      </Button>
    </form>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

interface Props {
  params: { id: string };
}

export default function ReceiptClient({ params }: Props) {
  const { id } = params;

  const [booking, setBooking] = React.useState<Booking | null>(null);
  const [spot, setSpot] = React.useState<ChargingSpot | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [reviewSubmitted, setReviewSubmitted] = React.useState(false);

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
      })
      .catch((e) => setError(e.message ?? "Receipt not found"))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-gutter py-12 space-y-4 animate-pulse">
        <div className="h-8 w-2/3 rounded-lg bg-recessed mx-auto" />
        <div className="h-4 w-1/2 rounded-lg bg-recessed mx-auto" />
        <div className="h-64 rounded-xl bg-recessed" />
        <div className="h-48 rounded-xl bg-recessed" />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !booking) {
    return (
      <div className="max-w-md mx-auto px-gutter py-16 text-center space-y-4">
        <AlertTriangle className="size-12 text-destructive mx-auto" />
        <h1 className="font-heading text-headline-md text-foreground">Receipt not found</h1>
        <p className="text-body-md text-muted-foreground">{error}</p>
        <Link href="/explore">
          <Button variant="outline">← Back to Explore</Button>
        </Link>
      </div>
    );
  }

  // ── Non-completed booking ──────────────────────────────────────────────────
  if (booking.status !== "completed") {
    return (
      <div className="max-w-md mx-auto px-gutter py-16 text-center space-y-4">
        <FileText className="size-12 text-muted-foreground mx-auto" />
        <h1 className="font-heading text-headline-md text-foreground">
          No receipt yet
        </h1>
        <p className="text-body-md text-muted-foreground">
          This booking is &quot;{booking.status}&quot;. A receipt is generated after
          the session completes.
        </p>
        <Link href="/explore">
          <Button variant="outline">
            <Search className="size-5" />
            Back to Explore
          </Button>
        </Link>
      </div>
    );
  }

  // ── Receipt ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto px-gutter py-8 space-y-6">
      {/* Back */}
      <Link
        href="/explore"
        className="inline-flex items-center gap-1 text-body-sm text-muted-foreground hover:text-charge transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to Explore
      </Link>

      {/* Success header */}
      <div className="text-center space-y-2">
        <CheckCircle className="size-12 text-forest mx-auto" />
        <h1 className="font-heading text-headline-md text-foreground">
          Charge complete!
        </h1>
        <p className="text-body-sm text-muted-foreground">
          Your session at {spot?.title ?? "the charging spot"} is finished.
        </p>
      </div>

      {/* ── Printable receipt card ─────────────────────────────────────────── */}
      <Card id="receipt-card" className="print:shadow-none print:border-2">
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="size-4 text-charge" />
              ChargeMate Receipt
            </CardTitle>
            <p className="text-body-sm text-muted-foreground mt-0.5">
              #{booking.id.slice(-8).toUpperCase()}
            </p>
          </div>
          <VerifiedStamp
            label="PAID"
            variant="forest"
            className="!text-[8px] !px-2 !py-1"
          />
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Location */}
          {spot && (
            <div className="flex items-start gap-2 text-body-sm text-muted-foreground">
              <MapPin className="size-4 text-charge shrink-0 mt-0.5" />
              <div>
                <p className="font-heading text-label-lg text-foreground">{spot.title}</p>
                <p>{spot.address}, {spot.city}</p>
              </div>
            </div>
          )}

          {/* Time info */}
          <div className="flex items-start gap-2 text-body-sm text-muted-foreground">
            <Clock className="size-4 text-forest shrink-0 mt-0.5" />
            <div>
              <p className="text-foreground font-heading text-label-md">
                {fmtDate(booking.started_at)} · {fmtTime(booking.started_at)} – {fmtTime(booking.ended_at)}
              </p>
              <p>Duration: {fmtDuration(booking.started_at, booking.ended_at)}</p>
            </div>
          </div>

          {/* Divider */}
          <hr className="border-border" />

          {/* Line items */}
          <div className="space-y-2">
            <div className="flex justify-between text-body-sm">
              <span className="text-muted-foreground">Energy consumed</span>
              <span className="font-heading text-label-lg text-foreground">
                {booking.kwh_used?.toFixed(1) ?? "—"} kWh
              </span>
            </div>

            <div className="flex justify-between text-body-sm">
              <span className="text-muted-foreground">Rate</span>
              <span className="font-heading text-label-lg text-foreground">
                {spot ? `₹${spot.price_per_kwh}/kWh` : "—"}
              </span>
            </div>

            <div className="flex justify-between text-body-sm">
              <span className="text-muted-foreground">Starting battery</span>
              <span className="text-foreground">{booking.start_battery_pct}%</span>
            </div>

            <hr className="border-border" />

            {/* Total */}
            <div className="flex justify-between items-baseline">
              <span className="font-heading text-headline-sm text-foreground">Total</span>
              <span className="font-heading text-headline-md text-foreground">
                {fmtCurrency(booking.amount_inr)}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="justify-between">
          <span className="text-body-sm text-muted-foreground">
            {fmtDate(booking.ended_at)}
          </span>
          <button
            id="print-receipt-btn"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-body-sm text-charge font-heading hover:underline print:hidden"
          >
            <Printer className="size-3.5" />
            Print receipt
          </button>
        </CardFooter>
      </Card>

      {/* ── Rate your host ────────────────────────────────────────────────── */}
      <div className="print:hidden">
        {reviewSubmitted ? (
          <Card className="!border-host-fixed">
            <CardContent className="pt-5 text-center space-y-2">
              <CheckCircle className="size-8 text-forest mx-auto" />
              <p className="font-heading text-headline-sm text-foreground">
                Thanks for your review!
              </p>
              <p className="text-body-sm text-muted-foreground">
                Your feedback helps the ChargeMate community.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="size-4 text-ochre" />
                Rate your host
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewForm
                bookingId={booking.id}
                onSubmitted={() => setReviewSubmitted(true)}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Explore again */}
      <div className="text-center print:hidden">
        <Link href="/explore">
          <Button variant="outline" size="lg">
            <Search className="size-5" />
            Find another charge
          </Button>
        </Link>
      </div>
    </div>
  );
}
