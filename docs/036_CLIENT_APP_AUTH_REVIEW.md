# Revisão estática — Migration `036_client_app_auth.sql`

**Fase:** A.1 — Revisão antes de aplicar em staging
**Ficheiro revisto:** `supabase/migrations/036_client_app_auth.sql`
**Referências:** `docs/ONBOARDING_EVENT_CREATION_SPEC.md`, migrations `001`–`035`
**Data:** Julho 2026
**Estado:** Revisão estática concluída — **sem apply, sem alterações ao SQL**

---

## 1. Veredicto

### ✅ **Aprovada para staging com ajustes menores recomendados (não bloqueantes)**

A migration está **bem estruturada**, alinhada com a spec, e **segura para aplicar em staging** após leitura dos ajustes abaixo. Não foram encontrados problemas bloqueantes que impeçam o apply em ambiente de teste.

| Área | Avaliação |
|------|-----------|
| Conflitos com migrations anteriores | ✅ Sem conflito de nomes |
| Separação `client_events` / `events` | ✅ Correcta |
| RLS geral | ✅ Conservadora; não permissiva |
| Funções `SECURITY DEFINER` | ✅ `search_path` correcto; recursão mitigada |
| Trigger `auth.users` | ✅ Padrão Supabase; validar em staging |
| Índices parciais | ✅ Correctos para MVP |
| Snapshots sem INSERT | ✅ Intencional e correcto |
| Transacção API futura | ⚠️ Exige `service_role` para snapshot |
| Ajustes pré-produção | ⚠️ 3 recomendações (ver secção 3) |

**Não aplicar em produção** até completar Fase A.2 + A.3 (validação RLS em staging).

---

## 2. Problemas encontrados

### 2.1 🟡 Médio — `profiles.active_client_event_id` sem validação na policy UPDATE

**O quê:** A policy `profiles_update_own` permite ao utilizador actualizar `active_client_event_id` para **qualquer UUID** que exista em `client_events`, desde que a FK seja válida — **sem verificar** que o utilizador é owner ou membro desse evento.

**Impacto:** Um utilizador autenticado poderia apontar o seu perfil para o `id` de um evento alheio (se conhecer o UUID). A UI poderia mostrar referência incorrecta. A API futura **deve** validar membership server-side independentemente, mas a BD não reforça integridade de autorização neste campo.

**Bloqueante para staging?** Não — mas corrigir antes de produção.

---

### 2.2 🟡 Médio — Sem backfill de `profiles` para utilizadores Auth existentes

**O quê:** O trigger `on_auth_user_created` só actua em **novos** registos em `auth.users`. Utilizadores já existentes em staging/produção ficam sem `profiles`.

**Impacto:** Após apply, utilizadores de teste criados antes da migration não terão profile até insert manual ou re-registo.

**Bloqueante para staging?** Não — incluir passo de backfill no checklist de staging.

---

### 2.3 🟡 Médio — `event_onboarding_snapshots.owner_user_id` não validado contra `client_events.owner_user_id`

**O quê:** Não há constraint que garanta `snapshots.owner_user_id = client_events.owner_user_id` para o mesmo `client_event_id`.

**Impacto:** API com bug poderia gravar snapshot com owner inconsistente. RLS de SELECT usa `owner_user_id` do snapshot, não do evento.

**Bloqueante para staging?** Não — validar na camada API; constraint opcional em migration futura.

---

### 2.4 🟢 Baixo — Sem `REVOKE` explícito para role `anon`

**O quê:** A migration faz `GRANT ... TO authenticated` mas não revoga acesso `anon` às novas tabelas.

**Impacto:** Dependendo das **Data API settings** do projecto Supabase, tabelas novas em `public` podem ficar acessíveis a `anon` sem policies (RLS activo = deny por omissão, mas grants podem expor metadados). O projecto actual não define `REVOKE` sistemático em migrations antigas.

**Bloqueante para staging?** Não — verificar advisors após apply; recomendar `REVOKE ALL ... FROM anon` antes de produção.

