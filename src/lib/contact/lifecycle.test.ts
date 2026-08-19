import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  MANUAL_INQUIRY_STATUSES,
  isManualInquiryStatus,
  assertManualInquiryStatus,
  assertInquiryCanConvert,
} from "./constants";
import type { InquiryStatus, ManualInquiryStatus } from "./types";

describe("contact inquiry lifecycle & conversion integrity policy", () => {
  it("A, B, C. 'new', 'contacted', and 'archived' are manually assignable statuses", () => {
    assert.equal(isManualInquiryStatus("new"), true);
    assert.equal(isManualInquiryStatus("contacted"), true);
    assert.equal(isManualInquiryStatus("archived"), true);

    assert.doesNotThrow(() => assertManualInquiryStatus("new"));
    assert.doesNotThrow(() => assertManualInquiryStatus("contacted"));
    assert.doesNotThrow(() => assertManualInquiryStatus("archived"));

    assert.deepEqual(MANUAL_INQUIRY_STATUSES, ["new", "contacted", "archived"]);
  });

  it("D. 'converted' is NOT manually assignable", () => {
    assert.equal(isManualInquiryStatus("converted"), false);
  });

  it("E. manual 'converted' transition produces a controlled action/service error", () => {
    assert.throws(
      () => assertManualInquiryStatus("converted"),
      (err: unknown) => {
        assert(err instanceof Error);
        assert.equal(
          err.message,
          "Use o fluxo de conversão para criar o cliente e o evento."
        );
        return true;
      }
    );

    assert.throws(
      () => assertManualInquiryStatus("invalid_status"),
      (err: unknown) => {
        assert(err instanceof Error);
        assert.match(err.message, /Estado de lead inválido/);
        return true;
      }
    );
  });

  it("F. an already-converted inquiry cannot enter the conversion workflow again", () => {
    const convertedInquiry = { status: "converted" as InquiryStatus };

    assert.throws(
      () => assertInquiryCanConvert(convertedInquiry),
      (err: unknown) => {
        assert(err instanceof Error);
        assert.equal(err.message, "Este lead já foi convertido.");
        return true;
      }
    );
  });

  it("G. non-converted inquiries ('new', 'contacted', 'archived') can enter the conversion workflow", () => {
    assert.doesNotThrow(() => assertInquiryCanConvert({ status: "new" }));
    assert.doesNotThrow(() => assertInquiryCanConvert({ status: "contacted" }));
    assert.doesNotThrow(() => assertInquiryCanConvert({ status: "archived" }));
  });

  it("H. InquiryStatus union and ManualInquiryStatus type contract integrity", () => {
    const validStatuses: InquiryStatus[] = ["new", "contacted", "converted", "archived"];
    const validManualStatuses: ManualInquiryStatus[] = ["new", "contacted", "archived"];

    assert.equal(validStatuses.length, 4);
    assert.equal(validManualStatuses.length, 3);
  });
});
