import type { ChargingSpot, ConnectorType, SpotUpdatePayload } from "@/types/db";
import { MOCK_HOST_ID } from "./constants";

// ── Seed data ─────────────────────────────────────────────────────────────────

const MOCK_SPOTS: ChargingSpot[] = [
  // ── Bengaluru — Indiranagar ──────────────────────────────────────────────
  {
    id:             "spot-001",
    host_id:        MOCK_HOST_ID,
    title:          "Ramesh's Covered Driveway",
    lat:            12.9784,
    lng:            77.6408,
    address:        "12, 12th Cross, HAL 2nd Stage, Indiranagar",
    locality:       "Indiranagar",
    city:           "Bengaluru",
    power_kw:       7.2,
    connector:      "Type2",
    price_per_kwh:  12,
    photos:         [
      "https://images.unsplash.com/photo-1593941707882-a56f1f27b0b8?w=800",
    ],
    rules:          "No parking after 22:00. Ring bell on arrival.",
    available_from: "07:00",
    available_to:   "22:00",
    is_online:      true,
    rating:         4.9,
    review_count:   34,
    distance_km:    0.4,
    created_at:     "2026-08-01T10:00:00.000Z",
    updated_at:     "2026-10-20T08:00:00.000Z",
  },
  {
    id:             "spot-002",
    host_id:        "host-priya-002",
    title:          "Priya's EV Point",
    lat:            12.9721,
    lng:            77.6387,
    address:        "47, CMH Road, Indiranagar 1st Stage",
    locality:       "Indiranagar",
    city:           "Bengaluru",
    power_kw:       3.3,
    connector:      "16A_socket",
    price_per_kwh:  10,
    photos:         [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
    ],
    rules:          "Please charge your vehicle only. No overnight parking.",
    available_from: "06:00",
    available_to:   "21:00",
    is_online:      true,
    rating:         4.6,
    review_count:   18,
    distance_km:    0.9,
    created_at:     "2026-09-05T12:00:00.000Z",
    updated_at:     "2026-10-18T09:00:00.000Z",
  },
  // ── Bengaluru — Koramangala ──────────────────────────────────────────────
  {
    id:             "spot-003",
    host_id:        "host-suresh-003",
    title:          "Suresh's Shaded Driveway",
    lat:            12.9352,
    lng:            77.6245,
    address:        "14B, 4th Main Rd, Koramangala 4th Block",
    locality:       "Koramangala",
    city:           "Bengaluru",
    power_kw:       7.2,
    connector:      "CCS2",
    price_per_kwh:  14,
    photos:         [
      "https://images.unsplash.com/photo-1593941707882-a56f1f27b0b8?w=800",
    ],
    rules:          "Gate code shared after booking. Covered parking available.",
    available_from: "08:00",
    available_to:   "23:00",
    is_online:      true,
    rating:         4.8,
    review_count:   52,
    distance_km:    2.1,
    created_at:     "2026-07-14T08:00:00.000Z",
    updated_at:     "2026-10-22T07:30:00.000Z",
  },
  {
    id:             "spot-004",
    host_id:        "host-ananya-004",
    title:          "Ananya Apartments Charger",
    lat:            12.9319,
    lng:            77.6198,
    address:        "22, 80 Feet Rd, Koramangala 6th Block",
    locality:       "Koramangala",
    city:           "Bengaluru",
    power_kw:       3.3,
    connector:      "3pin",
    price_per_kwh:  10,
    photos:         [],
    rules:          null,
    available_from: "09:00",
    available_to:   "20:00",
    is_online:      false,
    rating:         4.2,
    review_count:   7,
    distance_km:    2.8,
    created_at:     "2026-10-01T10:00:00.000Z",
    updated_at:     "2026-10-23T06:00:00.000Z",
  },
  // ── Pune — Kothrud ────────────────────────────────────────────────────────
  {
    id:             "spot-005",
    host_id:        "host-vikram-005",
    title:          "Vikram's Home Charger",
    lat:            18.5048,
    lng:            73.8219,
    address:        "Plot 8, Bhosale Nagar, Kothrud",
    locality:       "Kothrud",
    city:           "Pune",
    power_kw:       7.2,
    connector:      "Type2",
    price_per_kwh:  13,
    photos:         [
      "https://images.unsplash.com/photo-1593941707882-a56f1f27b0b8?w=800",
    ],
    rules:          "Parking spot C-4 reserved. Vehicle must stay during charging.",
    available_from: "07:00",
    available_to:   "22:00",
    is_online:      true,
    rating:         4.7,
    review_count:   23,
    distance_km:    8.4,
    created_at:     "2026-08-20T11:00:00.000Z",
    updated_at:     "2026-10-21T08:00:00.000Z",
  },
  // ── Pune — Baner ─────────────────────────────────────────────────────────
  {
    id:             "spot-006",
    host_id:        "host-meera-006",
    title:          "Meera's Green Bay Charger",
    lat:            18.5590,
    lng:            73.7892,
    address:        "31, Baner Pashan Link Road, Baner",
    locality:       "Baner",
    city:           "Pune",
    power_kw:       7.2,
    connector:      "CCS2",
    price_per_kwh:  16,
    photos:         [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
    ],
    rules:          "Only booked EVs. CCTV monitored. No ICE vehicles.",
    available_from: "06:00",
    available_to:   "23:00",
    is_online:      true,
    rating:         5.0,
    review_count:   11,
    distance_km:    12.1,
    created_at:     "2026-09-10T09:00:00.000Z",
    updated_at:     "2026-10-24T06:30:00.000Z",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface GetNearbySpotsParams {
  lat:         number;
  lng:         number;
  radiusKm:    number;
  connector?:  ConnectorType;
  onlineOnly?: boolean;
}

/** Returns spots within radiusKm, sorted by distance, with distance_km set. */
export async function getNearbySpots(params: GetNearbySpotsParams): Promise<ChargingSpot[]> {
  const { lat, lng, radiusKm, connector, onlineOnly = true } = params;

  return MOCK_SPOTS
    .filter((s) => {
      if (onlineOnly && !s.is_online) return false;
      if (connector && s.connector !== connector) return false;
      const dist = haversineKm(lat, lng, s.lat, s.lng);
      return dist <= radiusKm;
    })
    .map((s) => ({
      ...s,
      distance_km: Math.round(haversineKm(lat, lng, s.lat, s.lng) * 10) / 10,
    }))
    .sort((a, b) => (a.distance_km ?? 99) - (b.distance_km ?? 99));
}

/** Returns a single spot by ID. */
export async function getSpot(id: string): Promise<ChargingSpot> {
  const spot = MOCK_SPOTS.find((s) => s.id === id);
  if (!spot) throw new Error(`Spot not found: ${id}`);
  return { ...spot };
}

/** Returns the currently logged-in host's spot. */
export async function getMySpot(): Promise<ChargingSpot> {
  const spot = MOCK_SPOTS.find((s) => s.host_id === MOCK_HOST_ID);
  if (!spot) throw new Error("No spot found for this host");
  return { ...spot };
}

/** Merges partial data into the host's spot (mock: in-memory only). */
export async function updateMySpot(data: SpotUpdatePayload): Promise<ChargingSpot> {
  const idx = MOCK_SPOTS.findIndex((s) => s.host_id === MOCK_HOST_ID);
  if (idx === -1) throw new Error("No spot found for this host");
  MOCK_SPOTS[idx] = {
    ...MOCK_SPOTS[idx],
    ...data,
    updated_at: new Date().toISOString(),
  };
  return { ...MOCK_SPOTS[idx] };
}

/** Toggles the spot online/offline. */
export async function setSpotOnline(isOnline: boolean): Promise<ChargingSpot> {
  const idx = MOCK_SPOTS.findIndex((s) => s.host_id === MOCK_HOST_ID);
  if (idx === -1) throw new Error("No spot found for this host");
  MOCK_SPOTS[idx] = {
    ...MOCK_SPOTS[idx],
    is_online:  isOnline,
    updated_at: new Date().toISOString(),
  };
  return { ...MOCK_SPOTS[idx] };
}
