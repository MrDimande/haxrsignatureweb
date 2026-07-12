# Brevo — Campanhas bulk vs emails transaccionais

A HAXR Signature usa **duas camadas** no Brevo, com propósitos distintos.

## Camada 1 — Transaccional (código)

**O quê:** emails automáticos disparados pela aplicação via `POST /v3/smtp/email`.

**Quando:**
- Funil de leads (dias 0, 3, 7, 14, 21)
- Boas-vindas newsletter (opt-in no formulário)
- Sync de contactos ao submeter o formulário

**Ficheiros:**
- `src/lib/brevo/templates.ts` — HTML dos templates
- `src/lib/brevo/transactional.ts` — envio API
- `src/lib/brevo/funnel.ts` — orquestração e cron
- `src/app/api/cron/brevo-funnel` — follow-ups diários

**Vantagens:** versionado em Git, testável, personalização por lead, tags (`haxr-lead-welcome`, etc.).

**Não usar para:** newsletters editoriais em massa ou campanhas de marketing ad-hoc.

---

## Camada 2 — Campanhas bulk (código + painel Brevo)

**O quê:** campanhas definidas em `src/lib/email/marketing/marketing-campaigns.ts`, renderizadas com templates premium e criadas como rascunho no Brevo via API.

**Quando:**
- Piloto de marketing outbound (serviços, concierge, fornecedores, corporativo)
- Newsletters editoriais futuras
- Reativação manual de segmentos

**Guia do piloto:** [MARKETING_PILOT_LAUNCH.md](./MARKETING_PILOT_LAUNCH.md)

**Comandos:**
```bash
npm run email:pilot          # checklist + campanhas (sem envio)
npm run email:test -- haxr_services_intro
npm run email:draft -- campaign_services_intro
```

**Listas configuradas (env):**
| Variável | Uso |
|----------|-----|
| `BREVO_LIST_LEADS` | Leads website |
| `BREVO_LIST_NEWSLETTER` | Newsletter opt-in |
| `BREVO_MARKETING_LIST_ID` | Marketing geral / contactos seleccionados |
| `BREVO_SUPPLIERS_LIST_ID` | Fornecedores |
| `BREVO_CLIENTS_LIST_ID` | Clientes / corporativo |

**Gates:** `EMAIL_SEND_MODE` + confirmação `SEND_HAXR_MARKETING` para envio bulk.

---

## Camada 2 (legado) — Rascunhos MCP no painel

**Referência histórica:** IDs 1–4 no painel — boas-vindas, portfólio, experiências, última chamada. O funil activo em código é transaccional (`src/lib/brevo/templates.ts`).

---

## Fluxo recomendado de leads

```
Formulário website
    ↓
Supabase (contact_inquiries)
    ↓
Sync Brevo (contacto + atributos CLIENT_INTENT, etc.)
    ↓
Dia 0  → lead_welcome (+ newsletter_welcome se opt-in)
Dia 3  → lead_portfolio
Dia 7  → lead_experiences
Dia 14 → lead_meeting
Dia 21 → lead_last_call
```

Cron: `vercel.json` → `/api/cron/brevo-funnel` (08:00 UTC), protegido por `CRON_SECRET`.

---

## Resend vs Brevo

| Canal | Responsabilidade |
|-------|------------------|
| **Resend** | Contacto website, RSVP de eventos, emails operacionais |
| **Brevo** | CRM, listas, funil comercial, campanhas editoriais futuras |

Nunca misturar: RSVP e confirmações de evento **sempre Resend**; nutrição comercial de leads **Brevo transaccional** (funil) ou **Brevo campanhas** (editorial).

---

## Comandos úteis

```bash
npm run verify:brevo      # API, listas, atributos
npm run brevo:ensure-lists # criar/confirmar listas HAXR (sem emails)
npm run brevo:funnel      # testar funil (dev server)
npm run brevo:funnel:direct
```

### `npm run brevo:ensure-lists`

Confirma ou cria listas para captura de contactos:

| Lista Brevo | Variável env |
|-------------|--------------|
| Leads HAXR | `BREVO_LIST_LEADS` |
| Newsletter HAXR | `BREVO_LIST_NEWSLETTER` |
| Fornecedores HAXR | `BREVO_SUPPLIERS_LIST_ID` |
| Clientes HAXR | `BREVO_CLIENTS_LIST_ID` |
| Marketing HAXR | `BREVO_MARKETING_LIST_ID` |

Não envia emails, não cria campanhas, não altera `.env.local`. Copiar o bloco impresso manualmente.

## Variáveis

Ver `.env.example` — `BREVO_FUNNEL_*_DAYS`, `BREVO_LIST_LEADS`, `BREVO_LIST_NEWSLETTER`.
