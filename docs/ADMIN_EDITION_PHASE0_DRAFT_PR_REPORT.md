# Core Admin ↔ Edition — Fase 0 Draft PR Report

## Edition Fase 0 — concluída em Draft PR externo

Dependência Edition:

| Item | Estado |
|------|--------|
| PR | [#4](https://github.com/MrDimande/haxrsignature-edition-engine/pull/4) |
| Branch | `feature/edition-phase0-security-slugs` |
| Título | fix(edition): secure invitation resolution and RSVP boundaries |
| isDraft | `true` |
| Checks / preview Vercel | SUCCESS |
| Merge | **não mergeado** |
| Produção Edition | **intocada** |
| Dependência técnica | Satisfeita para contrato Core ↔ Edition |
| Dependência operacional | Pendente de merge coordenado + deploy preview/prod |

Fonte: `gh pr view 4 --repo MrDimande/haxrsignature-edition-engine` (2026-07-14).

## find_seat_code (piloto)

- Valor em produção: **ainda vazio**
- Não gerado nesta preparação
- Após deploy coordenado + autorização humana: operador abre **Atelier QR** no Admin → `ensureFindSeatCodeForEvent` → verificar unicidade → **sem SQL manual**
- Bloqueia apenas o teste final Find Your Seat **público** do piloto; **não** bloqueia este Draft PR

## Riscos restantes

1. RSVP apenas com nome (sem telefone/email) ainda pode depender do match por nome no RPC
2. `find_seat_code` do piloto ainda vazio em produção
3. Edition PR #4 permanece Draft (sem merge / sem produção)

## Contrato Core inbound

- `POST /api/v1/edition/rsvp`
- Auth: `Authorization: Bearer <secret>` **ou** `x-haxr-edition-proxy: <secret>`
- Env: `HAXR_EDITION_PROXY_SECRET` (nunca `NEXT_PUBLIC_*`)
- Slug público: `jessicaesamueltraditionalwedding` → binding `traditional-wedding`
