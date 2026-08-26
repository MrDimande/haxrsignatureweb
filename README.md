# HAXR Signature

**Plataforma institucional e operacional para experiências digitais premium.**

Assessoria de eventos, convites digitais, gestão de convidados (RSVP, Find Your Seat, check-in) e fluxo comercial integrado — num único sistema desenhado para a HAXR Signature operar em Moçambique com rigor, elegância e escala.

| Recurso | URL |
|---------|-----|
| **Website (canónico)** | [www.haxrsignature.com](https://www.haxrsignature.com) |
| **Repositório** | [github.com/MrDimande/haxrsignatureweb](https://github.com/MrDimande/haxrsignatureweb) |

O domínio `haxrsignature.com` redirecciona para `www`. URLs `*.vercel.app` não devem ser indexadas — o middleware e o Google Search Console apontam sempre para o domínio oficial.

---

## Ecossistema de canais (tudo ligado)

Os canais da HAXR Signature **devem comunicar entre si** — o mesmo tom, os mesmos contactos e o mesmo funil. A fonte única de verdade para links públicos é `src/lib/site-config.ts` → `siteContact`. Alterar aí propaga para site, footer, formulários, emails e SEO.

| Canal | Identidade oficial | Onde aparece no sistema | Liga a |
|-------|-------------------|-------------------------|--------|
| **Website** | [www.haxrsignature.com](https://www.haxrsignature.com) | Páginas marketing, admin, convites por evento | Formulário → Supabase · Resend · Brevo |
| **Email** | [hello@haxrsignature.com](mailto:hello@haxrsignature.com) | Footer, contacto, `replyTo` em todos os emails | Caixa principal · aliases Resend (`rsvp@`, `eventos@`, …) |
| **WhatsApp** | [+258 87 088 3428](https://wa.me/258870883428) | Botão flutuante, footer, contacto, admin (convidados, documentos) | Propostas · RSVP em massa · follow-up comercial |
| **Instagram** | [@haxrsignature](https://www.instagram.com/haxrsignature/) | Footer, página contacto, JSON-LD (`sameAs`) | Marca · portfólio · tráfego para o site |
| **Facebook** | *A configurar* | `siteContact.facebook` (actualmente `null`) | Quando activo: mesmo padrão que Instagram no footer e SEO |

### Fluxo omnicanal

```
Instagram / Facebook / WhatsApp
         │
         ▼
   Website (SEO + páginas de serviço)
         │
         ├── Formulário /contacto ──► Supabase (leads)
         │         ├──► Resend → hello@ (notificação + auto-resposta)
         │         └──► Brevo → listas Leads / Newsletter + funil dias 0–21
         │
         ├── Convite digital do evento ──► RSVP público ──► email/telefone na BD
         │
         └── Admin ──► reenvio convite email · WhatsApp em massa · facturação
```

### Regras de consistência

1. **Um só número WhatsApp** em site, emails e redes — o definido em `siteContact.whatsapp`.
2. **Um só email de resposta** — `hello@haxrsignature.com` (ou `CONTACT_NOTIFY_EMAIL` para notificações internas).
3. **Instagram e Facebook** devem apontar para o mesmo site e usar a mesma linguagem de marca.
4. **Emails transaccionais** (Resend) e **marketing** (Brevo) partilham remetente de marca: `HAXR Signature <hello@haxrsignature.com>`.
5. Ao activar **Facebook**, preencher em `site-config.ts`:

```ts
facebook: {
  href: "https://www.facebook.com/haxrsignature",
  label: "HAXR Signature",
},
```

O footer e o JSON-LD passam a incluir automaticamente o link em `sameAs`.

---

## Visão geral

A HAXR Signature não é apenas um site. É um **ecossistema operacional**:

- **Frente pública** — site editorial multi-página, SEO optimizado, experiências ao vivo e formulário de contacto.
- **Painel administrativo** — clientes, documentos, eventos com convidados, caixa financeira e vista 360° do cliente.
- **Fluxo comercial contínuo** — sem silos entre website, email, WhatsApp e CRM.

```
Cliente → Evento → RSVP → Convidados → Seating → Find Your Seat → Check-in
       → Proforma → Factura → Recibo → Pagamento
       → Lead (site) → Brevo funil → Reunião comercial
```

---

## Stack técnica

| Camada | Tecnologia |
|--------|------------|
| Framework | Next.js 15 · App Router · React 19 · TypeScript |
| Estilos | Tailwind CSS 4 |
| Base de dados | Supabase · PostgreSQL |
| Validação | Zod · React Hook Form |
| PDF | `@react-pdf/renderer` |
| Email transaccional | Resend (`hello@`, `rsvp@`, canais por contexto) |
| Email marketing | Brevo (leads, newsletter, funil automático) |
| Animação | GSAP · Framer Motion · Lenis |
| Auth admin | Sessão HMAC em cookie `httpOnly` |
| Deploy | Vercel → domínio `www.haxrsignature.com` |

---

## Arquitectura do projecto

```
src/
├── app/
│   ├── (marketing)/              # Site institucional (páginas editoriais)
│   │   ├── assessoria-eventos/
│   │   ├── convites-identidade-visual/
│   │   ├── gestao-convidados/
│   │   ├── plataforma-eventos/
│   │   ├── portfolio/ · insights/ · contacto/ · sobre/
│   │   └── experiencias/[slug]/  # Casos reais (convites ao vivo)
│   ├── admin/                    # Painel administrativo
│   ├── event/[eventId]/          # RSVP · find-seat · check-in (noindex)
│   ├── sitemap.ts · robots.ts
│   └── api/                      # contact · events · cron/brevo-funnel
├── components/
│   ├── marketing/ · sections/ · layout/
│   ├── admin/ · events/ · seo/
└── lib/
    ├── site-config.ts            # ★ Contactos oficiais (WhatsApp, IG, email)
    ├── marketing/seo.ts          # Metadata por página
    ├── seo/                      # JSON-LD, sitemap, redirects, canonical
    ├── contact/ · email/         # Formulário + templates Resend
    ├── events/                   # Convidados, RSVP, convites email, Sheets
    ├── admin/ · finance/
    └── security/

supabase/migrations/              # 001–024 — executar por ordem
docs/                             # ELEVATION_REPORT, BREVO_CAMPAIGNS, RESEND_DNS_AUDIT
```

---

## Site institucional

Páginas editoriais com SEO e JSON-LD por serviço:

| Página | Rota | Foco de pesquisa |
|--------|------|------------------|
| Home | `/` | Marca + visão geral |
| Assessoria | `/assessoria-eventos` | Casamentos, wedding planner Maputo |
| Convites | `/convites-identidade-visual` | Convites digitais, save the date |
| Convidados | `/gestao-convidados` | RSVP, Find Your Seat, seating plan |
| Plataforma | `/plataforma-eventos` | Operação e tecnologia HAXR |
| Portfólio | `/portfolio` | Casos reais |
| Contacto | `/contacto` | Propostas · WhatsApp · email |
| Experiências | `/experiencias/[slug]` | Demos de convites ao vivo |

**Incluído:** metadata por rota, sitemap XML, robots.txt, JSON-LD (Organização, Serviços, FAQ), redirects SEO (`/find-your-seat`, `/wedding-planner`, …), botão WhatsApp fixo, formulário com honeypot e rate limit.

---

## Painel administrativo

Acesso em `/admin`, protegido por credenciais e sessão HMAC.

| Módulo | Rota | Função |
|--------|------|--------|
| Dashboard | `/admin/dashboard` | KPIs, pipeline, resumo financeiro |
| Clientes | `/admin/clients` | CRUD e perfil 360° |
| Documentos | `/admin/documents` | Proformas, facturas, recibos PDF |
| Eventos | `/admin/events` | Convidados, lugares, Sheets, check-in, **reenvio convite email** |
| Caixa | `/admin/cash` | Pagamentos, despesas, metas, analytics |
| Leads | `/admin/leads` | Pedidos do formulário (sync Brevo) |
| Definições | `/admin/settings` | Empresas e catálogo |

---

## Módulo Eventos (destaques)

| Capacidade | Descrição |
|------------|-----------|
| Convidados | Import CSV (Nome, Email, Telefone), filtros, WhatsApp em massa |
| Email convite | Reenvio individual ou em lote via Resend (link RSVP personalizado) |
| RSVP público | Recolhe email/telefone → grava na BD → email de confirmação |
| Find Your Seat | `/event/[id]/find-seat` — consulta de lugar por nome |
| Check-in | QR Code e registo de presença |
| Google Sheets | Sync `master` ou `rsvp` |

Páginas de evento têm `noindex` — não aparecem no Google; o site institucional sim.

---

## SEO e indexação

| Recurso | Ficheiro |
|---------|----------|
| URL canónica | `src/lib/seo/canonical-host.ts` |
| Metadata global | `src/lib/seo/site-meta.ts` |
| Metadata por página | `src/lib/marketing/seo.ts` |
| Sitemap | `src/app/sitemap.ts` + `src/lib/seo/sitemap-config.ts` |
| Redirects SEO | `src/lib/seo/redirects.ts` |
| JSON-LD | `src/lib/seo/jsonld.ts` |
| Robots | `src/app/robots.ts` |

**Produção:** `NEXT_PUBLIC_SITE_URL=https://www.haxrsignature.com`

**Google Search Console:** sitemap `https://www.haxrsignature.com/sitemap.xml` · remoção de URLs `vercel.app` se ainda indexadas.

---

## Email (Resend) e marketing (Brevo)

| Serviço | Papel | Liga ao canal |
|---------|-------|---------------|
| **Resend** | Transaccional — contacto, convites, RSVP, confirmações | `hello@` · `replyTo` para conversa contínua |
| **Brevo** | CRM — leads, newsletter, funil dias 0 / 3 / 7 / 14 / 21 | Mesmo email do lead · atributos `PROJECT_TYPE`, etc. |

### Formulário de contacto

1. Grava lead no Supabase (`contact_inquiries`).
2. **Resend** → notificação para `hello@` + auto-resposta ao cliente (com link WhatsApp e email no corpo).
3. **Brevo** → upsert contacto + listas (falha no Brevo não bloqueia o envio).

### Funil Brevo (cron)

`GET /api/cron/brevo-funnel` com header `Authorization: Bearer $CRON_SECRET` — configurar no Vercel Cron.

Ver: `docs/BREVO_CAMPAIGNS.md` · `npm run verify:brevo`

---

## Variáveis de ambiente

Copiar `.env.example` → `.env.local`:

```env
# Site (canónico)
NEXT_PUBLIC_SITE_URL=https://www.haxrsignature.com
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=

# Admin
ADMIN_EMAIL=admin@haxrsignature.com
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Resend
RESEND_API_KEY=
CONTACT_NOTIFY_EMAIL=hello@haxrsignature.com
RESEND_BRAND_DOMAIN=true

# Brevo
BREVO_API_KEY=
BREVO_LIST_LEADS=
BREVO_LIST_NEWSLETTER=
BREVO_SENDER_EMAIL=hello@haxrsignature.com
BREVO_SENDER_NAME=HAXR Signature
BREVO_FUNNEL_ENABLED=true

# Cron (funil Brevo na Vercel)
CRON_SECRET=
```

Sincronizar com Vercel: `npm run vercel:env`

**Nunca commitar** `.env.local` nem secrets.

---

## Base de dados

Executar migrations **por ordem** no Supabase (001–024). Destaques recentes:

| # | Conteúdo |
|---|----------|
| 019 | Segurança Find Your Seat |
| 022–024 | Tracking funil Brevo (dias 7, 14, 21) |
| 023 | Intenção no formulário de contacto |

---

## Comandos úteis

```bash
npm install
npm run dev              # http://localhost:3000
npm run build
npm run verify:qa        # auditoria rápida
npm run verify:qa -- --full
npm run verify:jsonld    # validar schemas SEO
npm run verify:brevo
npm run verify:resend    # auditoria DNS Resend
npm run sync:brevo       # leads Supabase → Brevo
```

| URL local | Destino |
|-----------|---------|
| Site | http://localhost:3000 |
| Admin | http://localhost:3000/admin |

---

## Deploy e push para GitHub

O push para `main` dispara deploy automático na Vercel.

```bash
git add README.md
git status
git commit -m "docs: README actualizado — canais integrados e estado do projecto"
git push origin main
```

Deploy manual: `npx vercel --prod`

### Checklist pós-deploy

- [ ] `NEXT_PUBLIC_SITE_URL=https://www.haxrsignature.com` na Vercel (Production)
- [ ] `RESEND_BRAND_DOMAIN=true` e domínio verificado (`npm run verify:resend`)
- [ ] Migrations 001–024 aplicadas em produção
- [ ] Formulário de contacto → email + lead + Brevo
- [ ] WhatsApp e Instagram correctos no site (footer e contacto)
- [ ] Sitemap submetido no Google Search Console
- [ ] Facebook activado em `siteContact` quando a página estiver pronta

---

## Documentação adicional

| Documento | Conteúdo |
|-----------|----------|
| `docs/ELEVATION_REPORT.md` | Evolução editorial e técnica da marca |
| `docs/BREVO_CAMPAIGNS.md` | Funil e campanhas Brevo |
| `docs/RESEND_DNS_AUDIT.md` | SPF, DKIM, DMARC |
| `docs/AREA_CLIENTE_SPEC.md` | Portal do cliente (especificação) |
| `docs/QA_FASE10_REPORT.md` | Relatório QA |

---

## Licença

Projecto privado — **HAXR Signature** © 2026–2027.
