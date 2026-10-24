"use client";

/**
 * /explore — Rider Explore page
 *
 * Features:
 * 1. Leaflet map (OSM) centred on user geolocation, Bengaluru fallback
 * 2. Nearby spots list from getNearbySpots
 * 3. Battery % input + vehicle picker (getMyVehicles)
 *    - Hides spots the car cannot reach (battery_kwh × KM_PER_KWH)
 *    - Hides incompatible connector types
 * 4. SOS CHARGE button — picks nearest online compatible spot → /spot/[id]
 * 5. Loading / empty / error states
 */

import * as React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  Zap, Wifi, WifiOff, AlertTriangle, MapPin, Battery,
  ChevronDown, Navigation, Siren, SlidersHorizontal,
} from "lucide-react";
import { getNearbySpots, getMyVehicles } from "@/lib/data";
import type { ChargingSpot, Vehicle } from "@/lib/data";
import { SpotCard } from "@/components/chargemate/spot-card";
import { Button } from "@/components/chargemate/button";
import { ConnectorChip } from "@/components/chargemate";

// KM a car can travel per kWh — conservative estimate
const KM_PER_KWH = 6;
// Default search radius km
const SEARCH_RADIUS_KM = 20;
// Bengaluru fallback centre
const BENGALURU: [number, number] = [12.9716, 77.5946];

// Leaflet map — client only (needs window / DOM)
const LeafletMap = dynamic(
  () => import("@/components/chargemate/leaflet-map").then((m) => m.LeafletMap),
  { ssr: false, loading: () => <MapSkeleton /> }
);

function MapSkeleton() {
  return (
    <div className="w-full h-full bg-recessed flex items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <div className="w-8 h-8 border-2 border-charge border-t-transparent rounded-full animate-spin" />
        <span className="text-body-sm font-body">Loading map…</span>
      </div>
    </div>
  );
}

function connectorMatch(vehicleConnector: string, spotConnector: string): boolean {
  // Direct match
  if (vehicleConnector === spotConnector) return true;
  // 3pin vehicles can use 16A_socket (and vice-versa) in practice
  if (vehicleConnector === "3pin" && spotConnector === "16A_socket") return true;
  if (vehicleConnector === "16A_socket" && spotConnector === "3pin") return true;
  return false;
}

function canReach(
  batteryPct: number,
  vehicleKwh: number,
  distanceKm: number
): boolean {
  const usableKwh = (batteryPct / 100) * vehicleKwh;
  const rangeKm = usableKwh * KM_PER_KWH;
  return rangeKm >= distanceKm;
}

// ── Page component ────────────────────────────────────────────────────────────

