-- HAXR Signature — Admin Per-User Authentication Foundation.
--
-- Canonical transport: database/migrations (Neon PostgreSQL).
-- Additive migration: introduces per-user credentials, opaque sessions,
-- single-use invites, password reset tokens, and extends the admin audit trail.
--
-- Pre-conditions:
-- - Existing admin_users and admin_user_audit_log preserved.
-- - Production OWNER identity preserved.
-- - haxrweb_runtime granted least-privilege operations.

BEGIN;

-- 1. ADMIN CREDENTIALS TABLE
CREATE TABLE IF NOT EXISTS public.admin_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL UNIQUE REFERENCES public.admin_users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  password_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  credential_version INTEGER NOT NULL DEFAULT 1 CHECK (credential_version >= 1),
  failed_login_count INTEGER NOT NULL DEFAULT 0 CHECK (failed_login_count >= 0),
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT admin_credentials_password_hash_check CHECK (char_length(password_hash) >= 16)
);

CREATE INDEX IF NOT EXISTS admin_credentials_user_idx
  ON public.admin_credentials (admin_user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_trigger
     WHERE tgrelid = 'public.admin_credentials'::regclass
       AND tgname = 'admin_credentials_updated_at'
       AND NOT tgisinternal
  ) THEN
    CREATE TRIGGER admin_credentials_updated_at
      BEFORE UPDATE ON public.admin_credentials
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- 2. ADMIN SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  credential_version INTEGER NOT NULL CHECK (credential_version >= 1),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT admin_sessions_expiry_after_creation CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS admin_sessions_user_active_idx
  ON public.admin_sessions (admin_user_id, expires_at)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS admin_sessions_token_hash_idx
  ON public.admin_sessions (token_hash)
  WHERE revoked_at IS NULL;

-- 3. ADMIN INVITES TABLE
CREATE TABLE IF NOT EXISTS public.admin_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role public.admin_user_role NOT NULL,
  permissions TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT admin_invites_expiry_after_creation CHECK (expires_at > created_at),
  CONSTRAINT admin_invites_email_canonical CHECK (email = lower(trim(email))),
  CONSTRAINT admin_invites_permissions_allowed CHECK (
    permissions <@ ARRAY['SUPER_ADMIN']::TEXT[]
  ),
  CONSTRAINT admin_invites_terminal_state CHECK (
    NOT (accepted_at IS NOT NULL AND revoked_at IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_invites_active_email_key
  ON public.admin_invites (lower(email))
  WHERE accepted_at IS NULL AND revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS admin_invites_lookup_idx
  ON public.admin_invites (token_hash, expires_at)
  WHERE accepted_at IS NULL AND revoked_at IS NULL;

-- 4. ADMIN PASSWORD RESET TOKENS TABLE
CREATE TABLE IF NOT EXISTS public.admin_password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT admin_password_reset_tokens_expiry CHECK (expires_at > created_at),
  CONSTRAINT admin_password_reset_tokens_terminal_state CHECK (
    NOT (used_at IS NOT NULL AND revoked_at IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_password_reset_tokens_active_user_key
  ON public.admin_password_reset_tokens (admin_user_id)
  WHERE used_at IS NULL AND revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS admin_password_reset_tokens_lookup_idx
  ON public.admin_password_reset_tokens (token_hash, expires_at)
  WHERE used_at IS NULL AND revoked_at IS NULL;

-- 5. AUDIT LOG EXTENSION
ALTER TABLE public.admin_user_audit_log
  ALTER COLUMN target_user_id DROP NOT NULL;

DO $$
BEGIN
  ALTER TABLE public.admin_user_audit_log
    DROP CONSTRAINT IF EXISTS admin_user_audit_log_action_check;

  ALTER TABLE public.admin_user_audit_log
    ADD CONSTRAINT admin_user_audit_log_action_check CHECK (
      action IN (
        'bootstrap',
        'identity_migrated',
        'login',
        'login_success',
        'login_failed',
        'password_set',
        'password_changed',
        'password_reset_requested',
        'password_reset_completed',
        'user_invited',
        'invite_reissued',
        'invite_accepted',
        'role_updated',
        'role_changed',
        'permission_changed',
        'status_updated',
        'user_suspended',
        'user_reactivated',
        'session_revoked',
        'all_sessions_revoked'
      )
    );
END $$;

-- 6. SECURITY & GRANTS
REVOKE ALL ON TABLE public.admin_credentials FROM PUBLIC;
REVOKE ALL ON TABLE public.admin_sessions FROM PUBLIC;
REVOKE ALL ON TABLE public.admin_invites FROM PUBLIC;
REVOKE ALL ON TABLE public.admin_password_reset_tokens FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'haxrweb_runtime') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_credentials TO haxrweb_runtime;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_sessions TO haxrweb_runtime;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_invites TO haxrweb_runtime;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_password_reset_tokens TO haxrweb_runtime;
    GRANT SELECT, INSERT, UPDATE ON public.admin_users TO haxrweb_runtime;
    GRANT SELECT, INSERT ON public.admin_user_audit_log TO haxrweb_runtime;
  END IF;
END $$;

COMMENT ON TABLE public.admin_credentials IS
  'Per-user administrative credentials hashed with scrypt. Never stores plaintext passwords.';
COMMENT ON TABLE public.admin_sessions IS
  'Opaque, versioned administrative sessions with SHA-256 token hashing and revocation tracking.';
COMMENT ON TABLE public.admin_invites IS
  'Single-use, time-limited, SHA-256 hashed invitation tokens for administrative user onboarding.';
COMMENT ON TABLE public.admin_password_reset_tokens IS
  'Single-use, time-limited, SHA-256 hashed password reset tokens for administrative identities.';

COMMIT;
