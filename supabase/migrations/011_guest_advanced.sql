-- Etiquetas de convidados, histórico de alterações
-- Idempotente: seguro para reexecutar após falha parcial

DO $$ BEGIN
  CREATE TYPE guest_label AS ENUM (
    'none',
    'vip',
    'family',
    'wedding_party',
    'corporate',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS label guest_label NOT NULL DEFAULT 'none';

CREATE TABLE IF NOT EXISTS guest_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guest_audit_event
  ON guest_audit_log (event_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_guest_audit_guest
  ON guest_audit_log (guest_id, changed_at DESC);
