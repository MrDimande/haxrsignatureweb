import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getEditionRsvpOperationsCopy } from "./edition-links";

describe("Edition RSVP operations copy", () => {
  it("uses Baby Aylla-specific operations without Jessica details or an invented deadline", () => {
    const copy = getEditionRsvpOperationsCopy("baby-aylla-couture");
    assert.equal(copy.title, "Monitorização do aniversário");
    assert.match(copy.description, /Baby Aylla/);
    assert.doesNotMatch(copy.description, /Jessica/);
    assert.equal(copy.reminderDeadlineLabel, undefined);
  });

  it("preserves Jessica's isolated farewell copy", () => {
    const copy = getEditionRsvpOperationsCopy("rose-elegance");
    assert.equal(copy.reminderDeadlineLabel, "20 de Julho de 2026");
  });
});
