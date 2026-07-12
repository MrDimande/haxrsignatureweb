# P1A — RSVP Proxy Runbook

**Âmbito:** `POST /api/rsvp` (Edition → Core)
**Produção Edition:** `HAXR_API_BACKEND=local` (obrigatório até sign-off P1A)
**Preview Edition:** `HAXR_API_BACKEND=proxy` para validação

---

## Variáveis de ambiente

| Variável | Edition | Core | Preview | Produção |
|----------|---------|------|---------|----------|
| `HAXR_API_BACKEND` | `local` \| `proxy` | — | `proxy` (teste) | **`local`** |
| `HAXR_CORE_API_BASE_URL` | URL Core | — | preview ou `www` | quando activar |
| `HAXR_EDITION_PROXY_SECRET` | mesmo valor | mesmo valor | **obrigatório** | quando activar |
| `HAXR_PROXY_FALLBACK` | `false` | — | `false` | **`false`** |
| `HAXR_PROXY_TIMEOUT_MS` | opcional (28000) | — | opcional | opcional |
| `HAXR_REQUIRE_EDITION_PROXY_AUTH` | — | `true` | **obrigatório** | quando activar |

**Deployment Protection (Preview):** Edition → Core usa **Trusted Sources OIDC** (`@vercel/oidc` + header `x-vercel-trusted-oidc-idp-token`). Não usar Protection Bypass for Automation entre previews. Core deve listar `projecto-haxrsignature-edition` em Trusted Sources.

**Não remover** no Edition durante P1A: `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `EDITION_EVENT_*_ID` (presentes, cron, export).

---

## Testes locais (proxy)

```bash
# Terminal 1 — Core :3000
cd haxrsignature
# .env.local: HAXR_EDITION_PROXY_SECRET=<gerar-secret-forte>
npm run dev

# Terminal 2 — Edition :3001 (proxy)
cd projecto_haxrsignature
# .env.local:
#   HAXR_API_BACKEND=proxy
#   HAXR_CORE_API_BASE_URL=http://localhost:3000
#   HAXR_EDITION_PROXY_SECRET=<mesmo-secret>
#   HAXR_PROXY_FALLBACK=false
npx next dev -p 3001

# Terminal 3 — Contract proxy
cd haxrsignature
HAXR_EDITION_PROXY_SECRET=<mesmo-secret> npm run contract:edition-rsvp:proxy:local
```

Regressão modo local (sem proxy):

```bash
# Edition sem HAXR_API_BACKEND ou =local
npm run contract:edition-rsvp:local
```

---

## Activar preview (Vercel)

### Core preview
1. Deploy branch com `proxy-auth` + `/api/v1/edition/rsvp`.
2. Env preview: `HAXR_EDITION_PROXY_SECRET`, Supabase, Resend, `EDITION_EVENT_*_ID`.

### Edition preview
1. Deploy branch com router proxy.
2. Env preview:
   - `HAXR_API_BACKEND=proxy`
   - `HAXR_CORE_API_BASE_URL=https://<core-preview>.vercel.app` (ou `www` quando Core prod estiver live)
   - `HAXR_EDITION_PROXY_SECRET` (igual ao Core)
   - `HAXR_PROXY_FALLBACK=false`

3. Core preview: Trusted Sources inclui `projecto-haxrsignature-edition` (já configurado).
4. Correr `npm run contract:edition-rsvp:proxy:preview` com URLs dos dois previews.

---

## Rollback (instantâneo)

1. Edition: `HAXR_API_BACKEND=local`
2. Redeploy Edition (preview ou produção)
3. Smoke: honeypot + validação 400 em `/api/rsvp`
4. **Sem rollback Supabase** — registos Core permanecem válidos

---

## Go / No-Go produção (futuro)

Ver checklist completo: **[P1.2 — Production Activation Plan](./P1.2-RSVP-PROXY-PRODUCTION-ACTIVATION.md)**

Resumo bloqueadores:

- [ ] `contract:edition-rsvp:proxy:local` — 7/7
- [ ] Preview proxy — `contract:edition-rsvp:p1-preview` — 7/7
- [ ] Core `www` — C2: teste sem `Authorization` → **401 `application/json` pela rota Core** (mecanismo operador autorizado); HTML/SSO/redirect Vercel = Protection antes do Core, não falha auth
- [ ] **Pre-T0 Baseline Snapshot** capturado (deployment IDs, Supabase, Resend)
- [ ] Incident owner + rollback operator identificados
- [ ] Rollback preview testado
- [ ] `HAXR_PROXY_FALLBACK=false` confirmado

**Produção Edition:** manter `local` até sign-off P1.2.

---

## Observabilidade

Logs Edition (proxy): JSON com `scope=edition/rsvp/proxy`, `requestId`, `slug`, `coreStatus`, `proxyLatencyMs`, `outcome`.

Campos diagnóstico upstream (incidentes `invalid_core_response`): `trustedOidcPresent`, `upstreamStatus`, `upstreamContentType`, `upstreamRedirected`, `upstreamFinalHost`. Ver triagem em [P1.2](./P1.2-RSVP-PROXY-PRODUCTION-ACTIVATION.md#56-triage--incidente-invalid_core_response).

**Não logar:** email, telefone, nome completo, `messageForBride`.

Logs Core: `requestId` de `X-Request-Id`, falhas de proxy auth sem expor secret.