---

### 2.5 🟢 Baixo — `event_members_insert_by_owner` com condição redundante

**O quê:** A policy INSERT combina:
- `is_client_event_owner(client_event_id)` **OU**
- `user_id = auth.uid() AND EXISTS (client_events owner match)`

A segunda condição é subconjunto da primeira para o caso bootstrap (owner insere a si próprio). A primeira condição já permite o owner inserir **qualquer** `user_id` (convites futuros).

**Impacto:** Nenhum de segurança; apenas redundância legível.

---

### 2.6 🟢 Baixo — Dupla semântica `is_active` vs `status = 'active'`

**O quê:** `client_events` tem `is_active BOOLEAN` e `status client_event_status` com valor `'active'`.

**Impacto:** Risco de inconsistência lógica na API (ex. `is_active=true` + `status=archived`). Índice único usa só `is_active`.

**Bloqueante?** Não — documentar regra na API: arquivar = `is_active=false` + `status='archived'`.

---

### 2.7 🟢 Informativo — `CREATE TABLE IF NOT EXISTS` e re-runs

**O quê:** Re-aplicar a migration com tabelas já existentes mas schema divergente não actualiza colunas — só policies/triggers são recriados.

**Impacto:** Típico de migrations idempotentes; não é problema no primeiro apply limpo.

---

## 3. Ajustes recomendados

> **Nota:** Não implementados nesta fase. Apresentados para decisão antes de produção ou em `036b` patch.

### 3.1 Recomendado antes de produção — Policy UPDATE em `profiles`

```sql
-- Adicionar validação em profiles_update_own WITH CHECK:
AND (
  active_client_event_id IS NULL
  OR public.is_client_event_owner(active_client_event_id)
  OR public.is_client_event_member(active_client_event_id)
)
```

### 3.2 Recomendado antes de produção — Revogar `anon`

```sql
REVOKE ALL ON profiles FROM anon;
REVOKE ALL ON client_events FROM anon;
REVOKE ALL ON event_members FROM anon;
REVOKE ALL ON event_onboarding_snapshots FROM anon;
```

### 3.3 Recomendado no checklist de staging — Backfill profiles

```sql
INSERT INTO public.profiles (id)
SELECT id FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);
```

### 3.4 Opcional (v2) — Constraint snapshot ↔ evento

```sql
-- Trigger ou CHECK via função que valida owner_user_id coerente com client_events
```

### 3.5 Opcional (v2) — `FORCE ROW LEVEL SECURITY`

```sql
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;
-- repetir para client_events, event_members, event_onboarding_snapshots
```

---

## 4. Análise por ponto de verificação

### 4.1 Segurança para staging

| Item | Resultado |
|------|-----------|
| RLS activo nas 4 tabelas | ✅ |
| Sem políticas DELETE para clientes | ✅ |
| Snapshots: só SELECT para `authenticated` | ✅ |
| `service_role` só no servidor (by design) | ✅ |
| Não altera Admin / Concierge | ✅ |

**Conclusão:** Segura para staging.

---

### 4.2 Conflitos com migrations anteriores

| Objecto | Conflito? | Notas |
|---------|-----------|-------|
| `profiles` | ❌ Não | Não existe; distinto de `clients` e `event_contact_profiles` |
| `client_events` | ❌ Não | Distinto de `events` |
| `event_members` | ❌ Não | Novo |
| `event_onboarding_snapshots` | ❌ Não | Novo |
| `event_type` enum | ❌ Não | Reutiliza `002_business_v2.sql` |
| `set_updated_at()` | ❌ Não | Reutiliza `001_admin_schema.sql` |
| `events(id)` FK | ❌ Não | Tabela existe desde `006` |
| Trigger `auth.users` | ⚠️ Verificar | Pode substituir trigger homónimo se existir no projecto |

**Numeração:** `036` segue `035_post_event_report.sql` — ordem correcta.

---

### 4.3 Enums

