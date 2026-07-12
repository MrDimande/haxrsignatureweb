# PR.3 — Registo de aprovação da estratégia de backup/restauro

**Modo:** documental — **nenhuma acção mutável executada neste documento**.

> Formulário de **decisão humana**. Nenhuma estratégia (A, B ou C) está pré-seleccionada.

---

## 1. Contexto

| Campo | Valor |
|-------|-------|
| **Produção** | `oxsrdmydlqyvnueedgtl` (`haxr-business-suite`) |
| **Plano actual** | Free (evidência Dashboard — commit `511e1d0`) |
| **Backup nativo** | indisponível |
| **Migrations pendentes** | 036–043 |
| **Produção intocada** | true |
| **Estado actual** | **NO-GO** — estratégia de backup/restauro ainda não seleccionada, aprovada e testada |

### Referências auditáveis

| Marco | Commit |
|-------|--------|
| Dry-run 036–043 (PR.4.1) | `ea8fe5b` |
| Inventário read-only | `857e1c2` |
| Restore readiness gate | `fb478ee` |
| Evidência Dashboard | `511e1d0` |
| Comparação de estratégias | `4c66d4f` |

**Documentos relacionados:**

- `docs/PR3_PRODUCTION_READONLY_INVENTORY.md`
- `docs/PR3_BACKUP_RESTORE_STRATEGY_DECISION.md`

---

## 2. Estratégias disponíveis

> Preencher **manualmente** após decisão humana. Campos em branco permanecem **Pendente de decisão**.

### A — Upgrade para backup nativo

| Campo | Valor |
|-------|-------|
| Aprovação financeira | Pendente de decisão |
| Custo confirmado | Pendente de decisão |
| Plano seleccionado | Pendente de decisão |
| Backup confirmado após upgrade | Pendente de decisão |
| Retenção confirmada | Pendente de decisão |
| Responsável por autorizar restauro | Pendente de confirmação pelo operador |
| Responsável por executar restauro | Pendente de confirmação pelo operador |
| Restore drill concluído | Pendente de decisão |
| Evidência | Pendente de decisão |
| **Decisão** | **pendente** (aprovado / rejeitado / pendente) |

### B — Backup lógico externo

| Campo | Valor |
|-------|-------|
| Responsável pelo dump | Pendente de confirmação pelo operador |
| Responsável pela custódia | Pendente de confirmação pelo operador |
| Responsável pelo restauro | Pendente de confirmação pelo operador |
| Encriptação definida | Pendente de decisão |
| SHA-256 registado | Pendente de decisão |
| Restauro integral em clone concluído | Pendente de decisão |
| Schema validado | Pendente de decisão |
| Dados validados | Pendente de decisão |
| RLS / policies / functions / triggers validados | Pendente de decisão |
| RPO | Pendente de decisão |
| RTO | Pendente de decisão |
| Evidência | Pendente de decisão |
| **Decisão** | **pendente** (aprovado / rejeitado / pendente) |

### C — Adiar migrations

| Campo | Valor |
|-------|-------|
| Impacto funcional aceite | Pendente de decisão |
| Prazo de reconsideração | Pendente de decisão |
| Responsável pela decisão | Pendente de confirmação pelo operador |
| Risco de adiamento aceite | Pendente de decisão |
| **Decisão** | **pendente** (aprovado / rejeitado / pendente) |

---

## 3. Estratégia seleccionada

| Campo | Valor |
|-------|-------|
| **Estratégia** | **Pendente de decisão humana** (A / B / C) |
| Fundamentação | Pendente de decisão |
| Data | Pendente de decisão |
| Aprovador | Pendente de confirmação pelo operador |
| Executor técnico | Pendente de confirmação pelo operador |
| Janela proposta | Pendente de decisão |

---

## 4. Gate

> **Ressalva:** `restoreProcedureKnown = true` (inventário `511e1d0`) significa apenas que o procedimento/pré-requisitos estão **documentados**. **Não** prova restauro disponível, operacional ou testado.

| Requisito | Valor actual / estado | Condição satisfeita |
|-----------|----------------------|---------------------|
| `backupAvailable = true` | **false** | **não** ❌ |
| `restoreProcedureKnown = true` | **true** — documentação apenas | **sim** ⚠️ (não prova capacidade operacional) |
| `restoreAuthorityIdentified = true` | pendente | **não** ❌ |
| `restoreTested = true` | **false** | **não** ❌ |
| `productionTouched = false` | **false** (produção intocada) | **sim** ✅ |

**Nenhuma condição operacional de backup/restauro satisfeita para GO.**

---

## 5. Decisão formal

Enquanto não existir estratégia aprovada e testada:

**NO-GO — nenhuma aplicação das migrations 036–043 autorizada.**

---

## Proibições respeitadas nesta tarefa

| Acção | Executada? |
|-------|------------|
| Selecção automática de estratégia A/B/C | **Não** |
| Upgrade / backup / snapshot / pg_dump | **Não** |
| SQL / repair / db push / migrations | **Não** |
| push / merge / deploy | **Não** |
| Alteração produção `oxsrdmydlqyvnueedgtl` | **Não** |
| Alteração de outros ficheiros | **Não** |
| Commit automático | **Não** |

**productionTouched = false**
