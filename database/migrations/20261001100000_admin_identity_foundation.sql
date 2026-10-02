-- HAXR Signature — Admin identity and user-management foundation.
--
-- Canonical transport: database/migrations (Neon PostgreSQL).
-- This migration is additive. It does not change auth credentials, existing
-- application users, audit history, or public/event data. Apply only through
-- a reviewed direct, non-pooled Neon PostgreSQL connection.

BEGIN;

DO $$
BEGIN
  CREATE TYPE public.admin_user_role AS ENUM (
    'OWNER',
    'ADMIN',
    'EVENT_MANAGER',
    'GUEST_MANAGER',
    'CONTENT_EDITOR'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.admin_user_status AS ENUM ('active', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role public.admin_user_role NOT NULL,
  permissions TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  status public.admin_user_status NOT NULL DEFAULT 'active',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT admin_users_name_not_blank CHECK (char_length(trim(name)) >= 2),
  CONSTRAINT admin_users_email_canonical CHECK (email = lower(trim(email))),
  CONSTRAINT admin_users_permissions_allowed CHECK (
    permissions <@ ARRAY['SUPER_ADMIN']::TEXT[]
  ),
  CONSTRAINT admin_users_owner_super_admin CHECK (
    (role = 'OWNER' AND permissions @> ARRAY['SUPER_ADMIN']::TEXT[])
    OR (role <> 'OWNER' AND NOT permissions @> ARRAY['SUPER_ADMIN']::TEXT[])
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_users_email_lower_key
  ON public.admin_users (lower(email));

CREATE UNIQUE INDEX IF NOT EXISTS admin_users_single_owner_key
  ON public.admin_users (role)
  WHERE role = 'OWNER' AND status = 'active';

CREATE TABLE IF NOT EXISTS public.admin_user_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES public.admin_users(id) ON DELETE RESTRICT,
  target_user_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE RESTRICT,
  action TEXT NOT NULL CHECK (
    action IN ('bootstrap', 'identity_migrated', 'login', 'role_updated', 'status_updated')
  ),
  details JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT admin_user_audit_log_details_object CHECK (jsonb_typeof(details) = 'object')
);

CREATE INDEX IF NOT EXISTS admin_user_audit_log_target_created_at_idx
  ON public.admin_user_audit_log (target_user_id, created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_trigger
     WHERE tgrelid = 'public.admin_users'::regclass
       AND tgname = 'admin_users_updated_at'
       AND NOT tgisinternal
  ) THEN
    CREATE TRIGGER admin_users_updated_at
      BEFORE UPDATE ON public.admin_users
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- Private server-side access only. No browser role is granted access.
REVOKE ALL ON TABLE public.admin_users FROM PUBLIC;
REVOKE ALL ON TABLE public.admin_user_audit_log FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'haxrweb_runtime') THEN
    GRANT SELECT, INSERT, UPDATE ON public.admin_users TO haxrweb_runtime;
    GRANT SELECT, INSERT ON public.admin_user_audit_log TO haxrweb_runtime;
  END IF;
END $$;

-- Preserve a matching legacy owner when one exists. The partial unique index
-- allows historical suspended owners while guaranteeing exactly one active
-- owner. No application UUID is invented.
DO $$
DECLARE
  v_active_owner public.admin_users%ROWTYPE;
  v_matching_owner public.admin_users%ROWTYPE;
  v_active_owner_found BOOLEAN := FALSE;
  v_matching_owner_found BOOLEAN := FALSE;
  v_conflicting_user_id UUID;
  v_previous_email TEXT;
BEGIN
  SELECT * INTO v_active_owner
    FROM public.admin_users
   WHERE role = 'OWNER'
     AND status = 'active'
   FOR UPDATE;
  v_active_owner_found := FOUND;

  SELECT * INTO v_matching_owner
    FROM public.admin_users
   WHERE role = 'OWNER'
     AND lower(email) IN (
       'admin@haxrsignature.co.mz',
       'dimande@haxrsignature.com'
     )
   FOR UPDATE;
  v_matching_owner_found := FOUND;

  SELECT id INTO v_conflicting_user_id
    FROM public.admin_users
   WHERE lower(email) = 'dimande@haxrsignature.com'
     AND (
       NOT v_matching_owner_found
       OR id <> v_matching_owner.id
     )
   LIMIT 1;

  IF v_conflicting_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'admin_identity_email_conflict_requires_manual_review';
  END IF;

  IF v_active_owner_found
     AND (
       NOT v_matching_owner_found
       OR v_active_owner.id <> v_matching_owner.id
     ) THEN
    RAISE EXCEPTION 'existing_active_owner_requires_manual_review';
  END IF;

  IF NOT v_matching_owner_found THEN
    INSERT INTO public.admin_users (name, email, role, permissions, status)
    VALUES (
      'Alberto Dimande',
      'dimande@haxrsignature.com',
      'OWNER',
      ARRAY['SUPER_ADMIN']::TEXT[],
      'active'
    )
    RETURNING * INTO v_matching_owner;

    INSERT INTO public.admin_user_audit_log (actor_user_id, target_user_id, action, details)
    VALUES (
      v_matching_owner.id,
      v_matching_owner.id,
      'bootstrap',
      jsonb_build_object('identity_source', 'admin_identity_foundation')
    );
  ELSE
    v_previous_email := v_matching_owner.email;

    UPDATE public.admin_users
       SET name = 'Alberto Dimande',
           email = 'dimande@haxrsignature.com',
           permissions = ARRAY['SUPER_ADMIN']::TEXT[],
           status = 'active'
     WHERE id = v_matching_owner.id
       AND (
         name IS DISTINCT FROM 'Alberto Dimande'
         OR email IS DISTINCT FROM 'dimande@haxrsignature.com'
         OR permissions IS DISTINCT FROM ARRAY['SUPER_ADMIN']::TEXT[]
         OR status IS DISTINCT FROM 'active'::public.admin_user_status
       );

    IF FOUND THEN
      INSERT INTO public.admin_user_audit_log (actor_user_id, target_user_id, action, details)
      VALUES (
        v_matching_owner.id,
        v_matching_owner.id,
        'identity_migrated',
        jsonb_build_object(
          'previous_email', v_previous_email,
          'new_email', 'dimande@haxrsignature.com'
        )
      );
    END IF;
  END IF;
END $$;

COMMENT ON TABLE public.admin_users IS
  'Private HAXR administrative identities. Credentials remain in the configured identity provider.';
COMMENT ON TABLE public.admin_user_audit_log IS
  'Immutable audit events for HAXR administrative identity lifecycle actions.';

COMMIT;
