import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildSheetRowFingerprint } from "./fingerprint";
import { findGuestMatch } from "./match";
import { resolveImportPlan } from "./idempotent-import";
import type { EventGuest } from "@/lib/events/types";
import type { SheetGuestRow } from "./types";

const EVENT_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

function guest(
  partial: Partial<EventGuest> & Pick<EventGuest, "id" | "name">
): EventGuest {
  return {
    eventId: EVENT_ID,
    email: "",
    phone: "",
    clientType: "individual",
    seatId: null,
    groupId: null,
    groupName: null,
    qrToken: "qr",
    status: "invited",
    plusOnes: 0,
    dietaryNotes: "",
    guestNotes: "",
    label: "none",
    guestSource: "manual",
    importBatchId: null,
    archivedAt: null,
    archiveReason: "",
    isIncorrect: false,
    deletedAt: null,
    inviteSentAt: null,
    createdAt: "",
    updatedAt: "",
    nameNormalized: partial.name.toLowerCase(),
    seat: null,
    checkedInAt: null,
    ...partial,
  };
}

function row(partial: Partial<SheetGuestRow> & Pick<SheetGuestRow, "name">): SheetGuestRow {
  return {
    rowNumber: partial.rowNumber ?? 1,
    email: "",
    phone: "",
    clientType: "individual",
    status: "confirmed",
    plusOnes: 0,
    dietaryNotes: "",
    guestNotes: "",
    label: "none",
    ...partial,
  };
}

describe("dedup — fingerprint estável entre posições de linha", () => {
  it("row number muda mas dados iguais → mesmo fingerprint", () => {
    const fp1 = buildSheetRowFingerprint({
      eventId: EVENT_ID,
      source: "google_sheet",
      name: "Ana Costa",
      email: "ana@example.com",
    });
    const fp2 = buildSheetRowFingerprint({
      eventId: EVENT_ID,
      source: "google_sheet",
      name: "Ana Costa",
      email: "ana@example.com",
    });
    assert.equal(fp1, fp2);
  });
});

describe("dedup — match logic preservada", () => {
  const guests = [
    guest({
      id: "g-email",
      name: "Pedro Santos",
      email: "pedro@example.com",
    }),
    guest({
      id: "g-phone",
      name: "Sofia Lima",
      phone: "+351912000111",
    }),
    guest({
      id: "g-name",
      name: "Rui Mendes",
    }),
  ];

  it("match por email", () => {
    const match = findGuestMatch(
      guests,
      row({ name: "Outro Nome", email: "PEDRO@example.com" }),
      new Set()
    );
    assert.equal(match?.id, "g-email");
  });

  it("match por telefone com formatação", () => {
    const match = findGuestMatch(
      guests,
      row({ name: "Sofia", phone: "+351 912 000 111" }),
      new Set()
    );
    assert.equal(match?.id, "g-phone");
  });

  it("match por nome normalizado", () => {
    const match = findGuestMatch(
      guests,
      row({ name: "  RUI   MENDES  " }),
      new Set()
    );
    assert.equal(match?.id, "g-name");
  });
});

describe("dedup — segunda passagem simulada via plan", () => {
  it("mesma linha com ledger → não cria novo (ledger_update)", () => {
    const fingerprint = buildSheetRowFingerprint({
      eventId: EVENT_ID,
      source: "csv_upload",
      name: "Helio",
      email: "helio@example.com",
    });
    assert.ok(fingerprint);

    const secondPass = resolveImportPlan({
      ledgerGuestId: "existing-guest",
      ledgerExists: true,
      ledgerAction: "created",
      linkedGuestExists: true,
      matchGuestId: null,
    });
    assert.equal(secondPass.type, "ledger_update");
  });

  it("guest apagado com ledger → skipped, sem recreate", () => {
    const plan = resolveImportPlan({
      ledgerGuestId: null,
      ledgerExists: true,
      ledgerAction: "created",
      linkedGuestExists: false,
      matchGuestId: "could-match",
    });
    assert.equal(plan.type, "skip_deleted");
  });

  it("primeira importação sem ledger → match ou create", () => {
    const withMatch = resolveImportPlan({
      ledgerGuestId: null,
      ledgerExists: false,
      ledgerAction: null,
      linkedGuestExists: false,
      matchGuestId: "g-email",
    });
    assert.equal(withMatch.type, "match_update");

    const fresh = resolveImportPlan({
      ledgerGuestId: null,
      ledgerExists: false,
      ledgerAction: null,
      linkedGuestExists: false,
      matchGuestId: null,
    });
    assert.equal(fresh.type, "create_new");
  });
});
