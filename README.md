# HAXR Signature

**Plataforma institucional e operacional para experiências digitais premium.**

Convites digitais, save the date, gestão de eventos e fluxo comercial integrado — num único sistema desenhado para a HAXR Signature operar em Moçambique com rigor, elegância e escala.

**Produção** → [haxrsignature.vercel.app](https://haxrsignature.vercel.app)  
**Repositório** → [github.com/MrDimande/haxrsignatureweb](https://github.com/MrDimande/haxrsignatureweb)

---

## Visão geral

A HAXR Signature não é apenas um site. É um **ecossistema operacional**:

- **Frente pública** — presença institucional premium, SEO optimizado, formulário de contacto e páginas públicas por evento.
- **Painel administrativo** — clientes, documentos comerciais, eventos com convidados, caixa financeira e vista 360° do cliente.
- **Fluxo comercial contínuo** — sem silos, sem duplicação manual de dados entre módulos.

```
Cliente → Evento → RSVP → Convidados → Seating → Find Your Seat
       → Proforma → Factura → Recibo → Pagamento
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
| Email | Resend |
| Animação | GSAP · Framer Motion · Lenis |
| Auth admin | Sessão HMAC em cookie `httpOnly` |
| Deploy | Vercel |

---

## Arquitectura do projecto

```
src/
├── app/
│   ├── (marketing)/              # Site institucional (single-page)
│   ├── admin/                    # Painel administrativo
│   │   ├── page.tsx              # Login (/admin)
│   │   └── (panel)/
│   │       ├── dashboard/
│   │       ├── clients/[id]/     # Vista 360° do cliente
│   │       ├── documents/
│   │       ├── events/[id]/
│   │       ├── leads/
│   │       ├── cash/
│   │       └── settings/         # Empresas e catálogo
│   ├── event/[eventId]/          # Páginas públicas por evento
│   │   ├── find-seat/
│   │   ├── rsvp/[token]/
│   │   └── checkin/[token]/
│   └── api/
│       ├── contact/
│       ├── events/                 # find-seat · rsvp · checkin
│       └── admin/                  # login · logout
├── components/
│   ├── sections/                 # Secções do site institucional
│   ├── admin/                    # UI do painel
│   └── events/                   # Convidados, lugares, relatórios
└── lib/
    ├── admin/                    # Auth, repositórios, facturação
    ├── events/                   # Eventos, Sheets, RSVP, export
    ├── finance/                  # Pagamentos, despesas, metas
    ├── contact/                  # Formulário e leads
    └── security/                 # Rate limiting

supabase/migrations/              # SQL — executar por ordem
```

---

## Site institucional

Landing page editorial com secções modulares:

| Secção | Conteúdo |
|--------|----------|
| Hero | Entrada visual forte com animação |
| Philosophy | Posicionamento da marca |
| Universe | Universo HAXR |
| Digital Invitations | Convites digitais |
| Experiences | Experiências e serviços |
| Method | Metodologia de trabalho |
| Management | Gestão de eventos |
| Archive | Portfólio / arquivo |
| Contact | Formulário validado |

**Incluído:** SEO completo (metadata, sitemap, robots, JSON-LD), scroll suave, design responsivo mobile-first, botão WhatsApp, formulário com honeypot e rate limit.

---

## Painel administrativo

Acesso em `/admin`, protegido por credenciais (`ADMIN_EMAIL` / `ADMIN_PASSWORD`) e sessão assinada com HMAC (`ADMIN_SESSION_SECRET`).

| Módulo | Rota | Função |
|--------|------|--------|
| Dashboard | `/admin/dashboard` | KPIs globais, pipeline de eventos, resumo financeiro |
| Clientes | `/admin/clients` | CRUD e perfil comercial 360° |
| Documentos | `/admin/documents` | Proformas, facturas e recibos com PDF |
| Eventos | `/admin/events` | Convidados, lugares, Sheets, check-in, relatórios |
| Caixa | `/admin/cash` | Pagamentos, despesas, metas, analytics, export |
| Leads | `/admin/leads` | Pedidos do formulário de contacto |
| Definições | `/admin/settings` | Empresas (multi-negócio) e catálogo de serviços |

Todas as server actions passam por `requireAdmin()`. O middleware protege rotas `/admin/*` e `/api/admin/*`.

---

## Fluxo comercial integrado

O sistema liga os módulos existentes numa cadeia operacional contínua.

### Cliente → Evento

- Campo `client_id` em `events` (FK para `clients`)
- Selector de cliente com pesquisa rápida na criação/edição de eventos
- Criação de evento directa a partir do perfil do cliente

### Evento → Facturação

- Campo `event_id` em `documents` (FK para `events`)
- Ao seleccionar um evento numa proforma, factura ou recibo, preenche automaticamente:
  - cliente
  - nome do evento
  - local
  - data
- Campos editáveis manualmente quando necessário

### Evento → Pagamentos

- Pagamentos associados a cliente, evento e documento
- Registo rápido a partir de documentos enviados
- Geração automática de recibo ao registar pagamento

### Vista 360° do cliente

Em `/admin/clients/[id]`:

- **KPIs** — eventos, valor facturado, valor recebido, saldo pendente
- **Eventos** — lista com link directo
- **Documentos** — proformas, facturas e recibos
- **Pagamentos** — histórico financeiro
- **Acções rápidas** — novo evento, nova proforma, registar pagamento

---

## Módulo Eventos

Cada evento no admin tem **8 separadores**:

| Separador | Capacidades |
|-----------|-------------|
| Convidados | Lista, filtros, KPIs, etiquetas, acções em massa, import CSV, WhatsApp |
| Lugares | Mesas e atribuição de lugares |
| Atelier QR | Geração de QR para check-in e RSVP |
| Sheets | Sync bidireccional com Google Sheets |
| Check-in | Presença manual e via QR |
| Relatório | Export CSV/PDF, mapa A4 para impressão |
| Histórico | Audit log de alterações a convidados |
| Definições | Dados do evento, cliente associado, modo Sheets |

### RSVP Premium

- Estados: pendente, confirmado, recusado, presente
- Campos: acompanhantes, restrições alimentares, notas
- Página pública com validação Zod e design premium

### Google Sheets — modos de sync

| Modo | Comportamento |
|------|---------------|
| `master` | A sheet é a fonte de verdade — importa todos os convidados |
| `rsvp` | A sheet tem coluna de confirmação — sync de confirmados vs pendentes |

O modo é detectado automaticamente pelos cabeçalhos. Convidados importados ficam com `guest_source`: `manual`, `sheet_master` ou `sheet_rsvp`.

### Páginas públicas por evento

| Rota | Função |
|------|--------|
| `/event/[eventId]/find-seat` | Consulta de lugar por nome |
| `/event/[eventId]/rsvp/[token]` | Confirmação ou recusa de presença |
| `/event/[eventId]/checkin/[token]` | Check-in no dia do evento |

Tokens QR gerados com `randomBytes(24)` — entropia de ~192 bits.

---

## Facturação

Documentos comerciais com numeração atómica, multi-negócio e export PDF.

| Tipo | Prefixo | Uso |
|------|---------|-----|
| Proforma | PRO | Orçamento prévio |
| Factura | FAT | Cobrança formal |
| Recibo | REC | Comprovativo de pagamento |

- Catálogo de serviços integrado no formulário
- Assinaturas digitais por negócio
- Suporte a MZN, USD e ZAR
- Linhas de serviço com cálculo automático de totais e IVA

---

## Caixa financeira

Módulo `/admin/cash` com visão editorial de receitas e despesas.

- **Pagamentos** — método, valor, data, cliente, evento, documento
- **Despesas** — custos operacionais por evento
- **Metas mensais** — objectivos de receita
- **Analytics** — gráficos, margens, alertas de saldo em atraso
- **Export** — CSV e PDF para relatórios

---

## Segurança

| Medida | Implementação |
|--------|---------------|
| Auth admin | Cookie `httpOnly` · `secure` · `sameSite: strict` · HMAC-SHA256 |
| Server actions | `requireAdmin()` em todas as mutações |
| Service role | `SUPABASE_SERVICE_ROLE_KEY` apenas no servidor — nunca no cliente |
| RLS eventos | Tabelas `events`, `guests`, `seats` com RLS sem policies para `anon` |
| Rate limiting | Login (5 falhas / 15 min), find-seat (20/min), RSVP/check-in (30/min) |
| Contacto | Honeypot + limite de 3 pedidos/hora por email |
| Headers | `X-Frame-Options: DENY` · `X-Content-Type-Options: nosniff` no admin |

**Recomendação de produção:** definir `ADMIN_SESSION_SECRET` independente da password admin.

---

## Base de dados

Executar as migrations **por ordem** no SQL Editor do Supabase:

| # | Ficheiro | Conteúdo |
|---|----------|----------|
| 001 | `001_admin_schema.sql` | Schema base: negócios, clientes, documentos, catálogo |
| 002 | `002_business_v2.sql` | Evolução multi-negócio |
| 003 | `003_sync_site_catalog.sql` | Sincronização catálogo site |
| 004 | `004_business_signatures.sql` | Assinaturas por negócio |
| 005 | `005_contact_inquiries.sql` | Leads do formulário de contacto |
| 006 | `006_events_seating.sql` | Eventos, convidados, mesas, check-in, RLS |
| 007 | `007_events_google_sheets.sql` | Integração Google Sheets |
| 008 | `008_payments.sql` | Pagamentos |
| 009 | `009_finance_extras.sql` | Despesas e metas mensais |
| 010 | `010_guest_extras.sql` | Plus ones, notas, RPC RSVP |
| 011 | `011_guest_advanced.sql` | Etiquetas e audit log |
| 012 | `012_sheets_rsvp_mode.sql` | Modo RSVP Sheets e `guest_source` |
| 013 | `013_rsvp_premium.sql` | RSVP premium, estado `declined`, lookup enriquecido |
| 014 | `014_service_category_enums.sql` | Enums de categorias de serviço |
| 015 | `015_catalog_commercial_seed.sql` | Seed do catálogo comercial |
| 016 | `016_commercial_flow.sql` | `client_id` em eventos · `event_id` em documentos |

> **Nota PostgreSQL:** os ficheiros 014 e 015 estão separados porque o PostgreSQL não permite usar novos valores enum na mesma transacção do `ALTER TYPE`.

---

## Variáveis de ambiente

Copiar `.env.example` para `.env.local`:

```env
# Site
NEXT_PUBLIC_SITE_URL=https://haxrsignature.vercel.app
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=...

# Admin
ADMIN_EMAIL=admin@haxrsignature.co.mz
ADMIN_PASSWORD=password-segura
ADMIN_SESSION_SECRET=string-aleatoria-longa

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Email (Resend)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=HAXR Signature <noreply@seudominio.co.mz>
CONTACT_NOTIFY_EMAIL=haxrsignature@gmail.com
```

Em produção, definir as mesmas variáveis no painel Vercel. Nunca commitar `.env.local`.

---

## Desenvolvimento local

```bash
npm install
npm run dev
```

| Comando | Função |
|---------|--------|
| `npm run dev` | Servidor de desenvolvimento em `localhost:3000` |
| `npm run build` | Build de produção |
| `npm run start` | Servidor de produção local |
| `npm run lint` | ESLint |

- Site → [http://localhost:3000](http://localhost:3000)
- Admin → [http://localhost:3000/admin](http://localhost:3000/admin)

---

## Deploy

Push para `main` no GitHub dispara deploy automático na Vercel.

```bash
git push origin main
```

Deploy manual:

```bash
npx vercel --prod
```

### Checklist pós-deploy

- [ ] Variáveis de ambiente configuradas na Vercel
- [ ] `ADMIN_SESSION_SECRET` definido (independente da password)
- [ ] Migrations 001–016 executadas no Supabase de produção
- [ ] Login admin funcional em `/admin`
- [ ] Formulário de contacto envia email e grava lead
- [ ] Fluxo comercial: cliente → evento → documento → pagamento
- [ ] Páginas públicas de evento (RSVP, check-in, find-seat) acessíveis

---

## Backlog (Fase 2)

Funcionalidades planeadas, fora do âmbito actual:

- QR individual por convidado
- Realtime / scanner QR
- Arquivamento de eventos na UI
- Regeneração de tokens
- Auditoria avançada
- Rate limiting distribuído (Redis / Supabase)

---

## Licença

Projecto privado — **HAXR Signature** © 2026–2027.
