import type { Vehicle, VehiclePayload } from "@/types/db";
import { MOCK_RIDER_ID } from "./constants";

// ── Seed data ─────────────────────────────────────────────────────────────────

let MOCK_VEHICLES: Vehicle[] = [
  {
    id:          "vehicle-pooja-001",
    owner_id:    MOCK_RIDER_ID,
    type:        "car",
    make:        "Tata",
    model:       "Tiago EV",
    connector:   "CCS2",
    battery_kwh: 24,
    created_at:  "2026-06-15T10:00:00.000Z",
    updated_at:  "2026-06-15T10:00:00.000Z",
  },
  // A second vehicle for Pooja (two-wheeler)
  {
    id:          "vehicle-pooja-002",
    owner_id:    MOCK_RIDER_ID,
    type:        "scooter",
    make:        "Ather",
    model:       "450X Gen 3",
    connector:   "3pin",
    battery_kwh: 2.9,
    created_at:  "2026-09-01T08:00:00.000Z",
    updated_at:  "2026-09-01T08:00:00.000Z",
  },
  // Another rider's vehicle (for booking-004)
  {
    id:          "vehicle-aarav-001",
    owner_id:    "rider-aarav-002",
    type:        "car",
    make:        "MG",
    model:       "Windsor EV",
    connector:   "CCS2",
    battery_kwh: 38,
    created_at:  "2026-07-20T09:00:00.000Z",
    updated_at:  "2026-07-20T09:00:00.000Z",
  },
  {
    id:          "vehicle-kavya-001",
    owner_id:    "rider-kavya-003",
    type:        "car",
    make:        "Nexon",
    model:       "EV Max",
    connector:   "CCS2",
    battery_kwh: 40.5,
    created_at:  "2026-05-10T11:00:00.000Z",
    updated_at:  "2026-05-10T11:00:00.000Z",
  },
];

// ── Public API ────────────────────────────────────────────────────────────────

/** Returns all vehicles owned by the logged-in rider. */
export async function getMyVehicles(): Promise<Vehicle[]> {
  return MOCK_VEHICLES.filter((v) => v.owner_id === MOCK_RIDER_ID);
}

/** Return a vehicle referenced by a booking. */
export async function getVehicle(id: string): Promise<Vehicle> {
  const vehicle = MOCK_VEHICLES.find((v) => v.id === id);
  if (!vehicle) throw new Error(`Vehicle not found: ${id}`);
  return { ...vehicle };
}

/** Add a new vehicle for the logged-in rider. */
export async function addVehicle(data: VehiclePayload): Promise<Vehicle> {
  const vehicle: Vehicle = {
    ...data,
    id:         `vehicle-${Date.now()}`,
    owner_id:   MOCK_RIDER_ID,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  MOCK_VEHICLES.push(vehicle);
  return vehicle;
}

/** Update a vehicle by ID. Only the owner can update. */
export async function updateVehicle(id: string, data: Partial<VehiclePayload>): Promise<Vehicle> {
  const idx = MOCK_VEHICLES.findIndex((v) => v.id === id && v.owner_id === MOCK_RIDER_ID);
  if (idx === -1) throw new Error(`Vehicle not found or not owned by you: ${id}`);
  MOCK_VEHICLES[idx] = { ...MOCK_VEHICLES[idx], ...data, updated_at: new Date().toISOString() };
  return { ...MOCK_VEHICLES[idx] };
}

/** Delete a vehicle by ID. Only the owner can delete. */
export async function deleteVehicle(id: string): Promise<void> {
  const idx = MOCK_VEHICLES.findIndex((v) => v.id === id && v.owner_id === MOCK_RIDER_ID);
  if (idx === -1) throw new Error(`Vehicle not found or not owned by you: ${id}`);
  MOCK_VEHICLES.splice(idx, 1);
}
