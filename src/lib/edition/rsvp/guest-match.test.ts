import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  matchEditionRsvpGuest,
  mergeNonEmptyContact,
  wouldRpcNameMatchWrongContact,
  type EditionGuestMatchCandidate,
} from "./guest-match";

const EVENT_A = "event-a";
const EVENT_B = "event-b";

function guest(
  partial: Partial<EditionGuestMatchCandidate> & Pick<EditionGuestMatchCandidate, "id">
): EditionGuestMatchCandidate {
  return {
    eventId: EVENT_A,
    name: "Maria Silva",
    nameNormalized: "maria silva",
    email: "",
    phone: "",
    guestSource: "edition_rsvp",
    ...partial,
  };
}

describe("matchEditionRsvpGuest", () => {
  it("idempotent phone match on same event", () => {
    const candidates = [
      guest({
        id: "g1",
        phone: "+258 84 123 4567",
        name: "Maria",
        nameNormalized: "maria",
      }),
    ];
    const result = matchEditionRsvpGuest(
      {
        eventId: EVENT_A,
        name: "Maria Silva Outro",
        phone: "258841234567",
      },
      candidates
    );
    assert.equal(result.kind, "unique");
    if (result.kind === "unique") {
      assert.equal(result.via, "phone");
      assert.equal(result.guest.id, "g1");
    }
  });

  it("same phone on different events does not cross-update", () => {
    const candidates = [
      guest({
        id: "g-other",
        eventId: EVENT_B,
        phone: "258841234567",
      }),
    ];
    const result = matchEditionRsvpGuest(
      {
        eventId: EVENT_A,
        name: "Maria Silva",
        phone: "258841234567",
      },
      candidates
    );
    assert.equal(result.kind, "none");
  });

  it("normalizes email for match", () => {
    const candidates = [
      guest({
        id: "g2",
        email: "Maria@Example.COM",
      }),
    ];
    const result = matchEditionRsvpGuest(
      {
        eventId: EVENT_A,
        name: "Outro Nome",
        email: "maria@example.com",
      },
      candidates
    );
    assert.equal(result.kind, "unique");
    if (result.kind === "unique") assert.equal(result.via, "email");
  });

  it("rejects guest_id from another event", () => {
    const candidates = [
      guest({
        id: "g-cross",
        eventId: EVENT_B,
      }),
    ];
    const result = matchEditionRsvpGuest(
      {
        eventId: EVENT_A,
        name: "Maria",
        guestId: "g-cross",
      },
      candidates
    );
    assert.equal(result.kind, "cross_event");
  });

  it("ambiguous phone does not pick a guest", () => {
    const candidates = [
      guest({ id: "g1", phone: "841111111", name: "A", nameNormalized: "a" }),
      guest({ id: "g2", phone: "841111111", name: "B", nameNormalized: "b" }),
    ];
    const result = matchEditionRsvpGuest(
      { eventId: EVENT_A, name: "C", phone: "841111111" },
      candidates
    );
    assert.equal(result.kind, "ambiguous");
  });

  it("same name with different contacts does not match by name", () => {
    const candidates = [
      guest({
        id: "g1",
        nameNormalized: "joao costa",
        phone: "840000001",
      }),
    ];
    const result = matchEditionRsvpGuest(
      {
        eventId: EVENT_A,
        name: "Joao Costa",
        phone: "840000002",
      },
      candidates
    );
    assert.equal(result.kind, "none");
  });

  it("payload without identifiers yields none (RPC may still create)", () => {
    const candidates = [
      guest({
        id: "g1",
        nameNormalized: "alguem",
        phone: "849999999",
      }),
    ];
    const result = matchEditionRsvpGuest(
      { eventId: EVENT_A, name: "Pessoa Nova" },
      candidates
    );
    assert.equal(result.kind, "none");
  });

  it("does not match solely on name across guest_source manual", () => {
    const candidates = [
      guest({
        id: "g-manual",
        guestSource: "manual",
        nameNormalized: "maria silva",
      }),
    ];
    const result = matchEditionRsvpGuest(
      { eventId: EVENT_A, name: "Maria Silva" },
      candidates
    );
    assert.equal(result.kind, "none");
  });
});

describe("mergeNonEmptyContact", () => {
  it("preserves richer existing values when incoming empty", () => {
    assert.equal(mergeNonEmptyContact("a@b.com", ""), "a@b.com");
    assert.equal(mergeNonEmptyContact("a@b.com", undefined), "a@b.com");
    assert.equal(mergeNonEmptyContact("a@b.com", "c@d.com"), "c@d.com");
  });
});

describe("wouldRpcNameMatchWrongContact", () => {
  it("detects same name with different phone (RPC overwrite risk)", () => {
    const candidates = [
      guest({
        id: "g1",
        nameNormalized: "joao costa",
        phone: "840000001",
      }),
    ];
    assert.equal(
      wouldRpcNameMatchWrongContact(
        "joao costa",
        { phone: "840000002" },
        candidates,
        EVENT_A
      ),
      true
    );
  });
});
