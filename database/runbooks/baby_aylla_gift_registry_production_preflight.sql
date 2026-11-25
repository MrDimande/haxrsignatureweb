-- ==============================================================================
-- HAXR Core — Baby Aylla Gift Registry — Gate E
-- REPRODUCIBLE READ-ONLY PRODUCTION PREFLIGHT SCRIPT
-- ==============================================================================
-- Target Environment: Neon PostgreSQL (HAXR-Business-Suite / branch production)
-- Expected Project ID: little-band-06036174
-- Target Database: neondb
--
-- Safety Guarantee:
-- 100% READ-ONLY SELECT diagnostic checks. ZERO DDL, ZERO mutations, ZERO locks.
-- Checks role separation, zero inherited memberships, canonical event identity,
-- absence of synthetic/canary contamination, and prerequisite admin/guest tables.
-- ==============================================================================

WITH preflight_checks AS (
  SELECT
    1 AS check_id,
    'Database Name' AS check_name,
    'neondb' AS expected_value,
    current_database() AS observed_value,
    (current_database() = 'neondb') AS passed

  UNION ALL

  SELECT
    2,
    'PostgreSQL Engine Version',
    'PostgreSQL 18.x (>= 180000)',
    version(),
    ((SELECT setting::integer FROM pg_settings WHERE name = 'server_version_num') >= 180000)

  UNION ALL

  SELECT
    3,
    'Connection User Authority',
    'neondb_owner or cloud_admin',
    current_user,
    (current_user IN ('neondb_owner', 'cloud_admin'))

  UNION ALL

  SELECT
    4,
    'Prerequisite Role: edition_runtime',
    'Role exists with rolsuper = false and rolbypassrls = false',
    COALESCE((
      SELECT 'exists (login=' || rolcanlogin::text || ', super=' || rolsuper::text || ', bypassrls=' || rolbypassrls::text || ')'
      FROM pg_roles WHERE rolname = 'edition_runtime'
    ), 'MISSING'),
    EXISTS (
      SELECT 1 FROM pg_roles
      WHERE rolname = 'edition_runtime'
        AND rolsuper = false
        AND rolbypassrls = false
    )

  UNION ALL

  SELECT
    5,
    'Role: haxr_aylla_gift_issuer',
    'LOGIN, INHERIT, NOSUPERUSER, NOCREATEROLE, NOCREATEDB, NOBYPASSRLS, member_of={}',
    COALESCE((
      SELECT 'exists (login=' || r.rolcanlogin::text || ', inherit=' || r.rolinherit::text
        || ', super=' || r.rolsuper::text || ', bypassrls=' || r.rolbypassrls::text
        || ', memberships=' || (SELECT count(*) FROM pg_auth_members am WHERE am.member = r.oid)::text || ')'
      FROM pg_roles r WHERE r.rolname = 'haxr_aylla_gift_issuer'
    ), 'MISSING — provision via Neon CLI / PASSWORD NULL procedure first'),
    EXISTS (
      SELECT 1 FROM pg_roles r
      WHERE r.rolname = 'haxr_aylla_gift_issuer'
        AND r.rolcanlogin = true AND r.rolinherit = true
        AND r.rolsuper = false AND r.rolcreaterole = false
        AND r.rolcreatedb = false AND r.rolbypassrls = false
        AND NOT EXISTS (SELECT 1 FROM pg_auth_members am WHERE am.member = r.oid)
    )

  UNION ALL

  SELECT
    6,
    'Role: haxr_aylla_gift_runtime',
    'LOGIN, INHERIT, NOSUPERUSER, NOCREATEROLE, NOCREATEDB, NOBYPASSRLS, member_of={}',
    COALESCE((
      SELECT 'exists (login=' || r.rolcanlogin::text || ', inherit=' || r.rolinherit::text
        || ', super=' || r.rolsuper::text || ', bypassrls=' || r.rolbypassrls::text
        || ', memberships=' || (SELECT count(*) FROM pg_auth_members am WHERE am.member = r.oid)::text || ')'
      FROM pg_roles r WHERE r.rolname = 'haxr_aylla_gift_runtime'
    ), 'MISSING — provision via Neon CLI / PASSWORD NULL procedure first'),
    EXISTS (
      SELECT 1 FROM pg_roles r
      WHERE r.rolname = 'haxr_aylla_gift_runtime'
        AND r.rolcanlogin = true AND r.rolinherit = true
        AND r.rolsuper = false AND r.rolcreaterole = false
        AND r.rolcreatedb = false AND r.rolbypassrls = false
        AND NOT EXISTS (SELECT 1 FROM pg_auth_members am WHERE am.member = r.oid)
    )

  UNION ALL

  SELECT
    7,
    'Role: haxr_aylla_gift_admin',
    'LOGIN, INHERIT, NOSUPERUSER, NOCREATEROLE, NOCREATEDB, NOBYPASSRLS, member_of={}',
    COALESCE((
      SELECT 'exists (login=' || r.rolcanlogin::text || ', inherit=' || r.rolinherit::text
        || ', super=' || r.rolsuper::text || ', bypassrls=' || r.rolbypassrls::text
        || ', memberships=' || (SELECT count(*) FROM pg_auth_members am WHERE am.member = r.oid)::text || ')'
      FROM pg_roles r WHERE r.rolname = 'haxr_aylla_gift_admin'
    ), 'MISSING — provision via Neon CLI / PASSWORD NULL procedure first'),
    EXISTS (
      SELECT 1 FROM pg_roles r
      WHERE r.rolname = 'haxr_aylla_gift_admin'
        AND r.rolcanlogin = true AND r.rolinherit = true
        AND r.rolsuper = false AND r.rolcreaterole = false
        AND r.rolcreatedb = false AND r.rolbypassrls = false
        AND NOT EXISTS (SELECT 1 FROM pg_auth_members am WHERE am.member = r.oid)
    )

  UNION ALL

  SELECT
    8,
    'Canonical Event Identity (Baby Aylla)',
    'Single production event a0f6b5a9-4d8c-4501-81b6-52929fa9da38 (business=haxr-signature, key=baby-aylla-couture)',
    COALESCE((
      SELECT id::text || ' | ' || business_id || ' | ' || name || ' | active=' || is_active::text
      FROM public.events
      WHERE id = 'a0f6b5a9-4d8c-4501-81b6-52929fa9da38'::uuid
    ), 'MISSING'),
    (
      EXISTS (
        SELECT 1 FROM public.events
        WHERE id = 'a0f6b5a9-4d8c-4501-81b6-52929fa9da38'::uuid
          AND business_id = 'haxr-signature'
          AND edition_registry_key = 'baby-aylla-couture'
          AND is_active = true
      )
      AND (SELECT count(*) FROM public.events WHERE edition_registry_key = 'baby-aylla-couture') = 1
    )

  UNION ALL

  SELECT
    9,
    'Zero Synthetic / Canary Contamination',
    'Zero haxr-canary-lab businesses or f47ac10b/e2b1c3d4/.test guests in production',
    (
      SELECT 'canary_businesses=' || (SELECT count(*) FROM public.businesses WHERE id = 'haxr-canary-lab')
          || ', canary_events=' || (SELECT count(*) FROM public.events WHERE id = 'cc608a8d-3cb9-47f0-955d-8d1be3f30faf'::uuid OR business_id = 'haxr-canary-lab')
          || ', synthetic_guests=' || (SELECT count(*) FROM public.guests WHERE id IN ('f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid, 'e2b1c3d4-5e6f-7a8b-9c0d-1e2f3a4b5c6d'::uuid) OR email LIKE '%@haxrsignature.test')
    ),
    (
      NOT EXISTS (SELECT 1 FROM public.businesses WHERE id = 'haxr-canary-lab')
      AND NOT EXISTS (SELECT 1 FROM public.events WHERE id = 'cc608a8d-3cb9-47f0-955d-8d1be3f30faf'::uuid OR business_id = 'haxr-canary-lab')
      AND NOT EXISTS (SELECT 1 FROM public.guests WHERE id IN ('f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid, 'e2b1c3d4-5e6f-7a8b-9c0d-1e2f3a4b5c6d'::uuid) OR email LIKE '%@haxrsignature.test')
    )

  UNION ALL

  SELECT
    10,
    'Active Admin Actors Available (OWNER/ADMIN/EVENT_MANAGER)',
    'At least 1 active admin_users record',
    (SELECT count(*)::text || ' active eligible admin(s)' FROM public.admin_users WHERE status = 'active' AND role IN ('OWNER', 'ADMIN', 'EVENT_MANAGER')),
    EXISTS (SELECT 1 FROM public.admin_users WHERE status = 'active' AND role IN ('OWNER', 'ADMIN', 'EVENT_MANAGER'))

  UNION ALL

  SELECT
    11,
    'Canonical Guests Schema Compatibility',
    'Required columns present on public.guests',
    (SELECT count(*)::text || ' of 9 columns present'
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'guests'
       AND column_name IN ('id', 'event_id', 'name', 'email', 'phone', 'status', 'guest_source', 'archived_at', 'deleted_at')),
    ((SELECT count(*)
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'guests'
        AND column_name IN ('id', 'event_id', 'name', 'email', 'phone', 'status', 'guest_source', 'archived_at', 'deleted_at')) = 9)

  UNION ALL

  SELECT
    12,
    'PostgreSQL Cryptographic & Lock Primitives',
    'gen_random_uuid, pg_advisory_xact_lock, sha256',
    (SELECT count(DISTINCT proname)::text || ' of 3 functions present'
     FROM pg_proc WHERE proname IN ('gen_random_uuid', 'pg_advisory_xact_lock', 'sha256')),
    ((SELECT count(DISTINCT proname) FROM pg_proc WHERE proname IN ('gen_random_uuid', 'pg_advisory_xact_lock', 'sha256')) = 3)
)
SELECT
  check_id,
  check_name,
  CASE WHEN passed THEN 'PASS' ELSE 'FAIL' END AS status,
  expected_value,
  observed_value
FROM preflight_checks
UNION ALL
SELECT
  999,
  '>>> PRODUCTION PREFLIGHT VERDICT <<<',
  CASE WHEN bool_and(passed) THEN 'GO' ELSE 'NO-GO' END,
  'ALL 12 CHECKS MUST PASS BEFORE PRODUCTION MIGRATION',
  count(*) FILTER (WHERE passed)::text || ' / ' || count(*)::text || ' passed'
FROM preflight_checks
ORDER BY check_id;
