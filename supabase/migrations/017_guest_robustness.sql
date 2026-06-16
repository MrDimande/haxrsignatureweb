-- Sprint robustez: grupos, normalização de nomes, índices de pesquisa
-- Idempotente

CREATE TABLE IF NOT EXISTS guest_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guest_groups_event ON guest_groups (event_id);

ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES guest_groups(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS name_normalized TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_guests_event_name_normalized
  ON guests (event_id, name_normalized);

CREATE INDEX IF NOT EXISTS idx_guests_group
  ON guests (group_id)
  WHERE group_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_guests_event_status
  ON guests (event_id, status);