| Enum | Conflito? |
|------|-----------|
| `client_event_member_role` | ❌ Novo |
| `client_event_status` | ❌ Novo |
| `app_user_role` | ❌ Novo |

Blocos `DO $$ ... EXCEPTION duplicate_object` — idempotentes ✅

**Nota:** `app_user_role = 'admin'` é nome conceptualmente próximo do admin HMAC — documentado na spec; não é conflito SQL.

---

### 4.4 `profiles` vs tabelas existentes

| Tabela existente | Relação |
|------------------|---------|
| `clients` | Comercial/admin — **sem FK**; separação correcta |
| `event_contact_profiles` | Convidados por `event_id` operacional — **sem relação** |
| `auth.users` | FK 1:1 — padrão Supabase |

---

### 4.5 Separação `client_events` / `events` operacional

```
auth.users
    └── client_events (app casal / onboarding)
            ├── operational_event_id → events(id)  [OPCIONAL, nullable]
            ├── event_members
            └── event_onboarding_snapshots

events (operacional)
    ├── business_id → businesses
    ├── guests, seats, sheets...
    └── RLS: deny all (sem policies) — inalterado
```

- `client_events` **não** altera `events`
- FK `operational_event_id` é **nullable** — onboarding funciona sem Admin ✅
- Ligação ao Admin é **opt-in** quando equipa provisionar seating/sheets

---

### 4.6 Foreign keys

| FK | Avaliação |
|----|-----------|
| `profiles.id → auth.users` CASCADE | ✅ |
| `profiles.active_client_event_id → client_events` SET NULL | ✅ |
| `client_events.owner_user_id → auth.users` RESTRICT | ✅ Impede apagar user com eventos |
| `client_events.operational_event_id → events` SET NULL | ✅ Opcional |
| `event_members → client_events` CASCADE | ✅ |
| `event_members.user_id → auth.users` CASCADE | ✅ |
| `snapshots → client_events, auth.users` CASCADE | ✅ |

Ordem de criação: `profiles` → `client_events` → FK circular resolvida com `ALTER` posterior ✅

---

### 4.7 CHECK constraints

| Constraint | Realista? |
|------------|-----------|
| `event_name` ≥ 2 chars (trim) | ✅ |
| `bride_name`, `groom_name` ≥ 1 | ✅ |
| `estimated_guests >= 0` | ✅ (0 permitido — edge case onboarding) |
| `budget_min/max` não-negativos + range | ✅ |
| `source IN (...)` | ✅ |
| `planner_role IN ('noiva','consultor')` | ✅ |
| `payload` JSON object | ✅ |
| `synced_from IN (...)` | ✅ |

---

### 4.8 Índices únicos parciais

#### `idx_client_events_one_active_per_owner`

```sql
UNIQUE (owner_user_id) WHERE is_active = true
```

| Cenário | Comportamento esperado |
|---------|------------------------|
| 1º evento `is_active=true` | ✅ Insert OK |
| 2º evento `is_active=true` mesmo owner | ❌ Unique violation — **correcto MVP** |
| Arquivar (`is_active=false`) + novo activo | ✅ Permitido |
| Membro (não owner) de múltiplos eventos | ✅ Índice só aplica a `owner_user_id` |

#### `idx_client_events_owner_fingerprint`

```sql
UNIQUE (owner_user_id, onboarding_fingerprint)
WHERE onboarding_fingerprint IS NOT NULL AND is_active = true
```

| Cenário | Comportamento |
|---------|---------------|
| Mesmo fingerprint, evento activo | ❌ Duplicate — idempotência ✅ |
| Fingerprint após arquivar + novo activo | ✅ Permitido (parcial exclui inactivos) |
| `onboarding_fingerprint` NULL | ✅ Fora do índice |

#### `idx_onboarding_snapshots_idempotency_key`

```sql
UNIQUE (owner_user_id, idempotency_key) WHERE idempotency_key IS NOT NULL
```

