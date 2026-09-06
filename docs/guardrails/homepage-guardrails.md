# Guardrail de Arquitectura e Bloqueio da Homepage (Phase B.6 -> Phase C)

**Data de Fixação:** 06 de Setembro de 2026  
**Auditor / Autor:** Antigravity — Engenharia Full-Stack & Arquitectura de Software  
**Classificação:** Bloqueio Mandatório de Estrutura (*Locked Architectural Guardrail*)  
**Língua:** Português de Moçambique  

---

## 1. Estatuto de Bloqueio Mandatório

Por directriz expressa da administração da HAXR Signature, a estrutura e a sequência de secções da Homepage (`/`) encontram-se formalmente e categoricamente **trancadas**.

```text
HOMEPAGE_STRUCTURE_LOCKED=true
HOMEPAGE_SECTION_ORDER_LOCKED=true
```

> [!CAUTION]
> **REGRA DE OURO PARA A FASE C:**  
> É estritamente proibido alterar a ordem, adicionar novas secções principais não homologadas, eliminar secções existentes ou desmantelar os nós estruturais da Homepage na Fase C.  
> Qualquer proposta futura deve respeitar a exigência:  
> `PROPOSED_HOMEPAGE_SECTION_ORDER === CURRENT_HOMEPAGE_SECTION_ORDER`.

---

## 2. Sequência Exacta das Secções da Homepage (`HomeClient.tsx`)

A sequência de renderização canónica, verificada directamente no código-fonte em tempo de execução (`src/components/sections/HomeClient.tsx`), é a seguinte:

```typescript
export const CURRENT_HOMEPAGE_SECTION_ORDER = [
  "Hero (Hero.tsx)",
  "WeddingAdvisory (WeddingAdvisory.tsx)",
  "HomePlatformShowcase (HomePlatformShowcase.tsx)",
  "HomeConciergeSection (HomeConciergeSection.tsx)",
  "HomeToolsGrid (HomeToolsGrid.tsx)",
  "HomeVendorCategories (HomeVendorCategories.tsx)",
  "DigitalInvitations (DigitalInvitations.tsx)",
  "HomeWeddingGallery (HomeWeddingGallery.tsx)",
  "InspirationFeed (InspirationFeed.tsx)",
  "HomeHowWeWork (HomeHowWeWork.tsx)",
  "HomeTestimonialsTeaser (HomeTestimonialsTeaser.tsx)",
  "CTABand (CTABand.tsx)"
] as const;
```

### Detalhe por Componente:

1. **`Hero` (`src/components/sections/Hero.tsx`)**
   - H1 Canónico: "A forma mais fácil de planear"
   - Selector de data cerimonial e CTA principal "Começar a Planear"
   - Navegação secundária para acesso ao painel de controlo
2. **`WeddingAdvisory` (`src/components/sections/WeddingAdvisory.tsx`)**
   - Apresentação da assessoria cerimonial e curadoria de alta-costura HAXR
3. **`HomePlatformShowcase` (`src/components/home/HomePlatformShowcase.tsx`)**
   - Demonstração da plataforma de gestão e ecossistema operacional
4. **`HomeConciergeSection` (`src/components/home/HomeConciergeSection.tsx`)**
   - Secção de triagem assistida HAXR Concierge (`full={false}`)
5. **`HomeToolsGrid` (`src/components/home/HomeToolsGrid.tsx`)**
   - Grelha interactiva de ferramentas de planeamento (Checklist, Catering, Assentos, etc.)
6. **`HomeVendorCategories` (`src/components/home/HomeVendorCategories.tsx`)**
   - Directório curado de categorias de fornecedores de casamentos em Moçambique
7. **`DigitalInvitations` (`src/components/sections/DigitalInvitations.tsx`)**
   - Montra dos convites digitais interactivos e do motor *Edition Engine*
8. **`HomeWeddingGallery` (`src/components/home/HomeWeddingGallery.tsx`)**
   - Galeria visual de momentos e celebrações sob curadoria do atelier
9. **`InspirationFeed` (`src/components/sections/InspirationFeed.tsx`)**
   - Painel dinâmico de referências visuais, paletas cromáticas e tendências
10. **`HomeHowWeWork` (`src/components/marketing/home/HomeHowWeWork.tsx`)**
    - Metodologia de trabalho em quatro fases do planeamento cerimonial
11. **`HomeTestimonialsTeaser` (`src/components/marketing/home/HomeTestimonialsTeaser.tsx`)**
    - Depoimentos e testemunhos reais de noivos anfitriões
12. **`CTABand` (`src/components/marketing/PageHero.tsx`)**
    - Faixa de encerramento e chamada final para agendamento de assessoria privada
