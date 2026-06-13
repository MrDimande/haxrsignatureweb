-- HAXR Signature Admin v2 — Receipts, VAT 16%, clients, catalog categories, event context
-- Run after 001_admin_schema.sql

-- ─── New enum values & types ─────────────────────────────────────────────────

ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'receipt';

DO $$ BEGIN
  CREATE TYPE client_type AS ENUM ('individual', 'company');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE service_category AS ENUM (
    'invitations',
    'event_packages',
    'addons',
    'coordination',
    'media'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE event_type AS ENUM (
    'wedding',
    'birthday',
    'corporate',
    'baby_shower',
    'graduation',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE item_source AS ENUM ('catalog', 'manual');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Clients ─────────────────────────────────────────────────────────────────

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS client_type client_type NOT NULL DEFAULT 'individual';

-- ─── Service catalog ───────────────────────────────────────────────────────

ALTER TABLE service_catalog
  ADD COLUMN IF NOT EXISTS category service_category NOT NULL DEFAULT 'addons';

-- ─── Documents ─────────────────────────────────────────────────────────────

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS client_type client_type NOT NULL DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS event_type event_type,
  ADD COLUMN IF NOT EXISTS event_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS event_date DATE,
  ADD COLUMN IF NOT EXISTS event_location TEXT NOT NULL DEFAULT '';

ALTER TABLE documents ALTER COLUMN vat_rate SET DEFAULT 0.16;

-- ─── Line items ──────────────────────────────────────────────────────────────

ALTER TABLE document_line_items
  ADD COLUMN IF NOT EXISTS catalog_service_id TEXT REFERENCES service_catalog(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS item_source item_source NOT NULL DEFAULT 'manual';

CREATE INDEX IF NOT EXISTS idx_line_items_catalog ON document_line_items(catalog_service_id);
CREATE INDEX IF NOT EXISTS idx_catalog_category ON service_catalog(category);
CREATE INDEX IF NOT EXISTS idx_documents_event_type ON documents(event_type);

-- ─── Analytics view ──────────────────────────────────────────────────────────
-- DROP obrigatório: PostgreSQL não permite INSERT de colunas no meio via OR REPLACE

DROP VIEW IF EXISTS document_analytics;

CREATE VIEW document_analytics AS
SELECT
  d.id,
  d.document_number,
  d.document_type,
  d.status,
  d.currency,
  d.business_id,
  b.name AS business_name,
  b.invoice_prefix,
  d.client_id,
  d.client_type,
  d.client_name,
  d.company_name,
  d.event_type,
  d.event_name,
  d.event_date,
  d.event_location,
  d.subtotal,
  d.vat_amount,
  d.grand_total,
  d.include_vat,
  d.issue_date,
  d.expiry_date,
  d.pdf_generated_at,
  d.created_at,
  d.updated_at,
  EXTRACT(YEAR FROM d.issue_date)::INT AS fiscal_year,
  EXTRACT(MONTH FROM d.issue_date)::INT AS fiscal_month,
  EXTRACT(QUARTER FROM d.issue_date)::INT AS fiscal_quarter,
  DATE_TRUNC('month', d.issue_date)::DATE AS period_month
FROM documents d
JOIN businesses b ON b.id = d.business_id;

-- ─── Document number generator (add receipt = REC) ───────────────────────────

CREATE OR REPLACE FUNCTION next_document_number(
  p_business_id TEXT,
  p_document_type document_type
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_year INT := EXTRACT(YEAR FROM CURRENT_DATE)::INT;
  v_prefix TEXT;
  v_type_prefix TEXT;
  v_seq INT;
BEGIN
  SELECT invoice_prefix INTO v_prefix FROM businesses WHERE id = p_business_id;

  v_type_prefix := CASE p_document_type
    WHEN 'proforma' THEN 'PRO'
    WHEN 'invoice' THEN 'INV'
    WHEN 'receipt' THEN 'REC'
    ELSE 'DOC'
  END;

  INSERT INTO document_sequences (business_id, document_type, year, last_sequence)
  VALUES (p_business_id, p_document_type, v_year, 1)
  ON CONFLICT (business_id, document_type, year)
  DO UPDATE SET last_sequence = document_sequences.last_sequence + 1
  RETURNING last_sequence INTO v_seq;

  IF v_prefix IS NOT NULL AND v_prefix <> '' THEN
    RETURN v_prefix || '-' || v_type_prefix || '-' || v_year || '-' || LPAD(v_seq::TEXT, 4, '0');
  END IF;

  RETURN v_type_prefix || '-' || v_year || '-' || LPAD(v_seq::TEXT, 4, '0');
END;
$$;

CREATE OR REPLACE FUNCTION peek_document_number(
  p_business_id TEXT,
  p_document_type document_type
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_year INT := EXTRACT(YEAR FROM CURRENT_DATE)::INT;
  v_prefix TEXT;
  v_type_prefix TEXT;
  v_seq INT;
BEGIN
  SELECT invoice_prefix INTO v_prefix FROM businesses WHERE id = p_business_id;

  v_type_prefix := CASE p_document_type
    WHEN 'proforma' THEN 'PRO'
    WHEN 'invoice' THEN 'INV'
    WHEN 'receipt' THEN 'REC'
    ELSE 'DOC'
  END;

  SELECT COALESCE(last_sequence, 0) + 1 INTO v_seq
  FROM document_sequences
  WHERE business_id = p_business_id
    AND document_type = p_document_type
    AND year = v_year;

  IF v_seq IS NULL THEN
    v_seq := 1;
  END IF;

  IF v_prefix IS NOT NULL AND v_prefix <> '' THEN
    RETURN v_prefix || '-' || v_type_prefix || '-' || v_year || '-' || LPAD(v_seq::TEXT, 4, '0');
  END IF;

  RETURN v_type_prefix || '-' || v_year || '-' || LPAD(v_seq::TEXT, 4, '0');
END;
$$;

-- ─── Categorize existing catalog ─────────────────────────────────────────────

UPDATE service_catalog SET category = 'invitations' WHERE id IN (
  'convite-digital-premium', 'convite-digital-essencial', 'save-the-date'
);
UPDATE service_catalog SET category = 'coordination' WHERE id IN (
  'assessoria-eventos', 'coordenacao-dia'
);
UPDATE service_catalog SET category = 'addons' WHERE id = 'identidade-visual';
UPDATE service_catalog SET category = 'media' WHERE id IN (
  'copywriting', 'content-strategy'
);

-- ─── Expanded catalog seed ───────────────────────────────────────────────────

INSERT INTO service_catalog (id, business_id, name, description, price, category, sort_order) VALUES
  ('rsvp-system', 'haxr-signature', 'Sistema RSVP', 'Gestão de confirmações de presença integrada', 4500, 'invitations', 4),
  ('package-basic', 'haxr-signature', 'Pacote Basic', 'Convite essencial + save the date', 8999, 'event_packages', 10),
  ('package-standard', 'haxr-signature', 'Pacote Standard', 'Convite signature + RSVP + identidade básica', 18999, 'event_packages', 11),
  ('package-premium', 'haxr-signature', 'Pacote Premium', 'Experiência completa: convite royal + coordenação parcial', 45000, 'event_packages', 12),
  ('addon-extra-page', 'haxr-signature', 'Página Extra no Convite', 'Secção adicional personalizada', 2500, 'addons', 20),
  ('addon-music', 'haxr-signature', 'Música de Fundo', 'Integração de áudio no convite digital', 1500, 'addons', 21),
  ('media-photography', 'haxr-signature', 'Cobertura Fotográfica', 'Registo fotográfico do evento', 35000, 'media', 30),
  ('media-video', 'haxr-signature', 'Cobertura em Vídeo', 'Filmagem profissional do evento', 55000, 'media', 31),
  ('media-reels', 'haxr-signature', 'Pacote Reels', 'Produção de reels para redes sociais', 12000, 'media', 32)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  sort_order = EXCLUDED.sort_order;
