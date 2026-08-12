import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getComparisonLevel,
  invitationCapabilities,
  invitationOccasions,
  invitationPackages,
} from "./invitation-offer";

describe("invitation offer catalogue", () => {
  it("keeps the approved wedding collection and prices", () => {
    const weddingPackages = invitationPackages.filter((item) => item.occasion === "casamento");

    assert.deepEqual(
      weddingPackages.map(({ id, name, price }) => ({ id, name, price })),
      [
        { id: "prologo", name: "Prólogo", price: 7999 },
        { id: "elo", name: "Elo", price: 15999 },
        { id: "legado", name: "Legado", price: 25000 },
      ]
    );
  });

  it("has a real package collection for every published occasion", () => {
    for (const occasion of invitationOccasions) {
      assert.ok(
        invitationPackages.some((item) => item.occasion === occasion.id),
        `Missing package for ${occasion.id}`
      );
    }
  });

  it("keeps package cards concise and commercially useful", () => {
    for (const packageItem of invitationPackages) {
      assert.ok(packageItem.features.length >= 5, `${packageItem.id} has too few benefits`);
      assert.ok(packageItem.features.length <= 8, `${packageItem.id} has too many main benefits`);
      assert.ok(packageItem.details.length >= 2, `${packageItem.id} needs detailed scope`);
    }
  });

  it("uses only known capabilities and resolves comparison levels", () => {
    const capabilityIds = new Set(invitationCapabilities.map((item) => item.id));

    for (const packageItem of invitationPackages) {
      for (const capability of [...packageItem.included, ...packageItem.optional]) {
        assert.ok(capabilityIds.has(capability), `Unknown capability ${capability}`);
      }

      for (const capability of invitationCapabilities) {
        assert.ok(
          ["included", "optional", "none"].includes(
            getComparisonLevel(packageItem, capability.id)
          )
        );
      }
    }
  });
});
