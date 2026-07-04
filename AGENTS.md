# AGENTS.md

## Cursor Cloud specific instructions

Next.js 15 (App Router, React 19, TS) app. Standard commands live in `README.md`
("Comandos úteis") and `package.json` scripts. Node 22 works. The update script runs
`npm install`; do not re-run it manually unless dependencies changed.

### Services and how to run them

Single service: the Next.js app. Start with `npm run dev` (serves `http://localhost:3000`,
admin at `/admin`). Lint: `npm run lint` (emits warnings only; exits 0). Tests:
`npm test` (runs `node --test` via `tsx` over `src/lib/events/*.test.ts`).

### Local env — non-obvious gotchas

- `.env.local` is git-ignored (copy from `.env.example`). It is NOT present on a fresh
  VM, so create it before expecting non-public features to work.
- The **public marketing site** (all `(marketing)` pages: `/`, `/assessoria-eventos`,
  `/contacto`, etc.) renders fully **without any external secrets**.
- **Admin login works with only `ADMIN_EMAIL` + `ADMIN_PASSWORD`** set in `.env.local`
  (session is HMAC-signed; `ADMIN_SESSION_SECRET` is optional and falls back to the
  password). No Supabase needed for the login step itself.
- However, after login **`/admin/dashboard` and all admin/data/events pages call
  Supabase** via `createAdminClient()` and will throw `Supabase não configurado` at
  request time unless `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set.
  This is expected in a secret-less environment, not a code bug.
- The contact form API (`/api/contact`) degrades gracefully: it returns HTTP 503
  ("Serviço de contacto temporariamente indisponível.") when Supabase is unconfigured
  instead of crashing.

### Full-stack setup (only if you need contact persistence, admin data, or events RSVP)

These require external credentials the repo does not ship: Supabase
(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`),
Resend (`RESEND_API_KEY`) for transactional email, and Brevo (`BREVO_API_KEY`) for CRM.
Running Supabase locally needs Docker (NOT installed on this VM by default) plus the
`supabase` CLI and applying `supabase/migrations/` 001–024 in order. Prefer real project
credentials via Secrets over a local Supabase stack.
