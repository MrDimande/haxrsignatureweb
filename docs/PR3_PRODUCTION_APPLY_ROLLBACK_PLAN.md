# PR.3 — Plano de apply e rollback em produção (036–043)

**Modo:** prontidão operacional concluída — **nenhum SQL mutável em produção**  
**Estado:** pronto para GO humano final — apply **não autorizado** até assinatura + janela  
**Produção:** `oxsrdmydlqyvnueedgtl` · **intocada**  
**Reavaliação:** 2026-07-12

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

## Referências

| Marco | Valor |
|-------|-------|
| Restore drill | **PASS** — `3b8515c` |
| Backup | `backups/pr3-production-pre036/2026-07-12T06-48-00/` |
| Arquivo cifrado | `backups/pr3-production-pre036/2026-07-12T06-48-00.tar.gz.enc` |
| SHA-256 `.enc` | `E93FB283107475B9D7A8643476B5C938BC70055E99AD03D21951AA418267E39D` |
| Smokes clone | `backups/pr3-production-pre036/pr3-clone-e2e-smoke-report.json` |
| Session pooler produção | `aws-1-eu-central-1.pooler.supabase.com` · `postgres.oxsrdmydlqyvnueedgtl` |
| Clone ensaio | `rkkxfrwtmsqzpnbkshnd` · `aws-0-eu-central-1.pooler.supabase.com` |

---

## Responsabilidades

| Papel | Titular |
|-------|---------|
| Autorizar apply / restore / GO final | **Proprietário — Dimande** |
| Custodiante backup (original + cifrado) | **Proprietário — Dimande** |
| Executor técnico | **Operador técnico local** |

---

## Pré-janela — checklist actualizado

| # | Item | Estado |
|---|------|--------|
| 1 | Checksum backup 7/7 | ✅ PASS |
| 2 | Restore drill PASS | ✅ |
| 3 | Backup cifrado + verificação decrypt/list | ✅ PASS |
| 4 | Custódia registada (Dimande) | ✅ |
| 5 | Smokes DB clone E2E | ✅ PASS |
| 6 | Objectos 036–043 ausentes em produção | ✅ |
| 7 | Aprovação formal rollback | ⚠️ **Pendente** |
| 8 | Janela de manutenção | ⚠️ **Pendente** |
| 9 | GO escrito proprietário | ⚠️ **Pendente** |
| 10 | Revalidação checksum imediata pré-apply | Pendente janela |

---

## Smokes — distinção obrigatória

### Smokes DB no clone (pré-GO migrations) — **PASS**

Pipeline: `scripts/pr3/run-clone-e2e-in-session.ps1`

Valida exclusivamente no clone `rkkxfrwtmsqzpnbkshnd`:

- Apply 036→043
- Tabelas, enums, trigger, RLS, policies, grants
- Provisioning + idempotência
- 6 funções (provision + 5 RPCs)
- Payloads: convidados, pagamentos, fornecedores, checklist, documentos
- Isolamento entre utilizadores (RLS)

**Necessários antes do GO para apply do schema.**

### Smokes HTTP da aplicação — **pós-deploy**

Scripts `scripts/test-*-preview.mjs` (adaptar para ambiente pós-deploy).

**Não bloqueiam** o apply isolado do schema se o plano de rollback estiver formalmente aprovado.

---

## Cifragem backup

| Item | Detalhe |
|------|---------|
| Script | `scripts/pr3/encrypt-backup.ps1` |
| Algoritmo | AES-256-CBC + PBKDF2 (100 000 iter) |
| Verificação | decrypt + `tar -tzf` antes de concluir |
| Original | **Não apagado** |
| Git | **Nunca** commitar backup ou `.enc` |

---

## Ordem de apply (produção — só após GO)

036 → 037 → 038 → 039 → 040 → 041 → 042 → 043

(Critérios pós-036 / pós-038 / pós-043 inalterados — ver versão anterior deste plano.)

---

## Rollback

- **Schema:** `scripts/pr4/rollback-036-043.sql` (sem dados reais em 036–043)
- **Restore integral:** backup `2026-07-12T06-48-00` — **só com GO escrito Dimande**

**Aprovação formal rollback:** pendente assinatura proprietário.

---

## Estado actual

```text
Prontidão operacional PR.3:     COMPLETA
Backup cifrado:                 PASS
Smokes DB clone:                PASS
Apply 036–043 produção:         NO-GO (GO humano + janela pendentes)

READY FOR FINAL HUMAN GO — nenhuma migration aplicada ainda.

productionTouched = false
```

---

## Confirmação produção (read-only 2026-07-12)

- `profiles`, `client_events`, `provision_client_operational_event`: **ausentes**
- Migrations 036–043: **nenhuma**
- **Nenhuma** acção mutável sobre produção nesta tarefa

---

## Proibições respeitadas

Apply produção · smokes produção · `db push` · repair · restore produção · deploy · merge · push · commit automático — **todos não executados**.

---

## Janela — comandos (pós GO escrito Dimande)

| Fase | Comando |
|------|---------|
| Gate pré-apply | `node scripts/pr3/run-pre-apply-gate.mjs` |
| Apply 036–043 | `$env:PR3_APPLY_AUTHORIZED='PR3_HUMAN_GO_CONFIRMED'` + `run-production-apply-in-session.ps1` |
| Smokes HTTP | Após deploy app — scripts `test-*-preview.mjs` adaptados |

O runner de apply exige **dupla confirmação**: token `PR3_HUMAN_GO_CONFIRMED` + prompt `APPLY-PRODUCTION`.
