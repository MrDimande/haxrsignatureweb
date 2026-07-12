# PR.3 — Relatório do restore drill (backup lógico externo)

**Modo:** Estratégia B — backup read-only + restore no clone
**Estado:** **PASS — restore drill concluído**
**Backup válido:** `backups/pr3-production-pre036/2026-07-12T06-48-00/`
**Produção:** `oxsrdmydlqyvnueedgtl` · **intocada** (`productionTouched = false`)

---

## Referências

| Marco | Commit / artefacto |
|-------|---------------------|
| PR.4.1 dry-run | `ea8fe5b` |
| Pipeline drill | `scripts/pr3/run-backup-restore-drill.mjs` |
| Preflight | `scripts/pr3/run-preflight.mjs` |
| Runner | `scripts/pr3/run-preflight-in-session.ps1` |

**Clone de restore:** `rkkxfrwtmsqzpnbkshnd`

---

## Autorização

| Campo | Valor |
|-------|-------|
| Estratégia | **B — backup lógico externo** |
| Autoridade restauro | **Proprietário do projecto — Dimande** |
| Executor técnico | operador técnico local |

---

## Session pooler (Dashboard Connect :5432)

| | Host | Username | Porta | Database |
|---|------|----------|-------|----------|
| **Produção** | `aws-1-eu-central-1.pooler.supabase.com` | `postgres.oxsrdmydlqyvnueedgtl` | 5432 | postgres |
| **Clone** | `aws-0-eu-central-1.pooler.supabase.com` | `postgres.rkkxfrwtmsqzpnbkshnd` | 5432 | postgres |

**Causa raiz das falhas anteriores:** produção usa `aws-1`, clone usa `aws-0` — endpoints distintos; inferência por região falhou.

---

## Preflight

| Endpoint | `current_database` | `current_user` | Resultado |
|----------|-------------------|----------------|-----------|
| Produção | postgres | postgres | **PASS** |
| Clone | postgres | postgres | **PASS** |

---

## Backup (read-only produção)

| Artefacto | Bytes | SHA-256 |
|-----------|------:|---------|
| `roles.sql` | 217 | `D5C0D207C0A1FE86BD44723E54A9E02D70144F4C7093A6BC38270CA9C6768AA2` |
| `schema.sql` | 132 847 | `C77D3C9723868F783D5E1B69A36A94BE1EA034872A8B0DE4EEA6721CD9B669E8` |
| `data.sql` | 939 518 | `F6B31E25449D4DDD1CCC666BC86F719FC82A6F830785DBBD6EF0FE8335C45B2D` |
| `migration-history-schema.sql` | 1 631 | `47E0216D7C97D94B55EF82C144ED742F0A58E117530DBB6345DB48E28837A808` |
| `migration-history-data.sql` | 54 205 | `3E54560E1776C777F5A440298B9042D9364BFEFE5146764CC987E5AD24AC1650` |
| `auth-storage-inventory.json` | 1 630 | `CF9ED727EE6CE7E6F01A0A3D5912089D6E384C15FA3D06363B01FBFA0EE3D0B9` |
| `manifest.json` | 2 944 | `EB1941A86B126931A37D072C50027395288A4664340827AD9019C70964122ED4` |
| `checksums.sha256` | 590 | `0694B24EBADC6455B5A6B4AC96DC875FC517B1B14E068A6869A63F3CE790F05D` |

**Ferramentas:** pg_dump/psql PostgreSQL 17.10
**Nota:** `roles_dump_partial_or_failed` — esperado em Supabase managed (roles não exportáveis integralmente).

**Fora do backup lógico SQL:**
- dados `auth` (users, sessions, …)
- payloads binários `storage.objects`
- roles/grants Supabase além do scope do dump

**Inventário auth/storage (read-only):** 2 buckets (`concierge-uploads`, `haxr-concierge`); 1 objecto em `concierge-uploads`; sem triggers/policies personalizadas em auth.

---

## Restore (clone exclusivamente)

| Campo | Resultado |
|-------|-----------|
| Prepare clone | DROP `public` + `supabase_migrations` |
| Restore schema/dados | **PASS** |
| Validação | **PASS** |

---

## Validação pós-restore (clone)

| Verificação | Resultado |
|-------------|-----------|
| `businesses` (haxr-signature) | presente |
| Contagens core | businesses 2 · clients 2 · events 6 · guests 139 · payments 0 · documents 7 |
| Migration history | 19 entradas (última: `concierge_portal`) |
| Funções `public` | 15 |
| Policies `public` | 1 |
| Objectos 036–043 | **ausentes** (`objects036Absent = true`) |

---

## Comparação produção vs clone restaurado

| Dimensão | Diferença |
|----------|-----------|
| Fingerprint schema `public` | **nenhuma** |
| Contagens tabelas core | **nenhuma** |
| Migration history | **nenhuma** (19 = 19) |
| Funções / policies | **nenhuma** |
| Diferenças críticas | **nenhuma** (`restoreDifferencesCritical = false`) |

---

## Gate operacional final

| Requisito | Valor | Satisfeita |
|-----------|-------|------------|
| `backupAvailable = true` | **true** | ✅ |
| `restoreProcedureKnown = true` | **true** | ✅ |
| `restoreAuthorityIdentified = true` | **true** — Dimande | ✅ |
| `restoreTested = true` | **true** | ✅ |
| `productionTouched = false` | **false** | ✅ |
| `restoreDifferencesCritical = false` | **false** | ✅ |

**Restore drill:** **PASS** · `pass = true` · `exitCode = 0`

---

## Migrations 036–043

| Ambiente | Estado |
|----------|--------|
| Produção `oxsrdmydlqyvnueedgtl` | **Não aplicadas** — `profiles`/`client_events` ausentes; 19 migrations |
| Clone pós-restore | Réplica de produção pré-036 — objectos 036 ausentes |

---

## Tentativas falhadas (não válidas)

| Timestamp | Motivo |
|-----------|--------|
| `2026-07-12T05-49-34` | `pg_dump -X` inválido |
| `2026-07-12T05-57-31` | pooler `aws-0` na produção |
| `2026-07-12T06-01-34` | direct connection DNS |
| `2026-07-12T06-32-59` | node-pg SCRAM |
| `2026-07-12T06-36-41` | restore schema `public` exists |
| `2026-07-12T06-40-07` | restore DEFAULT PRIVILEGES |

Marcadas com `ATTEMPT_FAILED.txt` onde aplicável.

---

## Decisão Fase 1

**Restore drill PASS integral.** Pré-requisito operacional de backup/restauro satisfeito.

**Apply 036–043 em produção:** continua sujeito a decisão formal PR.3 itens 4–6 — **não autorizado automaticamente por este relatório.**

**Nenhuma mutação em produção executada durante este drill.**
