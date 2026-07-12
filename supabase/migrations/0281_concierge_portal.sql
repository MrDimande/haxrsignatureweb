-- HAXR Concierge Portal — workspace cliente (/app/concierge)
-- Separado das tabelas admin concierge_uploads / concierge_review_items (027)
-- Run after 027_concierge.sql

-- event_id TEXT: suporta slug portal (ex. jessica-samuel) ou UUID canónico
-- Sem FK a events(id) até portal auth resolver IDs de forma consistente.

CREATE TABLE IF NOT EXISTS concierge_portal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'outro',
  status TEXT NOT NULL DEFAULT 'novo',
  priority TEXT NOT NULL DEFAULT 'media',
  source TEXT NOT NULL DEFAULT 'upload',
  uploaded_by TEXT NOT NULL DEFAULT '',
  file_name TEXT,
  file_url TEXT,
  storage_path TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  original_email_from TEXT,
  original_email_subject TEXT,
  original_email_received_at TIMESTAMPTZ,
  clipped_url TEXT,
  clipped_title TEXT,
  clipped_description TEXT,
  extracted_text TEXT,
  extracted_data JSONB NOT NULL DEFAULT '{}',
  suggested_destination TEXT,
  confidence NUMERIC(4, 3),
  linked_module TEXT,
  linked_record_id TEXT,
  notes TEXT,
  classification_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_concierge_portal_items_event
  ON concierge_portal_items (event_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_concierge_portal_items_status
  ON concierge_portal_items (event_id, status);

CREATE TRIGGER concierge_portal_items_updated_at
  BEFORE UPDATE ON concierge_portal_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS concierge_portal_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES concierge_portal_items(id) ON DELETE CASCADE,
  detected_type TEXT NOT NULL,
  suggested_destination TEXT NOT NULL,
  confidence NUMERIC(4, 3) NOT NULL DEFAULT 0,
  extracted_fields JSONB NOT NULL DEFAULT '{}',
  reason TEXT NOT NULL DEFAULT '',
  engine TEXT NOT NULL DEFAULT 'rule_based',
  summary JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_concierge_portal_classifications_item
  ON concierge_portal_classifications (item_id, created_at DESC);

CREATE TABLE IF NOT EXISTS concierge_portal_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES concierge_portal_items(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  action_type TEXT NOT NULL,
  destination TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  confidence NUMERIC(4, 3) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_concierge_portal_suggestions_item
  ON concierge_portal_suggestions (item_id, created_at DESC);

CREATE TRIGGER concierge_portal_suggestions_updated_at
  BEFORE UPDATE ON concierge_portal_suggestions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS concierge_portal_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES concierge_portal_items(id) ON DELETE SET NULL,
  event_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'system',
  actor_id TEXT,
  actor_name TEXT,
  actor_role TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_concierge_portal_activities_event
  ON concierge_portal_activities (event_id, created_at DESC);

-- Bucket privado para ficheiros do portal Concierge (separado de concierge-uploads admin)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'haxr-concierge',
  'haxr-concierge',
  false,
  20971520,
  ARRAY[
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]::text[]
)
ON CONFLICT (id) DO NOTHING;
