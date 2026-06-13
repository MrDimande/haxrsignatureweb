-- Google Sheets integration metadata per event

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS google_sheet_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS google_sheet_gid TEXT NOT NULL DEFAULT '0',
  ADD COLUMN IF NOT EXISTS sheets_last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sheets_sync_summary TEXT NOT NULL DEFAULT '';
