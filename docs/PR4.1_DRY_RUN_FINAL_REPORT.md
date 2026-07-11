# PR.4.1 — Relatório final do ensaio migrations 036–043

**Data de conclusão:** 2026-07-11 (22:44 UTC)  
**Branch:** `rebuild-haxr-platform`  
**PR relacionada:** #3 (Draft)  
**Artefacto machine-readable:** `backups/pr4-dry-run-report.json`  
**Pipeline exit code:** `0`

---

## Veredicto

| Campo | Valor |
|-------|-------|
| **status** | `pass_with_optional_checks_skipped` |
| **overallPass** | `true` |
| **coreRehearsalPass** | `true` |
| **databaseRehearsalPass** | `true` |
| **unitTestsPass** | `true` (446/446) |
| **buildPass** | `true` |
| **rollbackPass** | `true` |
| **productionTouched** | `false` |
| **smokesPass** | `false` |
| **smokesSkipped** | `true` |
| **smokesSkipReason** | `credentials_missing` |
| **smokesRequired** | `false` (opcionais por contrato PR.4.1) |

O ensaio **PR.4.1 cumpre o objectivo de rehearsal de base de dados e validação de código** no clone isolado. Os smokes preview **não foram executados** e **não constituem validação end-to-end** desta fase.

---

## Declarações obrigatórias

### 1. Migrations 036–043 — apenas no clone

As migrations **036–043 foram aplicadas e verificadas exclusivamente no clone de ensaio** `rkkxfrwtmsqzpnbkshnd`. A produção `oxsrdmydlqyvnueedgtl` **não recebeu** `db push`, `apply_migration`, repair nem SQL mutável.

| Migration | Ficheiro | Apply | Verificação pós-apply |
|-----------|----------|-------|------------------------|
| 036 | `036_client_app_auth.sql` | ✅ | `verify-post-036.mjs` — tabelas `profiles`, `client_events`, `event_members`, `event_onboarding_snapshots`; RLS; trigger `on_auth_user_created` |
| 037 | `037_client_app_service_role_grants.sql` | ✅ | apply OK (verify dedicado skipped) |
| 038 | `038_provision_client_operational_event.sql` | ✅ | `verify-post-038.mjs` — RPC `provision_client_operational_event` |
| 039 | `039_client_event_guests_rpc.sql` | ✅ | apply OK |
| 040 | `040_client_event_payments_rpc.sql` | ✅ | apply OK |
| 041 | `041_client_event_vendors_rpc.sql` | ✅ | apply OK |
| 042 | `042_client_event_checklist_rpc.sql` | ✅ | apply OK |
| 043 | `043_client_event_documents_rpc.sql` | ✅ | `verify-rpcs.mjs` — 5 RPCs client-event + grants |

**Snapshot pós-043 (clone):** 10 políticas RLS nas tabelas client-app; 6 RPCs (`provision_client_operational_event` + 5 getters).

### 2. Rollback concluído

O rollback **036–043 foi executado no `finally` do pipeline**, independentemente do resultado dos smokes. A fase `rollback_legacy_intact` terminou com **pass: true**.

Objectos removidos no rollback (apenas clone): `profiles`, `client_events`, `event_members`, `event_onboarding_snapshots` e RPCs associadas.

### 3. Dados legados intactos

Após rollback, o clone manteve dados de fixture pré-migration:

| Métrica | Valor pós-rollback |
|---------|-------------------|
| `events_count` | 1 |
| `guests_count` | 2 |
| `profiles_remain` | `false` (tabela 036 removida — esperado) |

As tabelas legadas (`events`, `guests`, `payments`, `event_vendors`, `event_checklist_items`, `documents`, `businesses`, `clients`) e fixtures determinísticas permaneceram utilizáveis para ensaios futuros.

### 4. Produção não tocada

| Guarda | Resultado |
|--------|-----------|
| `PR4_DATABASE_URL` aponta para clone `rkkxfrwtmsqzpnbkshnd` | ✅ |
| Ref produção `oxsrdmydlqyvnueedgtl` ausente no destino | ✅ |
| `PR4_SOURCE_DATABASE_URL` não definida durante ensaio | ✅ |
| Password embebida na URL | ❌ (bloqueado) |
| `productionTouched` no relatório | `false` |

Dump de schema (`backups/production-public-pre036-schema.sql`, ~149 KB, public-only, sem COPY/INSERT) foi obtido em modo read-only e permanece gitignored.

### 5. Smokes — não executados, sem validação E2E

Os **8 smokes preview não foram iniciados**. Motivo registado: `credentials_missing` — em falta `STAGING_TEST_EVENT_FINGERPRINT` (e possivelmente outras credenciais STAGING_* não carregadas na sessão).

| Smoke | Estado |
|-------|--------|
| `test-c1-post-events-preview.mjs` | ⏭ não executado |
| `test-d-onboarding-sync-preview.mjs` | ⏭ não executado |
| `test-e1-dashboard-preview.mjs` | ⏭ não executado |
| `test-e4-guests-preview.mjs` | ⏭ não executado |
| `test-e4-payments-preview.mjs` | ⏭ não executado |
| `test-e4-vendors-preview.mjs` | ⏭ não executado |
| `test-e4-checklist-preview.mjs` | ⏭ não executado |
| `test-e4-documents-preview.mjs` | ⏭ não executado |

**Estes smokes exigem:** preview `uxleigndoomoezwsxlan`, credenciais STAGING_*, e servidor local (`next start` em `localhost:3000`). A sua ausência **não invalida** o rehearsal DB/código da PR.4.1, mas **não substitui** validação end-to-end antes de apply em produção.

