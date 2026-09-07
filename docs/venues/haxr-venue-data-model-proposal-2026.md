# HAXR SIGNATURE — PROPOSTA DE MODELO DE DADOS & ARQUITECTURA TÉCNICA
# Modelo Canónico de Locais para Casamentos e Celebrações (Venues)

**Documento:** `docs/venues/haxr-venue-data-model-proposal-2026.md`  
**Fase:** E.0 — Venue Intelligence & Data Foundation  
**Data:** 07 de Setembro de 2026  
**Autor:** Antigravity — Principal Full-Stack Engineer / Alta-Costura Digital  
**Classificação:** Especificação Técnica de Modelação & Recomendação Arquitectural  
**Norma Linguística:** Português de Moçambique  

---

## 1. Contexto & Inspecção da Arquitectura Existente

Para desenhar uma fundação sustentável e minimalista, foi analisada minuciosamente a arquitectura de dados e código activa na HAXR Signature:

1. **Repositório de Fornecedores (`supplier_profiles` em Neon / `src/lib/vendors/`):**
   - Modela genericamente fornecedores de casamentos divididos em 10 categorias (`venues`, `photographers`, `videographers`, `caterers`, `decor`, `music`, `beauty`, `stationery`, `planning`, `other`);
   - Utiliza campos genéricos (`business_name`, `category`, `city`, `services`, `price_range`, `is_verified`);
   - **Limitação Crítica:** O atributo `is_verified` é um mero booleano binário indiferenciado. Não contempla distinção entre verificação de morada, potência de gerador, planta de lotação ou vistoria presencial; não possui suporte para atributos de infra-estrutura física (sanitários, AVAC, gerador kVA, cozinha industrial).

2. **Registo de Casamentos Reais (`src/lib/vendors/vendor-real-weddings.ts`):**
   - Modela celebrações reais com rigorosa governação de privacidade (`RealWedding`, `HaxrClientCelebrationJourney`);
   - Regista factualidades confirmadas pelo proprietário (`evelyn-eventos-casamento`, `kutenga-lobolo`, `vila-verde-casamento`);
   - Define a distinção basilar entre `guestScale` (ex.: `"cerca de 250 convidados"`, `"mais de 300 convidados"`) e capacidade arquitectónica homologada.

3. **Infra-estrutura Canónica de Produção:**
   - Base de Dados: Neon PostgreSQL (`haxrweb_runtime`);
   - Armazenamento Privado e Imagens: Cloudflare R2 (URLs assinados);
   - Alojamento e Edge: Vercel (Next.js App Router);
   - Dependência Supabase em Runtime: **ZERO**.

---

## 2. Avaliação Comparativa das Quatro Opções Arquitecturais de Base de Dados

Analisamos quatro abordagens para suportar os dados de locais antes de qualquer migração:

| Critério de Engenharia | Opção A: Dataset Editorial Tipado em Código (TS/JSON) | Opção B: Extensão da Tabela `supplier_profiles` Existente | Opção C: Modelo Relacional Dedicado em Neon PostgreSQL | Opção D (Recomendada): Modelo Híbrido Fases E.0/E.1 → E.2 |
| :--- | :--- | :--- | :--- | :--- |
| **Descrição Técnica** | Ficheiros TypeScript fortemente tipados em `src/lib/venues/data.ts`. | Adicionar colunas ou JSONB à tabela `supplier_profiles` em Neon. | Criar tabelas dedicadas: `venues`, `venue_spaces`, `venue_verifications`. | **Fase E.0/E.1:** Registo editorial tipado + **Fase E.2:** Modelo Neon dedicado para parcerias. |
| **Frequência de Actualização** | Baixa a Média (dados de locais mudam trimestralmente ou anualmente). | Média (acoplada ao ciclo de fornecedores gerais). | Alta (permite updates em tempo real via API/backoffice). | **Ideal:** Factualidade verificada sob controlo Git; actualizações operacionais em Neon. |
| **Fluxo de Verificação** | Exige Pull Request e revisão de código com evidência anexada. | Frágil: qualquer admin pode alterar booleanos na base de dados. | Robusto com auditoria e chaves estrangeiras em tabela de log. | **Máxima Rigidez:** Modificações críticas passam por revisão documental controlada. |
| **Requisitos de Backoffice / Admin** | Nenhum (edição via código / PR pelo engenheiro). | Requer ecrãs adicionais na área de fornecedores. | Requer construção de backoffice específico de auditoria de espaços. | Começa com zero overhead de UI admin, evoluindo no momento em que houver parceiros. |
| **Renderização SEO (Next.js)** | Imediata, estática em build-time (SSG/ISR); reduz a dependência de consultas à base de dados no caminho crítico de renderização pública dos locais. | Depende de queries em Neon por request ou revalidação ISR via Neon. | Depende de queries relacionais com JOINs em Neon. | **Performance Máxima:** SSG instantâneo para páginas públicas sem custo de egress Neon. |
| **Relações de Dados** | Relações explícitas via identificadores tipados (`venueId`, `vendorId`). | Limitada pela estrutura mono-tabela de fornecedores. | Relacional completa (1:N espaços por local, N:M fornecedores recomendados). | Relacional limpa e estrita sem acoplamento a tabelas legadas. |
| **Sobreposição com Fornecedores** | Clara separação entre espaço físico e fornecedor autónomo de catering/decoração. | Conflituosa (um espaço é forçado a comportar-se como fornecedor de serviços). | Totalmente desacoplada (espaço físico é entidade independente). | Totalmente desacoplada da categoria genérica de fornecedor. |
| **Custos & Egress Neon** | Zero consultas à base de dados para leituras de directório. | Consumo de egress na tabela partilhada de fornecedores. | Consumo adicional de ligações e egress no Neon. | **Custo Zero em Leitura Pública;** Egress reservado a dados privados e transaccionais. |
| **Custo de Manutenção** | Mínimo na fase inicial; sem dívida técnica nem migrações órfãs. | Alto (polui a tabela de fornecedores com atributos específicos de imobiliário). | Médio (exige manutenção de esquemas, migrações e permissões RLS). | **Equilibrado e progressivo:** Sem criação de esquemas prematuros. |

---

## 3. Recomendação Arquitectural Definitiva

### Diagnóstico de Engenharia
Integrar locais de eventos na tabela `supplier_profiles` (Opção B) seria um erro clássico de modelação (anti-padrão de sobrecarga de entidades). Um salão ou quinta não é um simples prestador de serviços móvel (como um fotógrafo ou DJ); é um **imóvel físico com coordenadas geográficas, atributos prediais, infra-estruturas electromecânicas pesadas, planos de evacuação e múltiplas salas/ambientes**.

