-- ============================================================================
-- ChargeMate — Initial Schema + Booking State Machine
-- Migration: 20260801000000_init.sql
-- ============================================================================

-- ── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ── Enum types ────────────────────────────────────────────────────────────────
CREATE TYPE connector_type       AS ENUM ('CCS2','Type2','16A_socket','3pin');
CREATE TYPE vehicle_type_enum    AS ENUM ('car','scooter','bike','auto');
CREATE TYPE active_mode_enum     AS ENUM ('charge','host');
CREATE TYPE verification_status  AS ENUM ('pending','verified','rejected');
CREATE TYPE booking_status_enum  AS ENUM ('requested','accepted','declined','charging','completed','cancelled','expired');
CREATE TYPE payment_status_enum  AS ENUM ('pending','paid','failed');

-- ── profiles ─────────────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    text NOT NULL DEFAULT '',
  phone        text NOT NULL DEFAULT '',
  avatar_url   text,
  is_rider     boolean NOT NULL DEFAULT true,
  is_host      boolean NOT NULL DEFAULT false,
  active_mode  active_mode_enum NOT NULL DEFAULT 'charge',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles: owner read"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles: owner update" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ── vehicles ─────────────────────────────────────────────────────────────────
CREATE TABLE public.vehicles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type         vehicle_type_enum NOT NULL,
  make         text NOT NULL,
  model        text NOT NULL,
  connector    connector_type NOT NULL,
  battery_kwh  numeric(6,2) NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehicles: owner read"   ON public.vehicles FOR SELECT  USING (auth.uid() = owner_id);
CREATE POLICY "vehicles: owner insert" ON public.vehicles FOR INSERT  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "vehicles: owner update" ON public.vehicles FOR UPDATE  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "vehicles: owner delete" ON public.vehicles FOR DELETE  USING (auth.uid() = owner_id);

-- ── host_profiles ─────────────────────────────────────────────────────────────
CREATE TABLE public.host_profiles (
  user_id              uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  verification_status  verification_status NOT NULL DEFAULT 'pending',
  id_doc_url           text,
  bank_upi             text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.host_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "host_profiles: owner read"   ON public.host_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "host_profiles: owner insert" ON public.host_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "host_profiles: owner update" ON public.host_profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── charging_spots ────────────────────────────────────────────────────────────
CREATE TABLE public.charging_spots (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           text NOT NULL,
  lat             numeric(10,7) NOT NULL,
  lng             numeric(10,7) NOT NULL,
  location        geography(Point,4326) NOT NULL,
  address         text NOT NULL,
  locality        text NOT NULL,
  city            text NOT NULL,
  power_kw        numeric(6,2) NOT NULL,
  connector       connector_type NOT NULL,
  price_per_kwh   numeric(8,2) NOT NULL,
  photos          text[] NOT NULL DEFAULT '{}',
  rules           text,
  available_from  time NOT NULL DEFAULT '07:00',
  available_to    time NOT NULL DEFAULT '22:00',
  is_online       boolean NOT NULL DEFAULT false,
  rating          numeric(3,1) NOT NULL DEFAULT 0,
  review_count    integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX charging_spots_location_idx  ON public.charging_spots USING GIST (location);
CREATE INDEX charging_spots_host_id_idx   ON public.charging_spots (host_id);
CREATE INDEX charging_spots_is_online_idx ON public.charging_spots (is_online);
ALTER TABLE public.charging_spots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "spots: auth read online" ON public.charging_spots FOR SELECT USING (auth.role() = 'authenticated' AND is_online = true);
CREATE POLICY "spots: host read own"    ON public.charging_spots FOR SELECT USING (auth.uid() = host_id);
CREATE POLICY "spots: host insert"      ON public.charging_spots FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "spots: host update"      ON public.charging_spots FOR UPDATE USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);
CREATE POLICY "spots: host delete"      ON public.charging_spots FOR DELETE USING (auth.uid() = host_id);

-- ── bookings ──────────────────────────────────────────────────────────────────
CREATE TABLE public.bookings (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  spot_id            uuid NOT NULL REFERENCES public.charging_spots(id) ON DELETE RESTRICT,
  vehicle_id         uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  status             booking_status_enum NOT NULL DEFAULT 'requested',
  start_battery_pct  integer NOT NULL CHECK (start_battery_pct BETWEEN 0 AND 100),
  started_at         timestamptz,
  ended_at           timestamptz,
  kwh_used           numeric(8,3),
  amount_inr         numeric(10,2),
  gate_pin           char(4),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX bookings_rider_id_idx ON public.bookings (rider_id);
CREATE INDEX bookings_spot_id_idx  ON public.bookings (spot_id);
CREATE INDEX bookings_status_idx   ON public.bookings (status);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- gate_pin visible only to rider + host of that booking
CREATE POLICY "bookings: rider read own" ON public.bookings FOR SELECT
  USING (auth.uid() = rider_id);
CREATE POLICY "bookings: host read own spots" ON public.bookings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.charging_spots WHERE charging_spots.id = bookings.spot_id AND charging_spots.host_id = auth.uid()
  ));