### 6. Warnings — follow-up, não falha PR.4.1

| Item | Classificação | Notas |
|------|---------------|-------|
| ESLint warnings no `npm run build` | **Follow-up** | `@typescript-eslint/no-unused-vars`, `@next/next/no-img-element`, `react-hooks/exhaustive-deps`, `jsx-a11y/alt-text` — não bloqueiam build |
| `DEP0190` (spawn com `shell: true`) | **Follow-up** | Aviso Node ao invocar `npm test`/`npm run build` via `spawnSync` no pipeline |
| `npm warn Unknown env config "devdir"` | **Follow-up** | Config local npm, sem impacto no veredicto |

Nenhum destes itens foi contabilizado como falha da PR.4.1.

---

## Ambientes

| Ambiente | Ref | Papel neste ensaio |
|----------|-----|-------------------|
| **Produção** | `oxsrdmydlqyvnueedgtl` | Read-only para dump; **intocada** |
| **Clone dry-run** | `rkkxfrwtmsqzpnbkshnd` | Destino do ensaio completo |
| **Preview** | `uxleigndoomoezwsxlan` | Não usado (já tem 036–043; smokes apontam aqui) |

---

## Pipeline executado

```
dest_check → dump_local → preflight (node + psql)
  → prepare_public (DROP SCHEMA public CASCADE)
  → restore_schema (--single-transaction)
  → verify_post_restore
  → fixtures (--single-transaction)
  → verify_fixtures
  → verify_pre_migration
  → migrations 036–043 (apply + verify selectivo)
  → acl_rls_snapshot
  → npm test (446/446)
  → npm run build (via scripts/run-production-build.mjs)
  → smokes_preflight → smokes SKIPPED (credentials_missing)
  → rollback 036–043 (finally)
  → rollback_legacy_intact
```

**Duração total:** ~5m 32s (22:38:56 → 22:44:28 UTC)

---

## Fases críticas — detalhe

### Restore e baseline pré-036

- Schema public restaurado com 1× `CREATE SCHEMA public` no dump.
- `verify-post-restore`: schema, tabelas, funções, políticas RLS presentes.
- `verify-pre-migration`: objectos 036–043 **ausentes** antes do apply; `haxr_business` fixture presente.

### Fixtures (alinhadas ao schema pré-036)

Ordem FK: `business → client → event → dependências`. Sem coluna `slug` em `businesses`. IDs determinísticos. `ON CONFLICT` apenas em PKs reais.

### Build

- `npm run build` via `scripts/run-production-build.mjs` (normaliza `NODE_ENV=production`).
- Exit code 0. Compilação, typecheck e geração estática de 57 rotas concluídas.
- Nenhum import `next/document` na aplicação; falha histórica era runtime interno Next com `NODE_ENV` não-standard.

---

## Scripts e artefactos PR.4.1

| Artefacto | Função |
|-----------|--------|
| `scripts/pr4/run-dryrun-from-dump.mjs` | Orquestrador principal |
| `scripts/pr4/run-in-session.ps1` | Wrapper sessão (PGPASSWORD + PR4_DATABASE_URL) |
| `scripts/pr4/smokes-preflight.mjs` | Validação credenciais + servidor local |
| `scripts/pr4/fixtures-minimal.sql` | Fixtures determinísticas pré-036 |
| `scripts/pr4/verify-fixtures.mjs` | Validação pós-fixture |
| `scripts/run-production-build.mjs` | Build com NODE_ENV=production |
| `backups/pr4-dry-run-report.json` | Relatório JSON consolidado |
| `backups/production-public-pre036-schema.sql` | Dump schema (gitignored) |

---

## Limitações conhecidas

1. **Sem validação E2E** — smokes preview não corridos; apply em produção ainda requer plano de smoke manual ou CI com credenciais STAGING_*.
2. **Clone descartável** — estado pós-rollback é de ensaio; não reflecte produção.
3. **Histórico Supabase migrations** — dump public-only não inclui `supabase_migrations.schema_migrations`; verificações usam fingerprints de objectos, não histórico CLI.
4. **Gap 028/0281** — reconciliação documental produção permanece no plano PR.3; não foi objecto deste ensaio.

---

## Follow-up recomendado (pós-PR.4.1)

| Prioridade | Acção |
|------------|-------|
| Média | Correr smokes preview com credenciais STAGING_* + `next start` local |
| Baixa | Reduzir warnings ESLint (unused vars, img elements) |
| Baixa | Substituir `spawnSync(..., { shell: true })` para eliminar DEP0190 |
| Pré-produção | Snapshot Dashboard + plano GO/NO-GO PR.3 com mapa 028/0281 |

---

## Decisão

| Critério | Resultado |
|----------|-----------|
| Rehearsal DB 036–043 no clone | ✅ **PASS** |
| Rollback ensaiado | ✅ **PASS** |
| Testes unitários | ✅ **PASS** (446/446) |
| Build produção | ✅ **PASS** |
| Produção intocada | ✅ **CONFIRMADO** |
| Smokes E2E | ⏭ **NÃO EXECUTADOS** (opcional por contrato) |
| **PR.4.1 overall** | ✅ **`pass_with_optional_checks_skipped`** |

**Não autorizado por este relatório:** merge, deploy, apply em produção, ou alterações em `oxsrdmydlqyvnueedgtl`.

---

*Gerado após conclusão do pipeline PR.4.1. Sem credenciais, URLs com password, ou dados pessoais.*
