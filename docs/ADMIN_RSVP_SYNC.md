# Admin RSVP — Sync Google Sheets / CSV (Phase 2)

## Porque os duplicados voltavam

O sync Phase 1 era **importação unidirecional** (CSV público da Google Sheet → Supabase) com:

- Sem `source_row_id` estável na folha externa
- Sem fingerprint de linha
- Sem ledger de decisões de merge

Quando um admin fundia ou apagava convidados duplicados, a folha externa **mantinha as mesmas linhas**. No sync seguinte, cada linha era tratada como nova ou o match falhava (ex.: `"Helio"` vs `"Helio e Esposa"`), e o convidado reaparecia.

## Como funciona o ledger (Phase 2)

Duas tabelas em `030_sheet_sync_ledger.sql`:

| Tabela | Função |
|--------|--------|
| `event_sheet_import_rows` | Memória de cada linha bruta vista (payload + campos normalizados + fingerprint) |
| `event_sheet_sync_ledger` | Decisão por fingerprint: `created`, `updated`, `matched`, `skipped`, etc. |

Fluxo por linha (`processImportRowWithLedger`):

1. Calcular fingerprint SHA-256 (`event_id + source + email + phone + name + party_hint`)
2. Upsert em `event_sheet_import_rows`
3. Se existir ledger com `guest_id` e o convidado ainda existir → **update**, não criar
4. Se ledger aponta para convidado apagado → **skipped** (`guest_deleted_or_missing`), sem recriar às cegas
5. Senão → `findGuestMatch` (email → telefone → nome) → `matched`/`updated` ou `created`
6. Gravar decisão no ledger

**Idempotência:** repetir o mesmo sync Google Sheet ou o mesmo CSV **não deve criar convidados extra** para linhas já vistas na mesma fonte (`google_sheet` vs `csv_upload` são fontes distintas).

## Porque não há UNIQUE em `guests` (ainda)

`UNIQUE(event_id, email)` ou `UNIQUE(event_id, name_normalized)` podem bloquear convidados legítimos (famílias, homónimos, entradas incompletas). A resolução fina fica para uma fase com fila de revisão.

## Inspecionar o ledger (SQL)

```sql
select event_id, source, action, count(*)
from public.event_sheet_sync_ledger
group by event_id, source, action
order by event_id, source, action;

select event_id, source, row_fingerprint, guest_id, action, last_seen_at
from public.event_sheet_sync_ledger
order by last_seen_at desc
limit 20;

select event_id, source, row_fingerprint, normalized_email, normalized_phone, normalized_name, last_seen_at
from public.event_sheet_import_rows
order by last_seen_at desc
limit 20;
```

## Campos extra no resultado de sync

`SheetSyncResult` inclui opcionalmente: `syncBatchId`, `importRowsSeen`, `fingerprintsCreated`, `ledgerMatched`, `ledgerSkipped`. A UI admin pode ignorá-los.

## Próxima fase recomendada

**Phase 7 — Marketing consent bridge (opcional):** ligação explícita entre `event_contact_profiles` com `marketing_granted` e sync Brevo — **apenas** com opt-in documentado; nunca inferido de RSVP.

## Phase 6 — Event contact profiles

Base operacional de emails e telefones por evento, separada de marketing/Brevo.

### Tabela `033_event_contact_profiles.sql`

| Campo | Uso |
|-------|-----|
| `event_id` | Âmbito do evento (sem unique global cross-event) |
| `guest_id` | Ligação opcional ao convidado (`ON DELETE SET NULL` — perfil sobrevive) |
| `normalized_email` / `normalized_phone` | Chaves de deduplicação por evento (índices únicos parciais) |
| `source` | `rsvp`, `google_sheet`, `csv_upload`, `admin`, `edition_rsvp`, `checkin`, `unknown` |
| `consent_status` | Por defeito `operational_only` |
| `marketing_allowed` | Por defeito `false` — **nunca** inferido de RSVP |

### Regras de extracção

- Só cria/atualiza perfil se existir **email ou telefone** normalizável.
- Membros de grupo (`guest_party_members`) **sem** email/telefone **não** geram perfil.
- Upsert por `(event_id, normalized_email)` ou `(event_id, normalized_phone)`.
- `last_seen_at` actualizado em cada sync; dados de contacto actualizados quando o convidado muda.

### Contacto operacional vs marketing

| Tipo | Armazenamento | Marketing |
|------|---------------|-----------|
| Operacional | `event_contact_profiles` com `operational_only` | **Não** |
| Marketing | Requer `consent_status = marketing_granted` e `marketing_allowed = true` | Futuro Phase 7 |

