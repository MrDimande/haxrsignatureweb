# Templates de email Auth (Supabase)

Copy editorial HAXR Signature em português para emails de autenticação.

Templates em `templates/` na raiz do repo (o path que o `supabase config push` resolve) e espelho em `supabase/templates/`:

| Template | Ficheiro | Subject |
|----------|----------|---------|
| Recovery (reset password) | `templates/recovery.html` | `Recuperar palavra-passe — HAXR Signature` |
| Confirmation (verify email) | `templates/confirmation.html` | `Confirme o vosso email — HAXR Signature` |
| Password changed (notificação) | `templates/password-changed.html` | `Palavra-passe actualizada — HAXR Signature` |

Manter os dois directorios sincronizados após editar HTML.

## Local (`config.toml`)

Já ligados em `supabase/config.toml`. Após alterar:

```bash
npx supabase stop && npx supabase start
```

Variáveis Go usadas: `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .Token }}`, `{{ .SiteURL }}`.

## Projecto hosted (Preview / Produção)

O Dashboard **não** sincroniza automaticamente estes ficheiros. Colar em:

**Authentication → Email Templates**

1. **Reset password** → subject + corpo de `recovery.html`
2. **Confirm signup** → subject + corpo de `confirmation.html`
3. **Security notifications → Password changed** → activar + `password-changed.html`

Atalhos Dashboard (substituir `<ref>`):

- Preview: `https://supabase.com/dashboard/project/uxleigndoomoezwsxlan/auth/templates`
- Production: `https://supabase.com/dashboard/project/oxsrdmydlqyvnueedgtl/auth/templates`

Helper para copiar subject + HTML:

```bash
node scripts/print-auth-email-template.mjs recovery
node scripts/print-auth-email-template.mjs confirmation
node scripts/print-auth-email-template.mjs password-changed
```

## Redirects necessários

Em **Authentication → URL Configuration**, manter:

- Site URL: `https://www.haxrsignature.com` (prod) ou `http://localhost:3000` (dev)
- Redirect URLs:
  - `https://www.haxrsignature.com/auth/callback`
  - `http://localhost:3000/auth/callback`
  - URL de preview Vercel + `/auth/callback`

O fluxo de reset da app aponta `redirectTo` para `/auth/callback?next=/reset-password`.

## SMTP (produção) — Resend (fluxo já usado na app)

Emails transaccionais da app (contacto, RSVP, portal) usam **Resend**.
Auth (reset / confirmação) deve usar o **mesmo** remetente para sair de `hello@haxrsignature.com`.

### Local (`config.toml`)

`[auth.email.smtp]` aponta para `smtp.resend.com`. Antes de `supabase start`:

```bash
# Windows PowerShell
$env:RESEND_API_KEY = "re_..."
npx supabase stop
npx supabase start
```

### Hosted (Preview + Produção)

No Dashboard → **Project Settings → Authentication → SMTP Settings** (ou Authentication → Emails → SMTP):

| Campo | Valor |
|-------|--------|
| Enable custom SMTP | ON |
| Sender email | `hello@haxrsignature.com` |
| Sender name | `HAXR Signature` |
| Host | `smtp.resend.com` |
| Port | `465` (SSL) ou `587` (STARTTLS) |
| Username | `resend` |
| Password | `RESEND_API_KEY` (mesma chave da Vercel / `.env.local`) |

Atalhos:

- Preview: `https://supabase.com/dashboard/project/uxleigndoomoezwsxlan/auth/smtp`
- Produção: `https://supabase.com/dashboard/project/oxsrdmydlqyvnueedgtl/auth/smtp`

Sem SMTP custom, o Supabase usa o sender nativo com limites baixos e domínio genérico.

### Estado dos projectos (Jul 2026)

| Projecto | Ref | SMTP Resend | Templates PT | site_url |
|----------|-----|-------------|--------------|----------|
| Preview | `uxleigndoomoezwsxlan` | ON | ON | `https://www.haxrsignature.com` |
| Produção | `oxsrdmydlqyvnueedgtl` | ON | ON | `https://www.haxrsignature.com` |

Push via CLI:

```powershell
$env:RESEND_API_KEY = ... # from .env.local
npx supabase config push --yes --project-ref uxleigndoomoezwsxlan
npx supabase config push --yes --project-ref oxsrdmydlqyvnueedgtl
```

Smoke API (preview, com env a apontar ao preview):

```bash
node scripts/smoke-auth-smtp-preview.mjs
```
