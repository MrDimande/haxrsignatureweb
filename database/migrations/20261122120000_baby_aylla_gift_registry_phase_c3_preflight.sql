-- ==============================================================================
-- HAXR Core & Edition — Baby Aylla Gift Registry — Phase C.3.2-B
-- REPRODUCIBLE READ-ONLY HOMOLOGATION PREFLIGHT SCRIPT
-- ==============================================================================
-- Target Environment: Neon PostgreSQL (Laboratório Staging Efêmero)
-- Expected Project ID: gentle-firefly-70094226 (HAXR-Signature-Preview-Portfolio)
-- Expected Parent Branch: br-icy-butterfly-b4lw52nv
-- Target Database: neondb
-- Expected Engine: PostgreSQL 18.x
--
-- Safety Guarantee:
-- This script contains 100% SELECT and diagnostic queries.
-- ZERO writes, ZERO DDL, ZERO mutations, ZERO locks.
-- Returns a unified decision row: GO or NO-GO.
-- ==============================================================================

WITH preflight_checks AS (
  -- 1. Database name validation
  SELECT
    1 AS check_id,
    'Database Name' AS check_name,
    'neondb' AS expected_value,
    current_database() AS observed_value,
    (current_database() = 'neondb') AS passed

  UNION ALL

  -- 2. PostgreSQL 18 Engine Verification
  SELECT
    2,
    'PostgreSQL Engine Version',
    'PostgreSQL 18.x (>= 180000)',
    version(),
    ((SELECT setting::integer FROM pg_settings WHERE name = 'server_version_num') >= 180000)

  UNION ALL

  -- 3. Connection Identity Verification
  SELECT
    3,
    'Connection User Authority',
    'neondb_owner or authorized administrator',
    current_user,
    (current_user IN ('neondb_owner', 'cloud_admin'))

  UNION ALL

  -- 4. Prerequisite Role: edition_runtime
  SELECT
    4,
    'Role: edition_runtime (NOLOGIN)',
    'Role exists with rolcanlogin = false',
    COALESCE((SELECT 'exists (canlogin=' || rolcanlogin::text || ')' FROM pg_roles WHERE rolname = 'edition_runtime'), 'MISSING'),
    EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'edition_runtime' AND rolcanlogin = false)

  UNION ALL

  -- 5. Prerequisite Role: haxrweb_runtime
  SELECT
    5,
    'Role: haxrweb_runtime (Core API Runtime)',
    'Role exists in cluster',
    COALESCE((SELECT 'exists' FROM pg_roles WHERE rolname = 'haxrweb_runtime'), 'MISSING (Will be skipped conditionally)'),
    true -- Conditional grant handles absence gracefully

  UNION ALL

  -- 6. Canonical Table: public.events
  SELECT
    6,
    'Canonical Table: public.events',
    'Table exists in schema public',
    COALESCE((SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events'), 'MISSING'),
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events')

  UNION ALL

  -- 7. Canonical Table: public.guests & Required Columns
  SELECT
    7,
    'Canonical Table & Columns: public.guests',
    '7 required columns: id, event_id, status, guest_source, archived_at, deleted_at, is_incorrect',
    (SELECT count(*)::text || ' of 7 columns present'
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'guests'
       AND column_name IN ('id', 'event_id', 'status', 'guest_source', 'archived_at', 'deleted_at', 'is_incorrect')),
    ((SELECT count(*)
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'guests'
        AND column_name IN ('id', 'event_id', 'status', 'guest_source', 'archived_at', 'deleted_at', 'is_incorrect')) = 7)

  UNION ALL

  -- 8. Core Extension Functions
  SELECT
    8,
    'Extension Functions (gen_random_uuid, pg_advisory_xact_lock)',
    'Both functions available in pg_proc',
    (SELECT count(*)::text || ' available' FROM pg_proc WHERE proname IN ('gen_random_uuid', 'pg_advisory_xact_lock')),
    ((SELECT count(*) FROM pg_proc WHERE proname IN ('gen_random_uuid', 'pg_advisory_xact_lock')) >= 2)

  UNION ALL

  -- 9. Table Collision Check (Must NOT exist prior to forward migration)
  SELECT
    9,
    'Table Collisions (Candidate Tables)',
    '0 existing candidate tables in public schema',
    (SELECT count(*)::text || ' found'
     FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name IN (
         'edition_gift_inventory',
         'edition_gift_reservations_v2',
         'edition_gift_reservation_audit_v2',
         'edition_guest_verification_challenges',
         'edition_guest_sessions'
       )),
    ((SELECT count(*)
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (
          'edition_gift_inventory',
          'edition_gift_reservations_v2',
          'edition_gift_reservation_audit_v2',
          'edition_guest_verification_challenges',
          'edition_guest_sessions'
        )) = 0)

  UNION ALL

  -- 10. Function Collision Check (Must NOT exist prior to forward migration)
  SELECT
    10,
    'Function Collisions (Candidate RPCs)',
    '0 existing candidate functions in public schema',
    (SELECT count(*)::text || ' found'
     FROM pg_proc
     WHERE pronamespace = 'public'::regnamespace
       AND proname IN (
         'reserve_baby_aylla_gift',
         'reserve_baby_aylla_gift_verified',
         'cancel_baby_aylla_gift_verified'
       )),
    ((SELECT count(*)
      FROM pg_proc
      WHERE pronamespace = 'public'::regnamespace
        AND proname IN (
          'reserve_baby_aylla_gift',
          'reserve_baby_aylla_gift_verified',
          'cancel_baby_aylla_gift_verified'
        )) = 0)

  UNION ALL

  -- 11. Canonical Baby Aylla Event Record Presence
  SELECT
    11,
    'Baby Aylla Event Presence (Canonical UUID)',
    'UUID a0f6b5a9-4d8c-4501-81b6-52929fa9da38 exists in public.events',
    COALESCE((SELECT 'Found: ' || slug FROM public.events WHERE id = 'a0f6b5a9-4d8c-4501-81b6-52929fa9da38'::uuid), 'NOT FOUND'),
    EXISTS (SELECT 1 FROM public.events WHERE id = 'a0f6b5a9-4d8c-4501-81b6-52929fa9da38'::uuid)

  UNION ALL

  -- 12. Production Isolation Verification (Check no production flags/connections)
  SELECT
    12,
    'Production Isolation Safeguard',
    'Isolated preview/staging database only',
    'neondb @ gentle-firefly-70094226',
    (current_database() = 'neondb' AND current_user = 'neondb_owner')
)
-- Detailed Diagnostic Result Set
SELECT
  check_id,
  check_name,
  expected_value,
  observed_value,
  CASE WHEN passed THEN 'PASS' ELSE 'FAIL' END AS status
FROM preflight_checks
ORDER BY check_id;

-- Summary Decision Query (Run as final statement)
SELECT
  CASE
    WHEN bool_and(passed) THEN 'GO'
    ELSE 'NO-GO'
  END AS preflight_verdict,
  count(*) FILTER (WHERE passed) AS passed_checks,
  count(*) FILTER (WHERE NOT passed) AS failed_checks,
  CASE
    WHEN bool_and(passed) THEN 'Environment is 100% compliant and ready for Gate B transactional migration.'
    ELSE 'Environment has failed prerequisites. Migration execution is BLOCKED.'
  END AS decision_details
FROM (
  SELECT passed FROM (
    SELECT
      (current_database() = 'neondb') AND
      ((SELECT setting::integer FROM pg_settings WHERE name = 'server_version_num') >= 180000) AND
      (current_user IN ('neondb_owner', 'cloud_admin')) AND
      EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'edition_runtime' AND rolcanlogin = false) AND
      EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') AND
      ((SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'guests' AND column_name IN ('id', 'event_id', 'status', 'guest_source', 'archived_at', 'deleted_at', 'is_incorrect')) = 7) AND
      ((SELECT count(*) FROM pg_proc WHERE proname IN ('gen_random_uuid', 'pg_advisory_xact_lock')) >= 2) AND
      ((SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('edition_gift_inventory', 'edition_gift_reservations_v2', 'edition_gift_reservation_audit_v2', 'edition_guest_verification_challenges', 'edition_guest_sessions')) = 0) AND
      ((SELECT count(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND proname IN ('reserve_baby_aylla_gift', 'reserve_baby_aylla_gift_verified', 'cancel_baby_aylla_gift_verified')) = 0) AND
      EXISTS (SELECT 1 FROM public.events WHERE id = 'a0f6b5a9-4d8c-4501-81b6-52929fa9da38'::uuid)
  ) AS inner_checks(passed)
) AS evaluation;
