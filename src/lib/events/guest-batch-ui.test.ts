import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mapSafeErrorMessage } from "@/components/events/GuestBatchDashboard";
import type { GuestImportBatch } from "@/lib/events/types";

describe("Guest Batch Removal & Undo UI Contracts (Stage 4B2B2)", () => {
  describe("Control Visibility Rules", () => {
    it("completed status allows remove button and hides undo button", () => {
      const batch: GuestImportBatch = {
        id: "batch-1",
        eventId: "event-123",
        filename: "guests.csv",
        operatorEmail: "admin@test.com",
        operatorUserId: "op-1",
        createdAt: "2026-07-28T00:00:00Z",
        updatedAt: "2026-07-28T00:00:00Z",
        totalRows: 10,
        validRows: 10,
        invalidRows: 0,
        duplicateRows: 0,
        removedRows: 0,
        status: "completed",
        latestReversibleRemoval: null,
      };

      const canRemove = batch.status === "completed";
      const canUndo = batch.status === "removed" && Boolean(batch.latestReversibleRemoval);

      assert.strictEqual(canRemove, true);
      assert.strictEqual(canUndo, false);
    });

    it("removed status with reversible audit hides remove button and shows undo button", () => {
      const batch: GuestImportBatch = {
        id: "batch-2",
        eventId: "event-123",
        filename: "guests.csv",
        operatorEmail: "admin@test.com",
        operatorUserId: "op-1",
        createdAt: "2026-07-28T00:00:00Z",
        updatedAt: "2026-07-28T00:00:00Z",
        totalRows: 10,
        validRows: 10,
        invalidRows: 0,
        duplicateRows: 0,
        removedRows: 10,
        status: "removed",
        latestReversibleRemoval: {
          auditId: "audit-999",
          createdAt: "2026-07-28T01:00:00Z",
        },
      };

      const canRemove = batch.status === "completed";
      const canUndo = batch.status === "removed" && Boolean(batch.latestReversibleRemoval);

      assert.strictEqual(canRemove, false);
      assert.strictEqual(canUndo, true);
    });

    it("removed status without reversible audit hides both action buttons", () => {
      const batch: GuestImportBatch = {
        id: "batch-3",
        eventId: "event-123",
        filename: "guests.csv",
        operatorEmail: "admin@test.com",
        operatorUserId: "op-1",
        createdAt: "2026-07-28T00:00:00Z",
        updatedAt: "2026-07-28T00:00:00Z",
        totalRows: 10,
        validRows: 10,
        invalidRows: 0,
        duplicateRows: 0,
        removedRows: 10,
        status: "removed",
        latestReversibleRemoval: null,
      };

      const canRemove = batch.status === "completed";
      const canUndo = batch.status === "removed" && Boolean(batch.latestReversibleRemoval);

      assert.strictEqual(canRemove, false);
      assert.strictEqual(canUndo, false);
    });
  });

  describe("Safe Error Message Mapping", () => {
    it("maps protected dependencies errors safely without leaking DB or UUID info", () => {
      const rawError = "PostgreSQL RPC error: Protected guests found with RSVP/checkin for batch 1251bc6e-fac7-46cd";
      const mapped = mapSafeErrorMessage(rawError);

      assert.strictEqual(
        mapped,
        "Este lote não pode ser removido porque um ou mais convidados já possuem RSVP, check-in, lugar atribuído ou convite enviado."
      );
    });

    it("maps already removed errors safely", () => {
      const rawError = "Batch batch-123 already removed";
      const mapped = mapSafeErrorMessage(rawError);

      assert.strictEqual(mapped, "Este lote já foi removido.");
    });

    it("maps already undone errors safely", () => {
      const rawError = "Esta acção já foi desfeita";
      const mapped = mapSafeErrorMessage(rawError);

      assert.strictEqual(mapped, "Esta remoção já foi desfeita.");
    });

    it("maps not found errors safely", () => {
      const rawError = "Registo de auditoria não encontrado.";
      const mapped = mapSafeErrorMessage(rawError);

      assert.strictEqual(mapped, "Não foi possível encontrar o lote ou a operação solicitada.");
    });

    it("maps unexpected system/database errors to standard fallback", () => {
      const rawError = "FATAL: connection pool exhausted at query 0x889F";
      const mapped = mapSafeErrorMessage(rawError);

      assert.strictEqual(mapped, "Não foi possível concluir a operação. Tente novamente.");
    });
  });

  describe("Reversible Audit Data Scoping", () => {
    it("ensures latestReversibleRemoval payload does NOT expose undo_payload to client", () => {
      const clientBatch: GuestImportBatch = {
        id: "b-1",
        eventId: "e-1",
        filename: "test.csv",
        operatorEmail: "op@test.com",
        operatorUserId: "op-1",
        createdAt: "2026-07-28T00:00:00Z",
        updatedAt: "2026-07-28T00:00:00Z",
        totalRows: 5,
        validRows: 5,
        invalidRows: 0,
        duplicateRows: 0,
        removedRows: 5,
        status: "removed",
        latestReversibleRemoval: {
          auditId: "audit-777",
          createdAt: "2026-07-28T00:05:00Z",
        },
      };

      assert.deepStrictEqual(Object.keys(clientBatch.latestReversibleRemoval!), ["auditId", "createdAt"]);
      assert.strictEqual((clientBatch.latestReversibleRemoval as Record<string, unknown>).undo_payload, undefined);
    });
  });
});
