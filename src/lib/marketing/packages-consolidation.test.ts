import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  invitationComparison,
  invitationPackages,
} from "@/lib/site-config";
import { styleQuizPackageMap } from "./style-quiz-packages";

describe("Web-Convites Package Consolidation — Owner Canonical Alignment", () => {
  it("exclusively exposes Prólogo, Elo, and Legado as current wedding package tiers", () => {
    const weddingPackages = invitationPackages.filter((pkg) =>
      (pkg.occasions as readonly string[]).includes("casamento"),
    );

    const packageIds: string[] = weddingPackages.map((p) => p.id);
    const packageNames: string[] = weddingPackages.map((p) => p.name);

    assert.deepEqual(packageIds, ["prologo", "elo", "legado"]);
    assert.deepEqual(packageNames, ["Prólogo", "Elo", "Legado"]);

    // REGRESSION GUARD: Legacy packages must NEVER appear in current public wedding offer
    assert.equal(packageIds.includes("essencial"), false);
    assert.equal(packageIds.includes("signature"), false);
    assert.equal(packageIds.includes("royal"), false);
    assert.equal(packageNames.includes("Essencial"), false);
    assert.equal(packageNames.includes("Royal"), false);
  });

  it("verifies currently implemented prices for Prólogo, Elo, and Legado", () => {
    const prologo = invitationPackages.find((p) => p.id === "prologo");
    const elo = invitationPackages.find((p) => p.id === "elo");
    const legado = invitationPackages.find((p) => p.id === "legado");

    assert.ok(prologo);
    assert.ok(elo);
    assert.ok(legado);

    assert.equal(prologo?.price, 7999);
    assert.equal(prologo?.priceLabel, "7.999 MT");

    assert.equal(elo?.price, 15999);
    assert.equal(elo?.priceLabel, "15.999 MT");

    assert.equal(legado?.price, 25000);
    assert.equal(legado?.priceLabel, "25.000 MT");
  });

  it("ensures style quiz recommendations only point to canonical packages", () => {
    for (const [key, pkg] of Object.entries(styleQuizPackageMap)) {
      assert.ok(
        ["prologo", "elo", "legado"].includes(pkg.slug),
        `Style key "${key}" points to non-canonical package "${pkg.slug}"`,
      );
      assert.ok(
        ["Prólogo", "Elo", "Legado"].includes(pkg.name),
        `Style key "${key}" displays non-canonical name "${pkg.name}"`,
      );
      assert.doesNotMatch(pkg.contactHref, /pacote=(essencial|signature|royal)/);
    }
  });

  it("verifies invitation comparison table exclusively maps to prologo, elo, and legado", () => {
    assert.ok(invitationComparison.length > 0);

    for (const row of invitationComparison) {
      assert.ok("prologo" in row, "Row must contain prologo");
      assert.ok("elo" in row, "Row must contain elo");
      assert.ok("legado" in row, "Row must contain legado");

      assert.equal("essencial" in row, false, "Row must not contain essencial");
      assert.equal("royal" in row, false, "Row must not contain royal");
    }
  });
});
