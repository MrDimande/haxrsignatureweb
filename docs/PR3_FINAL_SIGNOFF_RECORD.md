# PR.3 — Registo de assinatura (GO + rollback)

**Projecto:** HAXR Signature · migrations 036–043  
**Produção:** `oxsrdmydlqyvnueedgtl` · **Clone ensaio:** `rkkxfrwtmsqzpnbkshnd`  
**Branch:** `rebuild-haxr-platform` · **PR:** #3 (Draft)

---

## Pré-requisitos técnicos (comprovados)

| Item | Estado | Evidência |
|------|--------|-----------|
| Restore drill | **PASS** | commit `3b8515c` |
| Checksum backup 7/7 | **PASS** | `verify-backup-checksums.mjs` |
| Backup cifrado | **PASS** | `2026-07-12T06-48-00.tar.gz.enc` |
| Smokes DB clone | **PASS** | `pr3-clone-e2e-smoke-report.json` |
| Pre-apply gate | **PASS** | `run-pre-apply-gate.mjs` |

**Custodiante backup:** Proprietário — Dimande  
**Executor técnico:** operador técnico local

---

## 1. Aprovação formal de rollback

| Campo | Valor |
|-------|-------|
| **Nome** | Dimande |
| **Função** | Proprietário do projecto |
| **Rollback aprovado** | **Sim** (via GO abaixo) |
| **Data** | 2026-07-12 |

---

## 2. Autorização GO — apply + deploy + smokes

| Campo | Valor |
|-------|-------|
| **GO autorizado** | **Sim** |
| **Proprietário / aprovador** | Dimande |
| **Operador técnico** | operador técnico local |
| **Freeze deploy** | Sim |
| **Janela início (UTC+2)** | 2026-07-12T18:30:00+02:00 |
| **Data GO** | 2026-07-12 |

### Texto GO recebido (literal)

```
EU, DIMANDE, AUTORIZO O GO DE PRODUÇÃO DA PR.3, A APLICAÇÃO CONTROLADA DAS MIGRATIONS 036–043, O DEPLOY E OS SMOKES, NA JANELA REGISTADA. AUTORIZO ABORT IMEDIATO AO PRIMEIRO ERRO. NÃO AUTORIZO RESTORE INTEGRAL OU ROLLBACK DESTRUTIVO SEM NOVA CONFIRMAÇÃO EXPLÍCITA.
```

---

## 3. Custódia backup

| Campo | Valor |
|-------|-------|
| Custodiante | **Proprietário — Dimande** |
| Confirmo custódia | **Sim** |

---

## 4. Registo pós-execução

_(Actualizado após janela — ver `production-apply-report.json` e relatório final)_

| Campo | Valor |
|-------|-------|
| Preflight | _(pendente execução)_ |
| Apply 036–043 | _(pendente execução)_ |
| Deploy | _(pendente execução)_ |
| Smokes HTTP | _(pendente execução)_ |

---

**Sem passwords neste documento.**
