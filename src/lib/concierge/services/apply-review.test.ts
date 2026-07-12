import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ConciergeReviewItem } from "../types";

const baseReview: ConciergeReviewItem = {
  id: "review-1",
  uploadId: "upload-1",
  eventId: "event-1",
  documentType: "vendor_proposal",
  status: "pending_review",
  extractedData: {},
  finalData: null,
  aiModel: "gemini-2.0-flash",
  aiRawResponse: "{}",
  reviewedBy: "",
  reviewedAt: null,
  appliedAt: null,
  applyError: "",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("applyApprovedReview", () => {
  it("rejeita dados finais inválidos (schema Zod)", async () => {
    const { applyApprovedReview } = await import("./apply-review.service");

    await assert.rejects(
      () =>
        applyApprovedReview(baseReview, {
          documentType: "not_a_type",
        }),
      /documentType/
    );
  });

  it("rejeita vendor_proposal sem nome antes de aceder à BD", async () => {
    const { applyApprovedReview } = await import("./apply-review.service");

    await assert.rejects(
      () =>
        applyApprovedReview(baseReview, {
          documentType: "vendor_proposal",
          vendorProposal: {
            vendorName: "",
            serviceCategory: "Catering",
          },
        }),
      /vendorProposal.vendorName/
    );
  });

  it("aceita contract com summary para arquivo", async () => {
    const { validateConciergeExtraction } = await import("../validate-extraction");
    const result = validateConciergeExtraction({
      documentType: "contract",
      summary: "Contrato venue",
    });
    assert.equal(result.ok, true);
  });

  it("rejeita guest_list vazia na validação", async () => {
    const { applyApprovedReview } = await import("./apply-review.service");

    await assert.rejects(
      () =>
        applyApprovedReview(
          { ...baseReview, documentType: "guest_list" },
          {
            documentType: "guest_list",
            guestList: { guests: [], csvText: "" },
          }
        ),
      /guestList/
    );
  });
});
