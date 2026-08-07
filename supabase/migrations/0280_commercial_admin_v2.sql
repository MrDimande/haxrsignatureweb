-- Sprint Admin V2: histórico comercial, conversões e portal cliente
-- Canonical legacy version 0280 preserves execution order before migration 0281.
-- Idempotente

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS converted_from_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS whatsapp_shared_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_documents_converted_from
  ON documents (converted_from_document_id)
  WHERE converted_from_document_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_documents_email_sent
  ON documents (email_sent_at DESC)
  WHERE email_sent_at IS NOT NULL;

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS portal_token TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_portal_token
  ON clients (portal_token)
  WHERE portal_token IS NOT NULL;
