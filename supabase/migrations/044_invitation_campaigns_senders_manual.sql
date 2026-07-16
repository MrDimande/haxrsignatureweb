-- HAXR Signature — Campanhas de convites + sender profiles + modo manual fail-closed
-- Migration 044 — NÃO aplicar em Production sem revisão.
-- Acesso: service_role (bypass RLS). anon/authenticated sem policies = deny-by-default.
-- Rollback notes: em clone/staging, reverter removendo triggers e tabelas nesta ordem:
-- campaign_recipients_updated_at, invitation_campaigns_updated_at,
-- sender_profiles_updated_at; depois delivery_attempts, campaign_recipients,
-- invitation_campaigns e sender_profiles. Não executar rollback em Production sem autorização.

-- ─── sender_profiles (sem tokens plaintext) ─────────────────────────────────

CREATE TABLE IF NOT EXISTS public.sender_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  sender_kind TEXT NOT NULL CHECK (
    sender_kind IN (
      'haxr_official',
      'client_verified_business',
      'manual_authenticated_whatsapp'
    )
  ),
  public_name TEXT NOT NULL,
  masked_number TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'none' CHECK (
    provider IN ('none', 'meta_cloud_api', 'manual_wa_me')
  ),
  provider_phone_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'inactive', 'pending_verification', 'revoked')
  ),
  is_default BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT sender_profiles_no_plaintext_token CHECK (
    NOT (
      (metadata ? 'access_token')
      OR (metadata ? 'api_token')
      OR (metadata ? 'token')
      OR (metadata ? 'secret')
      OR (metadata ? 'api_key')
    )
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sender_profiles_one_default_per_event
  ON public.sender_profiles (event_id)
  WHERE is_default = true AND status = 'active';

CREATE INDEX IF NOT EXISTS idx_sender_profiles_event
  ON public.sender_profiles (event_id);

CREATE INDEX IF NOT EXISTS idx_sender_profiles_event_kind
  ON public.sender_profiles (event_id, sender_kind);

CREATE TRIGGER sender_profiles_updated_at
  BEFORE UPDATE ON public.sender_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE public.sender_profiles IS
  'Perfis de envio WhatsApp por evento. Sem tokens plaintext. Apenas kinds autorizados (HAXR, empresarial verificado, manual autenticado).';

-- ─── invitation_campaigns ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.invitation_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  sender_profile_id UUID REFERENCES public.sender_profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  invitation_registry_key TEXT NOT NULL DEFAULT '',
  recipients_selection JSONB NOT NULL DEFAULT '{"mode":"selected_guests"}'::jsonb,
  batch_key TEXT NOT NULL DEFAULT 'default',
  message_template TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN (
      'draft',
      'ready',
      'scheduled',
      'sending_manual',
      'paused',
      'completed',
      'cancelled'
    )
  ),
  scheduled_at TIMESTAMPTZ,
  preview_limit INTEGER NOT NULL DEFAULT 25 CHECK (preview_limit > 0 AND preview_limit <= 500),
  test_mode BOOLEAN NOT NULL DEFAULT true,
  rsvp_deadline TEXT NOT NULL DEFAULT '',
  couple_names TEXT NOT NULL DEFAULT '',
  event_name TEXT NOT NULL DEFAULT '',
  event_date TEXT NOT NULL DEFAULT '',
  event_location TEXT NOT NULL DEFAULT '',
  idempotency_key TEXT,
  send_mode_snapshot TEXT NOT NULL DEFAULT 'disabled' CHECK (
    send_mode_snapshot IN ('disabled', 'manual', 'preview_test', 'production')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_invitation_campaigns_event_idempotency
  ON public.invitation_campaigns (event_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL AND idempotency_key <> '';

CREATE INDEX IF NOT EXISTS idx_invitation_campaigns_event
  ON public.invitation_campaigns (event_id);

CREATE INDEX IF NOT EXISTS idx_invitation_campaigns_event_status
  ON public.invitation_campaigns (event_id, status);

CREATE TRIGGER invitation_campaigns_updated_at
  BEFORE UPDATE ON public.invitation_campaigns
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE public.invitation_campaigns IS
  'Campanhas de convite WhatsApp isoladas por event_id. Inclui selecção de destinatários, batch, preview e test_mode. Provider automático fail-closed até credenciais e modo production.';

-- ─── campaign_recipients ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.invitation_campaigns(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
  guest_name TEXT NOT NULL,
  phone_e164 TEXT,
  phone_masked TEXT NOT NULL DEFAULT '',
  invitation_url TEXT NOT NULL DEFAULT '',
  rendered_message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN (
      'pending',
      'previewed',
      'copied',
      'opened',
      'marked_sent',
      'failed',
      'cancelled',
      'skipped'
    )
  ),
  batch_key TEXT NOT NULL DEFAULT 'default',
  last_action_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT campaign_recipients_guest_unique UNIQUE (campaign_id, guest_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign
  ON public.campaign_recipients (campaign_id);

CREATE INDEX IF NOT EXISTS idx_campaign_recipients_event
  ON public.campaign_recipients (event_id);

CREATE INDEX IF NOT EXISTS idx_campaign_recipients_event_campaign
  ON public.campaign_recipients (event_id, campaign_id);

CREATE INDEX IF NOT EXISTS idx_campaign_recipients_status
  ON public.campaign_recipients (campaign_id, status);

CREATE TRIGGER campaign_recipients_updated_at
  BEFORE UPDATE ON public.campaign_recipients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE public.campaign_recipients IS
  'Destinatários por campanha com isolamento event_id. Mensagens pré-renderizadas para modo manual.';

-- ─── delivery_attempts (audit) ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.delivery_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.invitation_campaigns(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.campaign_recipients(id) ON DELETE CASCADE,
  attempt_kind TEXT NOT NULL CHECK (
    attempt_kind IN (
      'manual_copy',
      'manual_open',
      'manual_marked_sent',
      'preview',
      'provider_blocked',
      'webhook_ignored',
      'export'
    )
  ),
  outcome TEXT NOT NULL CHECK (
    outcome IN ('success', 'blocked', 'failed', 'noop')
  ),
  detail TEXT NOT NULL DEFAULT '',
  provider_ref TEXT,
  actor TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_attempts_event
  ON public.delivery_attempts (event_id);

CREATE INDEX IF NOT EXISTS idx_delivery_attempts_campaign
  ON public.delivery_attempts (campaign_id);

CREATE INDEX IF NOT EXISTS idx_delivery_attempts_recipient
  ON public.delivery_attempts (recipient_id);

CREATE INDEX IF NOT EXISTS idx_delivery_attempts_created
  ON public.delivery_attempts (event_id, created_at DESC);

COMMENT ON TABLE public.delivery_attempts IS
  'Auditoria de tentativas de entrega. Sem envio automático de provider neste MVP.';

-- ─── RLS deny-by-default (service_role bypass) ──────────────────────────────

ALTER TABLE public.sender_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_attempts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.sender_profiles FROM anon, authenticated;
REVOKE ALL ON public.invitation_campaigns FROM anon, authenticated;
REVOKE ALL ON public.campaign_recipients FROM anon, authenticated;
REVOKE ALL ON public.delivery_attempts FROM anon, authenticated;

GRANT ALL ON public.sender_profiles TO service_role;
GRANT ALL ON public.invitation_campaigns TO service_role;
GRANT ALL ON public.campaign_recipients TO service_role;
GRANT ALL ON public.delivery_attempts TO service_role;
