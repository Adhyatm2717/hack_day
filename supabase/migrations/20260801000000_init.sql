-- ============================================================================
-- ChargeMate — Initial Schema
-- Migration: 20260801000000_init.sql
-- ============================================================================

-- ── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Enum types ────────────────────────────────────────────────────────────────
CREATE TYPE connector_type       AS ENUM ('CCS2', 'Type2', '16A_socket', '3pin');
CREATE TYPE vehicle_type_enum    AS ENUM ('car', 'scooter', 'bike', 'auto');
CREATE TYPE active_mode_enum     AS ENUM ('charge', 'host');
CREATE TYPE verification_status  AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE booking_status_enum  AS ENUM ('requested', 'accepted', 'declined', 'charging', 'completed', 'cancelled', 'expired');
CREATE TYPE payment_status_enum  AS ENUM ('pending', 'paid', 'failed');

-- ── profiles ─────────────────────────────────────────────────────────────────
-- Mirrors types/db.ts: Profile
CREATE TABLE public.profiles (
  id           uuid         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    text         NOT NULL DEFAULT '',
  phone        text         NOT NULL DEFAULT '',  -- E.164
  avatar_url   text,
  is_rider     boolean      NOT NULL DEFAULT true,
  is_host      boolean      NOT NULL DEFAULT false,
  active_mode  active_mode_enum NOT NULL DEFAULT 'charge',
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: owner read"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: owner update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── vehicles ─────────────────────────────────────────────────────────────────
-- Mirrors types/db.ts: Vehicle
CREATE TABLE public.vehicles (
  id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     uuid         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type         vehicle_type_enum NOT NULL,
  make         text         NOT NULL,
  model        text         NOT NULL,
  connector    connector_type NOT NULL,
  battery_kwh  numeric(6,2) NOT NULL,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vehicles: owner read"
  ON public.vehicles FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "vehicles: owner insert"
  ON public.vehicles FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "vehicles: owner update"
  ON public.vehicles FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "vehicles: owner delete"
  ON public.vehicles FOR DELETE
  USING (auth.uid() = owner_id);

-- ── host_profiles ─────────────────────────────────────────────────────────────
-- Mirrors types/db.ts: HostProfile
CREATE TABLE public.host_profiles (
  user_id              uuid              PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  verification_status  verification_status NOT NULL DEFAULT 'pending',
  id_doc_url           text,
  bank_upi             text,
  created_at           timestamptz       NOT NULL DEFAULT now(),
  updated_at           timestamptz       NOT NULL DEFAULT now()
);

ALTER TABLE public.host_profiles ENABLE ROW LEVEL SECURITY;

-- id_doc_url is sensitive — only the owner may read it
CREATE POLICY "host_profiles: owner read"
  ON public.host_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "host_profiles: owner insert"
  ON public.host_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "host_profiles: owner update"
  ON public.host_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── charging_spots ────────────────────────────────────────────────────────────
-- Mirrors types/db.ts: ChargingSpot
-- lat/lng stored as plain columns AND as PostGIS geography point
CREATE TABLE public.charging_spots (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id         uuid          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           text          NOT NULL,
  lat             numeric(10,7) NOT NULL,
  lng             numeric(10,7) NOT NULL,
  location        geography(Point, 4326) NOT NULL,
  address         text          NOT NULL,
  locality        text          NOT NULL,
  city            text          NOT NULL,
  power_kw        numeric(6,2)  NOT NULL,
  connector       connector_type NOT NULL,
  price_per_kwh   numeric(8,2)  NOT NULL,
  photos          text[]        NOT NULL DEFAULT '{}',
  rules           text,
  available_from  time          NOT NULL DEFAULT '07:00',
  available_to    time          NOT NULL DEFAULT '22:00',
  is_online       boolean       NOT NULL DEFAULT false,
  rating          numeric(3,1)  NOT NULL DEFAULT 0,
  review_count    integer       NOT NULL DEFAULT 0,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX charging_spots_location_idx  ON public.charging_spots USING GIST (location);
CREATE INDEX charging_spots_host_id_idx   ON public.charging_spots (host_id);
CREATE INDEX charging_spots_is_online_idx ON public.charging_spots (is_online);

ALTER TABLE public.charging_spots ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read online spots
CREATE POLICY "charging_spots: authenticated read online"
  ON public.charging_spots FOR SELECT
  USING (auth.role() = 'authenticated' AND is_online = true);

-- Hosts can also read their own spots (including offline)
CREATE POLICY "charging_spots: host read own"
  ON public.charging_spots FOR SELECT
  USING (auth.uid() = host_id);

CREATE POLICY "charging_spots: host insert"
  ON public.charging_spots FOR INSERT
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "charging_spots: host update"
  ON public.charging_spots FOR UPDATE
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "charging_spots: host delete"
  ON public.charging_spots FOR DELETE
  USING (auth.uid() = host_id);

-- ── bookings ──────────────────────────────────────────────────────────────────
-- Mirrors types/db.ts: Booking
CREATE TABLE public.bookings (
  id                 uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id           uuid               NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  spot_id            uuid               NOT NULL REFERENCES public.charging_spots(id) ON DELETE RESTRICT,
  vehicle_id         uuid               NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  status             booking_status_enum NOT NULL DEFAULT 'requested',
  start_battery_pct  integer            NOT NULL CHECK (start_battery_pct BETWEEN 0 AND 100),
  started_at         timestamptz,
  ended_at           timestamptz,
  kwh_used           numeric(8,3),
  amount_inr         numeric(10,2),
  gate_pin           char(4),
  created_at         timestamptz        NOT NULL DEFAULT now(),
  updated_at         timestamptz        NOT NULL DEFAULT now()
);

CREATE INDEX bookings_rider_id_idx ON public.bookings (rider_id);
CREATE INDEX bookings_spot_id_idx  ON public.bookings (spot_id);
CREATE INDEX bookings_status_idx   ON public.bookings (status);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Riders see only their own bookings
CREATE POLICY "bookings: rider read own"
  ON public.bookings FOR SELECT
  USING (auth.uid() = rider_id);

-- Hosts see bookings on their own spots
CREATE POLICY "bookings: host read own spots"
  ON public.bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.charging_spots
      WHERE charging_spots.id = bookings.spot_id
        AND charging_spots.host_id = auth.uid()
    )
  );

-- Riders can create bookings
CREATE POLICY "bookings: rider insert"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = rider_id);

