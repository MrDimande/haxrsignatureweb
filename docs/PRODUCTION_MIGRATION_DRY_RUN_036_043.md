# PR.4 — Ensaio migrations 036–043 (dry-run produção)

**Data:** 2026-07-11
**Branch:** `rebuild-haxr-platform`
**PR:** #3 (Draft)
**Produção:** `oxsrdmydlqyvnueedgtl` — **não alterada**
**Preview:** `uxleigndoomoezwsxlan` — **não usado como clone** (já contém 036–043)

---

## 1. Resumo executivo

| Item | Resultado |
|------|-----------|
| Clone isolado criado | ❌ **Bloqueado por infraestrutura** |
| Estado pré-036 confirmado (produção read-only) | ✅ |
| Apply 036–043 no clone | ⏸ Não executado (sem clone) |
| Rollback ensaiado no clone | ⏸ Não executado (sem clone) |
| Scripts de ensaio criados | ✅ `scripts/pr4/*` |
| Decisão | **GO com condições** |

---

## 2. Ambiente de ensaio tentado

### 2.1 Opção preferencial — Supabase Branch (produção)

```powershell
npx supabase branches create pr4-dry-run-036-043 `
  --project-ref oxsrdmydlqyvnueedgtl `
  --region eu-central-1 `
  --persistent `
  --yes
```

**Resultado:** `402 entitlement_required` — *Branching is supported only on the Pro plan or above*.

### 2.2 Alternativa — Docker + schema dump

| Ferramenta | Resultado |
|------------|-----------|
| Docker Desktop | ❌ Não instalado / pipe inacessível |
| `supabase db dump --linked` | ❌ Requer Docker (`LegacyDockerRunError`) |
| `supabase start` | ❌ Requer Docker |
| `psql` local | ❌ Não encontrado no PATH |

### 2.3 Alternativa — projecto temporário novo

Criação automática bloqueada pela política de segurança (escrita remota + credenciais).
**Procedimento manual recomendado** (fora desta sessão):

1. Criar projecto descartável na org HAXR (Dashboard).
2. Restaurar schema-only de produção (Dashboard backup ou `pg_dump` numa máquina com Docker).
3. Definir `PR4_DATABASE_URL` (pooler URI, **nunca commitar**).
4. Executar scripts PR.4 (secção 8).

### 2.4 CLI link

- Link temporário a produção testado **apenas para tentativa de dump** (read-only intent).
- Link **restaurado** para preview `uxleigndoomoezwsxlan` ao fim desta fase.
- **Nenhum** `db push`, repair ou SQL mutável em produção.

---

## 3. Backup e segurança

| Requisito | Estado |
|-----------|--------|
| Backup produção disponível | ⚠️ Assumido via Supabase Dashboard (não descarregado nesta sessão — Docker ausente) |
| Dump local | ❌ Não gerado (Docker) |
| `backups/` no `.gitignore` | ✅ Adicionado |
| Credenciais em scripts/docs | ✅ Nenhuma |
| Dados pessoais em relatório | ✅ Nenhum |

**Recomendação antes do apply real:** snapshot manual no Dashboard + testar restore num clone Pro/Docker.

---

## 4. Mapa de migrations (028 / 0281)

| Versão local | Nome local | Versão remota produção | Objectos em produção | Dry-run (clone) | Produção (futuro) |
|--------------|------------|------------------------|----------------------|-----------------|-------------------|
| `028` | `commercial_admin_v2` | `20260709084059` | colunas `documents.*`, `clients.portal_token` | **Skip** (já no schema) | **Skip** |
| `0281` | `concierge_portal` | `20260709112104` | `concierge_portal_*` | **Skip** | **Skip** |
| `036` | `client_app_auth` | — | ausente | **Apply** | **Apply** |
| `037` | `client_app_service_role_grants` | — | ausente | **Apply** | **Apply** |
| `038` | `provision_client_operational_event` | — | ausente | **Apply** | **Apply** |
| `039` | `client_event_guests_rpc` | — | ausente | **Apply** | **Apply** |
| `040` | `client_event_payments_rpc` | — | ausente | **Apply** | **Apply** |
| `041` | `client_event_vendors_rpc` | — | ausente | **Apply** | **Apply** |
| `042` | `client_event_checklist_rpc` | — | ausente | **Apply** | **Apply** |
| `043` | `client_event_documents_rpc` | — | ausente | **Apply** | **Apply** |

**Drift 028:** histórico/versão apenas — **não** reaplicar SQL 028/0281 no ensaio nem em produção.

---

## 5. Estado pré-036 confirmado (produção, read-only)

Query executada via MCP `execute_sql` (SELECT only):