### Integração

| Fluxo | Ficheiro | `source` |
|-------|----------|----------|
| Import idempotente (Sheets/CSV) | `idempotent-import.ts` | `google_sheet` / `csv_upload` |
| RSVP público | `rsvp.service.ts` | `rsvp` |
| Edition RSVP | `edition/rsvp/persist.ts` | `edition_rsvp` |
| Admin CRUD convidado | `guests.repository.ts` | `admin` |
| Revisão admin (associar/restaurar) | `guest-review-actions.service.ts` | conforme ledger ou `admin` |
| Party parser | — | **Não cria** perfis para acompanhantes sem contacto |

Repositório: `src/lib/events/repositories/event-contact-profiles.repository.ts`

### Admin UI

Evento → separador **Contactos** — tabela com nome, email, telefone, origem, convidado associado, consentimento e última actualização.

### O que Phase 6 **não** faz

- Não envia emails
- Não sincroniza com Brevo
- Não infere consentimento marketing a partir de RSVP
- Não expõe contactos em rotas públicas
- Não apaga perfis automaticamente quando o convidado é removido

### Inspecionar contactos (SQL)

```sql
select
  event_id,
  source,
  consent_status,
  marketing_allowed,
  count(*)
from public.event_contact_profiles
group by event_id, source, consent_status, marketing_allowed
order by event_id, source;

select
  full_name,
  email,
  phone,
  source,
  consent_status,
  marketing_allowed,
  last_seen_at
from public.event_contact_profiles
order by last_seen_at desc
limit 30;
```

## Phase 5 — Party parser (nomes compostos)

Parser puro: `src/lib/events/party-parser.ts`

### Entradas suportadas (exemplos)

| Entrada | Interpretação | Automático vs revisão |
|---------|---------------|------------------------|
| `Helio +1` / `Ana +2` / `Helio e +1` | Headcount explícito | **Automático** (`confidence: high`) — `plus_ones` aplicado |
| `Helio e Esposa` | Principal + cônjuge | **Revisão** — não altera `plus_ones` às cegas |
| `Helio e Esposa e +1` | Principal + cônjuge + +1 | **Revisão** — sugere 3 pessoas |
| `João e Maria` / `João, Maria e Carlos` | Vários nomes | **Revisão** — não cria convidados extra |
| `Família Matola` / `Helio e Família` | Grupo familiar | **Revisão** — `family_size_unknown`, headcount = 1 |
| `Helio e acompanhante` | Acompanhante anónimo | **Revisão** |
| `Carlos Dimande` | Nome simples | **Automático** — 1 pessoa |

Termos PT: esposa/esposo/marido/mulher/cônjuge, acompanhante/convidado/parceiro, família/family.

### Integração

- **CSV / Google Sheets** (`parse-csv.ts` + `party-sheet.ts`): mantém `rawName`, usa `primaryName` no convidado, `plus_ones` só com confiança alta ou coluna explícita.
- **Import idempotente**: após criar/actualizar convidado, grava sugestões em `guest_party_members` (status `suggested`) — **não cria convidados extra**.
- **Fila de revisão**: itens `party_needs_review` com resumo «Detectado: N pessoas», «Principal», «Acompanhantes».

### Tabela `032_guest_party_members.sql`

Persiste membros sugeridos por convidado (`suggested` | `confirmed` | `dismissed`).

### Acções admin (Revisão)

| Acção | Efeito |
|-------|--------|
| **Confirmar grupo** | Marca sugestões `confirmed`; opcionalmente aplica `plus_ones` sugerido |
| **Ignorar sugestão** | Marca `dismissed` — não expande grupo |

### O que Phase 5 **não** faz

- Não envia emails
- Não sincroniza contactos para Brevo/marketing
- Não cria convidados adicionais sem acção explícita do admin
- Não altera a folha Google externa

### Inspecionar sugestões (SQL)

```sql
select status, role, count(*)
from public.guest_party_members
group by status, role
order by status, role;

select event_id, guest_id, label, role, status, confidence, updated_at
from public.guest_party_members
where status = 'suggested'
order by updated_at desc
limit 20;
```

## Phase 4 — Admin RSVP Review Queue

Sem nova tabela: a fila agrega dados existentes:

| Fonte | O que mostra |
|-------|----------------|
| `event_sheet_sync_ledger` | `skipped`, `ignored`, `error` com motivos como `guest_deleted_or_missing`, `primary_guest_missing`, `duplicate_resolution_*` |
| `guest_duplicate_resolutions` | `needs_review`, `ignored`, primary ausente |
| `guest_party_members` | Grupos compostos com status `suggested` |
| Deduplicação (`buildDuplicateClusters`) | Possíveis duplicados por nome normalizado |