-- Riders can update their own bookings (e.g., cancel)
CREATE POLICY "bookings: rider update own"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = rider_id)
  WITH CHECK (auth.uid() = rider_id);

-- Hosts can update bookings on their spots (accept/decline/start/end)
CREATE POLICY "bookings: host update own spots"
  ON public.bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.charging_spots
      WHERE charging_spots.id = bookings.spot_id
        AND charging_spots.host_id = auth.uid()
    )
  );

-- ── payments ──────────────────────────────────────────────────────────────────
-- Mirrors types/db.ts: Payment
CREATE TABLE public.payments (
  id               uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id       uuid               NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE RESTRICT,
  amount_inr       numeric(10,2)      NOT NULL,
  platform_fee_inr numeric(10,2)      NOT NULL,
  host_payout_inr  numeric(10,2)      NOT NULL,
  status           payment_status_enum NOT NULL DEFAULT 'pending',
  method           text               NOT NULL,
  created_at       timestamptz        NOT NULL DEFAULT now(),
  updated_at       timestamptz        NOT NULL DEFAULT now()
);

CREATE INDEX payments_booking_id_idx ON public.payments (booking_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Riders can see payments for their own bookings
CREATE POLICY "payments: rider read own"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = payments.booking_id
        AND bookings.rider_id = auth.uid()
    )
  );

-- Hosts can see payments for bookings on their spots
CREATE POLICY "payments: host read own spots"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      JOIN public.charging_spots ON charging_spots.id = bookings.spot_id
      WHERE bookings.id = payments.booking_id
        AND charging_spots.host_id = auth.uid()
    )
  );

-- Service role only for writes (server-side payment processing)
CREATE POLICY "payments: service role insert"
  ON public.payments FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "payments: service role update"
  ON public.payments FOR UPDATE
  USING (auth.role() = 'service_role');

-- ── reviews ───────────────────────────────────────────────────────────────────
-- Mirrors types/db.ts: Review
CREATE TABLE public.reviews (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  uuid        NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE RESTRICT,
  rater_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  host_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  rating      smallint    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     text,
  reply       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX reviews_host_id_idx    ON public.reviews (host_id);
CREATE INDEX reviews_rater_id_idx   ON public.reviews (rater_id);
CREATE INDEX reviews_booking_id_idx ON public.reviews (booking_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Any logged-in user can read reviews
CREATE POLICY "reviews: authenticated read"
  ON public.reviews FOR SELECT
  USING (auth.role() = 'authenticated');

-- Riders submit reviews
CREATE POLICY "reviews: rider insert"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = rater_id);

-- Hosts can only update reply field (enforced at app layer; policy allows update)
CREATE POLICY "reviews: host update reply"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

-- ── wallets ───────────────────────────────────────────────────────────────────
-- user_id + balance_inr (as specified in task requirements)
CREATE TABLE public.wallets (
  user_id     uuid         PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance_inr numeric(12,2) NOT NULL DEFAULT 0 CHECK (balance_inr >= 0),
  updated_at  timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wallets: owner read"
  ON public.wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "wallets: owner update"
  ON public.wallets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role full access for server-side transactions
CREATE POLICY "wallets: service role all"
  ON public.wallets FOR ALL
  USING (auth.role() = 'service_role');

-- ── updated_at trigger helper ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_host_profiles_updated_at
  BEFORE UPDATE ON public.host_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_charging_spots_updated_at
  BEFORE UPDATE ON public.charging_spots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Auto-sync location column ─────────────────────────────────────────────────
-- Keeps geography(Point) in sync with lat/lng columns automatically
CREATE OR REPLACE FUNCTION public.sync_spot_location()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.location = ST_SetSRID(ST_MakePoint(NEW.lng::float8, NEW.lat::float8), 4326)::geography;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_charging_spots_location_sync
  BEFORE INSERT OR UPDATE OF lat, lng ON public.charging_spots
  FOR EACH ROW EXECUTE FUNCTION public.sync_spot_location();

-- ── profiles auto-create on signup (Item 3) ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, avatar_url, is_rider, is_host, active_mode)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.raw_user_meta_data->>'avatar_url',
    true,
    false,
    'charge'
  );
  -- Create an empty wallet at the same time
  INSERT INTO public.wallets (user_id, balance_inr)
  VALUES (NEW.id, 0);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── nearby_spots RPC (Item 1) ─────────────────────────────────────────────────
