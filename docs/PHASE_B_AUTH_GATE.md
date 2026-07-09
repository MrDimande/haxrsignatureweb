# Gate Fase B — Supabase Auth no sign-in

**Data:** Julho 2026  
**Estado:** 🟢 **Gate desbloqueado — apenas local/preview**  
**Fecho técnico:** Fase A.4

---

## 1. Estado da migration 036 no preview

| Item | Estado |
|------|--------|
| Projecto preview | `uxleigndoomoezwsxlan` (`https://uxleigndoomoezwsxlan.supabase.co`) |
| `036_client_app_auth.sql` | ✅ Aplicada + registada em `schema_migrations` |
| Tabelas | `profiles`, `client_events`, `event_members`, `event_onboarding_snapshots` |
| Enums | `client_event_member_role`, `client_event_status`, `app_user_role` |
| Trigger | `on_auth_user_created` em `auth.users` |
| RLS | Activo nas 4 tabelas (`relrowsecurity = true`) |
| Policies | 10 policies (SELECT/INSERT/UPDATE conforme desenho) |

---

## 2. Resumo dos testes RLS/Auth (A.3)

**Resultado global: 18 PASS · 1 SKIP · 0 FAIL**

| Categoria | Resultado |
|-----------|-----------|
| Trigger → `profiles` automático (2 users) | ✅ |
| Isolamento User A vs User B | ✅ |
| `active_client_event_id` alheio bloqueado | ✅ |
| Índice único 1 evento activo/owner | ✅ |
| Índice único fingerprint | ✅ |
| Snapshot INSERT authenticated bloqueado | ✅ |
| Snapshot INSERT service role permitido | ✅ |
| Anon bloqueado (SELECT/INSERT) | ✅ |
| `operational_event_id` NULL / FK inválido | ✅ |
| `operational_event_id` FK válido | ⏭️ SKIP (sem seed `events` no preview) |
| Smoke tabelas operacionais (6) | ✅ |

Detalhe completo: `docs/036_RLS_AUTH_VALIDATION_REPORT.md`.

---

## 3. Project refs

| Ambiente | Project ref | URL | Papel |
|----------|-------------|-----|-------|
| **Preview / staging** | `uxleigndoomoezwsxlan` | `https://uxleigndoomoezwsxlan.supabase.co` | Validação técnica (036 aplicada) |
| **Produção** | `oxsrdmydlqyvnueedgtl` | `https://oxsrdmydlqyvnueedgtl.supabase.co` | Core + Edition RSVP |

---

## 4. Confirmação — produção intacta

| Verificação | Resultado |
|-------------|-----------|
| `036` aplicada em produção? | ❌ **Não** |
| Tabelas `profiles`/`client_events` em produção? | ❌ **Não existem** |
| MCP `user-supabase` usado para apply? | ❌ **Não** (aponta para produção) |
| Alguma operação em `oxsrdmydlqyvnueedgtl`? | ❌ **Nenhuma** |
| Edition (`edition.haxrsignature.com`) alterado? | ❌ **Não** |

Todas as operações da Fase A correram via Supabase CLI `--linked` ao preview `uxleigndoomoezwsxlan`.

---

## 5. Riscos restantes

| ID | Risco | Severidade | Nota |
|----|-------|------------|------|
| R1 | Migrations `025–036` nunca commitadas (só `001–024` no git) | 🟡 Médio | Baseline grande por rastrear — commit deve ser escopo controlado |
| R2 | Renomeações `0281`/`0301`/`0302` (versões duplicadas `028`/`030`) | 🟡 Médio | Necessárias para `db push`; ver §6 |
| R3 | `.env.vercel.core.preview` / `.env.vercel.core.prod` por rastrear e **não** no `.gitignore` | 🔴 Alto | Contêm segredos — **nunca** fazer `git add .` |
| R4 | `operational_event_id` FK válido não testado end-to-end | 🟢 Baixo | Sem seed `events` no preview |
| R5 | `db lint`/advisors não obtidos (timeout CLI) | 🟢 Baixo | RLS validada por SQL directo |
| R6 | Ajustes pré-produção da revisão A.1 | 🟡 Médio | Já no draft SQL; validar antes de produção |

---

## 6. Decisão

### 🟢 Fase B desbloqueada — **apenas local/preview**

Pode iniciar-se a implementação de Supabase Auth no `/sign-in` contra:
- **Local:** Supabase CLI local (`supabase start`), ou
- **Preview:** `uxleigndoomoezwsxlan` (schema 036 já presente)

### Regra de produção

> **Não aplicar `036` em `oxsrdmydlqyvnueedgtl` sem um plano de produção separado**, com:
> 1. Backup/snapshot manual
> 2. Confirmação do histórico de migrations em produção (evitar colisão de versões)
> 3. Ajustes pré-produção da revisão A.1 confirmados
> 4. Janela de deploy acordada

---

## 7. Ordem segura das próximas fases

| Fase | Âmbito | Estado |
|------|--------|--------|
| **A.4** | Fecho técnico + gate (este documento) | ✅ Em curso |
| **B.1** | Supabase Auth no `/sign-in` | ⏳ Desbloqueada (local/preview) |
| **B.2** | Middleware `/app/*` (proteção de rotas) | ⏳ |
| **B.3** | Sessão SSR (`@supabase/ssr`) + profile | ⏳ |
| **C** | `POST /api/events` (criar evento real) | ⏳ |
| **D** | Sync `localStorage` → BD | ⏳ |
| **E** | Dashboard por `eventId` real | ⏳ |

Auth real e proteção de `/app/*` **antes** de criar eventos via API.

---

*Documento de decisão — sem implementação de Auth, sem commit, sem deploy nesta fase.*
