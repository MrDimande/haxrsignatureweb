-- HAXR Signature — RPC segura para provisionar operational_event_id (Fase E.3.1)
-- Migration 038 — aplicar apenas em preview/staging (uxleigndoomoezwsxlan).
--
-- Contexto: inserts directos em public.events via PostgREST/service_role falham com
-- "permission denied for table events". Esta função SECURITY DEFINER executa o
-- provisioning transaccional sem expor grants amplos a anon/authenticated.

CREATE OR REPLACE FUNCTION public.provision_client_operational_event(
  p_client_event_id UUID
)
RETURNS TABLE (
  client_event_id UUID,
  operational_event_id UUID,
  created BOOLEAN,
  reused BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_event public.client_events%ROWTYPE;
  v_notes TEXT;
  v_operational_id UUID;
  v_created BOOLEAN := false;
  v_reused BOOLEAN := false;
  v_business_exists BOOLEAN;
BEGIN
  SELECT *
  INTO v_client_event
  FROM public.client_events
  WHERE id = p_client_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'client_event_not_found: %', p_client_event_id
      USING ERRCODE = 'P0001';
  END IF;

  IF v_client_event.operational_event_id IS NOT NULL THEN
    client_event_id := v_client_event.id;
    operational_event_id := v_client_event.operational_event_id;
    created := false;
    reused := false;
    RETURN NEXT;
    RETURN;
  END IF;

  v_notes := 'Provisioned from client_events:' || v_client_event.id::TEXT;

  SELECT e.id
  INTO v_operational_id
  FROM public.events e
  WHERE e.notes = v_notes
  LIMIT 1;

  IF FOUND THEN
    v_reused := true;
  ELSE
    SELECT EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = 'haxr-signature'
    )
    INTO v_business_exists;

    IF NOT v_business_exists THEN
      RAISE EXCEPTION 'operational_business_not_found: haxr-signature'
        USING ERRCODE = 'P0001';
    END IF;

    INSERT INTO public.events (
      business_id,
      name,
      type,
      date,
      location,
      notes,
      is_active
    )
    VALUES (
      'haxr-signature',
      v_client_event.event_name,
      v_client_event.event_type,
      v_client_event.event_date,
      COALESCE(v_client_event.event_location, ''),
      v_notes,
      true
    )
    RETURNING id INTO v_operational_id;

    v_created := true;
  END IF;

  UPDATE public.client_events
  SET operational_event_id = v_operational_id
  WHERE id = v_client_event.id;

  client_event_id := v_client_event.id;
  operational_event_id := v_operational_id;
  created := v_created;
  reused := v_reused;
  RETURN NEXT;
END;
$$;

COMMENT ON FUNCTION public.provision_client_operational_event(UUID) IS
  'Provisiona ou reutiliza public.events para um client_event. Transaccional e idempotente. Apenas service_role.';

REVOKE ALL ON FUNCTION public.provision_client_operational_event(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.provision_client_operational_event(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.provision_client_operational_event(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.provision_client_operational_event(UUID) TO service_role;