export default function ExplorePage() {
  const router = useRouter();

  // ── State ──────────────────────────────────────────────────────────────────
  const [userPos, setUserPos] = React.useState<[number, number]>(BENGALURU);
  const [geoError, setGeoError] = React.useState<string | null>(null);
  const [geoLoading, setGeoLoading] = React.useState(true);

  const [spots, setSpots] = React.useState<ChargingSpot[]>([]);
  const [spotsLoading, setSpotsLoading] = React.useState(false);
  const [spotsError, setSpotsError] = React.useState<string | null>(null);

  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = React.useState<string | null>(null);
  const [batteryPct, setBatteryPct] = React.useState(50);

  const [selectedSpotId, setSelectedSpotId] = React.useState<string | null>(null);
  const [showFilters, setShowFilters] = React.useState(false);
  const [sosLoading, setSosLoading] = React.useState(false);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) ?? null;

  // ── Geolocation ────────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation not available — showing Bengaluru");
      setGeoLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        setGeoLoading(false);
      },
      () => {
        setGeoError("Could not get your location — showing Bengaluru");
        setGeoLoading(false);
      },
      { timeout: 5000, enableHighAccuracy: false }
    );
  }, []);

  // ── Load vehicles ──────────────────────────────────────────────────────────
  React.useEffect(() => {
    getMyVehicles().then((vs) => {
      setVehicles(vs);
      if (vs.length > 0) setSelectedVehicleId(vs[0].id);
    });
  }, []);

  // ── Load spots whenever position changes ───────────────────────────────────
  React.useEffect(() => {
    if (geoLoading) return;

    setSpotsLoading(true);
    setSpotsError(null);

    getNearbySpots({
      lat: userPos[0],
      lng: userPos[1],
      radiusKm: SEARCH_RADIUS_KM,
      onlineOnly: false,
    })
      .then(setSpots)
      .catch((err) => setSpotsError(err.message ?? "Failed to load spots"))
      .finally(() => setSpotsLoading(false));
  }, [geoLoading, userPos]);

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filteredSpots = React.useMemo(() => {
    if (!selectedVehicle) return spots;
    return spots.filter((s) => {
      if (!connectorMatch(selectedVehicle.connector, s.connector)) return false;
      if (!canReach(batteryPct, selectedVehicle.battery_kwh, s.distance_km ?? 0)) return false;
      return true;
    });
  }, [spots, selectedVehicle, batteryPct]);

  // Spots to show on map (all online spots — dimmed on list if unreachable)
  const mapSpots = spots.filter((s) => s.is_online);

  // ── SOS CHARGE ─────────────────────────────────────────────────────────────
  function handleSOS() {
    setSosLoading(true);
    const candidates = filteredSpots.filter((s) => s.is_online);
    if (candidates.length === 0) {
      setSosLoading(false);
      alert("No compatible online spots nearby. Try increasing battery level or expanding radius.");
      return;
    }
    const nearest = candidates.reduce((a, b) =>
      (a.distance_km ?? 999) < (b.distance_km ?? 999) ? a : b
    );
    router.push(`/spot/${nearest.id}`);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:flex-row overflow-hidden">
      {/* ── Left: Controls + List ─────────────────────────────────────────── */}
      <aside
        id="explore-sidebar"
        className="
          w-full md:w-[400px] md:min-w-[360px] flex flex-col
          bg-card border-r border-border
          overflow-y-auto overscroll-contain
          order-2 md:order-1
          md:h-full h-[50vh]
        "
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="sticky top-0 z-10 bg-card border-b border-border px-4 pt-4 pb-3 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-headline-sm text-foreground leading-tight">
                Find a Socket
              </h1>
              <p className="text-body-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                {geoLoading ? (
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 border border-charge border-t-transparent rounded-full animate-spin" />
                    Locating you…
                  </span>
                ) : geoError ? (
                  <span className="flex items-center gap-1 text-ochre">
                    <AlertTriangle className="size-3" />
                    {geoError}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-forest">
                    <Navigation className="size-3" />
                    Live location
                  </span>
                )}
              </p>
            </div>

            <button
              id="explore-filter-toggle"
              onClick={() => setShowFilters((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-body-sm font-body hover:bg-recessed transition-colors"
              aria-expanded={showFilters}
            >
              <SlidersHorizontal className="size-3.5 text-muted-foreground" />
              Filters
            </button>
          </div>

          {/* ── Filter panel ─────────────────────────────────────────────── */}
          {showFilters && (
            <div
              id="explore-filter-panel"
              className="rounded-xl bg-recessed p-3 space-y-3 animate-slide-in-up"
            >
              {/* Vehicle picker */}
              <div className="space-y-1">
                <label
                  htmlFor="vehicle-select"
                  className="font-heading text-label-sm uppercase tracking-widest text-muted-foreground"
                >
                  My Vehicle
                </label>
                {vehicles.length === 0 ? (
                  <p className="text-body-sm text-muted-foreground italic">No vehicles — add one in My Garage</p>
                ) : (
                  <div className="relative">
                    <select
                      id="vehicle-select"
                      value={selectedVehicleId ?? ""}
                      onChange={(e) => setSelectedVehicleId(e.target.value)}
                      className="
                        w-full appearance-none bg-card border border-border rounded-lg
                        px-3 py-2 font-body text-body-md text-foreground
                        focus:outline-none focus:ring-2 focus:ring-charge/40
                        pr-8
                      "
                    >
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.make} {v.model} · {v.connector}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  </div>
                )}
              </div>

              {/* Battery % */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="battery-input"
                    className="font-heading text-label-sm uppercase tracking-widest text-muted-foreground flex items-center gap-1"
                  >
                    <Battery className="size-3.5" />
                    Current Battery
                  </label>
                  <span className="font-heading text-label-lg text-charge">{batteryPct}%</span>
                </div>
                <input
                  id="battery-input"
                  type="range"
                  min={1}
                  max={100}
                  value={batteryPct}
                  onChange={(e) => setBatteryPct(Number(e.target.value))}
                  className="w-full accent-[hsl(var(--charge))] h-2 rounded-full cursor-pointer"
                />
                {selectedVehicle && (
                  <p className="text-body-sm text-muted-foreground">
                    Estimated range:{" "}
                    <strong className="text-foreground">
                      {Math.round((batteryPct / 100) * selectedVehicle.battery_kwh * KM_PER_KWH)} km
                    </strong>
                  </p>
                )}
              </div>

              {/* Selected vehicle chip */}
              {selectedVehicle && (
                <div className="flex flex-wrap gap-2">
                  <ConnectorChip
                    type={
                      selectedVehicle.connector === "CCS2" ? "ccs2" :
                      selectedVehicle.connector === "Type2" ? "type2" :
                      "16a"
                    }
                    power={`${selectedVehicle.battery_kwh} kWh`}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── SOS CHARGE button ─────────────────────────────────────────── */}
          <button
            id="sos-charge-btn"
            onClick={handleSOS}
            disabled={sosLoading || spotsLoading}
            className="
              w-full flex items-center justify-center gap-2
              bg-destructive text-white
              font-heading text-headline-sm tracking-tight
              py-3 rounded-xl
              shadow-md hover:brightness-105 active:scale-[0.98]
              transition-all duration-150
              disabled:opacity-60 disabled:cursor-not-allowed
              animate-pulse-subtle
            "
            aria-label="SOS Charge — navigate to nearest compatible charging spot immediately"
          >
            {sosLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Siren className="size-5" aria-hidden />
            )}
            SOS CHARGE
            <span className="text-body-sm font-body opacity-80">Nearest spot →</span>
          </button>
        </div>

        {/* ── Spots list ─────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {/* Status bar */}
          <div className="flex items-center justify-between px-1">
            <span className="font-heading text-label-sm uppercase tracking-widest text-muted-foreground">
              {spotsLoading
                ? "Searching…"
                : `${filteredSpots.length} spot${filteredSpots.length !== 1 ? "s" : ""} within ${SEARCH_RADIUS_KM} km`}
            </span>
            <span className="flex items-center gap-1 text-body-sm text-muted-foreground">
              <Wifi className="size-3 text-forest" />
              {spots.filter((s) => s.is_online).length} online
            </span>
          </div>

          {/* Loading skeletons */}
          {spotsLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-recessed animate-pulse" />
              ))}
            </div>
          )}

          {/* Error */}
          {!spotsLoading && spotsError && (
            <div
              id="explore-error"
              className="flex flex-col items-center gap-3 py-10 text-center"
            >
              <AlertTriangle className="size-10 text-destructive" />
              <p className="font-heading text-headline-sm text-foreground">Failed to load spots</p>
              <p className="text-body-sm text-muted-foreground">{spotsError}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSpotsLoading(true);
                  getNearbySpots({ lat: userPos[0], lng: userPos[1], radiusKm: SEARCH_RADIUS_KM })
                    .then(setSpots)
                    .catch((e) => setSpotsError(e.message))
                    .finally(() => setSpotsLoading(false));
                }}
              >
                Retry
              </Button>
            </div>
          )}

          {/* Empty */}
          {!spotsLoading && !spotsError && spots.length === 0 && (
            <div id="explore-empty" className="flex flex-col items-center gap-3 py-10 text-center">
              <WifiOff className="size-10 text-muted-foreground" />
              <p className="font-heading text-headline-sm text-foreground">No spots nearby</p>
              <p className="text-body-sm text-muted-foreground">
                We couldn't find any charging spots within {SEARCH_RADIUS_KM} km.
                Try moving to a different area.
              </p>
            </div>
          )}

          {/* Filtered empty (spots exist but none compatible) */}
          {!spotsLoading && !spotsError && spots.length > 0 && filteredSpots.length === 0 && (
            <div id="explore-no-compatible" className="flex flex-col items-center gap-3 py-8 text-center">
              <Battery className="size-10 text-ochre" />
              <p className="font-heading text-headline-sm text-foreground">No compatible spots in range</p>
              <p className="text-body-sm text-muted-foreground">
                Your battery or connector type doesn't match any nearby spots.
                Try charging a little more or switching your vehicle.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setBatteryPct(80); }}
              >
                Assume 80% battery
              </Button>
            </div>
          )}

          {/* Spot cards */}
          {!spotsLoading && !spotsError && filteredSpots.map((spot) => (
            <SpotCard
              key={spot.id}
              spot={spot}
              isSelected={selectedSpotId === spot.id}
              isCompatible={true}
              onSelect={(id) => setSelectedSpotId((prev) => (prev === id ? null : id))}
            />
          ))}

          {/* Incompatible spots — shown dimmed below */}
          {!spotsLoading && !spotsError && selectedVehicle && (() => {
            const incompatible = spots.filter(
              (s) =>
                !connectorMatch(selectedVehicle.connector, s.connector) ||
                !canReach(batteryPct, selectedVehicle.battery_kwh, s.distance_km ?? 0)
            );
            if (incompatible.length === 0) return null;
            return (
              <details className="mt-2">
                <summary className="font-heading text-label-sm uppercase tracking-widest text-muted-foreground cursor-pointer select-none py-2 hover:text-foreground transition-colors">
                  {incompatible.length} incompatible / out-of-range spot{incompatible.length > 1 ? "s" : ""}
                </summary>
                <div className="space-y-2 mt-2 opacity-50 pointer-events-none">
                  {incompatible.map((spot) => (
                    <SpotCard key={spot.id} spot={spot} isCompatible={false} />
                  ))}
                </div>
              </details>
            );
          })()}
        </div>
      </aside>

      {/* ── Right: Map ───────────────────────────────────────────────────── */}
      <div
        id="explore-map-container"
        className="flex-1 order-1 md:order-2 h-[50vh] md:h-full relative"
      >
        <LeafletMap
          center={userPos}
          spots={mapSpots}
          selectedSpotId={selectedSpotId}
          onMarkerClick={(id) => setSelectedSpotId((prev) => (prev === id ? null : id))}
          className="w-full h-full"
        />

        {/* Selected spot float */}
        {selectedSpotId && (() => {
          const s = spots.find((x) => x.id === selectedSpotId);
          if (!s) return null;
          return (
            <a
              href={`/spot/${s.id}`}
              id="map-spot-float"
              className="
                absolute bottom-4 left-1/2 -translate-x-1/2
                bg-card rounded-xl shadow-card-hover
                px-4 py-2 flex items-center gap-3
                border border-border
                hover:shadow-lg transition-all
                animate-slide-in-up
                z-[500]
                max-w-[90%]
              "
            >
              <MapPin className="size-4 text-charge shrink-0" />
              <div className="min-w-0">
                <p className="font-heading text-label-lg text-foreground line-clamp-1">{s.title}</p>
                <p className="text-body-sm text-muted-foreground">
                  {s.distance_km} km · ₹{s.price_per_kwh}/kWh · {s.power_kw} kW
                </p>
              </div>
              <span className="shrink-0 text-body-sm font-heading text-charge">View →</span>
            </a>
          );
        })()}
      </div>
    </div>
  );
}
