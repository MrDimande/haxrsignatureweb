-- CANDIDATE MIGRATION — NOT APPLIED
-- Assign final number only when applying (local WIP may already claim 044–046).
-- Suggested slot at apply time: next free after applied history on the target DB.
--
-- Purpose: harden EXECUTE on submit_edition_rsvp overloads + minimal service_role
--          table grants proven by Preview RSVP persist (Core PR #7 persist.ts).
-- Scope: PUBLIC schema privileges for Edition RSVP path only.
-- Forbidden: production apply without separate GO; DROP; ALTER FUNCTION body;
--            GRANT ALL; ALTER DEFAULT PRIVILEGES; DELETE on guests.
-- Clone ref (rehearsal only): rkkxfrwtmsqzpnbkshnd
-- Production ref (never auto-target): oxsrdmydlqyvnueedgtl
--
-- Proven code paths (2026-07-15 Preview validation):
--   SELECT/INSERT/UPDATE public.guests
--   SELECT embeds seats(*), checkins(checkin_time), guest_groups(name) via getGuestById
--   EXECUTE submit_edition_rsvp(11-arg) ONLY
--   event_id from env binding — NOT SELECT public.events
--
-- Signatures (exact):
--   8-arg  (025): submit_edition_rsvp(uuid, text, text, boolean, integer, text, text, text)
--   11-arg (026): submit_edition_rsvp(uuid, text, text, boolean, integer, text, text, text, text, text, boolean)

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) RPC EXECUTE hardening (do not replace function bodies)
-- ---------------------------------------------------------------------------

-- 11-arg (current Edition RSVP path)
REVOKE ALL ON FUNCTION public.submit_edition_rsvp(
  uuid, text, text, boolean, integer, text, text, text, text, text, boolean
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_edition_rsvp(
  uuid, text, text, boolean, integer, text, text, text, text, text, boolean
) FROM anon;
REVOKE ALL ON FUNCTION public.submit_edition_rsvp(
  uuid, text, text, boolean, integer, text, text, text, text, text, boolean
) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.submit_edition_rsvp(
  uuid, text, text, boolean, integer, text, text, text, text, text, boolean
) TO service_role;

-- 8-arg (legacy): revoke for everyone including service_role — unused by current Core path
REVOKE ALL ON FUNCTION public.submit_edition_rsvp(
  uuid, text, text, boolean, integer, text, text, text
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_edition_rsvp(
  uuid, text, text, boolean, integer, text, text, text
) FROM anon;
REVOKE ALL ON FUNCTION public.submit_edition_rsvp(
  uuid, text, text, boolean, integer, text, text, text
) FROM authenticated;
REVOKE ALL ON FUNCTION public.submit_edition_rsvp(
  uuid, text, text, boolean, integer, text, text, text
) FROM service_role;

-- ---------------------------------------------------------------------------
-- 2) Minimal table grants for service_role (proven)
-- ---------------------------------------------------------------------------

GRANT USAGE ON SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE
  ON TABLE public.guests
  TO service_role;

GRANT SELECT ON TABLE public.seats TO service_role;
GRANT SELECT ON TABLE public.checkins TO service_role;
GRANT SELECT ON TABLE public.guest_groups TO service_role;

-- Explicit non-goals (do not grant here without new proof):
--   public.events
--   DELETE on public.guests
--   GRANT ALL
--   ALTER DEFAULT PRIVILEGES

COMMENT ON FUNCTION public.submit_edition_rsvp(
  uuid, text, text, boolean, integer, text, text, text, text, text, boolean
) IS
  'Edition RSVP upsert (11-arg). EXECUTE: service_role only. Body unchanged by grants migration.';

COMMIT;

-- ---------------------------------------------------------------------------
-- Post-migration verification (run manually; do not embed passwords)
-- ---------------------------------------------------------------------------
-- SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args,
--        has_function_privilege('service_role', p.oid, 'EXECUTE') AS srv,
--        has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_exec,
--        has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_exec
-- FROM pg_proc p
-- JOIN pg_namespace n ON n.oid = p.pronamespace
-- WHERE n.nspname = 'public' AND p.proname = 'submit_edition_rsvp';
--
-- Expect: 11-arg srv=true anon/auth=false; 8-arg srv=false anon/auth=false.
--
-- SELECT has_table_privilege('service_role','public.guests','SELECT') AS g_sel,
--        has_table_privilege('service_role','public.guests','INSERT') AS g_ins,
--        has_table_privilege('service_role','public.guests','UPDATE') AS g_upd,
--        has_table_privilege('service_role','public.guests','DELETE') AS g_del,
--        has_table_privilege('service_role','public.seats','SELECT') AS seats_sel,
--        has_table_privilege('service_role','public.checkins','SELECT') AS checkins_sel,
--        has_table_privilege('service_role','public.guest_groups','SELECT') AS groups_sel,
--        has_table_privilege('service_role','public.events','SELECT') AS events_sel;
-- Expect: guests sel/ins/upd true, del false; embeds sel true; events_sel false (unless other grants).

-- ---------------------------------------------------------------------------
-- Rollback (explicit) — companion file
-- ---------------------------------------------------------------------------
-- See: edition_rsvp_service_role_grants.rollback.sql
