# Relatório Fase A.2 / A.3 — Migration `036_client_app_auth.sql`

**Data:** Julho 2026
**Estado:** ⛔ **APPLY NÃO EXECUTADO** — staging dedicado não confirmado
**Migration:** `supabase/migrations/036_client_app_auth.sql` (com ajustes A.1.1)

---

## 1. Projecto Supabase usado (MCP ligado)

| Campo | Valor |
|-------|-------|
| **Project ref** | `oxsrdmydlqyvnueedgtl` |
| **URL** | `https://oxsrdmydlqyvnueedgtl.supabase.co` |
| **Fonte** | MCP `user-supabase` + `.env.local` |

### ⚠️ Bloqueio de segurança

Não existe no repositório um **project ref Supabase de staging separado** (sem `SUPABASE_STAGING_URL`, branch activa, ou segundo `.env.staging`).

O único projecto configurado está alinhado com:
- `NEXT_PUBLIC_SITE_URL=https://www.haxrsignature.com` (produção)
- Dashboard admin com link directo para este ref
- Dados operacionais reais (`events`, `concierge_portal_items`, etc.)

**Decisão:** Não aplicar `036` neste projecto sem confirmação explícita de que **é staging** ou sem fornecer **outro project ref / branch** de staging.

---

## 2. Pré-apply — confirmações pedidas

| # | Pergunta | Resultado |
|---|----------|-----------|
| 1 | Project ref / URL staging | Só disponível: `oxsrdmydlqyvnueedgtl` |
| 2 | Alvo **não** é produção? | ❓ **Não confirmado** — único projecto = produção no `.env.local` |
| 3 | Apenas migration `036`? | ✅ Planeado (não executado) |
| 4 | Migrations `001–035` aplicadas? | ✅ Equivalente remoto (ver abaixo) |
| 5 | Backup/snapshot recente? | ❓ Não verificável via MCP — **ação manual recomendada** |
| 6 | Triggers em `auth.users`? | ✅ **Nenhum** trigger não-interno (sem conflito previsto) |

### Migrations remotas (MCP `list_migrations`)

Últimas aplicadas no projecto ligado:
- `post_event_report` (≈ 035)
- `concierge_portal` (≈ 028)
- `034_portal_premium_complete`, `commercial_admin_v2`, `event_contact_profiles`, etc.

### Estado actual da BD (pré-036)

| Objecto | Existe? |
|---------|---------|
| `public.events` | ✅ |
| `public.concierge_portal_items` | ✅ |
| `public.profiles` | ❌ |
| `public.client_events` | ❌ |
| `public.event_members` | ❌ |
| `public.event_onboarding_snapshots` | ❌ |
| Enum `event_type` | ✅ |
| Enums `client_event_*`, `app_user_role` | ❌ |
| `auth.users` count | **0** |
| Triggers `auth.users` | **0** |

**Conclusão pré-apply:** BD pronta para receber `036` do ponto de vista de dependências (`set_updated_at`, `event_type`, `events`). **Apply não realizado** por política staging vs produção.

---

## 3. Resultado da aplicação da migration

| Item | Estado |
|------|--------|
| `apply_migration` / SQL Editor | ⛔ **Não executado** |
| Erros de execução | N/A |

---

## 4. Tabelas criadas

N/A — migration não aplicada.

---

## 5. Resultado do backfill

N/A — migration não aplicada.

---

## 6. Resultado dos db advisors

N/A — executar após apply em staging real.

Comando previsto:
```
MCP get_advisors type=security
MCP get_advisors type=performance
```

---

## 7. Resultado dos testes RLS

N/A — requer apply + utilizadores Auth de teste.

### Plano de testes (executar após apply em staging confirmado)

| # | Teste | Método |
|---|-------|--------|
| 1 | Profile automático no sign-up | Criar user Auth → `SELECT * FROM profiles` |
| 2 | User A cria `client_event` + `event_member` | SQL ou API com JWT A |
| 3 | User A vê evento | `SELECT` com JWT A |
| 4 | User B não vê evento A | `SELECT` com JWT B → 0 rows |
| 5 | 2º evento `is_active=true` | `INSERT` → `unique_violation` |
| 6 | Fingerprint duplicado | `INSERT` → `unique_violation` |
| 7 | `operational_event_id` NULL | OK |
| 8 | `operational_event_id` UUID `events` | OK se FK válida |
| 9 | Snapshot INSERT JWT user | Falha (RLS) |
| 10 | Snapshot INSERT service role | OK |
| 11 | `active_client_event_id` próprio | OK |
| 12 | `active_client_event_id` alheio | Falha (policy UPDATE) |
| 13 | `anon` sem acesso | PostgREST 401/empty |
| 14 | Admin smoke | `/admin` login + listagem |
| 15 | Concierge smoke | `/app/concierge` ou items count |

---

## 8. Problemas encontrados

### P0 — Sem staging Supabase dedicado configurado

O ambiente disponível via MCP corresponde ao projecto de produção do site. Aplicar `036` violaria a instrução «não aplicar em produção».

### P1 — Backup não auditado

Não há evidência de snapshot recente antes do apply.

### P2 — `list_branches` MCP falhou

```
Project reference is missing when validating permissions
```

Branches Supabase não disponíveis via MCP nesta sessão — alternativa: criar branch no dashboard ou projecto staging separado.

---

## 9. Ajustes necessários antes de produção

(Já no draft 036 pós A.1.1 — aplicar quando staging aprovado)

- [ ] Policy `profiles_update_own` com validação `active_client_event_id` ✅ no draft
- [ ] `REVOKE ALL FROM anon` ✅ no draft
- [ ] Backfill `profiles` ✅ no draft
- [ ] Validar RLS em staging real
- [ ] Regenerar `database.types.ts` (Fase B+)
- [ ] Snapshot `owner_user_id` coerente com evento (API, opcional constraint v2)

---

## 10. Veredicto

| Critério | Estado |
|----------|--------|
| Draft SQL | ✅ Pronto |
| Apply staging | ⛔ **Bloqueado** — staging não identificado |
| Validação RLS | ⏳ Pendente apply |
| Gate Fase B | ⛔ **Não** — aguardar staging verde |

### Veredicto final

**Precisa correcção / confirmação operacional** antes de apply — não é problema no SQL, é **falta de alvo staging isolado**.

---

## 11. Gate Fase B — Supabase Auth

⛔ **Não avançar** até:
1. Apply `036` em staging confirmado
2. Todos os testes RLS (secção 7) verdes
3. `db advisors` sem alertas críticos

---

## Próximos passos recomendados

### Opção A — Projecto Supabase staging separado (recomendado)

1. Criar projecto Supabase «haxrsignature-staging»
2. Aplicar migrations `001–035` (ou restore snapshot)
3. Configurar MCP / `.env.staging` com novo ref
4. Re-executar Fase A.2 com este relatório como checklist

### Opção B — Supabase Branch

1. Dashboard → Branches → criar branch `client-app-auth`
2. Aplicar **apenas** `036` na branch (dados isolados)
3. Usar `project_ref` da branch para validação

### Opção C — Confirmação explícita

Se `oxsrdmydlqyvnueedgtl` **for** o ambiente de staging aceite para a equipa:
1. Confirmar por escrito
2. Criar backup manual no dashboard
3. Re-executar prompt A.2 com confirmação

---

*Relatório gerado sem apply, sem commit, sem alterações ao código da app.*
