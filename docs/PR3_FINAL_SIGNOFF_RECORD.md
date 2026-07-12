# PR.3 — Registo de assinatura (GO + rollback)

**Projecto:** HAXR Signature · migrations 036–043  
**Produção:** `oxsrdmydlqyvnueedgtl` · **Clone ensaio:** `rkkxfrwtmsqzpnbkshnd`  
**Branch:** `rebuild-haxr-platform` · **Head:** `c01a8fa`  
**Estado técnico:** prontidão operacional **COMPLETA** — apply **pendente GO humano**

---

## Pré-requisitos técnicos (comprovados)

| Item | Estado | Evidência |
|------|--------|-----------|
| Restore drill | **PASS** | commit `3b8515c` |
| Checksum backup 7/7 | **PASS** | `scripts/pr3/verify-backup-checksums.mjs` |
| Backup cifrado | **PASS** | `2026-07-12T06-48-00.tar.gz.enc` (578 160 B) |
| SHA-256 `.enc` | **PASS** | `E93FB283107475B9D7A8643476B5C938BC70055E99AD03D21951AA418267E39D` |
| Smokes DB clone | **PASS** | `pr3-clone-e2e-smoke-report.json` (2026-07-12) |
| Produção pré-036 | **PASS** | `production-pre036-verification.json` |
| Pre-apply gate | **PASS** | `run-pre-apply-gate.mjs` |
| Tooling janela | **PRONTO** | commits `81a6080`, `c01a8fa` |
| PR GitHub | **Draft #3** | `rebuild-haxr-platform` → `main` |

**Custodiante backup:** Proprietário — Dimande  
**Executor técnico proposto:** operador técnico local (sessão Cursor)

---

## Janela de manutenção proposta

| Campo | Valor proposto |
|-------|----------------|
| **Duração estimada** | 45–60 minutos |
| **Início proposto** | _A confirmar no GO_ |
| **Fim proposto** | _Início + 60 min_ |
| **Freeze deploy** | Sim — sem merges/deploys concorrentes durante a janela |
| **Operador** | operador técnico local |
| **Critérios abort** | Primeiro erro de migration; divergência preflight; verificação pós-step falha |
| **Rollback schema** | Permitido se 036–043 sem dados reais (plano aprovado abaixo) |
| **Restore integral** | **Não** sem nova confirmação explícita Dimande |

**Ordem apply (produção):** 036 → 037 → 038 → 039 → 040 → 041 → 042 → 043  
**Excluído:** 028, 0281, `db push`, repair automático, restore automático

---

## 1. Aprovação formal de rollback

Eu, abaixo assinado, **aprovo o plano de abort/rollback** em  
`docs/PR3_PRODUCTION_APPLY_ROLLBACK_PLAN.md`:

- Paragem imediata no primeiro erro
- Rollback schema se 036–043 sem dados reais de negócio
- Restore integral **apenas** com nova autorização escrita, backup `2026-07-12T06-48-00`

| Campo | Valor |
|-------|-------|
| **Nome** | Dimande |
| **Função** | Proprietário do projecto |
| **Rollback aprovado** | ☐ Sim · ☐ Não |
| **Data** | __________________ |
| **Assinatura** | __________________ |

---

## 2. Autorização GO — apply + deploy + smokes

| Campo | Valor |
|-------|-------|
| **GO autorizado** | ☐ Sim · ☐ Não |
| **Texto GO literal** | _(colar abaixo após emissão)_ |
| **Janela início (UTC+2)** | __________________ |
| **Janela fim (UTC+2)** | __________________ |
| **Operador técnico** | operador técnico local |
| **Freeze deploy** | ☐ Sim |
| **Proprietário** | Dimande |
| **Data GO** | __________________ |

### Texto GO recebido (literal)

```
(pendente — aguarda autorização explícita do proprietário)
```

### Comandos autorizados na janela

1. `node scripts/pr3/run-pre-apply-gate.mjs`
2. `PR3_APPLY_AUTHORIZED=PR3_HUMAN_GO_CONFIRMED` + `run-production-apply-in-session.ps1`
3. Deploy Vercel (pós schema PASS)
4. Smokes HTTP controlados

---

## 3. Custódia backup

| Campo | Valor |
|-------|-------|
| Custodiante | **Proprietário — Dimande** |
| Backup original | `backups/pr3-production-pre036/2026-07-12T06-48-00/` |
| Arquivo cifrado | `backups/pr3-production-pre036/2026-07-12T06-48-00.tar.gz.enc` |
| Confirmo custódia | ☐ Sim |

---

## 4. Registo pós-execução (preencher após janela)

| Campo | Valor |
|-------|-------|
| Preflight | |
| Apply 036–043 | |
| Deploy | |
| Smokes HTTP | |
| productionTouched | |
| Restore executado | ☐ Não |

---

**Não commitar passwords.** Após GO, este registo será actualizado e commitado sem segredos.
