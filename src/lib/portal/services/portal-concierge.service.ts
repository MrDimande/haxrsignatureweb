import * as clientsRepo from "@/lib/admin/repositories/clients.repository";
import { conciergeIntakeInputSchema, conciergeModuleDataSchema } from "@/lib/concierge/portal/schemas";
import { createConciergePortalRepositorySafe } from "@/lib/concierge/portal/create-concierge-portal-repository";
import { createConciergeStorageProvider } from "@/lib/concierge/portal/create-concierge-storage-provider";
import { loadConciergeModuleData } from "@/lib/concierge/portal/concierge-portal-data";
import { processConciergeIntake } from "@/lib/concierge/portal/concierge-intake";
import { archiveConciergeItem } from "@/lib/concierge/portal/concierge-actions";
import {
  assertUserCanPerformConciergeAction,
  ConciergeAuthError,
  type PortalConciergeActor,
} from "@/lib/concierge/portal/portal-concierge-auth";
import type {
  ConciergeIntakeInput,
  ConciergeModuleData,
  ConciergeServiceResult,
} from "@/lib/concierge/portal/types";
import * as eventsRepo from "@/lib/events/repositories/events.repository";
import { portalPath } from "@/lib/portal/portal-routes";
import type { Client } from "@/lib/admin/types";

export class PortalConciergeError extends Error {
  readonly code: "invalid_token" | "forbidden" | "not_found";

  constructor(code: "invalid_token" | "forbidden" | "not_found", message: string) {
    super(message);
    this.code = code;
    this.name = "PortalConciergeError";
  }
}

type PortalConciergeContext = {
  client: Client;
  actor: PortalConciergeActor;
};

async function resolvePortalConciergeContext(
  token: string,
  eventId: string
): Promise<PortalConciergeContext> {
  const client = await clientsRepo.getClientByPortalToken(token);
  if (!client) {
    throw new PortalConciergeError("invalid_token", "Link inválido.");
  }

  const events = await eventsRepo.listEventsByClientId(client.id);
  if (!events.some((event) => event.id === eventId)) {
    throw new PortalConciergeError("forbidden", "Evento não pertence a este cliente.");
  }

  const actor: PortalConciergeActor = {
    id: client.id,
    name: client.fullName,
    role: "client",
    eventIds: events.map((event) => event.id),
  };

  return { client, actor };
}

function toServiceError(error: unknown): ConciergeServiceResult<never> {
  if (error instanceof PortalConciergeError) {
    return {
      ok: false,
      error: error.code === "invalid_token" ? "not_found" : "forbidden",
      message: error.message,
    };
  }
  if (error instanceof ConciergeAuthError) {
    return { ok: false, error: error.code, message: error.message };
  }
  return {
    ok: false,
    error: "load_failed",
    message: "Não foi possível aceder ao Concierge.",
  };
}

async function loadValidatedForPortal(
  token: string,
  eventId: string,
  actor: PortalConciergeActor,
  repo: Awaited<ReturnType<typeof createConciergePortalRepositorySafe>>
): Promise<ConciergeServiceResult<ConciergeModuleData>> {
  const data = await loadConciergeModuleData(eventId, actor, repo);
  const parsed = conciergeModuleDataSchema.safeParse({
    ...data,
    dashboardHref: portalPath(token),
  });
  if (!parsed.success) {
    return { ok: false, error: "invalid_data", message: "Dados do Concierge inválidos." };
  }
  return { ok: true, data: parsed.data };
}

export async function getPortalConciergeData(
  token: string,
  eventId: string
): Promise<ConciergeServiceResult<ConciergeModuleData>> {
  try {
    const { actor } = await resolvePortalConciergeContext(token, eventId);
    assertUserCanPerformConciergeAction(actor, "item_view");
    const repo = await createConciergePortalRepositorySafe();
    return loadValidatedForPortal(token, eventId, actor, repo);
  } catch (error) {
    return toServiceError(error);
  }
}

export async function intakePortalConciergeItem(
  token: string,
  input: ConciergeIntakeInput,
  fileBuffer?: Buffer
): Promise<ConciergeServiceResult<ConciergeModuleData>> {
  const parsed = conciergeIntakeInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "validation_error", message: "Dados de entrada inválidos." };
  }

  try {
    const { actor } = await resolvePortalConciergeContext(token, parsed.data.eventId);
    assertUserCanPerformConciergeAction(actor, "intake_create");

    const repo = await createConciergePortalRepositorySafe();
    const storage = createConciergeStorageProvider();
    await processConciergeIntake(repo, storage, parsed.data, actor, fileBuffer);
    return loadValidatedForPortal(token, parsed.data.eventId, actor, repo);
  } catch (error) {
    if (error instanceof ConciergeAuthError) {
      return { ok: false, error: error.code, message: error.message };
    }
    if (error instanceof PortalConciergeError) {
      return toServiceError(error);
    }
    return { ok: false, error: "intake_failed", message: "Não foi possível registar o item." };
  }
}

export async function archivePortalConciergeItem(
  token: string,
  eventId: string,
  itemId: string
): Promise<ConciergeServiceResult<ConciergeModuleData>> {
  try {
    const { actor } = await resolvePortalConciergeContext(token, eventId);
    assertUserCanPerformConciergeAction(actor, "item_archive");

    const repo = await createConciergePortalRepositorySafe();
    await archiveConciergeItem(repo, eventId, itemId, actor);
    return loadValidatedForPortal(token, eventId, actor, repo);
  } catch (error) {
    if (error instanceof ConciergeAuthError) {
      return { ok: false, error: error.code, message: error.message };
    }
    return toServiceError(error);
  }
}

export async function listPortalConciergeEvents(token: string) {
  const client = await clientsRepo.getClientByPortalToken(token);
  if (!client) return null;
  return eventsRepo.listEventsByClientId(client.id);
}
