# PR.3 — Relatório final de prontidão operacional

**Data fecho janela:** 2026-07-12  
**Merge PR #3:** `e51e973` (main)  
**Produção:** `oxsrdmydlqyvnueedgtl` · **`productionTouched = true`**

---

## Veredicto

```text
PR.3 JANELA PRODUÇÃO:           CONCLUÍDA
Apply 036–043 em produção:      PASS
Deploy Vercel produção:         Ready
Smokes HTTP produção:           PASS
Restore / rollback destrutivo:  NÃO executado (conforme GO)
```

---

## Gate operacional (pós-janela)

| Flag | Valor |
|------|-------|
| `backupEncrypted` | **true** |
| `encryptedArchiveChecksumValid` | **true** |
| `backupCustodian` | **Proprietário — Dimande** |
| `cloneDbSmokesPass` | **true** |
| `productionTouched` | **true** |
| `operationalReadinessComplete` | **true** |
| `readyForApply` | **true** (GO executado) |
| `productionApplyPass` | **true** |
| `productionHttpSmokesPass` | **true** |

---

## Evidências

| Artefacto | Localização |
|-----------|-------------|
| Backup original | `backups/pr3-production-pre036/2026-07-12T06-48-00/` |
| Backup cifrado | `backups/pr3-production-pre036/2026-07-12T06-48-00.tar.gz.enc` (578 160 B) |
| SHA-256 `.enc` | `E93FB283107475B9D7A8643476B5C938BC70055E99AD03D21951AA418267E39D` |
| Smokes clone | `backups/pr3-production-pre036/pr3-clone-e2e-smoke-report.json` |
| Apply produção | `backups/pr3-production-pre036/production-apply-report.json` |
| Smokes HTTP | `backups/pr3-production-pre036/production-http-smoke-report.json` |
| GO humano | `docs/PR3_FINAL_SIGNOFF_RECORD.md` |

---

## Cronologia janela (UTC)

| Fase | Início | Fim | Resultado |
|------|--------|-----|-----------|
| GO humano registado | 2026-07-12 ~16:28 | — | PASS |
| Apply 036–043 | 2026-07-12T16:30:10Z | 2026-07-12T16:31:29Z | **PASS** (13 steps) |
| Merge PR #3 → main | 2026-07-12T16:38:03Z | — | **DONE** (`e51e973`) |
| Deploy Vercel prod | pós-merge | Ready | **PASS** |
| Smokes HTTP | 2026-07-12T16:49:43Z | 2026-07-12T16:49:50Z | **PASS** (8/8) |

---

## Apply produção — resumo

13 steps PASS: pre_apply_gate, verify_pre036, apply 036–043, verify_post_036, verify_post_038, verify_post_043_rpcs.

Objectos confirmados em produção: `profiles`, `client_events`, RPCs `get_client_event_*`, `provision_client_operational_event`.

---

## Smokes HTTP produção — resumo

Base: `https://www.haxrsignature.com`

| Teste | Resultado |
|-------|-----------|
| `/sign-in` | 200 |
| `/app/events` sem auth | 307 |
| `POST /api/events` sem auth | 401 |
| Auth + `POST /api/events` | 201 |
| Sign-out | OK |

Utilizador efémero de smoke provisionado via service role (`pr3-http-smoke@provision.haxrsignature.internal`) — apenas para validação pós-deploy; não expõe credenciais.

---

## Documentação

| Documento | Propósito |
|-----------|-----------|
| `PR3_GO_NO_GO_DECISION.md` | Decisão final pós-janela |
| `PR3_PRODUCTION_APPLY_ROLLBACK_PLAN.md` | Plano apply/rollback (executado apply) |
| `PR3_FINAL_SIGNOFF_RECORD.md` | GO + registo pós-execução |
| `PR3_MAINTENANCE_WINDOW_CHECKLIST.md` | Checklist janela (marcado) |

---

