# PR.3 — Checklist janela de manutenção (036–043)

**Produção:** `oxsrdmydlqyvnueedgtl` · **Clone ensaio:** `rkkxfrwtmsqzpnbkshnd`

---

## T-24h

| # | Acção | OK |
|---|--------|-----|
| 1 | GO escrito assinado (`PR3_FINAL_SIGNOFF_RECORD.md`) | ☐ |
| 2 | Rollback aprovado e operador identificado | ☐ |
| 3 | Freeze deploy comunicado à equipa | ☐ |
| 4 | Password DB produção confirmada (rotacionada se exposta) | ☐ |
| 5 | Backup `.enc` acessível ao custodiante | ☐ |

---

## T-1h

| # | Acção | Comando / critério | OK |
|---|--------|-------------------|-----|
| 1 | Gate pré-apply local | `node scripts/pr3/run-pre-apply-gate.mjs` | ☐ |
| 2 | Checksum backup | exit 0 | ☐ |
| 3 | Produção ainda pré-036 | `node scripts/pr3/verify-production-pre-036.mjs` | ☐ |
| 4 | Token GO na sessão | `PR3_APPLY_AUTHORIZED=PR3_HUMAN_GO_CONFIRMED` | ☐ |
| 5 | Registar hora início | timestamp UTC+2 | ☐ |

---

## Durante apply

| # | Regra |
|---|--------|
| 1 | Uma migration por transacção — ordem 036→043 |
| 2 | Parar no **primeiro** erro |
| 3 | Registar exit code de cada passo |
| 4 | **Não** `db push`, repair, nem restore automático |

```powershell
$env:PR3_APPLY_AUTHORIZED = "PR3_HUMAN_GO_CONFIRMED"
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\pr3\run-production-apply-in-session.ps1
```

Relatório: `backups/pr3-production-pre036/production-apply-report.json`

---

## T+0 pós-apply (schema)

| # | Verificação | OK |
|---|-------------|-----|
| 1 | `verify-production-post-036.mjs` | ☐ |
| 2 | `verify-production-post-038.mjs` | ☐ |
| 3 | `verify-production-rpcs.mjs` | ☐ |
| 4 | Relatório apply guardado | ☐ |

---

## T+deploy (app client — fase separada)

| # | Acção | OK |
|---|--------|-----|
| 1 | Deploy app autorizado | ☐ |
| 2 | Smokes HTTP (C.1, D, E.*) | ☐ |
| 3 | Monitorização 30 min | ☐ |

---

## Abort

Se qualquer passo falhar:

1. **Parar** — não continuar migrations
2. Preservar logs (sanitizados)
3. Escalar ao proprietário (Dimande)
4. Decidir: rollback schema vs restore integral (secção rollback do plano)

---

## Registo final janela

| Campo | Valor |
|-------|-------|
| Início | |
| Fim | |
| Migrations aplicadas | 036–043 ☐ |
| Resultado | ☐ PASS · ☐ ABORT |
| Operador | |
| productionTouched | true apenas se apply executado |
