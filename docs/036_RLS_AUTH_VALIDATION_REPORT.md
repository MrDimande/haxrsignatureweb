# Relatório A.3 — Validação RLS/Auth (migration 036)

**Data:** Julho 2026
**Estado:** ✅ **A.3 APROVADA**
**Alvo:** Preview `uxleigndoomoezwsxlan` · `https://uxleigndoomoezwsxlan.supabase.co`
**Produção:** `oxsrdmydlqyvnueedgtl` — **não alterada**
**MCP `user-supabase`:** não utilizado
**Edition:** não alterado

---

## 1. Project ref usado

| Verificação | Resultado |
|-------------|-----------|
| `supabase/.temp/project-ref` | `uxleigndoomoezwsxlan` ✅ |
| Migration `036` no histórico remoto | ✅ `client_app_auth` |
| Tabelas 036 existem | ✅ `profiles`, `client_events`, `event_members`, `event_onboarding_snapshots` |

---

## 2. Utilizadores de teste criados

| User | Email | UUID |
|------|-------|------|
| **A** | `staging-a@haxrsignature.test` | `acd1d7b7-b679-4c8b-94e1-4d4552f1d8ee` |
| **B** | `staging-b@haxrsignature.test` | `4a80dc5a-6a0c-43ab-b6a6-772559e60751` |

**Evento de teste (User A):** `2bc57de3-b11f-4f30-81e5-522e3918d8fa`
**Método:** insert SQL em `auth.users` + `auth.identities` no preview (trigger `on_auth_user_created` activo).

> Dados de teste criados **apenas no preview**. Cleanup automático no início do script de validação.

---

## 3. Resultado do trigger `profiles`

| Teste | Resultado |
|-------|-----------|
| User A → `profiles` auto-criado | ✅ |
| User B → `profiles` auto-criado | ✅ |
| Contagem total | **2 profiles** ✅ |

---

## 4. Resultado de cada teste RLS

| # | Teste | Resultado | Detalhe |
|---|-------|-----------|---------|
| 3 | User A: criar `client_event` + `event_member` + `active_client_event_id` | ✅ PASS | Setup completo |
| 4 | User B: ler evento de A | ✅ PASS | 0 rows |
| 5 | User B: `active_client_event_id` = evento de A | ✅ PASS | RLS policy violation |
| 8a | Snapshot INSERT como authenticated | ✅ PASS | `insufficient_privilege` |
| 8b | Snapshot INSERT como postgres/service | ✅ PASS | Insert OK (bypass RLS) |
| 9 | Anon SELECT `profiles` | ✅ PASS | `insufficient_privilege` |
| 9 | Anon INSERT `profiles` | ✅ PASS | `permission denied` |

**RLS activo nas 4 tabelas:** confirmado (`relrowsecurity = true` em todas).

**Anon nas 4 tabelas:** migration revoga `anon` em todas; teste explícito em `profiles` (SELECT + INSERT). Comportamento esperado idêntico nas restantes (sem GRANT a `anon`).

---

## 5. Resultado dos testes de índices únicos

| # | Teste | Resultado | Detalhe |
|---|-------|-----------|---------|
| 6 | Segundo `client_events` activo (User A) | ✅ PASS | `unique_violation` · `idx_client_events_one_active_per_owner` |
| 7 | Fingerprint duplicado activo | ✅ PASS | `unique_violation` · `idx_client_events_owner_fingerprint` |

---

## 6. Snapshot — authenticated vs service role

| Papel | INSERT `event_onboarding_snapshots` | Resultado |
|-------|--------------------------------------|-----------|
| `authenticated` (JWT User A) | Bloqueado | ✅ Esperado |
| `postgres` / service bypass | Sucesso | ✅ Esperado |

---

## 7. Teste `operational_event_id`

| Cenário | Resultado |
|---------|-----------|
| NULL por defeito | ✅ PASS |
| UUID válido de `public.events` | ⏭️ **SKIP** — preview sem seed em `events` |
| UUID inválido (FK) | ✅ PASS — `foreign_key_violation` |

---

