# Plano de reconciliação — histórico migrations 036–043

**Estado:** plano apenas — **não** ligar à produção, **não** `migration repair`, **não** alterar `schema_migrations`.

**Refs:** clone `rkkxfrwtmsqzpnbkshnd` · prod `oxsrdmydlqyvnueedgtl` (proibida nesta fase)

---

## 1. O que existe nos repositórios

| # | Ficheiro | Objectos pretendidos |
|---|----------|---------------------|
| 036 | `036_client_app_auth.sql` | `profiles`, `client_events`, `event_members`, `event_onboarding_snapshots`, RLS, trigger auth |
| 037 | `037_client_app_service_role_grants.sql` | GRANTs service_role nas tabelas client-app |
| 038 | `038_provision_client_operational_event.sql` | RPC `provision_client_operational_event` |
| 039–043 | `039`…`043_client_event_*.sql` | RPCs getters: guests, payments, vendors, checklist, documents |

Documentação relacionada: `docs/PR4.1_DRY_RUN_FINAL_REPORT.md`, `docs/036_*`.

---

## 2. Por que o clone pode ter objectos sem histórico completo

Ensaio PR.4.1 (2026-07-11):

1. Apply selectivo 036–043 no **clone** com verificação por fingerprint de objectos.
2. **Rollback 036–043 no `finally`** — removeu tabelas/RPCs client-app do clone.
3. O dump/auditorias usam frequentemente **object inventory**, não o ledger completo `supabase_migrations.schema_migrations`.
4. Contagem observada em Preview RSVP (`migrations: 19`) **não implica** histórico alinhado 001…043; fingerprints e rows no ledger podem divergir (aplicações manuais, repair anterior, preview staging `uxleigndoomoezwsxlan` com caminho diferente).

Conclusão: **objectos presentes ≠ migrations registered**; **objectos ausentes após rollback ≠ ledger limpo**.

---

## 3. Risco de reaplicação

| Cenário | Risco |
|---------|-------|
| `db push` / `migration up` com histórico incompleto | Reexecução de `CREATE OR REPLACE` / `CREATE TABLE IF NOT EXISTS` pode **parecer** OK, mas grants/RLS/triggers podem divergir |
| `migration repair --status applied` sem inventário | Marca como applied **sem** garantir DDL — pior para auditoria |
| Aplicar 036–043 em prod assume clone = verdade | **Não seguro** — prod não foi rehearsal E2E completo (smokes PR.4.1 skipped) |

---

## 4. Procedimento seguro (futuro — autorização explícita)

### Fase R0 — Inventário read-only (clone, depois staging, **nunca** prod primeiro)

1. Listar ficheiros locais `036`–`043` (já feito).
2. No **clone apenas**, query read-only:
   - `supabase_migrations.schema_migrations` (versões presentes);
   - existência de relações/funções esperadas (`to_regclass` / `pg_proc`).
3. Classificar cada migration: `applied_registered` | `objects_only` | `absent` | `partial`.

### Fase R1 — Decisão por destino

| Destino | Acção permitida |
|---------|-----------------|
| Clone | Reconciliar experimentalmente (rehearsal) |
| Preview staging (`uxleigndoomoezwsxlan`) | Alinhar após inventário |
| Produção | **Somente** após GO separado + maintenance window |

### Fase R2 — Reconciliação (sem mentir ao ledger)

Ordem preferida:

1. Se objectos **em falta** e migration **não** registada → apply do ficheiro versionado (idempotente onde possível) **num ambiente não-prod**, depois verificar.
2. Se objectos **existem** e migration **não** registada → **não** reaplicar cegamente; preferir `migration repair --status applied` **só** após checksum/fingerprint == ficheiro.
3. Se migration registada e objectos **diferem** → diff DDL vs ficheiro; patch dedicado (nova migration), **não** rewrite 036–043.
4. Nunca `DROP` em produção sem plano de rollback + backup.

### Fase R3 — Gate antes de prod

- [ ] Inventário clone + staging + prod (prod read-only)
- [ ] Diff fingerprint documentado
- [ ] Smokes client-app E2E verdes no preview destinado
- [ ] Sem `repair` surpresa na janela de produção

---

## 5. Fora de âmbito desta Fase 1A

- Não ligar MCP/CLI à produção
- Não executar `migration repair`
- Não marcar 036–043 as applied
- Não reaplicar 036–043 no clone agora
