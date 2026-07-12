# Plano operacional — Apply migrations no preview `uxleigndoomoezwsxlan`

**Data:** Julho 2026
**Estado:** 📋 **PLANO APENAS** — nenhum apply executado
**Alvo:** `haxr-business-suite-preview` · ref `uxleigndoomoezwsxlan`
**Proibido:** `oxsrdmydlqyvnueedgtl` (produção)

---

## 0. Resumo executivo

| Item | Decisão |
|------|---------|
| Estratégia | Supabase CLI `db push --linked` em **duas fases** |
| Fase A | Migrations `001–035` (base vazia → schema Core completo) |
| Fase B | Migration `036_client_app_auth.sql` |
| Ferramenta | CLI local — **não** MCP `user-supabase` |
| Confirmação humana | Obrigatória antes de cada fase |

---

## 1. Pré-requisitos

- [ ] Supabase CLI instalado e autenticado (`npx supabase projects list` funciona)
- [ ] Acesso ao dashboard `uxleigndoomoezwsxlan` (read-only para verificação)
- [ ] Working directory: `c:\project-x\haxrsignature`
- [ ] **Não** ter `SUPABASE_DB_URL` de produção exportado na shell
- [ ] Confirmação escrita do operador (ver secção 8)

---

## 2. Confirmar que o CLI está linked ao preview

### 2.1 Verificar project ref local

```powershell
cd c:\project-x\haxrsignature
type supabase\.temp\project-ref
```

**Esperado:**
```
uxleigndoomoezwsxlan
```

**Se mostrar `oxsrdmydlqyvnueedgtl` → PARAR. Não continuar.**

### 2.2 Relink explícito (se necessário)

```powershell
cd c:\project-x\haxrsignature
npx supabase link --project-ref uxleigndoomoezwsxlan
```

Confirmar novamente com `type supabase\.temp\project-ref`.

### 2.3 Verificar via `projects list`

```powershell
npx supabase projects list
```

A linha `haxr-business-suite-preview` deve ter `"linked": true`.

### 2.4 Verificar estado remoto (deve estar vazio)

```powershell
npx supabase migration list --linked
```

**Esperado antes do apply:** coluna `remote` vazia para todas as migrations locais.

### 2.5 Verificação extra via SQL read-only

```powershell
npx supabase db query --linked "SELECT COUNT(*)::int AS public_tables FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';"
```

**Esperado:** `public_tables: 0` (ou muito baixo se Supabase interno).

---

## 3. Garantir que o MCP não será usado

| Ferramenta | Projecto | Acção |
|------------|----------|-------|
| MCP `user-supabase` → `get_project_url` | `oxsrdmydlqyvnueedgtl` | **Não usar** |
| MCP `execute_sql` | Produção | **Não usar** |
| MCP `apply_migration` | Produção | **Não usar** |
| Supabase CLI `--linked` | `uxleigndoomoezwsxlan` | **Usar** |

**Regra:** qualquer operação de DDL/DML remota nesta fase passa **exclusivamente** pelo CLI com `project-ref` verificado.

### Alternativa mais segura (opcional)

Em vez de `--linked`, usar connection string do preview via dashboard:

```powershell
# NÃO guardar no repo. Só na sessão ou GitHub secret futuro.
npx supabase migration list --db-url "$env:SUPABASE_PREVIEW_DB_URL"
npx supabase db push --db-url "$env:SUPABASE_PREVIEW_DB_URL"
```

Obter URI em: Dashboard → `uxleigndoomoezwsxlan` → Settings → Database → Connection string (URI).

---

## 4. Estratégia de apply — duas fases

### Porquê duas fases?

- Permite validar schema base (`events`, `concierge`, RLS legado) **antes** de `036`.
- Se `036` falhar, o rollback é mais simples (só reverter última migration).
- Alinha com gate A.3: validar base operacional + depois camada Auth.

### Risco conhecido — versões duplicadas

O folder `supabase/migrations/` contém **dois** ficheiros `028_*` e **dois** `030_*`:

- `028_commercial_admin_v2.sql` + `028_concierge_portal.sql`
- `030_sheet_sync_ledger.sql` + `030_portal_v2_approvals.sql`

Produção já tem estas migrations aplicadas. No preview vazio, o CLI deve aplicá-las em sequência. **Monitorizar** o output; se falhar por conflito de versão, usar `supabase migration repair` **apenas no preview** após investigação.

---

### Fase A — Apply `001–035`

#### Passo A.0 — Isolar temporariamente a migration 036

**Sem commit.** Operação local na sessão de apply:

```powershell
cd c:\project-x\haxrsignature
Move-Item supabase\migrations\036_client_app_auth.sql supabase\migrations\_pending_036_client_app_auth.sql
```

> O prefixo `_pending_` impede o CLI de a incluir no push.

#### Passo A.1 — Dry-run mental

```powershell
npx supabase migration list --linked
```

Confirmar: `036` **não** aparece na lista local.

