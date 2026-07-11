# PR.3 — Inventário read-only de produção

**Estado:** inventário em curso — **NO-GO TEMPORÁRIO**

**Nenhuma mutação executada** (sem snapshot manual, sem `repair`, sem apply).

### Estado do pacote 1 (checkpoint)

```text
Item 1: parcialmente concluído — evidência manual do Dashboard pendente
Item 2: concluído
Item 3: concluído
Estado: NO-GO TEMPORÁRIO
```

Este commit é **checkpoint de inventário PR.3** — não representa `GO` de produção.

---

## 1. Baseline

| Campo | Valor |
|-------|-------|
| **Commit PR.4.1** | `ea8fe5b` |
| **Produção** | `oxsrdmydlqyvnueedgtl` |
| **URL projecto** | `https://oxsrdmydlqyvnueedgtl.supabase.co` |
| **Região (pooler)** | `aws-0-eu-central-1` (eu-central-1) |
| **Data/hora da recolha** | 2026-07-12 (itens 2–3 e schema via MCP read-only) |
| **Operador** | _A preencher — recolha Dashboard secção 2_ |
| **PR.4.1 dry-run** | `pass_with_optional_checks_skipped` · produção intocada |

---

## 2. Backup e capacidade de restauro

> **Distinção:** consultar backups no Dashboard é read-only. **Criar snapshot manual** só após inventário completo e imediatamente antes de eventual janela de aplicação.

### 2.1 Recolha manual pendente (Dashboard)

Ir a **Project Settings → General** e **Database → Backups** (read-only):

| Campo | Valor | Evidência |
|-------|-------|-----------|
| Plano Supabase | _Pendente_ | Dashboard → Settings → Billing |
| Região do projecto | _Confirmar eu-central-1_ | Dashboard → Settings → General |
| Backups automáticos activos | _Pendente_ | Database → Backups → Scheduled |
| Data/hora backup mais recente | _Pendente_ | Database → Backups → Scheduled |
| Retenção disponível | _Pendente_ (Pro típico: 7 dias) | Dashboard |
| PITR activo | _Pendente_ | Database → Backups → Point in Time |
| Janela PITR (se activo) | _Pendente_ | earliest / latest recovery point |
| Snapshot manual criado nesta fase | **Não** | — |

#### 2.1.1 Bloco de recolha manual (Dashboard read-only)

> Preencher **manualmente** a partir do Dashboard. **Não** inventar valores. Campos ainda não recolhidos permanecem como `Pendente de recolha manual no Dashboard`. **Não** colocar passwords, connection strings completas, service-role keys, tokens ou screenshots com segredos.

| Campo | Valor |
|---|---|
| Data/hora da verificação | Pendente de recolha manual no Dashboard |
| Plano | Pendente de recolha manual no Dashboard |
| Região | Pendente de recolha manual no Dashboard |
| Último backup disponível | Pendente de recolha manual no Dashboard |
| Retenção | Pendente de recolha manual no Dashboard |
| PITR (activo / inactivo / não disponível) | Pendente de recolha manual no Dashboard |
| backupAvailable (true / false / por confirmar) | por confirmar |
| restoreProcedureKnown (true / false / por confirmar) | por confirmar |
| restoreAuthorityIdentified (true / false / por confirmar) | por confirmar |
| Restauro testável (sim / não / por confirmar) | por confirmar |
| Responsável por autorizar | Pendente de recolha manual no Dashboard |
| Responsável por executar | Pendente de recolha manual no Dashboard |
| Tempo estimado de recuperação | Pendente de recolha manual no Dashboard |
| Evidência sanitizada | Pendente de recolha manual no Dashboard |
| Observações | Pendente de recolha manual no Dashboard |
| productionTouched | false |

#### 2.1.2 Gate para avançar aos itens 4–6

```text
backupAvailable = true
restoreProcedureKnown = true
restoreAuthorityIdentified = true
productionTouched = false
```

Enquanto **qualquer** campo obrigatório do gate estiver pendente ou por confirmar, mantém-se:

**NO-GO TEMPORÁRIO — prontidão de restauro ainda não comprovada**

### 2.2 Referência documental (não substitui Dashboard)

