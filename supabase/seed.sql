-- ============================================================================
-- ChargeMate — Seed Data
-- File: supabase/seed.sql
--
-- Fake data matching lib/data/* mock data exactly:
--   • 20 hosts with spots across Pune and Bengaluru
--   • Ramesh Verma (host-ramesh-001) as a verified host
--   • Pooja Hegde (rider-pooja-001) as a rider with a Tata Tiago EV
--   • 5 additional riders with vehicles
--   • 30 past bookings + reviews
--   • Dates in August–October 2026
--
-- Run AFTER migrations. Uses fixed UUIDs for reproducibility.
-- ============================================================================

-- ── Helpers: disable triggers during bulk insert ──────────────────────────────
-- (triggers re-enable automatically at end of session)
SET session_replication_role = replica;

-- ── 1. Auth users (bypass auth.users by inserting directly) ──────────────────
-- In production Supabase you create users via auth API.
-- For local dev / seed we insert directly into auth.users.

INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_user_meta_data, raw_app_meta_data,
  is_super_admin, confirmation_token, recovery_token,
  email_change_token_new, email_change
) VALUES
  -- Hosts (20)
  ('11111111-0001-0001-0001-000000000001'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'ramesh.verma@chargemate.in', crypt('Test1234!', gen_salt('bf')),
   now(), '2026-05-01T10:00:00Z', '2026-10-20T08:00:00Z',
   '{"full_name":"Ramesh Verma","phone":"+919876543210"}'::jsonb, '{"provider":"email"}'::jsonb,
   false, '', '', '', ''),
  ('11111111-0002-0002-0002-000000000002'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'priya.sharma@chargemate.in', crypt('Test1234!', gen_salt('bf')),
   now(), '2026-06-01T09:00:00Z', now(),
   '{"full_name":"Priya Sharma","phone":"+919823000002"}'::jsonb, '{"provider":"email"}'::jsonb,
   false, '', '', '', ''),
  ('11111111-0003-0003-0003-000000000003'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'suresh.kumar@chargemate.in', crypt('Test1234!', gen_salt('bf')),
   now(), '2026-07-10T08:00:00Z', now(),
   '{"full_name":"Suresh Kumar","phone":"+919823000003"}'::jsonb, '{"provider":"email"}'::jsonb,
   false, '', '', '', ''),
  ('11111111-0004-0004-0004-000000000004'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'ananya.iyer@chargemate.in', crypt('Test1234!', gen_salt('bf')),
   now(), '2026-08-01T10:00:00Z', now(),
   '{"full_name":"Ananya Iyer","phone":"+919823000004"}'::jsonb, '{"provider":"email"}'::jsonb,
   false, '', '', '', ''),
  ('11111111-0005-0005-0005-000000000005'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'vikram.patil@chargemate.in', crypt('Test1234!', gen_salt('bf')),
   now(), '2026-08-15T11:00:00Z', now(),
   '{"full_name":"Vikram Patil","phone":"+919823000005"}'::jsonb, '{"provider":"email"}'::jsonb,
   false, '', '', '', ''),
  ('11111111-0006-0006-0006-000000000006'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'meera.nair@chargemate.in', crypt('Test1234!', gen_salt('bf')),
   now(), '2026-09-01T09:00:00Z', now(),
   '{"full_name":"Meera Nair","phone":"+919823000006"}'::jsonb, '{"provider":"email"}'::jsonb,
   false, '', '', '', ''),
  ('11111111-0007-0007-0007-000000000007'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'arjun.mehta@chargemate.in', crypt('Test1234!', gen_salt('bf')),
   now(), '2026-08-10T07:00:00Z', now(),
   '{"full_name":"Arjun Mehta","phone":"+919823000007"}'::jsonb, '{"provider":"email"}'::jsonb,
   false, '', '', '', ''),
  ('11111111-0008-0008-0008-000000000008'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'sneha.desai@chargemate.in', crypt('Test1234!', gen_salt('bf')),
   now(), '2026-07-25T08:00:00Z', now(),
   '{"full_name":"Sneha Desai","phone":"+919823000008"}'::jsonb, '{"provider":"email"}'::jsonb,
   false, '', '', '', ''),
  ('11111111-0009-0009-0009-000000000009'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'ravi.krishnan@chargemate.in', crypt('Test1234!', gen_salt('bf')),
   now(), '2026-06-20T09:00:00Z', now(),
   '{"full_name":"Ravi Krishnan","phone":"+919823000009"}'::jsonb, '{"provider":"email"}'::jsonb,
   false, '', '', '', ''),
  ('11111111-0010-0010-0010-000000000010'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'lakshmi.reddy@chargemate.in', crypt('Test1234!', gen_salt('bf')),
   now(), '2026-08-05T10:00:00Z', now(),
   '{"full_name":"Lakshmi Reddy","phone":"+919823000010"}'::jsonb, '{"provider":"email"}'::jsonb,
   false, '', '', '', ''),
  ('11111111-0011-0011-0011-000000000011'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'deepak.joshi@chargemate.in', crypt('Test1234!', gen_salt('bf')),
   now(), '2026-09-10T08:00:00Z', now(),
   '{"full_name":"Deepak Joshi","phone":"+919823000011"}'::jsonb, '{"provider":"email"}'::jsonb,
   false, '', '', '', ''),
  ('11111111-0012-0012-0012-000000000012'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'preethi.gowda@chargemate.in', crypt('Test1234!', gen_salt('bf')),
   now(), '2026-08-22T07:30:00Z', now(),
   '{"full_name":"Preethi Gowda","phone":"+919823000012"}'::jsonb, '{"provider":"email"}'::jsonb,
   false, '', '', '', ''),
  ('11111111-0013-0013-0013-000000000013'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'sanjay.kulkarni@chargemate.in', crypt('Test1234!', gen_salt('bf')),
   now(), '2026-07-15T09:00:00Z', now(),
   '{"full_name":"Sanjay Kulkarni","phone":"+919823000013"}'::jsonb, '{"provider":"email"}'::jsonb,
   false, '', '', '', ''),
  ('11111111-0014-0014-0014-000000000014'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'nandini.rao@chargemate.in', crypt('Test1234!', gen_salt('bf')),
   now(), '2026-09-05T08:00:00Z', now(),
   '{"full_name":"Nandini Rao","phone":"+919823000014"}'::jsonb, '{"provider":"email"}'::jsonb,
   false, '', '', '', ''),
  ('11111111-0015-0015-0015-000000000015'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'kartik.singh@chargemate.in', crypt('Test1234!', gen_salt('bf')),
   now(), '2026-08-30T10:00:00Z', now(),
   '{"full_name":"Kartik Singh","phone":"+919823000015"}'::jsonb, '{"provider":"email"}'::jsonb,
   false, '', '', '', ''),
  ('11111111-0016-0016-0016-000000000016'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'divya.menon@chargemate.in', crypt('Test1234!', gen_salt('bf')),
   now(), '2026-07-01T09:00:00Z', now(),
   '{"full_name":"Divya Menon","phone":"+919823000016"}'::jsonb, '{"provider":"email"}'::jsonb,
   false, '', '', '', ''),
  ('11111111-0017-0017-0017-000000000017'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'mohit.kapoor@chargemate.in', crypt('Test1234!', gen_salt('bf')),
   now(), '2026-09-20T08:30:00Z', now(),
   '{"full_name":"Mohit Kapoor","phone":"+919823000017"}'::jsonb, '{"provider":"email"}'::jsonb,
   false, '', '', '', ''),
  ('11111111-0018-0018-0018-000000000018'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'yasmin.shaikh@chargemate.in', crypt('Test1234!', gen_salt('bf')),
   now(), '2026-08-12T07:00:00Z', now(),
   '{"full_name":"Yasmin Shaikh","phone":"+919823000018"}'::jsonb, '{"provider":"email"}'::jsonb,
   false, '', '', '', ''),
  ('11111111-0019-0019-0019-000000000019'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'gopal.nambiar@chargemate.in', crypt('Test1234!', gen_salt('bf')),
   now(), '2026-06-28T09:00:00Z', now(),
   '{"full_name":"Gopal Nambiar","phone":"+919823000019"}'::jsonb, '{"provider":"email"}'::jsonb,
   false, '', '', '', ''),
  ('11111111-0020-0020-0020-000000000020'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'rekha.pillai@chargemate.in', crypt('Test1234!', gen_salt('bf')),
   now(), '2026-07-08T10:00:00Z', now(),
   '{"full_name":"Rekha Pillai","phone":"+919823000020"}'::jsonb, '{"provider":"email"}'::jsonb,
   false, '', '', '', ''),

  -- Riders (6: Pooja + 5 others)
  ('22222222-0001-0001-0001-000000000001'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'pooja.hegde@chargemate.in', crypt('Test1234!', gen_salt('bf')),
   now(), '2026-06-10T09:00:00Z', '2026-10-22T12:00:00Z',
   '{"full_name":"Pooja Hegde","phone":"+919823456789"}'::jsonb, '{"provider":"email"}'::jsonb,
   false, '', '', '', ''),
  ('22222222-0002-0002-0002-000000000002'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'aarav.shah@chargemate.in', crypt('Test1234!', gen_salt('bf')),
   now(), '2026-07-20T09:00:00Z', now(),
   '{"full_name":"Aarav Shah","phone":"+919823000022"}'::jsonb, '{"provider":"email"}'::jsonb,
   false, '', '', '', ''),
  ('22222222-0003-0003-0003-000000000003'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'kavya.reddy@chargemate.in', crypt('Test1234!', gen_salt('bf')),
   now(), '2026-05-10T11:00:00Z', now(),
   '{"full_name":"Kavya Reddy","phone":"+919823000023"}'::jsonb, '{"provider":"email"}'::jsonb,
   false, '', '', '', ''),
  ('22222222-0004-0004-0004-000000000004'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'deepak.malhotra@chargemate.in', crypt('Test1234!', gen_salt('bf')),
   now(), '2026-06-15T08:00:00Z', now(),
   '{"full_name":"Deepak Malhotra","phone":"+919823000024"}'::jsonb, '{"provider":"email"}'::jsonb,
   false, '', '', '', ''),
  ('22222222-0005-0005-0005-000000000005'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'sarita.ghosh@chargemate.in', crypt('Test1234!', gen_salt('bf')),
   now(), '2026-07-05T09:00:00Z', now(),
   '{"full_name":"Sarita Ghosh","phone":"+919823000025"}'::jsonb, '{"provider":"email"}'::jsonb,
   false, '', '', '', ''),
  ('22222222-0006-0006-0006-000000000006'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'ritika.pandey@chargemate.in', crypt('Test1234!', gen_salt('bf')),
   now(), '2026-08-18T10:00:00Z', now(),
   '{"full_name":"Ritika Pandey","phone":"+919823000026"}'::jsonb, '{"provider":"email"}'::jsonb,
   false, '', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- ── 2. profiles ───────────────────────────────────────────────────────────────
INSERT INTO public.profiles (id, full_name, phone, avatar_url, is_rider, is_host, active_mode, created_at, updated_at) VALUES
  -- Hosts
  ('11111111-0001-0001-0001-000000000001', 'Ramesh Verma',    '+919876543210', 'https://i.pravatar.cc/150?u=ramesh-verma',    false, true,  'host',   '2026-05-01T10:00:00Z', '2026-10-20T08:00:00Z'),
  ('11111111-0002-0002-0002-000000000002', 'Priya Sharma',    '+919823000002', 'https://i.pravatar.cc/150?u=priya-sharma',    false, true,  'host',   '2026-06-01T09:00:00Z', now()),
  ('11111111-0003-0003-0003-000000000003', 'Suresh Kumar',    '+919823000003', 'https://i.pravatar.cc/150?u=suresh-kumar',    false, true,  'host',   '2026-07-10T08:00:00Z', now()),
  ('11111111-0004-0004-0004-000000000004', 'Ananya Iyer',     '+919823000004', 'https://i.pravatar.cc/150?u=ananya-iyer',     false, true,  'host',   '2026-08-01T10:00:00Z', now()),
  ('11111111-0005-0005-0005-000000000005', 'Vikram Patil',    '+919823000005', 'https://i.pravatar.cc/150?u=vikram-patil',    false, true,  'host',   '2026-08-15T11:00:00Z', now()),
  ('11111111-0006-0006-0006-000000000006', 'Meera Nair',      '+919823000006', 'https://i.pravatar.cc/150?u=meera-nair',      false, true,  'host',   '2026-09-01T09:00:00Z', now()),
  ('11111111-0007-0007-0007-000000000007', 'Arjun Mehta',     '+919823000007', 'https://i.pravatar.cc/150?u=arjun-mehta',     false, true,  'host',   '2026-08-10T07:00:00Z', now()),
  ('11111111-0008-0008-0008-000000000008', 'Sneha Desai',     '+919823000008', 'https://i.pravatar.cc/150?u=sneha-desai',     false, true,  'host',   '2026-07-25T08:00:00Z', now()),
  ('11111111-0009-0009-0009-000000000009', 'Ravi Krishnan',   '+919823000009', 'https://i.pravatar.cc/150?u=ravi-krishnan',   false, true,  'host',   '2026-06-20T09:00:00Z', now()),
  ('11111111-0010-0010-0010-000000000010', 'Lakshmi Reddy',   '+919823000010', 'https://i.pravatar.cc/150?u=lakshmi-reddy',   false, true,  'host',   '2026-08-05T10:00:00Z', now()),
  ('11111111-0011-0011-0011-000000000011', 'Deepak Joshi',    '+919823000011', 'https://i.pravatar.cc/150?u=deepak-joshi',    false, true,  'host',   '2026-09-10T08:00:00Z', now()),
  ('11111111-0012-0012-0012-000000000012', 'Preethi Gowda',   '+919823000012', 'https://i.pravatar.cc/150?u=preethi-gowda',   false, true,  'host',   '2026-08-22T07:30:00Z', now()),
  ('11111111-0013-0013-0013-000000000013', 'Sanjay Kulkarni', '+919823000013', 'https://i.pravatar.cc/150?u=sanjay-kulkarni', false, true,  'host',   '2026-07-15T09:00:00Z', now()),
  ('11111111-0014-0014-0014-000000000014', 'Nandini Rao',     '+919823000014', 'https://i.pravatar.cc/150?u=nandini-rao',     false, true,  'host',   '2026-09-05T08:00:00Z', now()),
  ('11111111-0015-0015-0015-000000000015', 'Kartik Singh',    '+919823000015', 'https://i.pravatar.cc/150?u=kartik-singh',    false, true,  'host',   '2026-08-30T10:00:00Z', now()),
  ('11111111-0016-0016-0016-000000000016', 'Divya Menon',     '+919823000016', 'https://i.pravatar.cc/150?u=divya-menon',     false, true,  'host',   '2026-07-01T09:00:00Z', now()),
  ('11111111-0017-0017-0017-000000000017', 'Mohit Kapoor',    '+919823000017', 'https://i.pravatar.cc/150?u=mohit-kapoor',    false, true,  'host',   '2026-09-20T08:30:00Z', now()),
  ('11111111-0018-0018-0018-000000000018', 'Yasmin Shaikh',   '+919823000018', 'https://i.pravatar.cc/150?u=yasmin-shaikh',   false, true,  'host',   '2026-08-12T07:00:00Z', now()),
  ('11111111-0019-0019-0019-000000000019', 'Gopal Nambiar',   '+919823000019', 'https://i.pravatar.cc/150?u=gopal-nambiar',   false, true,  'host',   '2026-06-28T09:00:00Z', now()),
  ('11111111-0020-0020-0020-000000000020', 'Rekha Pillai',    '+919823000020', 'https://i.pravatar.cc/150?u=rekha-pillai',    false, true,  'host',   '2026-07-08T10:00:00Z', now()),
  -- Riders
  ('22222222-0001-0001-0001-000000000001', 'Pooja Hegde',     '+919823456789', 'https://i.pravatar.cc/150?u=pooja-hegde',     true,  false, 'charge', '2026-06-10T09:00:00Z', '2026-10-22T12:00:00Z'),
  ('22222222-0002-0002-0002-000000000002', 'Aarav Shah',      '+919823000022', 'https://i.pravatar.cc/150?u=aarav-shah',      true,  false, 'charge', '2026-07-20T09:00:00Z', now()),
  ('22222222-0003-0003-0003-000000000003', 'Kavya Reddy',     '+919823000023', 'https://i.pravatar.cc/150?u=kavya-reddy',     true,  false, 'charge', '2026-05-10T11:00:00Z', now()),
  ('22222222-0004-0004-0004-000000000004', 'Deepak Malhotra', '+919823000024', 'https://i.pravatar.cc/150?u=deepak-malhotra', true,  false, 'charge', '2026-06-15T08:00:00Z', now()),
  ('22222222-0005-0005-0005-000000000005', 'Sarita Ghosh',    '+919823000025', 'https://i.pravatar.cc/150?u=sarita-ghosh',    true,  false, 'charge', '2026-07-05T09:00:00Z', now()),
  ('22222222-0006-0006-0006-000000000006', 'Ritika Pandey',   '+919823000026', 'https://i.pravatar.cc/150?u=ritika-pandey',   true,  false, 'charge', '2026-08-18T10:00:00Z', now())
ON CONFLICT (id) DO NOTHING;

-- ── 3. wallets ────────────────────────────────────────────────────────────────
INSERT INTO public.wallets (user_id, balance_inr, updated_at) VALUES
  ('11111111-0001-0001-0001-000000000001', 9240.00,  now()),
  ('11111111-0002-0002-0002-000000000002', 3200.00,  now()),
  ('11111111-0003-0003-0003-000000000003', 5100.00,  now()),
  ('11111111-0004-0004-0004-000000000004', 800.00,   now()),
  ('11111111-0005-0005-0005-000000000005', 4500.00,  now()),
  ('11111111-0006-0006-0006-000000000006', 7200.00,  now()),
  ('11111111-0007-0007-0007-000000000007', 2100.00,  now()),
  ('11111111-0008-0008-0008-000000000008', 3600.00,  now()),
  ('11111111-0009-0009-0009-000000000009', 5800.00,  now()),
  ('11111111-0010-0010-0010-000000000010', 1900.00,  now()),
  ('11111111-0011-0011-0011-000000000011', 2800.00,  now()),
  ('11111111-0012-0012-0012-000000000012', 4100.00,  now()),
  ('11111111-0013-0013-0013-000000000013', 6300.00,  now()),
  ('11111111-0014-0014-0014-000000000014', 1500.00,  now()),
  ('11111111-0015-0015-0015-000000000015', 3900.00,  now()),
  ('11111111-0016-0016-0016-000000000016', 7100.00,  now()),
  ('11111111-0017-0017-0017-000000000017', 2400.00,  now()),
  ('11111111-0018-0018-0018-000000000018', 4700.00,  now()),
  ('11111111-0019-0019-0019-000000000019', 5200.00,  now()),
  ('11111111-0020-0020-0020-000000000020', 3300.00,  now()),
  ('22222222-0001-0001-0001-000000000001', 250.00,   now()),
  ('22222222-0002-0002-0002-000000000002', 500.00,   now()),
  ('22222222-0003-0003-0003-000000000003', 750.00,   now()),
  ('22222222-0004-0004-0004-000000000004', 320.00,   now()),
  ('22222222-0005-0005-0005-000000000005', 180.00,   now()),
  ('22222222-0006-0006-0006-000000000006', 420.00,   now())
ON CONFLICT (user_id) DO NOTHING;

-- ── 4. host_profiles ─────────────────────────────────────────────────────────
-- Ramesh is verified; others are pending or verified
INSERT INTO public.host_profiles (user_id, verification_status, id_doc_url, bank_upi, created_at, updated_at) VALUES
  ('11111111-0001-0001-0001-000000000001', 'verified', null, 'ramesh.verma@upi',    '2026-05-01T10:00:00Z', '2026-05-15T12:00:00Z'),
  ('11111111-0002-0002-0002-000000000002', 'verified', null, 'priya.sharma@upi',    '2026-06-01T09:00:00Z', '2026-06-10T12:00:00Z'),
  ('11111111-0003-0003-0003-000000000003', 'verified', null, 'suresh.kumar@upi',    '2026-07-10T08:00:00Z', '2026-07-20T12:00:00Z'),
  ('11111111-0004-0004-0004-000000000004', 'verified', null, 'ananya.iyer@upi',     '2026-08-01T10:00:00Z', '2026-08-12T12:00:00Z'),
  ('11111111-0005-0005-0005-000000000005', 'verified', null, 'vikram.patil@upi',    '2026-08-15T11:00:00Z', '2026-08-25T12:00:00Z'),
  ('11111111-0006-0006-0006-000000000006', 'verified', null, 'meera.nair@upi',      '2026-09-01T09:00:00Z', '2026-09-10T12:00:00Z'),
  ('11111111-0007-0007-0007-000000000007', 'verified', null, 'arjun.mehta@upi',     '2026-08-10T07:00:00Z', '2026-08-20T12:00:00Z'),
  ('11111111-0008-0008-0008-000000000008', 'verified', null, 'sneha.desai@upi',     '2026-07-25T08:00:00Z', '2026-08-05T12:00:00Z'),
  ('11111111-0009-0009-0009-000000000009', 'verified', null, 'ravi.krishnan@upi',   '2026-06-20T09:00:00Z', '2026-07-01T12:00:00Z'),
  ('11111111-0010-0010-0010-000000000010', 'verified', null, 'lakshmi.reddy@upi',   '2026-08-05T10:00:00Z', '2026-08-18T12:00:00Z'),
  ('11111111-0011-0011-0011-000000000011', 'pending',  null, null,                  '2026-09-10T08:00:00Z', '2026-09-10T08:00:00Z'),
  ('11111111-0012-0012-0012-000000000012', 'verified', null, 'preethi.gowda@upi',   '2026-08-22T07:30:00Z', '2026-09-02T12:00:00Z'),
  ('11111111-0013-0013-0013-000000000013', 'verified', null, 'sanjay.kulkarni@upi', '2026-07-15T09:00:00Z', '2026-07-28T12:00:00Z'),
  ('11111111-0014-0014-0014-000000000014', 'verified', null, 'nandini.rao@upi',     '2026-09-05T08:00:00Z', '2026-09-15T12:00:00Z'),
  ('11111111-0015-0015-0015-000000000015', 'pending',  null, null,                  '2026-08-30T10:00:00Z', '2026-08-30T10:00:00Z'),
  ('11111111-0016-0016-0016-000000000016', 'verified', null, 'divya.menon@upi',     '2026-07-01T09:00:00Z', '2026-07-12T12:00:00Z'),
  ('11111111-0017-0017-0017-000000000017', 'verified', null, 'mohit.kapoor@upi',    '2026-09-20T08:30:00Z', '2026-10-01T12:00:00Z'),
  ('11111111-0018-0018-0018-000000000018', 'verified', null, 'yasmin.shaikh@upi',   '2026-08-12T07:00:00Z', '2026-08-22T12:00:00Z'),
  ('11111111-0019-0019-0019-000000000019', 'verified', null, 'gopal.nambiar@upi',   '2026-06-28T09:00:00Z', '2026-07-10T12:00:00Z'),
  ('11111111-0020-0020-0020-000000000020', 'verified', null, 'rekha.pillai@upi',    '2026-07-08T10:00:00Z', '2026-07-20T12:00:00Z')
ON CONFLICT (user_id) DO NOTHING;

-- ── 5. charging_spots (20 spots) ─────────────────────────────────────────────
-- location column auto-set by trigger; but we explicitly compute for clarity.
INSERT INTO public.charging_spots (
  id, host_id, title, lat, lng, location,
  address, locality, city, power_kw, connector, price_per_kwh,
  photos, rules, available_from, available_to,
  is_online, rating, review_count, created_at, updated_at
) VALUES
  -- Bengaluru spots (10)
  ('aaaaaaaa-0001-0001-0001-000000000001', '11111111-0001-0001-0001-000000000001',
   'Ramesh''s Covered Driveway', 12.9784, 77.6408,
   ST_SetSRID(ST_MakePoint(77.6408, 12.9784), 4326)::geography,
   '12, 12th Cross, HAL 2nd Stage, Indiranagar', 'Indiranagar', 'Bengaluru',
   7.2, 'Type2', 12,
   ARRAY['https://images.unsplash.com/photo-1593941707882-a56f1f27b0b8?w=800'],
   'No parking after 22:00. Ring bell on arrival.', '07:00', '22:00',
   true, 4.9, 34, '2026-08-01T10:00:00Z', '2026-10-20T08:00:00Z'),

  ('aaaaaaaa-0002-0002-0002-000000000002', '11111111-0002-0002-0002-000000000002',
   'Priya''s EV Point', 12.9721, 77.6387,
   ST_SetSRID(ST_MakePoint(77.6387, 12.9721), 4326)::geography,
   '47, CMH Road, Indiranagar 1st Stage', 'Indiranagar', 'Bengaluru',
   3.3, '16A_socket', 10,
   ARRAY['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'],
   'Please charge your vehicle only. No overnight parking.', '06:00', '21:00',
   true, 4.6, 18, '2026-09-05T12:00:00Z', '2026-10-18T09:00:00Z'),

  ('aaaaaaaa-0003-0003-0003-000000000003', '11111111-0003-0003-0003-000000000003',
   'Suresh''s Shaded Driveway', 12.9352, 77.6245,
   ST_SetSRID(ST_MakePoint(77.6245, 12.9352), 4326)::geography,
   '14B, 4th Main Rd, Koramangala 4th Block', 'Koramangala', 'Bengaluru',
   7.2, 'CCS2', 14,
   ARRAY['https://images.unsplash.com/photo-1593941707882-a56f1f27b0b8?w=800'],
   'Gate code shared after booking. Covered parking available.', '08:00', '23:00',
   true, 4.8, 52, '2026-07-14T08:00:00Z', '2026-10-22T07:30:00Z'),

  ('aaaaaaaa-0004-0004-0004-000000000004', '11111111-0004-0004-0004-000000000004',
   'Ananya Apartments Charger', 12.9319, 77.6198,
   ST_SetSRID(ST_MakePoint(77.6198, 12.9319), 4326)::geography,
   '22, 80 Feet Rd, Koramangala 6th Block', 'Koramangala', 'Bengaluru',
   3.3, '3pin', 10, '{}', null, '09:00', '20:00',
   false, 4.2, 7, '2026-10-01T10:00:00Z', '2026-10-23T06:00:00Z'),

  ('aaaaaaaa-0005-0005-0005-000000000005', '11111111-0005-0005-0005-000000000005',
   'Vikram''s HSR Charger', 12.9116, 77.6389,
   ST_SetSRID(ST_MakePoint(77.6389, 12.9116), 4326)::geography,
   '18, 27th Main, HSR Layout Sector 2', 'HSR Layout', 'Bengaluru',
   7.2, 'CCS2', 13,
   ARRAY['https://images.unsplash.com/photo-1593941707882-a56f1f27b0b8?w=800'],
   'Car must fit in standard parking slot.', '07:00', '22:00',
   true, 4.5, 29, '2026-08-20T11:00:00Z', '2026-10-21T08:00:00Z'),

  ('aaaaaaaa-0006-0006-0006-000000000006', '11111111-0006-0006-0006-000000000006',
   'Meera''s Jayanagar Spot', 12.9253, 77.5929,
   ST_SetSRID(ST_MakePoint(77.5929, 12.9253), 4326)::geography,
   '3, 4th Block Jayanagar, 40th Cross', 'Jayanagar', 'Bengaluru',
   7.2, 'Type2', 12,
   ARRAY['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'],
   'Covered porch. Ring doorbell.', '06:00', '21:00',
   true, 4.7, 41, '2026-09-10T09:00:00Z', '2026-10-24T06:30:00Z'),

  ('aaaaaaaa-0007-0007-0007-000000000007', '11111111-0007-0007-0007-000000000007',
   'Arjun''s Whitefield Charger', 12.9698, 77.7499,
   ST_SetSRID(ST_MakePoint(77.7499, 12.9698), 4326)::geography,
   '7, ITPL Main Road, Whitefield', 'Whitefield', 'Bengaluru',
   7.2, 'CCS2', 15,
   ARRAY['https://images.unsplash.com/photo-1593941707882-a56f1f27b0b8?w=800'],
   'Visitor parking bay. Show booking confirmation.', '08:00', '22:00',
   true, 4.6, 22, '2026-08-10T07:00:00Z', '2026-10-20T09:00:00Z'),

  ('aaaaaaaa-0008-0008-0008-000000000008', '11111111-0008-0008-0008-000000000008',
   'Sneha''s Rajajinagar Point', 12.9912, 77.5557,
   ST_SetSRID(ST_MakePoint(77.5557, 12.9912), 4326)::geography,
   '45, Rajajinagar 3rd Block, Bengaluru', 'Rajajinagar', 'Bengaluru',
   3.3, '16A_socket', 10,
   '{}', 'No ICE vehicles.', '07:00', '20:00',
   true, 4.3, 15, '2026-07-25T08:00:00Z', '2026-10-19T08:00:00Z'),

  ('aaaaaaaa-0009-0009-0009-000000000009', '11111111-0009-0009-0009-000000000009',
   'Ravi''s JP Nagar Charger', 12.9063, 77.5857,
   ST_SetSRID(ST_MakePoint(77.5857, 12.9063), 4326)::geography,
   '8, JP Nagar 7th Phase', 'JP Nagar', 'Bengaluru',
   7.2, 'Type2', 11,
   ARRAY['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'],
   'Slot in basement car park B-12.', '07:00', '23:00',
   true, 4.4, 19, '2026-06-20T09:00:00Z', '2026-10-21T07:00:00Z'),

  ('aaaaaaaa-0010-0010-0010-000000000010', '11111111-0010-0010-0010-000000000010',
   'Lakshmi''s Electronic City Hub', 12.8455, 77.6603,
   ST_SetSRID(ST_MakePoint(77.6603, 12.8455), 4326)::geography,
   'Plot 21, Electronic City Phase 1', 'Electronic City', 'Bengaluru',
   7.2, 'CCS2', 13,
   ARRAY['https://images.unsplash.com/photo-1593941707882-a56f1f27b0b8?w=800'],
   'Corporate complex. Show booking at gate.', '06:00', '22:00',
   true, 4.8, 38, '2026-08-05T10:00:00Z', '2026-10-23T07:00:00Z'),

  -- Pune spots (10)
  ('aaaaaaaa-0011-0011-0011-000000000011', '11111111-0011-0011-0011-000000000011',
   'Deepak''s Kothrud Charger', 18.5048, 73.8219,
   ST_SetSRID(ST_MakePoint(73.8219, 18.5048), 4326)::geography,
   'Plot 8, Bhosale Nagar, Kothrud', 'Kothrud', 'Pune',
   7.2, 'Type2', 13,
   ARRAY['https://images.unsplash.com/photo-1593941707882-a56f1f27b0b8?w=800'],
   'Parking spot C-4 reserved. Vehicle must stay during charging.', '07:00', '22:00',
   true, 4.7, 23, '2026-08-20T11:00:00Z', '2026-10-21T08:00:00Z'),

  ('aaaaaaaa-0012-0012-0012-000000000012', '11111111-0012-0012-0012-000000000012',
   'Preethi''s Baner Green Charger', 18.5590, 73.7892,
   ST_SetSRID(ST_MakePoint(73.7892, 18.5590), 4326)::geography,
   '31, Baner Pashan Link Road, Baner', 'Baner', 'Pune',
   7.2, 'CCS2', 16,
   ARRAY['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'],
   'Only booked EVs. CCTV monitored. No ICE vehicles.', '06:00', '23:00',
   true, 5.0, 11, '2026-09-10T09:00:00Z', '2026-10-24T06:30:00Z'),

  ('aaaaaaaa-0013-0013-0013-000000000013', '11111111-0013-0013-0013-000000000013',
   'Sanjay''s Wakad Station', 18.5984, 73.7765,
   ST_SetSRID(ST_MakePoint(73.7765, 18.5984), 4326)::geography,
   'Panchshil Tech Park, Wakad', 'Wakad', 'Pune',
   7.2, 'Type2', 14,
   ARRAY['https://images.unsplash.com/photo-1593941707882-a56f1f27b0b8?w=800'],
   'Tech park visitor bay. Show digital booking.', '08:00', '21:00',
   true, 4.5, 27, '2026-07-15T09:00:00Z', '2026-10-22T07:30:00Z'),

  ('aaaaaaaa-0014-0014-0014-000000000014', '11111111-0014-0014-0014-000000000014',
   'Nandini''s Aundh EV Bay', 18.5603, 73.8080,
   ST_SetSRID(ST_MakePoint(73.8080, 18.5603), 4326)::geography,
   'D-5, Parihar Chowk, Aundh', 'Aundh', 'Pune',
   3.3, '3pin', 9,
   '{}', null, '07:00', '21:00',
   false, 4.0, 5, '2026-09-05T08:00:00Z', '2026-10-20T06:00:00Z'),

  ('aaaaaaaa-0015-0015-0015-000000000015', '11111111-0015-0015-0015-000000000015',
   'Kartik''s Hinjewadi Hub', 18.5904, 73.7276,
   ST_SetSRID(ST_MakePoint(73.7276, 18.5904), 4326)::geography,
   'Phase 2, Rajiv Gandhi Infotech Park, Hinjewadi', 'Hinjewadi', 'Pune',
   7.2, 'CCS2', 15,
   ARRAY['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'],
   'IT park entry. Security check required.', '07:00', '22:00',
   true, 4.6, 32, '2026-08-30T10:00:00Z', '2026-10-23T08:00:00Z'),

  ('aaaaaaaa-0016-0016-0016-000000000016', '11111111-0016-0016-0016-000000000016',
   'Divya''s Magarpatta Charger', 18.5163, 73.9280,
   ST_SetSRID(ST_MakePoint(73.9280, 18.5163), 4326)::geography,
   'Magarpatta Township, Hadapsar', 'Hadapsar', 'Pune',
   7.2, 'Type2', 12,
   ARRAY['https://images.unsplash.com/photo-1593941707882-a56f1f27b0b8?w=800'],
   'Level-2 parking slot. EV only zone.', '06:00', '22:00',
   true, 4.7, 45, '2026-07-01T09:00:00Z', '2026-10-24T07:00:00Z'),

  ('aaaaaaaa-0017-0017-0017-000000000017', '11111111-0017-0017-0017-000000000017',
   'Mohit''s Viman Nagar Spot', 18.5679, 73.9143,
   ST_SetSRID(ST_MakePoint(73.9143, 18.5679), 4326)::geography,
   '12, Samrat Ashok Path, Viman Nagar', 'Viman Nagar', 'Pune',
   7.2, 'CCS2', 14,
   ARRAY['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'],
   'Apartment complex. Ring intercom 204.', '07:00', '22:00',
   true, 4.5, 20, '2026-09-20T08:30:00Z', '2026-10-22T08:00:00Z'),

  ('aaaaaaaa-0018-0018-0018-000000000018', '11111111-0018-0018-0018-000000000018',
   'Yasmin''s Koregaon Park Charger', 18.5362, 73.8940,
   ST_SetSRID(ST_MakePoint(73.8940, 18.5362), 4326)::geography,
   'Lane 5, Koregaon Park, Pune', 'Koregaon Park', 'Pune',
   7.2, 'Type2', 13,
   ARRAY['https://images.unsplash.com/photo-1593941707882-a56f1f27b0b8?w=800'],
   'Premium residential spot. Confirm arrival.', '07:00', '22:00',
   true, 4.8, 16, '2026-08-12T07:00:00Z', '2026-10-21T07:30:00Z'),

  ('aaaaaaaa-0019-0019-0019-000000000019', '11111111-0019-0019-0019-000000000019',
   'Gopal''s Shivajinagar Charger', 18.5308, 73.8475,
   ST_SetSRID(ST_MakePoint(73.8475, 18.5308), 4326)::geography,
   '6, Deccan Gymkhana Rd, Shivajinagar', 'Shivajinagar', 'Pune',
   3.3, '16A_socket', 10,
   ARRAY['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'],
   'Street-level garage. OTP sent on booking.', '08:00', '20:00',
   true, 4.3, 12, '2026-06-28T09:00:00Z', '2026-10-20T09:00:00Z'),

  ('aaaaaaaa-0020-0020-0020-000000000020', '11111111-0020-0020-0020-000000000020',
   'Rekha''s Camp Road Charger', 18.5204, 73.8742,
   ST_SetSRID(ST_MakePoint(73.8742, 18.5204), 4326)::geography,
   '77, MG Road, Camp, Pune', 'Camp', 'Pune',
   7.2, 'CCS2', 14,
   ARRAY['https://images.unsplash.com/photo-1593941707882-a56f1f27b0b8?w=800'],
   'Commercial area spot. 2-hour max per booking.', '09:00', '21:00',
   true, 4.6, 28, '2026-07-08T10:00:00Z', '2026-10-23T09:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ── 6. vehicles ───────────────────────────────────────────────────────────────
INSERT INTO public.vehicles (id, owner_id, type, make, model, connector, battery_kwh, created_at, updated_at) VALUES
  -- Pooja's vehicles
  ('bbbbbbbb-0001-0001-0001-000000000001', '22222222-0001-0001-0001-000000000001',
   'car', 'Tata', 'Tiago EV', 'CCS2', 24, '2026-06-15T10:00:00Z', '2026-06-15T10:00:00Z'),
  ('bbbbbbbb-0002-0002-0002-000000000002', '22222222-0001-0001-0001-000000000001',
   'scooter', 'Ather', '450X Gen 3', '3pin', 2.9, '2026-09-01T08:00:00Z', '2026-09-01T08:00:00Z'),
  -- Aarav's vehicle
  ('bbbbbbbb-0003-0003-0003-000000000003', '22222222-0002-0002-0002-000000000002',
   'car', 'MG', 'Windsor EV', 'CCS2', 38, '2026-07-20T09:00:00Z', '2026-07-20T09:00:00Z'),
  -- Kavya's vehicle
  ('bbbbbbbb-0004-0004-0004-000000000004', '22222222-0003-0003-0003-000000000003',
   'car', 'Tata', 'Nexon EV Max', 'CCS2', 40.5, '2026-05-10T11:00:00Z', '2026-05-10T11:00:00Z'),
  -- Deepak's vehicle
  ('bbbbbbbb-0005-0005-0005-000000000005', '22222222-0004-0004-0004-000000000004',
   'car', 'Tata', 'Punch EV', 'CCS2', 35, '2026-06-15T08:00:00Z', '2026-06-15T08:00:00Z'),
  -- Sarita's vehicle
  ('bbbbbbbb-0006-0006-0006-000000000006', '22222222-0005-0005-0005-000000000005',
   'car', 'Tata', 'Nexon EV', 'CCS2', 30.2, '2026-07-05T09:00:00Z', '2026-07-05T09:00:00Z'),
  -- Ritika's vehicle
  ('bbbbbbbb-0007-0007-0007-000000000007', '22222222-0006-0006-0006-000000000006',
   'car', 'Tata', 'Tiago EV', 'CCS2', 24, '2026-08-18T10:00:00Z', '2026-08-18T10:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ── 7. bookings (30 bookings) ─────────────────────────────────────────────────
INSERT INTO public.bookings (
  id, rider_id, spot_id, vehicle_id, status, start_battery_pct,
  started_at, ended_at, kwh_used, amount_inr, gate_pin, created_at, updated_at
) VALUES
  -- Active session (Pooja at Ramesh's)
  ('cccccccc-0001-0001-0001-000000000001',
   '22222222-0001-0001-0001-000000000001', 'aaaaaaaa-0001-0001-0001-000000000001',
   'bbbbbbbb-0001-0001-0001-000000000001',
   'charging', 15, '2026-10-24T17:12:00Z', null, null, null, '7342',
   '2026-10-24T17:00:00Z', '2026-10-24T17:12:00Z'),

  -- Pooja completed bookings
  ('cccccccc-0002-0002-0002-000000000002',
   '22222222-0001-0001-0001-000000000001', 'aaaaaaaa-0003-0003-0003-000000000003',
   'bbbbbbbb-0001-0001-0001-000000000001',
   'completed', 22, '2026-10-21T14:05:00Z', '2026-10-21T15:38:00Z', 8.2, 73.8, '4891',
   '2026-10-21T14:00:00Z', '2026-10-21T15:40:00Z'),

  ('cccccccc-0003-0003-0003-000000000003',
   '22222222-0001-0001-0001-000000000001', 'aaaaaaaa-0011-0011-0011-000000000011',
   'bbbbbbbb-0001-0001-0001-000000000001',
   'completed', 10, '2026-10-18T09:30:00Z', '2026-10-18T11:55:00Z', 13.6, 122.4, '1023',
   '2026-10-18T09:25:00Z', '2026-10-18T11:57:00Z'),

  -- Incoming request to Ramesh's spot from Aarav
  ('cccccccc-0004-0004-0004-000000000004',
   '22222222-0002-0002-0002-000000000002', 'aaaaaaaa-0001-0001-0001-000000000001',
   'bbbbbbbb-0003-0003-0003-000000000003',
   'requested', 30, null, null, null, null, null,
   '2026-10-24T22:30:00Z', '2026-10-24T22:30:00Z'),

  -- Declined booking from Aarav
  ('cccccccc-0005-0005-0005-000000000005',
   '22222222-0002-0002-0002-000000000002', 'aaaaaaaa-0001-0001-0001-000000000001',
   'bbbbbbbb-0003-0003-0003-000000000003',
   'declined', 18, null, null, null, null, null,
   '2026-10-22T11:00:00Z', '2026-10-22T11:05:00Z'),

  -- Kavya at Ramesh's spot — earns revenue
  ('cccccccc-0006-0006-0006-000000000006',
   '22222222-0003-0003-0003-000000000003', 'aaaaaaaa-0001-0001-0001-000000000001',
   'bbbbbbbb-0004-0004-0004-000000000004',
   'completed', 8, '2026-10-24T10:00:00Z', '2026-10-24T12:30:00Z', 18.0, 216.0, '9911',
   '2026-10-24T09:55:00Z', '2026-10-24T12:32:00Z'),

  -- Deepak at Ramesh's spot
  ('cccccccc-0007-0007-0007-000000000007',
   '22222222-0004-0004-0004-000000000004', 'aaaaaaaa-0001-0001-0001-000000000001',
   'bbbbbbbb-0005-0005-0005-000000000005',
   'completed', 20, '2026-10-24T06:00:00Z', '2026-10-24T09:00:00Z', 13.0, 156.0, '3322',
   '2026-10-24T05:55:00Z', '2026-10-24T09:10:00Z'),

  -- Sarita at Ramesh's spot
  ('cccccccc-0008-0008-0008-000000000008',
   '22222222-0005-0005-0005-000000000005', 'aaaaaaaa-0001-0001-0001-000000000001',
   'bbbbbbbb-0006-0006-0006-000000000006',
   'completed', 12, '2026-10-20T07:00:00Z', '2026-10-20T08:35:00Z', 9.5, 114.0, '5518',
   '2026-10-20T06:55:00Z', '2026-10-20T08:40:00Z'),

  -- Ritika at Ramesh's spot
  ('cccccccc-0009-0009-0009-000000000009',
   '22222222-0006-0006-0006-000000000006', 'aaaaaaaa-0001-0001-0001-000000000001',
   'bbbbbbbb-0007-0007-0007-000000000007',
   'completed', 25, '2026-10-23T16:00:00Z', '2026-10-23T17:45:00Z', 10.0, 120.0, '7788',
   '2026-10-23T15:55:00Z', '2026-10-23T17:50:00Z'),

  -- Historical bookings Aug-Sep 2026 at various spots
  ('cccccccc-0010-0010-0010-000000000010',
   '22222222-0001-0001-0001-000000000001', 'aaaaaaaa-0002-0002-0002-000000000002',
   'bbbbbbbb-0001-0001-0001-000000000001',
   'completed', 30, '2026-09-15T10:00:00Z', '2026-09-15T13:00:00Z', 9.9, 99.0, '2211',
   '2026-09-15T09:55:00Z', '2026-09-15T13:05:00Z'),

  ('cccccccc-0011-0011-0011-000000000011',
   '22222222-0001-0001-0001-000000000001', 'aaaaaaaa-0006-0006-0006-000000000006',
   'bbbbbbbb-0001-0001-0001-000000000001',
   'completed', 18, '2026-09-05T08:00:00Z', '2026-09-05T10:30:00Z', 7.8, 93.6, '4455',
   '2026-09-05T07:55:00Z', '2026-09-05T10:35:00Z'),

  ('cccccccc-0012-0012-0012-000000000012',
   '22222222-0002-0002-0002-000000000002', 'aaaaaaaa-0005-0005-0005-000000000005',
   'bbbbbbbb-0003-0003-0003-000000000003',
   'completed', 5, '2026-08-28T14:00:00Z', '2026-08-28T17:00:00Z', 19.5, 253.5, '6677',
   '2026-08-28T13:55:00Z', '2026-08-28T17:05:00Z'),

  ('cccccccc-0013-0013-0013-000000000013',
   '22222222-0003-0003-0003-000000000003', 'aaaaaaaa-0007-0007-0007-000000000007',
   'bbbbbbbb-0004-0004-0004-000000000004',
   'completed', 10, '2026-08-20T09:00:00Z', '2026-08-20T12:00:00Z', 21.6, 324.0, '8899',
   '2026-08-20T08:55:00Z', '2026-08-20T12:05:00Z'),

  ('cccccccc-0014-0014-0014-000000000014',
   '22222222-0004-0004-0004-000000000004', 'aaaaaaaa-0012-0012-0012-000000000012',
   'bbbbbbbb-0005-0005-0005-000000000005',
   'completed', 15, '2026-09-20T10:00:00Z', '2026-09-20T13:30:00Z', 21.0, 336.0, '1133',
   '2026-09-20T09:55:00Z', '2026-09-20T13:35:00Z'),

  ('cccccccc-0015-0015-0015-000000000015',
   '22222222-0005-0005-0005-000000000005', 'aaaaaaaa-0009-0009-0009-000000000009',
   'bbbbbbbb-0006-0006-0006-000000000006',
   'completed', 20, '2026-08-10T07:30:00Z', '2026-08-10T10:30:00Z', 16.8, 184.8, '9944',
   '2026-08-10T07:25:00Z', '2026-08-10T10:35:00Z'),

  ('cccccccc-0016-0016-0016-000000000016',
   '22222222-0006-0006-0006-000000000006', 'aaaaaaaa-0013-0013-0013-000000000013',
   'bbbbbbbb-0007-0007-0007-000000000007',
   'completed', 8, '2026-08-25T13:00:00Z', '2026-08-25T16:30:00Z', 12.0, 168.0, '5566',
   '2026-08-25T12:55:00Z', '2026-08-25T16:35:00Z'),

  ('cccccccc-0017-0017-0017-000000000017',
   '22222222-0001-0001-0001-000000000001', 'aaaaaaaa-0015-0015-0015-000000000015',
   'bbbbbbbb-0001-0001-0001-000000000001',
   'completed', 22, '2026-09-01T09:00:00Z', '2026-09-01T11:30:00Z', 11.7, 175.5, '7722',
   '2026-09-01T08:55:00Z', '2026-09-01T11:35:00Z'),

  ('cccccccc-0018-0018-0018-000000000018',
   '22222222-0002-0002-0002-000000000002', 'aaaaaaaa-0016-0016-0016-000000000016',
   'bbbbbbbb-0003-0003-0003-000000000003',
   'completed', 12, '2026-09-12T10:00:00Z', '2026-09-12T13:00:00Z', 19.2, 230.4, '3344',
   '2026-09-12T09:55:00Z', '2026-09-12T13:05:00Z'),

  ('cccccccc-0019-0019-0019-000000000019',
   '22222222-0003-0003-0003-000000000003', 'aaaaaaaa-0018-0018-0018-000000000018',
   'bbbbbbbb-0004-0004-0004-000000000004',
   'completed', 7, '2026-08-05T14:00:00Z', '2026-08-05T17:00:00Z', 24.3, 315.9, '8811',
   '2026-08-05T13:55:00Z', '2026-08-05T17:05:00Z'),

  ('cccccccc-0020-0020-0020-000000000020',
   '22222222-0004-0004-0004-000000000004', 'aaaaaaaa-0010-0010-0010-000000000010',
   'bbbbbbbb-0005-0005-0005-000000000005',
   'completed', 18, '2026-08-18T08:00:00Z', '2026-08-18T11:00:00Z', 17.5, 227.5, '2288',
   '2026-08-18T07:55:00Z', '2026-08-18T11:05:00Z'),

  ('cccccccc-0021-0021-0021-000000000021',
   '22222222-0005-0005-0005-000000000005', 'aaaaaaaa-0019-0019-0019-000000000019',
   'bbbbbbbb-0006-0006-0006-000000000006',
   'completed', 25, '2026-09-18T09:00:00Z', '2026-09-18T11:30:00Z', 10.5, 105.0, '4411',
   '2026-09-18T08:55:00Z', '2026-09-18T11:35:00Z'),

  ('cccccccc-0022-0022-0022-000000000022',
   '22222222-0006-0006-0006-000000000006', 'aaaaaaaa-0008-0008-0008-000000000008',
   'bbbbbbbb-0007-0007-0007-000000000007',
   'completed', 15, '2026-08-30T07:00:00Z', '2026-08-30T09:30:00Z', 8.6, 86.0, '6622',
   '2026-08-30T06:55:00Z', '2026-08-30T09:35:00Z'),

  -- More historical August-September bookings
  ('cccccccc-0023-0023-0023-000000000023',
   '22222222-0001-0001-0001-000000000001', 'aaaaaaaa-0004-0004-0004-000000000004',
   'bbbbbbbb-0001-0001-0001-000000000001',
   'cancelled', 35, null, null, null, null, null,
   '2026-08-12T09:00:00Z', '2026-08-12T09:15:00Z'),

  ('cccccccc-0024-0024-0024-000000000024',
   '22222222-0002-0002-0002-000000000002', 'aaaaaaaa-0003-0003-0003-000000000003',
   'bbbbbbbb-0003-0003-0003-000000000003',
   'completed', 12, '2026-08-22T14:00:00Z', '2026-08-22T17:00:00Z', 19.8, 277.2, '3355',
   '2026-08-22T13:55:00Z', '2026-08-22T17:05:00Z'),

  ('cccccccc-0025-0025-0025-000000000025',
   '22222222-0003-0003-0003-000000000003', 'aaaaaaaa-0002-0002-0002-000000000002',
   'bbbbbbbb-0004-0004-0004-000000000004',
   'completed', 20, '2026-09-08T10:00:00Z', '2026-09-08T13:00:00Z', 12.1, 121.0, '7744',
   '2026-09-08T09:55:00Z', '2026-09-08T13:05:00Z'),

  ('cccccccc-0026-0026-0026-000000000026',
   '22222222-0004-0004-0004-000000000004', 'aaaaaaaa-0017-0017-0017-000000000017',
   'bbbbbbbb-0005-0005-0005-000000000005',
   'completed', 5, '2026-09-25T11:00:00Z', '2026-09-25T14:00:00Z', 21.0, 294.0, '9922',
   '2026-09-25T10:55:00Z', '2026-09-25T14:05:00Z'),

  ('cccccccc-0027-0027-0027-000000000027',
   '22222222-0005-0005-0005-000000000005', 'aaaaaaaa-0020-0020-0020-000000000020',
   'bbbbbbbb-0006-0006-0006-000000000006',
   'completed', 22, '2026-10-02T08:00:00Z', '2026-10-02T10:00:00Z', 8.4, 117.6, '1177',
   '2026-10-02T07:55:00Z', '2026-10-02T10:05:00Z'),

  ('cccccccc-0028-0028-0028-000000000028',
   '22222222-0006-0006-0006-000000000006', 'aaaaaaaa-0001-0001-0001-000000000001',
   'bbbbbbbb-0007-0007-0007-000000000007',
   'completed', 10, '2026-10-05T09:00:00Z', '2026-10-05T11:30:00Z', 10.8, 129.6, '4488',
   '2026-10-05T08:55:00Z', '2026-10-05T11:35:00Z'),

  ('cccccccc-0029-0029-0029-000000000029',
   '22222222-0001-0001-0001-000000000001', 'aaaaaaaa-0007-0007-0007-000000000007',
   'bbbbbbbb-0002-0002-0002-000000000002',
   'completed', 28, '2026-10-10T15:00:00Z', '2026-10-10T17:00:00Z', 1.5, 22.5, '5533',
   '2026-10-10T14:55:00Z', '2026-10-10T17:05:00Z'),

  ('cccccccc-0030-0030-0030-000000000030',
   '22222222-0002-0002-0002-000000000002', 'aaaaaaaa-0015-0015-0015-000000000015',
   'bbbbbbbb-0003-0003-0003-000000000003',
   'completed', 8, '2026-10-14T10:00:00Z', '2026-10-14T14:00:00Z', 25.3, 379.5, '6644',
   '2026-10-14T09:55:00Z', '2026-10-14T14:05:00Z')
ON CONFLICT (id) DO NOTHING;

-- ── 8. payments (for completed bookings) ─────────────────────────────────────
INSERT INTO public.payments (id, booking_id, amount_inr, platform_fee_inr, host_payout_inr, status, method, created_at, updated_at) VALUES
  ('dddddddd-0002-0002-0002-000000000002', 'cccccccc-0002-0002-0002-000000000002', 73.8,  3.69, 70.11,   'paid', 'upi',    '2026-10-21T15:45:00Z', '2026-10-21T15:46:00Z'),
  ('dddddddd-0003-0003-0003-000000000003', 'cccccccc-0003-0003-0003-000000000003', 122.4, 6.12, 116.28,  'paid', 'wallet', '2026-10-18T12:00:00Z', '2026-10-18T12:01:00Z'),
  ('dddddddd-0006-0006-0006-000000000006', 'cccccccc-0006-0006-0006-000000000006', 216.0, 10.80, 205.20, 'paid', 'upi',    '2026-10-24T12:35:00Z', '2026-10-24T12:36:00Z'),
  ('dddddddd-0007-0007-0007-000000000007', 'cccccccc-0007-0007-0007-000000000007', 156.0, 7.80,  148.20, 'paid', 'wallet', '2026-10-24T09:12:00Z', '2026-10-24T09:13:00Z'),
  ('dddddddd-0008-0008-0008-000000000008', 'cccccccc-0008-0008-0008-000000000008', 114.0, 5.70,  108.30, 'paid', 'upi',    '2026-10-20T08:42:00Z', '2026-10-20T08:43:00Z'),
  ('dddddddd-0009-0009-0009-000000000009', 'cccccccc-0009-0009-0009-000000000009', 120.0, 6.00,  114.00, 'paid', 'wallet', '2026-10-23T17:52:00Z', '2026-10-23T17:53:00Z'),
  ('dddddddd-0010-0010-0010-000000000010', 'cccccccc-0010-0010-0010-000000000010', 99.0,  4.95,  94.05,  'paid', 'upi',    '2026-09-15T13:07:00Z', '2026-09-15T13:08:00Z'),
  ('dddddddd-0011-0011-0011-000000000011', 'cccccccc-0011-0011-0011-000000000011', 93.6,  4.68,  88.92,  'paid', 'wallet', '2026-09-05T10:37:00Z', '2026-09-05T10:38:00Z'),
  ('dddddddd-0012-0012-0012-000000000012', 'cccccccc-0012-0012-0012-000000000012', 253.5, 12.68, 240.83, 'paid', 'upi',    '2026-08-28T17:07:00Z', '2026-08-28T17:08:00Z'),
  ('dddddddd-0013-0013-0013-000000000013', 'cccccccc-0013-0013-0013-000000000013', 324.0, 16.20, 307.80, 'paid', 'wallet', '2026-08-20T12:07:00Z', '2026-08-20T12:08:00Z'),
  ('dddddddd-0014-0014-0014-000000000014', 'cccccccc-0014-0014-0014-000000000014', 336.0, 16.80, 319.20, 'paid', 'upi',    '2026-09-20T13:37:00Z', '2026-09-20T13:38:00Z'),
  ('dddddddd-0015-0015-0015-000000000015', 'cccccccc-0015-0015-0015-000000000015', 184.8, 9.24,  175.56, 'paid', 'wallet', '2026-08-10T10:37:00Z', '2026-08-10T10:38:00Z'),
  ('dddddddd-0016-0016-0016-000000000016', 'cccccccc-0016-0016-0016-000000000016', 168.0, 8.40,  159.60, 'paid', 'upi',    '2026-08-25T16:37:00Z', '2026-08-25T16:38:00Z'),
  ('dddddddd-0017-0017-0017-000000000017', 'cccccccc-0017-0017-0017-000000000017', 175.5, 8.78,  166.73, 'paid', 'wallet', '2026-09-01T11:37:00Z', '2026-09-01T11:38:00Z'),
  ('dddddddd-0018-0018-0018-000000000018', 'cccccccc-0018-0018-0018-000000000018', 230.4, 11.52, 218.88, 'paid', 'upi',    '2026-09-12T13:07:00Z', '2026-09-12T13:08:00Z'),
  ('dddddddd-0019-0019-0019-000000000019', 'cccccccc-0019-0019-0019-000000000019', 315.9, 15.80, 300.11, 'paid', 'wallet', '2026-08-05T17:07:00Z', '2026-08-05T17:08:00Z'),
  ('dddddddd-0020-0020-0020-000000000020', 'cccccccc-0020-0020-0020-000000000020', 227.5, 11.38, 216.13, 'paid', 'upi',    '2026-08-18T11:07:00Z', '2026-08-18T11:08:00Z'),
  ('dddddddd-0021-0021-0021-000000000021', 'cccccccc-0021-0021-0021-000000000021', 105.0, 5.25,  99.75,  'paid', 'wallet', '2026-09-18T11:37:00Z', '2026-09-18T11:38:00Z'),
  ('dddddddd-0022-0022-0022-000000000022', 'cccccccc-0022-0022-0022-000000000022', 86.0,  4.30,  81.70,  'paid', 'upi',    '2026-08-30T09:37:00Z', '2026-08-30T09:38:00Z'),
  ('dddddddd-0024-0024-0024-000000000024', 'cccccccc-0024-0024-0024-000000000024', 277.2, 13.86, 263.34, 'paid', 'wallet', '2026-08-22T17:07:00Z', '2026-08-22T17:08:00Z'),
  ('dddddddd-0025-0025-0025-000000000025', 'cccccccc-0025-0025-0025-000000000025', 121.0, 6.05,  114.95, 'paid', 'upi',    '2026-09-08T13:07:00Z', '2026-09-08T13:08:00Z'),
  ('dddddddd-0026-0026-0026-000000000026', 'cccccccc-0026-0026-0026-000000000026', 294.0, 14.70, 279.30, 'paid', 'wallet', '2026-09-25T14:07:00Z', '2026-09-25T14:08:00Z'),
  ('dddddddd-0027-0027-0027-000000000027', 'cccccccc-0027-0027-0027-000000000027', 117.6, 5.88,  111.72, 'paid', 'upi',    '2026-10-02T10:07:00Z', '2026-10-02T10:08:00Z'),
  ('dddddddd-0028-0028-0028-000000000028', 'cccccccc-0028-0028-0028-000000000028', 129.6, 6.48,  123.12, 'paid', 'wallet', '2026-10-05T11:37:00Z', '2026-10-05T11:38:00Z'),
  ('dddddddd-0029-0029-0029-000000000029', 'cccccccc-0029-0029-0029-000000000029', 22.5,  1.13,  21.38,  'paid', 'upi',    '2026-10-10T17:07:00Z', '2026-10-10T17:08:00Z'),
  ('dddddddd-0030-0030-0030-000000000030', 'cccccccc-0030-0030-0030-000000000030', 379.5, 18.98, 360.53, 'paid', 'wallet', '2026-10-14T14:07:00Z', '2026-10-14T14:08:00Z')
ON CONFLICT (id) DO NOTHING;

-- ── 9. reviews (one per completed booking, matching lib/data/reviews.ts) ──────
INSERT INTO public.reviews (id, booking_id, rater_id, host_id, rating, comment, reply, created_at, updated_at) VALUES
  -- Review by Kavya for Ramesh (matches review-001 in mock)
  ('eeeeeeee-0001-0001-0001-000000000001',
   'cccccccc-0006-0006-0006-000000000006',
   '22222222-0003-0003-0003-000000000003',
   '11111111-0001-0001-0001-000000000001',
   5, 'Excellent spot! Gate code worked perfectly, charging was fast and the driveway is nicely shaded. Will come back!',
   'Thank you Kavya! Your EV is welcome anytime 🙏',
   '2026-10-24T13:00:00Z', '2026-10-24T14:00:00Z'),

  -- Review by Pooja for Suresh (matches review-002)
  ('eeeeeeee-0002-0002-0002-000000000002',
   'cccccccc-0002-0002-0002-000000000002',
   '22222222-0001-0001-0001-000000000001',
   '11111111-0003-0003-0003-000000000003',
   5, 'Suresh was very welcoming. CCS2 charger works great, gave full 7.2 kW. Perfect for a quick charge before the evening.',
   null,
   '2026-10-21T16:00:00Z', '2026-10-21T16:00:00Z'),

  -- Review by Pooja for Vikram/Kothrud spot (matches review-003)
  ('eeeeeeee-0003-0003-0003-000000000003',
   'cccccccc-0003-0003-0003-000000000003',
   '22222222-0001-0001-0001-000000000001',
   '11111111-0011-0011-0011-000000000011',
   4, 'Good experience overall. Spot was a little hard to find the first time but the host guided me on WhatsApp. Charger reliable.',
   'Sorry about the directions — I''ve added a landmark note to the listing now!',
   '2026-10-18T13:00:00Z', '2026-10-18T15:30:00Z'),

  -- Review by Deepak for Ramesh (matches review-004)
  ('eeeeeeee-0004-0004-0004-000000000004',
   'cccccccc-0007-0007-0007-000000000007',
   '22222222-0004-0004-0004-000000000004',
   '11111111-0001-0001-0001-000000000001',
   5, 'Ramesh bhai is the best! Very punctual, charger always online. Been using his spot for 3 months now.',
   'Always happy to host you Deepak! 😊',
   '2026-10-24T10:30:00Z', '2026-10-24T11:00:00Z'),

  -- Review by Sarita for Ramesh (matches review-005)
  ('eeeeeeee-0005-0005-0005-000000000005',
   'cccccccc-0008-0008-0008-000000000008',
   '22222222-0005-0005-0005-000000000005',
   '11111111-0001-0001-0001-000000000001',
   5, 'Great host. Spot exactly as described. Type 2 cable is long enough for my car easily.',
   null,
   '2026-10-20T09:00:00Z', '2026-10-20T09:00:00Z'),

  -- Additional reviews for realism
  ('eeeeeeee-0006-0006-0006-000000000006',
   'cccccccc-0009-0009-0009-000000000009',
   '22222222-0006-0006-0006-000000000006',
   '11111111-0001-0001-0001-000000000001',
   5, 'Ramesh''s spot is my go-to in Indiranagar. Always clean and the charging is super reliable.',
   'Thank you Ritika! See you next time 🙏',
   '2026-10-23T18:30:00Z', '2026-10-23T19:00:00Z'),

  ('eeeeeeee-0007-0007-0007-000000000007',
   'cccccccc-0010-0010-0010-000000000010',
   '22222222-0001-0001-0001-000000000001',
   '11111111-0002-0002-0002-000000000002',
   4, 'Priya''s spot is conveniently located on CMH Road. 16A socket works fine for overnight slow charge.',
   null,
   '2026-09-15T14:00:00Z', '2026-09-15T14:00:00Z'),

  ('eeeeeeee-0008-0008-0008-000000000008',
   'cccccccc-0011-0011-0011-000000000011',
   '22222222-0001-0001-0001-000000000001',
   '11111111-0006-0006-0006-000000000006',
   5, 'Meera''s Jayanagar spot is immaculate. Great covered parking, charge was smooth and fast.',
   'Thank you! You''re always welcome here 😊',
   '2026-09-05T11:30:00Z', '2026-09-05T12:00:00Z'),

  ('eeeeeeee-0009-0009-0009-000000000009',
   'cccccccc-0012-0012-0012-000000000012',
   '22222222-0002-0002-0002-000000000002',
   '11111111-0005-0005-0005-000000000005',
   5, 'Vikram''s HSR spot is the best in the area. Dedicated EV bay, proper CCS2 charger.',
   'Glad to serve Bengaluru EV community!',
   '2026-08-28T18:00:00Z', '2026-08-28T18:30:00Z'),

  ('eeeeeeee-0010-0010-0010-000000000010',
   'cccccccc-0013-0013-0013-000000000013',
   '22222222-0003-0003-0003-000000000003',
   '11111111-0007-0007-0007-000000000007',
   4, 'Arjun''s Whitefield spot is easy to access from ITPL. The parking bay is well marked.',
   null,
   '2026-08-20T13:30:00Z', '2026-08-20T13:30:00Z'),

  ('eeeeeeee-0011-0011-0011-000000000011',
   'cccccccc-0014-0014-0014-000000000014',
   '22222222-0004-0004-0004-000000000004',
   '11111111-0012-0012-0012-000000000012',
   5, 'Preethi''s Baner spot — flawless. CCS2 charger at full 7.2 kW. Worth every rupee.',
   'Thank you! CCTV keeps your car safe too 😊',
   '2026-09-20T14:30:00Z', '2026-09-20T15:00:00Z'),

  ('eeeeeeee-0012-0012-0012-000000000012',
   'cccccccc-0015-0015-0015-000000000015',
   '22222222-0005-0005-0005-000000000005',
   '11111111-0009-0009-0009-000000000009',
   4, 'Ravi''s JP Nagar basement spot — solid. A bit dark but safe and the charger works perfectly.',
   'I''ll add better lighting soon!',
   '2026-08-10T11:30:00Z', '2026-08-10T12:00:00Z'),

  ('eeeeeeee-0013-0013-0013-000000000013',
   'cccccccc-0016-0016-0016-000000000016',
   '22222222-0006-0006-0006-000000000006',
   '11111111-0013-0013-0013-000000000013',
   5, 'Sanjay''s Wakad spot at the tech park is super convenient for IT workers. Top notch.',
   null,
   '2026-08-25T17:30:00Z', '2026-08-25T17:30:00Z'),

  ('eeeeeeee-0014-0014-0014-000000000014',
   'cccccccc-0017-0017-0017-000000000017',
   '22222222-0001-0001-0001-000000000001',
   '11111111-0015-0015-0015-000000000015',
   5, 'Kartik''s Hinjewadi spot is perfect for IT professionals. Fast, reliable, great service.',
   'Thanks Pooja! See you again soon.',
   '2026-09-01T12:30:00Z', '2026-09-01T13:00:00Z'),

  ('eeeeeeee-0015-0015-0015-000000000015',
   'cccccccc-0018-0018-0018-000000000018',
   '22222222-0002-0002-0002-000000000002',
   '11111111-0016-0016-0016-000000000016',
   4, 'Divya''s Magarpatta spot is in a great township. Charging is reliable.',
   null,
   '2026-09-12T14:30:00Z', '2026-09-12T14:30:00Z'),

  ('eeeeeeee-0016-0016-0016-000000000016',
   'cccccccc-0019-0019-0019-000000000019',
   '22222222-0003-0003-0003-000000000003',
   '11111111-0018-0018-0018-000000000018',
   5, 'Yasmin''s Koregaon Park spot is premium! Clean driveway, fast charge, very professional.',
   'Luxury EV charging experience — that''s what we aim for! 🙏',
   '2026-08-05T18:00:00Z', '2026-08-05T18:30:00Z'),

  ('eeeeeeee-0017-0017-0017-000000000017',
   'cccccccc-0020-0020-0020-000000000020',
   '22222222-0004-0004-0004-000000000004',
   '11111111-0010-0010-0010-000000000010',
   5, 'Lakshmi''s Electronic City spot is a lifesaver for south Bengaluru commuters. Great setup.',
   null,
   '2026-08-18T12:30:00Z', '2026-08-18T12:30:00Z'),

  ('eeeeeeee-0018-0018-0018-000000000018',
   'cccccccc-0021-0021-0021-000000000021',
   '22222222-0005-0005-0005-000000000005',
   '11111111-0019-0019-0019-000000000019',
   4, 'Gopal''s Shivajinagar spot — decent, slightly hard to locate. Charger works fine.',
   'Sorry about the directions! I''ve pinned the exact gate now.',
   '2026-09-18T12:30:00Z', '2026-09-18T13:00:00Z'),

  ('eeeeeeee-0019-0019-0019-000000000019',
   'cccccccc-0022-0022-0022-000000000022',
   '22222222-0006-0006-0006-000000000006',
   '11111111-0008-0008-0008-000000000008',
   4, 'Sneha''s Rajajinagar spot is clean and easy to find. Slow charger but great for overnight.',
   null,
   '2026-08-30T10:30:00Z', '2026-08-30T10:30:00Z'),

  ('eeeeeeee-0020-0020-0020-000000000020',
   'cccccccc-0024-0024-0024-000000000024',
   '22222222-0002-0002-0002-000000000002',
   '11111111-0003-0003-0003-000000000003',
   5, 'Suresh''s Koramangala spot is unbeatable. CCS2 at full speed, shaded parking, very reliable.',
   'Always a pleasure! 🙏',
   '2026-08-22T18:00:00Z', '2026-08-22T18:30:00Z'),

  ('eeeeeeee-0021-0021-0021-000000000021',
   'cccccccc-0025-0025-0025-000000000025',
   '22222222-0003-0003-0003-000000000003',
   '11111111-0002-0002-0002-000000000002',
   4, 'Priya''s spot works well. 16A socket is slower but the location is very convenient.',
   null,
   '2026-09-08T14:30:00Z', '2026-09-08T14:30:00Z'),

  ('eeeeeeee-0022-0022-0022-000000000022',
   'cccccccc-0026-0026-0026-000000000026',
   '22222222-0004-0004-0004-000000000004',
   '11111111-0017-0017-0017-000000000017',
   5, 'Mohit''s Viman Nagar spot is excellent — modern apartment complex, fast charging.',
   'Thank you! Come back anytime.',
   '2026-09-25T15:30:00Z', '2026-09-25T16:00:00Z'),

  ('eeeeeeee-0023-0023-0023-000000000023',
   'cccccccc-0027-0027-0027-000000000027',
   '22222222-0005-0005-0005-000000000005',
   '11111111-0020-0020-0020-000000000020',
   5, 'Rekha''s Camp Road spot is great for when I''m in Pune cantonment area. Highly recommend.',
   null,
   '2026-10-02T11:30:00Z', '2026-10-02T11:30:00Z'),

  ('eeeeeeee-0024-0024-0024-000000000024',
   'cccccccc-0028-0028-0028-000000000028',
   '22222222-0006-0006-0006-000000000006',
   '11111111-0001-0001-0001-000000000001',
   5, 'Ramesh is the OG of ChargeMate in Indiranagar. Never had a bad experience. 5 stars forever!',
   'Thank you Ritika! You are one of our most loyal riders 🙏',
   '2026-10-05T12:30:00Z', '2026-10-05T13:00:00Z'),

  ('eeeeeeee-0025-0025-0025-000000000025',
   'cccccccc-0029-0029-0029-000000000029',
   '22222222-0001-0001-0001-000000000001',
   '11111111-0007-0007-0007-000000000007',
   4, 'Arjun''s Whitefield spot was good. The Ather doesn''t need much power so it was perfect.',
   null,
   '2026-10-10T18:00:00Z', '2026-10-10T18:00:00Z'),

  ('eeeeeeee-0026-0026-0026-000000000026',
   'cccccccc-0030-0030-0030-000000000030',
   '22222222-0002-0002-0002-000000000002',
   '11111111-0015-0015-0015-000000000015',
   5, 'Kartik''s Hinjewadi spot is the best option if you work at the IT park. Very smooth experience.',
   'Thank you Aarav! Great to hear it!',
   '2026-10-14T15:30:00Z', '2026-10-14T16:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ── Re-enable triggers ────────────────────────────────────────────────────────
SET session_replication_role = DEFAULT;

-- Recompute all spot ratings from the seeded reviews
DO $$
DECLARE
  r RECORD;
  v_spot_id uuid;
BEGIN
  FOR r IN SELECT DISTINCT booking_id FROM public.reviews LOOP
    SELECT b.spot_id INTO v_spot_id
    FROM public.bookings b WHERE b.id = r.booking_id;

    IF v_spot_id IS NOT NULL THEN
      UPDATE public.charging_spots
      SET
        rating = COALESCE((
          SELECT ROUND(AVG(rv.rating)::numeric, 1)
          FROM public.reviews rv
          JOIN public.bookings bk ON bk.id = rv.booking_id
          WHERE bk.spot_id = v_spot_id
        ), 0),
        review_count = (
          SELECT COUNT(*)::integer
          FROM public.reviews rv
          JOIN public.bookings bk ON bk.id = rv.booking_id
          WHERE bk.spot_id = v_spot_id
        )
      WHERE id = v_spot_id;
    END IF;
  END LOOP;
END $$;
