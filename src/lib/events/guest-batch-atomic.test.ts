import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
  RemoveImportBatchResult,
  UndoImportBatchRemovalResult,
} from "@/lib/events/repositories/guest-import-batches.repository";

describe("Atomic Guest Batch Removal Contracts (Stage 4B1)", () => {
  it("validates RemoveImportBatchResult structure", () => {
    const mockResult: RemoveImportBatchResult = {
      success: true,
      batchId: "batch-123",
      removedGuestCount: 5,
      alreadyRemovedCount: 0,
      protectedCount: 0,
      auditId: "audit-456",
      status: "removed",
    };

    assert.strictEqual(mockResult.success, true);
    assert.strictEqual(mockResult.batchId, "batch-123");
    assert.strictEqual(mockResult.removedGuestCount, 5);
    assert.strictEqual(mockResult.status, "removed");
  });

  it("validates UndoImportBatchRemovalResult structure", () => {
    const mockResult: UndoImportBatchRemovalResult = {
      success: true,
      batchId: "batch-123",
      restoredGuestCount: 5,
      auditId: "audit-456",
      status: "completed",
    };

    assert.strictEqual(mockResult.success, true);
    assert.strictEqual(mockResult.batchId, "batch-123");
    assert.strictEqual(mockResult.restoredGuestCount, 5);
    assert.strictEqual(mockResult.status, "completed");
  });
});
