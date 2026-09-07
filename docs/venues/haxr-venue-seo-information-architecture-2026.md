# HAXR SIGNATURE — ARQUITECTURA DE INFORMAÇÃO & SEO TÉCNICO (2026)
# Guia Canónico de Locais para Casamentos e Celebrações em Moçambique

**Documento:** `docs/venues/haxr-venue-seo-information-architecture-2026.md`  
**Fase:** E.0 — Venue Intelligence & Data Foundation  
**Data:** 07 de Setembro de 2026  
**Autor:** Antigravity — Principal Full-Stack Engineer / Alta-Costura Digital  
**Classificação:** Especificação de Arquitectura de Informação & Estratégia de SEO Local  
**Norma Linguística:** Português de Moçambique  

---

## 1. Intenção de Pesquisa Local em Moçambique (Search Intent Analysis)

A investigação do comportamento de pesquisa de casais e anfitriões moçambicanos revela vocabulário e padrões de intenção muito específicos, distintos do português de Portugal ou do Brasil:

### 1.1. Vocabulário Orgânico Moçambicano vs Termos Genéricos
1. **"Salão para Casamento" / "Salões de Eventos":**  
   É o termo de maior volume orgânico nas áreas metropolitanas de Maputo e Matola. Os utilizadores procuram espaços fechados com ar condicionado para mitigar o calor e a humidade da época chuvosa (Outubro a Março);
2. **"Quinta para Casamentos" / "Quintas na Matola":**  
   Forte intenção associada ao corredor da Matola-Rio, Machava, Boane e Marracuene, denotando espaços campestres com relvados exteriores para cerimónias de jardim e tendas climatizadas;
3. **"Espaço para Lobolo":**  
   Intenção de pesquisa culturalmente nuclear e exclusiva em Moçambique. O Lobolo exige espaços que permitam rituais tradicionais, áreas ajardinadas para recepção das famílias e acomodação de 200 a 400 convidados em ambiente caloroso;
4. **"Locais para Casamento em Maputo":**  
   Termo guarda-chuva de topo de funil utilizado por anfitriões cosmopolitas e casais da diáspora que procuram hotéis de luxo na orla marítima (Marginal) ou salões históricos na Polana.

### 1.2. Directriz Anti-Keyword-Stuffing
A HAXR Signature rejeita em absoluto a repetição robótica de palavras-chave. A optimização orgânica é alcançada através de **relevância semântica profunda, entidades de autoridade, dados estruturados rigorosos e especificações técnicas inalcançáveis para directórios genéricos**.

---

## 2. Estrutura Canónica de URLs & Arquitectura de Informação (Futuras Fases)

> [!IMPORTANT]
> **Estatuto na Fase E.0:** Nenhuma rota pública está criada ou acessível nesta fase. A hierarquia abaixo representa o mapa de navegação aprovado para a futura publicação (Fase E.3).

```text
/locais-para-casamentos                              [Hub Central Moçambique]
│
├── /maputo                                          [Hub Urbano: Salões, Hotéis & Centros]
│   ├── /the-venue-mz                                [Perfil Físico Verificado]
│   ├── /polana-serena-hotel                         [Perfil Físico Verificado]
│   ├── /southern-sun-maputo                         [Perfil Físico Verificado]
│   └── /evelyn-eventos                              [Perfil Físico Verificado]
│
├── /matola                                          [Hub Matola & Matola-Rio: Quintas & Vilas]
│   ├── /vila-verde                                  [Perfil Físico Verificado]
│   ├── /alianca-eventos                             [Perfil Físico Verificado]
│   └── /casa-d-artista-kutenga                      [Perfil Físico Verificado]
│
└── /tipos                                           [Taxonomia por Tipologia Espacial]
    ├── /quintas-para-casamento                      [Colecção Curada de Quintas]
    ├── /saloes-para-casamento                       [Colecção Curada de Salões Climatizados]
    ├── /hoteis-para-casamento                       [Colecção de Hotéis de Prestígio]
    └── /espacos-para-lobolo                         [Colecção de Espaços Vocacionados a Lobolo]
```

### 2.1. Princípio de URLs Limpas e Canónicas
- A URL canónica de cada espaço físico é única e reside sob o seu nó geográfico principal (ex.: `https://www.haxrsignature.com/locais-para-casamentos/maputo/the-venue-mz`);
- As páginas de tipologia espacial (`/tipos/quintas-para-casamento`) funcionam como filtros de curadoria e apontam nas suas fichas para as URLs canónicas dos locais, prevenindo qualquer canibalização interna.

---

## 3. Directrizes Anti-Páginas Satélite (Anti-Doorway Guidelines) & Prevenção de Thin Content

Para cumprir rigorosamente as directrizes de qualidade da Google e salvaguardar a autoridade de domínio da HAXR:

