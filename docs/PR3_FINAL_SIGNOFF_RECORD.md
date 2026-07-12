# PR.3 — Registo de assinatura (GO + rollback)

**Projecto:** HAXR Signature · migrations 036–043  
**Produção:** `oxsrdmydlqyvnueedgtl`  
**Estado técnico:** prontidão operacional **COMPLETA** — apply **não executado**

---

## Pré-requisitos técnicos (já satisfeitos)

| Item | Estado | Evidência |
|------|--------|-----------|
| Restore drill | PASS | commit `3b8515c` |
| Checksum backup 7/7 | PASS | `verify-backup-checksums.mjs` |
| Backup cifrado | PASS | `2026-07-12T06-48-00.tar.gz.enc` |
| SHA-256 `.enc` | PASS | `E93FB283…672E39D` |
| Smokes DB clone | PASS | `pr3-clone-e2e-smoke-report.json` |
| Produção pré-036 | PASS | `production-pre036-verification.json` |
| Tooling janela | PRONTO | commit `81a6080` |

---

## 1. Aprovação formal de rollback

Eu, abaixo assinado, **aprovo o plano de abort/rollback** documentado em  
`docs/PR3_PRODUCTION_APPLY_ROLLBACK_PLAN.md`, incluindo:

- Paragem imediata no primeiro erro de migration
- Rollback de schema se 036–043 sem dados reais de negócio
- Restore integral **apenas** com autorização escrita minha, a partir do backup  
  `backups/pr3-production-pre036/2026-07-12T06-48-00/`

| Campo | Preencher |
|-------|-----------|
| **Nome** | Dimande |
| **Função** | Proprietário do projecto |
| **Data** | __________________ |
| **Assinatura** | __________________ |

---

## 2. Autorização GO — apply 036–043 em produção

Autorizo **apenas na janela abaixo** a execução de:

```powershell
$env:PR3_APPLY_AUTHORIZED = "PR3_HUMAN_GO_CONFIRMED"
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\pr3\run-production-apply-in-session.ps1
```

| Campo | Preencher |
|-------|-----------|
| **GO autorizado** | ☐ Sim · ☐ Não |
| **Janela início (UTC+2)** | __________________ |
| **Janela fim (UTC+2)** | __________________ |
| **Operador técnico** | __________________ |
| **Freeze deploy comunicado** | ☐ Sim |
| **Nome proprietário** | Dimande |
| **Data GO** | __________________ |
| **Assinatura** | __________________ |

---

## 3. Custódia backup

| Campo | Valor |
|-------|-------|
| Custodiante | **Proprietário — Dimande** |
| Backup original | `backups/pr3-production-pre036/2026-07-12T06-48-00/` |
| Arquivo cifrado | `backups/pr3-production-pre036/2026-07-12T06-48-00.tar.gz.enc` |
| Password arquivo | **Apenas custodiante** — nunca em git |

| Confirmo custódia | ☐ Sim |
|-------------------|-------|
| Data | __________________ |
| Assinatura | __________________ |

---

## 4. Pós-apply (fora desta autorização)

- Deploy app client: **autorização separada** após schema PASS
- Smokes HTTP: **após deploy** — não bloqueiam apply isolado do schema

---

**Este documento não executa SQL.** Após preenchimento e assinatura, arquivar em local seguro (não commitar passwords).