-- Matches GetNearbySpotsParams in lib/data/spots.ts exactly.
-- Returns spots with distance_km, ordered nearest first.
CREATE OR REPLACE FUNCTION public.nearby_spots(
  lat          double precision,
  lng          double precision,
  radius_km    double precision   DEFAULT 10,
  connector    connector_type     DEFAULT NULL,
  only_online  boolean            DEFAULT true
)
RETURNS TABLE (
  id              uuid,
  host_id         uuid,
  title           text,
  lat             numeric,
  lng             numeric,
  address         text,
  locality        text,
  city            text,
  power_kw        numeric,
  connector       connector_type,
  price_per_kwh   numeric,
  photos          text[],
  rules           text,
  available_from  time,
  available_to    time,
  is_online       boolean,
  rating          numeric,
  review_count    integer,
  created_at      timestamptz,
  updated_at      timestamptz,
  distance_km     double precision
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    cs.id,
    cs.host_id,
    cs.title,
    cs.lat,
    cs.lng,
    cs.address,
    cs.locality,
    cs.city,
    cs.power_kw,
    cs.connector,
    cs.price_per_kwh,
    cs.photos,
    cs.rules,
    cs.available_from,
    cs.available_to,
    cs.is_online,
    cs.rating,
    cs.review_count,
    cs.created_at,
    cs.updated_at,
    ROUND(
      (ST_Distance(
        cs.location,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
      ) / 1000.0)::numeric,
      1
    )::double precision AS distance_km
  FROM public.charging_spots cs
  WHERE
    ST_DWithin(
      cs.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_km * 1000
    )
    AND (only_online = false OR cs.is_online = true)
    AND (nearby_spots.connector IS NULL OR cs.connector = nearby_spots.connector)
  ORDER BY distance_km ASC;
$$;

GRANT EXECUTE ON FUNCTION public.nearby_spots(double precision, double precision, double precision, connector_type, boolean)
  TO authenticated;

-- ── Trigger: recompute spot rating after review insert/update ─────────────────
CREATE OR REPLACE FUNCTION public.refresh_spot_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_spot_id uuid;
BEGIN
  SELECT b.spot_id INTO v_spot_id
  FROM public.bookings b
  WHERE b.id = COALESCE(NEW.booking_id, OLD.booking_id);

  IF v_spot_id IS NOT NULL THEN
    UPDATE public.charging_spots
    SET
      rating       = COALESCE((
        SELECT ROUND(AVG(r.rating)::numeric, 1)
        FROM public.reviews r
        JOIN public.bookings b ON b.id = r.booking_id
        WHERE b.spot_id = v_spot_id
      ), 0),
      review_count = (
        SELECT COUNT(*)::integer
        FROM public.reviews r
        JOIN public.bookings b ON b.id = r.booking_id
        WHERE b.spot_id = v_spot_id
      )
    WHERE id = v_spot_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_refresh_spot_rating
  AFTER INSERT OR UPDATE OF rating ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.refresh_spot_rating();

-- ── Storage buckets (Item 4) ──────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('id-documents', 'id-documents', false, 10485760, ARRAY['image/jpeg','image/png','application/pdf']),
  ('spot-photos',  'spot-photos',  true,  5242880,  ARRAY['image/jpeg','image/png','image/webp']),
  ('avatars',      'avatars',      true,  2097152,  ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- id-documents: private — only the owner reads/writes their own subfolder
CREATE POLICY "id-documents: owner read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'id-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "id-documents: owner insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'id-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "id-documents: owner delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'id-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- spot-photos: public read, spot-owner write (folder named by host UUID)
CREATE POLICY "spot-photos: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'spot-photos');

CREATE POLICY "spot-photos: owner insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'spot-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "spot-photos: owner delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'spot-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- avatars: public read, owner write
CREATE POLICY "avatars: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars: owner insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "avatars: owner delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
