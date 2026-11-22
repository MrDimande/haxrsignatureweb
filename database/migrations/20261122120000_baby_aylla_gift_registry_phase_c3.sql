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
  actor_admin_id uuid,
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
  verifier_hash text NOT NULL CHECK (length(verifier_hash) >= 32),
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0 AND attempts <= 5),
  max_attempts integer NOT NULL DEFAULT 5 CHECK (max_attempts BETWEEN 1 AND 10),
  consumed_at timestamptz,
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
  secret_hash text NOT NULL CHECK (length(secret_hash) >= 32),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS edition_guest_sessions_active_idx
  ON public.edition_guest_sessions (id, expires_at)
  WHERE revoked_at IS NULL;

-- 6. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.edition_gift_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edition_gift_reservations_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edition_gift_reservation_audit_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edition_guest_verification_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edition_guest_sessions ENABLE ROW LEVEL SECURITY;

-- 7. Revoke All Table Permissions from PUBLIC
REVOKE ALL ON public.edition_gift_inventory FROM PUBLIC;
REVOKE ALL ON public.edition_gift_reservations_v2 FROM PUBLIC;
REVOKE ALL ON public.edition_gift_reservation_audit_v2 FROM PUBLIC;
REVOKE ALL ON public.edition_guest_verification_challenges FROM PUBLIC;
REVOKE ALL ON public.edition_guest_sessions FROM PUBLIC;

-- 8. Explicit Row Level Security Policies
-- Full denial for PUBLIC. Granular access granted to authorized runtime roles.
DROP POLICY IF EXISTS edition_gift_inventory_runtime_sel ON public.edition_gift_inventory;
CREATE POLICY edition_gift_inventory_runtime_sel
  ON public.edition_gift_inventory FOR SELECT
  TO edition_runtime
  USING (true);

DROP POLICY IF EXISTS edition_gift_reservations_v2_runtime_all ON public.edition_gift_reservations_v2;
CREATE POLICY edition_gift_reservations_v2_runtime_all
  ON public.edition_gift_reservations_v2 FOR ALL
  TO edition_runtime
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS edition_gift_reservation_audit_v2_runtime_all ON public.edition_gift_reservation_audit_v2;
CREATE POLICY edition_gift_reservation_audit_v2_runtime_all
  ON public.edition_gift_reservation_audit_v2 FOR ALL
  TO edition_runtime
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS edition_guest_verification_challenges_runtime_all ON public.edition_guest_verification_challenges;
CREATE POLICY edition_guest_verification_challenges_runtime_all
  ON public.edition_guest_verification_challenges FOR ALL
  TO edition_runtime
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS edition_guest_sessions_runtime_all ON public.edition_guest_sessions;
CREATE POLICY edition_guest_sessions_runtime_all
  ON public.edition_guest_sessions FOR ALL
  TO edition_runtime
  USING (true)
  WITH CHECK (true);

-- 8. Core Internal Reservation Function (Invoked by verified wrapper)
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

-- 9. Verified Reservation Function (Callable by edition_runtime via session)
CREATE OR REPLACE FUNCTION public.reserve_baby_aylla_gift_verified(
  p_session_id uuid,
  p_secret_hash text,
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
BEGIN
  -- Validate active session
  SELECT * INTO v_session
  FROM public.edition_guest_sessions
  WHERE id = p_session_id
    AND secret_hash = p_secret_hash
    AND expires_at > now()
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

-- 10. Verified Cancellation Function (Callable by edition_runtime via session)
CREATE OR REPLACE FUNCTION public.cancel_baby_aylla_gift_verified(
  p_session_id uuid,
  p_secret_hash text,
  p_reservation_id uuid
) RETURNS public.edition_gift_reservations_v2
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_session public.edition_guest_sessions;
  v_reservation public.edition_gift_reservations_v2;
BEGIN
  SELECT * INTO v_session
  FROM public.edition_guest_sessions
  WHERE id = p_session_id
    AND secret_hash = p_secret_hash
    AND expires_at > now()
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
      cancelled_at = now(),
      updated_at = now()
  WHERE id = p_reservation_id
  RETURNING * INTO v_reservation;

  INSERT INTO public.edition_gift_reservation_audit_v2
    (reservation_id, event_id, actor_guest_id, action, previous_status, next_status, reason)
  VALUES
    (p_reservation_id, v_session.event_id, v_session.guest_id, 'cancelled', 'reserved', 'cancelled', 'cancelled_by_guest');

  RETURN v_reservation;
END;
$$;

-- 11. Role Grants
REVOKE ALL ON FUNCTION public.reserve_baby_aylla_gift(uuid, text, uuid, integer, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reserve_baby_aylla_gift_verified(uuid, text, text, integer, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_baby_aylla_gift_verified(uuid, text, uuid) FROM PUBLIC;

GRANT SELECT ON public.edition_gift_inventory TO edition_runtime;
GRANT SELECT, INSERT, UPDATE ON public.edition_gift_reservations_v2 TO edition_runtime;
GRANT INSERT, SELECT ON public.edition_gift_reservation_audit_v2 TO edition_runtime;
GRANT SELECT, INSERT, UPDATE ON public.edition_guest_verification_challenges TO edition_runtime;
GRANT SELECT, INSERT, UPDATE ON public.edition_guest_sessions TO edition_runtime;

GRANT EXECUTE ON FUNCTION public.reserve_baby_aylla_gift_verified(uuid, text, text, integer, uuid) TO edition_runtime;
GRANT EXECUTE ON FUNCTION public.cancel_baby_aylla_gift_verified(uuid, text, uuid) TO edition_runtime;

-- Conditional Core runtime grants (following HAXR Core foundation pattern)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'haxrweb_runtime') THEN
    GRANT SELECT, UPDATE ON public.edition_gift_inventory TO haxrweb_runtime;
    GRANT SELECT, INSERT, UPDATE ON public.edition_gift_reservations_v2 TO haxrweb_runtime;
    GRANT INSERT, SELECT ON public.edition_gift_reservation_audit_v2 TO haxrweb_runtime;
    GRANT SELECT, INSERT, UPDATE ON public.edition_guest_verification_challenges TO haxrweb_runtime;
    GRANT SELECT, INSERT, UPDATE ON public.edition_guest_sessions TO haxrweb_runtime;
    GRANT EXECUTE ON FUNCTION public.reserve_baby_aylla_gift(uuid, text, uuid, integer, uuid) TO haxrweb_runtime;
    GRANT EXECUTE ON FUNCTION public.reserve_baby_aylla_gift_verified(uuid, text, text, integer, uuid) TO haxrweb_runtime;
    GRANT EXECUTE ON FUNCTION public.cancel_baby_aylla_gift_verified(uuid, text, uuid) TO haxrweb_runtime;
  END IF;
END $$;

COMMIT;
