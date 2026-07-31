import type { GuestImportBatch } from "@/lib/events/types";

export type BatchActionVisibility = {
  showRemove: boolean;
  showUndo: boolean;
};

/** Visibility rules for destructive batch controls (Stage 4B2B2). */
export function getBatchActionVisibility(
  batch: Pick<GuestImportBatch, "status" | "latestReversibleRemoval">,
  options?: { hasRemoveHandler?: boolean; hasUndoHandler?: boolean }
): BatchActionVisibility {
  const hasRemoveHandler = options?.hasRemoveHandler ?? true;
  const hasUndoHandler = options?.hasUndoHandler ?? true;

  return {
    showRemove: batch.status === "completed" && hasRemoveHandler,
    showUndo:
      batch.status === "removed" &&
      Boolean(batch.latestReversibleRemoval) &&
      hasUndoHandler,
  };
}

export function mapSafeErrorMessage(rawError?: string): string {
  const err = (rawError || "").toLowerCase();
  if (
    err.includes("rsvp") ||
    err.includes("checkin") ||
    err.includes("check-in") ||
    err.includes("lugar") ||
    err.includes("seat") ||
    err.includes("convite") ||
    err.includes("protected") ||
    err.includes("confirme arquivo suave")
  ) {
    return "Este lote não pode ser removido porque um ou mais convidados já possuem RSVP, check-in, lugar atribuído ou convite enviado.";
  }
  if (err.includes("já foi removido") || err.includes("already removed")) {
    return "Este lote já foi removido.";
  }
  if (err.includes("já foi desfeita") || err.includes("already undone")) {
    return "Esta remoção já foi desfeita.";
  }
  if (err.includes("não encontrado") || err.includes("not found")) {
    return "Não foi possível encontrar o lote ou a operação solicitada.";
  }
  return "Não foi possível concluir a operação. Tente novamente.";
}

/** Synchronous in-flight guard used to block double-submit / repeated Enter. */
export function createInFlightGuard() {
  let locked = false;

  return {
    tryAcquire(): boolean {
      if (locked) return false;
      locked = true;
      return true;
    },
    release(): void {
      locked = false;
    },
    get isLocked() {
      return locked;
    },
  };
}

export type ModalAriaContract = {
  role: "dialog";
  ariaModal: true;
  titleId: string;
  descriptionId: string;
  escapeCloses: boolean;
  closeBlockedWhileSubmitting: boolean;
};

export function getModalAriaContract(input: {
  titleId: string;
  descriptionId: string;
  isSubmitting: boolean;
}): ModalAriaContract {
  return {
    role: "dialog",
    ariaModal: true,
    titleId: input.titleId,
    descriptionId: input.descriptionId,
    escapeCloses: !input.isSubmitting,
    closeBlockedWhileSubmitting: input.isSubmitting,
  };
}

export type ActionResultShape = {
  success: boolean;
  data?: unknown;
  error?: string;
};

/** Read success fields without assuming nested shapes like result.data.restored at call sites. */
export function readRemoveSuccessFields(result: ActionResultShape): {
  ok: boolean;
  auditId: string | null;
  message: string | null;
} {
  if (!result.success) {
    return { ok: false, auditId: null, message: null };
  }
  const data = (result.data ?? {}) as Record<string, unknown>;
  return {
    ok: true,
    auditId: typeof data.auditId === "string" ? data.auditId : null,
    message: typeof data.message === "string" ? data.message : null,
  };
}

export function readUndoSuccessFields(result: ActionResultShape): {
  ok: boolean;
  restored: number | null;
} {
  if (!result.success) {
    return { ok: false, restored: null };
  }
  const data = (result.data ?? {}) as Record<string, unknown>;
  return {
    ok: true,
    restored: typeof data.restored === "number" ? data.restored : null,
  };
}
