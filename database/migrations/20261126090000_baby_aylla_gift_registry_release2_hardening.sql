-- ==============================================================================
-- HAXR Core — Baby Aylla Gift Registry — Release 2 Final Hardening
-- DUPLICATE CONTACT FAIL-CLOSED RESOLUTION, ARCHIVED GUEST ISOLATION, AND
-- TRANSACTIONAL OTP CHALLENGE DELIVERY / COMPENSATION LIFECYCLE
-- ==============================================================================
-- Sequence: Runs strictly AFTER 20261125120200_baby_aylla_gift_registry_catalog_seed_pending.sql
-- (Safe to apply both to fresh Production DBs and staging branches already on
-- Phase C.3 or Gate E schemas.)
-- ==============================================================================

BEGIN;

DO $$
BEGIN
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

-- 1. Challenge delivery lifecycle state tracking (additive, idempotent)
ALTER TABLE public.edition_guest_verification_challenges
  ADD COLUMN IF NOT EXISTS delivery_status text NOT NULL DEFAULT 'pending';

ALTER TABLE public.edition_guest_verification_challenges
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

ALTER TABLE public.edition_guest_verification_challenges
  ADD COLUMN IF NOT EXISTS delivery_failed_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'edition_guest_verification_challenges_delivery_status_check'
      AND conrelid = 'public.edition_guest_verification_challenges'::regclass
  ) THEN
    ALTER TABLE public.edition_guest_verification_challenges
      ADD CONSTRAINT edition_guest_verification_challenges_delivery_status_check
      CHECK (delivery_status IN ('pending', 'delivered', 'failed'));
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS edition_guest_verification_challenges_deliverable_idx
  ON public.edition_guest_verification_challenges (id, expires_at)
  WHERE consumed_at IS NULL AND delivery_failed_at IS NULL;

