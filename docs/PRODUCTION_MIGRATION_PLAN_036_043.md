# Plano de migrations 036–043 para produção

**Estado:** auditoria read-only — **nenhuma migration aplicada neste documento**.
**Data da auditoria:** 2026-07-11
**Branch:** `rebuild-haxr-platform`
**PR:** #3 (Draft)
**Produção:** `oxsrdmydlqyvnueedgtl`
**Preview:** `uxleigndoomoezwsxlan`

> **Proibido neste plano:** `db push` cego em produção, `migration repair` sem checklist, merge/promote, deploy manual da app antes das migrations.

---

## 1. Estado real de produção (read-only)

### 1.1 Histórico `supabase_migrations.schema_migrations`

Produção tem **19** versões registadas (todas com timestamps CLI). **Nenhuma** das versões locais `036`–`043` aparece.

| Version remota | Name |
|----------------|------|
| 20260618140434 | brevo_funnel_tracking |
| 20260618143854 | contact_intent |
| 20260618150936 | brevo_funnel_experiences_meeting |
| 20260619215409 | edition_open_rsvp |
| 20260619224856 | fix_edition_rsvp_qr_token_search_path |
| 20260623234246 | create_edition_gift_reservations |
| 20260624082731 | edition_ops_rsvp_gifts_reminders |
| 20260701115318 | jessica_samuel_gift_registry |
| 20260701115424 | jessica_samuel_gift_registry_seed |
| 20260706191723 | sheet_sync_ledger |
| 20260706193828 | guest_duplicate_resolutions |
| 20260706214626 | guest_party_members |
| 20260706220735 | event_contact_profiles |
| 20260708210015 | 027_concierge |
| **20260709084059** | **commercial_admin_v2** (≈ local `028`) |
| 20260709091028 | 030_portal_v2_approvals |
| 20260709094757 | 034_portal_premium_complete |
| 20260709111150 | post_event_report |
| **20260709112104** | **concierge_portal** (≈ local `0281`) |

**Confirmação:** migrations **036–043 ausentes** em produção.

### 1.2 Pré-condições de schema

| Pré-condição | Produção | Notas |
|--------------|----------|-------|
| `businesses.id = 'haxr-signature'` | ✅ | Presente |
| Enum `event_type` | ✅ | wedding, birthday, corporate, baby_shower, graduation, other |
| Tabela `events` | ✅ | 6 eventos; todos `business_id = haxr-signature`; colunas usadas por 038 presentes |
| `guests` | ✅ | RLS on, 0 policies (acesso via bypass / service) |
| `payments` | ✅ | idem |
| `event_vendors` | ✅ | idem |
| `event_checklist_items` | ✅ | idem |
| `documents` | ✅ | colunas 028 (`converted_from_document_id`, `email_sent_at`, `whatsapp_shared_at`) presentes |
| `clients.portal_token` | ✅ | objecto 028 presente |
| `concierge_*` | ✅ | uploads, review_items, portal_items/classifications/suggestions/activities, ai_audit_logs |
| `client_events` / `profiles` / `event_members` / snapshots | ❌ | só chegam com 036 |
| RPCs 038–043 | ❌ | nenhuma colisão — funções inexistentes |
| Trigger `on_auth_user_created` em `auth.users` | ❌ | 0 triggers custom em `auth.users` |
| `auth.users` | 0 rows | backfill 036 será no-op / barato |
| RLS core tables | enabled, **0 policies** | padrão admin/service; 036 adiciona policies só nas tabelas novas |

### 1.3 Preview