Criar migrações relacionais no Neon agora (Opção C), sem que o produto tenha interface pública nem parceiros contratados, violaria o princípio de *YAGNI* (*You Aren't Gonna Need It*) e geraria esquemas órfãos sujeitos a alterações contínuas.

### A Abordagem Vencedora: Opção D (Modelo Híbrido Progressivo)
1. **Fase E.0 / E.1 (Fundação Editorial & Auditoria):**
   - Todos os dados canónicos de locais residirão num **registo TypeScript fortemente tipado** em `src/lib/venues/` com validação de esquema estrita;
   - Assegura renderização instantânea no Next.js (SSG/ISR), validação de tipos em compilação (`tsc`), auditoria em Git e **zero risco de dados fantasma** em produção;
   - Egress da base de dados Neon: **ZERO**.

2. **Fase E.2 / E.3 (Parcerias Comerciais & Backoffice Operacional):**
   - Quando surgirem parceiros comerciais formais (`HAXR_PARTNER=true`), contratos de exclusividade ou necessidade de atualização em tempo real de disponibilidade de datas, introduz-se a tabela relacional canónica `venues` e `venue_contracts` em Neon;
   - O Next.js consumirá o núcleo editorial combinado com o estado operacional do Neon.

> [!IMPORTANT]
> **Decisão Conforme o Mandato:** Nenhuma migração SQL será criada ou executada na base de produção durante a Fase E.0. O esquema relacional abaixo é uma proposta formal de referência para a Fase E.1/E.2.

---

## 4. Desenho do Modelo Canónico de Dados (Especificação TypeScript)

O modelo foi calibrado com base na realidade física e operacional de Moçambique (ex.: geradores comutados para falhas da rede EDM, abastecimento de água com furos artesianos e tanques subterrâneos, acessos rodoviários asfaltados vs terra batida, cerimónia tradicional de Lobolo).

```typescript
/**
 * HAXR Signature — Canonical Venue Domain Model
 * src/lib/venues/types.ts (Proposta para Fase E.1)
 */

export type FactualStatus = true | false | "A_CONFIRMAR";

export type VerificationSourceType =
  | "OWNER_CONFIRMED"
  | "OFFICIAL_SOURCE"
  | "VERIFIED_EXTERNAL_SOURCE"
  | "VISITED_BY_HAXR"
  | "DOCUMENTARY_EVIDENCE"
  | "A_CONFIRMAR";

export type VenueType =
  | "salao_eventos"      // Salão polivalente fechado
  | "quinta_eventos"     // Propriedade campestre com áreas abertas e cobertas
  | "hotel_urbano"       // Hotel de cidade com salas nobres de banquetes
  | "resort_praia"       // Complexo costeiro com frente de água ou praia
  | "centro_conferencias"// Centro de congressos com auditórios e pavilhões modulares
  | "jardim_privado"     // Espaço paisagístico ao ar livre
  | "espaco_cultural";   // Centro de artes, galeria ou património histórico

export type RoadAccessType =
  | "asfalto_integral"
  | "terra_batida_boa"
  | "terra_batida_degradada"
  | "piso_intertravado"
  | "A_CONFIRMAR";

export type CelebrationCapability = {
  casamentoCivil: FactualStatus;
  banqueteRecepcao: FactualStatus;
  loboloTradicional: FactualStatus;
  ceremoniaAoArLivre: FactualStatus;
  eventoCorporativo: FactualStatus;
};

export type TechnicalInfrastructure = {
  // Energia & Climatização
  temGeradorEmergencia: FactualStatus;
  geradorPotenciaKVA?: number;
  geradorComutacaoAutomatica: FactualStatus;
  temClimatizacaoCentral: FactualStatus;
  tipoClimatizacao?: "ar_condicionado_split" | "chiller_central" | "ventiladores" | "A_CONFIRMAR";

  // Água & Saneamento
  fonteAgua: "furo_artesiano" | "rede_fipag" | "misto" | "A_CONFIRMAR";
  tanqueReservaLitros?: number;
  sanitariosFemininosCabines?: number;
  sanitariosMasculinosCabines?: number;
  sanitariosAcessibilidadeAdaptados: FactualStatus;

  // Apoio a Brigadas Externas & Noivos
  copaApoioCatering: FactualStatus;
  cozinhaComCamaraFrigorifica: FactualStatus;
  suiteNoivaCamarimPrivado: FactualStatus;
  areaDescargaFornecedoresIndependente: FactualStatus;

  // Logística de Viaturas & Mobilidade
  estacionamentoProprio: FactualStatus;
  estacionamentoCapacidadeViaturas?: number;
  estacionamentoPavimentado: FactualStatus;
  acessoRodoviario: RoadAccessType;
  acessibilidadeCadeiraRodasGeral: FactualStatus;
};

export type SpaceConfiguration = {
  temAreaCoberta: FactualStatus;
  temAreaArLivre: FactualStatus;
  temJardimPaisagistico: FactualStatus;
  temPiscina: FactualStatus;
  temFrenteMarOuAgua: FactualStatus;
  areaUtilCobertaM2?: number;
  peDireitoMetros?: number;
};

export type VerifiedCapacity = {
  lotacaoMinimaRecomendada?: number;
  lotacaoMaximaSentada?: number;       // Formato banquete com mesas redondas de 10 pax
  lotacaoMaximaCoquetel?: number;      // Em pé com mesas altas de apoio
  distanciaMinimaMesasMetros?: number; // Norma HAXR: mínimo de 1.80m entre centros
  fonteHomologacao: VerificationSourceType;
  notasCapacidade?: string;
};

export type VenueTrustMatrix = {
  identityVerified: boolean;
  locationVerified: FactualStatus;
  contactVerified: boolean;
  venueCapabilityVerified: FactualStatus;
  capacityVerified: FactualStatus;
  visitedByHaxr: boolean;
  haxrVerified: boolean;
  haxrPartner: boolean;
  verificationSources: {
    identitySource?: string;
    locationSource?: string;
    contactSource?: string;
    capabilitySource?: string;
    capacitySource?: string;
  };
  lastVerifiedAt: string; // Data ISO, ex: "2026-09-07"
  auditorId: string;
};

export type VenueEditorialProfile = {
  resumoEditorial: string;            // Análise sóbria do atelier (mínimo 150 palavras)
  pontosFortes: string[];              // Factos observados no terreno
  desafiosLogistivos: string[];        // Alertas construtivos para a assessoria
  recomendacaoUsoHaxr: string;         // Vocação ideal da propriedade
  fotosHomologadasUrls: string[];      // URLs de imagem no Cloudflare R2
  plantaBaixaUrl?: string;             // Documento técnico no Cloudflare R2
};

export type VenueCommercialDetails = {
  modeloTarifario: "aluguer_espaco_puro" | "pacote_com_catering" | "sob_consulta" | "A_CONFIRMAR";
  moeda: "MZN" | "USD";
  precoEstimadoInicial?: number;       // Em Meticais (MZN)
  politicaHorarioEncerramento?: string; // Ex: "02:00h com limite de emissão sonora às 24:00h"
  contratoFormalParceria: boolean;
  comissaoDeclarada: boolean;
};

export type HaxrVenueRecord = {
  id: string;                          // Identificador canónico (ex: "the-venue-mz")
  slug: string;                        // Slug de URL (ex: "the-venue-mz")
  name: string;                        // Nome comercial canónico
  officialRegisteredName?: string;     // Razão social no Boletim da República
  alternateNames: string[];            // Nomes populares ou variações

  // Localização Administrativa Moçambicana
  country: "Moçambique";
  province: "Maputo (Cidade)" | "Maputo (Província)" | "Gaza" | "Inhambane" | "Sofala" | "Nampula";
  city: "Maputo" | "Matola" | "Marracuene" | "Boane";
  district: string;                    // Ex: "KaMavota", "Matola-Rio", "Polana Cimento"
  neighbourhood: string;               // Bairro: "Albazine", "Sommerschield", "Tchumeni I"
  addressDescription: string;          // Ponto de referência e morada física
  coordinates?: {
    latitude: number;
    longitude: number;
    precisaoGps: "EXACT" | "APPROXIMATE" | "A_CONFIRMAR";
  };

  // Contactos Operacionais Directos
  contacts: {
    primaryPhone?: string;
    secondaryPhone?: string;
    whatsappPhone?: string;
    operationalEmail?: string;
    officialWebsiteUrl?: string;
    officialInstagramUrl?: string;
    officialFacebookUrl?: string;
  };

  // Classificação & Capacidades
  venueType: VenueType;
  celebrations: CelebrationCapability;
  infrastructure: TechnicalInfrastructure;
  spaces: SpaceConfiguration;
  capacity: VerifiedCapacity;

  // Governação, Confiança & Editorial
  trust: VenueTrustMatrix;
  editorial: VenueEditorialProfile;
  commercial: VenueCommercialDetails;

  // Ciclo de Vida
  publicationStatus: "DRAFT_INTERNAL" | "AUDITED_READY" | "PUBLISHED";
  createdAt: string;
  updatedAt: string;
};
```

---

## 5. Proposta de Esquema Relacional de Referência (Futura Fase E.2 em Neon)

Para quando o volume de espaços ultrapassar 30 unidades verificadas ou quando houver contratos comerciais activos, a migração será executada através de tabelas normatizadas:

```sql
-- ESQUEMA RELACIONAL DE REFERÊNCIA — HAXR VENUE INTELLIGENCE (FUTURA FASE E.2)
-- Base de Dados: Neon PostgreSQL (haxrweb_runtime)
-- NOTA: NÃO EXECUTAR NA FASE E.0

CREATE TYPE venue_type_enum AS ENUM (
  'salao_eventos',
  'quinta_eventos',
  'hotel_urbano',
  'resort_praia',
  'centro_conferencias',
  'jardim_privado',
  'espaco_cultural'
);

CREATE TYPE venue_publication_status AS ENUM (
  'draft_internal',
  'audited_ready',
  'published',
  'archived'
);

CREATE TYPE factual_state_enum AS ENUM (
  'true',
  'false',
  'a_confirmar'
);

CREATE TABLE IF NOT EXISTS public.venues (
  id VARCHAR(64) PRIMARY KEY,
  slug VARCHAR(128) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  official_registered_name VARCHAR(255),
  alternate_names TEXT[] DEFAULT '{}',
  venue_type venue_type_enum NOT NULL,

  -- Localização
  country VARCHAR(64) NOT NULL DEFAULT 'Moçambique',
  province VARCHAR(64) NOT NULL,
  city VARCHAR(64) NOT NULL,
  district VARCHAR(64) NOT NULL,
  neighbourhood VARCHAR(64) NOT NULL,
  address_description TEXT NOT NULL,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  gps_precision VARCHAR(32) DEFAULT 'a_confirmar',

  -- Contactos
  primary_phone VARCHAR(32),
  secondary_phone VARCHAR(32),
  whatsapp_phone VARCHAR(32),
  operational_email VARCHAR(255),
  official_website_url TEXT,
  official_instagram_url TEXT,
  official_facebook_url TEXT,

  -- Infra-estrutura (Atributos Canónicos)
  has_emergency_generator factual_state_enum NOT NULL DEFAULT 'a_confirmar',
  generator_power_kva INTEGER,
  generator_auto_switch factual_state_enum NOT NULL DEFAULT 'a_confirmar',
  has_air_conditioning factual_state_enum NOT NULL DEFAULT 'a_confirmar',
  has_dedicated_kitchen factual_state_enum NOT NULL DEFAULT 'a_confirmar',
  has_bridal_suite factual_state_enum NOT NULL DEFAULT 'a_confirmar',
  has_private_parking factual_state_enum NOT NULL DEFAULT 'a_confirmar',
  parking_capacity_vehicles INTEGER,
  road_access_type VARCHAR(64) DEFAULT 'a_confirmar',
  has_wheelchair_accessibility factual_state_enum NOT NULL DEFAULT 'a_confirmar',

  -- Lotação
  verified_capacity_min INTEGER,
  verified_capacity_max INTEGER,
  capacity_verification_source VARCHAR(64) DEFAULT 'a_confirmar',

  -- Matriz de Confiança Independente
  identity_verified BOOLEAN NOT NULL DEFAULT FALSE,
  location_verified factual_state_enum NOT NULL DEFAULT 'a_confirmar',
  contact_verified BOOLEAN NOT NULL DEFAULT FALSE,
  venue_capability_verified factual_state_enum NOT NULL DEFAULT 'a_confirmar',
  capacity_verified factual_state_enum NOT NULL DEFAULT 'a_confirmar',
  visited_by_haxr BOOLEAN NOT NULL DEFAULT FALSE,
  haxr_verified BOOLEAN NOT NULL DEFAULT FALSE,
  haxr_partner BOOLEAN NOT NULL DEFAULT FALSE,
  last_verified_at DATE,

  -- Editorial & Publicação
  editorial_summary TEXT,
  publication_status venue_publication_status NOT NULL DEFAULT 'draft_internal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Auditoria e Inspecções Físicas
CREATE TABLE IF NOT EXISTS public.venue_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id VARCHAR(64) NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  inspector_name VARCHAR(128) NOT NULL,
  inspection_date DATE NOT NULL,
  generator_inspected BOOLEAN NOT NULL DEFAULT FALSE,
  generator_test_successful BOOLEAN,
  acoustics_rating VARCHAR(32),
  restroom_hygiene_rating VARCHAR(32),
  kitchen_hygiene_rating VARCHAR(32),
  inspection_report_r2_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 6. Parecer de Engenharia sobre a Tabela Existente `supplier_profiles`

A tabela `supplier_profiles` já existente em Neon continuará a servir o seu propósito natural: **prestadores de serviços móveis** (cabeleireiros, maquilhadores, fotógrafos, decoradores, confeiteiros, etc.).

Quando um espaço de eventos prestar cumulativamente serviços de catering ou decoração própria, existirá uma chave cruzada opcional (`supplier_profile_id`), garantindo que o imóvel físico e a empresa prestadora de serviços não sejam fundidos de forma confusa.
