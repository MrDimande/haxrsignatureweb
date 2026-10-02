# Neon PostgreSQL migrations

`database/migrations/` is the canonical, versioned transport for new HAXR
runtime schema migrations. It targets Neon PostgreSQL only. The historical
`supabase/migrations/` tree remains preserved for the retired Supabase
architecture and must not receive new runtime migrations.

Apply a reviewed migration only with a direct (non-`-pooler`) connection to an
isolated Neon Preview branch. Record the branch ID, migration checksum, schema
diff and verification queries in `docs/migrations/` before requesting a
Production change. Do not apply a migration from this directory to Production
without separate owner approval.

The admin identity migration is intentionally idempotent at the schema level.
Its owner bootstrap logs a lifecycle event only when it creates or changes the
matching identity, so a guarded retry does not rewrite historical audit data.