#### Passo A.2 — Apply base

```powershell
npx supabase db push --linked
```

O CLI pede confirmação — rever que o host é `db.uxleigndoomoezwsxlan.supabase.co`.

#### Passo A.3 — Verificar pós-base

```powershell
npx supabase migration list --linked
```

**Esperado:** `remote` preenchido até `035` (e duplicados `028`/`030` conforme histórico).

```powershell
npx supabase db query --linked "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('events','guests','rsvps','concierge_portal_items') ORDER BY 1;"
```

**Esperado:** tabelas existem.

```powershell
npx supabase db query --linked "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('profiles','client_events','event_members','event_onboarding_snapshots');"
```

**Esperado:** **0 rows** (ainda não existe 036).

#### Passo A.4 — Smoke base (opcional mas recomendado)

```powershell
npx supabase db query --linked "SELECT COUNT(*)::int AS events FROM events; SELECT COUNT(*)::int AS auth_users FROM auth.users;"
```

**Esperado:** `events: 0`, `auth_users: 0` (preview vazio mas schema pronto).

---

### Fase B — Apply `036`

#### Passo B.0 — Restaurar ficheiro 036

```powershell
cd c:\project-x\haxrsignature
Move-Item supabase\migrations\_pending_036_client_app_auth.sql supabase\migrations\036_client_app_auth.sql
```

#### Passo B.1 — Confirmar link ainda é preview

```powershell
type supabase\.temp\project-ref
```

#### Passo B.2 — Apply 036

```powershell
npx supabase db push --linked
```

**Esperado:** aplica apenas a migration pendente `036`.

#### Passo B.3 — Verificar estrutura 036

```powershell
npx supabase db query --linked "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('profiles','client_events','event_members','event_onboarding_snapshots') ORDER BY 1;"
```

**Esperado:** 4 tabelas.

```powershell
npx supabase db query --linked "SELECT typname FROM pg_type WHERE typname IN ('client_event_member_role','client_event_status','app_user_role');"
```

**Esperado:** 3 enums.

```powershell
npx supabase db query --linked "SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('profiles','client_events','event_members','event_onboarding_snapshots');"
```

**Esperado:** `relrowsecurity = true` nas 4.

#### Passo B.4 — Advisors (CLI)

```powershell
npx supabase db lint --linked
```

Registar output. Corrigir alertas críticos antes de Fase B app.

---

## 5. Validar que produção NÃO foi tocada

### 5.1 Nunca correr push com link de produção

Se em qualquer momento `project-ref` foi `oxsrdmydlqyvnueedgtl`, **parar** e auditar.

### 5.2 Verificação indirecta (sem ligar CLI à produção)

Após apply no preview, confirmar no **dashboard** de produção (`oxsrdmydlqyvnueedgtl`):

- Table Editor → `profiles` / `client_events` → **não devem existir** (pré-036 produção)
- Migration history → **não** deve aparecer `036` até decisão futura de produção

> Esta verificação é manual no dashboard — **não** usar MCP automatizado se aponta para produção sem intenção.

### 5.3 Verificação no preview (positiva)

```powershell
npx supabase migration list --linked
```

**Esperado:** `036` com `remote` preenchido; todas as anteriores também.

---

## 6. Testes RLS / Auth (Fase A.3)

Executar **após** Fase B (036 aplicada). Detalhe completo em `docs/036_CLIENT_APP_AUTH_REVIEW.md` secção 7.

### 6.1 Criar utilizadores de teste

No dashboard `uxleigndoomoezwsxlan` → Authentication → Users:

| User | Email exemplo | Propósito |
|------|---------------|-----------|
| User A | `staging-a@haxrsignature.test` | Owner de evento |
| User B | `staging-b@haxrsignature.test` | Isolamento RLS |

> Usar domínio de teste; não emails de clientes reais.

### 6.2 Checklist RLS (resumo)

| # | Teste | Esperado |
|---|-------|----------|
| 1 | Sign-up / create user A | `profiles` row auto-criada (trigger) |
| 2 | Backfill users pré-036 | N/A se users criados após 036 |
| 3 | User A cria `client_event` + `event_member` | OK |
| 4 | User A SELECT `client_events` | Vê só os seus |
| 5 | User B SELECT eventos de A | 0 rows |
| 6 | Segundo `client_events` activo mesmo owner | `unique_violation` |
| 7 | Fingerprint duplicado | `unique_violation` |
| 8 | `operational_event_id` NULL | OK |
| 9 | Snapshot INSERT com JWT user | Falha (RLS) |
| 10 | Snapshot INSERT service role | OK |
| 11 | `active_client_event_id` evento alheio | Falha UPDATE (policy A.1.1) |
| 12 | `anon` sem policy | Sem acesso |

### 6.3 Queries úteis (service role / SQL editor preview)

Ver `docs/036_CLIENT_APP_AUTH_REVIEW.md` §7.4–7.9.

