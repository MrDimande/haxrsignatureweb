-- Portal V2: aprovações de proposta pelo cliente
-- Idempotente

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS client_approval_status TEXT,
  ADD COLUMN IF NOT EXISTS client_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS client_approval_note TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'documents_client_approval_status_check'
  ) THEN
    ALTER TABLE documents
      ADD CONSTRAINT documents_client_approval_status_check
      CHECK (
        client_approval_status IS NULL
        OR client_approval_status IN ('pending', 'approved', 'changes_requested')
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_documents_client_approval_pending
  ON documents (client_approval_status)
  WHERE client_approval_status = 'pending';
