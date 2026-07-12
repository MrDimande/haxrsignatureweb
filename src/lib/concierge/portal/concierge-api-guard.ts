import { ConciergeAuthError, getCurrentPortalActor, assertUserCanAccessEvent } from "./portal-concierge-auth";
import type { PortalConciergeAction, PortalConciergeActor } from "./portal-concierge-auth";
import { createConciergePortalRepository } from "./create-concierge-portal-repository";
import { createConciergeStorageProvider } from "./create-concierge-storage-provider";
import type { ConciergePortalRepository } from "./concierge-portal-repository";
import type { ConciergeStorageProvider } from "./concierge-storage-provider";

export interface ConciergeApiContext {
  actor: PortalConciergeActor;
  repo: ConciergePortalRepository;
  storage: ConciergeStorageProvider;
  eventId: string;
}

export async function resolveConciergeApiContext(
  request: Request,
  eventId: string,
  action?: PortalConciergeAction
): Promise<ConciergeApiContext> {
  const actor = await getCurrentPortalActor(request);
  assertUserCanAccessEvent(actor, eventId);

  if (action) {
    const { assertUserCanPerformConciergeAction } = await import("./portal-concierge-auth");
    assertUserCanPerformConciergeAction(actor, action);
  }

  return {
    actor,
    repo: createConciergePortalRepository(),
    storage: createConciergeStorageProvider(),
    eventId,
  };
}

export function conciergeAuthErrorResponse(error: unknown): Response {
  if (error instanceof ConciergeAuthError) {
    const status = error.code === "unauthorized" ? 401 : 403;
    return Response.json(
      { ok: false, error: error.code, message: error.message },
      { status }
    );
  }
  return Response.json(
    { ok: false, error: "internal_error", message: "Erro interno." },
    { status: 500 }
  );
}
