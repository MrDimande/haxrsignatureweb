-- ==============================================================================
-- HAXR Core — Baby Aylla Gift Registry — Gate E
-- EXCEPTIONAL DROP SCRIPT — EMPTY ENVIRONMENTS ONLY
-- ==============================================================================
-- WARNING: Strictly prohibited when ANY operational reservation, audit record,
-- or guest session exists. Enforces a fail-closed database guard before dropping
-- V2 Gift Registry functions and tables.
--
-- For production incidents, ALWAYS use baby_aylla_gift_registry_safe_rollback.sql
-- plus application kill-switch (AYLLA_GIFTS_CONFIG.enabled = false).
--
-- Canonical tables public.events, public.guests, public.checkins, and
-- public.admin_users are strictly preserved with zero row losses.
-- ==============================================================================

BEGIN;

DO $$
DECLARE
  v_reservations bigint := 0;
  v_audits bigint := 0;
  v_sessions bigint := 0;
BEGIN
  IF to_regclass('public.edition_gift_reservations_v2') IS NOT NULL THEN
    SELECT count(*) INTO v_reservations FROM public.edition_gift_reservations_v2;
  END IF;
  IF to_regclass('public.edition_gift_reservation_audit_v2') IS NOT NULL THEN
    SELECT count(*) INTO v_audits FROM public.edition_gift_reservation_audit_v2;
  END IF;
  IF to_regclass('public.edition_guest_sessions') IS NOT NULL THEN
    SELECT count(*) INTO v_sessions FROM public.edition_guest_sessions;
  END IF;

  IF v_reservations > 0 OR v_audits > 0 OR v_sessions > 0 THEN
    RAISE EXCEPTION 'ROLLBACK_ABORTED_OPERATIONAL_DATA_PRESENT: reservations=%, audits=%, sessions=%. Use baby_aylla_gift_registry_safe_rollback.sql instead.',
      v_reservations, v_audits, v_sessions USING ERRCODE = '42501';
  END IF;
END;
$$;

DROP FUNCTION IF EXISTS public.consume_baby_aylla_rate_limit(text, integer, integer);
DROP FUNCTION IF EXISTS public.list_baby_aylla_gift_admin_reservations(uuid, uuid);
DROP FUNCTION IF EXISTS public.upsert_baby_aylla_gift_inventory_admin(uuid, uuid, text, boolean, boolean, integer, boolean, boolean);
DROP FUNCTION IF EXISTS public.transition_baby_aylla_gift_reservation_admin(uuid, uuid, uuid, text, text);
DROP FUNCTION IF EXISTS public.revoke_baby_aylla_guest_session(uuid, text);
DROP FUNCTION IF EXISTS public.resolve_baby_aylla_guest_session(uuid, text);
DROP FUNCTION IF EXISTS public.create_baby_aylla_guest_session(uuid, uuid, uuid, text, uuid);
DROP FUNCTION IF EXISTS public.verify_and_consume_baby_aylla_challenge(uuid, text);
DROP FUNCTION IF EXISTS public.create_baby_aylla_verification_challenge(uuid, uuid, uuid, text, integer);
DROP FUNCTION IF EXISTS public.cancel_baby_aylla_gift_verified(uuid, text, uuid);
DROP FUNCTION IF EXISTS public.reserve_baby_aylla_gift_verified(uuid, text, text, integer, uuid);
DROP FUNCTION IF EXISTS public.reserve_baby_aylla_gift(uuid, text, uuid, integer, uuid);
DROP FUNCTION IF EXISTS public.resolve_baby_aylla_guest_by_id(uuid);
DROP FUNCTION IF EXISTS public.resolve_baby_aylla_guest_by_contact(text);

DROP TABLE IF EXISTS public.edition_gift_rate_limits;
DROP TABLE IF EXISTS public.edition_gift_reservation_audit_v2;
DROP TABLE IF EXISTS public.edition_gift_reservations_v2;
DROP TABLE IF EXISTS public.edition_guest_sessions;
DROP TABLE IF EXISTS public.edition_guest_verification_challenges;
DROP TABLE IF EXISTS public.edition_gift_inventory;

COMMIT;