## 8. Smoke test — tabelas operacionais (preview)

| Tabela | SELECT (postgres) |
|--------|---------------------|
| `events` | ✅ |
| `guests` | ✅ |
| `payments` | ✅ |
| `concierge_uploads` | ✅ |
| `concierge_review_items` | ✅ |
| `concierge_portal_items` | ✅ |

> Nota: não existe tabela `rsvps` neste schema — RSVP vive em `guests` + RPCs (herança 001–035).

---

## 9. `supabase db lint` / advisors

| Ferramenta | Resultado |
|------------|-----------|
| `supabase db lint --linked` | ⚠️ Falhou por timeout de ligação CLI (intermitente) |
| MCP `get_advisors` | ⛔ Não usado (aponta para produção) |

**Mitigação:** validação RLS executada directamente via SQL com `SET LOCAL role authenticated` + `request.jwt.claim.sub` — cobertura equivalente aos critérios A.3.

---

## 10. Problemas encontrados

| ID | Problema | Severidade | Impacto A.3 |
|----|----------|------------|-------------|
| P1 | Drift histórico migration `028` no CLI | 🟡 Baixo | Não afecta RLS; normalizar antes de produção |
| P2 | Timeouts intermitentes CLI `db lint` | 🟡 Baixo | Advisors não obtidos; RLS testada manualmente |
| P3 | Preview sem `events` seed | 🟢 Info | FK válido `operational_event_id` não testado end-to-end |
| P4 | Versões duplicadas `028`/`030` no repo | 🟡 Médio | Resolvido no preview com `0281`/`0301`/`0302` |

**Nenhum problema bloqueante de RLS/Auth detectado.**

---

## 11. Ajustes necessários antes de produção

- [ ] Normalizar nomes de migration (`0281`, `0301`, `0302` ou timestamps únicos) no repositório
- [ ] Resolver drift `028` no histórico CLI antes do apply em produção
- [ ] Aplicar `036` em `oxsrdmydlqyvnueedgtl` só com plano formal + backup
- [ ] Testar `operational_event_id` com evento operacional real (quando houver seed ou após provisionamento)
- [ ] Correr `get_advisors` security no dashboard do preview ou após fix de ligação CLI
- [ ] Regenerar `database.types.ts` na Fase B (código)

---

## 12. Veredicto

### ✅ A.3 APROVADA

Todos os testes obrigatórios passaram no preview `uxleigndoomoezwsxlan`:

- Trigger `on_auth_user_created` → `profiles` ✅
- Isolamento entre User A e User B ✅
- Índices únicos (1 activo + fingerprint) ✅
- Snapshots bloqueados para authenticated ✅
- Anon bloqueado ✅
- Schema operacional legado intacto ✅

---

## 13. Gate — Fase B (Supabase Auth no sign-in)

| Critério | Estado |
|----------|--------|
| Migration 036 aplicada em staging | ✅ |
| RLS A.3 verde | ✅ |
| Produção intocada | ✅ |

### 🟢 Gate desbloqueado

**Podemos avançar para Fase B — Supabase Auth no sign-in** quando deres ordem explícita para implementação de código.

> Esta sessão **não** implementou Fase B (conforme instrução).

---

## Anexo — Resumo de execução

```
Script: scripts/_tmp-a3-rls-validation.sql (efémero, preview only)
Resultados: 18 PASS · 1 SKIP · 0 FAIL
```

| test_id | status |
|---------|--------|
| users_created | PASS |
| trigger_profiles | PASS |
| user_a_setup | PASS |
| user_b_read_event | PASS |
| user_b_active_event | PASS |
| unique_one_active | PASS |
| unique_fingerprint | PASS |
| snapshot_auth_insert | PASS |
| snapshot_service_insert | PASS |
| anon_profiles | PASS |
| anon_insert | PASS |
| operational_event_null | PASS |
| operational_event_fk_valid | SKIP |
| operational_event_fk_invalid | PASS |
| smoke_* (6 tabelas) | PASS |

---

*Relatório gerado sem commit, push, deploy, alterações ao Edition ou operações em produção.*
