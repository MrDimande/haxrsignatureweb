import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertSelectionWithinScope,
  filterGuestsForBulk,
  resolveBulkSelection,
} from "./bulk-selection";
import type { EventGuest } from "@/lib/events/types";

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

describe("bulk-selection", () => {
  it("isola por event_id e lote", () => {
    const rows = filterGuestsForBulk(
      [
        guest({ id: "1", name: "A", importBatchId: "batch-a" }),
        guest({ id: "2", name: "B", importBatchId: "batch-b" }),
        guest({ id: "3", name: "C", eventId: "other", importBatchId: "batch-a" }),
      ],
      { eventId: EVENT_ID, batchId: "batch-a" }
    );
    assert.deepEqual(
      rows.map((g) => g.id),
      ["1"]
    );
  });

  it("resolve modos de selecção e bloqueia cross-batch", () => {
    assert.deepEqual(
      resolveBulkSelection({
        eventId: EVENT_ID,
        mode: "all_results",
        filteredGuestIds: ["1", "1", "2"],
      }),
      ["1", "2"]
    );

    assert.throws(() =>
      assertSelectionWithinScope(
        EVENT_ID,
        [guest({ id: "1", name: "A", importBatchId: "batch-a" })],
        ["1"],
        "batch-b"
      )
    );
  });
});
