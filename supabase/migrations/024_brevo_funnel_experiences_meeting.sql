-- Funil Brevo: experiências (dia 7) e pedido de reunião (dia 14)

ALTER TABLE contact_inquiries
  ADD COLUMN IF NOT EXISTS brevo_experiences_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS brevo_meeting_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_contact_inquiries_brevo_experiences
  ON contact_inquiries (created_at)
  WHERE status = 'new'
    AND brevo_lead_welcome_at IS NOT NULL
    AND brevo_experiences_sent_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_contact_inquiries_brevo_meeting
  ON contact_inquiries (created_at)
  WHERE status = 'new'
    AND brevo_lead_welcome_at IS NOT NULL
    AND brevo_meeting_sent_at IS NULL;
