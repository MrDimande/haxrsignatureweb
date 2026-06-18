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

## Camada 2 — Campanhas bulk (painel Brevo)

**O quê:** campanhas criadas no painel Brevo (ou via MCP) para envio a listas segmentadas.

**Quando:**
- Newsletters editoriais (Insights)
- Anúncios sazonais
- Reativação manual de segmentos
- Testes A/B de assunto

**Listas configuradas:**
| ID | Nome | Uso |
|----|------|-----|
| 5 | Leads Website | Todos os pedidos de contacto |
| 6 | Newsletter | Opt-in marketing |

**Rascunhos MCP (referência):** IDs 1–4 no painel — boas-vindas, portfólio, experiências, última chamada. O **site não depende** destes rascunhos; o funil activo é transaccional em código.

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
npm run brevo:funnel      # testar funil (dev server)
npm run brevo:funnel:direct
```

## Variáveis

Ver `.env.example` — `BREVO_FUNNEL_*_DAYS`, `BREVO_LIST_LEADS`, `BREVO_LIST_NEWSLETTER`.
