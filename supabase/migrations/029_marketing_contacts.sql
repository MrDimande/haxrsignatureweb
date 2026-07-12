-- Marketing contacts — captura segmentada (newsletter, orçamentos, fornecedores)
-- Sincronização Brevo apenas com consent_status = 'granted' (aplicação).

CREATE TABLE IF NOT EXISTS marketing_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  first_name text NOT NULL,
  last_name text,
  phone text,
  company_name text,
  role text,
  segment text NOT NULL,
  source text NOT NULL,
  consent_status text NOT NULL DEFAULT 'pending'
    CHECK (consent_status IN ('granted', 'pending', 'denied')),
  consent_text text,
  consent_at timestamptz,
  city text,
  event_type text,
  event_date date,
  message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  brevo_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketing_contacts_email
  ON marketing_contacts (lower(email));

CREATE INDEX IF NOT EXISTS idx_marketing_contacts_segment
  ON marketing_contacts (segment);

CREATE INDEX IF NOT EXISTS idx_marketing_contacts_created_at
  ON marketing_contacts (created_at DESC);

COMMENT ON TABLE marketing_contacts IS
  'Leads de marketing capturados no site — sync Brevo só com consentimento explícito.';

-- TODO: importação CSV, detecção de duplicados, rastreio de fonte de consentimento, sync bulk Brevo
