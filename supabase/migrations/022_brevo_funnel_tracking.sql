-- Rastreio do funil Brevo (emails transaccionais + follow-ups agendados)

ALTER TABLE contact_inquiries
  ADD COLUMN IF NOT EXISTS brevo_lead_welcome_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS brevo_portfolio_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS brevo_last_call_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS brevo_newsletter_welcome_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_contact_inquiries_brevo_portfolio
  ON contact_inquiries (created_at)
  WHERE brevo_lead_welcome_at IS NOT NULL
    AND brevo_portfolio_sent_at IS NULL
    AND status = 'new';

CREATE INDEX IF NOT EXISTS idx_contact_inquiries_brevo_last_call
  ON contact_inquiries (created_at)
  WHERE brevo_lead_welcome_at IS NOT NULL
    AND brevo_last_call_sent_at IS NULL
    AND status = 'new';
