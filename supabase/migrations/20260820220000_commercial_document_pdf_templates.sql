-- Migration: 20260820220000_commercial_document_pdf_templates.sql
-- Description: Add selectable PDF templates and official contact channels to commercial documents (proforma, invoice, receipt)

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS pdf_template TEXT NOT NULL DEFAULT 'editorial_ivory',
  ADD COLUMN IF NOT EXISTS contact_channel TEXT NOT NULL DEFAULT 'financeiro';

-- Add check constraints for valid values if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'documents_pdf_template_check'
  ) THEN
    ALTER TABLE documents
      ADD CONSTRAINT documents_pdf_template_check
      CHECK (pdf_template IN ('editorial_ivory', 'signature_noir', 'executive', 'atelier_blanc', 'maison_signature'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'documents_contact_channel_check'
  ) THEN
    ALTER TABLE documents
      ADD CONSTRAINT documents_contact_channel_check
      CHECK (contact_channel IN ('financeiro', 'convites', 'info', 'geral'));
  END IF;
END $$;
