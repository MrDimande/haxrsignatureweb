import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertConciergeStoragePath } from "./services/concierge-file-url.service";

describe("assertConciergeStoragePath", () => {
  it("aceita caminho válido do evento", () => {
    assert.doesNotThrow(() =>
      assertConciergeStoragePath(
        "abc-123",
        "events/abc-123/concierge/upload-1/proposta.pdf"
      )
    );
  });

  it("rejeita caminho de outro evento", () => {
    assert.throws(
      () =>
        assertConciergeStoragePath(
          "abc-123",
          "events/outro-evento/concierge/upload-1/proposta.pdf"
        ),
      /inválido/
    );
  });

  it("rejeita path traversal", () => {
    assert.throws(
      () =>
        assertConciergeStoragePath(
          "abc-123",
          "events/abc-123/concierge/../secret.pdf"
        ),
      /inválido/
    );
  });
});
