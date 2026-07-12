# Edition API v1 — Contract Review Checklist

**Spec:** `edition-v1.openapi.yaml`
**Status:** P0 validated · P1A proxy implemented (preview only)
**Owner:** HAXR Platform

## Envelope & compatibility

- [x] Responses use `success: boolean` (matches Edition `app/api/rsvp`)
- [x] Error messages in pt-PT match Edition strings where applicable
- [x] RSVP 200 includes `data`, `persisted`, `emailSent`, `guestEmailSent`
- [x] Honeypot returns 200 with fake success (no persist)
- [x] 502 when persist OK but email fails

## RSVP (`POST /rsvp`)

- [x] Rate limit 8 req / 15 min / IP (`edition:rsvp:{ip}`)
- [x] Slug aliases documented (`jessicakhulaya` → `jessicakulaya`)
- [x] Farewell: phone required, deadline `2026-07-20`
- [x] Party size 1–10 when attending
- [x] Idempotency via `submit_edition_rsvp` RPC

## Gifts (P1 — not implemented yet)

- [x] `GET /gifts` mirrors Edition merged catalog
- [x] `POST /gifts/reserve` returns 409 with `gifts` array

## Admin

- [x] `GET /admin/events/{eventId}/guests` uses `haxr_admin_session`
- [x] Filter `source=edition_rsvp`

## Security

- [x] Public endpoints do not expose service role
- [x] Email dispatch internal to write handlers (not public)
- [x] Cron reminders documented as out-of-scope P0 paths

## Sign-off

| Role | Name | Date | OK |
|------|------|------|-----|
| Platform | | | |
| Edition | | | |
| Ops | | | |

## Validation commands

```bash
# Fase 1 — local (obrigatório)
npm run contract:edition-rsvp:local

# Fase 2 — staging (Edition prod vs Core preview)
CORE_PREVIEW_URL=https://your-preview.vercel.app npm run contract:edition-rsvp:staging

# Ambas em sequência
CORE_PREVIEW_URL=https://your-preview.vercel.app npm run contract:edition-rsvp:full

# Lint OpenAPI
npm run openapi:lint

# Unit tests
npm run test
```

## Parity run log

| Fase | Data | Resultado | Notas |
|------|------|-----------|-------|
| Local | 2026-06-27 | **7/7 pass** | `localhost:3001` Edition vs `localhost:3000` Core |
| Staging | 2026-06-27 | **7/7 parity OK** | Batch A: validação 400/200. Batch B: 429 idêntico em ambos (rate limit IP real, não drift). |

Preview Core actual: `https://haxrsignatureweb-5heunb2bp-alberto-dimandes-projects.vercel.app`

## P1.1 — RSVP Proxy (preview only)

| Item | Estado |
|------|--------|
| Core `proxy-auth.ts` + route guard | Implementado |
| Edition `control-plane/*` + router `/api/rsvp` | Implementado |
| `HAXR_API_BACKEND=local` default | Sim |
| `HAXR_PROXY_FALLBACK` default false | Sim |
| Contract proxy local script | `npm run contract:edition-rsvp:proxy:local` |
| Runbook | `docs/P1A-RSVP-PROXY-RUNBOOK.md` |
| Produção Edition | **`HAXR_API_BACKEND=local` (não alterar)** |

