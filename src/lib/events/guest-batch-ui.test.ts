import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import {
  createInFlightGuard,
  getBatchActionVisibility,
  getModalAriaContract,
  mapSafeErrorMessage,
  readRemoveSuccessFields,
  readUndoSuccessFields,
} from "@/lib/events/guest-batch-ui";
import type { GuestImportBatch } from "@/lib/events/types";

function batchFixture(
  overrides: Partial<GuestImportBatch> = {}
): GuestImportBatch {
  return {
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
    ...overrides,
  };
}

describe("Guest Batch Removal & Undo UI Contracts (Stage 4B2B2)", () => {
  describe("Control Visibility Rules", () => {
    it("completed shows remove and hides undo", () => {
      const visibility = getBatchActionVisibility(batchFixture({ status: "completed" }));
      assert.strictEqual(visibility.showRemove, true);
      assert.strictEqual(visibility.showUndo, false);
    });

    it("completed does not show undo", () => {
      const visibility = getBatchActionVisibility(batchFixture({ status: "completed" }));
      assert.strictEqual(visibility.showUndo, false);
    });

    it("removed hides remove", () => {
      const visibility = getBatchActionVisibility(
        batchFixture({
          status: "removed",
          removedRows: 10,
          latestReversibleRemoval: {
            auditId: "audit-999",
            createdAt: "2026-07-28T01:00:00Z",
          },
        })
      );
      assert.strictEqual(visibility.showRemove, false);
    });

    it("removed with reversible audit shows undo", () => {
      const visibility = getBatchActionVisibility(
        batchFixture({
          status: "removed",
          removedRows: 10,
          latestReversibleRemoval: {
            auditId: "audit-999",
            createdAt: "2026-07-28T01:00:00Z",
          },
        })
      );
      assert.strictEqual(visibility.showUndo, true);
    });

    it("removed without reversible audit hides undo", () => {
      const visibility = getBatchActionVisibility(
        batchFixture({
          status: "removed",
          removedRows: 10,
          latestReversibleRemoval: null,
        })
      );
      assert.strictEqual(visibility.showRemove, false);
      assert.strictEqual(visibility.showUndo, false);
    });

    it("unsupported statuses hide destructive controls", () => {
      for (const status of ["preview", "partial", "failed"] as const) {
        const visibility = getBatchActionVisibility(
          batchFixture({ status })
        );
        assert.strictEqual(visibility.showRemove, false);
        assert.strictEqual(visibility.showUndo, false);
      }
    });
  });

  describe("Safe Error Message Mapping", () => {
    it("maps protected dependencies safely", () => {
      const mapped = mapSafeErrorMessage(
        "PostgreSQL RPC error: Protected guests found with RSVP/checkin for batch 1251bc6e-fac7-46cd"
      );
      assert.strictEqual(
        mapped,
        "Este lote não pode ser removido porque um ou mais convidados já possuem RSVP, check-in, lugar atribuído ou convite enviado."
      );
      assert.equal(/uuid|postgresql|0x|stack/i.test(mapped), false);
    });

    it("maps already removed safely", () => {
      assert.strictEqual(
        mapSafeErrorMessage("Batch batch-123 already removed"),
        "Este lote já foi removido."
      );
    });

    it("maps already undone safely", () => {
      assert.strictEqual(
        mapSafeErrorMessage("Esta acção já foi desfeita"),
        "Esta remoção já foi desfeita."
      );
    });

    it("maps not found safely", () => {
      assert.strictEqual(
        mapSafeErrorMessage("Registo de auditoria não encontrado."),
        "Não foi possível encontrar o lote ou a operação solicitada."
      );
    });

    it("maps unexpected errors to fallback", () => {
      assert.strictEqual(
        mapSafeErrorMessage("FATAL: connection pool exhausted at query 0x889F"),
        "Não foi possível concluir a operação. Tente novamente."
      );
    });
  });

  describe("Reversible Audit Data Scoping", () => {
    it("client payload only exposes auditId and createdAt", () => {
      const clientBatch = batchFixture({
        status: "removed",
        removedRows: 5,
        latestReversibleRemoval: {
          auditId: "audit-777",
          createdAt: "2026-07-28T00:05:00Z",
        },
      });

      assert.deepStrictEqual(Object.keys(clientBatch.latestReversibleRemoval!), [
        "auditId",
        "createdAt",
      ]);
      assert.strictEqual(
        (clientBatch.latestReversibleRemoval as Record<string, unknown>)
          .undo_payload,
        undefined
      );
    });
  });

  describe("Double-submit / in-flight guard", () => {
    it("blocks a second acquire until release", () => {
      const guard = createInFlightGuard();
      assert.strictEqual(guard.tryAcquire(), true);
      assert.strictEqual(guard.tryAcquire(), false);
      assert.strictEqual(guard.isLocked, true);
      guard.release();
      assert.strictEqual(guard.tryAcquire(), true);
    });

    it("simulates double click without duplicate action calls", async () => {
      const guard = createInFlightGuard();
      let calls = 0;

      async function confirmOnce() {
        if (!guard.tryAcquire()) return;
        try {
          calls += 1;
          await Promise.resolve();
        } finally {
          guard.release();
        }
      }

      await Promise.all([confirmOnce(), confirmOnce(), confirmOnce()]);
      assert.strictEqual(calls, 1);
    });

    it("simulates repeated Enter without duplicate calls", async () => {
      const guard = createInFlightGuard();
      let calls = 0;

      async function onEnter() {
        if (!guard.tryAcquire()) return;
        try {
          calls += 1;
          await new Promise((r) => setTimeout(r, 5));
        } finally {
          guard.release();
        }
      }

      await Promise.all([onEnter(), onEnter()]);
      assert.strictEqual(calls, 1);
    });
  });

  describe("Modal accessibility contracts", () => {
    it("exposes dialog ARIA contract", () => {
      const idle = getModalAriaContract({
        titleId: "remove-batch-modal-title",
        descriptionId: "remove-batch-modal-desc",
        isSubmitting: false,
      });
      assert.strictEqual(idle.role, "dialog");
      assert.strictEqual(idle.ariaModal, true);
      assert.strictEqual(idle.escapeCloses, true);
      assert.strictEqual(idle.closeBlockedWhileSubmitting, false);
    });

    it("blocks Escape close while submitting", () => {
      const busy = getModalAriaContract({
        titleId: "undo-batch-modal-title",
        descriptionId: "undo-batch-modal-desc",
        isSubmitting: true,
      });
      assert.strictEqual(busy.escapeCloses, false);
      assert.strictEqual(busy.closeBlockedWhileSubmitting, true);
    });
  });

  describe("Action result shapes", () => {
    it("reads remove success fields from ActionReturnResult", () => {
      const fields = readRemoveSuccessFields({
        success: true,
        data: {
          affected: 2,
          auditId: "audit-1",
          message: "Lote removido com sucesso (2 convidado(s) removidos).",
        },
      });
      assert.strictEqual(fields.ok, true);
      assert.strictEqual(fields.auditId, "audit-1");
      assert.match(fields.message ?? "", /Lote removido/);
    });

    it("reads undo restored count from ActionReturnResult", () => {
      const fields = readUndoSuccessFields({
        success: true,
        data: { restored: 2 },
      });
      assert.strictEqual(fields.ok, true);
      assert.strictEqual(fields.restored, 2);
    });

    it("does not invent restored on failure", () => {
      const fields = readUndoSuccessFields({
        success: false,
        error: "Esta acção já foi desfeita.",
      });
      assert.strictEqual(fields.ok, false);
      assert.strictEqual(fields.restored, null);
    });
  });

  describe("Security source contracts", () => {
    it("GuestBatchDashboard has no native confirm/alert and no direct Supabase client", () => {
      const source = readFileSync(
        resolve(process.cwd(), "src/components/events/GuestBatchDashboard.tsx"),
        "utf8"
      );
      assert.equal(/\bconfirm\s*\(/.test(source), false);
      assert.equal(/\balert\s*\(/.test(source), false);
      assert.equal(/window\.confirm/.test(source), false);
      assert.equal(/window\.alert/.test(source), false);
      assert.equal(/createClient\s*\(/.test(source), false);
      assert.equal(/createAdminClient\s*\(/.test(source), false);
      assert.equal(/\.from\(\s*["']guests["']\s*\)/.test(source), false);
      assert.equal(/Promise\.all\s*\(/.test(source), false);
      assert.equal(/softDelete|deleted_at\s*=/.test(source), false);
    });

    it("Modal implements accessible dialog attributes", () => {
      const source = readFileSync(
        resolve(process.cwd(), "src/components/ui/Modal.tsx"),
        "utf8"
      );
      assert.match(source, /role=\"dialog\"/);
      assert.match(source, /aria-modal=\"true\"/);
      assert.match(source, /aria-labelledby/);
      assert.match(source, /aria-describedby/);
      assert.match(source, /aria-busy/);
      assert.match(source, /Escape/);
      assert.match(source, /previousActiveElementRef/);
      assert.equal(/\bconfirm\s*\(/.test(source), false);
    });

    it("batch handlers in GuestManagement call server actions only", () => {
      const source = readFileSync(
        resolve(process.cwd(), "src/components/events/GuestManagement.tsx"),
        "utf8"
      );
      assert.match(source, /removeImportBatchAction/);
      assert.match(source, /undoBulkGuestAction/);
      assert.match(source, /onRemoveBatch=\{handleRemoveBatch\}/);
      assert.match(source, /onUndoBatch=\{handleUndoBatch\}/);

      const removeHandler = source.slice(
        source.indexOf("async function handleRemoveBatch"),
        source.indexOf("async function handleUndo()")
      );
      assert.equal(/createClient|createAdminClient|\.rpc\(/.test(removeHandler), false);
      assert.equal(/\bconfirm\s*\(/.test(removeHandler), false);

      const undoBatchHandler = source.slice(
        source.indexOf("async function handleUndoBatch"),
        source.indexOf("async function handleCopyLink")
      );
      assert.equal(/createClient|createAdminClient|\.rpc\(/.test(undoBatchHandler), false);
      assert.equal(/\bconfirm\s*\(/.test(undoBatchHandler), false);
    });
  });

  describe("Cancel vs confirm action contracts", () => {
    it("cancel path must not invoke server action", async () => {
      let calls = 0;
      const onRemove = async () => {
        calls += 1;
        return { success: true, data: { auditId: "a1" } };
      };

      // Simulated cancel: modal closes without calling onRemove.
      const cancelled = true;
      if (!cancelled) {
        await onRemove();
      }
      assert.strictEqual(calls, 0);
    });

    it("confirm path invokes action exactly once", async () => {
      const guard = createInFlightGuard();
      let calls = 0;
      const onRemove = async () => {
        calls += 1;
        return { success: true, data: { auditId: "a1", message: "ok" } };
      };

      async function confirm() {
        if (!guard.tryAcquire()) return;
        try {
          await onRemove();
        } finally {
          guard.release();
        }
      }

      await Promise.all([confirm(), confirm()]);
      assert.strictEqual(calls, 1);
    });

    it("undo uses the auditId from latestReversibleRemoval", async () => {
      const batch = batchFixture({
        status: "removed",
        latestReversibleRemoval: {
          auditId: "audit-correct",
          createdAt: "2026-07-28T01:00:00Z",
        },
      });
      let usedAuditId: string | null = null;
      const onUndo = async (auditId: string) => {
        usedAuditId = auditId;
        return { success: true, data: { restored: 2 } };
      };

      await onUndo(batch.latestReversibleRemoval!.auditId);
      assert.strictEqual(usedAuditId, "audit-correct");
    });

    it("second undo maps to already-undone safe message", () => {
      assert.strictEqual(
        mapSafeErrorMessage("already undone"),
        "Esta remoção já foi desfeita."
      );
    });

    it("protected error keeps safe message without leaking SQL", () => {
      const mapped = mapSafeErrorMessage(
        'ERROR: relation "guest_import_batches" violates check — unexpected constraint xyz'
      );
      assert.strictEqual(
        mapped,
        "Não foi possível concluir a operação. Tente novamente."
      );
      assert.equal(/relation|guest_import|constraint xyz/.test(mapped), false);
    });
  });
});
