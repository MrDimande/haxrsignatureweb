# Admin identity foundation — Neon Preview cutover record

## Runtime architecture

This foundation retains the existing administrative authentication model:

- **Authentication provider:** custom Node credential validation using the
  server-only `ADMIN_EMAIL` and `ADMIN_PASSWORD` configuration.
- **Session provider:** signed `haxr_admin_session` HTTP-only cookie using
  `ADMIN_SESSION_SECRET` and HMAC-SHA256.
- **Identity directory after cutover:** `public.admin_users` in Neon PostgreSQL.

`neon_auth.user` is not consulted by the admin login, session, guard, profile
or users directory. `neon.ts` declares `auth: false`; no Neon Auth dependency
is added by this migration. PostgreSQL storage for an administrator is not an
authentication-provider change.

## Canonical migration transport

New runtime schema changes live in `database/migrations/` and are applied to a
direct, non-pooled Neon PostgreSQL connection. `supabase/migrations/` is
historical-only and is not a runtime dependency for this foundation.

## Preflight findings

- The current admin login is environment-backed. The legacy e-mail is only a
  local `ADMIN_EMAIL` configuration value, not a persisted admin user record.
- No identity is preserved from `neon_auth.user`, because that table is outside
  the canonical admin architecture.
- The migration creates `admin_users` and an append-only audit table. It stores
  no password, password hash, token, connection string or session secret.
- A partial unique index permits historical suspended owners but enforces one
  active `OWNER`. A matching suspended legacy owner may be reactivated without
  changing its UUID; an unrelated active owner or target e-mail conflict stops
  the migration for manual review.

## Preview-only rollout

1. Select or create an isolated Neon Preview branch from the current production
   branch; never use the production branch as the target.
2. Verify its direct connection and intended Vercel Preview deployment binding.
3. Apply `database/migrations/20261001100000_admin_identity_foundation.sql` to
   that Preview branch only.
4. Read back the generated `admin_users.id`, name, e-mail, role, permission and
   active state. Do not print credentials or secrets.
5. Set only the Preview-scoped `HAXR_ADMIN_IDENTITY_MODE=database` variable.
   Keep `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` unchanged.
6. Validate the new e-mail, old e-mail rejection, server-side owner guard and
   suspended-user denial. Capture browser evidence separately.

## Safe rollback

Rollback is a feature cutback, not destructive data removal: reset the Preview
`HAXR_ADMIN_IDENTITY_MODE` to `legacy`, redeploy Preview, and retain the
append-only identity and audit records for diagnosis. No automatic `DROP` or
row deletion is provided. A later schema/data removal requires a separately
reviewed, explicitly authorised migration after any Preview incident is closed.