- CLI `supabase/.temp/project-ref` = `uxleigndoomoezwsxlan` (preview).
- MCP `user-supabase` aponta para **produção** — usar só SELECT / list_migrations.
- 036–043 já validadas no preview (PR #3 / smokes E.4).

---

## 2. Gap histórico 028 / 0281

### 2.1 O que é o gap

No repositório local existiram **dois ficheiros com prefixo `028_`** (colisão de versão CLI). No preview foi resolvido renomeando:

| Ficheiro local actual | Conteúdo | Equivalente remoto produção |
|-----------------------|----------|-----------------------------|
| `028_commercial_admin_v2.sql` | colunas documents + `clients.portal_token` | `20260709084059_commercial_admin_v2` |
| `0281_concierge_portal.sql` | tabelas `concierge_portal_*` | `20260709112104_concierge_portal` |

Há também renomeações irmãs `0301` / `0302` (mesmo padrão de colisão `030`).

### 2.2 Schema vs histórico

| Camada | Estado |
|--------|--------|
| **Objectos SQL de 028/0281 em produção** | ✅ Já existem (colunas + tabelas portal) |
| **Versões no histórico remoto** | ✅ Registadas com **timestamps**, não com `028` / `0281` |
| **Versões no folder local** | Prefixo numérico `028` / `0281` |

Conclusão: **não há gap de schema** — há **drift de identificação de versão** entre ficheiros locais e `schema_migrations` em produção.

### 2.3 Estratégias (não executar agora)

| Opção | Descrição | Risco | Recomendação |
|-------|-----------|-------|--------------|
| **A. Re-aplicar SQL 028/0281** | Correr ficheiros de novo | Médio — idempotente na maior parte, mas triggers/indexes podem falhar | ❌ Não |
| **B. `migration repair` cego** | Marcar versões sem mapear timestamps | Alto — desalinha histórico | ❌ Não sem checklist |
| **C. Reconciliação documental + apply selectivo 036–043** | Mapear `028`↔timestamp e `0281`↔timestamp; aplicar **só** 036–043 como novas versões (timestamp ou `db query` + insert controlado) | Baixo se feito com backup e dry-run | ✅ Preferida |
| **D. `db push` completo contra produção** | CLI tenta reconciliar 001–043 | **Alto** — pode tentar reaplicar ou falhar em massa | ❌ Proibido |

**Caminho seguro recomendado (futuro, com autorização explícita):**

1. Backup/snapshot produção.
2. Documentar mapa local→remoto (esta secção).
3. Confirmar objectos 028/0281 (já feito).
4. **Não** reaplicar 028/0281.
5. Se o CLI for ligado a produção: `migration repair --status applied` **apenas** para chaves locais que o CLI ache “pending” mas cujo SQL já está no schema — **depois** de listar `db push --dry-run` e confirmar que **só** 036–043 (ou equivalentes) ficam pendentes.
6. Alternativa mais segura: aplicar o SQL de 036–043 via migration SQL nomeada com **novo timestamp**, registando uma linha por ficheiro em `schema_migrations`, sem tocar no histórico antigo.

---

## 3. Riscos por migration 036–043

### 036 — `client_app_auth.sql`

| Aspecto | Detalhe |
|---------|---------|
| **Cria** | Enums `client_event_member_role`, `client_event_status`, `app_user_role`; tabelas `profiles`, `client_events`, `event_members`, `event_onboarding_snapshots`; helpers RLS; trigger auth; policies; grants |
| **Altera** | `auth.users` (trigger AFTER INSERT); FK `profiles.active_client_event_id` → `client_events` |
| **Backfill** | `INSERT INTO profiles SELECT … FROM auth.users` — produção tem **0** users → impacto mínimo |
| **Locks** | DDL em tabelas novas; trigger em `auth.users` (curto); índices únicos |
| **Grants/revokes** | `REVOKE ALL` anon nas 4 tabelas; `GRANT` authenticated SELECT/INSERT/UPDATE (sem DELETE); helpers só `authenticated` |
| **SECURITY DEFINER** | `is_client_event_owner`, `is_client_event_member`, `handle_new_user` — com `search_path = public` |
| **Rollback** | Drop trigger + functions + policies + tables + enums (ordem inversa); **não** afecta `events`/`guests` existentes |
| **Risco** | Médio — superfície Auth/RLS nova; deve validar signup→profile antes de 038 |

### 037 — `client_app_service_role_grants.sql`

| Aspecto | Detalhe |
|---------|---------|
| **Cria** | Nada |
| **Altera** | Grants `service_role` nas 4 tabelas 036 |
| **Backfill** | Nenhum |
| **Locks** | Nenhum relevante |
| **SECURITY DEFINER** | Não |
| **Rollback** | `REVOKE` simétrico |
| **Risco** | Baixo — obrigatório para APIs server-side |

### 038 — `provision_client_operational_event.sql`

| Aspecto | Detalhe |
|---------|---------|
| **Cria** | Função `provision_client_operational_event(uuid)` |
| **Altera** | Em runtime: INSERT `events` + UPDATE `client_events.operational_event_id` |
| **Locks** | `FOR UPDATE` em `client_events` na execução (não no apply) |
| **Grants** | EXECUTE só `service_role`; REVOKE PUBLIC/anon/authenticated |
| **SECURITY DEFINER** | Sim — bypass RLS em `events` |
| **Rollback** | `DROP FUNCTION` |
| **Risco** | Médio — depende de `businesses.id = 'haxr-signature'` (✅) e de 036 |

### 039–043 — RPCs de leitura operacional

| Migration | Função | Tabelas lidas | Risco |
|-----------|--------|---------------|-------|
| 039 | `get_client_event_guests` | guests, seats, guest_groups, checkins | Baixo no apply; médio se grants errados |
| 040 | `get_client_event_payments` | payments, documents | Baixo |
| 041 | `get_client_event_vendors` | event_vendors | Baixo |
| 042 | `get_client_event_checklist` | event_checklist_items | Baixo |
| 043 | `get_client_event_documents` | documents, concierge_*, portal | Baixo–médio (mais joins) |

Comum a 039–043:

- **Só CREATE OR REPLACE FUNCTION** + REVOKE/GRANT service_role.
- Sem backfill, sem ALTER TABLE, sem policies novas.
- Exigem `client_events.operational_event_id` (038) em runtime.
- **Sem colisão** em produção (funções inexistentes).
- Rollback: `DROP FUNCTION …(uuid)`.

---

## 4. Ordem segura (migrations vs aplicação)

```text
0. Backup / snapshot produção (Dashboard ou pg_dump schema+data crítico)
1. Reconciliar gap 028/0281 (mapa + dry-run CLI) — NÃO reaplicar SQL
2. Aplicar 036
3. Validar Auth/RLS:
   - tabelas + enums
   - trigger on_auth_user_created
   - policies + grants
   - signup de teste → row em profiles
4. Aplicar 037
5. Validar service_role INSERT em client_events / snapshots (smoke API staging)
6. Aplicar 038
7. Validar provisioning (client_event → events.notes + operational_event_id)
8. Aplicar 039 → 040 → 041 → 042 → 043 (uma a uma ou lote, com smoke entre lotes)
9. Validar RPCs com event de teste (não dados reais de clientes sem necessidade)
10. Só depois: merge PR #3 / promote app com env produção apontando para oxsrd…
```

**Regra de ouro:** a app cliente (`/app/*`, APIs E.4) **não** deve ir para produção **antes** de 036–043 estarem aplicadas e validadas. Marketing/admin existentes podem continuar no código actual sem 036.

---

## 5. Estratégia de rollback

| Fase | Rollback |
|------|----------|
| Após 039–043 | `DROP FUNCTION` das 5 RPCs + `provision_client_operational_event` |
| Após 038 | Drop function; opcionalmente limpar `events` criados com notes `Provisioned from client_events:%` **só se** forem de teste |
| Após 037 | REVOKE grants service_role |
| Após 036 | Remover trigger `on_auth_user_created`; DROP policies; DROP tables 036; DROP helpers; DROP enums (se sem dependências) |
| App | Reverter deploy / manter Draft PR — produção app antiga não depende de `client_events` |

**Não** fazer `db reset` em produção.
**Não** apagar `events`/`guests`/`payments` operacionais legados.

---

## 6. Decisão desta auditoria

### **GO com condições**

Condições obrigatórias antes de qualquer apply em `oxsrdmydlqyvnueedgtl`:

1. Backup/snapshot confirmado.
2. Plano de reconciliação 028/0281 aprovado (opção C) — sem reaplicar SQL.
3. Dry-run CLI mostra **apenas** 036–043 (ou SQL equivalente) como pendente.
4. Janela de manutenção acordada.
5. Validação Auth após 036 antes de 038–043.
6. App merge/promote **depois** das migrations.
7. Confirmação explícita humana para cada passo de escrita.

**NO-GO imediato** se alguém propuser: `db push` sem dry-run, repair sem mapa, ou merge da app antes de 036–043.

---

## 7. Confirmação operacional desta auditoria

| Acção | Executada? |
|-------|------------|
| SELECT / list_migrations em produção | ✅ |
| Apply migration / db push / repair | ❌ |
| Alteração de dados produção | ❌ |
| Merge / promote / deploy manual | ❌ |

---

*Documento de planeamento — execução só com autorização explícita numa fase posterior.*
