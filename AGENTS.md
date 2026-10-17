# AGENTS.md

## Cursor Cloud specific instructions

Single Next.js 15 app (App Router, React 19, TypeScript, npm). Standard commands live
in `README.md` ("Comandos úteis") and `package.json` scripts. Node 22 works. The startup
update script only runs `npm install`; everything below is what a fresh VM does **not**
give you automatically.

### Services

- **Next.js app** (the product) — `npm run dev` → `http://localhost:3000`, admin at `/admin`.
  Lint: `npm run lint` (warnings only, exits 0). Tests: `npm test` (node test runner via
  `tsx` over `src/lib/events/*.test.ts`). Build: `npm run build`.
- **Supabase / Postgres** (only external stateful dependency) — local stack via the
  `supabase` CLI on ports 54321 (API), 54322 (DB), 54323 (Studio), 54324 (mail).

### What runs without secrets vs. what needs Supabase

- The **public marketing site** (all `(marketing)` pages: `/`, `/contacto`, etc.) renders
  fully with **no secrets**.
- **Admin login** needs only `ADMIN_EMAIL` + `ADMIN_PASSWORD` in `.env.local` (HMAC session;
  `ADMIN_SESSION_SECRET` is optional, falls back to the password).
- **Admin data pages, the contact form (`/api/contact`), and all events/RSVP/check-in**
  call `createAdminClient()` and require `NEXT_PUBLIC_SUPABASE_URL` +
  `SUPABASE_SERVICE_ROLE_KEY`. Without them the contact API returns HTTP 503 (by design,
  not a bug) and admin data pages throw `Supabase não configurado`.

### Running the full stack locally (Supabase) — the non-obvious parts

`.env.local` is git-ignored and NOT present on a fresh VM — create it (copy `.env.example`).
For a local stack use `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` plus the anon /
service-role keys that `supabase start` prints, and set `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

Bringing up local Supabase requires **Docker + the `supabase` CLI**, neither of which is
in the repo or the update script (they are system deps — install manually when you need
the data layer). Docker-in-Docker on this VM needs the fuse-overlayfs storage driver, and
with Docker 29 the containerd snapshotter must be disabled (`/etc/docker/daemon.json`:
`{"storage-driver":"fuse-overlayfs","features":{"containerd-snapshotter":false}}`), plus
iptables-legacy. Start with `sudo dockerd &`. Then `supabase start` boots Postgres and
applies `supabase/migrations/` 001–024.

**CRITICAL GOTCHA — Data API permissions:** the current Supabase CLI does NOT auto-expose
new tables to the PostgREST Data API roles, but the migrations rely on the legacy
auto-expose behaviour and contain no explicit `GRANT`s. So after `supabase start` (or
`supabase db reset`) every Data API call fails with `42501 permission denied for table ...`
and the app returns 500s. Fix by granting the API roles once against the local DB:

```bash
docker exec -i supabase_db_haxrsignature psql -U postgres -d postgres <<'SQL'
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
NOTIFY pgrst, 'reload schema';
SQL
```

Re-run this after any `supabase db reset` (it wipes the grants). Prefer real hosted-project
credentials via Secrets over the local stack when they are available. Resend
(`RESEND_API_KEY`) and Brevo (`BREVO_API_KEY`) stay optional — their failures are
non-blocking and only affect transactional email / CRM sync.