- [Supabase Database Backups](https://supabase.com/docs/guides/platform/backups)
- Plano **Pro:** backups diários automáticos, retenção **7 dias** (se PITR desactivado).
- **PITR:** add-on opcional (~$100/mês, 7 dias retenção); requer compute ≥ Small; desactiva backups diários standard.
- Restauro: Dashboard → Database → Backups → Restore; PITR via API/UI dedicada.

### 2.3 Procedimento de restauro (a validar pelo operador)

1. Identificar ponto de restauro (backup scheduled ou PITR).
2. Confirmar janela de indisponibilidade durante restore.
3. Autorização: _registar nome/função do responsável_.
4. Execução: Dashboard ou API documentada — **não ensaiado nesta fase**.

### 2.4 Conclusão parcial secção 2

**Prontidão de restauro:** **não confirmada operacionalmente** — falta recolha Dashboard (plano, timestamp último backup, PITR on/off). Capacidade técnica presumida (projecto Pro) **não substitui evidência do operador**.

---

## 3. Histórico remoto (`supabase_migrations.schema_migrations`)

**Fonte:** SELECT read-only via MCP Supabase (produção `oxsrdmydlqyvnueedgtl`).
**Total versões registadas:** 19

### 3.1 Estrutura da tabela

| ordinal_position | column_name | data_type |
|------------------|-------------|-----------|
| 1 | version | text |
| 2 | statements | ARRAY |
| 3 | name | text |
| 4 | created_by | text |
| 5 | idempotency_key | text |
| 6 | rollback | ARRAY |

### 3.2 Histórico completo (produção)

| version | name |
|---------|------|
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
| **20260709084059** | **commercial_admin_v2** |
| 20260709091028 | 030_portal_v2_approvals |
| 20260709094757 | 034_portal_premium_complete |
| 20260709111150 | post_event_report |
| **20260709112104** | **concierge_portal** |

### 3.3 Versões 028 / 036–043 no histórico

| Prefixo local | Registado em produção |
|---------------|------------------------|
| `028` / `0281` (ficheiros locais) | **Não** — equivalentes remotos usam timestamps `20260709084059` e `20260709112104` |
| `036` – `043` | **Não** — zero linhas |

**Observação:** produção usa **timestamps CLI**, não prefixos numéricos locais `028`/`0281`.

---

## 4. Ficheiros locais

### 4.1 Migrations `028*` (inventário obrigatório)

| Ficheiro | Bytes | LastWriteTime | SHA-256 |
|----------|-------|---------------|---------|
| `028_commercial_admin_v2.sql` | 788 | 2026-07-09 12:29:12 | `5DD7B4B5B2891E72026470808449C857B3FADD1F6DA6FD62FDA8434305F4E419` |
| `0281_concierge_portal.sql` | 4294 | 2026-07-09 10:29:25 | `2CE029EC02F711EEC5C571CAAFFD8CE9E2CF843EA4A32FA794B489AA45A100B0` |

**Objectos afectados — `028_commercial_admin_v2.sql`**

- `documents`: colunas `converted_from_document_id`, `email_sent_at`, `whatsapp_shared_at`
- Índices: `idx_documents_converted_from`, `idx_documents_email_sent`
- `clients`: coluna `portal_token`
- Índice: `idx_clients_portal_token` (UNIQUE parcial)

**Objectos afectados — `0281_concierge_portal.sql`**

- Tabelas: `concierge_portal_items`, `concierge_portal_classifications`, `concierge_portal_suggestions`, `concierge_portal_activities`
- Triggers `updated_at` (depende de `set_updated_at()` — migration `027`)
- Storage bucket `haxr-concierge` (privado)
- **Dependência explícita:** `027_concierge.sql` (admin concierge + função `set_updated_at`)

**Dependências entre migrations**

```
027_concierge → 0281_concierge_portal
028_commercial_admin_v2 → (documents, clients pré-existentes)
028/0281 → 030*, 034* (portal) — schema já em produção
036–043 → independentes de re-aplicar 028/0281
```

**Acção nesta fase:** nenhuma renomeação, repair ou re-aplicação.

### 4.2 Migrations `036–043` (referência para secção 6)

| Ficheiro | Bytes | SHA-256 |
|----------|-------|---------|
| `036_client_app_auth.sql` | 20151 | `B822074B5414BAF85AB2CFCB65EDD6EC3F89F74E70F888F32FDD962DF8250D20` |
| `037_client_app_service_role_grants.sql` | 716 | `F94F528F760187EF1C6BB78CCA441D1263170849C58B76AE9BCBC066D8E949D4` |
| `038_provision_client_operational_event.sql` | 3092 | `DF433C3CCAFBA65BC1729677BB2E691826B045559C8D1B43604ACFB1D8330353` |
| `039_client_event_guests_rpc.sql` | 3968 | `ECEA7EE444F255AA2D022662DAF0B2D4A683C81B3CF2E4540F154DF03DA55B46` |
| `040_client_event_payments_rpc.sql` | 4300 | `F6A74DBD150BEE2ADEF93C5A55375DC370262CE063D44ACABEA124757FCABEF8` |
| `041_client_event_vendors_rpc.sql` | 4585 | `C32C11C73374DB1F0F451290A5DE12C8FA4F3CD41C72BED8BC26F71216A8CECC` |
| `042_client_event_checklist_rpc.sql` | 5135 | `45A14FD2A73C9F04474E84FFBCB1079B27CAB15E8226A88B60CABC7E81F73134` |
| `043_client_event_documents_rpc.sql` | 8093 | `CF41E8A8ACB8841FEBA82F2983433A4E4C4DE5BB7B5832C172D35D5A9F9E9678` |

---

## 5. Reconciliação 028 / 0281

Comparação **histórico remoto** vs **schema efectivo** vs **ficheiro local**:

| Versão remota | name remoto | Ficheiro local | Schema presente | Divergência histórico | Acção recomendada |
|---------------|-------------|----------------|-----------------|----------------------|-------------------|
| `20260709084059` | commercial_admin_v2 | `028_commercial_admin_v2.sql` | **Sim** — colunas + índices confirmados | Prefixo local `028` ≠ timestamp remoto | **Não re-aplicar SQL**; mapear versão no plano de apply 036–043 apenas |
| `20260709112104` | concierge_portal | `0281_concierge_portal.sql` | **Sim** — 4 tabelas + bucket `haxr-concierge` | Prefixo local `0281` ≠ timestamp remoto | **Não re-aplicar SQL**; documentar mapeamento |

### 5.1 Verificação schema efectivo (028/0281) — produção

| Objecto | Existe |
|---------|--------|
| `documents.converted_from_document_id` | ✅ |
| `documents.email_sent_at` | ✅ |
| `documents.whatsapp_shared_at` | ✅ (coluna; índices abaixo) |
| `idx_documents_converted_from` | ✅ |
| `idx_documents_email_sent` | ✅ |
| `clients.portal_token` | ✅ |
| `idx_clients_portal_token` | ✅ |
| `concierge_portal_items` | ✅ |
| `concierge_portal_classifications` | ✅ |
| `concierge_portal_suggestions` | ✅ |
| `concierge_portal_activities` | ✅ |
| `storage.buckets` → `haxr-concierge` | ✅ (privado) |

**Conclusão 028/0281:** padrão **schema presente + histórico divergente (naming)** — **sem gap de objectos**. Risco de re-aplicar SQL: falhas idempotentes ou conflitos; **proibido** nesta PR.

---

## 6. Estado 036–043

### 6.1 Histórico remoto

| Migration local | Registada em produção |
|-----------------|------------------------|
| 036 – 043 | **Nenhuma** |

### 6.2 Schema efectivo (produção)

| Objecto | Existe |
|---------|--------|
| `profiles` | ❌ |
| `client_events` | ❌ |
| `event_members` | ❌ |
| `event_onboarding_snapshots` | ❌ |
| RPC `provision_client_operational_event` | ❌ |
| RPCs `get_client_event_*` (5) | ❌ |
| Trigger `auth.users` → `on_auth_user_created` | ❌ |
| **Total RPCs client-app** | **0** |

### 6.3 Conclusão 036–043

| Dimensão | Estado |
|----------|--------|
| Histórico | Versões **não registadas** |
| Schema | Objectos **não existentes** |
| Aplicação parcial | **Não detectada** |

**Conclusão:** `036–043` estão **genuinamente pendentes** em produção — alinhado com ensaio PR.4.1 (`ea8fe5b`).

---

## 7. Bloqueios

| # | Bloqueio | Severidade | Resolução |
|---|----------|------------|-----------|
| 1 | Recolha Dashboard backups (secção 2.1) incompleta | **Alta** | Operador preencher plano, último backup, PITR, retenção |
| 2 | Autorização restauro não registada | Média | Definir responsável antes de GO |
| 3 | Itens 4–6 (ordem apply, rollback operacional, GO/NO-GO) | Esperado | Só após desbloquear #1 e validar critérios |

**Nenhuma mutação** foi executada durante este inventário.

---

## 8. Decisão preliminar

```text
NO-GO TEMPORÁRIO — inventário de produção ainda em curso
```

### Critérios para avançar ao plano de aplicação (itens 4–6)

| Critério | Estado |
|----------|--------|
| Restauro operacionalmente viável (evidência Dashboard) | ⏳ Pendente |
| 028/0281 reconciliadas sem suposições | ✅ Schema + mapeamento timestamp documentados |
| 036–043 realmente pendentes | ✅ Histórico + schema confirmados |
| Sem objectos parcialmente aplicados | ✅ Confirmado |
| Nenhuma mutação durante inventário | ✅ Confirmado |

### Próximos passos (PR.3)

1. Completar secção 2.1 no Dashboard (read-only).
2. Redigir ordem exacta de aplicação 036→043 + verificações.
3. Plano backup (snapshot manual **só pré-janela**), rollback operacional, critérios abort.
4. Decisão formal **GO** ou **NO-GO**.

---

## Referências

- Baseline ensaio: `docs/PR4.1_DRY_RUN_FINAL_REPORT.md` · commit `ea8fe5b`
- Plano existente: `docs/PRODUCTION_MIGRATION_PLAN_036_043.md`
- Relatório JSON ensaio: `backups/pr4-dry-run-report.json` (gitignored)
