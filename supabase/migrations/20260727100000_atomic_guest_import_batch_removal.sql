-- Atomic Guest Import Batch Removal & Undo Functions (Hardened Security)
-- Created via: 2026-07-27100000_atomic_guest_import_batch_removal.sql
--
-- Security: SECURITY DEFINER with fixed search_path = '' (fully qualified public. and pg_catalog. references).
-- Grants: REVOKE FROM PUBLIC, anon, authenticated; GRANT TO service_role ONLY.
-- Transactional integrity: Locks batch/audit rows FOR UPDATE, applies fail-closed validations,
-- performs soft-delete on eligible guests, updates batch totals, and records audit in a single SQL transaction.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Atomic Batch Removal Function
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.remove_guest_import_batch_atomic(
  p_event_id UUID,
  p_batch_id UUID,
  p_operator_user_id TEXT DEFAULT '',
  p_operator_email TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_batch RECORD;
  v_guest_ids UUID[];
  v_protected_count INT := 0;
  v_already_removed_count INT := 0;
  v_eligible_ids UUID[];
  v_removed_count INT := 0;
  v_audit_id UUID;
  v_undo_payload JSONB;
  v_impact JSONB;
BEGIN
  -- 1. Lock and validate batch
  SELECT * INTO v_batch
  FROM public.guest_import_batches
  WHERE id = p_batch_id AND event_id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lote % não encontrado para o evento %.', p_batch_id, p_event_id;
  END IF;

  IF v_batch.status = 'removed' THEN
    RAISE EXCEPTION 'Lote % já se encontra removido.', p_batch_id;
  END IF;

  -- 2. Collect all guests associated with batch & event
  SELECT pg_catalog.array_agg(id) INTO v_guest_ids
  FROM public.guests
  WHERE import_batch_id = p_batch_id AND event_id = p_event_id;

  IF v_guest_ids IS NULL OR pg_catalog.array_length(v_guest_ids, 1) IS NULL THEN
    -- No guests found in batch, mark batch as removed gracefully
    UPDATE public.guest_import_batches
    SET status = 'removed'::public.guest_import_batch_status, updated_at = pg_catalog.now()
    WHERE id = p_batch_id AND event_id = p_event_id;

    INSERT INTO public.guest_bulk_audit (
      event_id, batch_id, action, guest_ids, operator_email, impact, undo_payload
    ) VALUES (
      p_event_id, p_batch_id, 'remove_import_batch', '{}', p_operator_email,
      pg_catalog.jsonb_build_object('removed', 0, 'reason', 'empty_batch'),
      pg_catalog.jsonb_build_object('batch_id', p_batch_id, 'previous_status', v_batch.status, 'previous_removed_rows', v_batch.removed_rows)
    ) RETURNING id INTO v_audit_id;

    RETURN pg_catalog.jsonb_build_object(
      'success', true,
      'batchId', p_batch_id,
      'removedGuestCount', 0,
      'alreadyRemovedCount', 0,
      'protectedCount', 0,
      'auditId', v_audit_id,
      'status', 'removed'
    );
  END IF;

  -- 3. Check protected guests (RSVP confirmed/declined, seat assigned, checkin done, invite sent)
  SELECT pg_catalog.count(*) INTO v_protected_count
  FROM public.guests
  WHERE id = ANY(v_guest_ids)
    AND (
      status IN ('confirmed', 'declined')
      OR seat_id IS NOT NULL
      OR checkin_at IS NOT NULL
      OR invite_sent_at IS NOT NULL
    );

  IF v_protected_count > 0 THEN
    RAISE EXCEPTION 'Remoção bloqueada: % convidado(s) possuem dependências operacionais (RSVP, lugares, check-in ou convites enviados).', v_protected_count;
  END IF;

  -- 4. Count already soft-deleted guests
  SELECT pg_catalog.count(*) INTO v_already_removed_count
  FROM public.guests
  WHERE id = ANY(v_guest_ids) AND deleted_at IS NOT NULL;

  -- 5. Collect eligible guest IDs (active, not deleted)
  SELECT pg_catalog.array_agg(id) INTO v_eligible_ids
  FROM public.guests
  WHERE id = ANY(v_guest_ids) AND deleted_at IS NULL;

  IF v_eligible_ids IS NOT NULL AND pg_catalog.array_length(v_eligible_ids, 1) > 0 THEN
    v_removed_count := pg_catalog.array_length(v_eligible_ids, 1);

    -- Apply soft delete
    UPDATE public.guests
    SET deleted_at = pg_catalog.now(),
        archive_reason = pg_catalog.concat('remove_batch:', p_batch_id)
    WHERE id = ANY(v_eligible_ids);
  ELSE
    v_eligible_ids := '{}';
    v_removed_count := 0;
  END IF;

  -- 6. Update batch totals and status
  UPDATE public.guest_import_batches
  SET status = 'removed'::public.guest_import_batch_status,
      removed_rows = v_batch.removed_rows + v_removed_count,
      updated_at = pg_catalog.now()
  WHERE id = p_batch_id AND event_id = p_event_id;

  -- 7. Build undo payload & impact JSON
  v_undo_payload := pg_catalog.jsonb_build_object(
    'batch_id', p_batch_id,
    'event_id', p_event_id,
    'affected_guest_ids', v_eligible_ids,
    'previous_batch_status', v_batch.status,
    'previous_removed_rows', v_batch.removed_rows,
    'removed_guest_count', v_removed_count
  );

  v_impact := pg_catalog.jsonb_build_object(
    'removed', v_removed_count,
    'already_removed', v_already_removed_count,
    'filename', v_batch.filename
  );

  -- 8. Insert audit record
  INSERT INTO public.guest_bulk_audit (
    event_id,
    batch_id,
    action,
    guest_ids,
    operator_email,
    impact,
    undo_payload
  ) VALUES (
    p_event_id,
    p_batch_id,
    'remove_import_batch',
    v_eligible_ids,
    p_operator_email,
    v_impact,
    v_undo_payload
  ) RETURNING id INTO v_audit_id;

  -- 9. Return structured result
  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'batchId', p_batch_id,
    'removedGuestCount', v_removed_count,
    'alreadyRemovedCount', v_already_removed_count,
    'protectedCount', 0,
    'auditId', v_audit_id,
    'status', 'removed'
  );
