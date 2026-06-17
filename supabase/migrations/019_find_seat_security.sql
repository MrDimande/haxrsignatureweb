-- Find Your Seat: código de acesso por evento + rate limiting persistente

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS find_seat_code TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_events_find_seat_code
  ON events (id, find_seat_code)
  WHERE find_seat_code <> '';

-- Backfill códigos para eventos existentes
UPDATE events
SET find_seat_code = upper(
  coalesce(nullif(substr(regexp_replace(name, '[^a-zA-Z0-9]', '', 'g'), 1, 4), ''), 'HAXR')
  || substr(replace(id::text, '-', ''), 1, 4)
)
WHERE find_seat_code = '';

CREATE TABLE IF NOT EXISTS api_rate_limits (
  bucket_key TEXT PRIMARY KEY,
  request_count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION check_api_rate_limit(
  p_bucket_key TEXT,
  p_max_requests INTEGER,
  p_window_seconds INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
  v_row api_rate_limits%ROWTYPE;
  v_window_interval INTERVAL := make_interval(secs => p_window_seconds);
  v_elapsed INTERVAL;
  v_retry INTEGER;
BEGIN
  IF p_max_requests < 1 OR p_window_seconds < 1 THEN
    RETURN jsonb_build_object('allowed', true, 'remaining', p_max_requests, 'retry_after_seconds', 0);
  END IF;

  INSERT INTO api_rate_limits AS limits (bucket_key, request_count, window_start)
  VALUES (p_bucket_key, 1, v_now)
  ON CONFLICT (bucket_key) DO UPDATE
  SET
    request_count = CASE
      WHEN limits.window_start + v_window_interval <= v_now THEN 1
      ELSE limits.request_count + 1
    END,
    window_start = CASE
      WHEN limits.window_start + v_window_interval <= v_now THEN v_now
      ELSE limits.window_start
    END
  RETURNING * INTO v_row;

  v_elapsed := v_now - v_row.window_start;

  IF v_elapsed > v_window_interval THEN
    UPDATE api_rate_limits
    SET request_count = 1, window_start = v_now
    WHERE bucket_key = p_bucket_key
    RETURNING * INTO v_row;
    v_elapsed := interval '0';
  END IF;

  IF v_row.request_count > p_max_requests THEN
    v_retry := GREATEST(
      1,
      ceil(extract(epoch FROM (v_window_interval - v_elapsed)))::INTEGER
    );
    RETURN jsonb_build_object(
      'allowed', false,
      'remaining', 0,
      'retry_after_seconds', v_retry
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'remaining', GREATEST(0, p_max_requests - v_row.request_count),
    'retry_after_seconds', 0
  );
END;
$$;

REVOKE ALL ON FUNCTION check_api_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_api_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;
