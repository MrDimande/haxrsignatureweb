-- =============================================================================
-- CLONE ONLY — rkkxfrwtmsqzpnbkshnd
-- Rollback: restore pre-patch ACL state observed in precheck
-- Pre-patch: proacl NULL on both overloads => acldefault => PUBLIC EXECUTE
-- Does NOT restore production. Does NOT grant PUBLIC on production.
-- =============================================================================

BEGIN;

-- 11-arg: remove explicit service_role grant from patch
REVOKE ALL ON FUNCTION
  public.submit_edition_rsvp(uuid, text, text, boolean, integer, text, text, text, text, text, boolean)
FROM service_role;

REVOKE ALL ON FUNCTION
  public.submit_edition_rsvp(uuid, text, text, boolean, integer, text, text, text, text, text, boolean)
FROM anon;

REVOKE ALL ON FUNCTION
  public.submit_edition_rsvp(uuid, text, text, boolean, integer, text, text, text, text, text, boolean)
FROM authenticated;

-- Restore effective pre-patch access path on clone (PUBLIC EXECUTE / acldefault-like)
GRANT EXECUTE ON FUNCTION
  public.submit_edition_rsvp(uuid, text, text, boolean, integer, text, text, text, text, text, boolean)
TO PUBLIC;

-- 8-arg: restore PUBLIC EXECUTE as observed pre-patch
REVOKE ALL ON FUNCTION
  public.submit_edition_rsvp(uuid, text, text, boolean, integer, text, text, text)
FROM service_role;

REVOKE ALL ON FUNCTION
  public.submit_edition_rsvp(uuid, text, text, boolean, integer, text, text, text)
FROM anon;

REVOKE ALL ON FUNCTION
  public.submit_edition_rsvp(uuid, text, text, boolean, integer, text, text, text)
FROM authenticated;

GRANT EXECUTE ON FUNCTION
  public.submit_edition_rsvp(uuid, text, text, boolean, integer, text, text, text)
TO PUBLIC;

COMMIT;
