import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildImportPreview,
  isValidImportPhone,
  rowsSelectedForImport,
} from "./services/import-preview.service";
import type { EventGuest } from "@/lib/events/types";
import type { SheetGuestRow } from "./sheets/types";

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

function row(
  partial: Partial<SheetGuestRow> & Pick<SheetGuestRow, "name" | "rowNumber">
): SheetGuestRow {
  return {
    email: "",
    phone: "",
    clientType: "individual",
    ...partial,
  };
}

describe("import preview", () => {
  it("classifica válidos, inválidos, duplicados e existentes", () => {
    const preview = buildImportPreview(
      [
        row({ rowNumber: 1, name: "Ana", email: "a@test.com", phone: "+258841234567" }),
        row({ rowNumber: 2, name: "Ana", email: "b@test.com" }),
        row({ rowNumber: 3, name: "", email: "x@test.com" }),
        row({ rowNumber: 4, name: "Bruno", phone: "123" }),
        row({ rowNumber: 5, name: "Carla", email: "c@test.com" }),
      ],
      [guest({ id: "g1", name: "Carla" })]
    );

    assert.equal(preview.summary.totalRows, 5);
    assert.equal(preview.summary.validRows, 1);
    assert.equal(preview.summary.duplicateRows, 1);
    assert.equal(preview.summary.invalidRows, 2);
    assert.equal(preview.summary.existingRows, 1);
    assert.equal(preview.summary.finalImportTotal, 2);
  });

  it("respeita exclusões e telefone vazio como contacto em falta", () => {
    assert.equal(isValidImportPhone(""), true);
    assert.equal(isValidImportPhone("84"), false);

    const preview = buildImportPreview(
      [row({ rowNumber: 1, name: "Diana", email: "d@test.com" })],
      [],
      ["r1"]
    );
    assert.equal(preview.rows[0]?.status, "excluded");
    assert.equal(rowsSelectedForImport(preview).length, 0);
  });
});