CREATE POLICY "bookings: rider insert"      ON public.bookings FOR INSERT WITH CHECK (auth.uid() = rider_id);
CREATE POLICY "bookings: rider update own"  ON public.bookings FOR UPDATE USING (auth.uid() = rider_id) WITH CHECK (auth.uid() = rider_id);
CREATE POLICY "bookings: host update own spots" ON public.bookings FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.charging_spots WHERE charging_spots.id = bookings.spot_id AND charging_spots.host_id = auth.uid()
  ));

-- ── payments ──────────────────────────────────────────────────────────────────
CREATE TABLE public.payments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id       uuid NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE RESTRICT,
  amount_inr       numeric(10,2) NOT NULL,
  platform_fee_inr numeric(10,2) NOT NULL,
  host_payout_inr  numeric(10,2) NOT NULL,
  status           payment_status_enum NOT NULL DEFAULT 'pending',
  method           text NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments: rider read own" ON public.payments FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.bookings WHERE bookings.id = payments.booking_id AND bookings.rider_id = auth.uid()));
CREATE POLICY "payments: host read own" ON public.payments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.bookings JOIN public.charging_spots ON charging_spots.id = bookings.spot_id
    WHERE bookings.id = payments.booking_id AND charging_spots.host_id = auth.uid()
  ));
CREATE POLICY "payments: service insert" ON public.payments FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "payments: service update" ON public.payments FOR UPDATE USING (auth.role() = 'service_role');

-- ── reviews ───────────────────────────────────────────────────────────────────
CREATE TABLE public.reviews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  uuid NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE RESTRICT,
  rater_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  host_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  rating      smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     text,
  reply       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews: auth read" ON public.reviews FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "reviews: rider insert" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = rater_id);
CREATE POLICY "reviews: host update reply" ON public.reviews FOR UPDATE USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);