-- 2. Fail-closed guest contact resolution:
--    - Excludes ALL archived, deleted, and incorrect records unconditionally.
--    - Restricts candidates to confirmed edition_rsvp guests for the canonical event.
--    - NEVER selects arbitrarily when 2+ eligible records share the same email or phone:
--      returns 0 rows unless the eligible match count is strictly 1.
CREATE OR REPLACE FUNCTION public.resolve_baby_aylla_guest_by_contact(p_contact text)
RETURNS TABLE (
  id uuid, event_id uuid, name text, contact text, status guest_status,
  guest_source guest_source, archived_at timestamptz, deleted_at timestamptz, is_incorrect boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_trimmed text := COALESCE(trim(p_contact), '');
  v_is_email boolean := position('@' IN v_trimmed) > 0;
  v_digits text := regexp_replace(regexp_replace(v_trimmed, '^00', ''), '\D', '', 'g');
  v_canonical_digits text;
  v_eligible_count integer := 0;
BEGIN
  IF v_trimmed = '' THEN
    RETURN;
  END IF;

  IF NOT v_is_email THEN
    IF length(v_digits) = 9 AND v_digits ~ '^8[2-7][0-9]{7}$' THEN
      v_canonical_digits := '258' || v_digits;
    ELSIF length(v_digits) = 10 AND v_digits ~ '^08[2-7][0-9]{7}$' THEN
      v_canonical_digits := '258' || substr(v_digits, 2);
    ELSE
      v_canonical_digits := v_digits;
    END IF;
    IF length(v_canonical_digits) < 8 THEN
      RETURN;
    END IF;
  END IF;

  SELECT count(*)::integer INTO v_eligible_count
  FROM public.guests AS g
  WHERE g.event_id = 'a0f6b5a9-4d8c-4501-81b6-52929fa9da38'::uuid
    AND g.archived_at IS NULL
    AND g.deleted_at IS NULL
    AND g.is_incorrect = false
    AND g.status = 'confirmed'
    AND g.guest_source = 'edition_rsvp'
    AND (
      (v_is_email AND lower(trim(COALESCE(g.email, ''))) = lower(v_trimmed))
      OR (
        NOT v_is_email
        AND (
          CASE
            WHEN length(regexp_replace(regexp_replace(COALESCE(g.phone, ''), '^00', ''), '\D', '', 'g')) = 9
              AND regexp_replace(regexp_replace(COALESCE(g.phone, ''), '^00', ''), '\D', '', 'g') ~ '^8[2-7][0-9]{7}$'
              THEN '258' || regexp_replace(regexp_replace(COALESCE(g.phone, ''), '^00', ''), '\D', '', 'g')
            WHEN length(regexp_replace(regexp_replace(COALESCE(g.phone, ''), '^00', ''), '\D', '', 'g')) = 10
              AND regexp_replace(regexp_replace(COALESCE(g.phone, ''), '^00', ''), '\D', '', 'g') ~ '^08[2-7][0-9]{7}$'
              THEN '258' || substr(regexp_replace(regexp_replace(COALESCE(g.phone, ''), '^00', ''), '\D', '', 'g'), 2)
            ELSE regexp_replace(regexp_replace(COALESCE(g.phone, ''), '^00', ''), '\D', '', 'g')
          END
        ) = v_canonical_digits
      )
    );

  IF v_eligible_count <> 1 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    g.id,
    g.event_id,
    g.name,
    CASE
      WHEN v_is_email AND lower(trim(COALESCE(g.email, ''))) = lower(v_trimmed) THEN lower(trim(g.email))
      ELSE COALESCE(NULLIF(trim(g.phone), ''), NULLIF(trim(g.email), ''), g.name)
    END AS contact,
    g.status,
    g.guest_source,
    g.archived_at,
    g.deleted_at,
    g.is_incorrect
  FROM public.guests AS g
  WHERE g.event_id = 'a0f6b5a9-4d8c-4501-81b6-52929fa9da38'::uuid
    AND g.archived_at IS NULL
    AND g.deleted_at IS NULL
    AND g.is_incorrect = false
    AND g.status = 'confirmed'
    AND g.guest_source = 'edition_rsvp'
    AND (
      (v_is_email AND lower(trim(COALESCE(g.email, ''))) = lower(v_trimmed))
      OR (
        NOT v_is_email
        AND (
          CASE
            WHEN length(regexp_replace(regexp_replace(COALESCE(g.phone, ''), '^00', ''), '\D', '', 'g')) = 9
              AND regexp_replace(regexp_replace(COALESCE(g.phone, ''), '^00', ''), '\D', '', 'g') ~ '^8[2-7][0-9]{7}$'
              THEN '258' || regexp_replace(regexp_replace(COALESCE(g.phone, ''), '^00', ''), '\D', '', 'g')
            WHEN length(regexp_replace(regexp_replace(COALESCE(g.phone, ''), '^00', ''), '\D', '', 'g')) = 10
              AND regexp_replace(regexp_replace(COALESCE(g.phone, ''), '^00', ''), '\D', '', 'g') ~ '^08[2-7][0-9]{7}$'
              THEN '258' || substr(regexp_replace(regexp_replace(COALESCE(g.phone, ''), '^00', ''), '\D', '', 'g'), 2)
            ELSE regexp_replace(regexp_replace(COALESCE(g.phone, ''), '^00', ''), '\D', '', 'g')
          END
        ) = v_canonical_digits
      )
    );
END;
$$;

-- 3. Archived/deleted/incorrect guests can never be resolved by ID or active session
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
  WHERE g.event_id = 'a0f6b5a9-4d8c-4501-81b6-52929fa9da38'::uuid
    AND g.id = p_guest_id
    AND g.archived_at IS NULL
    AND g.deleted_at IS NULL
    AND g.is_incorrect = false;
$$;

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

  SELECT s.* INTO v_session
  FROM public.edition_guest_sessions AS s
  WHERE s.id = p_session_id
    AND s.secret_hash = encode(sha256(p_secret_proof::bytea), 'hex')
    AND s.expires_at > v_now
    AND s.revoked_at IS NULL;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT v_session.id, v_session.event_id, g.id, v_session.expires_at,
         g.name, COALESCE(g.phone, g.email, g.name), g.status, g.guest_source,
         (g.archived_at IS NOT NULL), (g.deleted_at IS NOT NULL), g.is_incorrect
  FROM public.guests AS g
  WHERE g.id = v_session.guest_id
    AND g.event_id = v_session.event_id
    AND g.archived_at IS NULL
    AND g.deleted_at IS NULL
    AND g.is_incorrect = false;
END;
$$;

-- 4. Archived/ineligible guests cannot cancel reservations even with an older session
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

  PERFORM 1 FROM public.guests
  WHERE id = v_session.guest_id
    AND event_id = v_session.event_id
    AND status = 'confirmed'
    AND guest_source = 'edition_rsvp'
    AND archived_at IS NULL
    AND deleted_at IS NULL
    AND is_incorrect = false;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'guest is not eligible' USING ERRCODE = '42501';
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

-- 5. Transactional OTP challenge persistence + delivery status + failure compensation
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
    (id, event_id, guest_id, verifier_hash, expires_at, attempts, max_attempts,
     consumed_at, session_issued_at, delivery_status, delivered_at, delivery_failed_at, created_at)
  VALUES
    (p_id, p_event_id, p_guest_id, p_verifier_hash, v_expires_at, 0, COALESCE(p_max_attempts, 5),
     NULL, NULL, 'pending', NULL, NULL, v_now);

  RETURN p_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_baby_aylla_challenge_delivered(
  p_challenge_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_updated integer;
BEGIN
  IF p_challenge_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.edition_guest_verification_challenges
  SET delivery_status = 'delivered',
      delivered_at = COALESCE(delivered_at, v_now)
  WHERE id = p_challenge_id
    AND delivery_status = 'pending'
    AND delivery_failed_at IS NULL
    AND consumed_at IS NULL;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.compensate_baby_aylla_failed_challenge(
  p_challenge_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_updated integer;
BEGIN
  IF p_challenge_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.edition_guest_verification_challenges
  SET delivery_status = 'failed',
      delivery_failed_at = COALESCE(delivery_failed_at, v_now),
      consumed_at = COALESCE(consumed_at, v_now)
  WHERE id = p_challenge_id
    AND session_issued_at IS NULL
    AND delivery_status <> 'delivered';

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

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

  SELECT c.* INTO v_challenge
  FROM public.edition_guest_verification_challenges AS c
  WHERE c.id = p_challenge_id
  FOR UPDATE;

  IF NOT FOUND
     OR v_challenge.delivery_status = 'failed'
     OR v_challenge.delivery_failed_at IS NOT NULL
     OR v_challenge.consumed_at IS NOT NULL
     OR v_challenge.expires_at <= v_now
     OR v_challenge.attempts >= v_challenge.max_attempts THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::uuid;
    RETURN;
  END IF;

  PERFORM 1 FROM public.guests AS g
  WHERE g.id = v_challenge.guest_id
    AND g.event_id = v_challenge.event_id
    AND g.status = 'confirmed'
    AND g.guest_source = 'edition_rsvp'
    AND g.archived_at IS NULL
    AND g.deleted_at IS NULL
    AND g.is_incorrect = false;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::uuid;
    RETURN;
  END IF;

  IF v_challenge.verifier_hash <> p_verifier_hash THEN
    UPDATE public.edition_guest_verification_challenges AS c
    SET attempts = c.attempts + 1
    WHERE c.id = p_challenge_id;
    RETURN QUERY SELECT false, NULL::uuid, NULL::uuid;
    RETURN;
  END IF;

  UPDATE public.edition_guest_verification_challenges AS c
  SET consumed_at = v_now
  WHERE c.id = p_challenge_id;

  RETURN QUERY SELECT true, v_challenge.event_id, v_challenge.guest_id;
END;
$$;

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

  SELECT * INTO v_challenge
  FROM public.edition_guest_verification_challenges
  WHERE id = p_challenge_id
    AND event_id = p_event_id
    AND guest_id = p_guest_id
    AND delivery_status <> 'failed'
    AND delivery_failed_at IS NULL
    AND consumed_at IS NOT NULL
    AND consumed_at >= v_now - interval '120 seconds'
    AND session_issued_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'cannot issue session: valid, freshly consumed challenge required' USING ERRCODE = '42501';
  END IF;

  UPDATE public.edition_guest_verification_challenges
  SET session_issued_at = v_now
  WHERE id = p_challenge_id;

  INSERT INTO public.edition_guest_sessions
    (id, event_id, guest_id, secret_hash, expires_at, revoked_at, created_at)
  VALUES
    (p_id, p_event_id, p_guest_id, encode(sha256(p_secret_proof::bytea), 'hex'), v_expires_at, NULL, v_now);

  RETURN p_id;
END;
$$;

-- 6. Strict Least-Privilege Permission Re-assertion
REVOKE ALL ON FUNCTION public.resolve_baby_aylla_guest_by_contact(text) FROM PUBLIC, haxr_aylla_gift_admin;
GRANT EXECUTE ON FUNCTION public.resolve_baby_aylla_guest_by_contact(text) TO haxr_aylla_gift_issuer;
GRANT EXECUTE ON FUNCTION public.resolve_baby_aylla_guest_by_contact(text) TO haxr_aylla_gift_runtime;

REVOKE ALL ON FUNCTION public.resolve_baby_aylla_guest_by_id(uuid) FROM PUBLIC, haxr_aylla_gift_issuer, haxr_aylla_gift_admin;
GRANT EXECUTE ON FUNCTION public.resolve_baby_aylla_guest_by_id(uuid) TO haxr_aylla_gift_runtime;

REVOKE ALL ON FUNCTION public.resolve_baby_aylla_guest_session(uuid, text) FROM PUBLIC, haxr_aylla_gift_issuer, haxr_aylla_gift_admin;
GRANT EXECUTE ON FUNCTION public.resolve_baby_aylla_guest_session(uuid, text) TO haxr_aylla_gift_runtime;

REVOKE ALL ON FUNCTION public.cancel_baby_aylla_gift_verified(uuid, text, uuid) FROM PUBLIC, haxr_aylla_gift_issuer, haxr_aylla_gift_admin;
GRANT EXECUTE ON FUNCTION public.cancel_baby_aylla_gift_verified(uuid, text, uuid) TO haxr_aylla_gift_runtime;

REVOKE ALL ON FUNCTION public.create_baby_aylla_verification_challenge(uuid, uuid, uuid, text, integer) FROM PUBLIC, haxr_aylla_gift_runtime, haxr_aylla_gift_admin;
GRANT EXECUTE ON FUNCTION public.create_baby_aylla_verification_challenge(uuid, uuid, uuid, text, integer) TO haxr_aylla_gift_issuer;

REVOKE ALL ON FUNCTION public.mark_baby_aylla_challenge_delivered(uuid) FROM PUBLIC, haxr_aylla_gift_runtime, haxr_aylla_gift_admin;
GRANT EXECUTE ON FUNCTION public.mark_baby_aylla_challenge_delivered(uuid) TO haxr_aylla_gift_issuer;

REVOKE ALL ON FUNCTION public.compensate_baby_aylla_failed_challenge(uuid) FROM PUBLIC, haxr_aylla_gift_runtime, haxr_aylla_gift_admin;
GRANT EXECUTE ON FUNCTION public.compensate_baby_aylla_failed_challenge(uuid) TO haxr_aylla_gift_issuer;

REVOKE ALL ON FUNCTION public.verify_and_consume_baby_aylla_challenge(uuid, text) FROM PUBLIC, haxr_aylla_gift_issuer, haxr_aylla_gift_admin;
GRANT EXECUTE ON FUNCTION public.verify_and_consume_baby_aylla_challenge(uuid, text) TO haxr_aylla_gift_runtime;

REVOKE ALL ON FUNCTION public.create_baby_aylla_guest_session(uuid, uuid, uuid, text, uuid) FROM PUBLIC, haxr_aylla_gift_issuer, haxr_aylla_gift_admin;
GRANT EXECUTE ON FUNCTION public.create_baby_aylla_guest_session(uuid, uuid, uuid, text, uuid) TO haxr_aylla_gift_runtime;

COMMIT;
