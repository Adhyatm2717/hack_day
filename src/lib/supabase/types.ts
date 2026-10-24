// ─────────────────────────────────────────────────────────────────────────────
// ChargeMate — Supabase generated types
//
// This file is hand-authored to match the schema in supabase/migrations/
// AND types/db.ts.  In a live project you would regenerate it with:
//
//   npx supabase gen types typescript --project-id <your-project-id> \
//     --schema public > src/lib/supabase/types.ts
//
// Do NOT change column names or types here without also updating types/db.ts
// (those are the source of truth consumed by lib/data/*).
// ─────────────────────────────────────────────────────────────────────────────

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ── Enum helpers ─────────────────────────────────────────────────────────────

export type ConnectorTypeEnum   = "CCS2" | "Type2" | "16A_socket" | "3pin";
export type VehicleTypeEnum     = "car" | "scooter" | "bike" | "auto";
export type ActiveModeEnum      = "charge" | "host";
export type VerificationStatus  = "pending" | "verified" | "rejected";
export type BookingStatusEnum   = "requested" | "accepted" | "declined" | "charging" | "completed" | "cancelled" | "expired";
export type PaymentStatusEnum   = "pending" | "paid" | "failed";

// ── Database shape (used by createBrowserClient / createServerClient) ─────────

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id:           string;
          full_name:    string;
          phone:        string;
          avatar_url:   string | null;
          is_rider:     boolean;
          is_host:      boolean;
          active_mode:  ActiveModeEnum;
          created_at:   string;
          updated_at:   string;
        };
        Insert: {
          id:           string;
          full_name?:   string;
          phone?:       string;
          avatar_url?:  string | null;
          is_rider?:    boolean;
          is_host?:     boolean;
          active_mode?: ActiveModeEnum;
          created_at?:  string;
          updated_at?:  string;
        };
        Update: {
          id?:          string;
          full_name?:   string;
          phone?:       string;
          avatar_url?:  string | null;
          is_rider?:    boolean;
          is_host?:     boolean;
          active_mode?: ActiveModeEnum;
          updated_at?:  string;
        };
        Relationships: [];
      };

      vehicles: {
        Row: {
          id:           string;
          owner_id:     string;
          type:         VehicleTypeEnum;
          make:         string;
          model:        string;
          connector:    ConnectorTypeEnum;
          battery_kwh:  number;
          created_at:   string;
          updated_at:   string;
        };
        Insert: {
          id?:          string;
          owner_id:     string;
          type:         VehicleTypeEnum;
          make:         string;
          model:        string;
          connector:    ConnectorTypeEnum;
          battery_kwh:  number;
          created_at?:  string;
          updated_at?:  string;
        };
        Update: {
          owner_id?:    string;
          type?:        VehicleTypeEnum;
          make?:        string;
          model?:       string;
          connector?:   ConnectorTypeEnum;
          battery_kwh?: number;
          updated_at?:  string;
        };
        Relationships: [
          {
            foreignKeyName: "vehicles_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };

      host_profiles: {
        Row: {
          user_id:             string;
          verification_status: VerificationStatus;
          id_doc_url:          string | null;
          bank_upi:            string | null;
          created_at:          string;
          updated_at:          string;
        };
        Insert: {
          user_id:              string;
          verification_status?: VerificationStatus;
          id_doc_url?:          string | null;
          bank_upi?:            string | null;
          created_at?:          string;
          updated_at?:          string;
        };
        Update: {
          verification_status?: VerificationStatus;
          id_doc_url?:          string | null;
          bank_upi?:            string | null;
          updated_at?:          string;
        };
        Relationships: [
          {
            foreignKeyName: "host_profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };

      charging_spots: {
        Row: {
          id:             string;
          host_id:        string;
          title:          string;
          lat:            number;
          lng:            number;
          // location is geography(Point) — not surfaced in Row; use lat/lng
          address:        string;
          locality:       string;
          city:           string;
          power_kw:       number;
          connector:      ConnectorTypeEnum;
          price_per_kwh:  number;
          photos:         string[];
          rules:          string | null;
          available_from: string;  // "HH:MM"
          available_to:   string;  // "HH:MM"
          is_online:      boolean;
          rating:         number;
          review_count:   number;
          created_at:     string;
          updated_at:     string;
        };
        Insert: {
          id?:            string;
          host_id:        string;
          title:          string;
          lat:            number;
          lng:            number;
          address:        string;
          locality:       string;
          city:           string;
          power_kw:       number;
          connector:      ConnectorTypeEnum;
          price_per_kwh:  number;
          photos?:        string[];
          rules?:         string | null;
          available_from?: string;
          available_to?:  string;
          is_online?:     boolean;
          rating?:        number;
          review_count?:  number;
          created_at?:    string;
          updated_at?:    string;
        };
        Update: {
          title?:         string;
          lat?:           number;
          lng?:           number;
          address?:       string;
          locality?:      string;
          city?:          string;
          power_kw?:      number;
          connector?:     ConnectorTypeEnum;
          price_per_kwh?: number;
          photos?:        string[];
          rules?:         string | null;
          available_from?: string;
          available_to?:  string;
          is_online?:     boolean;
          rating?:        number;
          review_count?:  number;
          updated_at?:    string;
        };
        Relationships: [
          {
            foreignKeyName: "charging_spots_host_id_fkey";
            columns: ["host_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };

      bookings: {
        Row: {
          id:                string;
          rider_id:          string;
          spot_id:           string;
          vehicle_id:        string;
          status:            BookingStatusEnum;
          start_battery_pct: number;
          started_at:        string | null;
          ended_at:          string | null;
          kwh_used:          number | null;
          amount_inr:        number | null;
          gate_pin:          string | null;
          created_at:        string;
          updated_at:        string;
        };
        Insert: {
          id?:               string;
          rider_id:          string;
          spot_id:           string;
          vehicle_id:        string;
          status?:           BookingStatusEnum;
          start_battery_pct: number;
          started_at?:       string | null;
          ended_at?:         string | null;
          kwh_used?:         number | null;
          amount_inr?:       number | null;
          gate_pin?:         string | null;
          created_at?:       string;
          updated_at?:       string;
        };
        Update: {
          rider_id?:         string;
          spot_id?:          string;
          vehicle_id?:       string;
          status?:           BookingStatusEnum;
          start_battery_pct?: number;
          started_at?:       string | null;
          ended_at?:         string | null;
          kwh_used?:         number | null;
          amount_inr?:       number | null;
          gate_pin?:         string | null;
          updated_at?:       string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_rider_id_fkey";
            columns: ["rider_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_spot_id_fkey";
            columns: ["spot_id"];
            isOneToOne: false;
            referencedRelation: "charging_spots";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          }
        ];
      };

      payments: {
        Row: {
          id:               string;
          booking_id:       string;
          amount_inr:       number;
          platform_fee_inr: number;
          host_payout_inr:  number;
          status:           PaymentStatusEnum;
          method:           string;
          created_at:       string;
          updated_at:       string;
        };
        Insert: {
          id?:              string;
          booking_id:       string;
          amount_inr:       number;
          platform_fee_inr: number;
          host_payout_inr:  number;
          status?:          PaymentStatusEnum;
          method:           string;
          created_at?:      string;
          updated_at?:      string;
        };
        Update: {
          status?:           PaymentStatusEnum;
          method?:           string;
          amount_inr?:       number;
          platform_fee_inr?: number;
          host_payout_inr?:  number;
          updated_at?:       string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: true;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          }
        ];
      };

      reviews: {
        Row: {
          id:         string;
          booking_id: string;
          rater_id:   string;
          host_id:    string;
          rating:     number;
          comment:    string | null;
          reply:      string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?:        string;
          booking_id: string;
          rater_id:   string;
          host_id:    string;
          rating:     number;
          comment?:   string | null;
          reply?:     string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          rating?:    number;
          comment?:   string | null;
          reply?:     string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: true;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_rater_id_fkey";
            columns: ["rater_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_host_id_fkey";
            columns: ["host_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };

      wallets: {
        Row: {
          user_id:     string;
          balance_inr: number;
          updated_at:  string;
        };
        Insert: {
          user_id:      string;
          balance_inr?: number;
          updated_at?:  string;
        };
        Update: {
          balance_inr?: number;
          updated_at?:  string;
        };
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };

    Views: Record<string, never>;

    Functions: {
      nearby_spots: {
        Args: {
          lat:         number;
          lng:         number;
          radius_km?:  number;
          connector?:  ConnectorTypeEnum | null;
          only_online?: boolean;
        };
        Returns: Array<{
          id:             string;
          host_id:        string;
          title:          string;
          lat:            number;
          lng:            number;
          address:        string;
          locality:       string;
          city:           string;
          power_kw:       number;
          connector:      ConnectorTypeEnum;
          price_per_kwh:  number;
          photos:         string[];
          rules:          string | null;
          available_from: string;
          available_to:   string;
          is_online:      boolean;
          rating:         number;
          review_count:   number;
          created_at:     string;
          updated_at:     string;
          distance_km:    number;
        }>;
      };
    };

    Enums: {
      connector_type:      ConnectorTypeEnum;
      vehicle_type_enum:   VehicleTypeEnum;
      active_mode_enum:    ActiveModeEnum;
      verification_status: VerificationStatus;
      booking_status_enum: BookingStatusEnum;
      payment_status_enum: PaymentStatusEnum;
    };

    CompositeTypes: Record<string, never>;
  };
}
