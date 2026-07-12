# PR.3 — Registo de aprovação da estratégia de backup/restauro

**Modo:** documental — decisão humana registada; **restore drill PASS**.

**Estado Fase 1:** **GO operacional para backup/restauro** — gate integral satisfeito.
**Estado apply 036–043:** **pendente decisão formal itens 4–6** — produção ainda não recebeu migrations.

---

## 1. Contexto

| Campo | Valor |
|-------|-------|
| **Produção** | `oxsrdmydlqyvnueedgtl` (`haxr-business-suite`) |
| **Plano actual** | Free (evidência Dashboard — commit `511e1d0`) |
| **Backup nativo** | indisponível |
| **Migrations pendentes** | 036–043 |
| **Produção intocada** | true |
| **Estado actual** | **Restore drill PASS** — backup `2026-07-12T06-48-00` |

### Referências auditáveis

| Marco | Commit / artefacto |
|-------|---------------------|
| Dry-run 036–043 (PR.4.1) | `ea8fe5b` |
| Inventário read-only | `857e1c2` |
| Relatório drill | `docs/PR3_EXTERNAL_BACKUP_RESTORE_DRILL_REPORT.md` |
| Backup válido | `backups/pr3-production-pre036/2026-07-12T06-48-00/` |

---

## 2. Estratégia seleccionada

| Campo | Valor |
|-------|-------|
| **Estratégia** | **B — backup lógico externo** |
| Aprovador | **Proprietário do projecto — Dimande** |
| Executor técnico | operador técnico local |
| Restauro integral em clone | **Concluído** — 2026-07-12 |
| SHA-256 registado | Sim — `manifest.json` + `checksums.sha256` |
| Encriptação | Pendente de decisão |

---

## 3. Gate (pós-drill)

| Requisito | Valor actual | Condição satisfeita |
|-----------|--------------|---------------------|
| `backupAvailable = true` | **true** | **sim** ✅ |
| `restoreProcedureKnown = true` | **true** | **sim** ✅ |
| `restoreAuthorityIdentified = true` | **true** — Dimande | **sim** ✅ |
| `restoreTested = true` | **true** | **sim** ✅ |
| `productionTouched = false` | **false** | **sim** ✅ |
| `restoreDifferencesCritical = false` | **false** | **sim** ✅ |

**Todos os requisitos do gate operacional satisfeitos.**

---

## 4. Decisão formal

### Fase 1 — backup/restauro

**GO** — restore drill concluído com PASS integral. Backup lógico externo validado.

### Apply migrations 036–043 em produção

**Pendente** — requer conclusão documental dos itens 4–6 (ordem apply, rollback operacional, janela).
**Nenhuma migration 036–043 foi aplicada em produção.**

---

## 5. Session pooler confirmado

| | Host | Username |
|---|------|----------|
| Produção | `aws-1-eu-central-1.pooler.supabase.com` | `postgres.oxsrdmydlqyvnueedgtl` |
| Clone | `aws-0-eu-central-1.pooler.supabase.com` | `postgres.rkkxfrwtmsqzpnbkshnd` |

---

**productionTouched = false**