END;
$$;

-- Revoke from public, grant to service_role only
REVOKE EXECUTE ON FUNCTION public.remove_guest_import_batch_atomic(UUID, UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.remove_guest_import_batch_atomic(UUID, UUID, TEXT, TEXT) TO service_role;

COMMENT ON FUNCTION public.remove_guest_import_batch_atomic IS
  'Remove um lote de importação e os seus convidados de forma estritamente atómica e segura (service_role apenas).';


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Atomic Batch Removal Undo Function
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.undo_guest_import_batch_removal_atomic(
  p_event_id UUID,
  p_audit_id UUID,
  p_operator_user_id TEXT DEFAULT '',
  p_operator_email TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_audit RECORD;
  v_batch RECORD;
  v_batch_id UUID;
  v_affected_ids UUID[];
  v_prev_status TEXT;
  v_prev_removed_rows INT;
  v_restored_count INT := 0;
BEGIN
  -- 1. Lock and validate audit record
  SELECT * INTO v_audit
  FROM public.guest_bulk_audit
  WHERE id = p_audit_id AND event_id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registo de auditoria % não encontrado para o evento %.', p_audit_id, p_event_id;
  END IF;

  IF v_audit.action <> 'remove_import_batch' THEN
    RAISE EXCEPTION 'A acção de auditoria % não é uma remoção de lote.', v_audit.action;
  END IF;

  IF v_audit.undone_at IS NOT NULL THEN
    RAISE EXCEPTION 'Esta operação de remoção já foi desfeita em %.', v_audit.undone_at;
  END IF;

  -- 2. Extract payload variables
  v_batch_id := (v_audit.undo_payload->>'batch_id')::UUID;
  v_prev_status := COALESCE(v_audit.undo_payload->>'previous_batch_status', 'completed');
  v_prev_removed_rows := COALESCE((v_audit.undo_payload->>'previous_removed_rows')::INT, 0);

  SELECT ARRAY(
    SELECT (pg_catalog.jsonb_array_elements_text(v_audit.undo_payload->'affected_guest_ids'))::UUID
  ) INTO v_affected_ids;

  -- 3. Lock batch record
  SELECT * INTO v_batch
  FROM public.guest_import_batches
  WHERE id = v_batch_id AND event_id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lote % associado à auditoria não foi encontrado.', v_batch_id;
  END IF;

  -- 4. Restore guests deleted by this batch operation
  IF v_affected_ids IS NOT NULL AND pg_catalog.array_length(v_affected_ids, 1) > 0 THEN
    UPDATE public.guests
    SET deleted_at = NULL,
        archive_reason = ''
    WHERE id = ANY(v_affected_ids) AND deleted_at IS NOT NULL;

    GET DIAGNOSTICS v_restored_count = ROW_COUNT;
  END IF;

  -- 5. Restore batch status and removed_rows count
  UPDATE public.guest_import_batches
  SET status = v_prev_status::public.guest_import_batch_status,
      removed_rows = v_prev_removed_rows,
      updated_at = pg_catalog.now()
  WHERE id = v_batch_id AND event_id = p_event_id;

  -- 6. Mark audit record as undone
  UPDATE public.guest_bulk_audit
  SET undone_at = pg_catalog.now()
  WHERE id = p_audit_id AND event_id = p_event_id;

  -- 7. Insert audit record for the undo action itself
  INSERT INTO public.guest_bulk_audit (
    event_id,
    batch_id,
    action,
    guest_ids,
    operator_email,
    impact,
    undo_payload
  ) VALUES (
    p_event_id,
    v_batch_id,
    'undo_remove_import_batch',
    COALESCE(v_affected_ids, '{}'),
    p_operator_email,
    pg_catalog.jsonb_build_object('restored', v_restored_count, 'batch_id', v_batch_id),
    pg_catalog.jsonb_build_object('original_audit_id', p_audit_id)
  );

  -- 8. Return structured result
  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'batchId', v_batch_id,
    'restoredGuestCount', v_restored_count,
    'auditId', p_audit_id,
    'status', v_prev_status
  );
END;
$$;

-- Revoke from public, grant to service_role only
REVOKE EXECUTE ON FUNCTION public.undo_guest_import_batch_removal_atomic(UUID, UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.undo_guest_import_batch_removal_atomic(UUID, UUID, TEXT, TEXT) TO service_role;

COMMENT ON FUNCTION public.undo_guest_import_batch_removal_atomic IS
  'Reverte atomicamente a remoção de um lote e restaura os convidados, status e totais anteriores (service_role apenas).';
