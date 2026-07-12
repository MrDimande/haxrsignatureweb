# PR.3 — Checklist janela de manutenção (036–043)

**Produção:** `oxsrdmydlqyvnueedgtl` · **Clone:** `rkkxfrwtmsqzpnbkshnd`  
**Branch:** `rebuild-haxr-platform` · **PR:** #3 (Draft)

---

## Janela proposta

| Item | Valor |
|------|-------|
| Duração | 45–60 min |
| Operador | operador técnico local |
| Freeze deploy | Sim |
| Abort | 1.º erro / divergência preflight / verify falha |

---

## T-24h (pré-requisitos técnicos)

| # | Acção | Estado |
|---|--------|--------|
| 1 | Restore drill PASS | ✅ |
| 2 | Backup cifrado + checksum | ✅ |
| 3 | Smokes DB clone PASS | ✅ |
| 4 | Pre-apply gate PASS | ✅ |
| 5 | GO escrito Dimande | ⏳ **PENDENTE** |
| 6 | Rollback aprovado | ⏳ **PENDENTE** |
| 7 | Password DB (Read-Host) | ⏳ na janela |

---

## T-0 — Preflight (autónomo + password)

| # | Acção | Comando | OK |
|---|--------|---------|-----|
| 1 | Gate pré-apply | `node scripts/pr3/run-pre-apply-gate.mjs` | ☐ |
| 2 | Produção pré-036 live | `verify-production-pre-036.mjs` | ☐ |
| 3 | Token GO | `PR3_APPLY_AUTHORIZED=PR3_HUMAN_GO_CONFIRMED` | ☐ |
| 4 | Timestamp início | UTC+2 | ☐ |

---

## Durante apply

```powershell
$env:PR3_APPLY_AUTHORIZED = "PR3_HUMAN_GO_CONFIRMED"
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\pr3\run-production-apply-in-session.ps1
```

| Migration | Ficheiro | OK |
|-----------|----------|-----|
| 036 | `036_client_app_auth.sql` | ☐ |
| 037 | `037_client_app_service_role_grants.sql` | ☐ |
| 038 | `038_provision_client_operational_event.sql` | ☐ |
| 039 | `039_client_event_guests_rpc.sql` | ☐ |
| 040 | `040_client_event_payments_rpc.sql` | ☐ |
| 041 | `041_client_event_vendors_rpc.sql` | ☐ |
| 042 | `042_client_event_checklist_rpc.sql` | ☐ |
| 043 | `043_client_event_documents_rpc.sql` | ☐ |

---

## T+0 pós-schema

| # | Verificação | OK |
|---|-------------|-----|
| 1 | post-036 | ☐ |
| 2 | post-038 | ☐ |
| 3 | RPCs (043) | ☐ |

---

## T+deploy

| # | Acção | OK |
|---|--------|-----|
| 1 | Schema PASS confirmado | ☐ |
| 2 | Deploy Vercel | ☐ |
| 3 | Smokes HTTP C.1, D, E.* | ☐ |
| 4 | Monitorização 30 min | ☐ |

---

## Registo final

| Campo | Valor |
|-------|-------|
| Início | |
| Fim | |
| Resultado | ☐ PASS · ☐ ABORT |
| productionTouched | |