✅ Correcto para replay de `Idempotency-Key`.

**Nota:** `UNIQUE (owner_user_id, local_fingerprint)` na tabela snapshots é **global** (não parcial) — fingerprint reutilizado após arquivar evento devolve conflito. **Correcto** para sync one-time.

---

### 4.9 RLS — permissividade

| Tabela | Avaliação |
|--------|-----------|
| `profiles` | ✅ Só próprio registo |
| `client_events` SELECT | ✅ Owner OU membro |
| `client_events` INSERT | ✅ Só `owner_user_id = auth.uid()` |
| `client_events` UPDATE | ✅ Só owner; sem DELETE |
| `event_members` SELECT | ✅ Próprio OU co-membro |
| `event_members` INSERT | ✅ Owner do evento (permite convites futuros) |
| `snapshots` | ✅ SELECT owner; sem INSERT authenticated |

**Não há políticas `USING (true)` nem `TO authenticated` sem predicado.** ✅

**Gap conhecido:** `profiles.active_client_event_id` (secção 2.1).

---

### 4.10 Funções `SECURITY DEFINER`

| Função | `search_path` | `auth.uid()` | GRANT |
|--------|---------------|--------------|-------|
| `is_client_event_owner` | `public` ✅ | Usado ✅ | `authenticated` only ✅ |
| `is_client_event_member` | `public` ✅ | Usado ✅ | `authenticated` only ✅ |
| `handle_new_user` | `public` ✅ | N/A | Trigger only ✅ |

`REVOKE ALL FROM PUBLIC` nas helpers ✅

**Risco DEFINER:** Funções leem tabelas contornando RLS mas **ainda filtram por `auth.uid()`** — padrão aceite para helpers RLS Supabase.

---

### 4.11 Recursão em `event_members` policies

```
event_members SELECT
  → is_client_event_member()  [SECURITY DEFINER → bypass RLS em event_members]
  → sem loop ✅

client_events SELECT
  → is_client_event_member()  [DEFINER → bypass]
  → sem loop ✅

event_members INSERT
  → is_client_event_owner()   [DEFINER → lê client_events sem RLS]
  → EXISTS client_events      [policy context; owner pode SELECT próprio evento]
  → sem loop ✅
```

**Conclusão:** Recursão **mitigada correctamente**.

---

### 4.12 Trigger `auth.users` (Supabase)

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

| Aspecto | Avaliação |
|---------|-----------|
| Padrão Supabase oficial | ✅ |
| `SECURITY DEFINER` + `search_path` | ✅ |
| `ON CONFLICT DO NOTHING` | ✅ Idempotente |
| `DROP TRIGGER IF EXISTS` antes de CREATE | ✅ |
| Copia `raw_user_meta_data` só para display | ✅ Não usa em RLS |

**Validar em staging:**
- Permissões de migration no schema `auth`
- Se já existe trigger com lógica diferente (dashboard Supabase) — este **substitui**

---

### 4.13 Snapshots sem INSERT para `authenticated`

| Actor | INSERT snapshot |
|-------|-----------------|
| `authenticated` (browser) | ❌ Negado (sem policy) |
| `service_role` (API server) | ✅ Bypass RLS |

**Faz sentido:** snapshot é escrita privilegiada pós-validação server-side. ✅

**Implicação:** Fluxo de sync **não pode** ser 100% client-side directo ao PostgREST — API route obrigatória.

---

### 4.14 Transacção API futura

Fluxo mínimo `POST /api/onboarding/sync` (recomendado com `service_role` após `getUser()`):

```
BEGIN;
  1. INSERT client_events (... owner_user_id = session.user.id)
  2. INSERT event_members (client_event_id, user_id, role='owner')
  3. INSERT event_onboarding_snapshots (...)  -- requer service_role
  4. UPDATE profiles SET active_client_event_id, onboarding_synced_at, phone, planner_role
COMMIT;
```

