-- HAXR Signature Admin — Supabase Schema
-- Run in Supabase SQL Editor or via CLI: supabase db push

-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE document_type AS ENUM ('proforma', 'invoice');
CREATE TYPE document_status AS ENUM ('draft', 'sent', 'paid', 'cancelled');
CREATE TYPE currency_code AS ENUM ('MZN', 'USD', 'ZAR');

-- ─── Businesses (multi-negócio) ──────────────────────────────────────────────

CREATE TABLE businesses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  nuit TEXT,
  phone TEXT,
  email TEXT,
  whatsapp TEXT,
  address TEXT,
  invoice_prefix TEXT NOT NULL DEFAULT '',
  default_currency currency_code NOT NULL DEFAULT 'MZN',
  theme JSONB NOT NULL DEFAULT '{"primaryColor":"#C9A227","accentColor":"#c9a96e"}',
  terms_and_conditions JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE business_bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  nib TEXT NOT NULL,
  swift TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE business_mobile_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Service catalog ─────────────────────────────────────────────────────────

CREATE TABLE service_catalog (
  id TEXT PRIMARY KEY,
  business_id TEXT REFERENCES businesses(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  currency currency_code NOT NULL DEFAULT 'MZN',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Clients ─────────────────────────────────────────────────────────────────

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  company_name TEXT NOT NULL DEFAULT '',
  nuit TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Document sequences (numeração atómica) ──────────────────────────────────

CREATE TABLE document_sequences (
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  year INT NOT NULL,
  last_sequence INT NOT NULL DEFAULT 0,
  PRIMARY KEY (business_id, document_type, year)
);

-- ─── Documents ───────────────────────────────────────────────────────────────

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL REFERENCES businesses(id),
  document_type document_type NOT NULL,
  document_number TEXT NOT NULL UNIQUE,
  status document_status NOT NULL DEFAULT 'draft',
  currency currency_code NOT NULL DEFAULT 'MZN',
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL DEFAULT '',
  company_name TEXT NOT NULL DEFAULT '',
  client_nuit TEXT NOT NULL DEFAULT '',
  client_email TEXT NOT NULL DEFAULT '',
  client_phone TEXT NOT NULL DEFAULT '',
  client_address TEXT NOT NULL DEFAULT '',
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  vat_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.17,
  vat_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  include_vat BOOLEAN NOT NULL DEFAULT true,
  pdf_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE document_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  description TEXT NOT NULL DEFAULT '',
  quantity NUMERIC(12, 2) NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  total NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Indexes (reporting & analytics) ─────────────────────────────────────────

CREATE INDEX idx_documents_business_id ON documents(business_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_currency ON documents(currency);
CREATE INDEX idx_documents_issue_date ON documents(issue_date);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX idx_documents_client_id ON documents(client_id);
CREATE INDEX idx_documents_grand_total ON documents(grand_total);
CREATE INDEX idx_line_items_document_id ON document_line_items(document_id);
CREATE INDEX idx_clients_name ON clients(client_name);
CREATE INDEX idx_service_catalog_business ON service_catalog(business_id);

-- ─── Analytics view ──────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW document_analytics AS
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
  d.client_name,
  d.company_name,
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

-- ─── Atomic document number generator ────────────────────────────────────────

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

  IF p_document_type = 'proforma' THEN
    v_type_prefix := 'PRO';
  ELSE
    v_type_prefix := 'INV';
  END IF;

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

-- Preview next number WITHOUT incrementing (for forms)
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

  IF p_document_type = 'proforma' THEN
    v_type_prefix := 'PRO';
  ELSE
    v_type_prefix := 'INV';
  END IF;

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

-- ─── updated_at trigger ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER service_catalog_updated_at
  BEFORE UPDATE ON service_catalog
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Seed: HAXR Signature ────────────────────────────────────────────────────

INSERT INTO businesses (id, name, logo, nuit, phone, email, whatsapp, address, invoice_prefix, default_currency, theme, terms_and_conditions)
VALUES (
  'haxr-signature',
  'HAXR Signature',
  '/images/brand/logo-horizontal-gold.png',
  '150725161',
  '+258 87 088 3428 · +258 82 088 3428',
  'haxrsignature@gmail.com',
  '258870883428',
  'Av. Julius Nyerere, 119, Polana Canico ''B'', Cidade de Maputo · Moçambique',
  '',
  'MZN',
  '{"primaryColor":"#C9A227","accentColor":"#c9a96e"}',
  '["O pagamento deve ser efectuado conforme as condições acordadas na proposta.","A produção inicia após confirmação do pagamento inicial.","Este documento não serve de factura para efeitos fiscais, salvo indicação em contrário.","Valores em Metical (MZN), salvo menção expressa."]'
);

INSERT INTO business_bank_accounts (business_id, bank_name, account_name, account_number, nib, is_primary)
VALUES ('haxr-signature', 'Millennium BIM', 'Rabeca António Come', '1241076783', '000100000124107678357', true);

INSERT INTO business_mobile_payments (business_id, provider, number, account_name) VALUES
  ('haxr-signature', 'Emola', '+258 87 088 3428', 'Rabeca António Come'),
  ('haxr-signature', 'M-Pesa', '+258 84 881 5853', 'Rabeca António Come');

-- ─── Seed: BrainyWrite ───────────────────────────────────────────────────────

INSERT INTO businesses (id, name, logo, nuit, phone, email, whatsapp, address, invoice_prefix, default_currency, theme, terms_and_conditions)
VALUES (
  'brainywrite',
  'BrainyWrite',
  '/images/brand/brainywrite-logo.png',
  '401234567',
  '+258 84 000 0000',
  'contacto@brainywrite.co.mz',
  '258840000000',
  'Maputo, Moçambique',
  'BW',
  'MZN',
  '{"primaryColor":"#C9A227","accentColor":"#4a90d9"}',
  '["Pagamento a 50% na adjudicação e 50% na entrega final.","Prazo de validade conforme data indicada neste documento.","Alterações fora do âmbito acordado podem implicar custos adicionais.","Valores em Metical (MZN), salvo menção expressa."]'
);

INSERT INTO business_bank_accounts (business_id, bank_name, account_name, account_number, nib, swift, is_primary)
VALUES ('brainywrite', 'Millennium BIM', 'BrainyWrite Lda', '9876543210987', '00010000000098765432109', 'BIMOMZMX', true);

-- ─── Seed: Service catalog ───────────────────────────────────────────────────

INSERT INTO service_catalog (id, business_id, name, description, price, sort_order) VALUES
  ('convite-digital-premium', 'haxr-signature', 'Convite Digital Premium', 'Convite digital com identidade visual, RSVP e localização', 12999, 1),
  ('convite-digital-essencial', 'haxr-signature', 'Convite Digital Essencial', 'Convite digital elegante com informações essenciais do evento', 5999, 2),
  ('save-the-date', 'haxr-signature', 'Save The Date', 'Save the date digital com contagem regressiva', 3500, 3),
  ('identidade-visual', 'haxr-signature', 'Identidade Visual de Evento', 'Direcção visual completa para o evento', 15000, 4),
  ('assessoria-eventos', 'haxr-signature', 'Assessoria de Eventos', 'Planeamento e curadoria completa do evento', 35000, 5),
  ('coordenacao-dia', 'haxr-signature', 'Coordenação do Evento', 'Coordenação profissional no dia do evento', 25000, 6),
  ('copywriting', 'brainywrite', 'Copywriting Profissional', 'Textos comerciais e institucionais', 8000, 1),
  ('content-strategy', 'brainywrite', 'Estratégia de Conteúdo', 'Planeamento editorial e narrativa de marca', 12000, 2);
