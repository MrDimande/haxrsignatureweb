-- HAXR Concierge — uploads, revisão IA, fornecedores, checklist, moodboard
-- Run after 026_edition_gifts_rsvp_extras.sql

DO $$ BEGIN
  CREATE TYPE concierge_doc_type AS ENUM (
    'vendor_proposal',
    'payment_receipt',
    'guest_list',
    'visual_reference',
    'checklist',
    'contract',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE concierge_review_status AS ENUM (
    'uploaded',
    'processing',
    'pending_review',
    'approved',
    'rejected',
    'failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Uploads ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS concierge_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  status concierge_review_status NOT NULL DEFAULT 'uploaded',
  extracted_text TEXT NOT NULL DEFAULT '',
  error_message TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_concierge_uploads_event
  ON concierge_uploads (event_id, created_at DESC);

CREATE TRIGGER concierge_uploads_updated_at
  BEFORE UPDATE ON concierge_uploads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Revisão IA ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS concierge_review_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID NOT NULL REFERENCES concierge_uploads(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  document_type concierge_doc_type NOT NULL DEFAULT 'other',
  status concierge_review_status NOT NULL DEFAULT 'pending_review',
  extracted_data JSONB NOT NULL DEFAULT '{}',
  final_data JSONB,
  ai_model TEXT NOT NULL DEFAULT '',
  ai_raw_response TEXT NOT NULL DEFAULT '',
  reviewed_by TEXT NOT NULL DEFAULT '',
  reviewed_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ,
  apply_error TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_concierge_review_event_status
  ON concierge_review_items (event_id, status, created_at DESC);

CREATE TRIGGER concierge_review_items_updated_at
  BEFORE UPDATE ON concierge_review_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Fornecedores do evento ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS event_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  service_category TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '',
  proposed_amount NUMERIC(14, 2),
  currency TEXT NOT NULL DEFAULT 'MZN',
  payment_terms TEXT NOT NULL DEFAULT '',
  deadline DATE,
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'em_analise',
  source_review_id UUID REFERENCES concierge_review_items(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_vendors_event
  ON event_vendors (event_id, created_at DESC);

CREATE TRIGGER event_vendors_updated_at
  BEFORE UPDATE ON event_vendors
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Checklist ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS event_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_date DATE,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'pending',
  source_review_id UUID REFERENCES concierge_review_items(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_checklist_event
  ON event_checklist_items (event_id, due_date NULLS LAST);

CREATE TRIGGER event_checklist_items_updated_at
  BEFORE UPDATE ON event_checklist_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Moodboard ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS event_moodboard_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  storage_path TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  source_review_id UUID REFERENCES concierge_review_items(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_moodboard_event
  ON event_moodboard_items (event_id, created_at DESC);

-- ─── Auditoria IA ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS concierge_ai_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  upload_id UUID REFERENCES concierge_uploads(id) ON DELETE SET NULL,
  review_id UUID REFERENCES concierge_review_items(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT '',
  prompt_tokens INTEGER,
  response_tokens INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_concierge_audit_event
  ON concierge_ai_audit_logs (event_id, created_at DESC);

-- ─── Storage bucket (privado) ────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'concierge-uploads',
  'concierge-uploads',
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
