-- ROLLBACK companion for candidates/edition_rsvp_service_role_grants.sql
-- NOT APPLIED automatically. Does not DROP functions or alter bodies.
-- Restores privilege posture to a conservative pre-candidate baseline:
--   - 11-arg EXECUTE remains service_role-only (safer than restoring PUBLIC)
--   - 8-arg stays without service_role EXECUTE
--   - Revokes the table/schema grants introduced by the candidate
--
-- WARNING: If production already relied on broader grants from other migrations,
-- review before running. This only reverses the candidate's table GRANTs.

BEGIN;

REVOKE SELECT, INSERT, UPDATE ON TABLE public.guests FROM service_role;
REVOKE SELECT ON TABLE public.seats FROM service_role;
REVOKE SELECT ON TABLE public.checkins FROM service_role;
REVOKE SELECT ON TABLE public.guest_groups FROM service_role;

-- USAGE on schema may be required by other service_role paths — do not revoke
-- schema USAGE here unless an inventory proves it is unused.

-- Keep 11-arg EXECUTE restricted; do not GRANT to PUBLIC/anon/authenticated.
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

COMMIT;
