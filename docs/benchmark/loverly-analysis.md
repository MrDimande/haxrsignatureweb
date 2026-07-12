# Benchmark Loverly.com → HAXR Signature

**Data:** 6 de Julho de 2026
**Fonte:** Firecrawl (`firecrawl_map` + `firecrawl_scrape`)
**Site analisado:** [loverly.com](https://loverly.com) · [plus.loverly.com](https://plus.loverly.com)

**Âmbito incluído:** serviços, ferramentas, fornecedores, área de cliente, inspiração, planos pagos, memberships, pricing, onboarding, contas.
**Âmbito excluído:** loja de produtos físicos (`/shop/*`), vestidos, acessórios, jóias, carrinho e checkout de itens físicos.

---

## 1. Estrutura de navegação da Loverly

### 1.1 Navegação global (header)

| Item | URL | Público |
|------|-----|---------|
| Home | `/` | Casais |
| Real Weddings | `/real-weddings` | Inspiração |
| Vendors | `/vendors` | Directório |
| Planning Advice | `/planning` | Conteúdo SEO |
| Video Series | `/tools/videos` | Educação |
| The Loverly List | `/best-wedding-vendors` | Autoridade |
| Sign in | `/sign-in` | Conta casal |
| Vendor sign-up | `/sign-up?vendor=true` | Conta fornecedor |

### 1.2 Árvore de informação (serviços e plataforma)

```
loverly.com
│
├── CONVERSÃO CASAIS
│   ├── / (hero: data do casamento → START PLANNING)
│   ├── /sign-in
│   └── Dashboard (pós-login) — checklist, budget, guests, vendors, vision boards
│
├── FERRAMENTAS (/tools/*/setup)
│   ├── ai-wedding-planner      → aiSLE Assistant™ (IA)
│   ├── guest-list              → RSVP + endereços + seating
│   ├── vendor-manager          → contratos, pagamentos
│   ├── budget-tracker          → orçamento e parcelas
│   ├── wedding-checklist       → timeline personalizada
│   ├── vision-boards           → moodboards
│   ├── cash-registry           → fundo lua de mel (Birdie)
│   ├── submit-wedding          → UGC para Real Weddings
│   ├── wedding-pro             → pricing Loverly Plus (vendors)
│   ├── create-or-claim-vendor-profile → onboarding B2B
│   └── videos                  → série em vídeo
│
├── INSPIRAÇÃO
│   ├── /real-weddings          → hub + filtros estilo/local/cor
│   ├── /albums/real-weddings/[slug] → álbum editorial
│   └── /planning               → 8 categorias + artigos
│
├── FORNECEDORES
│   ├── /vendors                → directório
│   ├── /vendors/services/[categoria] → 20+ verticais
│   ├── /vendors/[slug]         → perfil individual
│   └── /for-wedding-professionals → educação B2B
│
├── MONETIZAÇÃO B2B
│   ├── /tools/wedding-pro/setup → landing Plus
│   ├── plus.loverly.com        → pricing completo
│   ├── plus.loverly.com/payment → checkout Stripe
│   └── plus.loverly.com/venues → Venue Spotlight (custom)
│
├── AUTORIDADE & MARCA
│   ├── /best-wedding-vendors   → Loverly List anual
│   ├── /planning/wedding-101/best-* → listas por categoria
│   ├── /about-us               → missão, podcast, livro
│   ├── /i-do-crew              → masterclass gratuita (conta)
│   ├── /partner                → parcerias editoriais
│   └── /frequently-asked-questions
│
├── ONBOARDING & UTILITÁRIOS
│   ├── /style-quiz             → personalização + lead
│   ├── Save to Loverly (extensão Chrome)
│   └── /forgot-password
│
└── CORPORATIVO
    ├── /careers · /partner
    ├── /terms-of-service · /privacy-policy
    └── /vendor-terms-and-conditions
```

### 1.3 Pilares editoriais (`/planning`)

| Categoria | URL |
|-----------|-----|
| Engagements & Proposals | `/planning/engagements-proposals` |
| Wedding Planning | `/planning/wedding-planning` |
| Ideas & Inspiration | `/planning/ideas-inspiration` |
| Wedding Fashion | `/planning/wedding-fashion` |
| Showers & Parties | `/planning/showers-parties` |
| Love & Relationships | `/planning/love-relationships` |
| Beauty & Wellness | `/planning/beauty-wellness` |
| Travel & Honeymoons | `/planning/travel-honeymoons` |
| After I Do | `/planning/after-I-do` |
| Recently Published | `/planning/recently-published` |

Artigos organizados por **tipo**: General Advice, How-to, Ideas, Guest Guide, Fashion, Budget.

### 1.4 Área de cliente (casais)

Não existe URL pública `/dashboard` indexável — o **dashboard** abre após login (`/sign-in`). O FAQ confirma o modelo:

- Conta **gratuita** com acesso total às ferramentas
- Múltiplos eventos na mesma conta
- Colaboradores (planner, família, vendors) com permissões
- Export de guest list, arquivo de eventos

**Equivalente conceptual:** área logada = centro de comando do casal (não é loja).

---

## 2. Ferramentas principais

### 2.1 Ferramentas para casais (gratuitas — funil de registo)

| Ferramenta | URL | Função | Ligação comercial |
|------------|-----|--------|-------------------|
| **aiSLE Assistant™** | `/tools/ai-wedding-planner/setup` | IA lê propostas, recibos, inspiração; classifica automaticamente | Retenção + dados para recomendar vendors |
| **Guest List Manager** | `/tools/guest-list/setup` | Lista, RSVP, grupos, seating, import CSV | Core do produto — gera necessidade de convite digital |
| **Vendor Manager** | `/tools/vendor-manager/setup` | Contactos, contratos, notas, pagamentos | Liga ao budget; vendors podem ser do directório |
| **Budget Tracker** | `/tools/budget-tracker/setup` | Orçamento, depósitos, parcelas, métodos de pagamento | Educação financeira → decisão de contratar planner |
| **Wedding Checklist** | `/tools/wedding-checklist/setup` | Timeline personalizada por data do casamento | Engajamento longitudinal (18 meses ciclo) |
| **Vision Boards** | `/tools/vision-boards/setup` | Moodboards partilháveis com vendors | Inspiração → conversão para serviços |
| **Cash Registry** | `/tools/cash-registry/setup` | Fundo digital (parceiro Birdie) | Monetização indirecta / parceria |
| **Style Quiz** | `/style-quiz` | Descobrir estilo do casamento | Segmentação + lead qualificado |
| **Submit Wedding** | `/tools/submit-wedding` | Enviar casamento para publicação | UGC + SEO |

### 2.2 Ferramentas para fornecedores (B2B)

| Ferramenta | URL | Função |
|------------|-----|--------|
| **Create/Claim Profile** | `/tools/create-or-claim-vendor-profile/setup` | Onboarding gratuito, storefront, colaboração com clientes |
| **Submit Real Weddings** | via perfil + `/tools/submit-wedding` | Portfólio editorial ligado ao perfil |
| **Loverly Plus** | `/tools/wedding-pro/setup` + `plus.loverly.com` | Upgrade pago: visibilidade, badge, analytics |
| **Vendor Education** | `/for-wedding-professionals` | Artigos SEO, marketing, legal |

### 2.3 Ferramentas de conteúdo

| Recurso | URL | Modelo |
|---------|-----|--------|
| **I Do Crew** | `/i-do-crew` | 17+ cursos vídeo + PDFs — **grátis com conta** |
| **Video Series** | `/tools/videos` | Conteúdo curto |
| **Podcast** | link externo Spotify/Apple | Marca + audiência |
| **Livro** | Amazon | Autoridade + receita indirecta |
| **Save to Loverly** | extensão Chrome | Retenção de inspiração |

### 2.4 Integrações relevantes

- **Cash Registry** → Birdie (terceiro)
- **Pagamentos vendor Plus** → Stripe (WooCommerce em `plus.loverly.com`)
- **Shop físico** → redirect para sites das marcas (afiliado) — **fora do âmbito deste benchmark**

---

## 3. Como a Loverly vende ou monetiza a plataforma

### 3.1 Modelo de negócio (resumo)

```
                    ┌─────────────────────────────────────┐
                    │     TRÁFEGO (SEO + Real Weddings)    │
                    └─────────────────┬───────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          ▼                           ▼                           ▼
   CONTA CASAL GRÁTIS          DIRECTÓRIO VENDORS            CONTEÚDO / MARCA
   (ferramentas + dados)       (perfil grátis → Plus)        (podcast, livro, ads)
          │                           │
          ▼                           ▼
   Leads para vendors          $99–$199/mês Plus/Preferred
   Affiliate shop*             Venue Spotlight (custom)
   Cash registry (Birdie)       Loverly List (prestígio → upsell)
```

\* Shop físico excluído desta análise.

### 3.2 Monetização B2C (casais)

| Canal | Preço | Mecanismo |
|-------|-------|-----------|
| Conta + ferramentas | **$0** | Volume de utilizadores; dados de planeamento; funil para vendors |
| Cash Registry | Grátis para casal | Parceria Birdie (provável revenue share) |
| I Do Crew / cursos | **$0** (com conta) | Lead gen; cupões de parceiros (The Black Tux, M. Gemi…) |
| Livro + podcast | Venda externa | Brand building |

**Nota:** A Loverly **não cobra** aos casais pelo dashboard. O valor está na audiência que vende aos vendors.

### 3.3 Monetização B2B (fornecedores) — núcleo da receita

Fonte: [plus.loverly.com](https://plus.loverly.com) (Julho 2026)

| Plano | Preço | Inclui |
|-------|-------|--------|
| **Free** | $0/mês | Perfil, 3 real weddings/ano, inquiries, search local |
| **Plus** | **$99/mês** (marketing) / **$59/mês** (página produto WooCommerce) | Placement boost, 10 real weddings/ano, badge verificado, analytics, editorial |
| **Preferred** | **$199/mês** | Top placement, real weddings ilimitados, review expedito, exposição email/social/editorial |
| **Venue Spotlight** | Sob consulta | Programa custom para venues — [plus.loverly.com/venues](https://plus.loverly.com/venues) |

Checkout: `plus.loverly.com/payment` (Stripe). Sem contratos anuais obrigatórios.

### 3.4 Monetização indirecta

| Canal | Descrição |
|-------|-----------|
| **Loverly List** | Prémio anual → credibilidade → conversão para Plus |
| **Parcerias editoriais** | `brand@loverly.com` — brands, conteúdo patrocinado |
| **Afiliados** | Shop redirecciona para marcas (excluído da análise de produto físico) |
| **Comparações SEO** | Artigos «Zola vs The Knot» — tráfego de intenção comercial |
| **Terms Premium Services** | Cláusula legal para subscrições premium recorrentes |

### 3.5 Funil de conversão Loverly

```
1. Hero: «What's your wedding date?» → START PLANNING
2. Registo gratuito (email)
3. Dashboard activo → uso de guest list, budget, vendors
4. Inspiração (Real Weddings) → descoberta de vendors
5. Inquiry no perfil do vendor OU contratação via conteúdo
6. Vendor upgrade para Plus ($99+) para mais leads
```

**Onboarding vendor:**

```
1. /tools/create-or-claim-vendor-profile/setup
2. Perfil grátis + 3 submissions/ano
3. Upsell → /tools/wedding-pro/setup → plus.loverly.com/payment
```

---

## 4. O que pode ser adaptado para a HAXR Signature

### 4.1 Estrutura e UX

| Padrão Loverly | Adaptação HAXR |
|----------------|----------------|
| Hero com **data do evento** | Campo data + tipo no `/contacto` e hero |
| Grid de **ferramentas** na home | Secção «Tecnologia HAXR»: RSVP, Find Your Seat, lista, QR |
| **Real Weddings** com filtros | `/experiencias` + `/portfolio` com estilo, tipo, Maputo |
| **Hub editorial** por tema | `/insights` em 5–6 categorias (casamento, RSVP, assessoria…) |
| **FAQ extenso** por ferramenta | FAQ por serviço (convites, convidados, assessoria) |
| **Loverly List** curada | «Experiências Assinadas HAXR» ou casos premium Maputo |
| **Style quiz** | Wizard «Que pacote HAXR» → lead Brevo qualificado |
| **Masterclass gratuita** | PDFs/checklists MT (cronograma, orçamento casamento MZ) |
| **Barra imprensa** | Testemunhos + parceiros locais na home |
| **Vendor onboarding** | `/parceiros` para floristas, fotógrafos, venues em Maputo |
| **Pricing transparente** | Pacotes Essencial/Signature/Royal já no site — destacar mais |
| **Dashboard casal** | Portal cliente (`/portal`) — spec já existe |

### 4.2 Monetização adaptável

| Modelo Loverly | Modelo HAXR (proposta) |
|----------------|------------------------|
| Ferramentas grátis → vende audiência | **Convite + RSVP incluído** no pacote; upsell assessoria |
| Membership vendor $99/mês | **Parceiros HAXR** — listagem premium em `/parceiros` (futuro) |
| Cash registry | **Pagamento sinal** via proforma/factura no admin (já existe) |
| Cursos grátis + cupões | **Lead magnet** PDF + funil Brevo dias 0–21 (já implementado) |
| Lista anual curada | Portfólio editorial + badge «Assinado HAXR» |

### 4.3 Tecnologia já alinhada com Loverly

A HAXR **já tem** capacidades que a Loverly vende como produto:

| Loverly | HAXR (estado actual) |
|---------|----------------------|
| Guest List + RSVP | Admin eventos + RSVP público + email |
| Vendor Manager | Clientes + eventos + documentos |
| Budget / pagamentos | Caixa financeira + pagamentos + recibos |
| Checklist | Cronograma no admin / futuro portal |
| Real Weddings | `/experiencias/[slug]` |
| Reenvio convite email | `GuestManagement` + Resend |
| Import CSV convidados | `importGuestsCsvAction` |
| Find Your Seat | `/event/[id]/find-seat` |
| Check-in QR | `/event/[id]/checkin/[token]` |

**Diferencial HAXR:** não é directório neutro — **é a própria assessoria + tecnologia proprietária** com assinatura premium.

---

## 5. O que deve ser evitado

| Evitar | Motivo |
|--------|--------|
| **Marketplace aberto de vendors** como core | HAXR vende serviço próprio, não comissão de terceiros em escala US |
| **Conta obrigatória** para ver preços ou portfólio | Cliente premium espera contacto humano, não signup wall |
| **Shop de produtos físicos** | Vestidos, jóias, acessórios — fora do posicionamento |
| **Tom «playful» / rosa claro** | HAXR é escuro, dourado, discrição editorial |
| **Ferramentas 100% DIY sem assessoria** | Posicionamento é curadoria + tranquilidade, não «faça tudo sozinho» |
| **Pricing em USD para mercado MZ** | Manter MT; pacotes já definidos em `invitationPackages` |
| **Volume massivo de perfis vendor** | Qualidade > quantidade; rede curada em Maputo |
| **Dependência de afiliados fast-fashion** | Desalinhado com luxo e intenção |
| **Copiar estrutura de URLs US** | SEO local: Maputo, Moçambique, lobolo, MT |
| **Dashboard público indexável** | Manter `/admin` e `/event/*` com noindex (já feito) |

---

## 6. Proposta de modelo comercial para HAXR

### 6.1 Posicionamento

**HAXR Signature = estúdio + plataforma**, não marketplace.

Vende **serviços de alto valor** com tecnologia incluída, não subscrição de ferramentas isoladas.

### 6.2 Linhas de receita

| Linha | Produto | Preço referência (site) | Entrega |
|-------|---------|-------------------------|---------|
| **A — Convites digitais** | Essencial / Signature / Royal | 5.999 – 19.999 MT | Convite + RSVP (+ módulos por tier) |
| **B — Identidade visual** | Pacote convite + extensão IV | Incluído ou add-on | Design, sinalética, materiais |
| **C — Assessoria** | Planeamento completo | Sob orçamento | Fornecedores, cronograma, orçamento |
| **D — Coordenação no dia** | Presença no evento | Sob orçamento | Cerimonial, imprevistos |
| **E — Experiências** | Totalmente custom | Sob orçamento | Conceito único |
| **F — Plataforma** | Gestão pós-venda | Incluída em B/C/D/E | Admin + portal cliente |

### 6.3 Funil comercial HAXR (inspirado Loverly, adaptado premium)

```
DESCUBERTA (SEO, Instagram, WhatsApp, referrals)
    │
    ▼
INSPIRAÇÃO (/experiencias, /portfolio, /insights)
    │
    ▼
INTENÇÃO (/contacto — data, tipo, pacote pretendido)
    │
    ├── Lead → Supabase + Brevo funil (dias 0–21)
    └── Resend → auto-resposta + notificação hello@
    │
    ▼
PROPOSTA (proforma no admin — PDF)
    │
    ▼
SINAL (pagamento registado → recibo automático)
    │
    ▼
PRODUÇÃO (convite, identidade, assessoria)
    │
    ▼
OPERAÇÃO (RSVP, convidados, Find Your Seat, check-in)
    │
    ▼
EVENTO + relatório pós-evento
    │
    ▼
RENOVAÇÃO (referrals, novos eventos, parceiros)
```

### 6.4 Pacotes como «produto» (não SaaS mensal)

| Tier HAXR | Inclui tecnologia | Upsell natural |
|-----------|-------------------|--------------|
| **Essencial** | Convite + RSVP básico | → Signature |
| **Signature** | + galeria, dashboard RSVP, lista | → Royal ou assessoria |
| **Royal** | + QR, seating, suporte até ao dia | → Coordenação no dia |
| **Assessoria** | Plataforma completa + equipa | Experiências custom |

### 6.5 Monetização B2B futura (opcional V3)

Inspirado em Loverly Plus, mas **curado para Maputo**:

| Plano parceiro | Preço sugerido | Benefício |
|----------------|----------------|-----------|
| **Parceiro listado** | Grátis | Perfil em `/parceiros`, link do álbum HAXR |
| **Parceiro premium** | Fee mensal MT (a definir) | Destaque em experiências, referência em propostas HAXR |

Não competir com WeddingWire — ser **rede de confiança da assessoria HAXR**.

### 6.6 Pagamentos e reserva de data

| Etapa | Ferramenta HAXR |
|-------|-----------------|
| Pedido proposta | `/contacto` + admin leads |
| Proposta formal | Proforma PDF (`/admin/documents`) |
| Sinal / parcelas | Registo pagamento + recibo |
| Reserva data | Campo `event.date` + contrato (portal V2) |
| Saldo final | Factura + pagamento na caixa |

---

## 7. Sitemap recomendado para HAXR

Prioridades SEO alinhadas a intenção de pesquisa em Maputo/Moçambique.

```
www.haxrsignature.com/
│
├── SERVIÇOS (prioridade 0.95)
│   ├── /assessoria-eventos
│   ├── /convites-identidade-visual
│   ├── /gestao-convidados
│   └── /plataforma-eventos
│
├── FERRAMENTAS [NOVO hub] (prioridade 0.92)
│   ├── /ferramentas
│   ├── /ferramentas/rsvp-digital
│   ├── /ferramentas/find-your-seat
│   ├── /ferramentas/lista-convidados
│   └── /ferramentas/check-in-qr
│
├── CONVERSÃO (prioridade 0.92)
│   ├── /contacto
│   └── /contacto?tipo=convite-digital&pacote=royal
│
├── PROVA SOCIAL (prioridade 0.88)
│   ├── /portfolio
│   ├── /experiencias/casamento-vania-fabiao
│   └── /experiencias/save-the-date-jessica-samuel
│
├── CONTEÚDO (prioridade 0.70–0.75)
│   ├── /insights
│   ├── /insights/casamentos
│   ├── /insights/convidados-rsvp
│   └── /insights/assessoria-orcamento
│
├── MARCA (prioridade 0.75)
│   ├── /sobre
│   └── /area-cliente          → landing pré-portal
│
├── B2B [FUTURO] (prioridade 0.60)
│   ├── /parceiros
│   └── /parceiros/aderir
│
├── PORTAL CLIENTE [V2] (noindex até lançamento)
│   └── /portal/*
│
├── OPERAÇÃO EVENTO (noindex — já configurado)
│   └── /event/[id]/rsvp|find-seat|checkin
│
├── ADMIN (noindex)
│   └── /admin/*
│
└── LEGAL
    ├── /robots.txt
    └── /sitemap.xml
```

### Redirects SEO (já parcialmente implementados)

| URL amigável | Destino |
|--------------|---------|
| `/convites-digitais` | `/convites-identidade-visual` |
| `/wedding-planner` | `/assessoria-eventos` |
| `/find-your-seat` | `/gestao-convidados` |
| `/rsvp-digital` | `/gestao-convidados` |

---

## 8. Funcionalidades V1, V2 e V3

### V1 — Comercial pronto (estado actual + quick wins)

**Objectivo:** Vender serviços, captar leads, operar eventos.

| Área | Funcionalidade | Estado |
|------|----------------|--------|
| Site | 4 pilares + home + contacto + SEO/JSON-LD | ✅ |
| Leads | Formulário + Brevo + Resend + funil | ✅ |
| Convites | Pacotes com preço MT + demos `/experiencias` | ✅ |
| Operação | RSVP, find-seat, check-in, admin convidados | ✅ |
| Email | Reenvio convite, confirmação RSVP | ✅ |
| Financeiro | Proforma, factura, recibo, pagamentos | ✅ |
| Quick wins V1 | Hub `/ferramentas`, data no contacto, filtros portfólio | 🔲 |

### V2 — Área do cliente + venda digital completa

**Objectivo:** Cliente acompanha evento; sinal e documentos online.

| Área | Funcionalidade |
|------|----------------|
| Portal | Login cliente (`/portal`) — spec em `docs/AREA_CLIENTE_SPEC.md` |
| Portal MVP | Dashboard, eventos, stats convidados (sem PII), documentos PDF |
| Portal MVP | Resumo financeiro (pago / pendente) |
| Pagamentos | Link de pagamento sinal (integração M-Pesa / transferência — manual V2) |
| Reserva | Bloqueio de data após sinal confirmado |
| Proposta | Aceite digital da proforma no portal |
| Comunicação | Notificações email em marcos (sinal, convite pronto, semana do evento) |
| Conteúdo | `/insights` categorizado + 10 artigos SEO locais |
| Ferramentas | Landings `/ferramentas/*` com screenshots do admin |

### V3 — Plataforma premium + rede B2B

**Objectivo:** Escala com marca HAXR como referência em MZ.

| Área | Funcionalidade |
|------|----------------|
| Portal v2 | Cronograma, aprovações, contratos, fornecedores |
| Parceiros | `/parceiros` + membership curado (modelo Loverly Plus local) |
| Lista HAXR | Curadoria anual de parceiros e casos em Maputo |
| Quiz | «Descubra o seu pacote HAXR» → segmentação automática |
| Lead magnets | PDFs: checklist 12 meses, orçamento casamento MZ, guia RSVP |
| Automações | Registry de automações (`src/lib/automations/registry.ts`) |
| Pagamentos | Gateway online (M-Pesa API / Stripe internacional) |
| Analytics | Funil site → lead → proposta → sinal → evento |
| Multi-idioma | PT-MZ + EN para casamentos destination |

---

## Anexo A — URLs Loverly mapeadas (sem shop físico)

### Core
- https://loverly.com
- https://loverly.com/planning
- https://loverly.com/real-weddings
- https://loverly.com/vendors
- https://loverly.com/about-us
- https://loverly.com/sign-in
- https://loverly.com/frequently-asked-questions

### Ferramentas
- https://loverly.com/tools/ai-wedding-planner/setup
- https://loverly.com/tools/guest-list/setup
- https://loverly.com/tools/vendor-manager/setup
- https://loverly.com/tools/budget-tracker/setup
- https://loverly.com/tools/wedding-checklist/setup
- https://loverly.com/tools/vision-boards/setup
- https://loverly.com/tools/cash-registry/setup
- https://loverly.com/tools/create-or-claim-vendor-profile/setup
- https://loverly.com/tools/wedding-pro/setup
- https://loverly.com/tools/submit-wedding
- https://loverly.com/style-quiz
- https://loverly.com/i-do-crew

### Monetização B2B
- https://plus.loverly.com
- https://plus.loverly.com/payment
- https://plus.loverly.com/upgrade
- https://plus.loverly.com/product/plus-membership
- https://plus.loverly.com/venues

### Autoridade
- https://loverly.com/best-wedding-vendors
- https://loverly.com/for-wedding-professionals
- https://loverly.com/partner

---

## Anexo B — Comparação directa Loverly vs HAXR

| Dimensão | Loverly | HAXR Signature |
|----------|---------|----------------|
| Modelo | Marketplace + SaaS grátis | Estúdio premium + plataforma própria |
| Receita principal | Vendor membership $99–199/mês | Pacotes serviço 5.999–19.999+ MT |
| Público | Casais US DIY | Casais/corporativo Maputo premium |
| Ferramentas | Grátis para casais | Incluídas no pacote vendido |
| Inspiração | Milhares de real weddings | Experiências curadas assinadas |
| Tom | Claro, acessível, playful | Escuro, editorial, discrição |
| Área cliente | Dashboard casal grátis | Portal cliente pós-contrato (V2) |
| Fornecedores | Directório aberto | Rede curada HAXR (V3 opcional) |

---

*Relatório gerado com Firecrawl MCP. Reexecutar mapping após alterações significativas em loverly.com.*
