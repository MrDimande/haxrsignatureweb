-- HAXR-owned portal authentication foundation.
--
-- Canonical transport: database/migrations (Neon PostgreSQL).
-- This migration is additive and deliberately does not read Supabase Auth,
-- recover credentials, change profiles/events/memberships, or generate users'
-- activation secrets. Existing profiles without a verified source mapping are
-- represented explicitly as PENDING_IDENTITY_RESOLUTION.

BEGIN;

DO $$
BEGIN
  CREATE TYPE public.portal_account_status AS ENUM (
    'PENDING_ACTIVATION',
    'ACTIVE',
    'SUSPENDED',
    'PENDING_IDENTITY_RESOLUTION'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.portal_token_purpose AS ENUM ('activation', 'password_reset');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.portal_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE RESTRICT,
  email TEXT,
  password_hash TEXT,
  status public.portal_account_status NOT NULL DEFAULT 'PENDING_IDENTITY_RESOLUTION',
  legacy_auth_user_id UUID UNIQUE,
  legacy_created_at TIMESTAMPTZ,
  legacy_last_sign_in_at TIMESTAMPTZ,
  email_verified_at TIMESTAMPTZ,
  password_set_at TIMESTAMPTZ,
  auth_version INTEGER NOT NULL DEFAULT 1 CHECK (auth_version >= 1),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT portal_accounts_email_canonical CHECK (
    email IS NULL OR email = lower(trim(email))
  ),
  CONSTRAINT portal_accounts_active_has_password CHECK (
    status <> 'ACTIVE' OR password_hash IS NOT NULL
  ),
  CONSTRAINT portal_accounts_password_state CHECK (
    password_hash IS NULL OR password_set_at IS NOT NULL
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS portal_accounts_email_lower_key
  ON public.portal_accounts (lower(email))
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS portal_accounts_profile_status_idx
  ON public.portal_accounts (profile_id, status);

CREATE TABLE IF NOT EXISTS public.portal_account_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.portal_accounts(id) ON DELETE RESTRICT,
  purpose public.portal_token_purpose NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  invalidated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT portal_account_tokens_expiry_after_creation CHECK (expires_at > created_at),
  CONSTRAINT portal_account_tokens_terminal_state CHECK (
    NOT (consumed_at IS NOT NULL AND invalidated_at IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS portal_account_tokens_one_live_per_purpose_key
  ON public.portal_account_tokens (account_id, purpose)
  WHERE consumed_at IS NULL AND invalidated_at IS NULL;

CREATE INDEX IF NOT EXISTS portal_account_tokens_lookup_idx
  ON public.portal_account_tokens (token_hash, expires_at)
  WHERE consumed_at IS NULL AND invalidated_at IS NULL;

CREATE TABLE IF NOT EXISTS public.portal_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.portal_accounts(id) ON DELETE RESTRICT,
  token_hash CHAR(64) NOT NULL UNIQUE,
  auth_version INTEGER NOT NULL CHECK (auth_version >= 1),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT portal_sessions_expiry_after_creation CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS portal_sessions_account_active_idx
  ON public.portal_sessions (account_id, expires_at)
  WHERE revoked_at IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE oid = 'public.set_updated_at()'::regprocedure)
     AND NOT EXISTS (
       SELECT 1
         FROM pg_trigger
        WHERE tgrelid = 'public.portal_accounts'::regclass
          AND tgname = 'portal_accounts_updated_at'
          AND NOT tgisinternal
     ) THEN
    CREATE TRIGGER portal_accounts_updated_at
      BEFORE UPDATE ON public.portal_accounts
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- Every existing canonical profile is accounted for without fabricating an
-- identity. A separately reviewed metadata-import may transition a row to
-- PENDING_ACTIVATION only after it has a confirmed legacy email mapping.
INSERT INTO public.portal_accounts (profile_id, status)
SELECT p.id, 'PENDING_IDENTITY_RESOLUTION'::public.portal_account_status
  FROM public.profiles p
ON CONFLICT (profile_id) DO NOTHING;

REVOKE ALL ON TABLE public.portal_accounts FROM PUBLIC;
REVOKE ALL ON TABLE public.portal_account_tokens FROM PUBLIC;
REVOKE ALL ON TABLE public.portal_sessions FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'haxrweb_runtime') THEN
    GRANT SELECT, INSERT, UPDATE ON public.portal_accounts TO haxrweb_runtime;
    GRANT SELECT, INSERT, UPDATE ON public.portal_account_tokens TO haxrweb_runtime;
    GRANT SELECT, INSERT, UPDATE ON public.portal_sessions TO haxrweb_runtime;
  END IF;
END $$;

COMMENT ON TABLE public.portal_accounts IS
  'Private HAXR portal identities bound 1:1 to existing public.profiles. Never stores legacy password material.';
COMMENT ON TABLE public.portal_account_tokens IS
  'Hashed, expiring, one-time portal activation and password-reset tokens.';
COMMENT ON TABLE public.portal_sessions IS
  'Hashed opaque HAXR portal sessions. The browser receives only id.secret in an HttpOnly cookie.';

COMMIT;
