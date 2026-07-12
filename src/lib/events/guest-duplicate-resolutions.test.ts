import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildSheetRowFingerprint } from "@/lib/events/sheets/fingerprint";
import { buildDuplicateFingerprintsForGuest } from "@/lib/events/repositories/guest-duplicate-resolutions.repository";
import { planDuplicateResolutionImport } from "@/lib/events/duplicate-resolution-plan";

const EVENT_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

describe("buildDuplicateFingerprintsForGuest", () => {
  it("gera fingerprints distintos por fonte", () => {
    const fps = buildDuplicateFingerprintsForGuest(EVENT_ID, {
      name: "Helio Matola",
      email: "helio@example.com",
      phone: "+351912000111",
      plusOnes: 0,
      groupId: null,
    });

    assert.notEqual(fps.google_sheet, fps.csv_upload);
    assert.equal(fps.google_sheet.length, 64);
  });
});

describe("duplicate resolution import memory", () => {
  it("variante Helio memorizada após merge → mapeia ao primary", () => {
    const helioFp = buildSheetRowFingerprint({
      eventId: EVENT_ID,
      source: "google_sheet",
      name: "Helio",
      email: "",
      phone: "",
    });

    const helioMatolaFp = buildSheetRowFingerprint({
      eventId: EVENT_ID,
      source: "google_sheet",
      name: "Helio Matola",
      email: "helio@example.com",
      phone: "+351912000111",
    });

    assert.notEqual(helioFp, helioMatolaFp);

    const planForHelio = planDuplicateResolutionImport(
      {
        id: "res-helio",
        primaryGuestId: "primary-helio-matola",
        resolutionStatus: "merged",
        matchKind: "name",
      },
      true
    );

    assert.equal(planForHelio.type, "use_primary");
  });

  it("resync após merge não deve criar guest — plan use_primary", () => {
    const plan = planDuplicateResolutionImport(
      {
        id: "res-1",
        primaryGuestId: "survivor",
        resolutionStatus: "merged",
        matchKind: "email",
      },
      true
    );
    assert.equal(plan.type, "use_primary");
  });

  it("ignored resolution não cria guest", () => {
    const plan = planDuplicateResolutionImport(
      {
        id: "res-2",
        primaryGuestId: "survivor",
        resolutionStatus: "ignored",
        matchKind: "name",
      },
      true
    );
    assert.equal(plan.type, "ignored");
  });

  it("primary apagado → skipped", () => {
    const plan = planDuplicateResolutionImport(
      {
        id: "res-3",
        primaryGuestId: "gone",
        resolutionStatus: "merged",
        matchKind: "phone",
      },
      false
    );
    assert.equal(plan.type, "primary_missing");
  });
});

describe("Helio family variants", () => {
  it("Hélio com acento normaliza igual para memória por nome", () => {
    const a = buildSheetRowFingerprint({
      eventId: EVENT_ID,
      source: "csv_upload",
      name: "Hélio",
    });
    const b = buildSheetRowFingerprint({
      eventId: EVENT_ID,
      source: "csv_upload",
      name: "Helio",
    });
    assert.equal(a, b);
  });

  it("Helio +1 normaliza como Helio no fingerprint", () => {
    const a = buildSheetRowFingerprint({
      eventId: EVENT_ID,
      source: "google_sheet",
      name: "Helio +1",
    });
    const b = buildSheetRowFingerprint({
      eventId: EVENT_ID,
      source: "google_sheet",
      name: "Helio",
    });
    assert.equal(a, b);
  });
});
