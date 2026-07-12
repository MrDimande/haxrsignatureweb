# HAXR — Piloto de Email Marketing (Brevo)

Guia operacional para o **primeiro piloto** de campanhas outbound HAXR Signature.

**Regra absoluta:** nenhum envio em massa sem passar pelo checklist completo e confirmação `SEND_HAXR_MARKETING` com `EMAIL_SEND_MODE=production`.

---

## Prioridade do piloto

| Ordem | Campaign ID | Template | Audiência |
|------|-------------|----------|-----------|
| 1 | `campaign_services_intro` | `haxr_services_intro` | Contactos gerais seleccionados |
| 2 | `campaign_haxr_concierge_educacao` | `haxr_concierge_intro` | Clientes interessados / activos |
| 3 | `campaign_fornecedores_convite` | `supplier_invitation` | Fornecedores seleccionados |
| 4 | `campaign_corporate_intro` | `corporate_events_intro` | Prospects corporativos |

**Campanha recomendada para arrancar:** `campaign_services_intro` — outreach controlado a contactos já curados na lista de marketing.

---

## Campanhas disponíveis (IDs locais)

| Campaign ID | Nome | Template | Segmentos | Listas env sugeridas |
|-------------|------|----------|-----------|----------------------|
| `campaign_haxr_launch_clientes` | HAXR Launch — Clientes | `haxr_launch` | leads_site, casais_noivos, clientes_interessados | BREVO_LIST_LEADS, BREVO_CLIENTS_LIST_ID |
| `campaign_haxr_concierge_educacao` | HAXR Concierge — Educação | `haxr_concierge_intro` | clientes_interessados, clientes_activos | BREVO_CLIENTS_LIST_ID, BREVO_LIST_LEADS |
| `campaign_fornecedores_convite` | Fornecedores HAXR — Convite | `supplier_invitation` | fornecedores, contactos_seleccionados | BREVO_SUPPLIERS_LIST_ID |
| `campaign_convites_rsvp` | Convites Digitais & RSVP | `digital_invitations_rsvp` | casais_noivos, leads_site | BREVO_LIST_LEADS, BREVO_CLIENTS_LIST_ID |
| `campaign_services_intro` | HAXR — Introdução de Serviços | `haxr_services_intro` | contactos_seleccionados, prospects_eventos | BREVO_MARKETING_LIST_ID |
| `campaign_corporate_intro` | Eventos Corporativos — Introdução | `corporate_events_intro` | prospects_corporativos, contactos_seleccionados | BREVO_CLIENTS_LIST_ID, BREVO_MARKETING_LIST_ID |
| `campaign_soft_follow_up` | Seguimento Suave — Leads | `soft_follow_up` | clientes_interessados, leads_site | BREVO_LIST_LEADS |

Definições em código: `src/lib/email/marketing/marketing-campaigns.ts`.

---

## Templates de marketing

| Template ID | Categoria | Aliases |
|-------------|-----------|---------|
| `haxr_launch` | consent | — |
| `haxr_concierge_intro` | consent | — |
| `digital_invitations_rsvp` | consent | `rsvp_digital_education` |
| `wedding_dashboard_welcome` | consent | — |
| `soft_follow_up` | consent | `client_follow_up` |
| `haxr_services_intro` | cold_outreach | — |
| `supplier_invitation` | cold_outreach | — |
| `corporate_events_intro` | cold_outreach | — |
| `cold_outreach_brand_intro` | cold_outreach | — |

Todos renderizam via `renderMarketingEmail()` → `renderEmailBrandHeader()` (logo Outlook-safe).

---

## Mapeamento segmento → lista Brevo

| Variável env | Segmentos cobertos |
|--------------|-------------------|
| `BREVO_LIST_LEADS` | leads_site, clientes_interessados, casais_noivos |
| `BREVO_LIST_NEWSLETTER` | newsletter |
| `BREVO_MARKETING_LIST_ID` | contactos_seleccionados, prospects_eventos, leads_site, clientes_interessados |
| `BREVO_SUPPLIERS_LIST_ID` | fornecedores, contactos_seleccionados, prospects_eventos |
| `BREVO_CLIENTS_LIST_ID` | clientes_activos, prospects_corporativos, casais_noivos |

**Nota:** `createCampaignDraftFromDefinition()` resolve **todas** as listas que cobrem os segmentos da campanha. Se várias env vars estiverem configuradas, o rascunho Brevo pode incluir múltiplas listIds. Validar no painel Brevo antes de enviar.

---

## Gates de envio (activos)

| Gate | Comportamento |
|------|---------------|
| `EMAIL_SEND_MODE=disabled` | Nenhum envio real; testes simulados |
| `EMAIL_SEND_MODE=test` | Redirecciona tudo para `BREVO_TEST_RECIPIENT` |
| `EMAIL_SEND_MODE=production` | Destinatários reais (transaccional/teste individual) |
| Campanha bulk | Exige **adicionalmente** `confirm: "SEND_HAXR_MARKETING"` **e** `dryRun: false` |
| Campanha bulk | Bloqueada se `EMAIL_SEND_MODE !== production` |

Código: `src/lib/email/brevo-client.ts` → `sendCampaign()`, `src/lib/email/email-config.ts`.

---

## Variáveis de ambiente obrigatórias

### Mínimo para rascunhos no Brevo

```env
BREVO_API_KEY=
BREVO_SENDER_EMAIL=hello@haxrsignature.com
BREVO_SENDER_NAME=HAXR Signature
CRON_SECRET=                    # protege APIs /api/marketing/*
```

