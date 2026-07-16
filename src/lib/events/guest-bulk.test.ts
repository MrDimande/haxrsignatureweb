import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assessBulkImpact,
  assertGuestsScopedToBatch,
  assertGuestsScopedToEvent,
  getGuestProtectionFlags,
} from "./services/guest-bulk.service";
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

describe("guest bulk protections", () => {
  it("detecta protecções RSVP, lugar, check-in e convite", () => {
    assert.deepEqual(
      getGuestProtectionFlags(guest({ id: "1", name: "A", status: "confirmed" })),
      ["rsvp"]
    );
    assert.deepEqual(
      getGuestProtectionFlags(guest({ id: "2", name: "B", seatId: "s1" })),
      ["seat"]
    );
    assert.deepEqual(
      getGuestProtectionFlags(
        guest({ id: "3", name: "C", checkedInAt: "2026-01-01T00:00:00Z" })
      ),
      ["check_in"]
    );
    assert.deepEqual(
      getGuestProtectionFlags(
        guest({ id: "4", name: "D", inviteSentAt: "2026-01-01T00:00:00Z" })
      ),
      ["invite_sent"]
    );
  });

  it("bloqueia hard delete quando há protegidos e valida scopes", () => {
    const impact = assessBulkImpact([
      guest({ id: "1", name: "A" }),
      guest({ id: "2", name: "B", status: "confirmed" }),
    ]);
    assert.equal(impact.protectedCount, 1);
    assert.equal(impact.canHardDelete, false);
    assert.equal(impact.recommendedAction, "block_hard_delete");

    assert.doesNotThrow(() =>
      assertGuestsScopedToEvent(EVENT_ID, [guest({ id: "1", name: "A" })])
    );
    assert.throws(() =>
      assertGuestsScopedToEvent(EVENT_ID, [
        guest({ id: "1", name: "A", eventId: "other" }),
      ])
    );

    assert.throws(() =>
      assertGuestsScopedToBatch("batch-a", [
        guest({ id: "1", name: "A", importBatchId: "batch-b" }),
      ])
    );
  });
});
