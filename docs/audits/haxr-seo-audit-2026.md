# Auditoria Profunda de SEO Técnico, Semântico & Conteúdo (2026)

**Alvo:** [https://www.haxrsignature.com](https://www.haxrsignature.com)  
**Mercado Principal:** Moçambique (Maputo, Matola, Bazaruto, Vilankulo, Inhambane)  
**Mercado Secundário:** Diáspora Moçambicana (Portugal, África do Sul, Reino Unido) & Destination Weddings Internacionais  
**Data da Auditoria:** 2026-09-06  
**Estado:** `AUDIT_COMPLETE` (Apenas Análise — Sem Alteração de Código)

---

## 1. Inventário de Rotas Públicas Indexáveis

| Rota | Título Atual | Meta Descrição | Intenção de Pesquisa | Estado / Avaliação |
| :--- | :--- | :--- | :--- | :--- |
| `/` | *Duplicado* (Ver Secção 2) | Assessoria de eventos, convites digitais para casamentos... | Marca + Transacional ("assessoria casamentos Maputo") | **Ajustar título e H1 editorial** |
| `/assessoria-eventos` | Assessoria de Eventos em Maputo | Organização completa, planeamento e coordenação no dia... | Comercial ("organização casamentos Maputo") | **Bom potencial, precisa de enriquecer serviços** |
| `/convites-identidade-visual` | Convites Digitais & Identidade Visual | Design e tecnologia para convites de casamento e lobolo... | Produto / Serviço ("convites digitais casamento") | **Forte, bem posicionado** |
| `/gestao-convidados` | Gestão de Convidados, RSVP e Check-in | Confirmação de presenças, seating plan e check-in QR... | Solução ("gestão convidados casamento Moçambique") | **Excelente diferenciação tecnológica** |
| `/plataforma-eventos` | Plataforma de Eventos HAXR | Software integrado de planeamento para eventos... | B2B / SaaS ("software planeamento casamento") | **Risco: Soa a produto de software em excesso** |
| `/plus-memories` | Plus Memories — Mural de Memórias | Upload de fotografias em tempo real para casamentos... | Experiência de Convidado ("mural digital casamento") | **Forte valor acrescentado** |
| `/contacto` | Contacto & Marcação de Reunião | Agende uma reunião com a equipa HAXR Signature... | Conversão Direta ("contacto wedding planner Maputo") | **Página crítica de fecho comercial** |
| `/portfolio` | Portfólio de Casamentos & Eventos | Arquivo visual de celebrações e convites HAXR... | Prova Social ("fotos casamentos Maputo") | **Fina: Necessita de histórias de casamentos reais** |
| `/fornecedores` | Diretório de Fornecedores de Casamento | Lista curada de espaços, fotógrafos, catering... | Descoberta Local ("quintas para casamento Maputo") | **Boa âncora de SEO local** |
| `/for-pros` | HAXR for Pros — Rede de Parceiros | Parcerias estratégicas para fornecedores de eventos... | Captação B2B ("parcerias fornecedores eventos") | **Adequada** |
| `/guias` | Guias de Planeamento de Casamento | Manuais práticos para casais em Moçambique... | Conteúdo Topo de Funil ("como organizar casamento") | **Potencial gigante para capturar tráfego orgânico** |
| `/insights` | Insights & Tendências | Reflexões editoriais sobre casamentos de luxo... | Autoridade / Informacional | **Crítico: Apenas 3 artigos muito curtos** |
| `/faq` | Perguntas Frequentes | Dúvidas sobre assessoria, convites e gestão... | Suporte à Decisão | **Adequada** |
| `/ferramentas` | Ferramentas Gratuitas de Casamento | Calculadoras, cronogramas e checklists... | Isca de Tráfego ("calculadora bebidas casamento") | **Bom volume, mas deve alimentar o funil de assessoria** |

---

## 2. Diagnóstico Definitivo da Duplicação de Título (Known Issue B5)

### Problema Observado no Google:
```text
"HAXR Signature | Assessoria de Eventos, Convites Digitais e Gestão de Convidados | HAXR Signature"
```

### Causa Raiz Estrutural (Next.js Metadata Template):
1. No layout raiz (`src/app/layout.tsx`), a função `buildSiteMetadata()` define um template de título:
   ```ts
   // src/lib/seo/site-meta.ts
   titleTemplate: "%s | HAXR Signature"
   ```
2. Na página inicial (`src/app/(marketing)/page.tsx`), os metadados são gerados por `marketingMetadata("home")`, que define:
   ```ts
   // src/lib/marketing/seo.ts
   home: {
     title: "HAXR Signature | Assessoria de Eventos, Convites Digitais e Gestão de Convidados"
   }
   ```
3. O Next.js interpola `%s` com a string fornecida pela página filha. Como a string da página já continha `"HAXR Signature | ..."`, o Next.js adicionou o sufixo `| HAXR Signature` uma segunda vez, resultando na duplicação visível.

### Solução Técnica Recomendada (Para Implementação Posterior):
Utilizar a propriedade `title: { absolute: "..." }` do Next.js Metadata API na homepage, ou definir o título da página sem o sufixo da marca (ex: `title: "Assessoria de Casamentos & Alta-Costura Digital"`), deixando o template anexar a marca apenas uma vez.

---

## 3. Auditoria Técnica de Indexação e Infraestrutura

- **`robots.txt` (`src/app/robots.ts`):**  
  - Estado: **EXCELENTE**.  
  - Bloqueia corretamente `/admin`, `/admin/`, `/api/` e `/event/` (privacidade de eventos privados).  
  - Aponta com precisão para `https://www.haxrsignature.com/sitemap.xml`.
- **`sitemap.xml` (`src/app/sitemap.ts`):**  
  - Alerta 1: A constante `SITE_CONTENT_REVISION` está fixada em `"2026-06-13"`. Deve ser dinâmica ou sincronizada com as versões reais de conteúdo.
  - Alerta 2: Faltam páginas dinâmicas de destino (Bazaruto, Vilankulo) e as categorias detalhadas de fornecedores.
- **Canónicas & Redirecionamento de Domínio:**  
  - O apex `haxrsignature.com` redireciona via HTTP 308 na Vercel para `www.haxrsignature.com`.
  - Todas as páginas geram `<link rel="canonical" href="https://www.haxrsignature.com/..." />`.
- **Hierarquia de Títulos (H1 / H2 / H3):**  
  - A homepage possui múltiplos elementos com visual de destaque que competem pela semântica de `<h1>`. Deve haver um único `<h1>` cristalino centrado na proposta de valor de luxo.
- **Idiomas e Localização (`lang="pt-MZ"`):**  
  - O HTML declara `lang="pt-MZ"`.
  - Não existem tags `hreflang` configuradas para visitantes internacionais em língua inglesa, o que limita o tráfego da diáspora e de estrangeiros que planeiam casar em Moçambique.
- **Structured Data (Schema.org / JSON-LD):**  
  - `@type`: `["Organization", "ProfessionalService", "EventPlanner"]` está bem estruturado em `src/lib/seo/jsonld.ts`.  
  - Georreferenciação: `latitude: -25.9653, longitude: 32.5892` (Maputo).  
  - **Oportunidade:** O campo `areaServed` contém apenas Maputo e Moçambique genérico. Deve incluir `Bazaruto`, `Vilankulo` e `Inhambane`.
  - **Atenção às Políticas Google (FAQPage):** Desde 2023, a Google restringe rich snippets de FAQ quase exclusivamente a sites governamentais e de saúde. Não se deve sobrecarregar a marca com schemas de FAQ na expetativa de rich snippets, priorizando antes schemas de `Service`, `EventPlanner`, `LocalBusiness` e `BreadcrumbList`.

---

## 4. Oportunidades Semânticas e Palavras-Chave (Moçambique & Diáspora)

### Grupo 1: Intenção Transacional Elevada (Maputo / Moçambique)
- `wedding planner Maputo` (Pesquisa de alto valor por casais com orçamento elevado)
- `assessoria de casamentos Maputo` (Termo de maior rigor profissional)
- `organização de casamentos em Moçambique`
- `protocolo e cortejo casamento Maputo`
- `preço assessoria de casamento Maputo`

### Grupo 2: Tradição & Cultura Moçambicana
- `organização de lobolo em Maputo`
- `cerimónia tradicional moçambicana assessoria`
- `convite digital lobolo com rsvp`
- `roteiro e cronograma do lobolo`

### Grupo 3: Destination Weddings (Ouro Inexplorado)
- `destination wedding Mozambique`
- `casamento na praia Bazaruto Anantara`
- `wedding in Vilanculos Mozambique`
- `destination wedding Benguerra Island Kisawa`
- `casamentos em estâncias balneares Moçambique`

### Grupo 4: Diáspora & Casais Internacionais
- `casar em Moçambique a viver no estrangeiro`
- `planeamento de casamento à distância Maputo`
- `getting married in Mozambique luxury planner`

---

## 5. Risco de "Thin Content" em Insights & Guias

- A secção `/insights` possui atualmente apenas 3 artigos de 3 parágrafos cada (`casamentos`, `convidados-rsvp`, `assessoria-orcamento`).
- Para os motores de busca e para clientes de elite, artigos com menos de 300 palavras transmitem pouca autoridade editorial (E-E-A-T baixo).
- **Recomendação:** Expandir a secção para um verdadeiro Journal Editorial (*The HAXR Journal*), com ensaios detalhados sobre:
  - *"O Guia Definitivo do Lobolo Contemporâneo"*
  - *"Como Planear um Casamento nas Ilhas de Bazaruto e Vilankulo"*
  - *"Cronograma Cerimonial: Do Cortejo Religioso à Festa Sem Fim"*

---

## 6. Pontuação SEO de Linha de Base

| Métrica | Pontuação (0–10) | Diagnóstico Principal |
| :--- | :---: | :--- |
| **SEO Técnico** | **8.2 / 10** | Excelente infraestrutura Next.js, robots impecável, canónicas limpas; penalizado pelo bug do título duplicado. |
| **SEO Semântico / Conteúdo** | **5.5 / 10** | Pouco conteúdo aprofundado, artigos thin content em `/insights`, ausência de páginas dedicadas a destinos balneares. |
| **SEO Local & Geográfico** | **6.0 / 10** | Focado apenas em Maputo; não cobre Bazaruto, Vilankulo e Ponta do Ouro. |
| **E-E-A-T & Confiança** | **5.0 / 10** | Faltam biografias de autores, depoimentos de assessoria completa e histórias reais de casamentos. |
| **Internacionalização** | **3.0 / 10** | Ausência total de rotas ou páginas de contacto em inglês para Destination Weddings. |

---

## 7. Principais Descobertas P0 (Críticas)

1. **P0-1:** Eliminar a duplicação do sufixo da marca no `<title>` da homepage gerado pela concatenação errónea de metadados.
2. **P0-2:** Criar uma página e schema dedicados a *Destination Weddings Moçambique* (Bazaruto, Vilankulo, Inhambane) para capturar noivos internacionais e da diáspora.
3. **P0-3:** Enriquecer o `areaServed` no Schema.org com os destinos de luxo moçambicanos além da capital Maputo.