### Listas (por campanha do piloto)

```env
BREVO_MARKETING_LIST_ID=        # campaign_services_intro
BREVO_LIST_LEADS=               # campaign_haxr_concierge_educacao (parcial)
BREVO_CLIENTS_LIST_ID=          # campaign_haxr_concierge_educacao, campaign_corporate_intro
BREVO_SUPPLIERS_LIST_ID=        # campaign_fornecedores_convite
```

### Logo em email (Outlook)

```env
NEXT_PUBLIC_SITE_URL=https://www.haxrsignature.com
HAXR_PUBLIC_LOGO_URL=https://www.haxrsignature.com/images/brand/logo-horizontal-gold.png
```

### Testes (sem produção)

```env
EMAIL_SEND_MODE=disabled        # ou test
BREVO_TEST_RECIPIENT=           # obrigatório se mode=test
```

### Produção (só após checklist)

```env
EMAIL_SEND_MODE=production
```

---

## Comandos

### 1. Checklist do piloto (sem envio)

```bash
npm run email:pilot
```

### 2. Pré-visualizar template localmente (sem envio se disabled)

```bash
npm run email:test -- haxr_services_intro
npm run email:test -- haxr_concierge_intro
npm run email:test -- supplier_invitation
npm run email:test -- corporate_events_intro
```

### 3. Criar rascunho no Brevo (não envia)

**Opção A — script directo:**

```bash
npm run email:draft -- campaign_services_intro
npm run email:draft -- campaign_haxr_concierge_educacao
npm run email:draft -- campaign_fornecedores_convite
npm run email:draft -- campaign_corporate_intro
```

**Opção B — API (servidor a correr):**

```bash
curl -X POST http://localhost:3000/api/marketing/campaigns/draft \
  -H "Authorization: Bearer SEU_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d "{\"campaignId\":\"campaign_services_intro\",\"firstName\":\"Convidado\"}"
```

Resposta esperada: `{ "ok": true, "campaignId": <brevo_id>, "name": "...", "listIds": [...] }`

### 4. Verificar Brevo

```bash
npm run verify:brevo
```

---

## Checklist antes do primeiro envio em produção

### Infraestrutura

- [ ] `BREVO_API_KEY` configurada (server-side apenas)
- [ ] Domínio autenticado no Brevo (SPF / DKIM / DMARC)
- [ ] `BREVO_SENDER_EMAIL` e `BREVO_SENDER_NAME` correctos
- [ ] Listas Brevo criadas e IDs em env vars
- [ ] Logo email: URL HTTPS pública (`npm run email:pilot` → Safe for email: yes)

### Conteúdo

- [ ] Template testado em Outlook + Gmail (`npm run email:test` com `EMAIL_SEND_MODE=test`)
- [ ] CTAs e links HTTPS verificados em mobile
- [ ] Unsubscribe activo no editor Brevo (`{{ unsubscribe }}` nos templates)
- [ ] Plain-text presente (gerado por `buildPlainTextEmail`)

### Audiência e compliance

- [ ] Contactos com consentimento ou outreach seleccionado documentado
- [ ] Cold outreach: **nunca** listas compradas ou aleatórias
- [ ] Lista revista manualmente no painel Brevo antes de enviar
- [ ] Tamanho da lista confirmado (piloto = lote pequeno)

### Gates

- [ ] `EMAIL_SEND_MODE=production` definido conscientemente
- [ ] Equipa alinhada: envio requer `confirm: "SEND_HAXR_MARKETING"` + `dryRun: false`
- [ ] Rascunho criado e revisto no painel Brevo
- [ ] Envio agendado ou manual no Brevo **após** aprovação humana

### Pós-piloto

- [ ] Métricas: aberturas, cliques, unsubscribes, bounces
- [ ] Respostas «remover» processadas em 24h
- [ ] Seguimento: `campaign_soft_follow_up` apenas para quem não respondeu

---

## Envio programático de campanha (referência)

O envio bulk via código está em `sendMarketingCampaign()` e **não deve ser usado** sem revisão humana do rascunho no painel Brevo.

Requisitos simultâneos:

```json
{
  "campaignId": 123,
  "listId": 5,
  "confirm": "SEND_HAXR_MARKETING",
  "dryRun": false
}
```

Com `EMAIL_SEND_MODE=production`.

**Recomendação do piloto:** criar rascunho via `npm run email:draft`, rever no painel Brevo, e enviar manualmente na primeira vez.

---

## Ficheiros relevantes

| Ficheiro | Função |
|----------|--------|
| `src/lib/email/marketing/marketing-campaigns.ts` | Definição de campanhas |
| `src/lib/email/marketing/marketing-templates.ts` | Templates HTML/text |
| `src/lib/email/marketing/marketing-lists.ts` | Segmento → lista |
| `src/lib/email/marketing/marketing-service.ts` | Draft + sync contactos |
| `src/lib/email/marketing/marketing-audit.ts` | Checklist automatizado |
| `src/lib/email/brevo-client.ts` | Gates de envio Brevo |
| `scripts/marketing-pilot-info.mjs` | Relatório do piloto |
| `scripts/create-marketing-draft.mjs` | Criar rascunho sem enviar |

---

## Relacionado

- [BREVO_CAMPAIGNS.md](./BREVO_CAMPAIGNS.md) — transaccional vs bulk
- `.env.example` — variáveis de email marketing
