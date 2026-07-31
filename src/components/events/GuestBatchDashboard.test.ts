import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { GuestImportBatch } from "@/lib/events/types";

const mockBatches: GuestImportBatch[] = [
  {
    id: "batch-1",
    eventId: "event-1",
    filename: "lista_convidados_vip.csv",
    createdAt: "2026-07-26T18:42:00.000Z",
    updatedAt: "2026-07-26T18:42:00.000Z",
    operatorUserId: "user-1",
    operatorEmail: "operador@haxrsignature.com",
    totalRows: 50,
    validRows: 45,
    duplicateRows: 3,
    invalidRows: 2,
    removedRows: 0,
    status: "completed",
  },
  {
    id: "batch-2",
    eventId: "event-1",
    filename: "lote_antigo.csv",
    createdAt: "2026-07-25T10:00:00.000Z",
    updatedAt: "2026-07-25T11:00:00.000Z",
    operatorUserId: "user-1",
    operatorEmail: "operador@haxrsignature.com",
    totalRows: 20,
    validRows: 20,
    duplicateRows: 0,
    invalidRows: 0,
    removedRows: 20,
    status: "removed",
  },
];

describe("GuestBatchDashboard data structures", () => {
  it("sorts batches by createdAt descending", () => {
    const sorted = [...mockBatches].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    assert.strictEqual(sorted[0].id, "batch-1");
    assert.strictEqual(sorted[1].id, "batch-2");
  });

  it("correctly identifies batch statuses and counts", () => {
    const completed = mockBatches.find((b) => b.status === "completed");
    assert.ok(completed);
    assert.strictEqual(completed.totalRows, 50);
    assert.strictEqual(completed.validRows, 45);

    const removed = mockBatches.find((b) => b.status === "removed");
    assert.ok(removed);
    assert.strictEqual(removed.removedRows, 20);
  });
});
