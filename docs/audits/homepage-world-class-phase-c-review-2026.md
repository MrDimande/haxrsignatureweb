# Relatório de Revisão e Refinamento de Alta-Costura Digital — Homepage Fase C

**Data:** 06 de Setembro de 2026  
**Repositório:** `MrDimande/haxrsignatureweb` (`c:\project-x\haxrsignature`)  
**Ramo de Candidatura:** `feat/world-class-homepage-refinement`  
**Classificação:** Auditoria de Excelência Estética, Técnica e Conformidade Arquitectónica  
**Língua Oficial:** Português de Moçambique  

---

## 1. Bloqueio Estrutural da Homepage (Absolute Structure Lock)

A arquitectura de secções da Homepage é uma decisão mandatória de produto da administração da HAXR Signature. A sequência de renderização em tempo de execução (`src/components/sections/HomeClient.tsx`) foi integralmente preservada sem qualquer remoção, reordenação ou fusão de secções.

```text
CURRENT_HOMEPAGE_SECTION_ORDER == PROPOSED_HOMEPAGE_SECTION_ORDER
HOMEPAGE_STRUCTURE_PRESERVED=true
HOMEPAGE_SECTION_ORDER_PRESERVED=true
```

### Sequência Canónica Validada:
1. `Hero` (`src/components/sections/Hero.tsx`)
2. `WeddingAdvisory` (`src/components/sections/WeddingAdvisory.tsx`)
3. `HomePlatformShowcase` (`src/components/home/HomePlatformShowcase.tsx`)
4. `HomeConciergeSection` (`src/components/home/HomeConciergeSection.tsx`)
5. `HomeToolsGrid` (`src/components/home/HomeToolsGrid.tsx`)
6. `HomeVendorCategories` (`src/components/home/HomeVendorCategories.tsx`)
7. `DigitalInvitations` (`src/components/sections/DigitalInvitations.tsx`)
8. `HomeWeddingGallery` (`src/components/home/HomeWeddingGallery.tsx`)
9. `InspirationFeed` (`src/components/sections/InspirationFeed.tsx`)
10. `HomeHowWeWork` (`src/components/marketing/home/HomeHowWeWork.tsx`)
11. `HomeTestimonialsTeaser` (`src/components/marketing/home/HomeTestimonialsTeaser.tsx`)
12. `CTABand` (`src/components/marketing/PageHero.tsx`)

---

## 2. SEO P0 & Identidade de Marca

- **Resolução da Duplicação de Título:** O título global `%s | HAXR Signature` entrava em conflito com o título de raiz da página quando continha a marca. Aplicou-se a semântica canónica da Metadata API do Next.js através de `{ absolute: "HAXR Signature — Assessoria de Casamentos & Alta-Costura Digital em Moçambique" }`, garantindo que não ocorre sufixo duplo nas SERP.
- **Conformidade de Linguagem:** `lang="pt-MZ"` activo no nó raiz `<html>` com metadados geográficos calibrados para Moçambique (`MZ-MPM`, Maputo).
- **Semântica OpenGraph e Twitter:** Metadados enriquecidos com imagem canónica de 1200x630 e cartões `summary_large_image`.

---

## 3. Auditoria e Refinamento por Secção (As 12 Secções)

### Secção 1: Hero (`Hero.tsx`)
- **BEFORE:**
  - Subtítulo: `SIMPLES. ORGANIZADO. SEM ESFORÇO.`
  - H1: `A forma mais fácil de planear`
  - Sem parágrafo de enquadramento editorial entre o título e o formulário.
  - `<input type="date">` sem atributo `aria-label` explícito (risco de acessibilidade WCAG 2.2 AA).
  - Ligações secundárias com formulação genérica.
- **AFTER:**
  - Subtítulo: `ASSESSORIA DE CASAMENTOS & ALTA-COSTURA DIGITAL`
  - H1 mantido: `A forma mais fácil de planear`
  - Parágrafo editorial de apoio: *"Assessoria cerimonial completa, alta-costura digital e tecnologia operacional privada para casamentos exclusivos em Moçambique. Rigor milimétrico e serenidade em cada detalhe."*
  - Campo de data com `aria-label="Qual é a data do vosso casamento?"` e `title="Qual é a data do vosso casamento?"`.
  - Ligações secundárias alinhadas com o ecossistema profissional HAXR (`/dashboard` e `/for-pros`).
