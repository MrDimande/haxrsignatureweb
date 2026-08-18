-- Guest import batches + soft archive / incorrect flags + bulk audit/undo.
-- Created via: supabase migration new guest_import_batches
-- Rollback: see 20260716165701_guest_import_batches.down.sql
--
-- RLS: enabled, no anon/authenticated policies → Data API denied by default.
-- Access: server/admin via service_role only (createAdminClient).
-- Compatible with legacy guests (import_batch_id NULL).
--
-- DO NOT apply to Production without explicit authorization / preflight / backup.
-- Minimal grants below are documented for clone/staging only — do not alter
-- Production grants via this file without a separate GO.

-- ─── Batches ────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE guest_import_batch_status AS ENUM (
    'preview',
    'completed',
    'partial',
    'failed',
    'removed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS guest_import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  filename TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  operator_user_id TEXT NOT NULL DEFAULT '',
  operator_email TEXT NOT NULL DEFAULT '',
  total_rows INT NOT NULL DEFAULT 0 CHECK (total_rows >= 0),
  valid_rows INT NOT NULL DEFAULT 0 CHECK (valid_rows >= 0),
  duplicate_rows INT NOT NULL DEFAULT 0 CHECK (duplicate_rows >= 0),
  invalid_rows INT NOT NULL DEFAULT 0 CHECK (invalid_rows >= 0),
  removed_rows INT NOT NULL DEFAULT 0 CHECK (removed_rows >= 0),
  status guest_import_batch_status NOT NULL DEFAULT 'completed'
);

CREATE INDEX IF NOT EXISTS idx_guest_import_batches_event
  ON guest_import_batches (event_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_guest_import_batches_status
  ON guest_import_batches (event_id, status);

CREATE OR REPLACE FUNCTION set_guest_import_batches_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guest_import_batches_updated_at ON guest_import_batches;
CREATE TRIGGER guest_import_batches_updated_at
  BEFORE UPDATE ON guest_import_batches
  FOR EACH ROW
  EXECUTE FUNCTION set_guest_import_batches_updated_at();

COMMENT ON TABLE guest_import_batches IS
  'Lotes de importação de convidados — associação opcional; guests legados sem batch permanecem válidos.';

-- ─── Guest soft-archive / batch association ─────────────────────────────────

ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS import_batch_id UUID
    REFERENCES guest_import_batches(id) ON DELETE SET NULL;

ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS archive_reason TEXT NOT NULL DEFAULT '';

ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS is_incorrect BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS invite_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_guests_event_import_batch
  ON guests (event_id, import_batch_id)
  WHERE import_batch_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_guests_event_active
  ON guests (event_id)
  WHERE archived_at IS NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_guests_event_archived
  ON guests (event_id, archived_at)
  WHERE archived_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_guests_event_incorrect
  ON guests (event_id)
  WHERE is_incorrect = true;

COMMENT ON COLUMN guests.import_batch_id IS
  'FK opcional para guest_import_batches; NULL = convidado pré-existente ou manual.';

COMMENT ON COLUMN guests.archived_at IS
  'Soft archive — default em operações de lote; hard delete nunca silencioso.';

COMMENT ON COLUMN guests.invite_sent_at IS
  'Marca convite enviado — bloqueia hard delete sem impacto explícito.';

-- ─── Bulk audit + undo contract ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS guest_bulk_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES guest_import_batches(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  guest_ids UUID[] NOT NULL DEFAULT '{}',
  operator_email TEXT NOT NULL DEFAULT '',
  impact JSONB NOT NULL DEFAULT '{}'::jsonb,
  undo_payload JSONB,
  undone_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guest_bulk_audit_event
  ON guest_bulk_audit (event_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_guest_bulk_audit_batch
  ON guest_bulk_audit (batch_id)
  WHERE batch_id IS NOT NULL;

COMMENT ON TABLE guest_bulk_audit IS
  'Auditoria de acções em massa com undo_payload para reverter arquivo/remoção suave.';

-- ─── RLS (deny-by-default for Data API) ─────────────────────────────────────

ALTER TABLE guest_import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_bulk_audit ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated: PostgREST access denied.
-- service_role bypasses RLS (admin server client).

-- ─── Minimal grants (clone/staging documentation only) ──────────────────────
-- Intentionally NOT touching Production grants. Uncomment only on clone after GO:
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.guest_import_batches TO service_role;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.guest_bulk_audit TO service_role;
