# PR.3 — Decisão GO / NO-GO (produção 036–043)

**Modo:** prontidão operacional concluída — **nenhuma migration aplicada em produção**  
**Data reavaliação:** 2026-07-12  
**Produção:** `oxsrdmydlqyvnueedgtl` · **intocada**

---

## Gate operacional (registo)

| Flag | Valor |
|------|-------|
| `backupEncrypted` | **true** |
| `encryptedArchiveChecksumValid` | **true** |
| `backupCustodian` | **Proprietário — Dimande** |
| `cloneDbSmokesPass` | **true** |
| `productionTouched` | **false** |

---

## Responsabilidades

| Papel | Titular |
|-------|---------|
| Autorizar apply / restore / GO final | **Proprietário do projecto — Dimande** |
| Custodiante do backup | **Proprietário do projecto — Dimande** |
| Executor técnico | **Operador técnico local** (sob autorização) |

---

## Estado resumido

```text
Fase 1 backup/restauro:           GO
Checksum backup (7 artefactos):   PASS
Backup cifrado + verificação:     PASS
Smokes DB clone (rkkx):           PASS
Smokes HTTP aplicação:            FORA DE SCOPE — pós-deploy
Aplicação 036–043 em produção:    AINDA NO-GO (aguarda GO escrito + janela)
productionTouched:                false
```

---

## Matriz de decisão

| Critério | Valor actual | Satisfeito | Bloqueia apply |
|----------|--------------|------------|----------------|
| `backupAvailable` | backup `2026-07-12T06-48-00` | ✅ | — |
| `restoreTested` | drill PASS (`3b8515c`) | ✅ | — |
| Backup checksum validado | **PASS** 7/7 | ✅ | — |
| Backup cifrado / custódia | **PASS** — `.enc` verificado | ✅ | — |
| Ordem 036–043 validada | PR.4.1 + smokes clone | ✅ | — |
| Smokes DB clone E2E | **PASS** — `pr3-clone-e2e-smoke-report.json` | ✅ | — |
| Smokes HTTP app | **Pós-deploy** — não bloqueiam apply isolado do schema | — | — |
| Rollback aprovado formalmente | Plano documentado; **assinatura pendente** | ⚠️ | **Sim** |
| Janela aprovada | **Pendente** | ❌ | **Sim** |
| GO escrito proprietário | **Pendente** | ❌ | **Sim** |
| 036–043 ausentes em produção | **confirmado** read-only 2026-07-12 | ✅ | — |
| Produção intocada | **true** | ✅ | — |

---

## Cifragem backup — PASS

| Item | Valor |
|------|-------|
| Arquivo cifrado | `backups/pr3-production-pre036/2026-07-12T06-48-00.tar.gz.enc` |
| Tamanho | **578 160 bytes** |
| SHA-256 | `E93FB283107475B9D7A8643476B5C938BC70055E99AD03D21951AA418267E39D` |
| Sidecar checksum | `2026-07-12T06-48-00.tar.gz.enc.sha256` (gitignored) |
| Descifragem / listagem | **PASS** — verificado durante `encrypt-backup.ps1` |
| Backup original | **Preservado** em `2026-07-12T06-48-00/` |
| Git | `backups/` gitignored — **nada commitado** |

---

## Smokes DB clone (`rkkxfrwtmsqzpnbkshnd`) — PASS

Relatório: `backups/pr3-production-pre036/pr3-clone-e2e-smoke-report.json`

| Área | Resultado |
|------|-----------|
| Apply 036→043 (clone only) | PASS |
| Tabelas, enums, trigger auth, RLS | PASS |
| Policies (10) + grants service_role | PASS |
| `provision_client_operational_event` + idempotência | PASS |
| 5 RPCs `get_client_event_*` + payloads | PASS |
| Convidados, pagamentos, fornecedores, checklist, documentos | PASS (via RPC payloads) |
| Isolamento RLS entre utilizadores | PASS (4/4 testes) |
| Ligação / mutação produção | **Nenhuma** |

### Smokes HTTP (aplicação)

Executados **depois do deploy** da app client — **não bloqueiam** o apply isolado do schema se rollback estiver aprovado.

---

## Produção (read-only, 2026-07-12)

| Objecto | Presente |
|---------|----------|
| `profiles` | **Não** |
| `client_events` | **Não** |
| `provision_client_operational_event` | **Não** |
| Migrations 036–043 | **Nenhuma** |

---

## Veredicto

```text
READY FOR FINAL HUMAN GO — nenhuma migration aplicada ainda.

Prontidão operacional PR.3: SATISFEITA (backup, cifra, smokes DB clone)
Apply 036–043 em produção: NO-GO até GO escrito + janela + rollback formal
```

---

## Bloqueios restantes (apenas humanos)

1. **Aprovação formal rollback** — assinatura Dimande
2. **Janela de manutenção** — data/hora, freeze deploy, operador de guarda
3. **GO escrito final** — proprietário Dimande
4. Revalidar checksum imediatamente antes do apply na janela

---

## Janela de manutenção — sequência (quando GO escrito)

```powershell
# 1. Gate read-only (artefactos + smokes clone; opcional produção live com password)
node scripts/pr3/run-pre-apply-gate.mjs

# 2. Apply 036–043 (SÓ após GO + confirmação APPLY-PRODUCTION)
$env:PR3_APPLY_AUTHORIZED = "PR3_HUMAN_GO_CONFIRMED"
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\pr3\run-production-apply-in-session.ps1

# 3. Pós-apply: deploy app client + smokes HTTP (não bloqueiam schema apply)
```

Relatório apply: `backups/pr3-production-pre036/production-apply-report.json`

---

## Proibições respeitadas

| Acção | Executado |
|-------|-----------|
| Apply 036–043 em produção | **Não** |
| Smokes / mutação produção | **Não** |
| `db push` / repair / restore produção | **Não** |
| Deploy / merge / push / commit | **Não** |

**productionTouched = false**
