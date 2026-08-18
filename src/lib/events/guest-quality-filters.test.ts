import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EventGuest } from "@/lib/events/types";
import { filterGuestsForBulk } from "./bulk-selection";

const mockGuests: EventGuest[] = [
  {
    id: "g-1",
    eventId: "event-1",
    name: "Ana Silva",
    nameNormalized: "ana silva",
    email: "ana@example.com",
    phone: "841234567",
    clientType: "individual",
    seatId: null,
    groupId: null,
    groupName: null,
    qrToken: "token-1",
    status: "invited",
    plusOnes: 0,
    dietaryNotes: "",
    guestNotes: "",
    label: "vip",
    guestSource: "manual",
    importBatchId: "batch-1",
    archivedAt: null,
    archiveReason: "",
    isIncorrect: true,
    deletedAt: null,
    inviteSentAt: "2026-07-26T18:42:00.000Z",
    createdAt: "2026-07-26T12:00:00.000Z",
    updatedAt: "2026-07-26T12:00:00.000Z",
    seat: null,
    checkedInAt: null,
  },
  {
    id: "g-2",
    eventId: "event-1",
    name: "Carlos Santos",
    nameNormalized: "carlos santos",
    email: "carlos@example.com",
    phone: "849876543",
    clientType: "individual",
    seatId: null,
    groupId: null,
    groupName: null,
    qrToken: "token-2",
    status: "confirmed",
    plusOnes: 1,
    dietaryNotes: "",
    guestNotes: "",
    label: "family",
    guestSource: "manual",
    importBatchId: "batch-1",
    archivedAt: null,
    archiveReason: "",
    isIncorrect: false,
    deletedAt: null,
    inviteSentAt: null,
    createdAt: "2026-07-26T12:00:00.000Z",
    updatedAt: "2026-07-26T12:00:00.000Z",
    seat: null,
    checkedInAt: null,
  },
  {
    id: "g-3",
    eventId: "event-1",
    name: "Beatriz Costa",
    nameNormalized: "beatriz costa",
    email: "beatriz@example.com",
    phone: "841112223",
    clientType: "individual",
    seatId: null,
    groupId: null,
    groupName: null,
    qrToken: "token-3",
    status: "invited",
    plusOnes: 0,
    dietaryNotes: "",
    guestNotes: "",
    label: "none",
    guestSource: "manual",
    importBatchId: "batch-2",
    archivedAt: null,
    archiveReason: "",
    isIncorrect: true,
    deletedAt: null,
    inviteSentAt: null,
    createdAt: "2026-07-26T12:00:00.000Z",
    updatedAt: "2026-07-26T12:00:00.000Z",
    seat: null,
    checkedInAt: null,
  },
];

describe("guest quality and invite filters", () => {
  it("filters guests by incorrectFilter=incorrect_only", () => {
    const result = filterGuestsForBulk(mockGuests, {
      eventId: "event-1",
      incorrectFilter: "incorrect_only",
    });
    assert.strictEqual(result.length, 2);
    assert.deepEqual(
      result.map((g) => g.id),
      ["g-1", "g-3"]
    );
  });

  it("filters guests by inviteSentFilter=sent", () => {
    const result = filterGuestsForBulk(mockGuests, {
      eventId: "event-1",
      inviteSentFilter: "sent",
    });
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].id, "g-1");
  });

  it("filters guests by inviteSentFilter=not_sent", () => {
    const result = filterGuestsForBulk(mockGuests, {
      eventId: "event-1",
      inviteSentFilter: "not_sent",
    });
    assert.strictEqual(result.length, 2);
    assert.deepEqual(
      result.map((g) => g.id),
      ["g-2", "g-3"]
    );
  });

  it("combines incorrectFilter and inviteSentFilter with batchId and search", () => {
    const result = filterGuestsForBulk(mockGuests, {
      eventId: "event-1",
      batchId: "batch-1",
      incorrectFilter: "incorrect_only",
      inviteSentFilter: "sent",
      search: "Ana",
    });
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].id, "g-1");
  });
});
