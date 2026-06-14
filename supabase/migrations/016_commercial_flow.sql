-- P4 Mínimo: ligar Cliente → Evento → Documento
-- Idempotente

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_events_client ON events (client_id);

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_documents_event ON documents (event_id);
CREATE INDEX IF NOT EXISTS idx_documents_client ON documents (client_id);
