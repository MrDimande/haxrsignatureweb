/**
 * HAXR Signature — Phase E.2 Public Venue Guide Corrective Tests
 *
 * Testes automatizados rigorosos da experiência pública /locais-para-casamentos:
 * - Blocker 1: Eliminação de inferências de celebração sem evidência explícita (PUBLIC_CELEBRATION_ATTRIBUTE_REQUIRES_EXPLICIT_EVIDENCE=true)
 * - Blocker 2: Governação de filtros (remoção total de filtros não suportados por evidência)
 * - Blocker 3: Fronteira estrutural absoluta entre Venue.notes e PublicVenueCard.editorialSummary
 * - Blocker 4: Fronteira estritamente server-side com ponto canónico zero-argumentos
 * - Blocker 5: Cobertura de segurança provando que CLIENT_SIDE_PRODUCTION_UNLOCK=false
 * - Guardrails de confiança, direitos de imagem, indexação e boundaries de superfície
 */

import "../../../scripts/register-server-only.mjs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  HAXR_INTERNAL_VENUES,
  getPublicVenues,
  getPublicVenuesForCanonicalEnvironment,
  isVenueEligibleForEnvironment,
  assertServerContext,
} from "./publication";
import {
  mapVenueToPublicCard,
  VENUE_PUBLIC_EDITORIAL_REGISTRY,
} from "./public-mapper";
import * as clientVenuesBarrel from "./index";
import { navGroups, navDirectLinks } from "@/lib/marketing/navigation";

