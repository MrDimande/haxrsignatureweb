-- HAXR Signature — Reconciliação Financeira Persistente: Fornecedores, Contratos e Pagamentos
-- Migration 047 — Idempotente e segura para aplicação em preview, staging e production.

-- 1. Extensão da tabela event_vendors para suporte a valores contratados e estado de assinatura
ALTER TABLE public.event_vendors
  ADD COLUMN IF NOT EXISTS contracted_amount NUMERIC(14, 2);

ALTER TABLE public.event_vendors
  ADD COLUMN IF NOT EXISTS contract_signed BOOLEAN NOT NULL DEFAULT false;

-- 2. Extensão da tabela payments com relação explícita a fornecedores e contratos
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.event_vendors(id) ON DELETE SET NULL;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES public.documents(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_payments_vendor_id ON public.payments (vendor_id);
CREATE INDEX IF NOT EXISTS idx_payments_contract_id ON public.payments (contract_id);

-- 3. Actualização da RPC get_client_event_payments para devolver vendor_id e contract_id
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
        'vendor_id', p.vendor_id,
        'contract_id', p.contract_id,
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

  SELECT
    CASE
      WHEN p.id IS NULL THEN NULL
      ELSE jsonb_build_object(
        'id', p.id,
        'amount', p.amount,
        'currency', p.currency::TEXT,
        'payment_method', p.payment_method::TEXT,
        'reference', NULLIF(BTRIM(p.reference), ''),
        'paid_at', p.paid_at,
        'vendor_id', p.vendor_id,
        'contract_id', p.contract_id
      )
    END
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

-- 4. Actualização da RPC get_client_event_vendors para devolver proposed_amount e contracted_amount
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
  v_total_contracted NUMERIC(14, 2);
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
        'contracted_amount', ev.contracted_amount,
        'contract_signed', ev.contract_signed,
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
        OR ev.contract_signed = true
    )::INTEGER,
    COALESCE(SUM(ev.proposed_amount), 0),
    COALESCE(SUM(COALESCE(ev.contracted_amount, ev.proposed_amount)), 0)
  INTO
    v_vendor_count,
    v_active_vendors,
    v_pending_vendors,
    v_approved_vendors,
    v_total_estimated,
    v_total_contracted
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

  SELECT
    CASE
      WHEN ev.id IS NULL THEN NULL
      ELSE jsonb_build_object(
        'id', ev.id,
        'name', ev.name,
        'service_category', NULLIF(BTRIM(ev.service_category), ''),
        'status', ev.status,
        'proposed_amount', ev.proposed_amount,
        'contracted_amount', ev.contracted_amount,
        'contract_signed', ev.contract_signed,
        'currency', ev.currency::TEXT,
        'created_at', ev.created_at
      )
    END
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
    'totalContracted', v_total_contracted,
    'categories', v_categories,
    'latestVendor', v_latest_vendor
  );

  RETURN jsonb_build_object(
    'vendors', v_vendors,
    'summary', v_summary
  );
END;
$$;