### Onde rever no Admin

Evento → separador **Revisão** (badge com pendências críticas).

Contadores: **A rever**, **Ignorados**, **Convidado removido**, **Possíveis duplicados**, **Erros de sync**.

### Acções do admin

| Acção | Efeito |
|-------|--------|
| **Associar a convidado existente** | Actualiza convidado; ledger `matched` + `admin_attached`; cria resolução `merged` |
| **Ignorar** | Ledger `ignored` + `admin_ignored`; resolução `ignored` — sync futuro **não recria** |
| **Restaurar** | Só linhas ledger com convidado removido — `createGuestFromSheet` explícito + ledger `created`/`admin_restored` |
| **Manter em revisão** | Mantém `needs_review` / `duplicate_resolution_needs_review` |
| **Marcar resolvido** | Ledger `admin_resolved` — sai da fila; sync futuro **não recria** |
| **Ver payload** | JSON da linha importada (sem alterar folha externa) |

Clusters de deduplicação: use o painel **Fundir duplicados** em Convidados — a fila apenas sinaliza.

### Comportamento em syncs futuros

- `admin_ignored` / `admin_resolved` no ledger → linha ignorada, sem auto-criar convidado.
- `admin_attached` + `guest_id` → actualiza o convidado ligado.
- Resolução `merged` / `restored` → mapeia variantes ao primary (Phase 3).
- Nada apaga convidados nem envia email; Brevo/marketing não é tocado.

### Contactos / marketing (ainda não)

Perfis de contacto e sync Brevo **não** fazem parte desta fase.

### Inspecionar fila (SQL)

```sql
select
  action,
  reason,
  count(*)
from public.event_sheet_sync_ledger
group by action, reason
order by action, reason;

select
  resolution_status,
  count(*)
from public.guest_duplicate_resolutions
group by resolution_status
order by resolution_status;
```

## Phase 3 — Duplicate resolution memory

Tabela `031_guest_duplicate_resolutions.sql`:

| Campo | Função |
|-------|--------|
| `primary_guest_id` | Convidado que sobreviveu ao merge |
| `duplicate_*` | Identidade do registo secundário (nome, email, telefone, fingerprint) |
| `resolution_status` | `merged`, `ignored`, `restored`, `needs_review` |

### Ledger vs duplicate resolutions

| Mecanismo | O que memoriza |
|-----------|----------------|
| **Ledger (Phase 2)** | A mesma linha exacta da folha/CSV (fingerprint estável) |
| **Duplicate resolutions (Phase 3)** | Variantes diferentes que o admin já fundiu (ex.: `Helio` → `Helio Matola`) |

Quando o admin funde duplicados no painel, cada secundário gera um registo `merged` **antes** de ser apagado.

No import (`processImportRowWithLedger`), após ledger e `findGuestMatch`, consulta-se `guest_duplicate_resolutions` por fingerprint, email, telefone ou nome normalizado:

- `merged` / `restored` → actualiza o `primary_guest_id`
- `ignored` → não cria convidado (`ledger` action `ignored`)
- `needs_review` → `skipped` sem auto-criar
- primary ausente → `skipped` (`primary_guest_missing`)

### Party parser

Phase 3 **não** expande `Helio e Esposa` em membros — apenas memoriza o texto fundido como variante duplicada se o admin o mergeou manualmente.

### UNIQUE constraints

Continuamos sem `UNIQUE(event_id, email|name|phone)` — homónimos e famílias legítimas precisam de fila de revisão.

### Inspecionar resoluções (SQL)

```sql
select
  event_id,
  resolution_status,
  count(*)
from public.guest_duplicate_resolutions
group by event_id, resolution_status
order by event_id, resolution_status;

select
  event_id,
  primary_guest_id,
  duplicate_name,
  duplicate_name_normalized,
  duplicate_email,
  duplicate_phone,
  resolution_status,
  resolved_at
from public.guest_duplicate_resolutions
order by resolved_at desc
limit 20;
```

## Aplicar migrações

```bash
# Via Supabase SQL Editor ou, se CLI disponível:
# supabase db push
```

Ficheiros:
- `supabase/migrations/030_sheet_sync_ledger.sql`
- `supabase/migrations/031_guest_duplicate_resolutions.sql`
- `supabase/migrations/032_guest_party_members.sql`