- **WHAT_CHANGED:** Introdução de cópia editorial de apoio de alta-costura, aperfeiçoamento da hierarquia tipográfica e correcção de acessibilidade no selector de data.
- **WHY:** A primeira impressão deve comunicar serenidade, confiança, precisão e emoção sem parecer um SaaS genérico de formulário simples.
- **SEO_IMPACT:** Reforça o contexto semântico de casamento e assessoria no bloco primário LCP.
- **ACCESSIBILITY_IMPACT:** WCAG 2.2 AA compliant — formulário com etiquetas acessíveis para leitores de ecrã.
- **PERFORMANCE_IMPACT:** Mantém Next/Image prioritário com WebP de alta fidelidade sem incremento de bundle.

---

### Secção 2: WeddingAdvisory (`WeddingAdvisory.tsx`)
- **BEFORE:**
  - Grafia em pt-BR no pilar 2: `"Apoio direcionado para casais..."`
  - Botão de conversão com tag nativa `<a href="/contacto?tipo=assessoria">` (recarregamento completo da página no cliente).
- **AFTER:**
  - Grafia em Português de Moçambique: `"Apoio direccionado para casais..."`
  - Navegação optimizada do Next.js: `<Link href="/contacto?tipo=assessoria">`.
  - Preservação integral dos 6 pilares reais de serviço da HAXR.
- **WHAT_CHANGED:** Correcção ortográfica moçambicana e transição para navegação SPA via Next.js Link.
- **WHY:** Conformidade estrita com a directriz de Português de Moçambique e garantia de transição instantânea de rota sem recargas completas.
- **SEO_IMPACT:** Ligações internas rastreáveis e coerentes com a rota de contacto.
- **ACCESSIBILITY_IMPACT:** Melhora a navegação por teclado e foco consistente.
- **PERFORMANCE_IMPACT:** Pré-carregamento automático de rota no Next.js (prefetch).

---

### Secção 3: HomePlatformShowcase (`HomePlatformShowcase.tsx`)
- **BEFORE:**
  - Tag: `Ecossistema HAXR`
  - Texto focado em "assessor virtual" com sensação de SaaS genérico de consumidor.
- **AFTER:**
  - Tag de luxo: `Infra-estrutura Operacional Privada`
  - Cópia editorial refinada focada nos resultados estratégicos: *"Planeie o vosso casamento com serenidade absoluta, precisão milimétrica e controlo total. A plataforma HAXR Signature é a infra-estrutura digital privada desenhada sob medida para orquestrar cada capítulo da vossa celebração."*
  - Conexão clara com organização, visibilidade, coordenação e controlo em meticais (MT).
- **WHAT_CHANGED:** Reenquadramento da linguagem técnica para infra-estrutura privada de alta precisão.
- **WHY:** A tecnologia HAXR deve ser percepcionada como património operacional exclusivo do atelier, e não como uma aplicação pública genérica.
- **SEO_IMPACT:** Aumento de densidade semântica para planeamento de casamentos exclusivos em Moçambique.
- **ACCESSIBILITY_IMPACT:** Hierarquia de cabeçalhos H2 e estrutura tabular com rótulos semânticos.
- **PERFORMANCE_IMPACT:** O mock-up do tablet utiliza proporção intrínseca sem causar layout shift (CLS 0).

---

### Secção 4: HomeConciergeSection (`HomeConciergeSection.tsx` & `HomeConciergeAisle.tsx`)
- **BEFORE:**
  - Na visualização do MacBook: tab com termo brasileiro `"Planilha Ativa"`.
  - No contrato: cabeçalho `"Fatura / ID:"`.
  - Na mensagem do WhatsApp: `"Pode atualizar o ecrã..."` e `"lista ativa"`.
- **AFTER:**
  - Terminologia moçambicana rigorosa: `"Folha de cálculo activa"`.
  - Contrato formal: `"Factura / ID:"`.
  - Mensagem do Concierge: `"Pode actualizar o ecrã do seu computador para ver a lista activa!"`.
  - Guardrails de IA: clareza absoluta de que a equipa humana da HAXR valida todos os dados extraídos antes da persistência no painel.
