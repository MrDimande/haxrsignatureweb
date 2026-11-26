-- ==============================================================================
-- HAXR Core — Baby Aylla Gift Registry — Gate E
-- ADDITIVE PRODUCTION HARDENING, MULTI-INSTANCE RATE LIMIT & ADMIN RPC MIGRATION
-- ==============================================================================
-- Sequence: Runs strictly AFTER 20261122120000_baby_aylla_gift_registry_phase_c3.sql
-- and BEFORE 20261125120200_baby_aylla_gift_registry_catalog_seed_pending.sql.
--
-- 1. Enhances resolve_baby_aylla_guest_by_contact with Mozambican phone digit
--    canonicalization (+258 / 00258 / 9-digit local) and matched-channel return.
-- 2. Adds RLS-protected table public.edition_gift_rate_limits and atomic RPC
--    consume_baby_aylla_rate_limit(...) so OTP & challenge throttling are
--    enforced consistently across multi-instance serverless workers.
-- 3. Adds SECURITY DEFINER inventory approval & reservation listing RPCs for
--    haxr_aylla_gift_admin without granting direct table writes or guest SELECT.
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
    AND (
      (v_is_email AND lower(trim(COALESCE(g.email, ''))) = lower(v_trimmed))
      OR (
        NOT v_is_email
        AND length(v_canonical_digits) >= 8
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
    )
  ORDER BY
    (g.archived_at IS NULL AND g.deleted_at IS NULL AND g.is_incorrect = false) DESC,
    (g.status = 'confirmed' AND g.guest_source = 'edition_rsvp') DESC,
    g.updated_at DESC
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_baby_aylla_guest_by_contact(text) FROM PUBLIC, haxr_aylla_gift_admin;
GRANT EXECUTE ON FUNCTION public.resolve_baby_aylla_guest_by_contact(text) TO haxr_aylla_gift_issuer;
GRANT EXECUTE ON FUNCTION public.resolve_baby_aylla_guest_by_contact(text) TO haxr_aylla_gift_runtime;

CREATE TABLE IF NOT EXISTS public.edition_gift_rate_limits (
  bucket_hash text PRIMARY KEY CHECK (length(bucket_hash) = 64),
  request_count integer NOT NULL CHECK (request_count >= 0),
  window_started_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

ALTER TABLE public.edition_gift_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edition_gift_rate_limits FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.edition_gift_rate_limits
  FROM PUBLIC, haxr_aylla_gift_issuer, haxr_aylla_gift_runtime, haxr_aylla_gift_admin;

CREATE OR REPLACE FUNCTION public.consume_baby_aylla_rate_limit(
  p_bucket_key text,
  p_max_requests integer,
  p_window_ms integer
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_bucket_hash text;
  v_window interval;
  v_count integer;
BEGIN
  IF p_max_requests IS NULL OR p_max_requests < 1
     OR p_window_ms IS NULL OR p_window_ms < 1
     OR length(trim(COALESCE(p_bucket_key, ''))) = 0 THEN
    RETURN false;
  END IF;

  v_bucket_hash := encode(sha256(p_bucket_key::bytea), 'hex');
  v_window := (p_window_ms::double precision / 1000.0) * interval '1 second';

  INSERT INTO public.edition_gift_rate_limits AS rl (
    bucket_hash,
    request_count,
    window_started_at,
    updated_at
  )
  VALUES (
    v_bucket_hash,
    1,
    v_now,
    v_now
  )
  ON CONFLICT (bucket_hash) DO UPDATE
  SET request_count = CASE
        WHEN rl.window_started_at + v_window <= v_now THEN 1
        ELSE rl.request_count + 1
      END,
      window_started_at = CASE
        WHEN rl.window_started_at + v_window <= v_now THEN v_now
        ELSE rl.window_started_at
      END,
      updated_at = v_now
  RETURNING rl.request_count INTO v_count;

  RETURN v_count <= p_max_requests;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_baby_aylla_rate_limit(text, integer, integer)
  FROM PUBLIC, haxr_aylla_gift_admin;
GRANT EXECUTE ON FUNCTION public.consume_baby_aylla_rate_limit(text, integer, integer)
  TO haxr_aylla_gift_issuer;
GRANT EXECUTE ON FUNCTION public.consume_baby_aylla_rate_limit(text, integer, integer)
  TO haxr_aylla_gift_runtime;

CREATE OR REPLACE FUNCTION public.upsert_baby_aylla_gift_inventory_admin(
  p_event_id uuid,
  p_admin_id uuid,
  p_item_id text,
  p_family_approved boolean,
  p_enabled boolean,
  p_approved_quantity integer,
  p_specifications_complete boolean,
  p_child_safety_validated boolean
) RETURNS public.edition_gift_inventory
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_reserved integer := 0;
  v_now timestamptz := clock_timestamp();
  v_row public.edition_gift_inventory;
BEGIN
  IF p_event_id <> 'a0f6b5a9-4d8c-4501-81b6-52929fa9da38'::uuid THEN
    RAISE EXCEPTION 'invalid event scope for inventory update' USING ERRCODE = '42501';
  END IF;

  IF p_item_id IS NULL OR length(trim(p_item_id)) = 0 OR length(trim(p_item_id)) > 120 THEN
    RAISE EXCEPTION 'invalid gift item identifier' USING ERRCODE = '22023';
  END IF;

  PERFORM 1 FROM public.admin_users AS a
  WHERE a.id = p_admin_id
    AND a.status = 'active'
    AND a.role IN ('OWNER', 'ADMIN', 'EVENT_MANAGER');
  IF NOT FOUND THEN
    RAISE EXCEPTION 'unauthorized admin actor' USING ERRCODE = '42501';
  END IF;

  IF p_approved_quantity IS NOT NULL AND p_approved_quantity <= 0 THEN
    RAISE EXCEPTION 'approved quantity must be positive or null' USING ERRCODE = '22023';
  END IF;

  IF p_enabled AND (
    NOT p_family_approved
    OR p_approved_quantity IS NULL
    OR p_approved_quantity <= 0
    OR NOT p_specifications_complete
    OR NOT p_child_safety_validated
  ) THEN
    RAISE EXCEPTION 'cannot enable gift item before approval, quantity, specifications, and safety review'
      USING ERRCODE = '23514';
  END IF;

  SELECT COALESCE(sum(quantity), 0)::integer INTO v_reserved
  FROM public.edition_gift_reservations_v2
  WHERE event_id = p_event_id
    AND item_id = trim(p_item_id)
    AND status IN ('reserved', 'purchased', 'delivered');

  IF p_approved_quantity IS NOT NULL AND p_approved_quantity < v_reserved THEN
    RAISE EXCEPTION 'approved quantity cannot be lower than active reserved quantity (%)', v_reserved
      USING ERRCODE = '23514';
  END IF;

  INSERT INTO public.edition_gift_inventory (
    event_id,
    registry_key,
    item_id,
    family_approved,
    enabled,
    approved_quantity,
    specifications_complete,
    child_safety_validated,
    created_at,
    updated_at
  )
  VALUES (
    p_event_id,
    'baby-aylla-couture',
    trim(p_item_id),
    COALESCE(p_family_approved, false),
    COALESCE(p_enabled, false),
    p_approved_quantity,
    COALESCE(p_specifications_complete, false),
    COALESCE(p_child_safety_validated, false),
    v_now,
    v_now
  )
  ON CONFLICT (event_id, item_id) DO UPDATE
  SET family_approved = EXCLUDED.family_approved,
      enabled = EXCLUDED.enabled,
      approved_quantity = EXCLUDED.approved_quantity,
      specifications_complete = EXCLUDED.specifications_complete,
      child_safety_validated = EXCLUDED.child_safety_validated,
      updated_at = v_now
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_baby_aylla_gift_admin_reservations(
  p_event_id uuid,
  p_admin_id uuid
) RETURNS TABLE (
  id uuid,
  event_id uuid,
  item_id text,
  guest_id uuid,
  guest_name text,
  guest_phone text,
  guest_email text,
  guest_status guest_status,
  quantity integer,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  cancelled_at timestamptz,
  purchased_at timestamptz,
  delivered_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF p_event_id <> 'a0f6b5a9-4d8c-4501-81b6-52929fa9da38'::uuid THEN
    RAISE EXCEPTION 'invalid event scope for admin reservation listing' USING ERRCODE = '42501';
  END IF;

  PERFORM 1 FROM public.admin_users AS a
  WHERE a.id = p_admin_id
    AND a.status = 'active'
    AND a.role IN ('OWNER', 'ADMIN', 'EVENT_MANAGER');
  IF NOT FOUND THEN
    RAISE EXCEPTION 'unauthorized admin actor' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    r.id,
    r.event_id,
    r.item_id,
    r.guest_id,
    g.name,
    g.phone,
    g.email,
    g.status,
    r.quantity,
    r.status,
    r.created_at,
    r.updated_at,
    r.cancelled_at,
    r.purchased_at,
    r.delivered_at
  FROM public.edition_gift_reservations_v2 AS r
  INNER JOIN public.guests AS g
    ON g.id = r.guest_id AND g.event_id = r.event_id
  WHERE r.event_id = p_event_id
  ORDER BY r.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_baby_aylla_gift_inventory_admin(uuid, uuid, text, boolean, boolean, integer, boolean, boolean) FROM PUBLIC, haxr_aylla_gift_issuer, haxr_aylla_gift_runtime;
GRANT EXECUTE ON FUNCTION public.upsert_baby_aylla_gift_inventory_admin(uuid, uuid, text, boolean, boolean, integer, boolean, boolean) TO haxr_aylla_gift_admin;

REVOKE ALL ON FUNCTION public.list_baby_aylla_gift_admin_reservations(uuid, uuid) FROM PUBLIC, haxr_aylla_gift_issuer, haxr_aylla_gift_runtime;
GRANT EXECUTE ON FUNCTION public.list_baby_aylla_gift_admin_reservations(uuid, uuid) TO haxr_aylla_gift_admin;

COMMIT;
