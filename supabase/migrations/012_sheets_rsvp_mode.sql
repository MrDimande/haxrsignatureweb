-- Modo de sincronização Sheets (lista mestre vs respostas RSVP)
-- Idempotente

DO $$ BEGIN
  CREATE TYPE sheets_sync_mode AS ENUM ('master', 'rsvp');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE guest_source AS ENUM ('manual', 'sheet_master', 'sheet_rsvp');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS sheets_sync_mode sheets_sync_mode NOT NULL DEFAULT 'master';

ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS guest_source guest_source NOT NULL DEFAULT 'manual';
