-- HAXR Signature — RPC segura para leitura operacional de fornecedores (Fase E.4.3)
-- Migration 041 — aplicar apenas em preview/staging (uxleigndoomoezwsxlan).
--
-- Contexto: leitura directa de public.event_vendors via PostgREST/service_role pode falhar
-- com "permission denied for table event_vendors". Esta função SECURITY DEFINER agrega
-- fornecedores do evento operacional sem expor grants amplos a anon/authenticated.

CREATE OR REPLACE FUNCTION public.get_client_event_vendors(
  p_client_event_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_event public.client_events%ROWTYPE;
  v_vendors JSONB;
  v_summary JSONB;
  v_vendor_count INTEGER;
  v_active_vendors INTEGER;
  v_pending_vendors INTEGER;
  v_approved_vendors INTEGER;
  v_total_estimated NUMERIC(14, 2);
  v_categories JSONB;
  v_latest_vendor JSONB;
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
        'id', ev.id,
        'name', ev.name,
        'service_category', NULLIF(BTRIM(ev.service_category), ''),
        'contact_email', NULLIF(BTRIM(ev.contact_email), ''),
        'contact_phone', NULLIF(BTRIM(ev.contact_phone), ''),
        'proposed_amount', ev.proposed_amount,
        'currency', ev.currency::TEXT,
        'payment_terms', NULLIF(BTRIM(ev.payment_terms), ''),
        'deadline', ev.deadline,
        'notes', NULLIF(BTRIM(ev.notes), ''),
        'status', ev.status,
        'created_at', ev.created_at,
        'updated_at', ev.updated_at
      )
      ORDER BY ev.created_at DESC
    ),
    '[]'::JSONB
  )
  INTO v_vendors
  FROM public.event_vendors ev
  WHERE ev.event_id = v_client_event.operational_event_id;

  SELECT
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (
      WHERE LOWER(BTRIM(ev.status)) NOT LIKE '%rejeit%'
        AND LOWER(BTRIM(ev.status)) NOT LIKE '%conclu%'
    )::INTEGER,
    COUNT(*) FILTER (
      WHERE LOWER(BTRIM(ev.status)) LIKE '%analise%'
        OR LOWER(BTRIM(ev.status)) LIKE '%análise%'
        OR LOWER(BTRIM(ev.status)) LIKE '%pend%'
        OR LOWER(BTRIM(ev.status)) LIKE '%aguard%'
        OR LOWER(BTRIM(ev.status)) LIKE '%revis%'
    )::INTEGER,
    COUNT(*) FILTER (
      WHERE LOWER(BTRIM(ev.status)) LIKE '%aprov%'
        OR LOWER(BTRIM(ev.status)) LIKE '%assin%'
        OR LOWER(BTRIM(ev.status)) LIKE '%contrat%'
    )::INTEGER,
    COALESCE(SUM(ev.proposed_amount), 0)
  INTO
    v_vendor_count,
    v_active_vendors,
    v_pending_vendors,
    v_approved_vendors,
    v_total_estimated
  FROM public.event_vendors ev
  WHERE ev.event_id = v_client_event.operational_event_id;

  SELECT COALESCE(
    jsonb_agg(DISTINCT to_jsonb(NULLIF(BTRIM(ev.service_category), ''))),
    '[]'::JSONB
  )
  INTO v_categories
  FROM public.event_vendors ev
  WHERE ev.event_id = v_client_event.operational_event_id
    AND NULLIF(BTRIM(ev.service_category), '') IS NOT NULL;

  SELECT jsonb_build_object(
    'id', ev.id,
    'name', ev.name,
    'service_category', NULLIF(BTRIM(ev.service_category), ''),
    'status', ev.status,
    'proposed_amount', ev.proposed_amount,
    'currency', ev.currency::TEXT,
    'created_at', ev.created_at
  )
  INTO v_latest_vendor
  FROM public.event_vendors ev
  WHERE ev.event_id = v_client_event.operational_event_id
  ORDER BY ev.created_at DESC
  LIMIT 1;

  v_summary := jsonb_build_object(
    'vendorCount', v_vendor_count,
    'activeVendors', v_active_vendors,
    'pendingVendors', v_pending_vendors,
    'approvedVendors', v_approved_vendors,
    'totalEstimated', v_total_estimated,
    'categories', v_categories,
    'latestVendor', v_latest_vendor
  );

  RETURN jsonb_build_object(
    'vendors', v_vendors,
    'summary', v_summary
  );
END;
$$;

COMMENT ON FUNCTION public.get_client_event_vendors(UUID) IS
  'Lê fornecedores operacionais de um client_event via operational_event_id. Apenas service_role.';

REVOKE ALL ON FUNCTION public.get_client_event_vendors(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_client_event_vendors(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.get_client_event_vendors(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_client_event_vendors(UUID) TO service_role;
