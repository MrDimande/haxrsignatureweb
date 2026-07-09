-- Portal premium completo: timeline, aprovações, mensagens, comprovativos, contratos
-- Idempotente

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS date_hold_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS operational_phase TEXT;

CREATE TABLE IF NOT EXISTS portal_timeline_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  category TEXT NOT NULL DEFAULT 'milestone'
    CHECK (category IN ('briefing', 'proposal', 'deposit', 'invite', 'rsvp', 'seating', 'checkin', 'report', 'milestone', 'meeting', 'delivery', 'event_day', 'other')),
  visibility TEXT NOT NULL DEFAULT 'client'
    CHECK (visibility IN ('client', 'internal')),
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'done', 'delayed', 'skipped')),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portal_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  approval_type TEXT NOT NULL DEFAULT 'delivery'
    CHECK (approval_type IN ('invite', 'layout', 'delivery', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'changes_requested')),
  due_at TIMESTAMPTZ,
  decided_at TIMESTAMPTZ,
  decided_note TEXT,
  attachment_storage_path TEXT,
  attachment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL DEFAULT 'Equipa HAXR',
  body TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portal_payment_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  amount NUMERIC(14, 2),
  currency TEXT NOT NULL DEFAULT 'MZN',
  payment_method TEXT NOT NULL DEFAULT 'transfer',
  reference TEXT,
  notes TEXT,
  storage_path TEXT,
  file_name TEXT,
  mime_type TEXT,
  status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review', 'approved', 'rejected')),
  reviewed_at TIMESTAMPTZ,
  reviewed_note TEXT,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  receipt_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portal_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  storage_path TEXT,
  file_url TEXT,
  signed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_timeline_event ON portal_timeline_items (event_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_portal_approvals_client ON portal_approvals (client_id, status);
CREATE INDEX IF NOT EXISTS idx_portal_messages_client ON portal_messages (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portal_payment_proofs_status ON portal_payment_proofs (status);
CREATE INDEX IF NOT EXISTS idx_portal_contracts_client ON portal_contracts (client_id);
