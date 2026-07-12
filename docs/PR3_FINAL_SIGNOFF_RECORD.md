# PR.3 — Registo de assinatura (GO + rollback)

**Projecto:** HAXR Signature · migrations 036–043  
**Produção:** `oxsrdmydlqyvnueedgtl` · **Clone ensaio:** `rkkxfrwtmsqzpnbkshnd`  
**Branch:** `main` · **PR:** #3 — **MERGED** (`e51e973`)

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

| Campo | Valor |
|-------|-------|
| Preflight / pre-apply gate | **PASS** |
| Apply 036–043 | **PASS** — `2026-07-12T16:30:10Z` → `2026-07-12T16:31:29Z` |
| Verificações schema | **PASS** (post-036, post-038, RPCs 043) |
| Merge PR #3 | **DONE** — `e51e973` |
| Deploy Vercel prod | **Ready** — `https://www.haxrsignature.com` |
| Smokes HTTP | **PASS** — `production-http-smoke-report.json` (8/8) |
| Restore integral | **NÃO executado** (conforme GO) |
| `productionTouched` | **true** |
| Resultado janela | **PASS** |

Relatórios: `backups/pr3-production-pre036/production-apply-report.json`, `production-http-smoke-report.json`

---

## 5. Housekeeping pós-janela

| Campo | Valor |
|-------|-------|
| Monitorização T+30 | **PASS** — nenhum incidente de produção |
| PR closeout | `pr3-post-window-closeout` → main |
| Artefactos smoke | **Removidos** (GO Dimande 2026-07-12) |
| `passwordRotationStatus` | **deferred_by_owner** |
| `passwordRotationRequired` | **true** |
| `passwordRotationCompleted` | **false** |
| Responsável rotação | Proprietário — Dimande |
| Prazo rotação | Imediatamente após encerramento desta sessão |

---

**Sem passwords neste documento.**
