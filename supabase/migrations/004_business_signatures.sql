-- Assinaturas personalizadas por negócio (upload PNG/JPG para facturas e recibos)

CREATE TABLE business_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  role_title TEXT NOT NULL DEFAULT '',
  image_data TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'image/png',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_business_signatures_business ON business_signatures(business_id);

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS issuer_signature_id UUID REFERENCES business_signatures(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS issuer_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS issuer_role TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS issuer_signature_image TEXT NOT NULL DEFAULT '';

CREATE TRIGGER business_signatures_updated_at
  BEFORE UPDATE ON business_signatures
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