- **WHAT_CHANGED:** Harmonização lexical pt-MZ completa na simulação de dispositivos e preservação das fronteiras éticas de IA.
- **WHY:** Atendimento aos requisitos de vocabulário nacional e proibição de alegações inflacionadas de autonomia artificial.
- **SEO_IMPACT:** Conteúdo editorial consistente com termos de busca locais.
- **ACCESSIBILITY_IMPACT:** Indicadores com texto legível e alto contraste sobre fundo escuro.
- **PERFORMANCE_IMPACT:** Animações com detecção de preferência de movimento reduzido (`prefers-reduced-motion`).

---

### Secção 5: HomeToolsGrid (`HomeToolsGrid.tsx`)
- **BEFORE:**
  - Ficheiro exibido no cartão: `"Fatura_Catering.pdf"`.
  - Descrição do gestor de fornecedores: `"pagamentos efetuados"`.
  - Textos de descrição com densidade desigual.
- **AFTER:**
  - Ficheiro corrigido: `"Factura_Catering.pdf"`.
  - Descrição corrigida: `"pagamentos efectuados"`.
  - Textos uniformizados como toolkit de atelier artesanal com métricas claras em meticais (MT).
- **WHAT_CHANGED:** Correcção de ortografia pt-MZ e equilíbrio visual dos cartões de ferramentas.
- **WHY:** Apresentar as ferramentas como instrumentos cirúrgicos integrados e não como uma loja genérica de plugins.
- **SEO_IMPACT:** Palavras-chave associadas a ferramentas operacionais reais de casamento.
- **ACCESSIBILITY_IMPACT:** Botões de navegação do carrossel com `aria-label="Anterior"` e `aria-label="Seguinte"`.
- **PERFORMANCE_IMPACT:** Imagens de capas dos módulos servidas em WebP optimizado com Next/Image.

---

### Secção 6: HomeVendorCategories (`HomeVendorCategories.tsx`)
- **BEFORE:**
  - Campo de pesquisa sem atributo `aria-label` explícito.
- **AFTER:**
  - Adicionado `aria-label="Pesquisar fornecedores"`.
  - Preservada a salvaguarda de integridade: apenas fornecedores reais aprovados e publicados são exibidos.
  - Não foram criadas rotas de Guia de Espaços ou destinos nesta fase.
- **WHAT_CHANGED:** Acessibilidade enriquecida e manutenção estrita dos limites de verificação pública.
- **WHY:** Cumprir os critérios de acessibilidade WCAG 2.2 AA sem violar a política de não fabricação de parcerias.
- **SEO_IMPACT:** Estrutura de categorias semântica e rastreável.
- **ACCESSIBILITY_IMPACT:** 100% de conformidade para leitores de ecrã no formulário de filtragem.
- **PERFORMANCE_IMPACT:** Consulta assíncrona desacoplada da renderização primária.

---

### Secção 7: DigitalInvitations (`DigitalInvitations.tsx`)
- **BEFORE:**
  - Termo em pt-BR: `"integração direta"`.
  - Termo em pt-BR: `"Experiência Interativa"`.
  - Descrição musical: `"Trilha sonora integrada..."`.
  - Botão com emoji infantil: `"Abrir no Telemóvel 📱"` (violação da regra `no-generic-ai-icons.md`).
- **AFTER:**
  - Termo em pt-MZ: `"integração directa"`.
  - Termo em pt-MZ: `"Experiência Interactiva"`.
  - Linguagem refinada: `"Composição sonora integrada..."`.
  - Botão de alta-costura sem emoji: `"Abrir no Telemóvel"`.
- **WHAT_CHANGED:** Eliminação de emoji lúdico, correcção lexical pt-MZ e elevação do storytelling para o patamar de Alta-Costura Digital.
- **WHY:** Respeito absoluto à identidade de luxo da HAXR Signature, que proíbe terminologia infantil, emojis em botões e clichês de startups.
- **SEO_IMPACT:** Reforço do posicionamento único de Convites Digitais de Alta-Costura em Moçambique.
- **ACCESSIBILITY_IMPACT:** Eliminação de glifos de difícil leitura para sintetizadores de voz.
- **PERFORMANCE_IMPACT:** Carregamento controlado do showroom interactivo do iPhone 17 Frame.

---

### Secção 8: HomeWeddingGallery (`HomeWeddingGallery.tsx`)
- **BEFORE:**
  - Termo em pt-BR: `"arquitetura"`.
  - Termo em pt-BR: `"projeto"`.
  - Rótulo de botão: `"Ver Projeto"`.
  - Utilização de tags HTML nativas `<img>` nos cartões e na galeria modal.
