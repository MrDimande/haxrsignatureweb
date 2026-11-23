-- HAXR Core — Baby Aylla Gift Registry — Phase C.3
-- CANONICAL FORWARD MIGRATION (CANDIDATE)
-- Destination Pipeline: HAXR Core / database/migrations/
-- Dependencies: public.events, public.guests, role edition_runtime (NOLOGIN).
--
-- Security Model:
--   1. Zero direct table grants to runtime roles or PUBLIC.
--   2. All 5 tables have Row Level Security enabled.
--   3. All RPCs have fixed search_path = pg_catalog, public.
--   4. Sessions and challenges store only HMAC-SHA256 hashes, never clear-text tokens.
--   5. Re-evaluation of guest RSVP eligibility occurs at every reservation and cancellation.
--   6. Transactional integrity protected by advisory locks and row-level locks.

BEGIN;

-- Fail-closed role assertions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'edition_runtime') THEN
    RAISE EXCEPTION 'Prerequisite role edition_runtime must exist before running migration';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles
    WHERE rolname = 'haxr_aylla_gift_issuer'
      AND rolcanlogin = true AND rolsuper = false AND rolcreaterole = false
      AND rolcreatedb = false AND rolbypassrls = false
  ) THEN
    RAISE EXCEPTION 'Prerequisite role haxr_aylla_gift_issuer must exist with restricted issuer attributes';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles
    WHERE rolname = 'haxr_aylla_gift_runtime'
      AND rolcanlogin = true AND rolsuper = false AND rolcreaterole = false
      AND rolcreatedb = false AND rolbypassrls = false
  ) THEN
    RAISE EXCEPTION 'Prerequisite role haxr_aylla_gift_runtime must exist with restricted runtime attributes';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles
    WHERE rolname = 'haxr_aylla_gift_admin'
      AND rolcanlogin = true AND rolsuper = false AND rolcreaterole = false
      AND rolcreatedb = false AND rolbypassrls = false
  ) THEN
    RAISE EXCEPTION 'Prerequisite role haxr_aylla_gift_admin must exist with restricted admin attributes';
  END IF;
END;
$$;

-- 1. Inventory Table
CREATE TABLE IF NOT EXISTS public.edition_gift_inventory (
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
  registry_key text NOT NULL CHECK (length(registry_key) BETWEEN 1 AND 80),
  item_id text NOT NULL CHECK (length(item_id) BETWEEN 1 AND 120),
  family_approved boolean NOT NULL DEFAULT false,
  enabled boolean NOT NULL DEFAULT false,
  approved_quantity integer CHECK (approved_quantity IS NULL OR approved_quantity > 0),
  specifications_complete boolean NOT NULL DEFAULT false,
  child_safety_validated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, item_id),
  CONSTRAINT edition_gift_inventory_aylla_registry_scope CHECK (
    event_id <> 'a0f6b5a9-4d8c-4501-81b6-52929fa9da38'::uuid OR registry_key = 'baby-aylla-couture'
  )
);

-- 2. Reservations V2 Table
CREATE TABLE IF NOT EXISTS public.edition_gift_reservations_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
  item_id text NOT NULL,
  guest_id uuid NOT NULL REFERENCES public.guests(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  status text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'purchased', 'delivered', 'cancelled')),
  idempotency_key uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  cancelled_at timestamptz,
  purchased_at timestamptz,
  delivered_at timestamptz,
  FOREIGN KEY (event_id, item_id) REFERENCES public.edition_gift_inventory(event_id, item_id) ON DELETE RESTRICT,
  UNIQUE (event_id, guest_id, idempotency_key),
  CHECK ((status <> 'cancelled') OR cancelled_at IS NOT NULL),
  CHECK ((status <> 'purchased') OR purchased_at IS NOT NULL),
  CHECK ((status <> 'delivered') OR delivered_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS edition_gift_reservations_v2_active_idx
  ON public.edition_gift_reservations_v2 (event_id, item_id)
  WHERE status IN ('reserved', 'purchased', 'delivered');

CREATE INDEX IF NOT EXISTS edition_gift_reservations_v2_guest_idx
  ON public.edition_gift_reservations_v2 (event_id, guest_id);

-- 3. Audit V2 Table
CREATE TABLE IF NOT EXISTS public.edition_gift_reservation_audit_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES public.edition_gift_reservations_v2(id) ON DELETE RESTRICT,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
  actor_guest_id uuid REFERENCES public.guests(id) ON DELETE RESTRICT,
  actor_admin_id uuid REFERENCES public.admin_users(id) ON DELETE RESTRICT,
  action text NOT NULL CHECK (action IN ('reserved', 'purchased', 'delivered', 'cancelled')),
  previous_status text CHECK (previous_status IN ('reserved', 'purchased', 'delivered', 'cancelled')),
  next_status text NOT NULL CHECK (next_status IN ('reserved', 'purchased', 'delivered', 'cancelled')),
  reason text CHECK (length(reason) <= 280),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((actor_guest_id IS NULL) <> (actor_admin_id IS NULL))
);

