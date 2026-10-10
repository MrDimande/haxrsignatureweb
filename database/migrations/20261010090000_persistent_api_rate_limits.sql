-- Incremental migration for public client portal authentication rate limits.
-- Note: 'api_rate_limits' and 'check_api_rate_limit' already exist in Production
-- and are actively shared with the Edition subsystem ('edition_runtime').
-- This migration solely introduces 'refund_api_rate_limit' and ensures least-privilege
-- grants for the web runtime role ('haxrweb_runtime').

BEGIN;

CREATE OR REPLACE FUNCTION public.refund_api_rate_limit(
  p_bucket_key TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF p_bucket_key IS NULL OR char_length(p_bucket_key) = 0 THEN
    RETURN;
  END IF;

  UPDATE public.api_rate_limits
     SET request_count = GREATEST(0, request_count - 1)
   WHERE bucket_key = p_bucket_key;
END;
$$;

REVOKE ALL ON FUNCTION public.refund_api_rate_limit(TEXT) FROM PUBLIC;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'haxrweb_runtime') THEN
    RAISE EXCEPTION 'Role de runtime haxrweb_runtime nao encontrada na base de dados. A migracao requer a presenca previa do papel de runtime.';
  END IF;

  GRANT USAGE ON SCHEMA public TO haxrweb_runtime;
  -- Revoke direct mutation rights that default privileges may have granted
  REVOKE INSERT, UPDATE ON TABLE public.api_rate_limits FROM haxrweb_runtime;
  -- SELECT reads current bucket; DELETE is limited to the authenticated cron route.
  GRANT SELECT, DELETE ON TABLE public.api_rate_limits TO haxrweb_runtime;
  GRANT EXECUTE ON FUNCTION public.check_api_rate_limit(TEXT, INTEGER, INTEGER) TO haxrweb_runtime;
  GRANT EXECUTE ON FUNCTION public.refund_api_rate_limit(TEXT) TO haxrweb_runtime;
END $$;

COMMIT;
