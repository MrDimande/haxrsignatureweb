import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AUTH_LEGAL_DOCUMENT_IDS,
  getAuthLegalDocument,
} from "./legal-documents";

describe("auth legal documents", () => {
  it("exposes complete terms and privacy content during sign-up", () => {
    assert.deepEqual(AUTH_LEGAL_DOCUMENT_IDS, ["terms", "privacy"]);

    for (const id of AUTH_LEGAL_DOCUMENT_IDS) {
      const document = getAuthLegalDocument(id);

      assert.equal(document.id, id);
      assert.ok(document.label.trim().length > 0);
      assert.ok(document.headline.trim().length > 0);
      assert.ok(document.paragraphs.length > 0);
      assert.ok(document.paragraphs.every((paragraph) => paragraph.trim().length > 0));
    }
  });
});
