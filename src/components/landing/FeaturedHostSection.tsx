// FeaturedHostSection.tsx — Server component: fetches from lib/data
// ─────────────────────────────────────────────────────────────────────────────

import Image from "next/image";
import Link from "next/link";
import { Star, Zap, MapPin, ArrowRight } from "lucide-react";
import { getNearbySpots } from "@/lib/data/spots";
import { ConnectorBadge } from "@/components/landing/ConnectorBadge";

export async function FeaturedHostSection() {
  // Pull top 3 spots near Bengaluru centre (all mock data)
  const spots = await getNearbySpots({
    lat: 12.9716,
    lng: 77.5946,
    radiusKm: 50,
  });
  const featured = spots.slice(0, 3);

  return (
    <section
      id="featured-hosts"
      aria-labelledby="featured-heading"
      className="bg-recessed py-20 md:py-28"
    >
      <div className="max-w-screen-xl mx-auto px-gutter-mobile md:px-gutter">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="font-heading text-label-md uppercase tracking-widest text-forest block mb-1">
              Verified hosts
            </span>
            <h2
              id="featured-heading"
              className="font-heading text-headline-lg-mobile md:text-headline-md text-foreground tracking-tight"
            >
              Top-rated spots near Bengaluru
            </h2>
          </div>
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 font-heading text-label-lg text-charge hover:underline shrink-0"
          >
            View all spots <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        {/* Cards */}
        <ul
          role="list"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {featured.map((spot, i) => (
            <li key={spot.id}>
              <article
                aria-label={spot.title}
                className="bg-card rounded-2xl overflow-hidden border border-border shadow-card hover:shadow-card-hover transition-shadow group"
              >
                {/* Photo */}
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src={spot.photos[0]}
                    alt={`${spot.title} charging spot`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  {/* Verified stamp */}
                  <div className="absolute top-3 left-3 bg-card/95 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1 shadow-sm">
                    <span className="text-ochre text-xs" aria-hidden>✓</span>
                    <span className="font-heading text-label-sm text-foreground uppercase tracking-wider">
                      KYC Verified
                    </span>
                  </div>
                  {/* Online dot */}
                  {spot.is_online && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-card/90 rounded-full px-2 py-1">
                      <span className="w-2 h-2 rounded-full bg-success animate-pulse" aria-hidden />
                      <span className="font-heading text-label-sm text-success uppercase tracking-wider">Live</span>
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-heading text-headline-sm text-foreground leading-tight">
                      {spot.title}
                    </h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="size-3.5 fill-ochre text-ochre" aria-hidden />
                      <span className="font-heading text-label-lg text-foreground">{spot.rating}</span>
                      <span className="font-body text-body-sm text-muted-foreground">({spot.review_count})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 mb-3 text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0" aria-hidden />
                    <span className="font-body text-body-sm truncate">{spot.locality} · {spot.distance_km} km</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ConnectorBadge connector={spot.connector} />
                      <div className="flex items-center gap-1 bg-charge-fixed rounded-full px-2 py-0.5">
                        <Zap className="size-3 text-charge" aria-hidden />
                        <span className="font-heading text-label-sm text-charge">{spot.power_kw} kW</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-heading text-headline-sm text-charge font-bold">
                        ₹{spot.price_per_kwh}
                      </span>
                      <span className="font-body text-body-sm text-muted-foreground">/kWh</span>
                    </div>
                  </div>
                </div>

                {/* Footer CTA */}
                <div className="px-4 pb-4">
                  <Link
                    href={`/login?mode=charge&spot=${spot.id}`}
                    className="flex items-center justify-center gap-2 h-10 w-full rounded-xl bg-charge text-white font-heading text-label-lg font-semibold hover:brightness-105 active:scale-[0.98] transition-all"
                    aria-label={`Book ${spot.title}`}
                  >
                    <Zap className="size-3.5" aria-hidden />
                    Book this spot
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
