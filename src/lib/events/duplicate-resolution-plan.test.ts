import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  pickBestDuplicateResolution,
  planDuplicateResolutionImport,
  scoreResolutionMatch,
} from "@/lib/events/duplicate-resolution-plan";

describe("scoreResolutionMatch", () => {
  const base = {
    fingerprint: "fp-incoming",
    normalizedEmail: "helio@example.com",
    normalizedPhone: "351912000111",
    normalizedName: "helio matola",
    storedFingerprint: null,
    storedFingerprints: null,
    storedEmail: null,
    storedPhone: null,
    storedNameNormalized: null,
  };

  it("prioriza fingerprint", () => {
    assert.equal(
      scoreResolutionMatch({
        ...base,
        storedFingerprint: "fp-incoming",
        storedEmail: "helio@example.com",
      }),
      "fingerprint"
    );
  });

  it("match por email", () => {
    assert.equal(
      scoreResolutionMatch({ ...base, storedEmail: "helio@example.com" }),
      "email"
    );
  });

  it("match por telefone", () => {
    assert.equal(
      scoreResolutionMatch({ ...base, storedPhone: "351912000111" }),
      "phone"
    );
  });

  it("match por nome normalizado", () => {
    assert.equal(
      scoreResolutionMatch({
        ...base,
        normalizedEmail: "",
        normalizedPhone: "",
        storedNameNormalized: "helio matola",
      }),
      "name"
    );
  });

  it("Helio vs Helio Matola — nomes diferentes sem match", () => {
    assert.equal(
      scoreResolutionMatch({
        ...base,
        normalizedName: "helio",
        storedNameNormalized: "helio matola",
      }),
      "none"
    );
  });

  it("Helio e Esposa memorizado após merge manual", () => {
    assert.equal(
      scoreResolutionMatch({
        ...base,
        normalizedEmail: "",
        normalizedPhone: "",
        normalizedName: "helio e esposa",
        storedNameNormalized: "helio e esposa",
      }),
      "name"
    );
  });
});

describe("pickBestDuplicateResolution", () => {
  it("prefere fingerprint sobre nome", () => {
    const best = pickBestDuplicateResolution([
      {
        id: "a",
        primaryGuestId: "p1",
        resolutionStatus: "merged",
        matchKind: "name",
      },
      {
        id: "b",
        primaryGuestId: "p2",
        resolutionStatus: "merged",
        matchKind: "fingerprint",
      },
    ]);
    assert.equal(best?.id, "b");
  });

  it("prefere merged sobre ignored com mesmo match", () => {
    const best = pickBestDuplicateResolution([
      {
        id: "a",
        primaryGuestId: "p1",
        resolutionStatus: "ignored",
        matchKind: "email",
      },
      {
        id: "b",
        primaryGuestId: "p2",
        resolutionStatus: "merged",
        matchKind: "email",
      },
    ]);
    assert.equal(best?.id, "b");
  });
});

describe("planDuplicateResolutionImport", () => {
  const merged = {
    id: "r1",
    primaryGuestId: "primary-1",
    resolutionStatus: "merged" as const,
    matchKind: "name" as const,
  };

  it("merged com primary existente → use_primary", () => {
    const plan = planDuplicateResolutionImport(merged, true);
    assert.equal(plan.type, "use_primary");
    if (plan.type === "use_primary") {
      assert.equal(plan.guestId, "primary-1");
      assert.equal(plan.reason, "duplicate_resolution_merged");
    }
  });

  it("merged com primary apagado → primary_missing", () => {
    const plan = planDuplicateResolutionImport(merged, false);
    assert.equal(plan.type, "primary_missing");
  });

  it("ignored → ignored", () => {
    const plan = planDuplicateResolutionImport(
      { ...merged, resolutionStatus: "ignored" },
      true
    );
    assert.equal(plan.type, "ignored");
  });

  it("needs_review → needs_review", () => {
    const plan = planDuplicateResolutionImport(
      { ...merged, resolutionStatus: "needs_review" },
      true
    );
    assert.equal(plan.type, "needs_review");
  });
});
