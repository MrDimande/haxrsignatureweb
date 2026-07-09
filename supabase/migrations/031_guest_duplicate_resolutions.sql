-- Phase 3: memória de resolução de duplicados (merge manual → sync futuro).

CREATE TABLE IF NOT EXISTS guest_duplicate_resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  primary_guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  duplicate_guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,
  duplicate_name TEXT,
  duplicate_name_normalized TEXT,
  duplicate_email TEXT,
  duplicate_phone TEXT,
  duplicate_fingerprint TEXT,
  source TEXT CHECK (
    source IN ('manual_merge', 'google_sheet', 'csv_upload', 'rsvp', 'admin')
  ),
  resolution_status TEXT NOT NULL CHECK (
    resolution_status IN ('merged', 'ignored', 'restored', 'needs_review')
  ),
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guest_duplicate_resolutions_event
  ON guest_duplicate_resolutions (event_id);

CREATE INDEX IF NOT EXISTS idx_guest_duplicate_resolutions_primary
  ON guest_duplicate_resolutions (primary_guest_id);

CREATE INDEX IF NOT EXISTS idx_guest_duplicate_resolutions_duplicate_guest
  ON guest_duplicate_resolutions (duplicate_guest_id)
  WHERE duplicate_guest_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_guest_duplicate_resolutions_name
  ON guest_duplicate_resolutions (duplicate_name_normalized)
  WHERE duplicate_name_normalized IS NOT NULL AND duplicate_name_normalized <> '';

CREATE INDEX IF NOT EXISTS idx_guest_duplicate_resolutions_email
  ON guest_duplicate_resolutions (duplicate_email)
  WHERE duplicate_email IS NOT NULL AND duplicate_email <> '';

CREATE INDEX IF NOT EXISTS idx_guest_duplicate_resolutions_phone
  ON guest_duplicate_resolutions (duplicate_phone)
  WHERE duplicate_phone IS NOT NULL AND duplicate_phone <> '';

CREATE INDEX IF NOT EXISTS idx_guest_duplicate_resolutions_fingerprint
  ON guest_duplicate_resolutions (duplicate_fingerprint)
  WHERE duplicate_fingerprint IS NOT NULL AND duplicate_fingerprint <> '';

CREATE INDEX IF NOT EXISTS idx_guest_duplicate_resolutions_status
  ON guest_duplicate_resolutions (resolution_status);

CREATE TRIGGER guest_duplicate_resolutions_updated_at
  BEFORE UPDATE ON guest_duplicate_resolutions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE guest_duplicate_resolutions IS
  'Memória de duplicados resolvidos pelo admin — variantes de nome/email/telefone mapeiam ao convidado principal em syncs futuros.';