| Passo | `authenticated` client directo | `service_role` API |
|-------|----------------------------------|---------------------|
| 1. client_events | ✅ | ✅ |
| 2. event_members | ✅ (owner bootstrap) | ✅ |
| 3. snapshots | ❌ | ✅ |
| 4. profiles | ✅ (próprio) | ✅ |

**Conclusão:** Transacção única **viável** com `createAdminClient()` + validação `user.id === owner_user_id` antes do COMMIT. ✅

Alternativa sem service role: adicionar policy INSERT snapshot restrita — **não recomendado** (mais superfície de ataque).

---

## 5. Riscos

| Risco | Severidade | Mitigação |
|-------|------------|-----------|
| Trigger substitui lógica Auth existente | Média | Inspeccionar triggers em staging antes/depois |
| Users sem profile após apply | Média | Backfill SQL no checklist |
| `active_client_event_id` sem CHECK | Média | Ajuste 3.1 antes de produção |
| 1 evento activo bloqueia UX multi-evento | Baixa | MVP intencional; arquivar primeiro |
| `app_user_role.admin` vs admin cookie | Baixa | Documentação; não misturar sistemas |
| Grants `anon` implícitos | Baixa | Advisors + REVOKE 3.2 |
| API sem transacção atómica | Alta (futuro) | Implementar BEGIN/COMMIT na Fase C |
| `operational_event_id` aponta para evento errado | Baixa | Só equipa HAXR escreve; Admin separado |

---

## 6. Checklist para aplicar em staging (Fase A.2)

### Pré-apply

- [ ] Confirmar que staging está em migration `035` ou superior
- [ ] Backup / snapshot da BD staging
- [ ] Verificar triggers existentes em `auth.users`:
  ```sql
  SELECT tgname FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'auth' AND c.relname = 'users';
  ```
- [ ] Confirmar que `set_updated_at()` existe
- [ ] Confirmar que enum `event_type` existe

### Apply

- [ ] Executar `036_client_app_auth.sql` (CLI ou SQL Editor staging **apenas**)
- [ ] Verificar sem erros no output
- [ ] Correr `supabase db advisors` (security + performance)

### Pós-apply imediato

- [ ] Backfill profiles (secção 3.3)
- [ ] Regenerar `database.types.ts` (quando código for actualizado na Fase B+)
- [ ] Confirmar RLS activo:
  ```sql
  SELECT relname, relrowsecurity FROM pg_class
  WHERE relname IN ('profiles','client_events','event_members','event_onboarding_snapshots');
  ```

---

## 7. Queries de validação pós-apply (Fase A.3)

### 7.1 Estrutura

```sql
-- Tabelas criadas
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles','client_events','event_members','event_onboarding_snapshots');

-- Enums criados
SELECT typname FROM pg_type
WHERE typname IN ('client_event_member_role','client_event_status','app_user_role');
```

### 7.2 Trigger profile automático

```sql
-- Após criar user teste via Supabase Auth Dashboard:
SELECT p.id, p.full_name, p.app_role, u.email
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'teste-staging@exemplo.com';
```

### 7.3 Isolamento RLS (users A e B)

Executar com JWT de cada user (Supabase SQL com `request.jwt.claims` ou client SDK):

```sql
-- Como user A: deve ver só seus eventos
SELECT id, event_name, owner_user_id FROM client_events;

-- Como user B: não deve ver eventos de A
SELECT COUNT(*) FROM client_events WHERE owner_user_id = '<uuid_user_a>';
-- Esperado: 0
```

### 7.4 Criar evento + member (simular API)

Com service role ou user A autenticado:

