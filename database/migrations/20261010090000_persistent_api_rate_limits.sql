-- Persistent, cross-instance rate limiting for public authentication routes.
--
-- This migration is additive and compatible with the pre-portal application:
-- it only introduces an isolated state table and functions that old builds do
-- not call. Apply with a direct Neon connection after Preview verification.

BEGIN;

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  bucket_key TEXT PRIMARY KEY,
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  window_start TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.check_api_rate_limit(
  p_bucket_key TEXT,
  p_max_requests INTEGER,
  p_window_seconds INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
  v_window_interval INTERVAL := make_interval(secs => p_window_seconds);
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
  v_retry INTEGER;
BEGIN
  IF p_bucket_key IS NULL OR char_length(p_bucket_key) = 0 OR char_length(p_bucket_key) > 512 THEN
    RAISE EXCEPTION 'invalid_rate_limit_bucket_key' USING ERRCODE = '22023';
  END IF;
  IF p_max_requests < 1 OR p_window_seconds < 1 THEN
    RAISE EXCEPTION 'invalid_rate_limit_window' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.api_rate_limits AS limits (bucket_key, request_count, window_start)
  VALUES (p_bucket_key, 1, v_now)
  ON CONFLICT (bucket_key) DO UPDATE
  SET request_count = CASE
        WHEN limits.window_start + v_window_interval <= v_now THEN 1
        ELSE limits.request_count + 1
      END,
      window_start = CASE
        WHEN limits.window_start + v_window_interval <= v_now THEN v_now
        ELSE limits.window_start
      END
  RETURNING request_count, window_start INTO v_count, v_window_start;

  IF v_count > p_max_requests THEN
    v_retry := GREATEST(1, ceil(extract(epoch FROM (v_window_start + v_window_interval - v_now)))::INTEGER);
    RETURN jsonb_build_object('allowed', false, 'remaining', 0, 'retry_after_seconds', v_retry);
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'remaining', GREATEST(0, p_max_requests - v_count),
    'retry_after_seconds', 0
  );
END;
$$;

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

REVOKE ALL ON TABLE public.api_rate_limits FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_api_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refund_api_rate_limit(TEXT) FROM PUBLIC;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'haxrweb_runtime') THEN
    RAISE EXCEPTION 'Role de runtime haxrweb_runtime nao encontrada na base de dados. A migracao requer a presenca previa do papel de runtime.';
  END IF;

  GRANT USAGE ON SCHEMA public TO haxrweb_runtime;
  -- Revoke direct mutation rights that default privileges may have granted
  REVOKE INSERT, UPDATE ON TABLE public.api_rate_limits FROM haxrweb_runtime;
  -- SELECT reads the current bucket only; DELETE is limited to the authenticated cron route.
  GRANT SELECT, DELETE ON TABLE public.api_rate_limits TO haxrweb_runtime;
  GRANT EXECUTE ON FUNCTION public.check_api_rate_limit(TEXT, INTEGER, INTEGER) TO haxrweb_runtime;
  GRANT EXECUTE ON FUNCTION public.refund_api_rate_limit(TEXT) TO haxrweb_runtime;
END $$;

COMMIT;
