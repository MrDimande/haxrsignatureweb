import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ZodIssueCode } from "zod";
import { summarizeDashboardValidationIssues } from "@/lib/dashboard/dashboard-adapter";

describe("summarizeDashboardValidationIssues", () => {
  it("returns only validation metadata without serializing payload values", () => {
    const issues = summarizeDashboardValidationIssues([
      {
        code: ZodIssueCode.invalid_type,
        expected: "string",
        received: "date",
        path: ["meta", "lastSyncedAt"],
        message: "Expected string, received date",
      },
    ]);

    assert.deepEqual(issues, [
      {
        path: "meta.lastSyncedAt",
        expected: "string",
        received: "date",
        code: "invalid_type",
      },
    ]);
  });
});