| Check | Esperado | Produção |
|-------|----------|----------|
| `profiles` | ausente | ✅ false |
| `client_events` | ausente | ✅ false |
| `event_members` | ausente | ✅ false |
| `event_onboarding_snapshots` | ausente | ✅ false |
| `operational_event_id` col | ausente | ✅ false |
| RPCs 038–043 | 0 | ✅ 0 |
| `businesses.id = haxr-signature` | presente | ✅ true |
| Tabelas core (6) | presentes | ✅ 6 |
| `event_type` enum | presente | ✅ 6 valores |
| Migrations 036–043 no histórico | ausentes | ✅ confirmado (19 versões, max `concierge_portal`) |

---

## 6. Resultado apply 036–043 (clone)

**Não executado** — clone indisponível nesta sessão.

### Comportamento esperado (referência preview + scripts)

| Migration | Objectos | Risco apply | Rollback |
|-----------|----------|-------------|----------|
| 036 | tabelas app + RLS + trigger + backfill | médio | destrutivo se houver dados client |
| 037 | GRANT service_role | baixo | REVOKE |
| 038 | RPC provisioning | médio | DROP FUNCTION |
| 039–043 | RPCs leitura | baixo | DROP FUNCTION cada |

### Evidência secundária (preview, **não** substitui clone pré-036)

- RLS/Auth 036: `docs/036_RLS_AUTH_VALIDATION_REPORT.md` ✅
- Smokes E.4 preview: guests/payments/vendors/checklist/documents ✅
- Provisioning + RPCs validados em `uxleigndoomoezwsxlan`

---

## 7. Verificações pós-migration (scripts)

| Script | Quando |
|--------|--------|
| `scripts/pr4/verify-pre-migration.mjs` | Antes do apply |
| `scripts/pr4/apply-migration.mjs <036–043>` | Uma migration |
| `scripts/pr4/verify-post-036.mjs` | Após 036 |
| `scripts/pr4/verify-post-038.mjs` | Após 037–038 |
| `scripts/pr4/verify-rpcs.mjs` | Após 043 |
| `scripts/pr4/dry-run-migrations.mjs` | Orquestrador completo |
| `scripts/pr4/rollback-036-043.sql` | Rollback clone |
| `scripts/pr4/fixtures-minimal.sql` | Opcional (schema-only sem dados) |

**Guarda de segurança:** URLs com ref de produção bloqueadas unless `PR4_ALLOW_PRODUCTION=1` (não usar).

---

## 8. Procedimento operador (quando Docker ou Pro branch disponível)

```powershell
# 1. Obter URI do clone (env local, não commitar)
$env:PR4_DATABASE_URL = "<pooler-uri-do-clone>"

# 2. Pré-estado
node scripts/pr4/verify-pre-migration.mjs

# 3. (Opcional) fixtures se schema-only
# psql $env:PR4_DATABASE_URL -f scripts/pr4/fixtures-minimal.sql

# 4. Apply + verificações
node scripts/pr4/dry-run-migrations.mjs

# 5. ACL fictícia Users A/B — repetir matriz de docs/036_RLS_AUTH_VALIDATION_REPORT.md

# 6. App smokes contra clone
$env:NEXT_PUBLIC_SUPABASE_URL = "<url-clone>"
$env:API_BASE_URL = "http://localhost:3000"
# ... executar smokes E.1/E.4/C.1/D

# 7. Rollback ensaio
node scripts/pr4/dry-run-migrations.mjs --rollback
node scripts/pr4/verify-pre-migration.mjs
```

---

## 9. Testes aplicação (nesta sessão)

| Comando | Resultado |
|---------|-----------|
| `npm test` | 446/446 PASS |
| `npm run build` | PASS |
| Smokes contra clone | ⏸ N/A (sem clone) |

---

## 10. Rollback

| Camada | Estratégia |
|--------|------------|
| RPCs 043→038 | `DROP FUNCTION` (script incluído) |
| Grants 037 | `REVOKE` |
| 036 tabelas | **Destrutivo** — só no clone; em produção preferir rollback app + manter tabelas |
| Dados operacionais | **Nunca** apagar `events`/`guests`/`payments` legados |

Classificação DROP 036: **rollback destrutivo** — em produção real, desactivar rotas `/app/*` e reverter deploy antes de considerar DROP.

---

## 11. Problemas encontrados

| ID | Problema | Impacto |
|----|----------|---------|
| I1 | Branching Supabase requer Pro | Bloqueia clone preferencial |
| I2 | Docker ausente | Bloqueia dump local + supabase start |
| I3 | psql ausente | Bloqueia restore manual CLI |
| I4 | Preview não serve de clone pré-036 | Evidência comportamental apenas |

---

## 12. Decisão final

### **GO com condições**

**Condições para passar a GO pleno:**

1. Executar `scripts/pr4/dry-run-migrations.mjs` num clone real (Pro branch ou Docker restore).
2. Ensaiar rollback no clone.
3. Smokes app contra clone.
4. Backup produção confirmado antes do apply real.

**Produção:** intocada nesta fase PR.4.

---

*PR.4 documental + tooling — execução física do ensaio pendente de infraestrutura.*