### 3.1. Regra de Limiar de Conteúdo para Página Individual
Um local de eventos só terá autorização para ter uma página individual dedicada (`/locais-para-casamentos/[cidade]/[slug]`) se cumprir cumulativamente:
1. Pelo menos **300 palavras de texto editorial original e exclusivo**, redactado pela equipa do atelier (proibido copiar descrições promocionais de redes sociais);
2. **Ficha técnica confirmada** com pelo menos 5 dimensões validadas (`IDENTITY`, `LOCATION`, `CONTACT`, `CAPABILITY`, `CAPACITY`);
3. Mínimo de **4 imagens fotográficas de alta resolução** armazenadas no Cloudflare R2 evidenciando o espaço real montado;
4. Informações práticas auditadas (gerador, climatização, sanitários, estacionamento).

### 3.2. Tratamento de Locais com Dados Parciais (`A_CONFIRMAR`)
Espaços que se encontrem em fase de mapeamento preliminar ou com dados parciais **não recebem página indexável própria**. São apresentados exclusivamente como cartões informativos compactos no hub da cidade ou permanecem em rascunho interno, evitando a proliferação de páginas ocas (*thin pages*).

---

## 4. Dados Estruturados Canónicos (Schema.org / JSON-LD)

Os motores de busca indexarão o guia com suporte ao vocabulário oficial `schema.org`.

### 4.1. Esquema do Hub de Colecção (`ItemList` + `BreadcrumbList`)

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "HAXR Signature",
          "item": "https://www.haxrsignature.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Locais para Casamentos",
          "item": "https://www.haxrsignature.com/locais-para-casamentos"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Maputo",
          "item": "https://www.haxrsignature.com/locais-para-casamentos/maputo"
        }
      ]
    },
    {
      "@type": "ItemList",
      "name": "Salões e Espaços para Casamentos em Maputo",
      "description": "Selecção curada e editorialmente verificada de espaços físicos para casamentos e celebrações em Maputo pela HAXR Signature.",
      "numberOfItems": 4,
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "url": "https://www.haxrsignature.com/locais-para-casamentos/maputo/the-venue-mz"
        }
      ]
    }
  ]
}
```

### 4.2. Esquema para Perfil Individual de Local (`Place` / `EventVenue`)

```json
{
  "@context": "https://schema.org",
  "@type": ["Place", "EventVenue"],
  "name": "The Venue MZ",
  "alternateName": "The Venue",
  "description": "Espaço contemporâneo para casamentos e celebrações situado em Albazine, distrito de KaMavota, Maputo.",
  "url": "https://www.haxrsignature.com/locais-para-casamentos/maputo/the-venue-mz",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Bairro de Albazine",
    "addressLocality": "Maputo",
    "addressRegion": "KaMavota",
    "addressCountry": "MZ"
  },
  "telephone": "+258843218359",
  "maximumAttendeeCapacity": 400,
  "amenityFeature": [
    {
      "@type": "LocationFeatureSpecification",
      "name": "Gerador de Emergência Industrial",
      "value": true
    },
    {
      "@type": "LocationFeatureSpecification",
      "name": "Climatização Integral",
      "value": true
    },
    {
      "@type": "LocationFeatureSpecification",
      "name": "Parque de Estacionamento Privado",
      "value": true
    },
    {
      "@type": "LocationFeatureSpecification",
      "name": "Copa de Apoio a Catering",
      "value": true
    }
  ],
  "isAccessibleForFree": false
}
```

> [!WARNING]
> **Preservação de Atribuição:** O esquema `Place` / `EventVenue` nunca deve conter a HAXR Signature como `parentOrganization` ou `owner`. A HAXR actua unicamente como autor ou curador editorial (`author` / `publisher`).

---

## 5. Estratégia de Enlace Interno (Internal Linking)

A ligação entre o Guia de Locais e as restantes áreas do ecossistema HAXR Signature é calibrada para maximizar autoridade mútua sem poluir o percurso do utilizador:

1. **Ligação com a Ferramenta de Orçamento & Catering:**  
   As páginas de espaços com lotação verificada exibirão links contextuais discretos para a calculadora de bebidas e catering da HAXR (`/ferramentas/calculadora-bebidas-catering`);
2. **Ligação com Web-Convites HAXR:**  
   Em cada perfil de espaço, disponibiliza-se aos anfitriões a possibilidade de pré-carregar os dados de localização e trajecto para convidados no seu Web-Convite HAXR personalizado;
3. **Ligação com Casamentos Reais (Portfólio):**  
   Sempre que um casamento real do portfólio tiver decorrido num espaço do guia (ex.: Vila Verde, Evelyn Eventos, Casa d'Artista Kutenga), existirá uma referência cruzada contextual ("Espaço seleccionado para a celebração de Vânia & Fabião").
