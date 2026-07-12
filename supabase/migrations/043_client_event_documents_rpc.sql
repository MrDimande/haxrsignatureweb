-- HAXR Signature — RPC segura para leitura operacional de documentos/artefactos (Fase E.4.5)
-- Migration 043 — aplicar apenas em preview/staging (uxleigndoomoezwsxlan).
--
-- Agrega documentos comerciais, uploads Concierge, itens de revisão e artefactos do portal
-- ligados ao operational_event_id (e portal scope por client_event id/slug).

CREATE OR REPLACE FUNCTION public.get_client_event_documents(
  p_client_event_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_event public.client_events%ROWTYPE;
  v_items JSONB;
  v_summary JSONB;
  v_document_count INTEGER;
  v_upload_count INTEGER;
  v_review_count INTEGER;
  v_portal_count INTEGER;
  v_pending_review_count INTEGER;
  v_approved_count INTEGER;
  v_total_size BIGINT;
  v_categories JSONB;
  v_latest_document JSONB;
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

  WITH normalized AS (
    SELECT
      d.id::TEXT AS id,
      'commercial_document'::TEXT AS source,
      COALESCE(NULLIF(BTRIM(d.document_number), ''), 'Documento') AS title,
      COALESCE(NULLIF(BTRIM(d.document_number), ''), 'documento.pdf') AS file_name,
      NULL::TEXT AS storage_path,
      NULL::TEXT AS mime_type,
      0::BIGINT AS size_bytes,
      d.status::TEXT AS status,
      d.document_type::TEXT AS category,
      d.document_type::TEXT AS document_type,
      COALESCE(NULLIF(BTRIM(d.client_name), ''), 'Cliente') AS associated_with,
      'Equipa HAXR'::TEXT AS uploaded_by,
      NULL::TEXT AS suggested_destination,
      d.created_at,
      d.updated_at
    FROM public.documents d
    WHERE d.event_id = v_client_event.operational_event_id
      AND d.status IN ('sent', 'paid')

    UNION ALL

    SELECT
      cu.id::TEXT AS id,
      'concierge_upload'::TEXT AS source,
      COALESCE(NULLIF(BTRIM(cu.file_name), ''), 'Upload Concierge') AS title,
      cu.file_name,
      NULLIF(BTRIM(cu.storage_path), '') AS storage_path,
      NULLIF(BTRIM(cu.mime_type), '') AS mime_type,
      COALESCE(cu.file_size, 0)::BIGINT AS size_bytes,
      cu.status::TEXT AS status,
      'upload'::TEXT AS category,
      'other'::TEXT AS document_type,
      'Concierge HAXR'::TEXT AS associated_with,
      'Concierge HAXR'::TEXT AS uploaded_by,
      NULL::TEXT AS suggested_destination,
      cu.created_at,
      cu.updated_at
    FROM public.concierge_uploads cu
    WHERE cu.event_id = v_client_event.operational_event_id

    UNION ALL

    SELECT
      cri.id::TEXT AS id,
      'concierge_review'::TEXT AS source,
      COALESCE(NULLIF(BTRIM(cu.file_name), ''), 'Revisão Concierge') AS title,
      COALESCE(NULLIF(BTRIM(cu.file_name), ''), 'revisao') AS file_name,
      NULLIF(BTRIM(cu.storage_path), '') AS storage_path,
      NULLIF(BTRIM(cu.mime_type), '') AS mime_type,
      COALESCE(cu.file_size, 0)::BIGINT AS size_bytes,
      cri.status::TEXT AS status,
      cri.document_type::TEXT AS category,
      cri.document_type::TEXT AS document_type,
      'Concierge HAXR'::TEXT AS associated_with,
      COALESCE(NULLIF(BTRIM(cri.reviewed_by), ''), 'Concierge HAXR') AS uploaded_by,
      NULL::TEXT AS suggested_destination,
      cri.created_at,
      cri.updated_at
    FROM public.concierge_review_items cri
    LEFT JOIN public.concierge_uploads cu ON cu.id = cri.upload_id
    WHERE cri.event_id = v_client_event.operational_event_id

    UNION ALL

    SELECT
      cpi.id::TEXT AS id,
      'concierge_portal'::TEXT AS source,
      COALESCE(NULLIF(BTRIM(cpi.title), ''), 'Artefacto Concierge') AS title,
      COALESCE(NULLIF(BTRIM(cpi.file_name), ''), NULLIF(BTRIM(cpi.title), ''), 'artefacto') AS file_name,
      NULLIF(BTRIM(cpi.storage_path), '') AS storage_path,
      NULLIF(BTRIM(cpi.mime_type), '') AS mime_type,
      COALESCE(cpi.size_bytes, 0)::BIGINT AS size_bytes,
      cpi.status::TEXT AS status,
      COALESCE(NULLIF(BTRIM(cpi.type), ''), 'outro') AS category,
      COALESCE(NULLIF(BTRIM(cpi.type), ''), 'outro') AS document_type,
      COALESCE(NULLIF(BTRIM(cpi.uploaded_by), ''), 'Portal Concierge') AS associated_with,
      COALESCE(NULLIF(BTRIM(cpi.uploaded_by), ''), 'Portal Concierge') AS uploaded_by,
      NULLIF(BTRIM(cpi.suggested_destination), '') AS suggested_destination,
      cpi.created_at,
      cpi.updated_at
    FROM public.concierge_portal_items cpi
    WHERE cpi.event_id IN (v_client_event.id::TEXT, NULLIF(BTRIM(v_client_event.slug), ''))
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', n.id,
        'source', n.source,
        'title', n.title,
        'file_name', n.file_name,
        'storage_path', n.storage_path,
        'mime_type', n.mime_type,
        'size_bytes', n.size_bytes,
        'status', n.status,
        'category', n.category,
        'document_type', n.document_type,
        'associated_with', n.associated_with,
        'uploaded_by', n.uploaded_by,
        'suggested_destination', n.suggested_destination,
        'created_at', n.created_at,
        'updated_at', n.updated_at
      )
      ORDER BY n.created_at DESC
    ),
    '[]'::JSONB
  )
  INTO v_items
  FROM normalized n;

  SELECT
    COUNT(*) FILTER (WHERE n.source = 'commercial_document')::INTEGER,
    COUNT(*) FILTER (WHERE n.source = 'concierge_upload')::INTEGER,
    COUNT(*) FILTER (WHERE n.source = 'concierge_review')::INTEGER,
    COUNT(*) FILTER (WHERE n.source = 'concierge_portal')::INTEGER,
    COUNT(*) FILTER (
      WHERE LOWER(BTRIM(n.status)) IN (
        'uploaded', 'processing', 'pending_review', 'por_validar', 'novo', 'por_classificar',
        'aguardando_validação', 'aguardando_validacao', 'sent'
      )
    )::INTEGER,
    COUNT(*) FILTER (
      WHERE LOWER(BTRIM(n.status)) IN ('approved', 'validado', 'paid', 'classificado', 'enviado_para_módulo', 'enviado_para_modulo')
    )::INTEGER,
    COALESCE(SUM(n.size_bytes), 0)::BIGINT
  INTO
    v_document_count,
    v_upload_count,
    v_review_count,
    v_portal_count,
    v_pending_review_count,
    v_approved_count,
    v_total_size
  FROM jsonb_to_recordset(v_items) AS n(
    source TEXT,
    status TEXT,
    size_bytes BIGINT
  );

  SELECT COALESCE(
    jsonb_agg(DISTINCT to_jsonb(NULLIF(BTRIM(n.category), ''))),
    '[]'::JSONB
  )
  INTO v_categories
  FROM jsonb_to_recordset(v_items) AS n(category TEXT)
  WHERE NULLIF(BTRIM(n.category), '') IS NOT NULL;

  SELECT jsonb_build_object(
    'id', n.id,
    'title', n.title,
    'source', n.source,
    'status', n.status,
    'created_at', n.created_at
  )
  INTO v_latest_document
  FROM jsonb_to_recordset(v_items) AS n(
    id TEXT,
    title TEXT,
    source TEXT,
    status TEXT,
    created_at TIMESTAMPTZ
  )
  ORDER BY n.created_at DESC NULLS LAST
  LIMIT 1;

  v_summary := jsonb_build_object(
    'documentCount', v_document_count,
    'uploadCount', v_upload_count,
    'reviewItemCount', v_review_count,
    'portalItemCount', v_portal_count,
    'pendingReviewCount', v_pending_review_count,
    'approvedCount', v_approved_count,
    'latestDocument', v_latest_document,
    'categories', v_categories,
    'totalSize', v_total_size,
    'totalItems', COALESCE(jsonb_array_length(v_items), 0)
  );

  RETURN jsonb_build_object(
    'items', v_items,
    'summary', v_summary
  );
END;
$$;

COMMENT ON FUNCTION public.get_client_event_documents(UUID) IS
  'Lê documentos e artefactos operacionais de um client_event via operational_event_id. Apenas service_role.';

REVOKE ALL ON FUNCTION public.get_client_event_documents(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_client_event_documents(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.get_client_event_documents(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_client_event_documents(UUID) TO service_role;
