# Proposta de Arquitetura de Informação, Portfólio & Estratégia de Destino (2026)

**Alvo:** [https://www.haxrsignature.com](https://www.haxrsignature.com)  
**Posicionamento:** Private Planning Atelier & Alta-Costura Digital  
**Data:** 2026-09-06  
**Estado:** `AUDIT_PROPOSAL` (Apenas Planeamento Arquitetural — Sem Alteração de Código)

---

## 1. Diagnóstico da Arquitetura de Informação Atual

### 1.1 O Desequilíbrio Crítico: "SaaS Utility vs. Luxury House"
Atualmente, o website da HAXR Signature apresenta uma tensão estrutural que compromete a perceção de alta-costura:
- **Sobredimensionamento de Ferramentas e Utilitários:** A navegação de topo e as secções primárias da homepage destacam calculadoras de catering, ferramentas de orçamento, gerador de cronogramas e capturas de ecrã de dashboards de software.
- **Subdimensionamento de Autoridade e Celebrações Reais:** A narrativa sobre quem conduz os casamentos, a experiência de produção cerimonial no terreno, as fotografias de casais e mesas de banquete reais, e o acolhimento do atelier estão escondidos ou ausentes.

> **Princípio Orientador:**  
> A tecnologia proprietária da HAXR (Convites Edition, Concierge, Check-in VIP, Gestão de Convidados) é um **multiplicador de serenidade**, e não o produto final de venda direta aos noivos de luxo. A tecnologia deve ser apresentada como a **infraestrutura invisível e sofisticada** que garante que nenhum detalhe falhe no dia do casamento.

---

## 2. Nova Taxonomia de Navegação & Hierarquia Estrutural

### 2.1 Navegação Principal (Header Editorial)
```text
[ LOGO HAXR SIGNATURE ]

• O ATELIER        (/sobre)            - A nossa história, visão cerimonial e direção criativa
• ASSESSORIA       (/assessoria)       - Condução completa, styling & produção de casamentos
• DESTINATIONS     (/destination-weddings) - Celebrações em Maputo, Bazaruto e Vilankulo
• REAL WEDDINGS    (/portfolio)        - Casamentos reais, editoriais e estudos de caso
• ALTA-COSTURA DIGITAL (/plataforma-eventos) - Convites interativos, Concierge e mordomia digital
• JOURNAL          (/guias)            - Crónicas de etiqueta, tendências e lobolo

[ AGENDAR CONSULTA PRIVADA ] (CTA Principal no Header)
```

### 2.2 Reorganização de Páginas Utilitárias (Subordinação ao Produto/Atelier)
- `/ferramentas`: Mantida como página dedicada para noivos que procuram ferramentas avulsas e captação orgânica de topo de funil (SEO utilitário), mas removida do menu de navegação primário de luxo.
- `/fornecedores`: Reposicionada de "Diretório Comercial" para **"Curadoria de Fornecedores do Atelier"** (uma rede seleta de parceiros homologados pela HAXR).

---

## 3. Estratégia de Portfólio & Apresentação de Estudos de Caso Reais (B10)

Em comparação com os ateliers internacionais de elite (Sarah Haywood, Colin Cowie, Banana Split), o portfólio da HAXR deve abandonar a exibição de convites soltos e adotar o modelo de **Estudo de Caso Editorial Completo**.

### 3.1 Estrutura Canónica de um Estudo de Caso (`/portfolio/[slug]`)
1. **Hero Cinematográfico:** Imagem de abertura de grande impacto (ex: o cortejo, a decoração floral da recepção ou a chegada dos noivos).
2. **Ficha de Identidade do Evento:**
   - Casal (ex: *Jessica & Samuel* — ou pseudónimo discreto caso haja protocolo de confidencialidade)
   - Localização & Espaço (ex: *Hotel Polana Serena, Maputo*)
   - Tipo de Celebração (ex: *Casamento Religioso & Banquete de Gala*, ou *Celebração Tradicional de Lobolo*)
   - Escala (ex: *350 Convidados*)
3. **O Desafio Criativo & Logístico:**
   - O briefing dos noivos, a história de amor e a visão pretendida.
   - O desafio de produção superado pelo Atelier (ex: coordenação meteorológica em cerimónia exterior, gestão de convidados internacionais, harmonização de protocolo tradicional e contemporâneo).
4. **Cenografia, Flores & Design:**
   - Paleta cromática, iluminação cénica e detalhes de alta joalharia floral.
5. **A Engenharia da Experiência dos Convidados:**
   - Como os convites interativos HAXR Edition introduziram a atmosfera do casamento aos convidados antes do grande dia.
   - O acolhimento no dia: check-in fluído e assistência discreta do Concierge.
6. **Galeria de Fotografias em Alta Definição:**
   - Mosaico editorial com layout dinâmico e suporte a ecrãs retina.
7. **Créditos da Curadoria (Fornecedores de Elite):**
   - Fotografia oficial, videografia, pastelaria fina, design floral, som e iluminação (fortalece parcerias da indústria e autoridade mútua).
8. **Testemunho Autêntico dos Noivos ou Família:**
   - Citação direta sobre a tranquilidade e perfeição vivida.
9. **Convite ao Casal Seguidor:**
   - CTA sutil: *"Imagine a sua celebração com a assinatura HAXR. Agende uma conversa privada."*

---

## 4. Estratégia de Destination Weddings em Moçambique (B11)

Moçambique possui alguns dos cenários costeiros mais exclusivos e deslumbrantes do planeta (Arquipélago de Bazaruto, Baía de Vilankulo, Ponta Mamoli, Ilha de Moçambique), atraindo a diáspora moçambicana e casais internacionais de África do Sul, Europa e América.

### 4.1 Arquitetura de URLs Proposta
```text
/destination-weddings                     (Hub Central de Celebrações de Destino)
  ├── /destination-weddings/mozambique    (Guia Definitivo para Casar em Moçambique)
  ├── /destination-weddings/maputo        (Casamentos Cosmopolitas & Históricos na Capital)
  ├── /destination-weddings/vilankulo     (Praias Paradisíacas & Resorts de Charme)
  └── /destination-weddings/bazaruto      (Exclusividade de Ilha Privada & Luxo Selvagem)
```

### 4.2 Plano Editorial Contra Páginas Ocas ("Anti-Doorway Policy")
Nenhuma página de destino será criada sem conteúdo factual substancial. Cada rota conterá:
- **Logística & Acessibilidade:** Informação real sobre voos (ex: voos diretos Joanesburgo-Vilankulo, transferes de helicóptero para Bazaruto, vistos à chegada).
- **Melhores Épocas & Clima:** Análise da sazonalidade (estação seca de Maio a Outubro vs. meses de chuva).
- **Legislação & Protocolo Matrimonial:** Guia legal e cerimonial para casamentos civis e religiosos de estrangeiros em Moçambique.
- **Hospedagem & Conforto dos Convidados:** Recomendações de resorts de luxo homologados.
- **Apoio Integral do Atelier:** Gestão de transportes, jantares de boas-vindas ("welcome dinner") e safaris/passeios pós-casamento.

---

## 5. Estratégia de Internacionalização (i18n) (B12)

### 5.1 Base Canónica
- **Idioma Principal:** Português de Moçambique (`pt-MZ` / `pt`).
- **Público Local & Diáspora:** A maioria dos casamentos HAXR ocorre com famílias moçambicanas residentes em Maputo ou na diáspora (Portugal, Reino Unido, África do Sul).

### 5.2 Expansão Internacional para Inglês
- **Subpasta Dedicada:** `/en/` (ex: `haxrsignature.com/en/destination-weddings`).
- **Implementação Segura:**
  - `hreflang="pt"` apontando para a versão portuguesa canónica.
  - `hreflang="en"` apontando para as páginas internacionais correspondentes.
  - `x-default` apontando para a página inicial canónica.
- **Tradução Humana & Editorial:** Proibida a tradução automática mecânica. Termos cerimoniais de luxo exigem vocabulário nativo em inglês (*Full-Service Planning, Bespoke Wedding Design, On-the-Day Production*).
- **Fluxo de Atendimento Internacional:** Formulário de contacto em inglês com opção de fuso horário e agendamento de chamada de vídeo via Zoom/Google Meet para casais no estrangeiro.

---

## 6. Otimização da Taxa de Conversão (CRO) & Hierarquia de CTAs (B15)

### 6.1 Problema Atual
O website atual apresenta 5 a 6 CTAs com o mesmo peso visual na homepage:
- "Começar Agora" (ambíguo: é criar conta no software ou contratar o atelier?)
- "Explorar Ferramentas"
- "Criar Convite"
- "Ver Fornecedores"
- "Falar no WhatsApp"

Isso gera fricção cognitiva e dispersa noivos de alto valor que desejam apenas contratar uma equipa de excelência.

### 6.2 Nova Hierarquia Rigorosa de Três Níveis
1. **CTA Primário (Nível Ouro - Alto Valor):**
   - **Texto:** `"Agendar Consulta Privada"` ou `"Conversar com o Atelier"`
   - **Destino:** Formulário de Consulta Refinado (`/contacto` ou gaveta modal com design de alta-costura).
   - **Campos Estratégicos:** Nome do Casal, Data Prevista do Casamento, Cidade/Destino, Número Estimado de Convidados, Tipo de Apoio Pretendido (Assessoria Completa / Design & Convites / Produção do Dia).
2. **CTA Secundário (Nível Marfim - Acolhimento Imediato):**
   - **Texto:** `"Atendimento Privado via WhatsApp"`
   - **Destino:** Link oficial do WhatsApp Business do Atelier com mensagem pré-formatada profissional:  
     *“Olá HAXR Signature, gostaria de conhecer os serviços de assessoria para o meu casamento.”*
3. **CTA Terciário (Nível Linha Fina - Descoberta):**
   - **Texto:** `"Explorar o Portfólio"` ou `"Conhecer o Método do Atelier"`
   - **Destino:** Páginas de conteúdo e estudos de caso.

---

## 7. Roteiro Priorizado de Implementação (Roadmap B19)

### 7.1 Matriz de Priorização (P0 a P3)

| Prioridade | Iniciativa | Impacto | Esforço | Risco | Páginas Afetadas | Dependências |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **P0** | **Correção do Título Duplicado na Homepage** (Metadata Template fix) | Alto (SEO & SERP) | Mínimo | Nulo | Homepage (`/`) | Nenhuma (Ajuste em `seo.ts` / `layout.tsx`) |
| **P0** | **Remoção de Emojis e Normalização de Alt Texts** | Médio (Acessibilidade) | Baixo | Nulo | Global (`components/`) | Nenhuma |
| **P0** | **Consolidação do CTA Primário no Header & Hero** | Alto (CRO) | Baixo | Baixo | Header, Hero, CTABand | Design do formulário de agendamento |
| **P1** | **Redesenho da Homepage (Wireframe de Luxo)** | Crítico (Posicionamento) | Médio | Baixo | Homepage (`/`) | Aprovação do Wireframe da Auditoria |
| **P1** | **Criação da Página do Atelier / Sobre Nós** | Crítico (Autoridade) | Médio | Baixo | Nova rota `/sobre` | Fotografias do Fundador/Equipa |
| **P1** | **Migração de Showcases Técnicos para Páginas Dedicadas** | Alto (Branding) | Baixo | Baixo | Homepage, `/plataforma-eventos` | Criação de `/plataforma-eventos` |
| **P2** | **Estruturação do Portfólio com 3 Estudos de Caso Reais** | Crítico (Autoridade) | Médio | Baixo | `/portfolio`, `/portfolio/[slug]` | Materiais e fotos de casamentos reais |
| **P2** | **Pilar de Destination Weddings (Maputo, Bazaruto, Vilankulo)** | Alto (SEO & Internacional) | Elevado | Baixo | `/destination-weddings/*` | Curadoria de conteúdo e logística de destino |
| **P3** | **Internacionalização em Inglês (`/en/`)** | Médio-Alto | Médio | Baixo | Rotas `/en/*` | Revisão de copy por tradutor de luxo |
| **P3** | **Micro-interações Suaves e Refinamento de Tipografia** | Médio (Estética) | Baixo | Baixo | Global CSS / Animações | Testes de performance de framerate |

---

## 8. Conclusão & Prontidão Operacional

A HAXR Signature possui uma fundação tecnológica impecável, agora blindada com **Neon PostgreSQL** e **Cloudflare R2**, sem dívidas técnicas legadas.

A transformação da presença pública para o patamar de **World-Class Wedding House** não requer a reconstrução da plataforma, mas sim o **realinhamento elegante da sua narrativa**: colocando as histórias dos noivos e a excelência da assessoria cerimonial no centro da experiência visual, sustentadas pela melhor engenharia digital de Moçambique.
