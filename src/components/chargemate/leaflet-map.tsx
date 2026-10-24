"use client";

/**
 * LeafletMap — Rider Explore map
 *
 * - OpenStreetMap tiles (no API key needed)
 * - Orange pin SVG marker matching ChargeMate brand
 * - Animates marker pulse when spot is highlighted
 */

import * as React from "react";
import type { ChargingSpot } from "@/types/db";

interface LeafletMapProps {
  center: [number, number];
  spots: ChargingSpot[];
  selectedSpotId?: string | null;
  onMarkerClick?: (spotId: string) => void;
  className?: string;
}

// Orange pin SVG — the "thick orange pin" from the brief
const PIN_SVG = (active: boolean) => `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
  <defs>
    <filter id="shadow" x="-30%" y="-10%" width="160%" height="160%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.35)"/>
    </filter>
  </defs>
  <ellipse cx="16" cy="40" rx="6" ry="2.5" fill="rgba(0,0,0,0.18)"/>
  <path d="M16 2C9.37 2 4 7.37 4 14c0 9.46 11 24 12 26 1-2 12-16.54 12-26C28 7.37 22.63 2 16 2z"
    fill="${active ? "#c9440a" : "#F25A0E"}"
    stroke="#fff" stroke-width="1.5" filter="url(#shadow)"/>
  <circle cx="16" cy="14" r="5.5" fill="${active ? "#fff" : "rgba(255,255,255,0.9)"}"/>
  <path d="M16 10.5l1.2 2.5 2.8.4-2 2 .5 2.8L16 17l-2.5 1.2.5-2.8-2-2 2.8-.4z"
    fill="${active ? "#c9440a" : "#F25A0E"}"/>
</svg>`;

const USER_PIN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="10" fill="#143122" stroke="#fff" stroke-width="2"/>
  <circle cx="12" cy="12" r="4" fill="#fff"/>
  <circle cx="12" cy="12" r="16" fill="rgba(20,49,34,0.12)" stroke="none"/>
</svg>`;

export function LeafletMap({
  center,
  spots,
  selectedSpotId,
  onMarkerClick,
  className = "",
}: LeafletMapProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = React.useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = React.useRef<Map<string, any>>(new Map());
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Initialise map once on mount
  React.useEffect(() => {
    if (typeof window === "undefined" || mapRef.current) return;

    let mounted = true;

    import("leaflet").then((L) => {
      if (!mounted || !mapContainerRef.current || mapRef.current) return;

      // Fix default icon paths broken by webpack
      // @ts-expect-error — private property not in type defs
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapContainerRef.current!, {
        center,
        zoom: 14,
        zoomControl: false,
        attributionControl: true,
      });

      // OSM tiles — no API key
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Zoom control bottom-right
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // User location marker
      const userIcon = L.divIcon({
        html: USER_PIN_SVG,
        className: "",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      L.marker(center, { icon: userIcon }).addTo(map);

      mapRef.current = map;
      setIsLoaded(true);
    });

    return () => {
      mounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync spots to markers
  React.useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    import("leaflet").then((L) => {
      const map = mapRef.current;

      // Remove stale markers
      markersRef.current.forEach((marker, id) => {
        if (!spots.find((s) => s.id === id)) {
          map.removeLayer(marker);
          markersRef.current.delete(id);
        }
      });

      // Add / update markers
      spots.forEach((spot) => {
        const isActive = spot.id === selectedSpotId;

        if (markersRef.current.has(spot.id)) {
          // Update icon only
          const m = markersRef.current.get(spot.id);
          m.setIcon(
            L.divIcon({
              html: PIN_SVG(isActive),
              className: "",
              iconSize: [32, 42],
              iconAnchor: [16, 42],
              popupAnchor: [0, -44],
            })
          );
        } else {
          const icon = L.divIcon({
            html: PIN_SVG(isActive),
            className: "",
            iconSize: [32, 42],
            iconAnchor: [16, 42],
            popupAnchor: [0, -44],
          });

          const marker = L.marker([spot.lat, spot.lng], { icon })
            .addTo(map)
            .bindTooltip(
              `<strong>${spot.title}</strong><br>₹${spot.price_per_kwh}/kWh · ${spot.power_kw} kW`,
              { direction: "top", offset: [0, -44] }
            );

          marker.on("click", () => onMarkerClick?.(spot.id));
          markersRef.current.set(spot.id, marker);
        }
      });
    });
  }, [isLoaded, spots, selectedSpotId, onMarkerClick]);

  // Pan to selected spot
  React.useEffect(() => {
    if (!isLoaded || !mapRef.current || !selectedSpotId) return;
    const spot = spots.find((s) => s.id === selectedSpotId);
    if (spot) {
      mapRef.current.panTo([spot.lat, spot.lng], { animate: true, duration: 0.5 });
    }
  }, [isLoaded, selectedSpotId, spots]);

  return (
    <>
      {/* Leaflet CSS */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <div
        ref={mapContainerRef}
        id="explore-map"
        className={`w-full h-full ${className}`}
        aria-label="Map of nearby charging spots"
      >
        {!isLoaded && (
          <div className="w-full h-full flex items-center justify-center bg-recessed">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="w-8 h-8 border-2 border-charge border-t-transparent rounded-full animate-spin" />
              <span className="text-body-sm font-body">Loading map…</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
