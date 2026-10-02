/**
 * HAXR Signature — Venue Domain Model & Quality Guardrails Tests (Phase E.1)
 *
 * Testes automatizados direcionados à governação, integridade factual,
 * contagens canónicas e guardrails estritos de publicação da Fase E.1.
 */

import "../../../scripts/register-server-only.mjs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  HAXR_INTERNAL_VENUES,
  validateVenueDataset,
  isVenueEligibleForPublication,
  isVenueHaxrVerified,
  validateCapacityDistinction,
} from "./publication";
import type { Venue } from "./types";
import { navGroups, navDirectLinks } from "@/lib/marketing/navigation";

describe("HAXR Venue Intelligence — Phase E.1 Domain Foundation", () => {
  const datasetValidation = validateVenueDataset(HAXR_INTERNAL_VENUES);

  it("validates that the dataset conforms to all E.1 integrity rules without errors", () => {
    assert.equal(
      datasetValidation.isValid,
      true,
      `Dataset com erros de validação: ${datasetValidation.errors.join("; ")}`
    );
    assert.equal(datasetValidation.errors.length, 0);
  });

  it("asserts exactly 16 venues exist in the canonical dataset", () => {
    assert.equal(HAXR_INTERNAL_VENUES.length, 16);
    assert.equal(datasetValidation.summary.totalVenues, 16);
  });

  describe("Trust Dimensions Consistency", () => {
    it("asserts exactly 12 venues have identity verified and 4 have identity A_CONFIRMAR", () => {
      assert.equal(datasetValidation.summary.identityVerified, 12);
      assert.equal(datasetValidation.summary.identityAConfirmar, 4);

      const secondaryOnlyIds = [
        "QUINTA_DA_STELA",
        "CASTELO_EVENTOS",
        "NAMYLALA_EVENTOS",
        "COMPLEXO_LOUANINE",
      ];

      for (const id of secondaryOnlyIds) {
        const venue = HAXR_INTERNAL_VENUES.find((v) => v.id === id);
        assert.ok(venue, `Local ${id} deve existir`);
        assert.equal(
          venue.trust.identity,
          "A_CONFIRMAR",
          `Local ${id} deve ter IDENTITY=A_CONFIRMAR por depender unicamente de directórios secundários`
        );
      }
    });

    it("asserts exactly 14 venues have location verified and 2 have location A_CONFIRMAR", () => {
      assert.equal(datasetValidation.summary.locationVerified, 14);
      assert.equal(datasetValidation.summary.locationAConfirmar, 2);

      const unresolvedLocations = ["QUINTA_DA_STELA", "CASTELO_EVENTOS"];
      for (const id of unresolvedLocations) {
        const venue = HAXR_INTERNAL_VENUES.find((v) => v.id === id);
        assert.ok(venue);
        assert.equal(
          venue.trust.location,
          "A_CONFIRMAR",
          `Local ${id} deve ter LOCATION=A_CONFIRMAR`
        );
      }
    });

    it("asserts exactly 12 venues have contact verified and 4 have contact A_CONFIRMAR", () => {
      assert.equal(datasetValidation.summary.contactVerified, 12);
      assert.equal(datasetValidation.summary.contactAConfirmar, 4);

      const unresolvedContacts = [
        "QUINTA_DA_STELA",
        "CASTELO_EVENTOS",
        "NAMYLALA_EVENTOS",
        "COMPLEXO_LOUANINE",
      ];
      for (const id of unresolvedContacts) {
        const venue = HAXR_INTERNAL_VENUES.find((v) => v.id === id);
        assert.ok(venue);
        assert.equal(
          venue.trust.contact,
          "A_CONFIRMAR",
          `Local ${id} deve ter CONTACT=A_CONFIRMAR`
        );
      }
    });

    it("asserts exactly 4 venues have capacity verified and 12 have capacity A_CONFIRMAR", () => {
      assert.equal(datasetValidation.summary.capacityVerified, 4);
      assert.equal(datasetValidation.summary.capacityAConfirmar, 12);

      const verifiedCapacityIds = [
        "POLANA_SERENA_HOTEL",
        "SOUTHERN_SUN_MAPUTO",
        "HOTEL_GLORIA_CCJC",
        "RADISSON_BLU_MAPUTO",
      ];

      for (const id of verifiedCapacityIds) {
        const venue = HAXR_INTERNAL_VENUES.find((v) => v.id === id);
        assert.ok(venue);
        assert.equal(
          venue.trust.capacity,
          "VERIFIED",
          `Local ${id} deve ter CAPACITY=VERIFIED por suporte em especificação oficial corporativa`
        );
      }
    });

    it("strictly enforces VISITED_BY_HAXR_COUNT=0 across the entire dataset", () => {
      assert.equal(datasetValidation.summary.visitedByHaxrCount, 0);

      // Verificação explícita do Polana Serena (A_CONFIRMAR)
      const polana = HAXR_INTERNAL_VENUES.find(
        (v) => v.id === "POLANA_SERENA_HOTEL"
      );
      assert.ok(polana);
      assert.equal(
        polana.trust.visitedByHaxr,
        "A_CONFIRMAR",
        "Polana Serena deve ter VISITED_BY_HAXR=A_CONFIRMAR na ausência de relatório documental de visita"
      );

      // Nenhum local pode ter visitedByHaxr === true
      for (const venue of HAXR_INTERNAL_VENUES) {
        assert.notEqual(
          venue.trust.visitedByHaxr,
          true,
          `Local ${venue.id} não pode ter VISITED_BY_HAXR=true sem vistoria presencial documentada`
        );
      }
    });

    it("strictly enforces HAXR_VERIFIED_COUNT=0 across the entire dataset", () => {
      assert.equal(datasetValidation.summary.haxrVerifiedCount, 0);

      for (const venue of HAXR_INTERNAL_VENUES) {
        assert.equal(
          venue.trust.haxrVerified,
          false,
          `Local ${venue.id} não pode ser HAXR_VERIFIED na Fase E.1`
        );
        assert.equal(
          isVenueHaxrVerified(venue),
          false,
          `Função isVenueHaxrVerified deve retornar false para ${venue.id}`
        );
      }
    });

    it("strictly enforces HAXR_PARTNER_COUNT=0 across the entire dataset", () => {
      assert.equal(datasetValidation.summary.haxrPartnerCount, 0);

      for (const venue of HAXR_INTERNAL_VENUES) {
        assert.equal(
          venue.trust.haxrPartner,
          false,
          `Local ${venue.id} não pode ser HAXR_PARTNER sem contrato comercial auditado`
        );
      }
    });
  });

  describe("Primary Publication Readiness Exclusivity", () => {
    it("strictly partitions readiness into 4 RESEARCH_ONLY, 3 NEEDS_EXTERNAL_VERIFICATION, 5 NEEDS_OWNER_CONFIRMATION, 0 FOUNDATION_READY, 4 POTENTIALLY_PUBLISHABLE", () => {
      const summary = datasetValidation.summary.primaryReadinessCounts;
      assert.equal(summary.RESEARCH_ONLY, 4);
      assert.equal(summary.NEEDS_EXTERNAL_VERIFICATION, 3);
      assert.equal(summary.NEEDS_OWNER_CONFIRMATION, 5);
      assert.equal(summary.FOUNDATION_READY, 0);
      assert.equal(summary.POTENTIALLY_PUBLISHABLE_AFTER_EDITORIAL_REVIEW, 4);

      assert.equal(datasetValidation.summary.primaryReadinessTotal, 16);
    });

    it("ensures each venue has exactly one primary readiness state", () => {
      for (const venue of HAXR_INTERNAL_VENUES) {
        assert.ok(
          venue.readiness.primary,
          `Local ${venue.id} deve ter um estado primário de prontidão`
        );
      }
    });

    it("verifies the 5 owner-named venues remain in NEEDS_OWNER_CONFIRMATION", () => {
      const ownerNamed = [
        "THE_VENUE_MZ",
        "VILA_VERDE_MOZAL",
        "ALIANCA_EVENTOS",
        "EVELYN_EVENTOS",
        "CASA_D_ARTISTA_KUTENGA",
      ];

      for (const id of ownerNamed) {
        const venue = HAXR_INTERNAL_VENUES.find((v) => v.id === id);
        assert.ok(venue);
        assert.equal(
          venue.readiness.primary,
          "NEEDS_OWNER_CONFIRMATION",
          `Local ${id} deve estar em NEEDS_OWNER_CONFIRMATION`
        );
      }
    });

    it("verifies the 4 secondary-only venues remain in RESEARCH_ONLY", () => {
      const secondaryOnly = [
        "QUINTA_DA_STELA",
        "CASTELO_EVENTOS",
        "NAMYLALA_EVENTOS",
        "COMPLEXO_LOUANINE",
      ];

      for (const id of secondaryOnly) {
        const venue = HAXR_INTERNAL_VENUES.find((v) => v.id === id);
        assert.ok(venue);
        assert.equal(
          venue.readiness.primary,
          "RESEARCH_ONLY",
          `Local ${id} deve estar em RESEARCH_ONLY`
        );
      }
    });
  });

  describe("Publication Eligibility & Integrity Guardrails", () => {
    it("asserts that NO venue is eligible for public publication during Phase E.1", () => {
      for (const venue of HAXR_INTERNAL_VENUES) {
        const eligible = isVenueEligibleForPublication(venue);
        assert.equal(
          eligible,
          false,
          `Local ${venue.id} não pode ser elegível para publicação pública na Fase E.1`
        );
      }
    });

    it("enforces that observed guest scale in real weddings cannot satisfy official venue capacity", () => {
      const testObservedCapacity = [
        {
          spaceName: "Salão de Teste",
          configuration: "banquete" as const,
          seatedCapacity: null,
          cocktailCapacity: null,
          capacityType: "OBSERVED_EVENT_GUEST_SCALE" as const,
          source: "Evento real acolheu 250 pessoas",
          notes: "capacidade máxima regulamentar", // Violação simulada
        },
      ];

      assert.equal(
        validateCapacityDistinction(testObservedCapacity),
        false,
        "Capacidade observada não pode alegar lotação máxima regulamentar"
      );
    });

    it("proves that research sources or technical field presence cannot automatically imply HAXR verification", () => {
      // Cria um local sintético com todos os campos técnicos verificados mas sem auditoria HAXR
      const syntheticVenue: Venue = {
        ...HAXR_INTERNAL_VENUES[0],
        trust: {
          ...HAXR_INTERNAL_VENUES[0].trust,
          identity: "VERIFIED",
          location: "VERIFIED",
          contact: "VERIFIED",
          capability: "VERIFIED",
          capacity: "VERIFIED",
          visitedByHaxr: false,
          haxrVerified: false,
          haxrPartner: false,
        },
      };

      assert.equal(
        isVenueHaxrVerified(syntheticVenue),
        false,
        "Campos técnicos verificados isoladamente nunca implicam HAXR_VERIFIED"
      );
    });

    it("proves that partnership cannot imply verification and verification cannot imply partnership", () => {
      const partnerOnly: Venue = {
        ...HAXR_INTERNAL_VENUES[0],
        trust: {
          ...HAXR_INTERNAL_VENUES[0].trust,
          haxrPartner: true,
          haxrVerified: false,
        },
      };

      assert.equal(
        isVenueHaxrVerified(partnerOnly),
        false,
        "Parceria comercial nunca confere automaticamente estatuto verificado HAXR"
      );
    });
  });

  describe("Capacity Wording & Homologation Sanity", () => {
    it("ensures no capacity notes in dataset use the forbidden phrase 'capacidade homologada' without regulatory act", () => {
      for (const venue of HAXR_INTERNAL_VENUES) {
        for (const detail of venue.evidence.capacity.value) {
          if (detail.notes) {
            assert.equal(
              detail.notes.toLowerCase().includes("capacidade homologada"),
              false,
              `Local ${venue.id} contém termo proibido 'capacidade homologada' em notes`
            );
          }
        }
      }
    });

    it("ensures official declared capacity specifies distinct spaces without conflating ballrooms with exterior gardens", () => {
      const radisson = HAXR_INTERNAL_VENUES.find(
        (v) => v.id === "RADISSON_BLU_MAPUTO"
      );
      assert.ok(radisson);
      assert.equal(radisson.evidence.capacity.value.length, 2);

      const zambeze = radisson.evidence.capacity.value.find((s) =>
        s.spaceName.includes("Zambeze")
      );
      const jardim = radisson.evidence.capacity.value.find((s) =>
        s.spaceName.includes("Jardim")
      );

      assert.ok(zambeze);
      assert.ok(jardim);
      assert.equal(zambeze.seatedCapacity, 160);
      assert.equal(zambeze.cocktailCapacity, 250);
      assert.equal(jardim.seatedCapacity, null);
      assert.equal(jardim.cocktailCapacity, 120);
    });
  });

  describe("Phase E.1 Boundary Guardrails — No Public Routes, Navigation or DB Leakage", () => {
    it("proves that venue route exists in marketing group as part of Phase E.2", () => {
      const appDir = path.resolve(process.cwd(), "src/app");
      const marketingVenueRoute = path.join(appDir, "(marketing)", "locais-para-casamentos");
      assert.equal(
        fs.existsSync(marketingVenueRoute),
        true,
        "A rota /locais-para-casamentos deve existir no grupo (marketing) para a Fase E.2"
      );
    });

    it("proves that navigation menu has NOT been altered to expose venue guide routes", () => {
      for (const group of navGroups) {
        for (const link of group.links) {
          assert.notEqual(
            link.href,
            "/locais-para-casamentos",
            `O link ${link.label} (${link.href}) aponta indevidamente para /locais-para-casamentos`
          );
        }
      }

      for (const link of navDirectLinks) {
        assert.notEqual(
          link.href,
          "/locais-para-casamentos",
          `O link directo ${link.label} (${link.href}) aponta indevidamente para /locais-para-casamentos`
        );
      }
    });

    it("proves that public sitemap does NOT include /locais-para-casamentos", async () => {
      const sitemapModule = await import("@/app/sitemap");
      const sitemapEntries = sitemapModule.default();
      const hasVenueEntry = sitemapEntries.some((entry) =>
        entry.url.includes("locais-para-casamentos")
      );
      assert.equal(
        hasVenueEntry,
        false,
        "O sitemap público NÃO pode conter URLs de locais-para-casamentos na Fase E.1"
      );
    });

    it("proves that no new SQL migrations were created in docs/migrations or supabase/migrations for venues", () => {
      const migrationsDir = path.resolve(process.cwd(), "docs/migrations");
      if (fs.existsSync(migrationsDir)) {
        const files = fs.readdirSync(migrationsDir);
        const venueMigration = files.find((f) =>
          f.toLowerCase().includes("venue")
        );
        assert.equal(
          venueMigration,
          undefined,
          "Nenhuma migração de venues pode ser criada na Fase E.1"
        );
      }
    });
  });
});