```sql
-- 1. Insert evento
INSERT INTO client_events (owner_user_id, slug, event_name, bride_name, groom_name, event_location, estimated_guests)
VALUES ('<uuid_a>', 'ana-carlos', 'Ana & Carlos', 'Ana', 'Carlos', 'Maputo', 150)
RETURNING id;

-- 2. Insert member owner
INSERT INTO event_members (client_event_id, user_id, role)
VALUES ('<event_id>', '<uuid_a>', 'owner');

-- 3. Snapshot (service_role)
INSERT INTO event_onboarding_snapshots (client_event_id, owner_user_id, local_fingerprint, payload)
VALUES ('<event_id>', '<uuid_a>', 'sha256:test', '{"brideName":"Ana"}'::jsonb);

-- 4. Update profile
UPDATE profiles SET active_client_event_id = '<event_id>', onboarding_synced_at = now()
WHERE id = '<uuid_a>';
```

### 7.5 Bloqueio segundo evento activo

```sql
-- Deve falhar com unique_violation:
INSERT INTO client_events (owner_user_id, slug, event_name, bride_name, groom_name, is_active)
VALUES ('<uuid_a>', 'outro-evento', 'Outro', 'X', 'Y', true);
```

### 7.6 Fingerprint duplicado

```sql
-- Deve falhar se mesmo owner + fingerprint + is_active=true:
INSERT INTO client_events (owner_user_id, slug, event_name, bride_name, groom_name, onboarding_fingerprint, is_active)
VALUES ('<uuid_a>', 'dup', 'Dup', 'A', 'B', 'sha256:same', true);
```

### 7.7 `operational_event_id` null e válido

```sql
-- Null OK (default onboarding)
SELECT operational_event_id FROM client_events WHERE id = '<event_id>';

-- Válido se UUID existir em events
UPDATE client_events SET operational_event_id = (SELECT id FROM events LIMIT 1)
WHERE id = '<event_id>';

-- Inválido deve falhar FK
UPDATE client_events SET operational_event_id = '00000000-0000-0000-0000-000000000000'
WHERE id = '<event_id>';
```

### 7.8 Snapshot bloqueado para authenticated

Via PostgREST com anon key + user JWT (não service role):

```
POST /rest/v1/event_onboarding_snapshots
→ Esperado: 403 ou RLS violation
```

### 7.9 Funções helper

```sql
SELECT public.is_client_event_owner('<event_id>');  -- true como owner
SELECT public.is_client_event_member('<event_id>'); -- true como member
```

---

## 8. Critérios para considerar a migration aprovada

### Staging (Fase A completa)

- [ ] Migration aplicada sem erros
- [ ] `supabase db advisors` sem alertas críticos de RLS
- [ ] Novo user Auth → `profiles` criado automaticamente
- [ ] Backfill executado para users pré-existentes
- [ ] User A cria `client_event` + `event_member` owner
- [ ] User A vê o seu evento; User B **não** vê
- [ ] Segundo evento activo para mesmo owner → **bloqueado**
- [ ] Fingerprint duplicado → **bloqueado**
- [ ] `operational_event_id` NULL aceite; UUID válido de `events` aceite
- [ ] Snapshot INSERT falha com JWT user; sucesso com service role
- [ ] Admin (`/admin/*`) e Concierge inalterados (smoke test rápido)

### Produção (futuro — após Fase B+)

- [ ] Ajustes 3.1 e 3.2 aplicados (ou em `036b`)
- [ ] API transaccional testada end-to-end
- [ ] `database.types.ts` actualizado
- [ ] Plano de rollback documentado

---

## 9. Decisão e próximos passos

| Fase | Acção | Estado |
|------|-------|--------|
| **A.1** | Revisão estática (este documento) | ✅ Concluída |
| **A.2** | Apply **apenas staging** | ⏳ Aguarda decisão humana |
| **A.3** | Queries de validação (secção 7) | ⏳ Após A.2 |
| **B** | Supabase Auth no sign-in | ⏳ Após A aprovada |

**Recomendação:** Prosseguir para **Fase A.2 (staging)**. A base está sólida o suficiente para sustentar auth real e dashboard por `eventId` — desde que a validação RLS da Fase A.3 confirme os 7 pontos sensíveis listados pelo stakeholder.

---

*Revisão estática — nenhuma alteração foi feita ao ficheiro SQL nem aplicada qualquer migration.*