### 6.4 Teste via API REST (opcional)

Usar URL `https://uxleigndoomoezwsxlan.supabase.co` + anon key **do preview** (dashboard → Settings → API).

**Não** usar keys de `.env.local` (são de produção).

### 6.5 Critérios de aprovação A.3

Todos os itens da secção 8 de `036_CLIENT_APP_AUTH_REVIEW.md` verdes → **gate Fase B desbloqueado**.

---

## 7. Rollback / reset do preview

O preview **não tem dados importantes**. Opções por ordem de preferência:

### Opção 1 — `db reset` no preview (recomendado se schema corrompido)

```powershell
# TRIPLE-CHECK project-ref ANTES
type supabase\.temp\project-ref
# DEVE ser uxleigndoomoezwsxlan

npx supabase db reset --linked
```

Reaplica migrations locais do zero (inclui 036 se ficheiro estiver no folder).

### Opção 2 — Reverter só 036

Se base 001–035 está boa mas 036 falhou:

```powershell
# Manual no SQL editor do PREVIEW apenas:
# DROP objetos criados por 036 na ordem inversa (tabelas → tipos → funções → triggers)
# Depois:
npx supabase migration repair --linked 036 --status reverted
```

> Usar só em `uxleigndoomoezwsxlan`. Documentar SQL exacto se necessário.

### Opção 3 — Recriar projecto preview

Último recurso: apagar `haxr-business-suite-preview` no dashboard e criar novo — **não recomendado** (muda ref).

### ⛔ Nunca

- `db reset` com `project-ref = oxsrdmydlqyvnueedgtl`
- `DROP SCHEMA public CASCADE` em produção
- `migration repair` em produção sem plano formal

---

## 8. Confirmação humana obrigatória

**Não executar apply sem mensagem explícita do operador:**

```
CONFIRMO: aplicar migrations no preview uxleigndoomoezwsxlan.
NÃO aplicar em oxsrdmydlqyvnueedgtl.
```

Variantes aceites:

- Confirmação para **Fase A apenas** (001–035)
- Confirmação para **Fase A + B** (001–036)

Sem esta confirmação → **parar no plano**.

---

## 9. Comandos exactos — sequência recomendada

### Sessão completa (após confirmação humana)

```powershell
cd c:\project-x\haxrsignature

# ── Guard rails ──
type supabase\.temp\project-ref
# STOP se não for uxleigndoomoezwsxlan

# ── Fase A: base 001-035 ──
Move-Item supabase\migrations\036_client_app_auth.sql supabase\migrations\_pending_036_client_app_auth.sql
npx supabase migration list --linked
npx supabase db push --linked
npx supabase db query --linked "SELECT COUNT(*)::int AS n FROM information_schema.tables WHERE table_schema='public' AND table_name='events';"

# ── Fase B: 036 ──
Move-Item supabase\migrations\_pending_036_client_app_auth.sql supabase\migrations\036_client_app_auth.sql
type supabase\.temp\project-ref
npx supabase db push --linked
npx supabase db query --linked "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('profiles','client_events','event_members','event_onboarding_snapshots');"

# ── Pós-apply ──
npx supabase migration list --linked
npx supabase db lint --linked
```

---

## 10. O que fazer depois do apply verde

| Passo | Acção |
|-------|-------|
| 1 | Executar checklist RLS (secção 6) |
| 2 | Registar resultados em `docs/036_STAGING_VALIDATION_REPORT.md` (actualizar secções 3–7) |
| 3 | Gate Fase B — Supabase Auth no sign-in |
| 4 | **Não** alterar Edition |
| 5 | **Não** aplicar em produção sem decisão separada |

---

## 11. O que NÃO fazer nesta fase

- ❌ Commit / push / deploy
- ❌ Alterar `projecto_haxrsignature`
- ❌ Configurar `.env.local` do Edition
- ❌ Usar MCP `user-supabase` para apply
- ❌ Aplicar em `oxsrdmydlqyvnueedgtl`
- ❌ Avançar Fase B antes de A.3 verde

---

## Estado de execução (Fase A.4)

> ✅ **Executado.** Fase A (`001–035`) e apply da `036` concluídos no preview `uxleigndoomoezwsxlan` via `supabase db push --linked`.
>
> Durante o push surgiram colisões de versão (`028_commercial_admin_v2` + `028_concierge_portal`; dois ficheiros `030_*`). Resolvido renomeando os ficheiros em conflito para prefixos únicos que preservam a ordem: `0281_concierge_portal.sql`, `0301_portal_v2_approvals.sql`, `0302_sheet_sync_ledger.sql`. Usado `supabase migration repair --linked --status reverted 028` para realinhar o histórico remoto antes de continuar.
>
> Validação RLS/Auth: `docs/036_RLS_AUTH_VALIDATION_REPORT.md`. Gate: `docs/PHASE_B_AUTH_GATE.md`.

---

*Plano operacional — nenhum apply foi executado na criação deste documento.*
