"use client";

/**
 * SpotCard — A card representing a nearby charging host in the list.
 * Used on the /explore page.
 */

import * as React from "react";
import Link from "next/link";
import { MapPin, Star, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChargingSpot } from "@/types/db";
import { ConnectorChip } from "./connector-chip";
import { VerifiedStamp } from "./verified-stamp";

interface SpotCardProps {
  spot: ChargingSpot;
  isSelected?: boolean;
  isCompatible?: boolean;
  onSelect?: (id: string) => void;
  className?: string;
}

function connectorToChipType(c: string) {
  switch (c) {
    case "CCS2":     return "ccs2" as const;
    case "Type2":    return "type2" as const;
    case "16A_socket": return "16a" as const;
    default:         return "16a" as const;
  }
}

export function SpotCard({
  spot,
  isSelected = false,
  isCompatible = true,
  onSelect,
  className,
}: SpotCardProps) {
  const photo = spot.photos?.[0];

  return (
    <article
      id={`spot-card-${spot.id}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(spot.id)}
      onKeyDown={(e) => e.key === "Enter" && onSelect?.(spot.id)}
      className={cn(
        "relative flex gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer",
        "hover:shadow-card-hover",
        isSelected
          ? "border-charge bg-charge-fixed shadow-card-hover ring-1 ring-charge/30"
          : "border-border bg-card shadow-card",
        !isCompatible && "opacity-50 pointer-events-none",
        className
      )}
      aria-pressed={isSelected}
      aria-label={`${spot.title}, ${spot.distance_km ?? "?"} km away, ₹${spot.price_per_kwh} per kWh`}
    >
      {/* Photo thumbnail */}
      {photo ? (
        <div className="shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-recessed">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo}
            alt={spot.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="shrink-0 w-20 h-20 rounded-lg bg-recessed flex items-center justify-center">
          <Zap className="size-7 text-muted-foreground" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading text-headline-sm leading-tight text-foreground line-clamp-1">
            {spot.title}
          </h3>
          {spot.rating >= 4.8 && (
            <VerifiedStamp
              label="VERIFIED"
              variant="forest"
              className="shrink-0 !px-2 !py-1 text-[8px] -rotate-1"
            />
          )}
        </div>

        {/* Distance + rating */}
        <div className="flex items-center gap-3 text-body-sm text-muted-foreground">
          {spot.distance_km != null && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3 text-charge" />
              {spot.distance_km} km
            </span>
          )}
          <span className="flex items-center gap-1">
            <Star className="size-3 fill-ochre text-ochre" />
            {spot.rating.toFixed(1)}
            <span className="text-muted-foreground">({spot.review_count})</span>
          </span>
        </div>

        {/* Specs row */}
        <div className="flex items-center gap-2 flex-wrap mt-0.5">
          <ConnectorChip
            type={connectorToChipType(spot.connector)}
            power={`${spot.power_kw} kW`}
            className="!py-1 !px-2 text-[11px]"
          />
          <span className="font-heading text-label-lg text-forest">
            ₹{spot.price_per_kwh}
            <span className="font-body text-body-sm text-muted-foreground font-normal">/kWh</span>
          </span>
        </div>

        {/* Availability hours */}
        <span className="text-body-sm text-muted-foreground">
          {spot.available_from}–{spot.available_to}
          {!spot.is_online && (
            <span className="ml-2 text-destructive font-heading text-label-sm uppercase">Offline</span>
          )}
        </span>
      </div>

      {/* "View" link — always accessible */}
      <Link
        href={`/spot/${spot.id}`}
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-charge focus:ring-offset-2"
        aria-label={`View details for ${spot.title}`}
        tabIndex={-1}
      />
    </article>
  );
}