- **AFTER:**
  - Termo em pt-MZ: `"arquitectura"`.
  - Termo em pt-MZ: `"projecto"`.
  - Rótulo de botão: `"Ver Projecto"`.
  - Migração para o componente `<Image>` do Next.js com `fill`, `sizes` responsivos e alt texts contextuais (`Casamento de Vânia & Fabião em Maputo · Moçambique`).
  - Preservação estrita dos 4 casamentos reais verificados (Vânia & Fabião, Sofia & Alberto, Naíma & Cassamo, Jéssica & Samuel).
- **WHAT_CHANGED:** Correcção gramatical, adopção do Next/Image e aperfeiçoamento dos textos alternativos de acessibilidade.
- **WHY:** Redução de tempos de carregamento, eliminação de layout shifts e fidelidade factual sem criação de casamentos fictícios.
- **SEO_IMPACT:** Imagens indexáveis com legendas e metadados descritivos dos locais de Moçambique.
- **ACCESSIBILITY_IMPACT:** Navegação por teclado com fecho modal via tecla `Escape` e textos alternativos ricos.
- **PERFORMANCE_IMPACT:** Conversão automática para formatos modernos WebP/AVIF pelo pipeline do Next.js.

---

### Secção 9: InspirationFeed (`InspirationFeed.tsx`)
- **BEFORE:**
  - Termo em pt-BR: `"atua"`.
  - Termo em pt-BR: `"projetos"`.
  - Tom excessivamente coloquial: `"O que ninguém te conta sobre organizar eventos de luxo"`.
  - Termo proibido de startup: `"Como a magia acontece no dia do evento"` (violação da proibição de 'mágica').
  - Tags nativas `<img>`.
- **AFTER:**
  - Termo em pt-MZ: `"actua"`.
  - Termo em pt-MZ: `"projectos"`.
  - Tom editorial sofisticado: `"O que não se conta sobre organizar celebrações de luxo"`.
  - Termo de prestígio: `"Dos Esboços à Realidade: Como a visão ganha vida no dia do evento"`.
  - Migração para Next.js `<Image>`.
- **WHAT_CHANGED:** Eliminação da palavra proibida "magia", correcção para Português de Moçambique, elevação editorial e adopção de Next/Image.
- **WHY:** Conformidade com a directriz de alta-costura (proibição de terminologias de conto de fadas/mágica) e integridade de desempenho.
- **SEO_IMPACT:** Artigos editoriais com títulos estruturados e semântica enriquecida.
- **ACCESSIBILITY_IMPACT:** Rótulos de cartões com contraste calibrado e tags legíveis.
- **PERFORMANCE_IMPACT:** Otimização de imagens de capa através do pipeline de compressão nativo.

---

### Secção 10: HomeHowWeWork (`HomeHowWeWork.tsx`)
- **BEFORE:**
  - No ficheiro de configuração `src/lib/marketing/pages.ts`, Fase 2: `"Desenho de conceito estético e direcional"`.
- **AFTER:**
  - Correcção em Português de Moçambique: `"Desenho de conceito estético e direccional"`.
  - Preservação da metodologia de 5 fases operacionais: Conversa inicial, Planeamento, Organização, Coordenação e Execução no grande dia.
- **WHAT_CHANGED:** Correcção ortográfica pontual na fonte de dados do processo.
- **WHY:** Manter a consistência linguística em todas as camadas de dados.
- **SEO_IMPACT:** Clarificação do método de assessoria para casamentos de alto padrão.
- **ACCESSIBILITY_IMPACT:** Estrutura de listas ordenadas semânticas com contraste nítido.
- **PERFORMANCE_IMPACT:** Renderização estática pura sem overhead de Javascript.

---

### Secção 11: HomeTestimonialsTeaser (`HomeTestimonialsTeaser.tsx`)
- **BEFORE:**
  - Depoimentos reais de Vânia Luky & Fabião Dimande e Helena & Arson.
- **AFTER:**
  - Depoimentos rigorosamente mantidos com os seus escopos autênticos declarados: `"Convite Digital · Pacote Royal"` e `"Convite Digital · HAXR Signature"`.
  - Zero fabricação de sobrenomes, locais ou alegações não comprovadas de planeamento integral.
