-- ==============================================================================
-- HAXR Core — Baby Aylla Gift Registry — Phase C.3.2-A / Gate A.2
-- SYNTHETIC FIXTURES SCRIPT (ISOLATED STAGING ENVIRONMENT ONLY)
-- ==============================================================================
-- Target Environment: Neon PostgreSQL (Branch aylla-gifts-c3-staging)
-- Database: neondb
-- Target Project ID: gentle-firefly-70094226 (HAXR-Signature-Preview-Portfolio)
-- Business: haxr-canary-lab (HAXR CANARY TESTS ONLY)
--
-- STRICT DATA GOVERNANCE & ZERO PRODUCTION EXPOSURE:
-- 1. All data inserted by this script is 100% synthetic mock data.
-- 2. ZERO production data, ZERO real PII, ZERO real phone numbers.
-- 3. Prepares canonical UUIDs required by Core and Edition codebase.
-- 4. Idempotent: safe to run multiple times.
-- ==============================================================================

BEGIN;

-- 1. Ensure Canary Business Exists
INSERT INTO public.businesses (id, name, created_at, updated_at)
VALUES (
  'haxr-canary-lab',
  'HAXR CANARY TESTS ONLY',
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE
SET updated_at = now();

-- 1.5. Disambiguate Pre-existing Canary Event to Prevent edition_registry_key Collisions
-- Existing Canary Event: cc608a8d-3cb9-47f0-955d-8d1be3f30faf
-- Had edition_registry_key = 'baby-aylla-couture'.
-- Rebind it to 'baby-aylla-couture-canary-archive' so that queries for 'baby-aylla-couture'
-- resolve strictly and deterministically to canonical event a0f6b5a9-4d8c-4501-81b6-52929fa9da38.
UPDATE public.events
SET edition_registry_key = 'baby-aylla-couture-canary-archive',
    updated_at = now()
WHERE id = 'cc608a8d-3cb9-47f0-955d-8d1be3f30faf'::uuid
  AND edition_registry_key = 'baby-aylla-couture';

-- 2. Canonical Baby Aylla Event Fixture
-- ID matches AYLLA_GIFTS_CONFIG.eventId: a0f6b5a9-4d8c-4501-81b6-52929fa9da38
-- registry_key matches AYLLA_GIFTS_CONFIG.registryKey: baby-aylla-couture
INSERT INTO public.events (
  id,
  business_id,
  name,
  type,
  date,
  location,
  notes,
  is_active,
  edition_registry_key,
  find_seat_code,
  created_at,
  updated_at
)
VALUES (
  'a0f6b5a9-4d8c-4501-81b6-52929fa9da38'::uuid,
  'haxr-canary-lab',
  'Baby Aylla — Édition Rose (Staging Synthetic)',
  'baby_shower'::event_type,
  '2026-12-12'::date,
  'Laboratório Staging Neon HAXR',
  'Synthetic staging fixture for Baby Aylla Gift Registry Phase C.3.2 validation.',
  true,
  'baby-aylla-couture',
  'HXR-A0F6B5A94D8C450181B65292',
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active,
  edition_registry_key = EXCLUDED.edition_registry_key,
  updated_at = now();

-- 3. Synthetic Eligible Guest Fixture (Confirmed RSVP via edition_rsvp)
-- ID: f47ac10b-58cc-4372-a567-0e02b2c3d479
-- Status: confirmed, Source: edition_rsvp, archived_at: NULL, deleted_at: NULL, is_incorrect: false
INSERT INTO public.guests (
  id,
  event_id,
  name,
  email,
  phone,
  client_type,
  seat_id,
  qr_token,
  status,
  plus_ones,
  dietary_notes,
  guest_notes,
  label,
  guest_source,
  name_normalized,
  archived_at,
  deleted_at,
  is_incorrect,
  created_at,
  updated_at
)
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
  'a0f6b5a9-4d8c-4501-81b6-52929fa9da38'::uuid,
  'Convidado Homologação Aylla (Sintético)',
  'staging-guest-aylla@haxrsignature.test',
  '+258840000001',
  'individual'::client_type,
  NULL,
  'haxr_aylla_staging_qr_token_f47ac10b',
  'confirmed'::guest_status,
  0,
  'Nenhuma restrição',
  'Synthetic fixture for guest identity & reservation RPC testing.',
  'vip'::guest_label,
  'edition_rsvp'::guest_source,
  'convidado homologacao aylla sintetico',
  NULL,
  NULL,
  false,
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE
SET
  status = EXCLUDED.status,
  guest_source = EXCLUDED.guest_source,
  phone = EXCLUDED.phone,
  archived_at = NULL,
  deleted_at = NULL,
  is_incorrect = false,
  updated_at = now();

-- 4. Synthetic Ineligible Guest Fixture (Declined RSVP - Negative Testing Control)
-- ID: e2b1c3d4-5e6f-7a8b-9c0d-1e2f3a4b5c6d
INSERT INTO public.guests (
  id,
  event_id,
  name,
  email,
  phone,
  client_type,
  seat_id,
  qr_token,
  status,
  plus_ones,
  dietary_notes,
  guest_notes,
  label,
  guest_source,
  name_normalized,
  archived_at,
  deleted_at,
  is_incorrect,
  created_at,
  updated_at
)
VALUES (
  'e2b1c3d4-5e6f-7a8b-9c0d-1e2f3a4b5c6d'::uuid,
  'a0f6b5a9-4d8c-4501-81b6-52929fa9da38'::uuid,
  'Convidado Recusado Aylla (Controlo Negativo Sintético)',
  'declined-guest-aylla@haxrsignature.test',
  '+258840000002',
  'individual'::client_type,
  NULL,
  'haxr_aylla_staging_qr_token_e2b1c3d4',
  'declined'::guest_status,
  0,
  '',
  'Negative control fixture - must be rejected by reservation RPC.',
  'none'::guest_label,
  'edition_rsvp'::guest_source,
  'convidado recusado aylla controlo negativo sintetico',
  NULL,
  NULL,
  false,
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE
SET
  status = 'declined'::guest_status,
  updated_at = now();

COMMIT;
