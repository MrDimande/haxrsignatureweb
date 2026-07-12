-- Phase 6: perfis de contacto operacionais por evento (sem sync marketing).

CREATE TABLE IF NOT EXISTS event_contact_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,
  full_name TEXT,
  normalized_name TEXT,
  email TEXT,
  normalized_email TEXT,
  phone TEXT,
  normalized_phone TEXT,
  source TEXT NOT NULL CHECK (
    source IN (
      'rsvp',
      'google_sheet',
      'csv_upload',
      'admin',
      'edition_rsvp',
      'checkin',
      'unknown'
    )
  ),
  confidence TEXT NOT NULL DEFAULT 'medium' CHECK (
    confidence IN ('high', 'medium', 'low')
  ),
  consent_status TEXT NOT NULL DEFAULT 'operational_only' CHECK (
    consent_status IN (
      'operational_only',
      'marketing_granted',
      'marketing_denied',
      'unknown'
    )
  ),
  marketing_allowed BOOLEAN NOT NULL DEFAULT false,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_event_contact_profiles_event_email
  ON event_contact_profiles (event_id, normalized_email)
  WHERE normalized_email IS NOT NULL AND normalized_email <> '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_event_contact_profiles_event_phone
  ON event_contact_profiles (event_id, normalized_phone)
  WHERE normalized_phone IS NOT NULL AND normalized_phone <> '';

CREATE INDEX IF NOT EXISTS idx_event_contact_profiles_event
  ON event_contact_profiles (event_id);

CREATE INDEX IF NOT EXISTS idx_event_contact_profiles_guest
  ON event_contact_profiles (guest_id)
  WHERE guest_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_event_contact_profiles_last_seen
  ON event_contact_profiles (event_id, last_seen_at DESC);

CREATE TRIGGER event_contact_profiles_updated_at
  BEFORE UPDATE ON event_contact_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE event_contact_profiles IS
  'Contactos operacionais por evento — RSVP/import/admin. marketing_allowed só com consentimento explícito; sem sync Brevo automático.';