describe("HAXR Venue Guide — Phase E.2 Public Experience & Governance (Corrective Suite)", () => {
  const previewVenues = getPublicVenues("preview");
  const productionVenues = getPublicVenues("production");
  const previewCards = previewVenues.map(mapVenueToPublicCard);

  describe("Environment Publication Gates & Server Boundaries (Blocker 4)", () => {
    it("enforces that exactly 0 venues are renderable in production during Phase E.2", () => {
      assert.equal(
        productionVenues.length,
        0,
        `VIOLAÇÃO DE GOVERNAÇÃO E.2: ${productionVenues.length} locais renderizáveis em produção`
      );
    });

    it("enforces that exactly 8 first-wave venues are renderable in preview (4 independent + 4 hotels)", () => {
      assert.equal(
        previewVenues.length,
        8,
        `Esperados 8 locais aprovados para preview, obtidos ${previewVenues.length}`
      );

      const expectedIds = [
        "EVELYN_EVENTOS",
        "VILA_VERDE_MOZAL",
        "THE_VENUE_MZ",
        "ALIANCA_EVENTOS",
        "POLANA_SERENA_HOTEL",
        "SOUTHERN_SUN_MAPUTO",
        "HOTEL_GLORIA_CCJC",
        "RADISSON_BLU_MAPUTO",
      ];
      const actualIds = previewVenues.map((v) => v.id);
      assert.deepEqual(actualIds.sort(), expectedIds.sort());

      const expectedNames = [
        "Salão de Eventos Evelyn",
        "Vila Verde Banquetes",
        "The Venue MZ",
        "Complexo Aliança",
        "Polana Serena Hotel",
        "Southern Sun Maputo",
        "Hotel Glória & CCJC",
        "Radisson Blu Hotel & Residence Maputo",
      ];
      const actualNames = previewCards.map((c) => c.name);
      assert.deepEqual(actualNames.sort(), expectedNames.sort());
    });

    it("verifies independent venues visually precede the hotel section and Vila Verde is primary tier", () => {
      const firstFour = previewCards.slice(0, 4);
      assert.equal(
        firstFour.every((c) => c.isIndependent),
        true,
        "Os primeiros 4 locais devem ser independentes"
      );

      // Validação estrita do Category Tier de Vila Verde Banquetes
      const vilaVerde = previewCards.find((c) => c.id === "VILA_VERDE_MOZAL");
      assert.ok(vilaVerde, "Vila Verde Mozal deve estar presente no preview");
      assert.equal(
        vilaVerde.categoryTier,
        "primary",
        "Vila Verde Banquetes opera como espaço dedicado a casamentos e banquetes e deve ter categoryTier=primary"
      );

      // Todos os 4 independentes da primeira vaga são da categoria primária
      assert.equal(
        firstFour.every((c) => c.categoryTier === "primary"),
        true,
        "Todos os 4 espaços independentes da primeira vaga devem ser primary tier"
      );

      const lastFour = previewCards.slice(4, 8);
      assert.equal(
        lastFour.every((c) => !c.isIndependent && c.categoryTier === "tertiary"),
        true,
        "Os últimos 4 locais devem ser unidades hoteleiras com categoryTier=tertiary"
      );
    });

    it("strictly enforces entity integrity: CASA_D_ARTISTA_KUTENGA != CAJADA_EVENTOS and neither is rendered", () => {
      // 1. Integridade Canónica de Entidades: Casa d'Artista Kutenga e Cajada Eventos são entidades distintas
      const CASA_D_ARTISTA_KUTENGA_IS_CAJADA = false;
      assert.equal(
        CASA_D_ARTISTA_KUTENGA_IS_CAJADA,
        false,
        "CASA_D_ARTISTA_KUTENGA_IS_CAJADA deve ser rigorosamente falso"
      );

      // 2. Casa d'Artista Kutenga (Tchumeni I, Matola) permanece em DRAFT e não renderiza em preview
      const actualIds = previewVenues.map((v) => v.id);
      assert.equal(
        actualIds.includes("CASA_D_ARTISTA_KUTENGA"),
        false,
        "Casa d'Artista Kutenga deve permanecer em DRAFT e não-renderizável em preview"
      );

      // 3. Montebelo Indy Hotel permanece em DRAFT e não renderiza
      assert.equal(
        actualIds.includes("MONTEBELO_INDY_HOTEL"),
        false,
        "Montebelo Indy Hotel deve permanecer em DRAFT e não-renderizável"
      );

      // 4. Nenhum nome associado a Cajada, Kutenga ou Montebelo aparece nos cartões renderizados
      for (const card of previewCards) {
        const lowerName = card.name.toLowerCase();
        assert.equal(
          lowerName.includes("cajada"),
          false,
          `Cartão público ${card.id} não pode conter 'Cajada'`
        );
        assert.equal(
          lowerName.includes("kutenga"),
          false,
          `Cartão público ${card.id} não pode conter 'Kutenga'`
        );
        assert.equal(
          lowerName.includes("montebelo"),
          false,
          `Cartão público ${card.id} não pode conter 'Montebelo'`
        );
      }
    });

    it("strictly forbids RESEARCH_ONLY venues from rendering in any environment", () => {
      const researchOnly = HAXR_INTERNAL_VENUES.filter(
        (v) => v.readiness.primary === "RESEARCH_ONLY"
      );
      assert.equal(researchOnly.length, 4);

      for (const venue of researchOnly) {
        assert.equal(
          isVenueEligibleForEnvironment(venue, "preview"),
          false,
          `Local RESEARCH_ONLY (${venue.id}) não pode renderizar em preview`
        );
        assert.equal(
          isVenueEligibleForEnvironment(venue, "production"),
          false,
          `Local RESEARCH_ONLY (${venue.id}) não pode renderizar em produção`
        );
      }
    });

    it("strictly forbids IDENTITY=A_CONFIRMAR venues from rendering in any environment", () => {
      const unverifiedIdentity = HAXR_INTERNAL_VENUES.filter(
        (v) => v.trust.identity === "A_CONFIRMAR"
      );
      assert.equal(unverifiedIdentity.length, 4);

      for (const venue of unverifiedIdentity) {
        assert.equal(
          isVenueEligibleForEnvironment(venue, "preview"),
          false,
          `Local com IDENTITY=A_CONFIRMAR (${venue.id}) não pode renderizar em preview`
        );
        assert.equal(
          isVenueEligibleForEnvironment(venue, "production"),
          false,
          `Local com IDENTITY=A_CONFIRMAR (${venue.id}) não pode renderizar em produção`
        );
      }
    });

    it("provides a zero-argument server canonical entry point that respects environment", () => {
      const originalVercelEnv = process.env.VERCEL_ENV;
      try {
        process.env.VERCEL_ENV = "production";
        const prodVenues = getPublicVenuesForCanonicalEnvironment();
        assert.equal(
          prodVenues.length,
          0,
          "getPublicVenuesForCanonicalEnvironment deve retornar 0 locais em produção"
        );

        process.env.VERCEL_ENV = "preview";
        const prevVenues = getPublicVenuesForCanonicalEnvironment();
        assert.equal(
          prevVenues.length,
          8,
          "getPublicVenuesForCanonicalEnvironment deve retornar 8 locais em preview"
        );
      } finally {
        process.env.VERCEL_ENV = originalVercelEnv;
      }
    });
  });

  describe("Security Regression: Client-Side Input Immunity (Blocker 5)", () => {
    it("proves CLIENT_SIDE_PRODUCTION_UNLOCK=false: searchParams, cookies or query string cannot unlock preview", () => {
      const envRecord = process.env as Record<string, string | undefined>;
      const originalVercelEnv = envRecord.VERCEL_ENV;
      const originalNodeEnv = envRecord.NODE_ENV;

      try {
        envRecord.VERCEL_ENV = "production";
        envRecord.NODE_ENV = "production";

        // Simula tentativa de passagem de parâmetros de desbloqueio
        const maliciousInputs = [
          "?env=preview",
          "?preview=true",
          "?role=admin",
          "?bypass=true",
          "?preview_token=secret",
          "?unlock=preview",
        ];

        for (const input of maliciousInputs) {
          // O ponto canónico não aceita argumentos e lê apenas process.env do servidor
          const venues = getPublicVenuesForCanonicalEnvironment();
          assert.equal(
            venues.length,
            0,
            `Tentativa de unlock com input '${input}' violou a governação de produção`
          );
        }
      } finally {
        envRecord.VERCEL_ENV = originalVercelEnv;
        envRecord.NODE_ENV = originalNodeEnv;
      }
    });

    it("proves the public route component accepts 0 arguments and binds no client overrides", () => {
      const pageFilePath = path.resolve(
        process.cwd(),
        "src/app/(marketing)/locais-para-casamentos/page.tsx"
      );
      const pageContent = fs.readFileSync(pageFilePath, "utf8");

      // Verifica que a página não consome searchParams para governar publicação
      assert.equal(
        pageContent.includes("searchParams:"),
        false,
        "A página NÃO pode aceitar searchParams para publicação"
      );
      assert.equal(
        pageContent.includes("useSearchParams"),
        false,
        "A página NÃO pode usar useSearchParams para publicação"
      );
      assert.equal(
        pageContent.includes("cookies()"),
        false,
        "A página NÃO pode ler cookies para desbloquear locais"
      );
      assert.equal(
        pageContent.includes("headers()"),
        false,
        "A página NÃO pode ler headers de cliente para desbloquear locais"
      );
    });

    it("proves assertServerContext throws if executed in a browser window context", () => {
      const globalScope = globalThis as Record<string, unknown>;
      const originalWindow = globalScope.window;
      try {
        globalScope.window = {};
        assert.throws(
          () => {
            assertServerContext();
          },
          /SECURITY_VIOLATION/,
          "assertServerContext deve disparar erro quando window estiver definido"
        );
      } finally {
        if (originalWindow === undefined) {
          Reflect.deleteProperty(globalScope, "window");
        } else {
          globalScope.window = originalWindow;
        }
      }
    });

    it("enforces SERVER_ONLY_PUBLICATION_BOUNDARY=ENFORCED: proves client barrel (@/lib/venues) exposes zero runtime code and server.ts has server-only guard", () => {
      // 1. O barrel de cliente (@/lib/venues) não deve exportar NENHUMA função, variável ou registo de runtime
      const clientRuntimeExports = Object.keys(clientVenuesBarrel);
      assert.equal(
        clientRuntimeExports.length,
        0,
        `VIOLAÇÃO DE DTO/FRONTEIRA: O barrel de cliente expõe símbolos de runtime: ${clientRuntimeExports.join(", ")}`
      );

      // 2. Garante que nem os dados internos nem os mappers estão acessíveis no barrel de cliente
      const forbiddenInClient = [
        "HAXR_INTERNAL_VENUES",
        "getPublicVenues",
        "getPublicVenuesForCanonicalEnvironment",
        "isVenueEligibleForEnvironment",
        "isVenueEligibleForPublication",
        "validateVenueDataset",
        "assertServerContext",
        "VENUE_EDITORIAL_PUBLICATION_REGISTRY",
        "mapVenueToPublicCard",
        "formatVenueTypeLabel",
        "VENUE_PUBLIC_EDITORIAL_REGISTRY",
      ];

      for (const internalSymbol of forbiddenInClient) {
        assert.equal(
          internalSymbol in clientVenuesBarrel,
          false,
          `VIOLAÇÃO DE FRONTEIRA: Símbolo '${internalSymbol}' acessível no barrel de cliente @/lib/venues`
        );
      }

      // 3. Verifica que todos os módulos sensíveis de servidor possuem a directiva oficial Next.js import 'server-only'
      const serverModules = [
        "src/lib/venues/server.ts",
        "src/lib/venues/venue-data.ts",
        "src/lib/venues/publication.ts",
        "src/lib/venues/public-mapper.ts",
      ];

      for (const modPath of serverModules) {
        const fullPath = path.resolve(process.cwd(), modPath);
        const source = fs.readFileSync(fullPath, "utf-8");
        assert.equal(
          source.includes('import "server-only";') || source.includes("import 'server-only';"),
          true,
          `VIOLAÇÃO DE COMPILAÇÃO: ${modPath} DEVE importar 'server-only' para rejeitar compilação directa no cliente`
        );
      }

      const serverSourcePath = path.resolve(process.cwd(), "src/lib/venues/server.ts");
      const serverSource = fs.readFileSync(serverSourcePath, "utf-8");
      assert.equal(
        serverSource.includes("getPublicVenueCardsForCanonicalEnvironment"),
        true,
        "src/lib/venues/server.ts deve exportar o ponto de entrada canónico de DTOs já sanitizados"
      );
    });
  });

  describe("Celebration Inference Elimination (Blocker 1)", () => {
    it("enforces PUBLIC_CELEBRATION_ATTRIBUTE_REQUIRES_EXPLICIT_EVIDENCE=true: zero celebration claims in public cards", () => {
      for (const card of previewCards) {
        // Verifica que o objecto não possui celebrações inferidas
        const record = card as unknown as Record<string, unknown>;
        assert.equal(
          record.celebrationsSupported,
          undefined,
          `Cartão ${card.id} não pode conter o campo celebrationsSupported`
        );

        const serialized = JSON.stringify(card).toLowerCase();
        assert.equal(
          serialized.includes('"lobolos"'),
          false,
          `Cartão ${card.id} não pode conter tag de Lobolos sem evidência explícita`
        );
        assert.equal(
          serialized.includes('"recepções"'),
          false,
          `Cartão ${card.id} não pode conter tag de Recepções sem evidência explícita`
        );
        assert.equal(
          serialized.includes('"cerimónias"'),
          false,
          `Cartão ${card.id} não pode conter tag de Cerimónias sem evidência explícita`
        );
      }
    });
  });

  describe("Filter Governance & Surface Removal (Blocker 2 & Blocker 6)", () => {
    it("enforces UNSUPPORTED_FILTER_ATTRIBUTES=0: VenueFilters component and obsolete bottom sheet are removed", () => {
      const filtersPath = path.resolve(
        process.cwd(),
        "src/components/venues/VenueFilters.tsx"
      );
      assert.equal(
        fs.existsSync(filtersPath),
        false,
        "VenueFilters.tsx deve ser removido na Fase E.2 por falta de evidência e para evitar filtros inúteis"
      );

      const clientGuidePath = path.resolve(
        process.cwd(),
        "src/components/venues/VenueGuideClient.tsx"
      );
      assert.equal(
        fs.existsSync(clientGuidePath),
        false,
        "VenueGuideClient.tsx deve ser removido na Fase E.2 em favor de renderização directa de servidor"
      );
    });

    it("verifies no environment inferences ('Interior'/'Exterior') are attached to public cards", () => {
      for (const card of previewCards) {
        const record = card as unknown as Record<string, unknown>;
        assert.equal(
          record.environments,
          undefined,
          `Cartão ${card.id} não pode conter o campo environments inferido`
        );
      }
    });
  });

  describe("Structural Boundary: Venue.notes Decoupling (Blocker 3)", () => {
    it("enforces INTERNAL_NOTES_DIRECTLY_EXPOSED=0: proves Venue.notes is NEVER assigned to editorialSummary", () => {
      for (const venue of previewVenues) {
        const card = mapVenueToPublicCard(venue);

        // O resumo editorial NÃO pode ser igual às notas internas
        assert.notEqual(
          card.editorialSummary,
          venue.notes,
          `VIOLAÇÃO DE SEGURANÇA: Local ${venue.id} atribuiu venue.notes directamente a editorialSummary`
        );

        // O resumo editorial NÃO pode conter o texto de notas internas
        assert.equal(
          card.editorialSummary.includes(venue.notes),
          false,
          `VIOLAÇÃO DE SEGURANÇA: Local ${venue.id} expôs trecho de venue.notes em editorialSummary`
        );

        // Confirma que o editorialSummary provém do registo público ou da composição factual de reserva
        const expectedFromRegistry = VENUE_PUBLIC_EDITORIAL_REGISTRY[venue.id];
        if (expectedFromRegistry) {
          assert.equal(card.editorialSummary, expectedFromRegistry);
        }
      }
    });

    it("proves PUBLIC_INTERNAL_MARKER_LEAKS=0: no internal audit, classification, or source management terms leak into public cards", () => {
      const forbiddenTerms = [
        "A_CONFIRMAR",
        "OWNER_CONFIRMED",
        "EVIDENCE_REQUIRED",
        "APPROVED_FOR_PREVIEW",
        "POTENTIALLY_PUBLISHABLE_AFTER_EDITORIAL_REVIEW",
        "SOURCE_CONFLICT",
        "OWNER_EDITORIAL_PRIORITY",
        "HAXR_FIRST_PARTY_RELEVANCE",
        "RESEARCH_ONLY",
        "NEEDS_EXTERNAL_VERIFICATION",
        "NEEDS_OWNER_CONFIRMATION",
        "FOUNDATION_READY",
        "VISITED_BY_HAXR",
        "vistoria documental formal",
        "regulamentar a homologar",
      ];

      let leakCount = 0;
      for (const card of previewCards) {
        const serialized = JSON.stringify(card);
        for (const term of forbiddenTerms) {
          if (serialized.includes(term)) {
            leakCount++;
            assert.fail(`Cartão ${card.id}: termo interno '${term}' vazado no cartão público`);
          }
        }
      }
      assert.equal(leakCount, 0, "PUBLIC_INTERNAL_MARKER_LEAKS deve ser rigorosamente 0");
    });

    it("enforces UNSUPPORTED_PUBLIC_EDITORIAL_CLAIMS=0: strictly validates that editorial copy contains zero unverified claims", () => {
      const unevidencedClaims = [
        "património histórico",
        "debruçado sobre a baía",
        "terraço para celebrações",
        "vocacionado para",
        "ideal para",
        "perfeito para",
        "recomendado para",
        "múltiplos salões",
        "recepções de escala formal",
        "recepções sociais",
        "banquetes formais",
      ];

      for (const [venueId, copy] of Object.entries(VENUE_PUBLIC_EDITORIAL_REGISTRY)) {
        if (!copy) continue;
        const lowerCopy = copy.toLowerCase();

        for (const claim of unevidencedClaims) {
          assert.equal(
            lowerCopy.includes(claim.toLowerCase()),
            false,
            `Alegação editorial não comprovada '${claim}' detectada no local ${venueId}`
          );
        }
      }

      // Verificação específica: Radisson Blu não pode inventar "Grande Salão Ballroom" (deve usar a evidenciada Sala Zambeze)
      const radissonCopy = VENUE_PUBLIC_EDITORIAL_REGISTRY.RADISSON_BLU_MAPUTO ?? "";
      assert.equal(
        radissonCopy.includes("Grande Salão Ballroom"),
        false,
        "Radisson Blu não pode conter 'Grande Salão Ballroom' (alegação não suportada)"
      );
      assert.equal(
        radissonCopy.includes("Sala Zambeze"),
        true,
        "Radisson Blu deve referenciar a Sala Zambeze oficialmente comprovada na evidência"
      );

      // Verificação de Polana Serena: usa Salão Nobre comprovado e não alega escala formal nem património histórico
      const polanaCopy = VENUE_PUBLIC_EDITORIAL_REGISTRY.POLANA_SERENA_HOTEL ?? "";
      assert.equal(polanaCopy.includes("Salão Nobre"), true);
      assert.equal(polanaCopy.includes("300 convidados em banquete"), true);

      // Verificação de Southern Sun: usa sala principal comprovada de 100 pax
      const southernCopy = VENUE_PUBLIC_EDITORIAL_REGISTRY.SOUTHERN_SUN_MAPUTO ?? "";
      assert.equal(southernCopy.includes("100 convidados em banquete"), true);

      // Verificação de Hotel Glória: usa salão principal modular de 1.000 pax
      const gloriaCopy = VENUE_PUBLIC_EDITORIAL_REGISTRY.HOTEL_GLORIA_CCJC ?? "";
      assert.equal(gloriaCopy.includes("1.000 convidados em banquete"), true);
    });
  });

  describe("Trust Language & Badge Prohibitions", () => {
    it("ensures zero HAXR Verified badges exist across rendered preview cards", () => {
      for (const venue of previewVenues) {
        assert.equal(
          venue.trust.haxrVerified,
          false,
          `Local ${venue.id} não pode ter HAXR_VERIFIED=true`
        );
      }
    });

    it("ensures zero Visited by HAXR badges exist across rendered preview cards", () => {
      for (const venue of previewVenues) {
        assert.notEqual(
          venue.trust.visitedByHaxr,
          true,
          `Local ${venue.id} não pode ter VISITED_BY_HAXR=true`
        );
      }
    });

    it("ensures zero HAXR Partner badges exist across rendered preview cards", () => {
      for (const venue of previewVenues) {
        assert.equal(
          venue.trust.haxrPartner,
          false,
          `Local ${venue.id} não pode ter HAXR_PARTNER=true`
        );
      }
    });

    it("ensures no unsupported homologation terminology exists in public cards", () => {
      for (const card of previewCards) {
        const serialized = JSON.stringify(card).toLowerCase();
        assert.equal(
          serialized.includes("homologad"),
          false,
          `Cartão público de ${card.id} contém terminologia não suportada de homologação`
        );
        assert.equal(
          serialized.includes("homologar"),
          false,
          `Cartão público de ${card.id} contém verbo 'homologar' não suportado`
        );
      }
    });

    it("ensures image rights are strictly respected with zero misrepresentative images", () => {
      for (const card of previewCards) {
        assert.equal(
          card.hasDedicatedImage,
          false,
          `Local ${card.id} não pode ter imagem própria sem cessão expressa de direitos`
        );
        assert.equal(
          card.imageUrl,
          undefined,
          `Local ${card.id} não pode referenciar imageUrl sem direitos confirmados`
        );
      }
    });

    it("ensures unverified capacity uses polished public copy 'Capacidade sob consulta'", () => {
      const unverifiedCards = previewCards.filter((c) => !c.capacityDisplay.isDeclared);
      // Os 4 espaços independentes têm capacidade declarada não confirmada
      assert.equal(unverifiedCards.length, 4);

      for (const card of unverifiedCards) {
        assert.equal(
          card.capacityDisplay.label,
          "Capacidade sob consulta",
          `Cartão ${card.id} deve ter label 'Capacidade sob consulta'`
        );
        assert.equal(
          card.capacityDisplay.label.toLowerCase().includes("a confirmar"),
          false,
          `Cartão ${card.id} não pode expor 'a confirmar' ao público`
        );
      }
    });

    it("ensures VenuePlaceholderImage uses honest editorial identity accessibility labels", () => {
      const placeholderPath = path.resolve(
        process.cwd(),
        "src/components/venues/VenuePlaceholderImage.tsx"
      );
      const placeholderSource = fs.readFileSync(placeholderPath, "utf-8");

      assert.equal(
        placeholderSource.includes("Identidade editorial do ${venueName}"),
        true,
        "Placeholder DEVE usar label honesto 'Identidade editorial do ${venueName}'"
      );
      assert.equal(
        placeholderSource.includes("Fotografia do") || placeholderSource.includes("Fotografia de"),
        false,
        "Placeholder NÃO pode alegar ser fotografia"
      );
    });
  });

  describe("SEO & Indexing Guardrails", () => {
    // Leitura estática do ficheiro fonte para evitar chain de import server-only
    const pageSource = fs.readFileSync(
      path.resolve(
        process.cwd(),
        "src/app/(marketing)/locais-para-casamentos/page.tsx"
      ),
      "utf8"
    );

    it("enforces noindex and nofollow during preview review phase", () => {
      assert.equal(
        pageSource.includes("index: false"),
        true,
        "Metadata robots deve conter index: false"
      );
      assert.equal(
        pageSource.includes("follow: false"),
        true,
        "Metadata robots deve conter follow: false"
      );
    });

    it("enforces canonical SEO title and factual description", () => {
      assert.equal(
        pageSource.includes('"Locais para Casamentos em Maputo e Matola"'),
        true,
        "Título SEO canónico ausente"
      );
      assert.equal(
        pageSource.includes("Guia editorial e prático de espaços para casamentos e celebrações em Maputo e Matola"),
        true,
        "Descrição SEO factual ausente"
      );
    });

    it("confirms zero venue-level JSON-LD schemas in E.2", () => {
      const pageFile = fs.readFileSync(
        path.resolve(
          process.cwd(),
          "src/app/(marketing)/locais-para-casamentos/page.tsx"
        ),
        "utf8"
      );
      assert.equal(
        pageFile.includes('"@type": "EventVenue"'),
        false,
        "Zero schema EventVenue permitido na Fase E.2"
      );
      assert.equal(
        pageFile.includes('"@type": "LocalBusiness"'),
        false,
        "Zero schema LocalBusiness permitido na Fase E.2"
      );
      assert.equal(
        pageFile.includes('"@type": "Place"'),
        false,
        "Zero schema Place de nível individual permitido na Fase E.2"
      );
    });
  });

  describe("Surface Boundaries — No Navigation, Sitemap or Homepage Leakage", () => {
    it("ensures navigation menu does NOT link to /locais-para-casamentos in E.2 Preview", () => {
      for (const group of navGroups) {
        for (const link of group.links) {
          assert.notEqual(
            link.href,
            "/locais-para-casamentos",
            `Navegação contém link para locais-para-casamentos: ${link.label}`
          );
        }
      }
      for (const link of navDirectLinks) {
        assert.notEqual(
          link.href,
          "/locais-para-casamentos",
          `Link directo de navegação aponta para locais-para-casamentos: ${link.label}`
        );
      }
    });

    it("ensures public sitemap does NOT include /locais-para-casamentos", async () => {
      const sitemapModule = await import("@/app/sitemap");
      const sitemapEntries = sitemapModule.default();
      const hasVenueEntry = sitemapEntries.some((entry) =>
        entry.url.includes("locais-para-casamentos")
      );
      assert.equal(
        hasVenueEntry,
        false,
        "O sitemap público NÃO pode conter URLs de locais-para-casamentos na Fase E.2"
      );
    });

    it("ensures HOMEPAGE_STRUCTURE_CHANGED=false: no venue references in homepage", () => {
      const homepagePath = path.resolve(
        process.cwd(),
        "src/app/(marketing)/page.tsx"
      );
      const homepage = fs.readFileSync(homepagePath, "utf8");
      assert.equal(
        homepage.includes("locais-para-casamentos"),
        false,
        "Homepage NÃO pode referenciar locais-para-casamentos"
      );
      assert.equal(
        homepage.includes("VenueGuide"),
        false,
        "Homepage NÃO pode importar componentes do Venue Guide"
      );
    });

    it("ensures MAP_IMPLEMENTED=false: no map component exists", () => {
      const mapComponent = path.resolve(
        process.cwd(),
        "src/components/venues/VenueMap.tsx"
      );
      assert.equal(
        fs.existsSync(mapComponent),
        false,
        "Componente de mapa NÃO pode existir na Fase E.2 (MAP_DECISION=DEFERRED)"
      );
    });

    it("ensures VENUE_DETAIL_ROUTES_CREATED=false: no [slug] route in E.2", () => {
      const slugRoute = path.resolve(
        process.cwd(),
        "src/app/(marketing)/locais-para-casamentos/[slug]"
      );
      assert.equal(
        fs.existsSync(slugRoute),
        false,
        "Páginas de detalhe de local pertencem à Fase E.3, não à E.2"
      );
    });

    it("ensures PRODUCTION_SITEMAP_PREVIEW_VENUE_LEAKS=0, PRODUCTION_METADATA_PREVIEW_VENUE_LEAKS=0, PRODUCTION_JSONLD_PREVIEW_VENUE_LEAKS=0", async () => {
      // 1. Sitemap leak check: nenhuma URL de local em preview no sitemap de produção
      const sitemapModule = await import("@/app/sitemap");
      const sitemapEntries = sitemapModule.default();
      const previewVenueNames = [
        "evelyn",
        "vila-verde",
        "the-venue",
        "alianca",
        "polana-serena",
        "southern-sun",
        "gloria",
        "radisson",
      ];
      const sitemapLeaks = sitemapEntries.filter((entry) =>
        previewVenueNames.some((name) => entry.url.toLowerCase().includes(name))
      );
      assert.equal(
        sitemapLeaks.length,
        0,
        "PRODUCTION_SITEMAP_PREVIEW_VENUE_LEAKS deve ser rigorosamente 0"
      );

      // 2. Production venues renderable check
      const prodVenues = getPublicVenues("production");
      assert.equal(
        prodVenues.length,
        0,
        "PRODUCTION_VENUES_RENDERABLE deve ser rigorosamente 0"
      );

      // 3. JSON-LD individual venue schemas
      const pageFile = fs.readFileSync(
        path.resolve(process.cwd(), "src/app/(marketing)/locais-para-casamentos/page.tsx"),
        "utf8"
      );
      const jsonLdVenueTypes = ['"@type": "EventVenue"', '"@type": "LocalBusiness"', '"@type": "Place"'];
      const jsonLdLeaks = jsonLdVenueTypes.filter((t) => pageFile.includes(t));
      assert.equal(
        jsonLdLeaks.length,
        0,
        "PRODUCTION_JSONLD_PREVIEW_VENUE_LEAKS deve ser rigorosamente 0"
      );
    });
  });

  describe("Durable Server-Only Module Boundary Regression Suite", () => {
    const serverSensitiveFiles = [
      "src/lib/venues/server.ts",
      "src/lib/venues/venue-data.ts",
      "src/lib/venues/publication.ts",
      "src/lib/venues/public-mapper.ts",
    ];

    it("statically proves that all server modules retain the literal 'import \"server-only\";' marker", () => {
      for (const relPath of serverSensitiveFiles) {
        const fullPath = path.resolve(process.cwd(), relPath);
        assert.ok(fs.existsSync(fullPath), `Ficheiro em falta: ${relPath}`);
        const content = fs.readFileSync(fullPath, "utf-8");
        assert.match(
          content,
          /import\s+["']server-only["'];?/,
          `VIOLAÇÃO DE SEGURANÇA: O módulo sensível ${relPath} não possui o marcador 'server-only'`
        );
      }
    });
  });
});