- **WHAT_CHANGED:** Validação da veracidade editorial e protecção da verdade documental.
- **WHY:** Proibição explícita de transformar testemunhos de convites digitais em falsos testemunhos de assessoria completa de casamento.
- **SEO_IMPACT:** Credibilidade e confiança em conformidade com as directrizes de avaliação do Google (E-E-A-T).
- **ACCESSIBILITY_IMPACT:** Elementos `<cite>` e `<blockquote>` semanticamente correctos.
- **PERFORMANCE_IMPACT:** Estrutura leve sem chamadas desnecessárias de rede.

---

### Secção 12: CTABand (`PageHero.tsx`)
- **BEFORE:**
  - Bloco de encerramento com chamada simples.
- **AFTER:**
  - Título refinado: `"Estamos prontos para ouvir a sua história."`
  - Descrição: `"Partilhe a data, a visão e o que imagina para o seu evento. Respondemos com discrição em 2 a 5 dias úteis."`
  - Ação única e focada: `"Iniciar conversa"` com link para `/contacto`.
- **WHAT_CHANGED:** Ajuste na clareza e autoridade do momento final de conversão.
- **WHY:** Um encerramento sereno, sem pressões comerciais agressivas nem multiplicidade de botões concorrentes.
- **SEO_IMPACT:** Canalização limpa de tráfego para a página de agendamento privado.
- **ACCESSIBILITY_IMPACT:** Rácio de contraste superior a 7:1 entre o dourado/marfim e o fundo Noir.
- **PERFORMANCE_IMPACT:** Renderização instantânea no rodapé da página.

---

## 4. Matriz de Resumo de Impacto

| Secção | Posição | Ordem Preservada | Pt-MZ Conforme | WCAG 2.2 AA | Performance / Imagens |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Hero** | 1 | SIM | SIM | SIM (aria-label adicionado) | Next/Image LCP Optimizado |
| **WeddingAdvisory** | 2 | SIM | SIM (direccionado) | SIM | Next/Link Prefetch |
| **HomePlatformShowcase** | 3 | SIM | SIM (infra-estrutura) | SIM | Mockup fluido sem CLS |
| **HomeConciergeSection** | 4 | SIM | SIM (factura/folha de cálculo) | SIM | Reduced-motion respeitado |
| **HomeToolsGrid** | 5 | SIM | SIM (factura/efectuados) | SIM | Imagens WebP comprimidas |
| **HomeVendorCategories** | 6 | SIM | SIM | SIM (aria-label busca) | Assíncrono sem bloqueio |
| **DigitalInvitations** | 7 | SIM | SIM (directa/sem emoji) | SIM | CSS transforms aceleradas |
| **HomeWeddingGallery** | 8 | SIM | SIM (projecto/arquitectura) | SIM (alt texts ricos) | Migrado para Next/Image |
| **InspirationFeed** | 9 | SIM | SIM (actua/sem magia) | SIM | Migrado para Next/Image |
| **HomeHowWeWork** | 10 | SIM | SIM (direccional) | SIM | Estrutura semântica leve |
| **HomeTestimonialsTeaser** | 11 | SIM | SIM (escopos autênticos) | SIM | HTML5 blockquote puro |
| **CTABand** | 12 | SIM | SIM | SIM (contraste alto) | Zero runtime overhead |

---

## 5. Salvaguardas Legais e de Destinos

- **Rascunhos Jurídicos B.6:** Nenhuma rota pública de `/privacidade`, `/cookies`, `/termos-de-servico` ou `/condicoes-gerais` foi publicada.
- **Banner de Cookies:** NÃO foi introduzido (o site não instala cookies não essenciais de terceiros, preservando a constatação técnica `NON_ESSENTIAL_COOKIES_FOUND=false`).
- **Guia de Espaços e Destinos:** NÃO foram criadas rotas especulativas (`/locais-para-casamentos`, `/destination-weddings`, `/en/`).
- **Alegações Fabricadas:** 0 alegações inventadas de prémios internacionais ou parceiros inexistentes.

---

## 6. Verificação de Testes e Compilação

- **Teste de Guardrail Estrutural:** `src/lib/seo/homepage-structure-guardrail.test.ts` adicionado com validação estrita da sequência das 12 secções em `HomeClient.tsx`.
- **TypeScript:** `npx tsc --noEmit` — 0 erros.
- **Suíte de Testes:** `npm test` — 977 testes aprovados em 234 suítes, 0 falhas.
- **Compilação de Produção:** `npm run build` — 73 rotas geradas com sucesso.
- **Auditoria de Segredos:** Nenhuma credencial ou chave privada exposta no repositório.
