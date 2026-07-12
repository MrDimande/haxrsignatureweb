## Resumo

PR.3 — prontidão operacional **COMPLETA** para apply controlado das migrations **036–043** em produção (`oxsrdmydlqyvnueedgtl`).

Esta branch inclui também a reconstrução da área cliente (auth, onboarding, módulos RPC). **Produção permanece intocada** até GO humano explícito.

---

## PR.3 — Readiness (PASS)

| Gate | Estado |
|------|--------|
| Technical readiness | **PASS** |
| Pre-apply gate | **PASS** |
| Restore drill | **PASS** (`3b8515c`) |
| Backup checksums 7/7 | **PASS** |
| Backup encrypted | **PASS** |
| Clone DB smokes | **PASS** |
| Migrations 036–043 em produção | **AUSENTES** (19 migrations, latest `20260709112104`) |
| `productionTouched` | **false** |
| Human GO | **PENDENTE** |

**Baseline PR.4.1:** `ea8fe5b` · **PR.3 tooling:** `81a6080` · **Head:** `2c24364`

---

## Migrations (ordem produção — após GO)

1. `036_client_app_auth.sql`
2. `037_client_app_service_role_grants.sql`
3. `038_provision_client_operational_event.sql`
4. `039_client_event_guests_rpc.sql`
5. `040_client_event_payments_rpc.sql`
6. `041_client_event_vendors_rpc.sql`
7. `042_client_event_checklist_rpc.sql`
8. `043_client_event_documents_rpc.sql`

**Não reaplicar:** 028, 0281 · **Não usar:** `db push` genérico

---

## Backup / restore

- Backup: `backups/pr3-production-pre036/2026-07-12T06-48-00/` (local, gitignored)
- Plano rollback: `docs/PR3_PRODUCTION_APPLY_ROLLBACK_PLAN.md`
- Sign-off: `docs/PR3_FINAL_SIGNOFF_RECORD.md`

---

## Área cliente (branch scope)

Auth Supabase, `/app/*`, POST `/api/events`, dashboard e módulos via RPC — validados em preview `uxleigndoomoezwsxlan`.

---

## Segurança

- Sem secrets, `.env`, backups ou `.enc` no repositório
- Apply produção gated: `PR3_APPLY_AUTHORIZED=PR3_HUMAN_GO_CONFIRMED`

---

## Estado actual

```text
READY FOR FINAL HUMAN GO
Nenhum apply/deploy produção executado até assinatura
```

---

## Test plan

- [x] PR.3 pre-apply gate PASS
- [x] Clone DB smokes PASS
- [x] Restore drill PASS
- [ ] GO humano registado
- [ ] Apply 036–043 produção
- [ ] Deploy + smokes HTTP
- [ ] Ready for review após janela PASS
