-- HAXR Signature — RPC segura para leitura operacional de checklist (Fase E.4.4)
-- Migration 042 — aplicar apenas em preview/staging (uxleigndoomoezwsxlan).
--
-- Contexto: leitura directa de public.event_checklist_items via PostgREST/service_role pode falhar
-- com "permission denied for table event_checklist_items". Esta função SECURITY DEFINER agrega
-- tarefas do evento operacional sem expor grants amplos a anon/authenticated.

CREATE OR REPLACE FUNCTION public.get_client_event_checklist(
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
  v_total_tasks INTEGER;
  v_completed_tasks INTEGER;
  v_pending_tasks INTEGER;
  v_overdue_tasks INTEGER;
  v_completion_rate NUMERIC(5, 2);
  v_categories JSONB;
  v_next_task JSONB;
  v_urgent_tasks JSONB;
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
        'id', ci.id,
        'title', ci.title,
        'due_date', ci.due_date,
        'priority', ci.priority,
        'status', ci.status,
        'created_at', ci.created_at,
        'updated_at', ci.updated_at
      )
      ORDER BY ci.due_date ASC NULLS LAST, ci.created_at DESC
    ),
    '[]'::JSONB
  )
  INTO v_items
  FROM public.event_checklist_items ci
  WHERE ci.event_id = v_client_event.operational_event_id;

  SELECT
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (
      WHERE LOWER(BTRIM(ci.status)) IN ('completed', 'done', 'concluido', 'concluída', 'concluida')
    )::INTEGER,
    COUNT(*) FILTER (
      WHERE LOWER(BTRIM(ci.status)) NOT IN ('completed', 'done', 'concluido', 'concluída', 'concluida')
    )::INTEGER,
    COUNT(*) FILTER (
      WHERE ci.due_date IS NOT NULL
        AND ci.due_date < CURRENT_DATE
        AND LOWER(BTRIM(ci.status)) NOT IN ('completed', 'done', 'concluido', 'concluída', 'concluida')
    )::INTEGER
  INTO
    v_total_tasks,
    v_completed_tasks,
    v_pending_tasks,
    v_overdue_tasks
  FROM public.event_checklist_items ci
  WHERE ci.event_id = v_client_event.operational_event_id;

  v_completion_rate := CASE
    WHEN v_total_tasks > 0 THEN ROUND((v_completed_tasks::NUMERIC / v_total_tasks::NUMERIC) * 100, 2)
    ELSE 0
  END;

  SELECT COALESCE(
    jsonb_agg(DISTINCT to_jsonb(NULLIF(BTRIM(ci.priority), ''))),
    '[]'::JSONB
  )
  INTO v_categories
  FROM public.event_checklist_items ci
  WHERE ci.event_id = v_client_event.operational_event_id
    AND NULLIF(BTRIM(ci.priority), '') IS NOT NULL;

  SELECT jsonb_build_object(
    'id', ci.id,
    'title', ci.title,
    'due_date', ci.due_date,
    'priority', ci.priority,
    'status', ci.status,
    'created_at', ci.created_at
  )
  INTO v_next_task
  FROM public.event_checklist_items ci
  WHERE ci.event_id = v_client_event.operational_event_id
    AND LOWER(BTRIM(ci.status)) NOT IN ('completed', 'done', 'concluido', 'concluída', 'concluida')
  ORDER BY ci.due_date ASC NULLS LAST, ci.created_at DESC
  LIMIT 1;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', ci.id,
        'title', ci.title,
        'due_date', ci.due_date,
        'priority', ci.priority,
        'status', ci.status,
        'created_at', ci.created_at
      )
      ORDER BY ci.due_date ASC NULLS LAST, ci.created_at DESC
    ),
    '[]'::JSONB
  )
  INTO v_urgent_tasks
  FROM (
    SELECT ci.*
    FROM public.event_checklist_items ci
    WHERE ci.event_id = v_client_event.operational_event_id
      AND LOWER(BTRIM(ci.status)) NOT IN ('completed', 'done', 'concluido', 'concluída', 'concluida')
      AND (
        (ci.due_date IS NOT NULL AND ci.due_date < CURRENT_DATE)
        OR LOWER(BTRIM(ci.priority)) IN ('alta', 'high', 'urgent', 'urgente')
      )
    ORDER BY ci.due_date ASC NULLS LAST, ci.created_at DESC
    LIMIT 5
  ) ci;

  v_summary := jsonb_build_object(
    'totalTasks', v_total_tasks,
    'completedTasks', v_completed_tasks,
    'pendingTasks', v_pending_tasks,
    'overdueTasks', v_overdue_tasks,
    'completionRate', v_completion_rate,
    'categories', v_categories,
    'nextTask', v_next_task,
    'urgentTasks', v_urgent_tasks
  );

  RETURN jsonb_build_object(
    'items', v_items,
    'summary', v_summary
  );
END;
$$;

COMMENT ON FUNCTION public.get_client_event_checklist(UUID) IS
  'Lê checklist operacional de um client_event via operational_event_id. Apenas service_role.';

REVOKE ALL ON FUNCTION public.get_client_event_checklist(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_client_event_checklist(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.get_client_event_checklist(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_client_event_checklist(UUID) TO service_role;
