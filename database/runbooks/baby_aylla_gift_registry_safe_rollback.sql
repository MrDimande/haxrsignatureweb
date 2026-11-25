-- ==============================================================================
-- HAXR Core — Baby Aylla Gift Registry — Gate E
-- NON-DESTRUCTIVE PRIMARY ROLLBACK (PRODUCTION INCIDENT RESPONSE)
-- ==============================================================================
-- Priority Strategy:
--   1. Deploy kill-switch: AYLLA_GIFTS_CONFIG.enabled = false (blocks new
--      mutations and hides active checkout while preserving /babyaylla RSVP & QR).
--   2. Execute this SQL script to disable all inventory items for Baby Aylla
--      and revoke active guest verification sessions.
--   3. STRICTLY PRESERVES:
--      - public.edition_gift_reservations_v2 (all existing guest reservations)
--      - public.edition_gift_reservation_audit_v2 (full immutable audit trail)
--      - public.guests, public.events, public.checkins (RSVP & QR untouched)
--
-- NEVER run DROP TABLE on a live environment with reservations or audit rows.
-- ==============================================================================

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.events
    WHERE id = 'a0f6b5a9-4d8c-4501-81b6-52929fa9da38'::uuid
      AND edition_registry_key = 'baby-aylla-couture'
  ) THEN
    RAISE EXCEPTION 'Canonical Baby Aylla event missing';
  END IF;
END;
$$;

-- 1. Halt new gift reservations at the PostgreSQL inventory barrier
UPDATE public.edition_gift_inventory
SET enabled = false,
    updated_at = clock_timestamp()
WHERE event_id = 'a0f6b5a9-4d8c-4501-81b6-52929fa9da38'::uuid
  AND enabled = true;

-- 2. Revoke any active guest Gift Registry sessions immediately
UPDATE public.edition_guest_sessions
SET revoked_at = clock_timestamp()
WHERE event_id = 'a0f6b5a9-4d8c-4501-81b6-52929fa9da38'::uuid
  AND revoked_at IS NULL;

-- 3. Invalidate unconsumed OTP challenges safely without rewriting history
UPDATE public.edition_guest_verification_challenges
SET attempts = max_attempts
WHERE event_id = 'a0f6b5a9-4d8c-4501-81b6-52929fa9da38'::uuid
  AND consumed_at IS NULL
  AND attempts < max_attempts;

-- Verification readback
SELECT
  (SELECT count(*) FROM public.edition_gift_inventory WHERE event_id = 'a0f6b5a9-4d8c-4501-81b6-52929fa9da38'::uuid AND enabled = true) AS active_items_remaining,
  (SELECT count(*) FROM public.edition_guest_sessions WHERE event_id = 'a0f6b5a9-4d8c-4501-81b6-52929fa9da38'::uuid AND revoked_at IS NULL) AS active_sessions_remaining,
  (SELECT count(*) FROM public.edition_gift_reservations_v2 WHERE event_id = 'a0f6b5a9-4d8c-4501-81b6-52929fa9da38'::uuid) AS preserved_reservations,
  (SELECT count(*) FROM public.edition_gift_reservation_audit_v2 WHERE event_id = 'a0f6b5a9-4d8c-4501-81b6-52929fa9da38'::uuid) AS preserved_audit_rows;

COMMIT;
