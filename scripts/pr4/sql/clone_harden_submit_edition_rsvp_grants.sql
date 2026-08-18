-- =============================================================================
-- CLONE ONLY — rkkxfrwtmsqzpnbkshnd
-- Patch: harden EXECUTE grants on public.submit_edition_rsvp overloads
-- DO NOT RUN AGAINST oxsrdmydlqyvnueedgtl (production)
-- Does NOT: DROP FUNCTION, CREATE OR REPLACE, alter data, migrate, repair
-- Review required before apply. Human GO phrase mandatory.
-- Precheck captured: 2026-07-15 (proacl NULL on both = acldefault PUBLIC EXECUTE)
-- =============================================================================

BEGIN;

-- Guard: refuse production connection if run with a session GUCs mistyped.
-- (Application wrapper must also abort on production ref.)

-- 8-arg overload (legacy, no app callers in Core PR #7 / Edition PR #4)
REVOKE ALL ON FUNCTION
  public.submit_edition_rsvp(uuid, text, text, boolean, integer, text, text, text)
FROM PUBLIC;

REVOKE ALL ON FUNCTION
  public.submit_edition_rsvp(uuid, text, text, boolean, integer, text, text, text)
FROM anon;

REVOKE ALL ON FUNCTION
  public.submit_edition_rsvp(uuid, text, text, boolean, integer, text, text, text)
FROM authenticated;

REVOKE ALL ON FUNCTION
  public.submit_edition_rsvp(uuid, text, text, boolean, integer, text, text, text)
FROM service_role;

-- 11-arg overload (current contract: Core PR #7 + Edition PR #4)
REVOKE ALL ON FUNCTION
  public.submit_edition_rsvp(uuid, text, text, boolean, integer, text, text, text, text, text, boolean)
FROM PUBLIC;

REVOKE ALL ON FUNCTION
  public.submit_edition_rsvp(uuid, text, text, boolean, integer, text, text, text, text, text, boolean)
FROM anon;

REVOKE ALL ON FUNCTION
  public.submit_edition_rsvp(uuid, text, text, boolean, integer, text, text, text, text, text, boolean)
FROM authenticated;

GRANT EXECUTE ON FUNCTION
  public.submit_edition_rsvp(uuid, text, text, boolean, integer, text, text, text, text, text, boolean)
TO service_role;

COMMIT;
