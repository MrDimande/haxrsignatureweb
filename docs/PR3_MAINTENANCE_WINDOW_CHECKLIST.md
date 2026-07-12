# PR.3 — Checklist janela de manutenção (036–043)

**Produção:** `oxsrdmydlqyvnueedgtl` · **Clone:** `rkkxfrwtmsqzpnbkshnd`  
**Branch:** `main` · **PR:** #3 — **MERGED** (`e51e973`)

---

## Janela executada

| Item | Valor |
|------|-------|
| Data | 2026-07-12 |
| Duração efectiva apply | ~79 s |
| Operador | operador técnico local |
| Freeze deploy | Sim |
| Abort | Não activado — janela PASS |

---

## T-24h (pré-requisitos técnicos)

| # | Acção | Estado |
|---|--------|--------|
| 1 | Restore drill PASS | ✅ |
| 2 | Backup cifrado + checksum | ✅ |
| 3 | Smokes DB clone PASS | ✅ |
| 4 | Pre-apply gate PASS | ✅ |
| 5 | GO escrito Dimande | ✅ |
| 6 | Rollback aprovado | ✅ |
| 7 | Password DB (sessão) | ✅ |

---

## T-0 — Preflight

| # | Acção | OK |
|---|--------|-----|
| 1 | Gate pré-apply | ✅ |
| 2 | Produção pré-036 live | ✅ |
| 3 | Token GO | ✅ |
| 4 | Timestamp início | ✅ 2026-07-12T16:30:10Z |

---

## Durante apply

| Migration | Ficheiro | OK |
|-----------|----------|-----|
| 036 | `036_client_app_auth.sql` | ✅ |
| 037 | `037_client_app_service_role_grants.sql` | ✅ |
| 038 | `038_provision_client_operational_event.sql` | ✅ |
| 039 | `039_client_event_guests_rpc.sql` | ✅ |
| 040 | `040_client_event_payments_rpc.sql` | ✅ |
| 041 | `041_client_event_vendors_rpc.sql` | ✅ |
| 042 | `042_client_event_checklist_rpc.sql` | ✅ |
| 043 | `043_client_event_documents_rpc.sql` | ✅ |

---

## T+0 pós-schema

| # | Verificação | OK |
|---|-------------|-----|
| 1 | post-036 | ✅ |
| 2 | post-038 | ✅ |
| 3 | RPCs (043) | ✅ |

---

## T+deploy

| # | Acção | OK |
|---|--------|-----|
| 1 | Schema PASS confirmado | ✅ |
| 2 | Deploy Vercel | ✅ |
| 3 | Smokes HTTP (sign-in, API, auth, create event) | ✅ |
| 4 | Monitorização 30 min | ⏳ operador |

---

## Registo final

| Campo | Valor |
|-------|-------|
| Início apply | 2026-07-12T16:30:10Z |
| Fim smokes HTTP | 2026-07-12T16:49:50Z |
| Resultado | **PASS** |
| productionTouched | **true** |
| Monitorização T+30 | **PASS** |
| Smoke cleanup | **DONE** |
| Password DB rotation | **PENDENTE** (proprietário) |
| Restore executado | **Não** |
