"use client";

/**
 * /spot/[id] — Host detail page (Rider view)
 *
 * Features:
 * 1. Photo gallery (swipeable)
 * 2. Host info (name from spot, rating, review count, verified stamp)
 * 3. Specs: power, connector, price, availability hours, rules
 * 4. Reviews from getReviewsForHost
 * 5. "Request to charge" → requestBooking → /booking/[id]
 * 6. Loading, empty, error states
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Star, MapPin, Zap, Clock, ShieldCheck,
  ChevronLeft, ChevronRight, MessageSquare, AlertTriangle,
  BadgeCheck, FileText, Wifi, WifiOff, Users, Leaf,
} from "lucide-react";
import { getSpot, getReviewsForHost, requestBooking, getMyVehicles } from "@/lib/data";
import type { ChargingSpot, Review, Vehicle } from "@/lib/data";
import { ConnectorChip } from "@/components/chargemate/connector-chip";
import { VerifiedStamp } from "@/components/chargemate/verified-stamp";
import { Button } from "@/components/chargemate/button";

// ── helpers ───────────────────────────────────────────────────────────────────

function connectorToChipType(c: string) {
  switch (c) {
    case "CCS2":       return "ccs2" as const;
    case "Type2":      return "type2" as const;
    case "16A_socket": return "16a" as const;
    default:           return "16a" as const;
  }
}

function starArray() {
  return Array.from({ length: 5 }, (_, i) => i + 1);
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// ── Photo gallery ─────────────────────────────────────────────────────────────

function PhotoGallery({ photos, title }: { photos: string[]; title: string }) {
  const [idx, setIdx] = React.useState(0);

  const fallback = "https://images.unsplash.com/photo-1593941707882-a56f1f27b0b8?w=800";
  const items = photos.length > 0 ? photos : [fallback];

  return (
    <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden bg-recessed group">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={items[idx]}
        src={items[idx]}
        alt={`${title} — photo ${idx + 1}`}
        className="w-full h-full object-cover transition-opacity duration-300"
        loading="eager"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

      {/* Nav arrows — only if multiple */}
      {items.length > 1 && (
        <>
          <button
            onClick={() => setIdx((i) => (i - 1 + items.length) % items.length)}
            className="
              absolute left-3 top-1/2 -translate-y-1/2
              bg-white/80 backdrop-blur rounded-full p-1.5
              opacity-0 group-hover:opacity-100 transition-opacity
              hover:bg-white
            "
            aria-label="Previous photo"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => setIdx((i) => (i + 1) % items.length)}
            className="
              absolute right-3 top-1/2 -translate-y-1/2
              bg-white/80 backdrop-blur rounded-full p-1.5
              opacity-0 group-hover:opacity-100 transition-opacity
              hover:bg-white
            "
            aria-label="Next photo"
          >
            <ChevronRight className="size-4" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === idx ? "bg-white w-4" : "bg-white/60"
                }`}
                aria-label={`Go to photo ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Photo count badge */}
      {items.length > 1 && (
        <span className="absolute top-3 right-3 bg-black/50 text-white text-body-sm font-body px-2 py-0.5 rounded-full backdrop-blur-sm">
          {idx + 1}/{items.length}
        </span>
      )}
    </div>
  );
}

// ── Review card ───────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="bg-card rounded-xl p-4 border border-border space-y-2 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {starArray().map((s) => (
            <Star
              key={s}
              className={`size-3.5 ${
                s <= review.rating
                  ? "fill-ochre text-ochre"
                  : "text-border fill-border"
              }`}
            />
          ))}
        </div>
        <span className="text-body-sm text-muted-foreground">{timeAgo(review.created_at)}</span>
      </div>
      {review.comment && (
        <p className="text-body-md text-foreground leading-relaxed">{review.comment}</p>
      )}
      {review.reply && (
        <div className="bg-host-fixed rounded-lg px-3 py-2 text-body-sm text-foreground border-l-2 border-forest">
          <span className="font-heading text-label-sm uppercase text-forest tracking-wider block mb-1">
            Host replied
          </span>
          {review.reply}
        </div>
      )}
    </div>
  );
}

// ── Booking bottom sheet ──────────────────────────────────────────────────────

interface BookingSheetProps {
  spot: ChargingSpot;
  vehicles: Vehicle[];
  onClose: () => void;
  onConfirm: (vehicleId: string, batteryPct: number) => Promise<void>;
}

