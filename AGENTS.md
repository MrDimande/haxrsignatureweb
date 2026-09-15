# AGENTS.md

## Cursor Cloud specific instructions

This is a single **Next.js 15 (App Router, React 19, TypeScript)** app — the HAXR Signature
institutional site + admin panel + client/event flows. It is not a monorepo. Standard commands
live in `package.json` scripts and `README.md`; the notes below only cover non-obvious,
durable setup/run caveats for this environment.

### Dependency refresh
Dependencies are installed automatically on startup by the update script (`npm ci`). No manual
install is needed when resuming a session.

### Running the app (dev)
- `npm run dev` → http://localhost:3000 (marketing site) and `/admin` (admin panel).
- Lint: `npm run lint` · Tests: `npm test` (Node's built-in test runner via `tsx`, ~450 tests).
- The app **degrades gracefully with no env vars**: marketing pages render, but anything that
  touches Supabase (contact form submit, admin, client app, event RSVP/check-in) returns 503 /
  redirects until Supabase is configured. So loading a page does not prove backend wiring.

### Local Supabase (required for contact form, admin, events, RSVP)
Supabase is **not** in the update script (needs Docker + image pulls). Start it manually when a
task touches persisted data:

1. Docker must be running. If `docker ps` fails, start it: `sudo dockerd &` (this VM uses
   `fuse-overlayfs` storage-driver with `containerd-snapshotter` disabled — already configured in
   `/etc/docker/daemon.json`), then `sudo chmod 666 /var/run/docker.sock`.
2. `npx supabase start` (first run pulls ~15 images; later runs are fast). Get keys anytime with
   `npx supabase status`.
3. Create a gitignored `.env.local` (see keys from `supabase status`), minimally:
   - `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY>`
   - `SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>` (use the legacy JWT `SERVICE_ROLE_KEY`, not
     the new `sb_secret_...` key — the app validates the JWT role/ref)
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` (≥32 chars) to use `/admin`.
   - Keep `EMAIL_SEND_MODE=disabled` so no real Resend/Brevo email is sent (both are non-blocking).
4. Restart `npm run dev` after creating/editing `.env.local` (Next only reads env at boot).

**Non-obvious gotcha:** the newer Supabase CLI does **not** auto-expose tables to the PostgREST
API roles, so `service_role` gets `permission denied` on tables created by the migrations (which
predate that default). `supabase/config.toml` sets `auto_expose_new_tables = true` to restore the
legacy behavior these migrations assume. If you recreate the stack and hit `42501 permission
denied for table ...`, run `npx supabase db reset` (a plain `supabase stop`/`start` restores the
old data volume and does NOT re-apply the grants).

### Client sign-in (`/sign-in`, `/app/**`)
Client-app auth is deliberately guarded against production: in `development` it refuses the
production Supabase ref and steers you to the hosted preview project via `.env.development.local`.
Pointing it at the local stack is fine for general dev, but the sign-in flow expects the preview
project — see `src/lib/supabase/config.ts` and `.env.example`.
