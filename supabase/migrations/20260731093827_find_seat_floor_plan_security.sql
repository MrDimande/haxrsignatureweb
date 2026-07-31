-- Find Your Seat privacy hardening + secure Event Floor Plan.
-- Version aligned with the migration recorded by Supabase Preview.
-- Preview first. Existing QR codes receive a 30-day compatibility window.
-- Production rollout: deploy the backwards-compatible application first,
-- then apply this migration so printed legacy QR codes remain uninterrupted.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS find_seat_previous_code TEXT,
  ADD COLUMN IF NOT EXISTS find_seat_previous_code_valid_until TIMESTAMPTZ;

ALTER TABLE public.events
  ALTER COLUMN find_seat_code SET DEFAULT (
    'HXR-' || upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 24))
  );

UPDATE public.events
SET
  find_seat_previous_code = nullif(find_seat_code, ''),
  find_seat_previous_code_valid_until = CASE
    WHEN find_seat_code <> '' THEN now() + INTERVAL '30 days'
    ELSE NULL
  END,
  find_seat_code =
    'HXR-' || upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 24))
WHERE find_seat_code !~ '^HXR-[A-F0-9]{24}$';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.events'::regclass
      AND conname = 'events_find_seat_code_strong'
  ) THEN
    ALTER TABLE public.events
      ADD CONSTRAINT events_find_seat_code_strong
      CHECK (find_seat_code ~ '^HXR-[A-F0-9]{24}$');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.events'::regclass
      AND conname = 'events_find_seat_previous_code_shape'
  ) THEN
    ALTER TABLE public.events
      ADD CONSTRAINT events_find_seat_previous_code_shape
      CHECK (
        find_seat_previous_code IS NULL
        OR (
          char_length(find_seat_previous_code) BETWEEN 4 AND 64
          AND find_seat_previous_code ~ '^[A-Z0-9][A-Z0-9-]{3,63}$'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.events'::regclass
      AND conname = 'events_find_seat_previous_code_expiry'
  ) THEN
    ALTER TABLE public.events
      ADD CONSTRAINT events_find_seat_previous_code_expiry
      CHECK (
        (find_seat_previous_code IS NULL)
        = (find_seat_previous_code_valid_until IS NULL)
      );
  END IF;
END;
$$;

COMMENT ON COLUMN public.events.find_seat_previous_code IS
  'Previous Find Your Seat code retained only during a bounded QR compatibility window.';
COMMENT ON COLUMN public.events.find_seat_previous_code_valid_until IS
  'Hard expiry for the previous Find Your Seat code.';

CREATE OR REPLACE FUNCTION public.is_valid_event_floor_plan_room(
  p_room JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
STRICT
SET search_path = pg_catalog
AS $$
BEGIN
  IF jsonb_typeof(p_room) <> 'object'
    OR jsonb_typeof(p_room -> 'width') <> 'number'
    OR jsonb_typeof(p_room -> 'length') <> 'number'
    OR jsonb_typeof(p_room -> 'gridSize') <> 'number'
    OR p_room ->> 'unit' <> 'm'
  THEN
    RETURN FALSE;
  END IF;

  RETURN (p_room ->> 'width')::NUMERIC BETWEEN 4 AND 200
    AND (p_room ->> 'length')::NUMERIC BETWEEN 4 AND 200
    AND (p_room ->> 'gridSize')::NUMERIC BETWEEN 0.1 AND 5;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_valid_event_floor_plan_print_preferences(
  p_preferences JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
STRICT
SET search_path = pg_catalog
AS $$
BEGIN
  RETURN jsonb_typeof(p_preferences) = 'object'
    AND p_preferences ->> 'format' IN ('A4', 'A3')
    AND p_preferences ->> 'orientation' IN ('portrait', 'landscape')
    AND p_preferences ->> 'template'
      IN ('technical', 'client', 'staff', 'seating-chart')
    AND jsonb_typeof(p_preferences -> 'showGuestNames') = 'boolean';
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_valid_event_floor_plan_items(
  p_room JSONB,
  p_items JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
STRICT
SET search_path = pg_catalog
AS $$
DECLARE
  v_item JSONB;
  v_id TEXT;
  v_table_key TEXT;
  v_ids TEXT[] := ARRAY[]::TEXT[];
  v_table_keys TEXT[] := ARRAY[]::TEXT[];
  v_room_width NUMERIC;
  v_room_length NUMERIC;
  v_x NUMERIC;
  v_y NUMERIC;
  v_width NUMERIC;
  v_height NUMERIC;
  v_rotation NUMERIC;
BEGIN
  IF NOT public.is_valid_event_floor_plan_room(p_room)
    OR jsonb_typeof(p_items) <> 'array'
    OR jsonb_array_length(p_items) > 500
    OR pg_column_size(p_items) > 1048576
  THEN
    RETURN FALSE;
  END IF;

  v_room_width := (p_room ->> 'width')::NUMERIC;
  v_room_length := (p_room ->> 'length')::NUMERIC;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    IF jsonb_typeof(v_item) <> 'object'
      OR jsonb_typeof(v_item -> 'id') <> 'string'
      OR char_length(v_item ->> 'id') NOT BETWEEN 1 AND 160
      OR jsonb_typeof(v_item -> 'x') <> 'number'
      OR jsonb_typeof(v_item -> 'y') <> 'number'
      OR jsonb_typeof(v_item -> 'width') <> 'number'
      OR jsonb_typeof(v_item -> 'height') <> 'number'
      OR jsonb_typeof(v_item -> 'rotation') <> 'number'
      OR jsonb_typeof(v_item -> 'locked') <> 'boolean'
    THEN
      RETURN FALSE;
    END IF;

    v_id := v_item ->> 'id';
    IF v_id = ANY(v_ids) THEN
      RETURN FALSE;
    END IF;
    v_ids := array_append(v_ids, v_id);

    v_x := (v_item ->> 'x')::NUMERIC;
    v_y := (v_item ->> 'y')::NUMERIC;
    v_width := (v_item ->> 'width')::NUMERIC;
    v_height := (v_item ->> 'height')::NUMERIC;
    v_rotation := (v_item ->> 'rotation')::NUMERIC;

    IF v_x < 0
      OR v_y < 0
      OR v_width <= 0
      OR v_height <= 0
      OR v_width > 100
      OR v_height > 100
      OR v_x + v_width > v_room_width
      OR v_y + v_height > v_room_length
      OR v_rotation < 0
      OR v_rotation >= 360
    THEN
      RETURN FALSE;
    END IF;

    IF v_item ->> 'kind' = 'table' THEN
      IF jsonb_typeof(v_item -> 'tableKey') <> 'string'
        OR char_length(v_item ->> 'tableKey') NOT BETWEEN 1 AND 160
        OR jsonb_typeof(v_item -> 'sourceTableName') <> 'string'
        OR char_length(v_item ->> 'sourceTableName') NOT BETWEEN 1 AND 160
        OR v_item ->> 'shape'
          NOT IN ('round', 'rectangle', 'square', 'imperial', 'sweetheart')
      THEN
        RETURN FALSE;
      END IF;

      v_table_key := v_item ->> 'tableKey';
      IF v_table_key = ANY(v_table_keys) THEN
        RETURN FALSE;
      END IF;
      v_table_keys := array_append(v_table_keys, v_table_key);
    ELSIF v_item ->> 'kind' = 'element' THEN
      IF v_item ->> 'elementKind' NOT IN (
        'entrance',
        'exit',
        'stage',
        'dance-floor',
        'buffet',
        'bar',
        'dj',
        'cake',
        'photo',
        'wc',
        'wall',
        'column',
        'reserved',
        'text'
      )
        OR jsonb_typeof(v_item -> 'label') <> 'string'
        OR char_length(v_item ->> 'label') > 160
      THEN
        RETURN FALSE;
      END IF;
    ELSE
      RETURN FALSE;
    END IF;
  END LOOP;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

CREATE TABLE public.event_floor_plans (
  event_id UUID PRIMARY KEY REFERENCES public.events(id) ON DELETE CASCADE,
  room JSONB NOT NULL
    DEFAULT '{"width":20,"length":14,"gridSize":0.5,"unit":"m"}'::JSONB,
  items JSONB NOT NULL DEFAULT '[]'::JSONB,
  print_preferences JSONB NOT NULL
    DEFAULT '{"format":"A4","orientation":"landscape","template":"technical","showGuestNames":false}'::JSONB,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT event_floor_plans_room_valid
    CHECK (public.is_valid_event_floor_plan_room(room)),
  CONSTRAINT event_floor_plans_items_valid
    CHECK (public.is_valid_event_floor_plan_items(room, items)),
  CONSTRAINT event_floor_plans_print_preferences_valid
    CHECK (
      public.is_valid_event_floor_plan_print_preferences(print_preferences)
    )
);

COMMENT ON TABLE public.event_floor_plans IS
  'Server-only 2D floor plan geometry. Guests, seats and occupancy remain in operational tables.';
COMMENT ON COLUMN public.event_floor_plans.items IS
  'Validated visual layout; table items reference operational table names and never duplicate guest data.';

CREATE INDEX event_floor_plans_updated_at_idx
  ON public.event_floor_plans (updated_at DESC);

CREATE OR REPLACE FUNCTION public.touch_event_floor_plan_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER event_floor_plans_touch_updated_at
  BEFORE UPDATE ON public.event_floor_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_event_floor_plan_updated_at();

ALTER TABLE public.event_floor_plans ENABLE ROW LEVEL SECURITY;

-- No direct browser access. Admin Server Actions and the guarded public
-- Find Your Seat service use the service role on the server.
REVOKE ALL ON TABLE public.event_floor_plans FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.event_floor_plans
  TO service_role;

REVOKE ALL ON FUNCTION public.is_valid_event_floor_plan_room(JSONB)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_valid_event_floor_plan_print_preferences(JSONB)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_valid_event_floor_plan_items(JSONB, JSONB)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_event_floor_plan_updated_at()
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.is_valid_event_floor_plan_room(JSONB)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.is_valid_event_floor_plan_print_preferences(JSONB)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.is_valid_event_floor_plan_items(JSONB, JSONB)
  TO service_role;
