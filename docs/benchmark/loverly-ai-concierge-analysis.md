# Benchmark IA & Assistente — Loverly → HAXR Concierge

**Data:** 8 de Julho de 2026
**Fonte:** Firecrawl (`firecrawl_map`, `firecrawl_search`, `firecrawl_scrape`)
**Sites analisados:** [loverly.com](https://loverly.com) (páginas públicas de ferramentas e IA)
**Âmbito:** IA, assistente, planner, automações, inbox, uploads, clipping — **sem** shop físico, vestidos, jóias ou e-commerce de produtos.

**Relacionado:** [loverly-analysis.md](./loverly-analysis.md) (benchmark geral da plataforma)

---

## 1. Resumo executivo

A Loverly posiciona a **IA como camada de organização automática** sobre um conjunto gratuito de ferramentas de planeamento. O produto central de IA chama-se **aiSLE Assistant™** (também referido como «AIsle Assistant™» nas páginas públicas).

A proposta em uma frase: **«Forward it. Clip it. Upload it.»** — o casal envia emails, páginas web ou documentos; a IA classifica e **arquiva automaticamente** nos módulos certos (fornecedores, orçamento, convidados, moodboards, wishlist).

**Não há menção pública a revisão humana** antes de aplicar dados. O fluxo é DIY, instantâneo e orientado ao mercado US. O dashboard pós-login não é indexável — toda a experiência real do assistente vive atrás de conta gratuita.

Para a HAXR, o benchmark é claro: a Loverly ganha em **velocidade e zero fricção**; a HAXR deve ganhar em **validação humana, contexto moçambicano, integração operacional real** (RSVP, check-in, Find Your Seat, financeiro admin) e posicionamento **concierge premium**, não chatbot DIY.

---

## 2. Todas as funcionalidades de IA encontradas na Loverly

### 2.1 Produto de IA principal — aiSLE Assistant™

| Capacidade | Descrição pública |
|------------|-------------------|
| Classificação automática | Identifica tipo de conteúdo sem o utilizador etiquetar |
| Encaminhamento para módulos | Preenche Vendor Manager, Budget Tracker, Guest List, Vision Boards, Wishlist |
| Inbox por email | `save@loverly.com` — forward de emails de planeamento |
| Extensão Chrome | «Save to Loverly» — clip de vendors, produtos e inspiração |
| Upload implícito | Homepage menciona «Upload it» além de forward e clip |
| Conta gratuita | Requer registo; sem cartão de crédito |

**URL principal:** `/tools/ai-wedding-planner/setup`

### 2.2 IA editorial / conteúdo (não é o mesmo produto que aiSLE)

Artigo `/planning/wedding-101/ai-wedding-planning` descreve usos genéricos de «wedding AI»:

| Uso | Tipo |
|-----|------|
| Definir visão / estética | Sugestões de tema, paleta, venue |
| Timeline personalizada | Checklist por data do casamento |
| Votos e discursos | Rascunhos com prompts |
| Orçamento inteligente | Distribuição de budget por prioridades |
| Emails a fornecedores | Templates de outreach e RSVP reminders |
| Perguntas a fornecedores | Listas sugeridas |
| Guest list & seating | Algoritmos de arranjo (ponto de partida) |
| Tendências | Curadoria web |

Isto é **conteúdo SEO + educação**, não o motor do aiSLE. O artigo reforça que IA **não substitui** planner humano no dia do evento.

### 2.3 Ferramentas «inteligentes» sem IA explícita no nome

| Ferramenta | URL | Automação / inteligência |
|------------|-----|--------------------------|
| Guest List Manager | `/tools/guest-list/setup` | Formulário de endereços, import CSV, RSVP, lembretes email |
| Vendor Manager | `/tools/vendor-manager/setup` | Upload contratos/propostas, sync pagamentos → budget, sync tarefas → checklist |
| Budget Tracker | `/tools/budget-tracker/setup` | Pagamentos por evento, métodos (Venmo, Zelle, etc.) |
| Wedding Checklist | `/tools/wedding-checklist/setup` | Timeline por data, lembretes email, delegação |
| Vision Boards | `/tools/vision-boards/setup` | Style quiz → recomendações editoriais |
| Wedding Website | `/tools/wedding-website/setup` | Builder via **Squarespace** (terceiro), RSVP no site |
| Address Collector | `/tools/wedding-address-collector/setup` | Recolha automática de moradas |
| Style Quiz | `/style-quiz` | Segmentação de estilo |
| I Do Crew / Courses | `/tools/courses`, `/i-do-crew` | Masterclass vídeo (não IA generativa) |
| Cash Registry | `/tools/cash-registry/setup` | Parceiro **Birdie** (terceiro) |

### 2.4 Dashboard (pós-login — não scrapeável)

FAQ confirma capacidades do dashboard:

- Progresso de planeamento
- Budget e pagamentos a fornecedores
- Guest list, RSVPs, **seating chart**
- Vision boards
- Colaboradores com níveis de permissão
- Múltiplos eventos na mesma conta
- Export de dados

**Nota:** O FAQ **não documenta** o aiSLE Assistant — lacuna na própria documentação pública da Loverly.

---

## 3. Como o aiSLE Assistant funciona (páginas públicas)

### 3.1 Fluxo em 4 passos (marketing oficial)

```
1. Criar conta Loverly gratuita
2. Forward email → save@loverly.com  OU  clip com extensão Chrome
3. aiSLE lê e classifica (proposta, recibo, guest list, inspiração…)
4. Dados entram no módulo correcto automaticamente
```

### 3.2 Canais de entrada

| Canal | Detalhe |
|-------|---------|
| **Email forward** | `save@loverly.com` — propostas, quotes, receipts, guest spreadsheets |
| **Chrome extension** | Clip de vendors, produtos, inspiração de qualquer site |
| **Upload** | Mencionado na homepage («Forward it. Clip it. Upload it.») |

### 3.3 Classificação e encaminhamento

Segundo a página do assistente, cada tipo de conteúdo vai para:

| Tipo detectado | Destino |
|----------------|---------|
| Quote / proposta de catering, site de fotógrafo | **Vendor Manager** |
| Spreadsheet de convidados | **Guest List** |
| Confirmação de pagamento / invoice | **Budget Tracker** |
| Inspiração visual | **Vision Boards** |
| Produtos / itens desejados | **Wishlist** (lista comprável) |

### 3.4 Promessa de experiência

- «No manual sorting, no missed details, no starting over»
- «Your plan stays current without any manual work»
- «Planner that builds itself as you go»

### 3.5 O que **não** é público

- Modelo de IA / provider (OpenAI, Gemini, etc.)
- Pré-visualização antes de aplicar
- Fila de revisão ou undo
- Taxa de erro ou confiança
- Limites de ficheiro ou formatos suportados
- Privacidade específica do email `save@loverly.com`
- Integração com checklist ou wedding website via aiSLE

---

## 4. Tipos de documentos / informações processados

### 4.1 Explicitamente mencionados no aiSLE

| Categoria | Exemplos citados |
|-----------|------------------|
| Emails de fornecedores | Propostas, quotes, outreach |
| Recibos / comprovativos | Payment confirmations, receipts |
| Listas de convidados | Guest spreadsheets |
| Inspiração web | Páginas clipadas (fotógrafos, decoração, produtos) |
| Documentos genéricos | «any vendor email, quote, receipt, or doc» |

### 4.2 Mencionados no Vendor Manager / FAQ (upload manual + possível via aiSLE)

| Formato | Uso |
|---------|-----|
| PDF | Contratos, propostas, quotes, recibos |
| Planilhas | Import de convidados |
| Notas / texto | Interacções com fornecedores |

### 4.3 Não mencionados publicamente

- Comprovativos M-Pesa / mobile money
- Word / Excel como tipos nomeados
- Imagens OCR explícito
- Contratos legais com validação
- Áudio / WhatsApp

---

## 5. Módulos alimentados pelo ecossistema IA + ferramentas

```
                    ┌─────────────────────────────────┐
                    │   ENTRADA: email / clip / upload │
                    └───────────────┬─────────────────┘
                                    │
                    ┌───────────────▼─────────────────┐
                    │      aiSLE Assistant™ (IA)       │
                    │   classifica + encaminha auto    │
                    └───────────────┬─────────────────┘
          ┌─────────┬─────────┬─────┴─────┬─────────┬─────────┐
          ▼         ▼         ▼           ▼         ▼         ▼
    Vendor Mgr  Budget    Guest List  Vision   Wishlist  (Checklist
                Tracker               Boards              via sync
                                                      manual vendor)
```

| Módulo | Dados que recebe | Ligações cruzadas |
|--------|------------------|-------------------|
| **Vendor Manager** | Nome, contacto, proposta, contratos PDF | → Budget (pagamentos), → Checklist (to-dos) |
| **Budget Tracker** | Valores, datas, método pagamento | ← Vendor Manager, filtro por evento |
| **Guest List** | Nomes, emails, telefones, +1, RSVP | → Address collector, export para vendors |
| **Vision Boards** | Imagens, inspiração, estilo | ← Style quiz, Real Weddings |
| **Checklist** | Tarefas por data (timeline rules, não aiSLE directo) | ← Vendor to-dos, lembretes email |
| **Wedding Website** | RSVP, travel info (Squarespace) | ← Guest list conceptual |
| **Dashboard** | Vista unificada | Todos os módulos |

**RSVP / seating / check-in:** existem no dashboard (FAQ) mas **não** são citados como destino directo do aiSLE nas páginas do assistente.

---

## 6. Fluxo do utilizador na Loverly

### 6.1 Funil de conversão

```
Hero: «What's your wedding date?» → START PLANNING
    → Registo email gratuito
    → Dashboard activo
    → Uso de ferramentas + aiSLE
    → Descoberta de vendors (directório)
    → Vendor upgrade Plus ($99+/mês) [B2B]
```

### 6.2 Fluxo aiSLE (casal)

```
Casal recebe email de fotógrafo com proposta
    → Forward para save@loverly.com
    → (segundos) IA classifica como vendor quote
    → Dados aparecem no Vendor Manager
    → Pagamento de sinal → forward recibo → Budget Tracker
    → Lista Excel de família → forward → Guest List
    → Pinterest / site de decor → clip Chrome → Vision Board
```

### 6.3 Colaboração

- Parceiro, família, planner ou vendor podem ser convidados
- Permissões por nível (FAQ)
- Vision boards partilháveis com vendors

### 6.4 Interacção do utilizador com o «assistente»

| Aspecto | Loverly |
|---------|---------|
| Interface | **Não é chat** — é inbox + automação |
| Linguagem | Casual US, «stress-free», «smartest thing to happen to your wedding inbox» |
| Controlo | Mínimo — confiança na classificação automática |
| Correcção | Não documentada publicamente |
| Custo | Grátis para casais |

---

## 7. Pontos fortes da Loverly

| # | Força | Impacto |
|---|-------|---------|
| 1 | **Zero fricção de entrada** | Email forward — não exige upload manual |
| 2 | **Extensão Chrome** | Captura inspiração onde o casal já navega |
| 3 | **Integração cross-tool** | Um inbox alimenta 5+ módulos |
| 4 | **Conta + ferramentas grátis** | Funil massivo de utilizadores |
| 5 | **Marketing claro** | 4 passos, mockups, promessa simples |
| 6 | **Ecossistema completo** | Guest + vendor + budget + checklist + boards num só sítio |
| 7 | **Colaboração multi-pessoa** | Parceiro, família, planner no mesmo dashboard |
| 8 | **Timeline inteligente** | Checklist personalizada por data do casamento |
| 9 | **Import/export** | CSV guest list, export para vendors |
| 10 | **SEO + educação IA** | Artigo separa expectativas realistas de IA |

---

## 8. Limitações ou oportunidades de melhoria

| # | Limitação Loverly | Oportunidade HAXR |
|---|-------------------|-------------------|
| 1 | **Sem validação humana** pública | Concierge HAXR com revisão obrigatória |
| 2 | **Mercado US** (USD, Venmo, Zelle) | MZN, M-Pesa, e-Mola, fornecedores MZ |
| 3 | **DIY sem assessoria** | IA + equipa HAXR + cliente acompanha |
| 4 | **Erros silenciosos** possíveis | Pré-visualização + estados de confiança |
| 5 | **FAQ ignora aiSLE** | Documentação clara para clientes premium |
| 6 | **Dashboard opaco** (login wall) | Portal cliente com status transparente |
| 7 | **Wedding website terceiro** (Squarespace) | Convites digitais HAXR nativos + RSVP |
| 8 | **Sem operação de evento** | Check-in QR, Find Your Seat, contact profiles |
| 9 | **Wishlist / shop** mistura com inspiração | Moodboard puro, sem e-commerce |
| 10 | **Privacidade email** não detalhada | Política explícita + consentimento operacional |
| 11 | **Sem WhatsApp** (canal MZ) | Futuro: encaminhar comprovativos WhatsApp |
| 12 | **Tom casual** | Tom concierge premium, PT-MZ |

---

## 9. O que a HAXR deve adaptar

| Padrão Loverly | Adaptação HAXR Concierge |
|----------------|--------------------------|
| Inbox por email | `concierge@haxrsignature.com` (V4) |
| Classificação automática | Manter — com score de confiança |
| Encaminhamento por módulo | Fornecedores, orçamento, convidados, moodboard, checklist, documentos |
| Upload de ficheiros | PDF, Excel, imagens, Word |
| Timeline por data | Checklist contextual por tipo de evento MZ |
| Import CSV convidados | Já existe no admin — ligar ao Concierge |
| Colaboração | Cliente + equipa HAXR (não marketplace aberto) |
| Secção marketing com mockups | Já existe na homepage (V1) |
| 4 passos simples | Enviar → Classificar → Rever → Aplicar (com passo humano extra) |

---

## 10. O que a HAXR deve melhorar

1. **Validação humana obrigatória** — IA nunca grava dados críticos sem aprovação da equipa HAXR.
2. **Integração operacional real** — RSVP, check-in, lugares, perfis de contacto, sync Sheets.
3. **Contexto local** — MZN, M-Pesa, lobolo, noivado, baptizado, gala corporativa, Maputo.
4. **Auditoria completa** — ficheiro original, extracção IA, quem aprovou, diff antes/depois.
5. **Portal do cliente** — estado em tempo real: recebido → em análise → aprovado → aplicado.
6. **Convites digitais nativos** — não depender de Squarespace; RSVP HAXR já existe.
7. **Concierge com rosto** — equipa HAXR visível, não «assistente anónimo».
8. **Pacotes comerciais** — incluído em Signature/Royal; add-on Essential.
9. **Relatórios inteligentes** — pendências, orçamento, RSVPs sem resposta (V5).
10. **Separação operacional vs marketing** — contact profiles sem sync Brevo automático.

---

## 11. O que a HAXR deve evitar

| Evitar | Motivo |
|--------|--------|
| Aplicação automática sem revisão | Risco em convidados, pagamentos, fornecedores |
| Tom «chatbot DIY» / playful US | Desalinhado com premium MZ |
| Marketplace aberto de vendors | HAXR vende assessoria, não comissão em escala |
| Wishlist / shop físico | Fora do posicionamento |
| Inferir consentimento marketing de uploads | Privacidade — regra já em contact profiles |
| Copiar nome aiSLE / Save to Loverly | Identidade 100% HAXR |
| Prometer «planeia o casamento sozinho» | Honestidade — IA organiza, equipa executa |
| Dependência de terceiros opacos | Squarespace, Birdie — HAXR controla stack própria |

---

## 12. Proposta de visão final para HAXR Concierge

### Posicionamento

> **A IA organiza. A equipa HAXR valida. O cliente acompanha.**

HAXR Concierge não é um planner DIY gratuito. É a **camada inteligente** incluída nos pacotes premium que transforma o caos documental (propostas, comprovativos M-Pesa, listas Excel, referências visuais) em **dados estruturados no painel do evento** — sempre com supervisão humana da equipa HAXR.

### Diferencial vs Loverly

| Dimensão | Loverly aiSLE | HAXR Concierge |
|----------|---------------|----------------|
| Modelo | Grátis, self-service | Incluído no pacote / add-on |
| Aplicação | Automática | Revisão humana obrigatória |
| Mercado | US, USD | Moçambique, MZN, M-Pesa |
| Operação evento | Limitada (RSVP web) | RSVP + QR + Find Your Seat + check-in |
| Tom | Casual inbox | Concierge premium |
| Assessoria | Opcional (marketplace) | Core do produto HAXR |
| Privacidade | Genérica | Operacional vs marketing separados |

### Arquitectura conceptual (alvo)

```
Cliente / Admin envia (upload, email, link)
        ↓
Inbox Concierge → IA classifica + extrai (JSON)
        ↓
Pré-visualização + score de confiança
        ↓
Fila «Por rever» (equipa HAXR)
        ↓
Aprovar / Editar / Rejeitar
        ↓
Aplicar ao painel do evento (fornecedores, pagamentos, convidados, moodboard, checklist)
        ↓
Cliente vê resultado no portal (V3+)
```

### Comercial

| Pacote | Concierge |
|--------|-----------|
| Essential | Add-on opcional |
| Signature | Incluído (upload + revisão) |
| Royal | Incluído + prioridade + email inbox |
| Assessoria / Coordenação | Completo + alertas proactivos (V5) |
| Parceiros HAXR (futuro) | Envio de propostas directo para inbox do evento |

---

## Anexo A — URLs scrapeadas (IA e ferramentas)

### IA e assistente
- https://loverly.com/tools/ai-wedding-planner/setup
- https://loverly.com/planning/wedding-101/ai-wedding-planning
- https://loverly.com/ (secção aiSLE)

### Ferramentas de planeamento
- https://loverly.com/tools
- https://loverly.com/tools/guest-list/setup
- https://loverly.com/tools/vendor-manager/setup
- https://loverly.com/tools/budget-tracker/setup
- https://loverly.com/tools/wedding-checklist/setup
- https://loverly.com/tools/vision-boards/setup
- https://loverly.com/tools/wedding-website/setup
- https://loverly.com/tools/wedding-address-collector/setup
- https://loverly.com/style-quiz
- https://loverly.com/frequently-asked-questions

### Entrada / clipping
- Email: `save@loverly.com`
- Chrome: [Save to Loverly extension](https://chromewebstore.google.com/detail/save-to-loverly-button/algjlobljjdhjlnigfhpafcnpkfmaaoo)

---

## Anexo B — Matriz funcional Loverly → HAXR (estado Jul 2026)

| Funcionalidade Loverly | HAXR hoje | HAXR alvo (Concierge) |
|------------------------|-----------|------------------------|
| aiSLE inbox email | Marketing only (`concierge@` mockup) | V4 |
| Classificação IA | Parcial (admin tab Concierge, Gemini) | V2 completo |
| Revisão humana | Sim (diferencial já no código) | Manter e reforçar |
| Vendor proposals → painel | Parcial (`event_vendors`) | V2 |
| Receipts → financeiro | Parcial (`payments`) | V2 |
| Guest list import | Sim (`guests` + CSV) | V2 via Concierge |
| Vision / moodboard | Parcial (`event_moodboard_items`) | V2 |
| Checklist sugerida | Parcial (`event_checklist_items`) | V2/V5 |
| RSVP operacional | Sim (nativo HAXR) | Integrar Concierge → guests |
| Find Your Seat / check-in | Sim (nativo HAXR) | V5 alertas |
| Portal cliente | Em desenvolvimento | V3 |
| Chrome extension | Não | Opcional V5+ (baixa prioridade MZ) |
| M-Pesa comprovativos | Não | V2+ (OCR + campos MZ) |

---

*Relatório gerado com Firecrawl MCP. Reexecutar após alterações significativas em loverly.com/tools/ai-wedding-planner.*
