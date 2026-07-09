-- Phase 5: sugestões de grupo / party parser (revisão humana antes de expandir convidados).

CREATE TABLE IF NOT EXISTS guest_party_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  normalized_label TEXT,
  role TEXT NOT NULL CHECK (
    role IN (
      'primary',
      'spouse',
      'named_guest',
      'plus_one',
      'family',
      'unknown_companion'
    )
  ),
  count INTEGER NOT NULL DEFAULT 1 CHECK (count >= 1),
  status TEXT NOT NULL DEFAULT 'suggested' CHECK (
    status IN ('suggested', 'confirmed', 'dismissed')
  ),
  source TEXT CHECK (
    source IN ('parser', 'admin', 'sheet', 'csv', 'rsvp')
  ),
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guest_party_members_event
  ON guest_party_members (event_id);

CREATE INDEX IF NOT EXISTS idx_guest_party_members_guest
  ON guest_party_members (guest_id);

CREATE INDEX IF NOT EXISTS idx_guest_party_members_status
  ON guest_party_members (status);

CREATE INDEX IF NOT EXISTS idx_guest_party_members_role
  ON guest_party_members (role);

CREATE TRIGGER guest_party_members_updated_at
  BEFORE UPDATE ON guest_party_members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE guest_party_members IS
  'Membros sugeridos de um grupo (party parser) — confirmados ou ignorados pelo admin; não cria convidados automaticamente.';