## Scripts entregues

| Fase | Script |
|------|--------|
| Checksum | `verify-backup-checksums.mjs` |
| Cifra | `encrypt-backup.ps1` |
| Smokes clone | `run-clone-e2e-in-session.ps1` |
| Gate pré-apply | `run-pre-apply-gate.mjs` |
| Apply produção | `run-production-apply-in-session.ps1` |
| Smokes HTTP prod | `run-production-http-smokes.mjs` |

---

## Acções pós-janela recomendadas

1. Rotacionar password DB (exposta na sessão de chat)
2. Avaliar remoção ou retenção do utilizador de smoke PR.3
3. Monitorização 30 min pós-deploy (operador)

---

## Confirmação produção (pós-apply)

- `profiles`, `client_events`, RPCs 036–043: **presentes**
- Migrations aplicadas via SQL directo (histórico Supabase pode não listar 036–043 nos nomes)
- **Nenhum** restore integral executado

**PR.3 fechada com sucesso operacional.**

---

## Housekeeping pós-janela — FECHADO (2026-07-12)

### Monitorização T+30 — PASS

**Intervalo:** `2026-07-12T16:49:50Z` → `2026-07-12T17:19:50Z`

| Sinal | Resultado |
|-------|-----------|
| Erros runtime Vercel | **Nenhum** |
| Respostas 5xx | **Nenhuma** |
| Supabase API/Auth (intervalo) | **Sem falhas de app** |
| RPCs 039–043 | **Sem erros** |
| RLS / permissões | **Sem erros** |
| Provisioning | **Sem falhas** |
| `/sign-in` e rotas protegidas | 200 / 307 / 401 conforme esperado |

**Incidentes de produção no intervalo T+30:** **nenhum**.

Nota: evento auth `400` às 16:46 UTC ocorreu **antes** de T+0 (smoke inicial preview). Fora do intervalo T+30.

### PR closeout

| Item | Valor |
|------|-------|
| Branch | `pr3-post-window-closeout` |
| Conteúdo | docs PR.3 + `run-production-http-smokes.mjs` + `remove-smoke-artifacts.mjs` |
| Excluído | backups, `.enc`, `.env`, segredos |
| Deploy activo | `e51e973` (inalterado pelo PR documental) |

### Remoção artefactos smoke — DONE

**Autorização recebida (literal):** remoção exclusiva dos IDs inventariados.

| Tabela | Linhas removidas |
|--------|------------------|
| `event_onboarding_snapshots` | 1 |
| `event_members` | 1 |
| `profiles` (active_client_event_id → NULL) | 1 |
| `client_events` | 1 |
| `events` (operacional) | 1 |
| `profiles` | 1 |
| `auth.users` | 1 |

**Pós-verificação:** smoke user/profile/client_event ausentes · `total_users=0` · `total_client_events=0` · nenhum dado real de produção afectado (único conteúdo client-app era smoke).

Script: `scripts/pr3/remove-smoke-artifacts.mjs` (requer GO token).

### Rotação password DB

| Campo | Valor |
|-------|-------|
| `passwordRotationStatus` | **completed** |
| `passwordRotationRequired` | **true** |
| `passwordRotationCompleted` | **true** |
| `postRotationPreflight` | **PASS** |
| Confirmado | Proprietário — Dimande · 2026-07-12 |

Rotação executada no Supabase Dashboard (`oxsrdmydlqyvnueedgtl`). Nova password registada apenas no gestor de passwords do proprietário — **nunca no repositório**.

### Veredicto final PR.3

```text
Migrations 036–043:     LIVE
Deploy activo:          e51e973
Smokes HTTP:            8/8 PASS
T+30 monitorização:     PASS — nenhum incidente
Smoke cleanup:          DONE
Restore/rollback:       NÃO executado
productionTouched:      true (autorizado)
Password rotation:      PASS
PR.3:                   FECHADA (completa)
```
