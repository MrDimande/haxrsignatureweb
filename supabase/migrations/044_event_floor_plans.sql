-- HAXR Signature — Find Your Seat: Planta do Evento
-- PROPOSTA APENAS. Não executar automaticamente em produção.
-- Depende de 006_events_seating.sql e 036_client_app_auth.sql.

CREATE TABLE IF NOT EXISTS event_floor_plans (
  event_id UUID PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
  room JSONB NOT NULL DEFAULT '{"width":20,"length":14,"gridSize":0.5,"unit":"m"}'::JSONB,
  items JSONB NOT NULL DEFAULT '[]'::JSONB,
  print_preferences JSONB NOT NULL DEFAULT '{"format":"A4","orientation":"landscape","template":"technical","showGuestNames":false}'::JSONB,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT event_floor_plans_room_object CHECK (jsonb_typeof(room) = 'object'),
  CONSTRAINT event_floor_plans_items_array CHECK (jsonb_typeof(items) = 'array'),
  CONSTRAINT event_floor_plans_print_object CHECK (jsonb_typeof(print_preferences) = 'object')
);

COMMENT ON TABLE event_floor_plans IS
  'Geometria da planta 2D por evento. Não replica mesas, lugares ou convidados.';
COMMENT ON COLUMN event_floor_plans.items IS
  'Layout visual. Mesas referenciam a fonte operacional por table_name; ocupação deriva sempre de seats/guests.';

CREATE INDEX IF NOT EXISTS idx_event_floor_plans_updated
  ON event_floor_plans (updated_at DESC);

DROP TRIGGER IF EXISTS event_floor_plans_updated_at ON event_floor_plans;
CREATE TRIGGER event_floor_plans_updated_at
  BEFORE UPDATE ON event_floor_plans
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE event_floor_plans ENABLE ROW LEVEL SECURITY;

-- Clientes só conseguem ver plantas de eventos operacionais ligados a um
-- client_event do qual são owner ou member.
DROP POLICY IF EXISTS event_floor_plans_select_member ON event_floor_plans;
CREATE POLICY event_floor_plans_select_member
  ON event_floor_plans
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM client_events ce
      WHERE ce.operational_event_id = event_floor_plans.event_id
        AND (
          ce.owner_user_id = (SELECT auth.uid())
          OR is_client_event_member(ce.id)
        )
    )
  );

-- Edição directa da app cliente: owner, partner ou planner.
DROP POLICY IF EXISTS event_floor_plans_insert_editor ON event_floor_plans;
CREATE POLICY event_floor_plans_insert_editor
  ON event_floor_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM client_events ce
      WHERE ce.operational_event_id = event_floor_plans.event_id
        AND (
          ce.owner_user_id = (SELECT auth.uid())
          OR is_client_event_member(
            ce.id,
            ARRAY['partner', 'planner']::client_event_member_role[]
          )
        )
    )
  );

DROP POLICY IF EXISTS event_floor_plans_update_editor ON event_floor_plans;
CREATE POLICY event_floor_plans_update_editor
  ON event_floor_plans
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM client_events ce
      WHERE ce.operational_event_id = event_floor_plans.event_id
        AND (
          ce.owner_user_id = (SELECT auth.uid())
          OR is_client_event_member(
            ce.id,
            ARRAY['partner', 'planner']::client_event_member_role[]
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM client_events ce
      WHERE ce.operational_event_id = event_floor_plans.event_id
        AND (
          ce.owner_user_id = (SELECT auth.uid())
          OR is_client_event_member(
            ce.id,
            ARRAY['partner', 'planner']::client_event_member_role[]
          )
        )
    )
  );

-- Sem DELETE directo: o layout acompanha o ciclo de vida do evento.
REVOKE ALL ON event_floor_plans FROM anon;
GRANT SELECT, INSERT, UPDATE ON event_floor_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON event_floor_plans TO service_role;

-- Rollback manual (só após confirmação):
-- DROP TABLE IF EXISTS event_floor_plans;
