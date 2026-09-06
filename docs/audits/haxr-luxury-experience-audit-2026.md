# Auditoria de Experiência de Luxo, UX/CRO, Acessibilidade & Performance (2026)

**Alvo:** [https://www.haxrsignature.com](https://www.haxrsignature.com)  
**Posicionamento:** Private Planning Atelier & Alta-Costura Digital  
**Data:** 2026-09-06  
**Estado:** `AUDIT_COMPLETE` (Apenas Análise — Sem Alteração de Código)

---

## 1. Auditoria Seção a Seção da Homepage Atual

| Secção Atual | Componente | Classificação | Avaliação Crítica de Luxo |
| :--- | :--- | :--- | :--- |
| **1. Hero** | `Hero.tsx` | `KEEP_BUT_REPOSITION` | Tipografia Fraunces elegante, mas o copy atual mistura demasiados conceitos ("assessoria, convites, check-in, software"). Deve focar-se na promessa central da casa: Casamentos memoráveis com serenidade absoluta. |
| **2. Assessoria de Casamentos** | `WeddingAdvisory.tsx` | `KEEP` | Secção forte que explica o acompanhamento do casal. Deve ser enriquecida com fotografia autêntica de eventos reais. |
| **3. Showcase de Plataforma** | `HomePlatformShowcase.tsx` | `MOVE_TO_PRODUCT_PAGE` | **Problema Crítico de Posicionamento:** Colocar capturas de ecrã do dashboard na posição 3 da homepage transforma a HAXR num produto SaaS genérico. Deve ser movida para `/plataforma-eventos`. |
| **4. HAXR Concierge IA** | `HomeConciergeSection.tsx` | `KEEP_BUT_REPOSITION` | O Concierge é um grande diferencial, mas deve ser apresentado como o "Serviço de Mordomia Privada Digital", e não como um chat bot técnico. Reposicionar mais abaixo. |
| **5. Grid de Ferramentas** | `HomeToolsGrid.tsx` | `MOVE_TO_PRODUCT_PAGE` | Calculadora de catering, simulador de salão e budget trackers barateiam a perceção de alta-costura quando expostos no topo da homepage. Pertencem a `/ferramentas`. |
| **6. Categorias de Fornecedores** | `HomeVendorCategories.tsx` | `MERGE` | Parece um classificado/marketplace comercial. Deve ser integrada discretamente como "A Nossa Rede Exclusiva de Parceiros e Fornecedores Curados". |
| **7. Convites Digitais** | `DigitalInvitations.tsx` | `KEEP` | Uma das joias da HAXR. Deve ser apresentada como obras de arte interativas com tipografia e música personalizada. |
| **8. Galeria de Casamentos** | `HomeWeddingGallery.tsx` | `REDESIGN` | Atualmente fragmentada. Deve ser redesenhada como um editorial cinematográfico de celebrações com créditos aos noivos e ao espaço. |
| **9. Inspiração & Estilo** | `InspirationFeed.tsx` | `KEEP_BUT_REPOSITION` | Moodboards e paletas de cores. Aumenta o desejo estético dos casais. |
| **10. Método de Trabalho** | `HomeHowWeWork.tsx` | `KEEP` | Essencial para transmitir controlo, pontualidade e tranquilidade às famílias. |
| **11. Testemunhos** | `HomeTestimonialsTeaser.tsx` | `REDESIGN` | Atualmente contém apenas 2 testemunhos focados em convites. Necessita de depoimentos de casamentos completos e assessoria. |
| **12. Faixa de Fecho (CTA)** | `CTABand.tsx` | `REDESIGN` | O convite final deve ser íntimo e discreto: "Agende uma Conversa no Nosso Atelier Privado". |

---

## 2. Proposta de Wireframe da Nova Homepage de Luxo (Markdown)

```text
+-----------------------------------------------------------------------------------+
| HEADER EDITORIAL: Logo HAXR Signature (Dourado/Preto) | Menu Minimalista | Atelier|
+-----------------------------------------------------------------------------------+
|                                                                                   |
| HERO CINEMATOGRÁFICO:                                                             |
| "A Alta-Costura do Planeamento de Casamentos em Moçambique."                      |
| Subtítulo: "Curadoria cerimonial, cenografia intemporal e tecnologia invisível     |
|            para celebrações que permanecem na memória de gerações."               |
|                                                                                   |
| CTA ÚNICO E REFINADO: [ Agendar Consulta Privada ]  [ Conversar com o Atelier ]   |
+-----------------------------------------------------------------------------------+
| O MANIFESTO DO ATELIER:                                                           |
| "Não organizamos apenas eventos. Criamos rituais de passagem inesquecíveis."      |
| Três pilares de excelência:                                                       |
| 1. Assessoria & Condução Executiva (Do primeiro rascunho ao último brinde)       |
| 2. Identidade Visual & Convites de Prestígio (Alta-costura digital interativa)    |
| 3. Conforto e Mordomia dos Convidados (Check-in VIP e memórias em tempo real)     |
+-----------------------------------------------------------------------------------+
| CASAMENTOS REAIS & CELEBRAÇÕES (O PORTFÓLIO EM FOCO):                             |
| [Imagem Editorial 1] Casamento no Polana Serena · Jessica & Samuel                |
| [Imagem Editorial 2] Cerimónia Tradicional de Lobolo · Maputo                     |
| [Imagem Editorial 3] Destination Wedding no Arquipélago de Bazaruto               |
| Link discreto: "Explorar o Portfólio do Atelier →"                                |
+-----------------------------------------------------------------------------------+
| O MOTOR DIGITAL INVISÍVEL (TECNOLOGIA COM PROPÓSITO DE LUXO):                     |
| "Como a nossa engenharia proprietária protege a serenidade do seu grande dia:"    |
| - Convites Digitais Cinematográficos com Trilha Sonora & RSVP Restrito            |
| - Gestão de Mesas, Acompanhantes e Dietary Requirements sem Planilhas Caóticas    |
| - HAXR Concierge: Mordomia Digital Privada 24/7 para os Noivos                   |
+-----------------------------------------------------------------------------------+
| DESTINATION WEDDINGS MOÇAMBIQUE:                                                  |
| "Das falésias do Sul às praias virgens de Vilankulo e Bazaruto."                  |
| Logística completa para casais da diáspora e celebrações internacionais.          |
+-----------------------------------------------------------------------------------+
| O MÉTODO HAXR (DO BRIEFING À CELEBRAÇÃO):                                         |
| Fase 1: Visão & Alocação Orçamental Blindada                                      |
| Fase 2: Curadoria de Fornecedores de Elite & Cenografia                           |
| Fase 3: Convites, Confirmações e Protocolo Cerimonial                             |
| Fase 4: Produção Executiva no Dia (A tranquilidade absoluta da família)           |
+-----------------------------------------------------------------------------------+
| PALAVRAS DE QUEM CONFIOU NA NOSSA ASSINATURA:                                     |
| Citações reais de noivos destacando a paz de espírito e a elegância no dia.       |
+-----------------------------------------------------------------------------------+
| CONVITE FINAL:                                                                    |
| "Inicie o planeamento do seu grande dia com quem domina cada segundo."            |
| [ Marcar Reunião Privada no Atelier ] · [ Enviar Mensagem Direta via WhatsApp ]   |
+-----------------------------------------------------------------------------------+
| FOOTER EDITORIAL: Av. Julius Nyerere, Maputo · Contactos Oficiais · Links Legais  |
+-----------------------------------------------------------------------------------+
```

---

## 3. Auditoria do "Authority Gap" (Lacuna de Autoridade)

Para que a HAXR seja percecionada instantaneamente como a escolha inquestionável de casais de alta renda:

1. **Equipa & Fundador (`AUTHORITY_ASSET_REQUIRED`):**
   - Atualmente, o site não apresenta uma figura humana de liderança criativa. Os clientes de casamentos de luxo querem conhecer o/a Diretor(a) Criativo(a).
   - **Recomendação Honesta:** Criar uma página `/sobre` com uma fotografia de estúdio sóbria da liderança, detalhando a visão do atelier, a formação e a paixão pelo protocolo e estética cerimonial moçambicana.
2. **Histórias Reais de Casamento (`AUTHORITY_ASSET_REQUIRED`):**
   - O portfólio atual exibe amostras de convites digitais, mas faltam reportagens de casamentos reais organizados pelo atelier.
   - **Recomendação:** Estruturar 3 a 5 estudos de caso reais com o consentimento dos noivos (ou pseudónimos discretos se exigirem privacidade), incluindo:
     - Local (ex: Polana Serena, Quinta das Acácias, Catembe)
     - Desafio de produção
     - Paleta cromática e design floral
     - Coordenação do cortejo e timing cerimonial
     - Créditos fotográficos formais
3. **Depoimentos de Assessoria Completa (`AUTHORITY_ASSET_REQUIRED`):**
   - Os dois únicos depoimentos existentes mencionam apenas os convites digitais. É imperativo recolher depoimentos que expressem: *"A equipa da HAXR garantiu que eu e a minha mãe vivêssemos o dia com total tranquilidade, sem qualquer imprevisto com o catering ou os convidados"*.
4. **Política Rigorosa:** Não fabricar prémios fictícios ou logótipos falsos de imprensa. A autoridade de luxo constrói-se com transparência e sofisticação no detalhe.

---

## 4. Otimização de Taxa de Conversão (CRO) & Hierarquia de CTAs

### Diagnóstico de Fricção Atual:
O site atual apresenta uma cacofonia de chamadas para ação concorrentes no mesmo ecrã:
- *"Ver Demonstração"*
- *"Criar Conta Gratuita"*
- *"Explorar Ferramentas"*
- *"Ver Convites"*
- *"Pedir Proposta"*
- *"Falar no WhatsApp"*

Isto confunde o visitante de alto poder de compra, que não quer registar-se numa ferramenta self-service, mas sim contratar uma assessoria de confiança.

### Nova Hierarquia de Conversão de Luxo:
1. **CTA Primário (Alta Intenção):**  
   `[ Agendar Consulta no Atelier ]` -> Conduz a um formulário requintado em `/contacto` com campos de qualificação (Data prevista, Localidade/Espaço, Número de convidados estimado, Serviços pretendidos).
2. **CTA Secundário (Aconselhamento Imediato):**  
   `[ Falar Diretamente com a Coordenação ]` -> Inicia conversa discreta no WhatsApp oficial do atelier com mensagem pré-formatada e cortês.
3. **CTA Terciário (Exploração Editorial):**  
   `[ Conhecer o Portfólio ]` ou `[ Ver Convites de Alta-Costura ]`.

---

## 5. Auditoria de Acessibilidade (WCAG 2.2 AA)

- **Contraste de Cores:** A paleta HAXR (Preto Noir `#080706`, Dourado Champanhe `#C5A880`, Marfim `#FAF8F5`) apresenta bom contraste no texto principal. Contudo, em alguns botões secundários com texto dourado sobre fundo claro, o rácio de contraste desce abaixo de `4.5:1`. Deve ser ajustado para `#9C7C54` ou aplicado fundo escuro.
- **Hierarquia de Títulos Semânticos:** Garantir a presença de um único `<h1>` por página, seguido de `<h2>` estruturados sem saltos diretos para `<h4>`.
- **Foco por Teclado:** Adicionar aneis de foco visíveis (`focus-visible:ring-2 focus-visible:ring-brand-gold`) em todos os links e botões interativos para navegação sem rato.
- **Redução de Movimento:** As animações Framer Motion e Lenis devem respeitar obrigatoriamente a media query `@media (prefers-reduced-motion: reduce)`, desativando transições bruscas para utilizadores sensíveis.

---

## 6. Auditoria de Performance & Core Web Vitals

- **LCP (Largest Contentful Paint):**  
  O maior elemento na homepage é a imagem ou vídeo de fundo do Hero. Deve ser utilizada a propriedade `priority` do `next/image`, fornecendo formatos modernos `.webp` e `.avif` com `sizes="100vw"` para evitar downloads desnecessários de resoluções de desktop em ecrãs móveis.
- **CLS (Cumulative Layout Shift):**  
  Excelente estabilidade geral graças à declaração de largura/altura explícita em imagens e reserva de espaço em fontes com `display: swap` (Fraunces e Source Sans 3).
- **INP (Interaction to Next Paint):**  
  Risco baixo; a maior parte da página marketing é renderizada no servidor (RSC) com hidratação leve de ilhas interativas.

---

## 7. Tabela de Pontuação da Experiência HAXR (0–10)

| Dimensão | Pontuação Atual | Pontuação Alvo | Principais Causas da Pontuação |
| :--- | :---: | :---: | :--- |
| **Posicionamento de Marca** | 6.5 | 9.8 | Mistura de linguagem de atelier de luxo com SaaS de software de eventos. |
| **Perceção de Luxo** | 7.0 | 9.9 | Tipografia nobre e paleta refinada, prejudicada por secções de calculadora e tabelas na home. |
| **Storytelling Visual** | 6.0 | 9.5 | Faltam fotografias monumentais de celebrações reais e da cultura moçambicana. |
| **Portfólio** | 5.0 | 9.2 | Atualmente focado em amostras de convites digitais; carece de casamentos completos. |
| **Autoridade & Confiança** | 5.0 | 9.0 | Ausência de apresentação da liderança/fundador e apenas 2 depoimentos no site. |
| **Comunicação dos Serviços** | 7.0 | 9.5 | A assessoria completa está ofuscada pelas ferramentas gratuitas. |
| **Diferenciação Tecnológica** | 9.0 | 9.8 | O motor de convites e o sistema de RSVP são de classe mundial. |
| **SEO Técnico** | 8.2 | 9.9 | Excelente base; necessita de corrigir o título duplicado e sitemap. |
| **SEO de Conteúdo** | 5.5 | 9.2 | Artigos de Insights muito curtos; falta de guias completos de Lobolo e casamentos. |
| **SEO de Destinos (Moçambique)** | 3.5 | 9.5 | Quase nulo para Bazaruto, Vilankulo e casamentos balneares. |
| **Performance Web** | 8.5 | 9.5 | Arquitetura Next.js 15 rápida; precisa de calibrar pesos de imagens de hero. |
| **Acessibilidade (WCAG 2.2 AA)**| 7.5 | 9.5 | Ajustes necessários no contraste do dourado sobre marfim e anéis de foco. |
| **Conversão & CRO** | 6.0 | 9.4 | Concorrência excessiva entre botões de ação na homepage. |
| **Experiência Mobile** | 8.0 | 9.6 | Fluida e responsiva, beneficiará de menus mais leves e CTAs simplificados. |
| **Transparência & E-E-A-T** | 5.5 | 9.2 | Necessita de morada física confirmada, autoria nos guias e depoimentos verificáveis. |

**Pontuação Geral Atual:** `6.3 / 10`  
**Pontuação Geral Alvo:** `9.5 / 10`
