-- HAXR Signature — RPC segura para leitura operacional de convidados (Fase E.4.1)
-- Migration 039 — aplicar apenas em preview/staging (uxleigndoomoezwsxlan).
--
-- Contexto: leitura directa de public.guests via PostgREST/service_role falha com
-- "permission denied for table guests". Esta função SECURITY DEFINER agrega guests,
-- seats, guest_groups e checkins sem expor grants amplos a anon/authenticated.

CREATE OR REPLACE FUNCTION public.get_client_event_guests(
  p_client_event_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_event public.client_events%ROWTYPE;
  v_guests JSONB;
  v_summary JSONB;
  v_tables_total INTEGER;
  v_total INTEGER;
  v_confirmed INTEGER;
  v_pending INTEGER;
  v_declined INTEGER;
  v_plus_ones BIGINT;
  v_tables_assigned INTEGER;
BEGIN
  SELECT *
  INTO v_client_event
  FROM public.client_events
  WHERE id = p_client_event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'client_event_not_found: %', p_client_event_id
      USING ERRCODE = 'P0001';
  END IF;

  IF v_client_event.operational_event_id IS NULL THEN
    RAISE EXCEPTION 'operational_not_linked: %', p_client_event_id
      USING ERRCODE = 'P0001';
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', g.id,
        'name', g.name,
        'email', NULLIF(BTRIM(g.email), ''),
        'phone', NULLIF(BTRIM(g.phone), ''),
        'status', g.status::TEXT,
        'plus_ones', g.plus_ones,
        'seat_id', g.seat_id,
        'qr_token', g.qr_token,
        'seats',
          CASE
            WHEN s.id IS NULL THEN NULL
            ELSE jsonb_build_object(
              'table_name', s.table_name,
              'seat_number', s.seat_number,
              'label', s.label
            )
          END,
        'guest_groups',
          CASE
            WHEN gg.id IS NULL THEN NULL
            ELSE jsonb_build_object('name', gg.name)
          END,
        'checkins',
          CASE
            WHEN c.id IS NULL THEN NULL
            ELSE jsonb_build_object('checkin_time', c.checkin_time)
          END
      )
      ORDER BY g.name ASC
    ),
    '[]'::JSONB
  )
  INTO v_guests
  FROM public.guests g
  LEFT JOIN public.seats s ON s.id = g.seat_id
  LEFT JOIN public.guest_groups gg ON gg.id = g.group_id
  LEFT JOIN public.checkins c ON c.guest_id = g.id
  WHERE g.event_id = v_client_event.operational_event_id;

  SELECT COUNT(*)
  INTO v_tables_total
  FROM public.seats
  WHERE event_id = v_client_event.operational_event_id;

  SELECT
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (
      WHERE g.status IN ('confirmed'::guest_status, 'checked_in'::guest_status)
    )::INTEGER,
    COUNT(*) FILTER (
      WHERE g.status = 'invited'::guest_status
    )::INTEGER,
    COUNT(*) FILTER (
      WHERE g.status = 'declined'::guest_status
    )::INTEGER,
    COALESCE(SUM(g.plus_ones), 0),
    COUNT(*) FILTER (
      WHERE g.seat_id IS NOT NULL
    )::INTEGER
  INTO
    v_total,
    v_confirmed,
    v_pending,
    v_declined,
    v_plus_ones,
    v_tables_assigned
  FROM public.guests g
  WHERE g.event_id = v_client_event.operational_event_id;

  v_summary := jsonb_build_object(
    'total', v_total,
    'confirmed', v_confirmed,
    'pending', v_pending,
    'declined', v_declined,
    'plusOnes', v_plus_ones,
    'tablesAssigned', v_tables_assigned,
    'tablesTotal', v_tables_total
  );

  RETURN jsonb_build_object(
    'guests', v_guests,
    'summary', v_summary
  );
END;
$$;

COMMENT ON FUNCTION public.get_client_event_guests(UUID) IS
  'Lê convidados operacionais de um client_event via operational_event_id. Apenas service_role.';

REVOKE ALL ON FUNCTION public.get_client_event_guests(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_client_event_guests(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.get_client_event_guests(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_client_event_guests(UUID) TO service_role;
