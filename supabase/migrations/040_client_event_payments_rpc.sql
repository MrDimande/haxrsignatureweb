-- HAXR Signature — RPC segura para leitura operacional de pagamentos (Fase E.4.2)
-- Migration 040 — aplicar apenas em preview/staging (uxleigndoomoezwsxlan).
--
-- Contexto: leitura directa de public.payments via PostgREST/service_role pode falhar
-- com "permission denied for table payments". Esta função SECURITY DEFINER agrega
-- pagamentos do evento operacional sem expor grants amplos a anon/authenticated.

CREATE OR REPLACE FUNCTION public.get_client_event_payments(
  p_client_event_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_event public.client_events%ROWTYPE;
  v_payments JSONB;
  v_summary JSONB;
  v_payment_count INTEGER;
  v_total_paid NUMERIC(12, 2);
  v_pending_amount NUMERIC(12, 2);
  v_estimated_budget NUMERIC(12, 2);
  v_currency TEXT;
  v_last_payment JSONB;
  v_budget_range TEXT;
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
        'id', p.id,
        'amount', p.amount,
        'currency', p.currency::TEXT,
        'payment_method', p.payment_method::TEXT,
        'reference', NULLIF(BTRIM(p.reference), ''),
        'notes', NULLIF(BTRIM(p.notes), ''),
        'paid_at', p.paid_at,
        'created_at', p.created_at,
        'document',
          CASE
            WHEN d.id IS NULL THEN NULL
            ELSE jsonb_build_object(
              'number', d.document_number,
              'client_name', NULLIF(BTRIM(d.client_name), '')
            )
          END
      )
      ORDER BY p.paid_at DESC
    ),
    '[]'::JSONB
  )
  INTO v_payments
  FROM public.payments p
  LEFT JOIN public.documents d ON d.id = p.document_id
  WHERE p.event_id = v_client_event.operational_event_id;

  SELECT
    COUNT(*)::INTEGER,
    COALESCE(SUM(p.amount), 0),
    COALESCE(MAX(p.currency::TEXT), 'MZN')
  INTO
    v_payment_count,
    v_total_paid,
    v_currency
  FROM public.payments p
  WHERE p.event_id = v_client_event.operational_event_id;

  v_estimated_budget := COALESCE(
    v_client_event.budget_max::NUMERIC,
    v_client_event.budget_min::NUMERIC,
    0
  );

  v_pending_amount := GREATEST(v_estimated_budget - v_total_paid, 0);

  IF v_client_event.budget_min IS NOT NULL AND v_client_event.budget_max IS NOT NULL THEN
    v_budget_range := v_client_event.budget_min::TEXT || '-' || v_client_event.budget_max::TEXT;
  ELSIF v_client_event.budget_min IS NOT NULL THEN
    v_budget_range := v_client_event.budget_min::TEXT;
  ELSIF v_client_event.budget_max IS NOT NULL THEN
    v_budget_range := v_client_event.budget_max::TEXT;
  ELSE
    v_budget_range := NULL;
  END IF;

  SELECT jsonb_build_object(
    'id', p.id,
    'amount', p.amount,
    'currency', p.currency::TEXT,
    'payment_method', p.payment_method::TEXT,
    'reference', NULLIF(BTRIM(p.reference), ''),
    'paid_at', p.paid_at
  )
  INTO v_last_payment
  FROM public.payments p
  WHERE p.event_id = v_client_event.operational_event_id
  ORDER BY p.paid_at DESC
  LIMIT 1;

  v_summary := jsonb_build_object(
    'paymentCount', v_payment_count,
    'totalPayments', v_total_paid,
    'totalPaid', v_total_paid,
    'pendingAmount', v_pending_amount,
    'currency', v_currency,
    'budgetMin', v_client_event.budget_min,
    'budgetMax', v_client_event.budget_max,
    'budgetRange', v_budget_range,
    'lastPayment', v_last_payment
  );

  RETURN jsonb_build_object(
    'payments', v_payments,
    'summary', v_summary
  );
END;
$$;

COMMENT ON FUNCTION public.get_client_event_payments(UUID) IS
  'Lê pagamentos operacionais de um client_event via operational_event_id. Apenas service_role.';

REVOKE ALL ON FUNCTION public.get_client_event_payments(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_client_event_payments(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.get_client_event_payments(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_client_event_payments(UUID) TO service_role;
