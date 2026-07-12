-- HAXR Signature — Client App Auth & Onboarding Events (Fase A)
-- Draft migration 036 — NÃO aplicar sem review em staging.
--
-- Objectivo:
--   Camada de dados da app casal (/app/*) separada da tabela operacional `events`
--   (admin, convidados, seating, sheets). Liga utilizadores Supabase Auth a eventos
--   criados via onboarding, com membership e snapshot para idempotência.
--
-- Depende de:
--   001_admin_schema.sql  (set_updated_at)
--   002_business_v2.sql   (event_type enum)
--   006_events_seating.sql (events operacional — FK opcional)
--
-- Fora de âmbito:
--   Dashboard Admin, HAXR Concierge, alterações à tabela `events` operacional.
--
-- Referência: docs/ONBOARDING_EVENT_CREATION_SPEC.md

-- =============================================================================
-- 1. ENUMS (idempotentes)
-- =============================================================================

-- Papéis de membro dentro de um client_event (RBAC futuro: parceiro, planner, viewer).
DO $$ BEGIN
  CREATE TYPE client_event_member_role AS ENUM (
    'owner',
    'partner',
    'planner',
    'viewer'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Ciclo de vida do evento na app cliente (distinto de is_active boolean).
DO $$ BEGIN
  CREATE TYPE client_event_status AS ENUM (
    'planning',
    'active',
    'completed',
    'archived'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Papel global do utilizador na app /app (não confundir com admin cookie HMAC).
DO $$ BEGIN
  CREATE TYPE app_user_role AS ENUM (
    'client',
    'team',
    'admin'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- 2. PROFILES — extensão de auth.users
-- =============================================================================
-- Um registo por utilizador Supabase Auth. Fonte de app_role e evento activo na UI.
-- NÃO usar raw_user_meta_data para autorização em RLS.

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  planner_role TEXT,
  app_role app_user_role NOT NULL DEFAULT 'client',
  active_client_event_id UUID,
  onboarding_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profiles_planner_role_check CHECK (
    planner_role IS NULL OR planner_role IN ('noiva', 'consultor')
  )
);

COMMENT ON TABLE profiles IS
  'Perfil da app casal (/app). Extensão 1:1 de auth.users. Separado de clients (admin comercial).';

COMMENT ON COLUMN profiles.id IS 'Igual a auth.users.id';
COMMENT ON COLUMN profiles.app_role IS 'client (default) | team | admin — usado em políticas futuras';
COMMENT ON COLUMN profiles.active_client_event_id IS 'Evento activo na UI; FK para client_events após criação da tabela';
COMMENT ON COLUMN profiles.onboarding_synced_at IS 'Timestamp do sync localStorage → BD (POST /api/onboarding/sync)';
COMMENT ON COLUMN profiles.planner_role IS 'Preferência UI do onboarding: noiva | consultor';

CREATE INDEX IF NOT EXISTS idx_profiles_app_role
  ON profiles (app_role);

CREATE INDEX IF NOT EXISTS idx_profiles_active_event
  ON profiles (active_client_event_id)
  WHERE active_client_event_id IS NOT NULL;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- 3. CLIENT_EVENTS — eventos da app cliente (≠ events operacional)
-- =============================================================================
-- Tabela principal criada pelo onboarding. Não substitui `events` (business_id, guests).
-- operational_event_id liga ao evento operacional quando a equipa HAXR provisionar.

CREATE TABLE IF NOT EXISTS client_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  slug TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_type event_type NOT NULL DEFAULT 'wedding',
  bride_name TEXT NOT NULL,
  groom_name TEXT NOT NULL,
  event_date DATE,
  event_location TEXT NOT NULL DEFAULT '',
  estimated_guests INTEGER NOT NULL DEFAULT 0,
  budget_min BIGINT,
  budget_max BIGINT,
  status client_event_status NOT NULL DEFAULT 'planning',
  source TEXT NOT NULL DEFAULT 'onboarding',
  services_interested TEXT[] NOT NULL DEFAULT '{}',
  phone TEXT,
  operational_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  onboarding_fingerprint TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT client_events_event_name_len CHECK (char_length(trim(event_name)) >= 2),
  CONSTRAINT client_events_bride_name_len CHECK (char_length(trim(bride_name)) >= 1),
  CONSTRAINT client_events_groom_name_len CHECK (char_length(trim(groom_name)) >= 1),
  CONSTRAINT client_events_guests_positive CHECK (estimated_guests >= 0),
  CONSTRAINT client_events_budget_nonneg CHECK (
    (budget_min IS NULL OR budget_min >= 0)
    AND (budget_max IS NULL OR budget_max >= 0)
  ),
  CONSTRAINT client_events_budget_range CHECK (
    budget_min IS NULL OR budget_max IS NULL OR budget_min <= budget_max
  ),
  CONSTRAINT client_events_source_check CHECK (
    source IN ('onboarding', 'manual', 'import')
  )
);

COMMENT ON TABLE client_events IS
  'Eventos da app casal (/app). Separado de public.events (operacional/admin).';

COMMENT ON COLUMN client_events.owner_user_id IS 'Utilizador que criou o evento (dono MVP)';
COMMENT ON COLUMN client_events.operational_event_id IS
  'FK opcional para public.events quando seating/sheets forem provisionados pela equipa HAXR';
COMMENT ON COLUMN client_events.onboarding_fingerprint IS
  'Hash estável do onboarding para idempotência (evitar duplicados no sync)';
COMMENT ON COLUMN client_events.is_active IS
  'Flag operacional MVP (índice único parcial: 1 activo por owner). Ver nota is_active vs status abaixo.';
COMMENT ON COLUMN client_events.status IS
  'Ciclo de vida comercial: planning | active | completed | archived. Não confundir com is_active.';
COMMENT ON COLUMN client_events.slug IS 'Slug URL-friendly; não único global';

-- NOTA is_active vs status (não alterar estrutura nesta migration):
--   • is_active  → controlo técnico/UI e índice único MVP (arquivar = false).
--   • status     → estado de negócio do evento (planning → archived).
--   Regra API futura ao arquivar: is_active = false AND status = 'archived'.
--   Evitar combinações incoerentes (ex. is_active=true + status=archived).

-- Idempotência: mesmo fingerprint + owner não cria segundo evento activo.
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_events_owner_fingerprint
  ON client_events (owner_user_id, onboarding_fingerprint)
  WHERE onboarding_fingerprint IS NOT NULL AND is_active = true;

-- MVP: máximo 1 evento activo por utilizador dono.
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_events_one_active_per_owner
  ON client_events (owner_user_id)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_client_events_owner_active
  ON client_events (owner_user_id, is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_events_slug
  ON client_events (slug);

CREATE INDEX IF NOT EXISTS idx_client_events_operational
  ON client_events (operational_event_id)
  WHERE operational_event_id IS NOT NULL;

DROP TRIGGER IF EXISTS client_events_updated_at ON client_events;
CREATE TRIGGER client_events_updated_at
  BEFORE UPDATE ON client_events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- FK profiles → client_events (após client_events existir)
DO $$ BEGIN
  ALTER TABLE profiles
    ADD CONSTRAINT profiles_active_client_event_fk
    FOREIGN KEY (active_client_event_id) REFERENCES client_events(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- 4. EVENT_MEMBERS — membership / RBAC futuro
-- =============================================================================
-- Na criação via API: owner é inserido com role owner.
-- Convites futuros: partner, planner, viewer.

CREATE TABLE IF NOT EXISTS event_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_event_id UUID NOT NULL REFERENCES client_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role client_event_member_role NOT NULL DEFAULT 'owner',
  invited_email TEXT,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_event_id, user_id)
);

COMMENT ON TABLE event_members IS
  'Quem pode aceder a cada client_event. Base para RBAC e equipa HAXR atribuída.';

COMMENT ON COLUMN event_members.role IS 'owner na criação; partner/planner/viewer no futuro';
COMMENT ON COLUMN event_members.invited_email IS 'Reservado para convites por email (fase posterior)';

CREATE INDEX IF NOT EXISTS idx_event_members_user
  ON event_members (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_members_event
  ON event_members (client_event_id, role);

DROP TRIGGER IF EXISTS event_members_updated_at ON event_members;
CREATE TRIGGER event_members_updated_at
  BEFORE UPDATE ON event_members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- 5. EVENT_ONBOARDING_SNAPSHOTS — auditoria + idempotência
-- =============================================================================
-- Cópia imutável do payload de onboarding no momento do sync.
-- INSERT previsto via API server (service role); clientes só leem os próprios.

CREATE TABLE IF NOT EXISTS event_onboarding_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_event_id UUID NOT NULL REFERENCES client_events(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_fingerprint TEXT NOT NULL,
  payload JSONB NOT NULL,
  synced_from TEXT NOT NULL DEFAULT 'localStorage',
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id, local_fingerprint),
  CONSTRAINT event_onboarding_snapshots_payload_object CHECK (jsonb_typeof(payload) = 'object'),
  CONSTRAINT event_onboarding_snapshots_synced_from_check CHECK (
    synced_from IN ('localStorage', 'api', 'manual')
  )
);

COMMENT ON TABLE event_onboarding_snapshots IS
  'Auditoria do onboarding sincronizado. Suporta idempotência do POST /api/onboarding/sync.';

COMMENT ON COLUMN event_onboarding_snapshots.local_fingerprint IS
  'Hash estável (ex. sha256) dos campos obrigatórios do wizard';
COMMENT ON COLUMN event_onboarding_snapshots.idempotency_key IS
  'Header Idempotency-Key opcional para replay seguro';

CREATE INDEX IF NOT EXISTS idx_onboarding_snapshots_event
  ON event_onboarding_snapshots (client_event_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_snapshots_owner
  ON event_onboarding_snapshots (owner_user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_onboarding_snapshots_idempotency_key
  ON event_onboarding_snapshots (owner_user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- =============================================================================
-- 6. HELPERS RLS (SECURITY DEFINER — evita recursão entre políticas)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_client_event_owner(p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.client_events ce
    WHERE ce.id = p_event_id
      AND ce.owner_user_id = (SELECT auth.uid())
  );
$$;

COMMENT ON FUNCTION public.is_client_event_owner(UUID) IS
  'True se auth.uid() é owner do client_event. SECURITY DEFINER para uso em RLS.';

CREATE OR REPLACE FUNCTION public.is_client_event_member(
  p_event_id UUID,
  p_roles client_event_member_role[] DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.event_members em
    WHERE em.client_event_id = p_event_id
      AND em.user_id = (SELECT auth.uid())
      AND (p_roles IS NULL OR em.role = ANY (p_roles))
  );
$$;

COMMENT ON FUNCTION public.is_client_event_member(UUID, client_event_member_role[]) IS
  'True se auth.uid() é membro do client_event (opcionalmente com roles específicos).';

REVOKE ALL ON FUNCTION public.is_client_event_owner(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_client_event_member(UUID, client_event_member_role[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_client_event_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_client_event_member(UUID, client_event_member_role[]) TO authenticated;

-- =============================================================================
-- 7. AUTH TRIGGER — criar profile ao registar utilizador
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), ''),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'phone', '')), '')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Cria profiles ao inserir em auth.users. Não copia user_metadata para decisões de autorização.';

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- 8. ROW LEVEL SECURITY
-- =============================================================================
-- Princípios:
--   • TO authenticated + predicado auth.uid() / membership
--   • Sem políticas DELETE para clientes (arquivar via status)
--   • Snapshots: SELECT próprio; INSERT via service role (API server)
--   • service_role bypassa RLS no servidor — nunca expor no browser

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_onboarding_snapshots ENABLE ROW LEVEL SECURITY;

-- ─── profiles ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS profiles_select_own ON profiles;
CREATE POLICY profiles_select_own
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS profiles_insert_own ON profiles;
CREATE POLICY profiles_insert_own
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS profiles_update_own ON profiles;
CREATE POLICY profiles_update_own
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (
    id = (SELECT auth.uid())
    AND (
      active_client_event_id IS NULL
      OR public.is_client_event_owner(active_client_event_id)
      OR public.is_client_event_member(active_client_event_id)
    )
  );

-- ─── client_events ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS client_events_select_member ON client_events;
CREATE POLICY client_events_select_member
  ON client_events
  FOR SELECT
  TO authenticated
  USING (
    owner_user_id = (SELECT auth.uid())
    OR public.is_client_event_member(id)
  );

DROP POLICY IF EXISTS client_events_insert_owner ON client_events;
CREATE POLICY client_events_insert_owner
  ON client_events
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS client_events_update_owner ON client_events;
CREATE POLICY client_events_update_owner
  ON client_events
  FOR UPDATE
  TO authenticated
  USING (owner_user_id = (SELECT auth.uid()))
  WITH CHECK (owner_user_id = (SELECT auth.uid()));

-- Sem política DELETE: clientes não apagam eventos (usar status archived + is_active=false).

-- ─── event_members ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS event_members_select_same_event ON event_members;
CREATE POLICY event_members_select_same_event
  ON event_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR public.is_client_event_member(client_event_id)
  );

-- Owner do client_event pode inserir membros (bootstrap + convites futuros).
-- is_client_event_owner() cobre o primeiro member (sem linha em event_members ainda)
-- e permite ao owner adicionar partner/planner/viewer com qualquer user_id válido.
DROP POLICY IF EXISTS event_members_insert_by_owner ON event_members;
CREATE POLICY event_members_insert_by_owner
  ON event_members
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_client_event_owner(client_event_id));

DROP POLICY IF EXISTS event_members_update_by_owner ON event_members;
CREATE POLICY event_members_update_by_owner
  ON event_members
  FOR UPDATE
  TO authenticated
  USING (public.is_client_event_owner(client_event_id))
  WITH CHECK (public.is_client_event_owner(client_event_id));

-- ─── event_onboarding_snapshots ─────────────────────────────────────────────
-- SELECT: apenas o owner do snapshot.
-- INSERT/UPDATE/DELETE: sem política para authenticated → negado; API usa service_role.

DROP POLICY IF EXISTS onboarding_snapshots_select_owner ON event_onboarding_snapshots;
CREATE POLICY onboarding_snapshots_select_owner
  ON event_onboarding_snapshots
  FOR SELECT
  TO authenticated
  USING (owner_user_id = (SELECT auth.uid()));

-- =============================================================================
-- 9. GRANTS E REVOKE (Data API — RLS restringe linhas; não conceder DELETE)
-- =============================================================================

-- Revogar acesso directo anon às tabelas da app cliente (defesa em profundidade).
REVOKE ALL ON profiles FROM anon;
REVOKE ALL ON client_events FROM anon;
REVOKE ALL ON event_members FROM anon;
REVOKE ALL ON event_onboarding_snapshots FROM anon;

GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON client_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON event_members TO authenticated;
GRANT SELECT ON event_onboarding_snapshots TO authenticated;

-- service_role mantém acesso total via bypass RLS (apenas servidor).

-- =============================================================================
-- 10. BACKFILL — profiles para auth.users já existentes (upgrade / staging)
-- =============================================================================
-- Seguro para re-run: só insere users sem profile; ON CONFLICT evita duplicados.

INSERT INTO public.profiles (id)
SELECT u.id
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- FIM — Revisar em staging antes de supabase db push / migration deploy
-- =============================================================================
