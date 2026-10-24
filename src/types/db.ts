// ─────────────────────────────────────────────────────────────────────────────
// ChargeMate — Database types
// Source of truth for ALL tables. Keep in sync with Supabase schema.
// Do NOT import from this file in components — only lib/data/* should use these.
// ─────────────────────────────────────────────────────────────────────────────

// ── Shared primitives ─────────────────────────────────────────────────────────

export type ConnectorType = "CCS2" | "Type2" | "16A_socket" | "3pin";
export type VehicleType   = "car" | "scooter" | "bike" | "auto";
export type ActiveMode    = "charge" | "host";

export type VerificationStatus = "pending" | "verified" | "rejected";

export type BookingStatus =
  | "requested"
  | "accepted"
  | "declined"
  | "charging"
  | "completed"
  | "cancelled"
  | "expired";

export type PaymentStatus = "pending" | "paid" | "failed";

// ── profiles ──────────────────────────────────────────────────────────────────

export interface Profile {
  id:          string;          // UUID — matches auth.users.id
  full_name:   string;
  phone:       string;          // E.164, e.g. "+919876543210"
  avatar_url:  string | null;
  is_rider:    boolean;
  is_host:     boolean;
  active_mode: ActiveMode;
  created_at:  string;          // ISO-8601
  updated_at:  string;
}

// ── vehicles ──────────────────────────────────────────────────────────────────

export interface Vehicle {
  id:           string;
  owner_id:     string;         // → profiles.id
  type:         VehicleType;
  make:         string;         // e.g. "Tata"
  model:        string;         // e.g. "Tiago EV"
  connector:    ConnectorType;
  battery_kwh:  number;         // usable kWh
  created_at:   string;
  updated_at:   string;
}

// ── host_profiles ─────────────────────────────────────────────────────────────

export interface HostProfile {
  user_id:             string;  // → profiles.id (1-to-1)
  verification_status: VerificationStatus;
  id_doc_url:          string | null;
  bank_upi:            string | null;   // UPI ID for payouts
  created_at:          string;
  updated_at:          string;
}

// ── charging_spots ────────────────────────────────────────────────────────────

export interface ChargingSpot {
  id:             string;
  host_id:        string;       // → profiles.id
  title:          string;
  lat:            number;
  lng:            number;
  address:        string;       // full street address
  locality:       string;       // neighbourhood, e.g. "Koramangala 4th Block"
  city:           string;       // e.g. "Bengaluru"
  power_kw:       number;       // charger output, e.g. 7.2
  connector:      ConnectorType;
  price_per_kwh:  number;       // INR
  photos:         string[];     // public URLs
  rules:          string | null;// house rules / notes
  available_from: string;       // "HH:MM" 24h, e.g. "07:00"
  available_to:   string;       // "HH:MM" 24h, e.g. "22:00"
  is_online:      boolean;
  rating:         number;       // 0-5, rounded to 1dp
  review_count:   number;
  // Computed by nearby-search — not stored in DB
  distance_km?:   number;
  created_at:     string;
  updated_at:     string;
}

// ── bookings ──────────────────────────────────────────────────────────────────

export interface Booking {
  id:                string;
  rider_id:          string;    // → profiles.id
  spot_id:           string;    // → charging_spots.id
  vehicle_id:        string;    // → vehicles.id
  status:            BookingStatus;
  start_battery_pct: number;    // 0-100
  started_at:        string | null;  // ISO-8601 when session began
  ended_at:          string | null;  // ISO-8601 when session ended
  kwh_used:          number | null;
  amount_inr:        number | null;
  gate_pin:          string | null;  // 4-digit PIN shared after acceptance
  created_at:        string;
  updated_at:        string;
}

// ── payments ──────────────────────────────────────────────────────────────────

export interface Payment {
  id:               string;
  booking_id:       string;     // → bookings.id
  amount_inr:       number;
  platform_fee_inr: number;
  host_payout_inr:  number;
  status:           PaymentStatus;
  method:           string;     // e.g. "upi", "wallet", "card"
  created_at:       string;
  updated_at:       string;
}

// ── reviews ───────────────────────────────────────────────────────────────────

export interface Review {
  id:         string;
  booking_id: string;           // → bookings.id
  rater_id:   string;           // → profiles.id  (rider who leaves review)
  host_id:    string;           // → profiles.id  (host being reviewed)
  rating:     number;           // 1-5 integer
  comment:    string | null;
  reply:      string | null;    // host's reply
  created_at: string;
  updated_at: string;
}

// ── Derived / composite types used by lib/data layer ─────────────────────────

/** Returned by getSessionProgress() */
export interface SessionProgress {
  batteryPct:  number;
  kwhUsed:     number;
  costInr:     number;
  elapsedSec:  number;
}

/** Returned by getEarningsSummary() */
export interface EarningsSummary {
  today:       number;          // INR
  thisMonth:   number;          // INR
  energyKwh:   number;          // total kWh dispensed this month
  rating:      number;          // host's current avg rating
  sessionCount: number;         // sessions this month
}

/** One row in the ledger */
export interface LedgerEntry {
  id:         string;
  date:       string;           // ISO-8601
  label:      string;           // e.g. "Pooja Hegde · Tiago EV"
  amountInr:  number;
  type:       "credit" | "debit";
  status:     PaymentStatus;
}

/** Monthly revenue data point */
export interface MonthlyRevenue {
  month:    string;             // "MMM YY", e.g. "Oct 26"
  revenue:  number;             // INR
  sessions: number;
  kwhTotal: number;
}

/** Payout settings */
export interface PayoutSettings {
  upiId:      string | null;
  bankName:   string | null;
  accountLast4: string | null;
}

/** createPayment result */
export interface PaymentOrder {
  orderId:    string;           // Razorpay / mock order ID
  amountInr:  number;
  key:        string;           // Razorpay publishable key (mock: "rzp_test_mock")
}

/** Wallet state */
export interface WalletBalance {
  balanceInr: number;
  lastTopUp:  string | null;
}

/** Spot update payload (partial) */
export type SpotUpdatePayload = Partial<
  Pick<
    ChargingSpot,
    | "title"
    | "address"
    | "locality"
    | "power_kw"
    | "connector"
    | "price_per_kwh"
    | "photos"
    | "rules"
    | "available_from"
    | "available_to"
  >
>;

/** Vehicle create/update payload */
export type VehiclePayload = Omit<Vehicle, "id" | "owner_id" | "created_at" | "updated_at">;
