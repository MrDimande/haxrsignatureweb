# PR #3 — Production Release Gate

**PR:** https://github.com/MrDimande/haxrsignatureweb/pull/3  
**Branch:** `rebuild-haxr-platform`  
**Estado PR:** Draft  
**Gate:** pré-produção — **não** merge / promote até checklist verde  
**Referência migrations:** `docs/PRODUCTION_MIGRATION_PLAN_036_043.md`

---

## 1. Âmbito do release

| Inclui | Exclui (nesta gate) |
|--------|---------------------|
| App cliente `/app/*` + Auth Supabase | Alterações a Edition / RSVP público sem necessidade |
| Onboarding + dashboard real | Seeds de staging em produção |
| APIs E.4 (guests, payments, vendors, checklist, documents) | `db push` / repair sem plano |
| Migrations 036–043 em produção (fase futura) | Deploy manual / promote sem checklist |

---

## 2. Pré-requisitos de ambiente

| Item | Preview | Produção |
|------|---------|----------|
| Project ref | `uxleigndoomoezwsxlan` | `oxsrdmydlqyvnueedgtl` |
| App Preview | Validado (login, KPIs, módulos) | — |
| Migrations 036–043 | ✅ Aplicadas | ❌ Ausentes |
| Gap 028/0281 | Resolvido no preview (renomeações) | Objectos OK; histórico timestamp ≠ local |
| `businesses.id = haxr-signature` | ✅ | ✅ |
| Env Vercel Preview | Supabase preview | — |
| Env Vercel Production | — | Deve apontar para produção **só após** migrations |

---

## 3. Checklist Preview (já cumprido na PR #3)

- [x] Login staging funciona
- [x] Dashboard real com `clientEventId` `f51ce8b2-6b5c-4692-852e-fb1dad1842e1`
- [x] Guests / budget / vendors / checklist / documents alinhados
- [x] Onboarding routes no remoto (`/onboarding`, profile/1–4)
- [x] Brand asset tracked (`logo-horizontal-gold.png`)
- [x] `npm test` / `npm run build` PASS na branch
- [x] Vercel Preview deploy automático PASS
- [ ] (Opcional) Desactivar ou bypass Vercel Protection para smokes CI — não bloqueia merge se validação browser OK

---

## 4. Checklist Produção — **antes** de apply 036–043

- [ ] Backup / snapshot de `oxsrdmydlqyvnueedgtl`
- [ ] Re-ler `PRODUCTION_MIGRATION_PLAN_036_043.md`
- [ ] Confirmar mapa 028 ↔ `commercial_admin_v2` e 0281 ↔ `concierge_portal`
- [ ] Dry-run CLI: **só** 036–043 pendentes (sem reaplicar 001–035)
- [ ] Autorização explícita por escrito para apply em produção
- [ ] Janela de manutenção definida

---

## 5. Checklist Produção — apply (ordem)

| Passo | Acção | Critério de saída |
|-------|-------|-------------------|
| 1 | Aplicar **036** | Tabelas + enums + trigger + RLS |
| 2 | Validar Auth | Signup teste → `profiles`; isolamento RLS |
| 3 | Aplicar **037** | Grants service_role OK |
| 4 | Smoke API create/sync (staging user) | INSERT snapshots OK |
| 5 | Aplicar **038** | Provisioning cria/reusa `events` |
| 6 | Aplicar **039–043** | RPCs existem; EXECUTE só service_role |
| 7 | Smoke RPCs | Guests/payments/vendors/checklist/documents |
| 8 | Confirmar produção admin legado | Events/guests/payments intactos |

---

## 6. Checklist App — **depois** das migrations

- [ ] Env Production: URL + anon + service_role de **produção**
- [ ] Sem secrets de preview em Production
- [ ] Merge PR #3 (sair de Draft) só com migrations verdes
- [ ] Deploy/promote **automático** via Git (sem promote manual ad-hoc)
- [ ] Smoke produção: sign-in → onboarding ou dashboard
- [ ] Monitorizar logs Auth + API 5xx 30–60 min

---

## 7. Ordem canónica: migrations → app

```text
Preview validado (feito)
        ↓
Auditoria produção (este gate + plano 036–043)  ← estamos aqui
        ↓
Backup produção
        ↓
Reconciliar histórico 028 (sem reaplicar SQL)
        ↓
036 → Auth/RLS check → 037 → 038 → 039–043 → RPC check
        ↓
Merge PR #3 + deploy app Production
        ↓
Smoke produção + monitorização
```

**Inverter esta ordem = NO-GO.**

---

## 8. Critérios GO / GO com condições / NO-GO

| Decisão | Quando |
|---------|--------|
| **GO** | Preview OK + 036–043 em produção validadas + env Production correcto + checklist §5–§6 completa |
| **GO com condições** | Preview OK + plano migrations aprovado + **ainda sem** apply em produção (estado actual da auditoria) |
| **NO-GO** | Gap 028 tratado como “reaplicar SQL”; `db push` cego; merge app antes de 036; env Production a apontar para preview; repair sem mapa |

### Decisão actual (2026-07-11)

**GO com condições** — documentação e Preview prontos; **produção ainda sem 036–043**; apply e merge **bloqueados** até checklist §4–§5.

---

## 9. Rollback de release

| Camada | Acção |
|--------|-------|
| App | Reverter commit / redeploy build anterior; PR volta a Draft se necessário |
| DB 039–043 / 038 | `DROP FUNCTION` das RPCs + provision |
| DB 037 | REVOKE grants |
| DB 036 | Remover trigger Auth + drop tabelas app cliente (só se sem dados reais críticos) |
| Dados operacionais | **Não** apagar `events`/`guests`/`payments` legados |

---

## 10. Confirmações desta fase documental

| Item | Estado |
|------|--------|
| Produção alterada | ❌ Não |
| Migrations aplicadas | ❌ Não |
| Merge / promote / deploy manual | ❌ Não |
| Documentos criados | `PRODUCTION_MIGRATION_PLAN_036_043.md`, este ficheiro |

---

*Gate de release — execução de migrations e merge só com autorização explícita.*