-- ── wallets ───────────────────────────────────────────────────────────────────
CREATE TABLE public.wallets (
  user_id     uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance_inr numeric(12,2) NOT NULL DEFAULT 0 CHECK (balance_inr >= 0),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallets: owner read"   ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wallets: owner update" ON public.wallets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wallets: service all"  ON public.wallets FOR ALL   USING (auth.role() = 'service_role');

-- ── Generic updated_at trigger ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_upd       BEFORE UPDATE ON public.profiles       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_vehicles_upd       BEFORE UPDATE ON public.vehicles       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_host_profiles_upd  BEFORE UPDATE ON public.host_profiles  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_spots_upd          BEFORE UPDATE ON public.charging_spots FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_bookings_upd       BEFORE UPDATE ON public.bookings       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_payments_upd       BEFORE UPDATE ON public.payments       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_reviews_upd        BEFORE UPDATE ON public.reviews        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_wallets_upd        BEFORE UPDATE ON public.wallets        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Auto-sync location column ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_spot_location() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.location = ST_SetSRID(ST_MakePoint(NEW.lng::float8, NEW.lat::float8), 4326)::geography;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_spot_location BEFORE INSERT OR UPDATE OF lat,lng ON public.charging_spots
  FOR EACH ROW EXECUTE FUNCTION public.sync_spot_location();

-- ── Auto-create profile on signup ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, avatar_url, is_rider, is_host, active_mode)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), COALESCE(NEW.raw_user_meta_data->>'phone',''),
          NEW.raw_user_meta_data->>'avatar_url', true, false, 'charge');
  INSERT INTO public.wallets (user_id, balance_inr) VALUES (NEW.id, 0);
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── nearby_spots ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.nearby_spots(
  lat double precision, lng double precision,
  radius_km double precision DEFAULT 10,
  connector connector_type DEFAULT NULL,
  only_online boolean DEFAULT true
) RETURNS TABLE (
  id uuid, host_id uuid, title text, lat numeric, lng numeric,
  address text, locality text, city text, power_kw numeric,
  connector connector_type, price_per_kwh numeric, photos text[],
  rules text, available_from time, available_to time,
  is_online boolean, rating numeric, review_count integer,
  created_at timestamptz, updated_at timestamptz, distance_km double precision
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT cs.id, cs.host_id, cs.title, cs.lat, cs.lng,
    cs.address, cs.locality, cs.city, cs.power_kw, cs.connector, cs.price_per_kwh,
    cs.photos, cs.rules, cs.available_from, cs.available_to,
    cs.is_online, cs.rating, cs.review_count, cs.created_at, cs.updated_at,
    ROUND((ST_Distance(cs.location, ST_SetSRID(ST_MakePoint(lng,lat),4326)::geography)/1000.0)::numeric,1)::double precision AS distance_km
  FROM public.charging_spots cs
  WHERE ST_DWithin(cs.location, ST_SetSRID(ST_MakePoint(lng,lat),4326)::geography, radius_km*1000)
    AND (only_online = false OR cs.is_online = true)
    AND (nearby_spots.connector IS NULL OR cs.connector = nearby_spots.connector)
  ORDER BY distance_km ASC;
$$;
GRANT EXECUTE ON FUNCTION public.nearby_spots TO authenticated;

-- ── Refresh spot rating after review ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.refresh_spot_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_spot uuid;
BEGIN
  SELECT b.spot_id INTO v_spot FROM public.bookings b WHERE b.id = COALESCE(NEW.booking_id, OLD.booking_id);
  IF v_spot IS NOT NULL THEN
    UPDATE public.charging_spots SET
      rating       = COALESCE((SELECT ROUND(AVG(r.rating)::numeric,1) FROM public.reviews r JOIN public.bookings b ON b.id=r.booking_id WHERE b.spot_id=v_spot),0),
      review_count = (SELECT COUNT(*)::int FROM public.reviews r JOIN public.bookings b ON b.id=r.booking_id WHERE b.spot_id=v_spot)
    WHERE id = v_spot;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_refresh_spot_rating AFTER INSERT OR UPDATE OF rating ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.refresh_spot_rating();

-- ── Storage buckets ───────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types) VALUES
  ('id-documents','id-documents',false,10485760,ARRAY['image/jpeg','image/png','application/pdf']),
  ('spot-photos','spot-photos',true,5242880,ARRAY['image/jpeg','image/png','image/webp']),
  ('avatars','avatars',true,2097152,ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "id-docs: owner read"   ON storage.objects FOR SELECT USING (bucket_id='id-documents' AND auth.uid()::text=(storage.foldername(name))[1]);
CREATE POLICY "id-docs: owner insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id='id-documents' AND auth.uid()::text=(storage.foldername(name))[1]);
CREATE POLICY "id-docs: owner delete" ON storage.objects FOR DELETE USING (bucket_id='id-documents' AND auth.uid()::text=(storage.foldername(name))[1]);
CREATE POLICY "spots: public read"    ON storage.objects FOR SELECT USING (bucket_id='spot-photos');
CREATE POLICY "spots: owner insert"   ON storage.objects FOR INSERT WITH CHECK (bucket_id='spot-photos' AND auth.uid()::text=(storage.foldername(name))[1]);
CREATE POLICY "spots: owner delete"   ON storage.objects FOR DELETE USING (bucket_id='spot-photos' AND auth.uid()::text=(storage.foldername(name))[1]);
CREATE POLICY "avatars: public read"  ON storage.objects FOR SELECT USING (bucket_id='avatars');
CREATE POLICY "avatars: owner insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id='avatars' AND auth.uid()::text=(storage.foldername(name))[1]);
CREATE POLICY "avatars: owner delete" ON storage.objects FOR DELETE USING (bucket_id='avatars' AND auth.uid()::text=(storage.foldername(name))[1]);


-- ═══════════════════════════════════════════════════════════════════════════════
--  BOOKING STATE MACHINE — all server-side logic
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Helper: check 15-min gap between sessions ────────────────────────────────
CREATE OR REPLACE FUNCTION public.spot_has_overlap(
  p_spot_id uuid,
  p_exclude_booking_id uuid DEFAULT NULL
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  -- A spot is "busy" if any booking is in an active state:
  -- requested, accepted, or charging.  We also enforce a 15-min cooldown
  -- after the last ended_at.
  SELECT EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.spot_id = p_spot_id
      AND (p_exclude_booking_id IS NULL OR b.id <> p_exclude_booking_id)
      AND (
        -- Active bookings block the spot
        b.status IN ('requested','accepted','charging')
        -- Or completed less than 15 minutes ago
        OR (b.status = 'completed' AND b.ended_at > now() - interval '15 minutes')
      )
  );
$$;

-- ── 1. request_booking ────────────────────────────────────────────────────────
-- State: → requested
-- Enforces: no double-booking (including 15-min gap), spot must be online,
--           caller must be the rider (via auth.uid())
CREATE OR REPLACE FUNCTION public.request_booking(
  p_spot_id            uuid,
  p_vehicle_id         uuid,
  p_start_battery_pct  integer
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_rider_id uuid := auth.uid();
  v_booking  public.bookings;
BEGIN
  -- Spot must exist and be online
  IF NOT EXISTS (SELECT 1 FROM public.charging_spots WHERE id = p_spot_id AND is_online = true) THEN
    RAISE EXCEPTION 'Spot is offline or does not exist';
  END IF;

  -- No overlap / double-booking
  IF public.spot_has_overlap(p_spot_id) THEN
    RAISE EXCEPTION 'Spot is currently busy or in cooldown';
  END IF;

  -- Vehicle must belong to caller
  IF NOT EXISTS (SELECT 1 FROM public.vehicles WHERE id = p_vehicle_id AND owner_id = v_rider_id) THEN
    RAISE EXCEPTION 'Vehicle not found or not owned by you';
  END IF;

  INSERT INTO public.bookings (rider_id, spot_id, vehicle_id, status, start_battery_pct)
  VALUES (v_rider_id, p_spot_id, p_vehicle_id, 'requested', p_start_battery_pct)
  RETURNING * INTO v_booking;

  RETURN row_to_json(v_booking);
END; $$;
GRANT EXECUTE ON FUNCTION public.request_booking TO authenticated;

-- ── 2. accept_booking ─────────────────────────────────────────────────────────
-- State: requested → accepted
-- Enforces: caller is host of the spot, generates gate_pin
CREATE OR REPLACE FUNCTION public.accept_booking(
  p_booking_id uuid
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_booking public.bookings;
  v_pin     char(4);
BEGIN
  -- Lock the booking row
  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found'; END IF;

  -- Must be the host of this spot
  IF NOT EXISTS (
    SELECT 1 FROM public.charging_spots WHERE id = v_booking.spot_id AND host_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only the host of this spot can accept bookings';
  END IF;

  -- State guard
  IF v_booking.status <> 'requested' THEN
    RAISE EXCEPTION 'Only requested bookings can be accepted (current: %)', v_booking.status;
  END IF;

  -- Generate 4-digit gate_pin
  v_pin := lpad(floor(random() * 10000)::text, 4, '0');

  UPDATE public.bookings
  SET status = 'accepted', gate_pin = v_pin
  WHERE id = p_booking_id
  RETURNING * INTO v_booking;

  RETURN row_to_json(v_booking);
END; $$;
GRANT EXECUTE ON FUNCTION public.accept_booking TO authenticated;

-- ── 3. decline_booking ────────────────────────────────────────────────────────
-- State: requested → declined
-- Enforces: caller is host of the spot
CREATE OR REPLACE FUNCTION public.decline_booking(
  p_booking_id uuid
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_booking public.bookings;
BEGIN
  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.charging_spots WHERE id = v_booking.spot_id AND host_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only the host of this spot can decline bookings';
  END IF;

  IF v_booking.status <> 'requested' THEN
    RAISE EXCEPTION 'Only requested bookings can be declined (current: %)', v_booking.status;
  END IF;

  UPDATE public.bookings SET status = 'declined' WHERE id = p_booking_id
  RETURNING * INTO v_booking;

  RETURN row_to_json(v_booking);
END; $$;
GRANT EXECUTE ON FUNCTION public.decline_booking TO authenticated;

-- ── 4. cancel_booking ─────────────────────────────────────────────────────────
-- State: requested|accepted → cancelled
-- Enforces: caller is the rider
CREATE OR REPLACE FUNCTION public.cancel_booking(
  p_booking_id uuid
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_booking public.bookings;
BEGIN
  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found'; END IF;

  IF v_booking.rider_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only the rider can cancel a booking';
  END IF;

  IF v_booking.status NOT IN ('requested','accepted') THEN
    RAISE EXCEPTION 'Booking cannot be cancelled at this stage (current: %)', v_booking.status;
  END IF;

  UPDATE public.bookings SET status = 'cancelled' WHERE id = p_booking_id
  RETURNING * INTO v_booking;

  RETURN row_to_json(v_booking);
END; $$;
GRANT EXECUTE ON FUNCTION public.cancel_booking TO authenticated;

-- ── 5. start_session ──────────────────────────────────────────────────────────
-- State: accepted → charging
-- Enforces: caller is the host (they plug in the charger)
CREATE OR REPLACE FUNCTION public.start_session(
  p_booking_id uuid
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_booking public.bookings;
BEGIN
  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.charging_spots WHERE id = v_booking.spot_id AND host_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only the host can start a session';
  END IF;

  IF v_booking.status <> 'accepted' THEN
    RAISE EXCEPTION 'Only accepted bookings can start charging (current: %)', v_booking.status;
  END IF;

  UPDATE public.bookings SET status = 'charging', started_at = now()
  WHERE id = p_booking_id
  RETURNING * INTO v_booking;

  RETURN row_to_json(v_booking);
END; $$;
GRANT EXECUTE ON FUNCTION public.start_session TO authenticated;

-- ── 6. end_session ────────────────────────────────────────────────────────────
-- State: charging → completed
-- Computes: kwh_used from elapsed time × power_kw (simulated meter)
--           amount_inr = kwh_used × price_per_kwh
--           Creates a payment with 10% platform fee
-- Enforces: caller is host or rider of this booking
CREATE OR REPLACE FUNCTION public.end_session(
  p_booking_id uuid
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_booking   public.bookings;
  v_spot      public.charging_spots;
  v_elapsed   numeric;
  v_kwh       numeric;
  v_amount    numeric;
  v_fee       numeric;
  v_payout    numeric;
BEGIN
  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found'; END IF;

  -- Caller must be rider OR host of this booking
  IF v_booking.rider_id <> auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.charging_spots WHERE id = v_booking.spot_id AND host_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only the rider or host can end a session';
  END IF;

  IF v_booking.status <> 'charging' THEN
    RAISE EXCEPTION 'Session is not currently charging (current: %)', v_booking.status;
  END IF;

  -- Get spot for power_kw and price_per_kwh
  SELECT * INTO v_spot FROM public.charging_spots WHERE id = v_booking.spot_id;

  -- Simulated meter: kwh = power_kw × elapsed_hours
  v_elapsed := EXTRACT(EPOCH FROM (now() - v_booking.started_at)) / 3600.0;
  v_kwh     := ROUND((v_spot.power_kw * v_elapsed)::numeric, 3);
  v_amount  := ROUND((v_kwh * v_spot.price_per_kwh)::numeric, 2);
  v_fee     := ROUND((v_amount * 0.10)::numeric, 2);  -- 10% platform fee
  v_payout  := v_amount - v_fee;

  -- Complete the booking
  UPDATE public.bookings
  SET status = 'completed', ended_at = now(), kwh_used = v_kwh, amount_inr = v_amount
  WHERE id = p_booking_id
  RETURNING * INTO v_booking;

  -- Create payment record
  INSERT INTO public.payments (booking_id, amount_inr, platform_fee_inr, host_payout_inr, status, method)
  VALUES (p_booking_id, v_amount, v_fee, v_payout, 'paid', 'wallet');

  RETURN row_to_json(v_booking);
END; $$;
GRANT EXECUTE ON FUNCTION public.end_session TO authenticated;

-- ── 7. expire_stale_bookings ──────────────────────────────────────────────────
-- Expires 'requested' bookings older than 5 minutes.
-- Called by pg_cron every minute.
CREATE OR REPLACE FUNCTION public.expire_stale_bookings()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.bookings
  SET status = 'expired'
  WHERE status = 'requested'
    AND created_at < now() - interval '5 minutes';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END; $$;

-- Schedule: run every minute (pg_cron)
-- NOTE: pg_cron may not be available in all Supabase plans.
-- On Supabase Cloud, use the Dashboard → Database → Cron Jobs to create this.
-- For local dev, pg_cron extension was enabled above.
DO $$
BEGIN
  PERFORM cron.schedule(
    'expire-stale-bookings',
    '* * * * *',
    'SELECT public.expire_stale_bookings()'
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron scheduling skipped: %', SQLERRM;
END; $$;


-- ═══════════════════════════════════════════════════════════════════════════════
--  REALTIME — enable on bookings table (Item 7)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable Realtime publication for bookings
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
