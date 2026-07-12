-- Phase 2: Sheet/CSV sync ledger — fingerprints idempotentes, sem UNIQUE em guests.

CREATE TABLE IF NOT EXISTS event_sheet_import_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('google_sheet', 'csv_upload')),
  source_url TEXT,
  source_gid TEXT,
  source_file_name TEXT,
  source_row_number INTEGER,
  row_fingerprint TEXT NOT NULL,
  row_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  normalized_email TEXT,
  normalized_phone TEXT,
  normalized_name TEXT,
  sync_batch_id UUID NOT NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT event_sheet_import_rows_fingerprint_unique
    UNIQUE (event_id, source, row_fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_event_sheet_import_rows_event
  ON event_sheet_import_rows (event_id);

CREATE INDEX IF NOT EXISTS idx_event_sheet_import_rows_fingerprint
  ON event_sheet_import_rows (row_fingerprint);

CREATE INDEX IF NOT EXISTS idx_event_sheet_import_rows_email
  ON event_sheet_import_rows (normalized_email)
  WHERE normalized_email IS NOT NULL AND normalized_email <> '';

CREATE INDEX IF NOT EXISTS idx_event_sheet_import_rows_phone
  ON event_sheet_import_rows (normalized_phone)
  WHERE normalized_phone IS NOT NULL AND normalized_phone <> '';

CREATE INDEX IF NOT EXISTS idx_event_sheet_import_rows_name
  ON event_sheet_import_rows (normalized_name)
  WHERE normalized_name IS NOT NULL AND normalized_name <> '';

CREATE INDEX IF NOT EXISTS idx_event_sheet_import_rows_batch
  ON event_sheet_import_rows (sync_batch_id);

CREATE TABLE IF NOT EXISTS event_sheet_sync_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('google_sheet', 'csv_upload')),
  row_fingerprint TEXT NOT NULL,
  guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (
    action IN ('created', 'updated', 'matched', 'skipped', 'ignored', 'error')
  ),
  reason TEXT,
  sync_batch_id UUID NOT NULL,
  row_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT event_sheet_sync_ledger_fingerprint_unique
    UNIQUE (event_id, source, row_fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_event_sheet_sync_ledger_event
  ON event_sheet_sync_ledger (event_id);

CREATE INDEX IF NOT EXISTS idx_event_sheet_sync_ledger_guest
  ON event_sheet_sync_ledger (guest_id)
  WHERE guest_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_event_sheet_sync_ledger_action
  ON event_sheet_sync_ledger (action);

CREATE INDEX IF NOT EXISTS idx_event_sheet_sync_ledger_fingerprint
  ON event_sheet_sync_ledger (row_fingerprint);

CREATE INDEX IF NOT EXISTS idx_event_sheet_sync_ledger_batch
  ON event_sheet_sync_ledger (sync_batch_id);

CREATE TRIGGER event_sheet_sync_ledger_updated_at
  BEFORE UPDATE ON event_sheet_sync_ledger
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE event_sheet_import_rows IS
  'Linhas brutas vistas em imports Google Sheets / CSV — fingerprint estável por evento+fonte.';

COMMENT ON TABLE event_sheet_sync_ledger IS
  'Decisões de sync por fingerprint — evita duplicados em re-imports; base para resolução futura.';