function BookingSheet({ spot, vehicles, onClose, onConfirm }: BookingSheetProps) {
  const [vehicleId, setVehicleId] = React.useState(vehicles[0]?.id ?? "");
  const [batteryPct, setBatteryPct] = React.useState(20);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleConfirm() {
    if (!vehicleId) return;
    setLoading(true);
    setError(null);
    try {
      await onConfirm(vehicleId, batteryPct);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create booking");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[900]"
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet */}
      <div
        id="booking-sheet"
        role="dialog"
        aria-modal
        aria-label="Request to Charge"
        className="
          fixed bottom-0 left-0 right-0 z-[901]
          bg-card rounded-t-2xl shadow-2xl
          p-5 space-y-4
          animate-slide-in-up
          max-w-lg mx-auto
          md:bottom-8 md:left-1/2 md:-translate-x-1/2 md:rounded-2xl md:right-auto md:w-full
        "
      >
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-headline-sm text-foreground flex items-center gap-2">
            <Zap className="size-5 text-charge" />
            Request to Charge
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-recessed text-muted-foreground transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Spot summary */}
        <div className="flex items-center gap-3 bg-recessed rounded-xl p-3">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-border shrink-0">
            {spot.photos[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={spot.photos[0]} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Zap className="size-5 text-muted-foreground" />
              </div>
            )}
          </div>
          <div>
            <p className="font-heading text-label-lg text-foreground">{spot.title}</p>
            <p className="text-body-sm text-muted-foreground">{spot.locality}, {spot.city}</p>
          </div>
        </div>

        {/* Vehicle select */}
        {vehicles.length === 0 ? (
          <p className="text-body-sm text-muted-foreground italic text-center py-2">
            No vehicles found — add one in My Garage first.
          </p>
        ) : (
          <div className="space-y-1">
            <label htmlFor="booking-vehicle" className="font-heading text-label-sm uppercase tracking-widest text-muted-foreground">
              Vehicle
            </label>
            <select
              id="booking-vehicle"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full bg-recessed border border-border rounded-lg px-3 py-2.5 text-body-md font-body focus:outline-none focus:ring-2 focus:ring-charge/40"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.make} {v.model} ({v.connector})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Battery % */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="booking-battery" className="font-heading text-label-sm uppercase tracking-widest text-muted-foreground">
              Current battery
            </label>
            <span className="font-heading text-label-lg text-charge">{batteryPct}%</span>
          </div>
          <input
            id="booking-battery"
            type="range"
            min={1}
            max={99}
            value={batteryPct}
            onChange={(e) => setBatteryPct(Number(e.target.value))}
            className="w-full accent-[hsl(var(--charge))] h-2 rounded-full cursor-pointer"
          />
        </div>

        {/* Price estimate */}
        <div className="bg-recessed rounded-xl p-3 flex items-center justify-between">
          <span className="text-body-sm text-muted-foreground">Rate</span>
          <span className="font-heading text-headline-sm text-foreground">
            ₹{spot.price_per_kwh}
            <span className="text-body-sm font-body text-muted-foreground">/kWh · {spot.power_kw} kW</span>
          </span>
        </div>

        {error && (
          <p className="text-body-sm text-destructive flex items-center gap-1.5">
            <AlertTriangle className="size-4" />
            {error}
          </p>
        )}

        <button
          id="confirm-booking-btn"
          onClick={handleConfirm}
          disabled={loading || !vehicleId}
          className="
            w-full min-h-[52px] flex items-center justify-center gap-2
            bg-charge text-white font-heading text-headline-sm tracking-tight
            rounded-xl shadow-md
            hover:brightness-105 active:scale-[0.98]
            transition-all duration-150
            disabled:opacity-60 disabled:cursor-not-allowed
          "
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Zap className="size-5" aria-hidden />
          )}
          {loading ? "Requesting…" : "Confirm & Request"}
        </button>
      </div>
    </>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

interface Props {
  params: { id: string };
}

export default function SpotDetailPage({ params }: Props) {
  const router = useRouter();
  const { id } = params;

  const [spot, setSpot] = React.useState<ChargingSpot | null>(null);
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showBookingSheet, setShowBookingSheet] = React.useState(false);
  const [bookingSuccess, setBookingSuccess] = React.useState(false);

  // Load spot, reviews, and vehicles in parallel
  React.useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      getSpot(id),
      getMyVehicles(),
    ])
      .then(([spotData, vehicleData]) => {
        setSpot(spotData);
        setVehicles(vehicleData);
        // Load reviews using host_id from the spot
        return getReviewsForHost(spotData.host_id);
      })
      .then(setReviews)
      .catch((e) => setError(e.message ?? "Failed to load spot"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleBookingConfirm(vehicleId: string, batteryPct: number) {
    if (!spot) return;
    const booking = await requestBooking({
      spotId: spot.id,
      vehicleId,
      startBatteryPct: batteryPct,
    });
    setShowBookingSheet(false);
    setBookingSuccess(true);
    // Navigate to booking page
    router.push(`/booking/${booking.id}`);
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div id="spot-loading" className="max-w-4xl mx-auto px-gutter py-8 space-y-6 animate-pulse">
        <div className="h-96 rounded-xl bg-recessed" />
        <div className="grid md:grid-cols-12 gap-6">
          <div className="md:col-span-7 space-y-4">
            <div className="h-8 w-2/3 rounded-lg bg-recessed" />
            <div className="h-4 w-1/2 rounded-lg bg-recessed" />
            <div className="h-24 rounded-xl bg-recessed" />
          </div>
          <div className="md:col-span-5">
            <div className="h-64 rounded-xl bg-recessed" />
          </div>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !spot) {
    return (
      <div
        id="spot-error"
        className="max-w-4xl mx-auto px-gutter py-16 flex flex-col items-center gap-4 text-center"
      >
        <AlertTriangle className="size-12 text-destructive" />
        <h1 className="font-heading text-headline-md text-foreground">Spot not found</h1>
        <p className="text-body-md text-muted-foreground">
          {error ?? "This charging spot doesn't exist or has been removed."}
        </p>
        <Link href="/explore">
          <Button variant="outline">← Back to Explore</Button>
        </Link>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div
        id="spot-detail-page"
        className="max-w-5xl mx-auto px-gutter pt-5 pb-32 space-y-6"
      >
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-body-sm text-muted-foreground">
          <Link
            href="/explore"
            className="flex items-center gap-1 hover:text-charge transition-colors"
            aria-label="Back to Explore"
          >
            <ArrowLeft className="size-4" />
            Explore
          </Link>
          <span>/</span>
          <span className="text-foreground font-heading text-label-md truncate">{spot.title}</span>
        </nav>

        {/* Gallery */}
        <PhotoGallery photos={spot.photos} title={spot.title} />

        {/* Two-column layout */}
        <div className="grid md:grid-cols-12 gap-6 items-start">

          {/* ── Left: Details ──────────────────────────────────────────────── */}
          <div className="md:col-span-7 space-y-5">

            {/* Title + Status */}
            <div className="space-y-1.5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <h1 className="font-heading text-headline-md text-foreground leading-tight">
                  {spot.title}
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  {spot.is_online ? (
                    <span className="flex items-center gap-1 text-body-sm text-forest bg-host-fixed px-2.5 py-1 rounded-full font-heading text-label-md">
                      <Wifi className="size-3" />
                      Online
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-body-sm text-muted-foreground bg-recessed px-2.5 py-1 rounded-full font-heading text-label-md">
                      <WifiOff className="size-3" />
                      Offline
                    </span>
                  )}
                  <VerifiedStamp label="KYC VERIFIED" variant="forest" className="!text-[8px]" />
                </div>
              </div>

              {/* Address */}
              <p className="flex items-center gap-1.5 text-body-sm text-muted-foreground">
                <MapPin className="size-3.5 text-charge shrink-0" />
                {spot.address}, {spot.city}
              </p>

              {/* Rating row */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {starArray().map((s) => (
                    <Star
                      key={s}
                      className={`size-4 ${
                        s <= Math.round(spot.rating)
                          ? "fill-ochre text-ochre"
                          : "text-border fill-border"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-heading text-label-lg text-foreground">{spot.rating.toFixed(1)}</span>
                <span className="text-body-sm text-muted-foreground flex items-center gap-1">
                  <Users className="size-3" />
                  {spot.review_count} reviews
                </span>
              </div>
            </div>

            {/* Specs grid */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-4">
              <h2 className="font-heading text-label-sm uppercase tracking-widest text-muted-foreground">
                Charger Specs
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-recessed rounded-lg p-3 space-y-1">
                  <Zap className="size-4 text-charge" />
                  <p className="font-heading text-label-lg text-foreground">{spot.power_kw} kW</p>
                  <p className="text-body-sm text-muted-foreground">Power output</p>
                </div>
                <div className="bg-recessed rounded-lg p-3 space-y-1">
                  <ConnectorChip
                    type={connectorToChipType(spot.connector)}
                    className="!px-2 !py-1 text-[11px]"
                  />
                  <p className="text-body-sm text-muted-foreground mt-1">Connector</p>
                </div>
                <div className="bg-recessed rounded-lg p-3 space-y-1">
                  <Clock className="size-4 text-forest" />
                  <p className="font-heading text-label-lg text-foreground">
                    {spot.available_from} – {spot.available_to}
                  </p>
                  <p className="text-body-sm text-muted-foreground">Availability</p>
                </div>
                <div className="bg-recessed rounded-lg p-3 space-y-1">
                  <Leaf className="size-4 text-ochre" />
                  <p className="font-heading text-label-lg text-foreground">{spot.locality}</p>
                  <p className="text-body-sm text-muted-foreground">Area</p>
                </div>
              </div>
            </div>

            {/* Rules */}
            {spot.rules && (
              <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                <h2 className="font-heading text-label-sm uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <FileText className="size-3.5" />
                  House Rules
                </h2>
                <p className="text-body-md text-foreground leading-relaxed whitespace-pre-line">
                  {spot.rules}
                </p>
              </div>
            )}

            {/* Reviews */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-headline-sm text-foreground flex items-center gap-2">
                  <MessageSquare className="size-5 text-muted-foreground" />
                  Reviews
                </h2>
                <span className="text-body-sm text-muted-foreground">
                  {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                </span>
              </div>

              {reviews.length === 0 ? (
                <div id="reviews-empty" className="bg-recessed rounded-xl p-6 text-center text-muted-foreground text-body-sm italic">
                  No reviews yet — be the first!
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((r) => (
                    <ReviewCard key={r.id} review={r} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Booking panel ─────────────────────────────────────── */}
          <div className="md:col-span-5 md:sticky md:top-6">
            <div
              id="spot-booking-panel"
              className="bg-card border border-border rounded-2xl shadow-card p-5 space-y-4"
            >
              {/* Price */}
              <div className="flex items-baseline gap-1.5">
                <span className="font-heading text-[36px] leading-none font-bold text-foreground">
                  ₹{spot.price_per_kwh}
                </span>
                <span className="font-heading text-label-lg text-muted-foreground">/ kWh</span>
              </div>

              {/* Power + connector */}
              <div className="flex items-center gap-2 flex-wrap">
                <ConnectorChip
                  type={connectorToChipType(spot.connector)}
                  power={`${spot.power_kw} kW`}
                />
                <span className="text-body-sm text-muted-foreground">
                  {spot.available_from} – {spot.available_to}
                </span>
              </div>

              {/* Trust badge */}
              <div className="bg-host-fixed rounded-xl p-3 flex items-start gap-3">
                <ShieldCheck className="size-5 text-forest shrink-0 mt-0.5" />
                <div>
                  <p className="font-heading text-label-md text-forest uppercase tracking-wider">
                    100% Session Power Guarantee
                  </p>
                  <p className="text-body-sm text-muted-foreground mt-0.5">
                    If the charger fails to deliver power, you get an instant full refund.
                  </p>
                </div>
              </div>

              {/* CTA */}
              {bookingSuccess ? (
                <div className="flex items-center justify-center gap-2 text-forest font-heading text-label-lg py-3">
                  <BadgeCheck className="size-5" />
                  Booking requested!
                </div>
              ) : (
                <button
                  id="request-to-charge-btn"
                  onClick={() => setShowBookingSheet(true)}
                  disabled={!spot.is_online}
                  className="
                    w-full min-h-[52px] flex items-center justify-center gap-2
                    bg-charge text-white font-heading text-headline-sm tracking-tight
                    rounded-xl shadow-md
                    hover:brightness-105 active:scale-[0.98]
                    transition-all duration-150
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  <Zap className="size-5" aria-hidden />
                  {spot.is_online ? "Request to Charge" : "Spot is Offline"}
                </button>
              )}

              {!spot.is_online && (
                <p className="text-body-sm text-muted-foreground text-center">
                  This spot is currently offline. Check back later.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking bottom sheet */}
      {showBookingSheet && (
        <BookingSheet
          spot={spot}
          vehicles={vehicles}
          onClose={() => setShowBookingSheet(false)}
          onConfirm={handleBookingConfirm}
        />
      )}
    </>
  );
}
