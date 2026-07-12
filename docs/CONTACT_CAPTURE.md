# HAXR — Captura de Contactos de Marketing

Sistema de captura segmentada antes do piloto de campanhas Brevo.

## Fluxo

```
Formulário público (site)
    ↓
API route (Zod + rate limit + honeypot)
    ↓
captureMarketingContact()
    ├─ Supabase marketing_contacts (se configurado)
    └─ syncMarketingContact() → Brevo (só se consentStatus = granted)
```

**Não dispara campanhas.** **Não altera `EMAIL_SEND_MODE`.**

## Formulários

| Formulário | Rota API | Segmento | Source |
|------------|----------|----------|--------|
| Newsletter | `POST /api/marketing/newsletter` | `newsletter` | `newsletter_signup` |
| Pedido de orçamento | `POST /api/marketing/quote` | `clientes_interessados` / `casais_noivos` / `prospects_corporativos` | `quote_request` |
| Fornecedor | `POST /api/marketing/supplier-leads` | `fornecedores` | `supplier_join_form` |

UI:
- Newsletter → footer + secção `CuratedNewsletter`
- Orçamento → `/contacto` (`QuoteRequestForm`)
- Fornecedor → `/contacto?intent=fornecedor` ou `/for-pros`

## Consentimento

Texto obrigatório no checkbox:

> Aceito receber comunicações da HAXR Signature sobre serviços, eventos e novidades. Posso cancelar a qualquer momento.

Estados: `granted` | `pending` | `denied`

**Apenas `granted` sincroniza para listas Brevo.**

## Mapeamento segmento → lista Brevo

| Segmento | Lista env |
|----------|-----------|
| `newsletter` | `BREVO_LIST_NEWSLETTER` |
| `clientes_interessados`, `leads_site`, `casais_noivos` | `BREVO_LIST_LEADS`, `BREVO_CLIENTS_LIST_ID` |
| `fornecedores` | `BREVO_SUPPLIERS_LIST_ID` |
| `prospects_corporativos`, `contactos_seleccionados` | `BREVO_MARKETING_LIST_ID` |

Se listas em falta: lead aceite, sucesso ao utilizador, warning interno no log.

## Listas Brevo (setup)

Garantir ou criar listas no Brevo (**não envia emails nem campanhas**):

```bash
npm run brevo:ensure-lists
```

| Lista Brevo | Variável env | Uso na captura |
|-------------|--------------|----------------|
| Leads HAXR / HAXR · Leads Website | `BREVO_LIST_LEADS` | Orçamentos, leads gerais, casais |
| Newsletter HAXR / HAXR · Newsletter | `BREVO_LIST_NEWSLETTER` | Footer, `CuratedNewsletter` |
| Fornecedores HAXR | `BREVO_SUPPLIERS_LIST_ID` | `/contacto?intent=fornecedor`, `/for-pros` |
| Clientes HAXR | `BREVO_CLIENTS_LIST_ID` | Casais, corporativo (segmentação CRM) |
| Marketing HAXR | `BREVO_MARKETING_LIST_ID` | Prospects corporativos, outreach futuro |

Pasta recomendada no Brevo: **HAXR Signature**.

O script reutiliza listas existentes, cria só as em falta, imprime IDs e um bloco sugerido para `.env.local` — **não altera o ficheiro automaticamente**.

Após configurar env:

```bash
node scripts/contact-capture-readiness.mjs
node scripts/post-migration-contact-capture.mjs --base http://localhost:3000
```

Ver também: [BREVO_CAMPAIGNS.md](./BREVO_CAMPAIGNS.md)

## Migração

```bash
# Aplicar em Supabase
supabase/migrations/029_marketing_contacts.sql
```

## TODO (importação manual)

- [ ] Importação CSV
- [ ] Detecção de duplicados
- [ ] Rastreio de fonte de consentimento
- [ ] Sync bulk Brevo pós-importação

## Ficheiros

- `src/lib/email/marketing/marketing-contact.ts` — contrato `MarketingContact`
- `src/lib/email/marketing/contact-capture.ts` — orquestração
- `src/lib/email/marketing/marketing-contacts.repository.ts` — Supabase
- `src/lib/email/email-schemas.ts` — validação Zod
- `src/components/marketing/forms/*` — UI

Ver também: [MARKETING_PILOT_LAUNCH.md](./MARKETING_PILOT_LAUNCH.md)
