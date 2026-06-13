# HAXR Signature — Website institucional e painel admin

Site institucional premium para a **HAXR Signature** (convites digitais, save the date, sites e branding em Moçambique), com **painel administrativo** completo: documentos, clientes, leads, eventos com convidados e **caixa financeira**.

**Produção:** [haxrsignature.vercel.app](https://haxrsignature.vercel.app)

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 15 (App Router), React 19, TypeScript |
| Estilos | Tailwind CSS 4 |
| Base de dados | Supabase (PostgreSQL) |
| Auth admin | Cookie HMAC (`ADMIN_SESSION_SECRET`) |
| Email | Resend (formulário de contacto) |
| Deploy | Vercel |

---

## Estrutura do projecto

```
src/
├── app/
│   ├── page.tsx                    # Home
│   ├── servicos/                   # Serviços
│   ├── portfolio/                  # Portfólio
│   ├── sobre/                      # Sobre
│   ├── contacto/                   # Contacto + formulário
│   ├── admin/                      # Painel administrativo
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── documents/
│   │   ├── clients/
│   │   ├── leads/
│   │   ├── events/                 # Gestão de eventos
│   │   └── cash/                   # Caixa financeira
│   ├── event/[id]/                 # Páginas públicas por evento
│   │   ├── find-seat/              # Consulta de lugar
│   │   ├── rsvp/[token]/           # Confirmação RSVP
│   │   └── checkin/[token]/        # Check-in QR
│   └── api/
│       ├── contact/                # POST formulário
│       ├── events/                 # find-seat, rsvp, checkin
│       └── admin/                  # Auth admin
├── components/
│   ├── admin/                      # UI do painel
│   ├── events/                     # Convidados, lugares, relatórios
│   └── ...                         # Site institucional
└── lib/
    ├── admin/                      # Auth, repositórios admin
    ├── events/                     # Eventos, convidados, Sheets, export
    └── finance/                    # Pagamentos, despesas, metas

supabase/migrations/                # SQL — executar por ordem no Supabase
```

---

## Site institucional

- Hero, serviços, portfólio, sobre, contacto
- Formulário de contacto → Supabase (`leads`) + email via Resend
- SEO: metadata, sitemap, robots, JSON-LD
- WhatsApp flutuante, design responsivo mobile-first

---

## Painel admin (`/admin`)

Acesso protegido por email/password (variáveis `ADMIN_EMAIL` / `ADMIN_PASSWORD`) e sessão assinada com HMAC.

| Módulo | Rota | Funções |
|--------|------|---------|
| Dashboard | `/admin/dashboard` | KPIs globais, eventos activos, resumo financeiro |
| Documentos | `/admin/documents` | CRUD de documentos internos |
| Clientes | `/admin/clients` | CRUD de clientes |
| Leads | `/admin/leads` | Leads do formulário de contacto |
| Eventos | `/admin/events` | Convidados, lugares, Sheets, check-in, relatório |
| Caixa | `/admin/cash` | Pagamentos, despesas, metas, export CSV/PDF |

---

## Módulo Eventos

Cada evento tem **8 separadores** no admin:

1. **Convidados** — lista, filtros (todos / por confirmar / RSVP Sheets), KPIs, etiquetas, bulk actions, import CSV, links WhatsApp (`wa.me`)
2. **Lugares** — mesas e atribuição de lugares
3. **Atelier QR** — geração de QR para check-in e RSVP
4. **Google Sheets** — sync bidireccional (import da sheet + export CSV para reimportar)
5. **Check-in** — presença manual e via QR
6. **Relatório** — export CSV/PDF, vista mapa A4 para impressão
7. **Histórico** — audit log de alterações a convidados
8. **Definições** — dados do evento, modo Sheets, etc.

### Páginas públicas

| Rota | Descrição |
|------|-----------|
| `/event/[id]/find-seat` | Convidado consulta o seu lugar |
| `/event/[id]/rsvp/[token]` | Confirmação de presença (RSVP) |
| `/event/[id]/checkin/[token]` | Check-in no dia do evento |

### Google Sheets — modos de sync

| Modo | Uso |
|------|-----|
| `master` | A sheet é a fonte de verdade — importa todos os convidados |
| `rsvp` | A sheet tem coluna de confirmação — sync marca confirmados vs pendentes |

O modo é detectado automaticamente pelos cabeçalhos da sheet (`sheets_sync_mode` na tabela `events`). Convidados importados ficam com `guest_source`: `manual`, `sheet_master` ou `sheet_rsvp`.

### Campos extra de convidados

- Acompanhantes (`plus_ones`)
- Restrições alimentares (`dietary_notes`)
- Notas internas (`guest_notes`)
- Etiquetas (`guest_label`)

---

## Módulo Caixa (`/admin/cash`)

- **Pagamentos** recebidos (método, valor, data, cliente/evento)
- **Despesas** operacionais
- **Metas mensais** de receita
- **Analytics** — totais, comparação com metas
- **Export** CSV e PDF

---

## Base de dados (Supabase)

Executar as migrations **por ordem** no SQL Editor do Supabase:

| # | Ficheiro | Conteúdo |
|---|----------|----------|
| 001 | `001_admin_documents.sql` | Documentos admin |
| 002 | `002_admin_clients.sql` | Clientes |
| 003 | `003_admin_leads.sql` | Leads |
| 004 | `004_admin_company_profiles.sql` | Perfis de empresa |
| 005 | `005_admin_sessions.sql` | Sessões admin |
| 006 | `006_events_seating.sql` | Eventos, convidados, mesas, check-in |
| 007 | `007_events_google_sheets.sql` | Colunas Google Sheets em `events` |
| 008 | `008_payments.sql` | Tabela `payments` |
| 009 | `009_finance_extras.sql` | Despesas e metas mensais |
| 010 | `010_guest_extras.sql` | Plus ones, notas, RPC `perform_event_rsvp` |
| 011 | `011_guest_advanced.sql` | Etiquetas e audit log |
| 012 | `012_sheets_rsvp_mode.sql` | Modo RSVP Sheets e `guest_source` |

---

## Variáveis de ambiente

Copiar `.env.example` para `.env.local` e preencher:

```env
NEXT_PUBLIC_SITE_URL=https://haxrsignature.vercel.app
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=...

ADMIN_EMAIL=admin@haxrsignature.co.mz
ADMIN_PASSWORD=password-segura
ADMIN_SESSION_SECRET=string-aleatoria-longa

NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=HAXR Signature <noreply@seudominio.co.mz>
CONTACT_NOTIFY_EMAIL=haxrsignature@gmail.com
```

Em produção (Vercel), definir as mesmas variáveis no painel do projecto.

---

## Desenvolvimento local

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000). Admin em `/admin/login`.

```bash
npm run build    # verificar build de produção
npm run lint     # ESLint
```

---

## Deploy (Vercel)

```bash
npx vercel --prod
```

Ou push para `main` se o projecto Vercel estiver ligado ao repositório GitHub (deploy automático).

### Checklist pós-deploy

- [ ] Variáveis de ambiente configuradas na Vercel
- [ ] Migrations 001–012 executadas no Supabase de produção
- [ ] Login admin funcional em `/admin/login`
- [ ] Formulário de contacto envia email e grava lead
- [ ] Páginas públicas de evento (RSVP, check-in, find-seat) acessíveis

---

## Repositório

GitHub: [github.com/MrDimande/haxrsignatureweb](https://github.com/MrDimande/haxrsignatureweb)

---

## Licença

Projecto privado — HAXR Signature © 2026–2027.