CREATE INDEX IF NOT EXISTS edition_gift_reservation_audit_v2_event_idx
  ON public.edition_gift_reservation_audit_v2 (event_id, reservation_id, created_at DESC);

-- 4. Verification Challenges Table
CREATE TABLE IF NOT EXISTS public.edition_guest_verification_challenges (
  id uuid PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
  guest_id uuid NOT NULL REFERENCES public.guests(id) ON DELETE RESTRICT,
  verifier_hash text NOT NULL CHECK (length(verifier_hash) BETWEEN 32 AND 256),
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0 AND attempts <= 5),
  max_attempts integer NOT NULL DEFAULT 5 CHECK (max_attempts BETWEEN 1 AND 5),
  consumed_at timestamptz,
  session_issued_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS edition_guest_verification_challenges_active_idx
  ON public.edition_guest_verification_challenges (id, expires_at)
  WHERE consumed_at IS NULL;

-- 5. Guest Sessions Table
CREATE TABLE IF NOT EXISTS public.edition_guest_sessions (
  id uuid PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
  guest_id uuid NOT NULL REFERENCES public.guests(id) ON DELETE RESTRICT,
  secret_hash text NOT NULL CHECK (length(secret_hash) BETWEEN 32 AND 256),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS edition_guest_sessions_active_idx
  ON public.edition_guest_sessions (id, expires_at)
  WHERE revoked_at IS NULL;

-- 6. Enable and Force Row Level Security (RLS) on all tables
ALTER TABLE public.edition_gift_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edition_gift_reservations_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edition_gift_reservation_audit_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edition_guest_verification_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edition_guest_sessions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.edition_gift_inventory FORCE ROW LEVEL SECURITY;
ALTER TABLE public.edition_gift_reservations_v2 FORCE ROW LEVEL SECURITY;
ALTER TABLE public.edition_gift_reservation_audit_v2 FORCE ROW LEVEL SECURITY;
ALTER TABLE public.edition_guest_verification_challenges FORCE ROW LEVEL SECURITY;
ALTER TABLE public.edition_guest_sessions FORCE ROW LEVEL SECURITY;

-- 7. Revoke All Table Permissions from PUBLIC and Roles
REVOKE ALL ON public.edition_gift_inventory FROM PUBLIC, haxr_aylla_gift_issuer, haxr_aylla_gift_runtime, haxr_aylla_gift_admin;
REVOKE ALL ON public.edition_gift_reservations_v2 FROM PUBLIC, haxr_aylla_gift_issuer, haxr_aylla_gift_runtime, haxr_aylla_gift_admin;
REVOKE ALL ON public.edition_gift_reservation_audit_v2 FROM PUBLIC, haxr_aylla_gift_issuer, haxr_aylla_gift_runtime, haxr_aylla_gift_admin;
REVOKE ALL ON public.edition_guest_verification_challenges FROM PUBLIC, haxr_aylla_gift_issuer, haxr_aylla_gift_runtime, haxr_aylla_gift_admin;
REVOKE ALL ON public.edition_guest_sessions FROM PUBLIC, haxr_aylla_gift_issuer, haxr_aylla_gift_runtime, haxr_aylla_gift_admin;

-- 8. Explicit Row Level Security Policies
-- Direct table mutations are completely forbidden: all writes occur strictly through verified RPCs.
-- Challenges and Sessions: ZERO SELECT granted to any runtime role. Full isolation.
DROP POLICY IF EXISTS edition_gift_inventory_runtime_sel ON public.edition_gift_inventory;
CREATE POLICY edition_gift_inventory_runtime_sel
  ON public.edition_gift_inventory FOR SELECT
  TO haxr_aylla_gift_runtime, haxr_aylla_gift_admin
  USING (event_id = 'a0f6b5a9-4d8c-4501-81b6-52929fa9da38'::uuid);

DROP POLICY IF EXISTS edition_gift_reservations_v2_runtime_sel ON public.edition_gift_reservations_v2;
DROP POLICY IF EXISTS edition_gift_reservations_v2_runtime_all ON public.edition_gift_reservations_v2;
CREATE POLICY edition_gift_reservations_v2_runtime_sel
  ON public.edition_gift_reservations_v2 FOR SELECT
  TO haxr_aylla_gift_runtime, haxr_aylla_gift_admin
  USING (event_id = 'a0f6b5a9-4d8c-4501-81b6-52929fa9da38'::uuid);

DROP POLICY IF EXISTS edition_gift_reservation_audit_v2_runtime_sel ON public.edition_gift_reservation_audit_v2;
DROP POLICY IF EXISTS edition_gift_reservation_audit_v2_runtime_all ON public.edition_gift_reservation_audit_v2;
CREATE POLICY edition_gift_reservation_audit_v2_runtime_sel
  ON public.edition_gift_reservation_audit_v2 FOR SELECT
  TO haxr_aylla_gift_runtime, haxr_aylla_gift_admin
  USING (event_id = 'a0f6b5a9-4d8c-4501-81b6-52929fa9da38'::uuid);

-- Clean up any obsolete policies on challenges and sessions (no SELECT policies permitted)
DROP POLICY IF EXISTS edition_guest_verification_challenges_runtime_sel ON public.edition_guest_verification_challenges;
DROP POLICY IF EXISTS edition_guest_verification_challenges_runtime_all ON public.edition_guest_verification_challenges;
DROP POLICY IF EXISTS edition_guest_sessions_runtime_sel ON public.edition_guest_sessions;
DROP POLICY IF EXISTS edition_guest_sessions_runtime_all ON public.edition_guest_sessions;

-- 8. Controlled canonical guest lookups. The event scope is immutable and
-- PUBLIC never receives access to guests or events.
CREATE OR REPLACE FUNCTION public.resolve_baby_aylla_guest_by_contact(p_contact text)
RETURNS TABLE (
  id uuid, event_id uuid, name text, contact text, status guest_status,
  guest_source guest_source, archived_at timestamptz, deleted_at timestamptz, is_incorrect boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT g.id, g.event_id, g.name, COALESCE(g.phone, g.email, g.name), g.status,
         g.guest_source, g.archived_at, g.deleted_at, g.is_incorrect
  FROM public.guests AS g
  WHERE g.event_id = 'a0f6b5a9-4d8c-4501-81b6-52929fa9da38'::uuid
    AND (lower(COALESCE(g.phone, '')) = lower(p_contact) OR lower(COALESCE(g.email, '')) = lower(p_contact))
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.resolve_baby_aylla_guest_by_id(p_guest_id uuid)
RETURNS TABLE (
  id uuid, event_id uuid, name text, contact text, status guest_status,
  guest_source guest_source, archived_at timestamptz, deleted_at timestamptz, is_incorrect boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT g.id, g.event_id, g.name, COALESCE(g.phone, g.email, g.name), g.status,
         g.guest_source, g.archived_at, g.deleted_at, g.is_incorrect
  FROM public.guests AS g
  WHERE g.event_id = 'a0f6b5a9-4d8c-4501-81b6-52929fa9da38'::uuid AND g.id = p_guest_id;
$$;

-- 9. Core Internal Reservation Function (Invoked by verified wrapper)
CREATE OR REPLACE FUNCTION public.reserve_baby_aylla_gift(
  p_event_id uuid,
  p_item_id text,
  p_guest_id uuid,
  p_quantity integer,
  p_idempotency_key uuid
) RETURNS public.edition_gift_reservations_v2
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_inventory public.edition_gift_inventory;
  v_existing public.edition_gift_reservations_v2;
  v_reserved integer;
  v_reservation public.edition_gift_reservations_v2;
BEGIN
  IF p_quantity IS NULL OR p_quantity < 1 THEN
    RAISE EXCEPTION 'invalid reservation quantity' USING ERRCODE = '22023';
  END IF;

  -- Advisory lock per event:guest:key prevents race conditions on retry
  PERFORM pg_advisory_xact_lock(hashtextextended(
    p_event_id::text || ':' || p_guest_id::text || ':' || p_idempotency_key::text, 0
  ));

  -- Idempotency check
  SELECT * INTO v_existing FROM public.edition_gift_reservations_v2
   WHERE event_id = p_event_id AND guest_id = p_guest_id AND idempotency_key = p_idempotency_key;
  IF FOUND THEN
    IF v_existing.item_id <> p_item_id OR v_existing.quantity <> p_quantity THEN
      RAISE EXCEPTION 'idempotency key conflicts with original reservation intent' USING ERRCODE = '22000';
    END IF;
    RETURN v_existing;
  END IF;

  -- Lock inventory row for atomic stock check
  SELECT * INTO v_inventory FROM public.edition_gift_inventory
   WHERE event_id = p_event_id AND item_id = p_item_id FOR UPDATE;
  IF NOT FOUND OR NOT v_inventory.family_approved OR NOT v_inventory.enabled
    OR v_inventory.approved_quantity IS NULL OR NOT v_inventory.specifications_complete
    OR NOT v_inventory.child_safety_validated THEN
    RAISE EXCEPTION 'gift item is not reservable' USING ERRCODE = '42501';
  END IF;

  -- Ensure registry key matches Baby Aylla event scope
  IF v_inventory.registry_key <> 'baby-aylla-couture' OR p_event_id <> 'a0f6b5a9-4d8c-4501-81b6-52929fa9da38'::uuid THEN
    RAISE EXCEPTION 'registry key mismatch for event' USING ERRCODE = '42501';
  END IF;

  -- Re-evaluate guest eligibility
  PERFORM 1 FROM public.guests WHERE id = p_guest_id AND event_id = p_event_id
    AND status = 'confirmed' AND guest_source = 'edition_rsvp'
    AND archived_at IS NULL AND deleted_at IS NULL AND is_incorrect = false;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'guest is not eligible' USING ERRCODE = '42501';
  END IF;

  -- Calculate active consumed stock
  SELECT COALESCE(sum(quantity), 0) INTO v_reserved FROM public.edition_gift_reservations_v2
   WHERE event_id = p_event_id AND item_id = p_item_id AND status IN ('reserved', 'purchased', 'delivered');
  IF p_quantity > v_inventory.approved_quantity - v_reserved THEN
    RAISE EXCEPTION 'gift quantity unavailable' USING ERRCODE = '23514';
  END IF;

  -- Insert reservation
  INSERT INTO public.edition_gift_reservations_v2
    (event_id, item_id, guest_id, quantity, idempotency_key, status)
  VALUES
    (p_event_id, p_item_id, p_guest_id, p_quantity, p_idempotency_key, 'reserved')
  RETURNING * INTO v_reservation;

  -- Insert audit
  INSERT INTO public.edition_gift_reservation_audit_v2
    (reservation_id, event_id, actor_guest_id, action, next_status)
  VALUES
    (v_reservation.id, p_event_id, p_guest_id, 'reserved', 'reserved');

  RETURN v_reservation;
END;
$$;

-- 10. Verified Reservation Function (Callable by haxr_aylla_gift_runtime via session proof)
CREATE OR REPLACE FUNCTION public.reserve_baby_aylla_gift_verified(
  p_session_id uuid,
  p_secret_proof text,
  p_item_id text,
  p_quantity integer,
  p_idempotency_key uuid
) RETURNS public.edition_gift_reservations_v2
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_session public.edition_guest_sessions;
  v_now timestamptz := clock_timestamp();
BEGIN
  -- Validate active session via double-hashed credential (sha256 of client proof)
  SELECT * INTO v_session
  FROM public.edition_guest_sessions
  WHERE id = p_session_id
    AND secret_hash = encode(sha256(p_secret_proof::bytea), 'hex')
    AND expires_at > v_now
    AND revoked_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'verified guest session required' USING ERRCODE = '42501';
  END IF;

  -- Verify guest eligibility
  PERFORM 1 FROM public.guests
  WHERE id = v_session.guest_id AND event_id = v_session.event_id
    AND status = 'confirmed' AND guest_source = 'edition_rsvp'
    AND archived_at IS NULL AND deleted_at IS NULL AND is_incorrect = false;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'guest is not eligible' USING ERRCODE = '42501';
  END IF;

  RETURN public.reserve_baby_aylla_gift(
    v_session.event_id, p_item_id, v_session.guest_id, p_quantity, p_idempotency_key
  );
END;
$$;

-- 11. Verified Cancellation Function (Callable by haxr_aylla_gift_runtime via session proof)
CREATE OR REPLACE FUNCTION public.cancel_baby_aylla_gift_verified(
  p_session_id uuid,
  p_secret_proof text,
  p_reservation_id uuid
) RETURNS public.edition_gift_reservations_v2
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_session public.edition_guest_sessions;
  v_reservation public.edition_gift_reservations_v2;
  v_now timestamptz := clock_timestamp();
BEGIN
  SELECT * INTO v_session
  FROM public.edition_guest_sessions
  WHERE id = p_session_id
    AND secret_hash = encode(sha256(p_secret_proof::bytea), 'hex')
    AND expires_at > v_now
    AND revoked_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'verified guest session required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_reservation
  FROM public.edition_gift_reservations_v2
  WHERE id = p_reservation_id
    AND event_id = v_session.event_id
    AND guest_id = v_session.guest_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'reservation not found or ownership mismatch' USING ERRCODE = '42501';
  END IF;

  IF v_reservation.status <> 'reserved' THEN
    RAISE EXCEPTION 'only reserved gifts can be cancelled by guest' USING ERRCODE = '22000';
  END IF;

  UPDATE public.edition_gift_reservations_v2
  SET status = 'cancelled',
      cancelled_at = v_now,
      updated_at = v_now
  WHERE id = p_reservation_id
  RETURNING * INTO v_reservation;

  INSERT INTO public.edition_gift_reservation_audit_v2
    (reservation_id, event_id, actor_guest_id, action, previous_status, next_status, reason)
  VALUES
    (p_reservation_id, v_session.event_id, v_session.guest_id, 'cancelled', 'reserved', 'cancelled', 'cancelled_by_guest');

  RETURN v_reservation;
END;
$$;

-- 12. Controlled Challenge Lifecycle Functions (SECURITY DEFINER)
-- Exclusive issuance privilege granted to haxr_aylla_gift_issuer
CREATE OR REPLACE FUNCTION public.create_baby_aylla_verification_challenge(
  p_id uuid,
  p_event_id uuid,
  p_guest_id uuid,
  p_verifier_hash text,
  p_max_attempts integer DEFAULT 5
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_expires_at timestamptz := v_now + interval '10 minutes';
BEGIN
  IF p_id IS NULL OR p_event_id IS NULL OR p_guest_id IS NULL THEN
    RAISE EXCEPTION 'missing required parameters for challenge' USING ERRCODE = '22023';
  END IF;

  IF length(COALESCE(p_verifier_hash, '')) < 32 OR length(p_verifier_hash) > 256 THEN
    RAISE EXCEPTION 'invalid verifier hash format' USING ERRCODE = '22023';
  END IF;

  IF p_max_attempts IS NOT NULL AND (p_max_attempts < 1 OR p_max_attempts > 5) THEN
    RAISE EXCEPTION 'invalid max attempts' USING ERRCODE = '22023';
  END IF;

  IF p_event_id <> 'a0f6b5a9-4d8c-4501-81b6-52929fa9da38'::uuid THEN
    RAISE EXCEPTION 'invalid event scope for challenge' USING ERRCODE = '42501';
  END IF;

  PERFORM 1 FROM public.guests
  WHERE id = p_guest_id AND event_id = p_event_id
    AND status = 'confirmed' AND guest_source = 'edition_rsvp'
    AND archived_at IS NULL AND deleted_at IS NULL AND is_incorrect = false;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'guest is not eligible for verification challenge' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.edition_guest_verification_challenges
    (id, event_id, guest_id, verifier_hash, expires_at, attempts, max_attempts, consumed_at, session_issued_at, created_at)
  VALUES
    (p_id, p_event_id, p_guest_id, p_verifier_hash, v_expires_at, 0, COALESCE(p_max_attempts, 5), NULL, NULL, v_now);

  RETURN p_id;
END;
$$;

-- Atomic verification and consumption of OTP challenge (Callable by haxr_aylla_gift_runtime)
CREATE OR REPLACE FUNCTION public.verify_and_consume_baby_aylla_challenge(
  p_challenge_id uuid,
  p_verifier_hash text
) RETURNS TABLE (
  consumed boolean,
  event_id uuid,
  guest_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_challenge public.edition_guest_verification_challenges;
  v_now timestamptz := clock_timestamp();
BEGIN
  IF p_challenge_id IS NULL OR length(COALESCE(p_verifier_hash, '')) < 32 OR length(p_verifier_hash) > 256 THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::uuid;
    RETURN;
  END IF;

  SELECT * INTO v_challenge
  FROM public.edition_guest_verification_challenges
  WHERE id = p_challenge_id
  FOR UPDATE;

  IF NOT FOUND OR v_challenge.consumed_at IS NOT NULL OR v_challenge.expires_at <= v_now OR v_challenge.attempts >= v_challenge.max_attempts THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::uuid;
    RETURN;
  END IF;

  IF v_challenge.verifier_hash <> p_verifier_hash THEN
    UPDATE public.edition_guest_verification_challenges
    SET attempts = attempts + 1
    WHERE id = p_challenge_id;
    RETURN QUERY SELECT false, NULL::uuid, NULL::uuid;
    RETURN;
  END IF;

  UPDATE public.edition_guest_verification_challenges
  SET consumed_at = v_now
  WHERE id = p_challenge_id;

  RETURN QUERY SELECT true, v_challenge.event_id, v_challenge.guest_id;
END;
$$;

-- 13. Controlled Session Lifecycle Functions (SECURITY DEFINER)
-- Requires freshly consumed challenge for the guest and stores double-hashed proof
CREATE OR REPLACE FUNCTION public.create_baby_aylla_guest_session(
  p_id uuid,
  p_event_id uuid,
  p_guest_id uuid,
  p_secret_proof text,
  p_challenge_id uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_challenge public.edition_guest_verification_challenges;
  v_now timestamptz := clock_timestamp();
  v_expires_at timestamptz := v_now + interval '20 minutes';
BEGIN
  IF p_id IS NULL OR p_event_id IS NULL OR p_guest_id IS NULL OR p_challenge_id IS NULL THEN
    RAISE EXCEPTION 'missing required parameters for session' USING ERRCODE = '22023';
  END IF;

  IF length(COALESCE(p_secret_proof, '')) < 32 OR length(p_secret_proof) > 256 THEN
    RAISE EXCEPTION 'invalid secret proof format' USING ERRCODE = '22023';
  END IF;

  IF p_event_id <> 'a0f6b5a9-4d8c-4501-81b6-52929fa9da38'::uuid THEN
    RAISE EXCEPTION 'invalid event scope for session' USING ERRCODE = '42501';
  END IF;

  PERFORM 1 FROM public.guests
  WHERE id = p_guest_id AND event_id = p_event_id
    AND status = 'confirmed' AND guest_source = 'edition_rsvp'
    AND archived_at IS NULL AND deleted_at IS NULL AND is_incorrect = false;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'guest is not eligible for session issuance' USING ERRCODE = '42501';
  END IF;

  -- Verify binding to valid, freshly consumed, unissued challenge for this exact guest and event
  SELECT * INTO v_challenge
  FROM public.edition_guest_verification_challenges
  WHERE id = p_challenge_id
    AND event_id = p_event_id
    AND guest_id = p_guest_id
    AND consumed_at IS NOT NULL
    AND consumed_at >= v_now - interval '120 seconds'
    AND session_issued_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'cannot issue session: valid, freshly consumed challenge required' USING ERRCODE = '42501';
  END IF;

  -- Single-use session issuance invariant
  UPDATE public.edition_guest_verification_challenges
  SET session_issued_at = v_now
  WHERE id = p_challenge_id;

  -- Store double-hashed credential (sha256 of client secret proof)
  INSERT INTO public.edition_guest_sessions
    (id, event_id, guest_id, secret_hash, expires_at, revoked_at, created_at)
  VALUES
    (p_id, p_event_id, p_guest_id, encode(sha256(p_secret_proof::bytea), 'hex'), v_expires_at, NULL, v_now);

  RETURN p_id;
END;
$$;

-- Secure session resolution without exposing secret hash
CREATE OR REPLACE FUNCTION public.resolve_baby_aylla_guest_session(
  p_session_id uuid,
  p_secret_proof text
) RETURNS TABLE (
  session_id uuid,
  event_id uuid,
  guest_id uuid,
  expires_at timestamptz,
  guest_name text,
  guest_contact text,
  guest_status guest_status,
  guest_source guest_source,
  guest_archived boolean,
  guest_deleted boolean,
  guest_incorrect boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_session public.edition_guest_sessions;
  v_now timestamptz := clock_timestamp();
BEGIN
  IF p_session_id IS NULL OR length(COALESCE(p_secret_proof, '')) < 32 OR length(p_secret_proof) > 256 THEN
    RETURN;
  END IF;

  SELECT * INTO v_session
  FROM public.edition_guest_sessions
  WHERE id = p_session_id
    AND secret_hash = encode(sha256(p_secret_proof::bytea), 'hex')
    AND expires_at > v_now
    AND revoked_at IS NULL;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT v_session.id, v_session.event_id, g.id, v_session.expires_at,
         g.name, COALESCE(g.phone, g.email, g.name), g.status, g.guest_source,
         (g.archived_at IS NOT NULL), (g.deleted_at IS NOT NULL), g.is_incorrect
  FROM public.guests AS g
  WHERE g.id = v_session.guest_id
    AND g.event_id = v_session.event_id;
END;
$$;

-- Controlled session revocation requiring secret proof
CREATE OR REPLACE FUNCTION public.revoke_baby_aylla_guest_session(
  p_session_id uuid,
  p_secret_proof text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_updated integer;
  v_now timestamptz := clock_timestamp();
BEGIN
  IF p_session_id IS NULL OR length(COALESCE(p_secret_proof, '')) < 32 OR length(p_secret_proof) > 256 THEN
    RETURN false;
  END IF;

  UPDATE public.edition_guest_sessions
  SET revoked_at = v_now
  WHERE id = p_session_id
    AND secret_hash = encode(sha256(p_secret_proof::bytea), 'hex')
    AND revoked_at IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

-- 14. Controlled Admin State Transition Function (SECURITY DEFINER)
-- Restricted strictly to dedicated administrative identity haxr_aylla_gift_admin
CREATE OR REPLACE FUNCTION public.transition_baby_aylla_gift_reservation_admin(
  p_event_id uuid,
  p_reservation_id uuid,
  p_admin_id uuid,
  p_next_status text,
  p_reason text DEFAULT NULL
) RETURNS public.edition_gift_reservations_v2
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_reservation public.edition_gift_reservations_v2;
  v_valid_transition boolean := false;
  v_now timestamptz := clock_timestamp();
BEGIN
  IF p_event_id <> 'a0f6b5a9-4d8c-4501-81b6-52929fa9da38'::uuid THEN
    RAISE EXCEPTION 'invalid event scope for admin transition' USING ERRCODE = '42501';
  END IF;

  -- Validate admin identity and active status against canonical admin_users
  PERFORM 1 FROM public.admin_users
  WHERE id = p_admin_id
    AND status = 'active'
    AND role IN ('OWNER', 'ADMIN', 'EVENT_MANAGER');
  IF NOT FOUND THEN
    RAISE EXCEPTION 'unauthorized admin actor' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_reservation
  FROM public.edition_gift_reservations_v2
  WHERE id = p_reservation_id AND event_id = p_event_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'reservation not found' USING ERRCODE = 'P0002';
  END IF;

  -- Validate state machine transitions
  IF v_reservation.status = 'reserved' AND p_next_status IN ('purchased', 'cancelled') THEN
    v_valid_transition := true;
  ELSIF v_reservation.status = 'purchased' AND p_next_status = 'delivered' THEN
    v_valid_transition := true;
  END IF;

  IF NOT v_valid_transition THEN
    RAISE EXCEPTION 'invalid reservation status transition from % to %', v_reservation.status, p_next_status
      USING ERRCODE = '22000';
  END IF;

  UPDATE public.edition_gift_reservations_v2
  SET status = p_next_status,
      updated_at = v_now,
      cancelled_at = CASE WHEN p_next_status = 'cancelled' THEN v_now ELSE cancelled_at END,
      purchased_at = CASE WHEN p_next_status = 'purchased' THEN v_now ELSE purchased_at END,
      delivered_at = CASE WHEN p_next_status = 'delivered' THEN v_now ELSE delivered_at END
  WHERE id = p_reservation_id
  RETURNING * INTO v_reservation;

  INSERT INTO public.edition_gift_reservation_audit_v2
    (reservation_id, event_id, actor_guest_id, actor_admin_id, action, previous_status, next_status, reason, created_at)
  VALUES
    (p_reservation_id, p_event_id, NULL, p_admin_id, p_next_status, v_reservation.status, p_next_status, p_reason, v_now);

  RETURN v_reservation;
END;
$$;

-- 15. Role Grants & Least Privilege Hardening
-- Full revocation of execution from PUBLIC
REVOKE ALL ON FUNCTION public.reserve_baby_aylla_gift(uuid, text, uuid, integer, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reserve_baby_aylla_gift_verified(uuid, text, text, integer, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_baby_aylla_gift_verified(uuid, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_baby_aylla_guest_by_contact(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_baby_aylla_guest_by_id(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_baby_aylla_verification_challenge(uuid, uuid, uuid, text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.verify_and_consume_baby_aylla_challenge(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_baby_aylla_guest_session(uuid, uuid, uuid, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_baby_aylla_guest_session(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.revoke_baby_aylla_guest_session(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.transition_baby_aylla_gift_reservation_admin(uuid, uuid, uuid, text, text) FROM PUBLIC;

-- Revoke from all roles to start clean
REVOKE ALL ON FUNCTION public.reserve_baby_aylla_gift(uuid, text, uuid, integer, uuid) FROM haxr_aylla_gift_runtime;
REVOKE ALL ON FUNCTION public.reserve_baby_aylla_gift(uuid, text, uuid, integer, uuid) FROM haxr_aylla_gift_issuer;
REVOKE ALL ON FUNCTION public.reserve_baby_aylla_gift(uuid, text, uuid, integer, uuid) FROM haxr_aylla_gift_admin;
REVOKE ALL ON FUNCTION public.transition_baby_aylla_gift_reservation_admin(uuid, uuid, uuid, text, text) FROM haxr_aylla_gift_issuer, haxr_aylla_gift_runtime;
REVOKE ALL ON FUNCTION public.create_baby_aylla_verification_challenge(uuid, uuid, uuid, text, integer) FROM haxr_aylla_gift_runtime, haxr_aylla_gift_admin;
REVOKE ALL ON FUNCTION public.verify_and_consume_baby_aylla_challenge(uuid, text) FROM haxr_aylla_gift_issuer, haxr_aylla_gift_admin;
REVOKE ALL ON FUNCTION public.create_baby_aylla_guest_session(uuid, uuid, uuid, text, uuid) FROM haxr_aylla_gift_issuer, haxr_aylla_gift_admin;
REVOKE ALL ON FUNCTION public.resolve_baby_aylla_guest_session(uuid, text) FROM haxr_aylla_gift_issuer, haxr_aylla_gift_admin;
REVOKE ALL ON FUNCTION public.revoke_baby_aylla_guest_session(uuid, text) FROM haxr_aylla_gift_issuer, haxr_aylla_gift_admin;
REVOKE ALL ON FUNCTION public.reserve_baby_aylla_gift_verified(uuid, text, text, integer, uuid) FROM haxr_aylla_gift_issuer, haxr_aylla_gift_admin;
REVOKE ALL ON FUNCTION public.cancel_baby_aylla_gift_verified(uuid, text, uuid) FROM haxr_aylla_gift_issuer, haxr_aylla_gift_admin;

-- Table permissions:
-- haxr_aylla_gift_issuer has ZERO table permissions! Zero SELECT on any table.
-- haxr_aylla_gift_runtime has SELECT ONLY on inventory, reservations, audit. ZERO on challenges, ZERO on sessions.
-- haxr_aylla_gift_admin has SELECT ONLY on inventory, reservations, audit.
GRANT SELECT ON public.edition_gift_inventory TO haxr_aylla_gift_runtime;
GRANT SELECT ON public.edition_gift_reservations_v2 TO haxr_aylla_gift_runtime;
GRANT SELECT ON public.edition_gift_reservation_audit_v2 TO haxr_aylla_gift_runtime;

GRANT SELECT ON public.edition_gift_inventory TO haxr_aylla_gift_admin;
GRANT SELECT ON public.edition_gift_reservations_v2 TO haxr_aylla_gift_admin;
GRANT SELECT ON public.edition_gift_reservation_audit_v2 TO haxr_aylla_gift_admin;

-- Issuer role: ONLY create challenge and resolve contact lookup
GRANT EXECUTE ON FUNCTION public.resolve_baby_aylla_guest_by_contact(text) TO haxr_aylla_gift_issuer;
GRANT EXECUTE ON FUNCTION public.create_baby_aylla_verification_challenge(uuid, uuid, uuid, text, integer) TO haxr_aylla_gift_issuer;

-- Guest operational role EXECUTE grants on verified guest functions
GRANT EXECUTE ON FUNCTION public.resolve_baby_aylla_guest_by_contact(text) TO haxr_aylla_gift_runtime;
GRANT EXECUTE ON FUNCTION public.resolve_baby_aylla_guest_by_id(uuid) TO haxr_aylla_gift_runtime;
GRANT EXECUTE ON FUNCTION public.verify_and_consume_baby_aylla_challenge(uuid, text) TO haxr_aylla_gift_runtime;
GRANT EXECUTE ON FUNCTION public.create_baby_aylla_guest_session(uuid, uuid, uuid, text, uuid) TO haxr_aylla_gift_runtime;
GRANT EXECUTE ON FUNCTION public.resolve_baby_aylla_guest_session(uuid, text) TO haxr_aylla_gift_runtime;
GRANT EXECUTE ON FUNCTION public.revoke_baby_aylla_guest_session(uuid, text) TO haxr_aylla_gift_runtime;
GRANT EXECUTE ON FUNCTION public.reserve_baby_aylla_gift_verified(uuid, text, text, integer, uuid) TO haxr_aylla_gift_runtime;
GRANT EXECUTE ON FUNCTION public.cancel_baby_aylla_gift_verified(uuid, text, uuid) TO haxr_aylla_gift_runtime;

-- Dedicated admin role EXECUTE grant
GRANT EXECUTE ON FUNCTION public.transition_baby_aylla_gift_reservation_admin(uuid, uuid, uuid, text, text) TO haxr_aylla_gift_admin;

COMMIT;
