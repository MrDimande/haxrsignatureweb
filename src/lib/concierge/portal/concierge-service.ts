import { conciergeIntakeInputSchema, conciergeModuleDataSchema } from "./schemas";
import { createConciergePortalRepositorySafe } from "./create-concierge-portal-repository";
import { createConciergeStorageProvider } from "./create-concierge-storage-provider";
import { loadConciergeModuleData } from "./concierge-portal-data";
import { processConciergeIntake } from "./concierge-intake";
import {
  applyConciergeSuggestion,
  archiveConciergeItem,
  classifyConciergeItemAction,
  rejectConciergeItem,
  sendConciergeItemToModule,
  validateConciergeItem,
} from "./concierge-actions";
import {
  ConciergeAuthError,
  getCurrentPortalActor,
  assertUserCanAccessEvent,
  assertUserCanPerformConciergeAction,
} from "./portal-concierge-auth";
import type {
  ConciergeIntakeInput,
  ConciergeModuleData,
  ConciergeServiceResult,
} from "./types";

// TODO: auth/session protection — parcial via portal-concierge-auth stubs
// TODO: event ownership validation — parcial via assertUserCanAccessEvent
// TODO: upload authorization
// TODO: audit logs persistentes em Supabase
// TODO: role-based permissions — parcial via workspaceMeta.permissions

async function withActor<T>(
  eventId: string,
  action: import("./portal-concierge-auth").PortalConciergeAction | undefined,
  fn: (ctx: {
    actor: Awaited<ReturnType<typeof getCurrentPortalActor>>;
    repo: Awaited<ReturnType<typeof createConciergePortalRepositorySafe>>;
    storage: ReturnType<typeof createConciergeStorageProvider>;
  }) => Promise<T>
): Promise<T> {
  const actor = await getCurrentPortalActor();
  assertUserCanAccessEvent(actor, eventId);
  if (action) assertUserCanPerformConciergeAction(actor, action);
  const repo = await createConciergePortalRepositorySafe();
  const storage = createConciergeStorageProvider();
  return fn({ actor, repo, storage });
}

async function loadValidated(
  eventId: string,
  actor: Awaited<ReturnType<typeof getCurrentPortalActor>>,
  repo: Awaited<ReturnType<typeof createConciergePortalRepositorySafe>>
): Promise<ConciergeServiceResult<ConciergeModuleData>> {
  const data = await loadConciergeModuleData(eventId, actor, repo);
  const parsed = conciergeModuleDataSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: "invalid_data", message: "Dados do Concierge inválidos." };
  }
  return { ok: true, data: parsed.data };
}

export async function getConciergeData(
  eventId: string
): Promise<ConciergeServiceResult<ConciergeModuleData>> {
  try {
    return await withActor(eventId, "item_view", ({ actor, repo }) =>
      loadValidated(eventId, actor, repo)
    );
  } catch (error) {
    if (error instanceof ConciergeAuthError) {
      return { ok: false, error: error.code, message: error.message };
    }
    return {
      ok: false,
      error: "load_failed",
      message: "Não foi possível carregar o HAXR Concierge.",
    };
  }
}

export async function getConciergeItem(
  eventId: string,
  itemId: string
): Promise<ConciergeServiceResult<ConciergeModuleData["inboxItems"][number]>> {
  const result = await getConciergeData(eventId);
  if (!result.ok) return result;
  const item = result.data.inboxItems.find((i) => i.id === itemId);
  if (!item) {
    return { ok: false, error: "not_found", message: "Item não encontrado." };
  }
  return { ok: true, data: item };
}

export async function intakeConciergeItem(
  input: ConciergeIntakeInput,
  fileBuffer?: Buffer
): Promise<ConciergeServiceResult<ConciergeModuleData>> {
  const parsed = conciergeIntakeInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "validation_error", message: "Dados de entrada inválidos." };
  }

  try {
    return await withActor(parsed.data.eventId, "intake_create", async ({ actor, repo, storage }) => {
      await processConciergeIntake(repo, storage, parsed.data, actor, fileBuffer);
      return loadValidated(parsed.data.eventId, actor, repo);
    });
  } catch (error) {
    if (error instanceof ConciergeAuthError) {
      return { ok: false, error: error.code, message: error.message };
    }
    return { ok: false, error: "intake_failed", message: "Não foi possível registar o item." };
  }
}

export async function classifyItem(
  eventId: string,
  itemId: string
): Promise<ConciergeServiceResult<ConciergeModuleData>> {
  try {
    return await withActor(eventId, "item_classify", async ({ actor, repo }) => {
      await classifyConciergeItemAction(repo, eventId, itemId, actor);
      return loadValidated(eventId, actor, repo);
    });
  } catch (error) {
    if (error instanceof ConciergeAuthError) {
      return { ok: false, error: error.code, message: error.message };
    }
    return { ok: false, error: "classify_failed", message: "Classificação falhou." };
  }
}

export async function validateItem(
  eventId: string,
  itemId: string
): Promise<ConciergeServiceResult<ConciergeModuleData>> {
  try {
    return await withActor(eventId, "item_validate", async ({ actor, repo }) => {
      await validateConciergeItem(repo, eventId, itemId, actor);
      return loadValidated(eventId, actor, repo);
    });
  } catch (error) {
    if (error instanceof ConciergeAuthError) {
      return { ok: false, error: error.code, message: error.message };
    }
    return { ok: false, error: "validate_failed", message: "Validação falhou." };
  }
}

export async function routeItem(
  eventId: string,
  itemId: string
): Promise<ConciergeServiceResult<ConciergeModuleData>> {
  try {
    return await withActor(eventId, "item_route", async ({ actor, repo }) => {
      await sendConciergeItemToModule(repo, eventId, itemId, actor);
      return loadValidated(eventId, actor, repo);
    });
  } catch (error) {
    if (error instanceof ConciergeAuthError) {
      return { ok: false, error: error.code, message: error.message };
    }
    return { ok: false, error: "route_failed", message: "Envio para módulo falhou." };
  }
}

export async function rejectItem(
  eventId: string,
  itemId: string,
  reason?: string
): Promise<ConciergeServiceResult<ConciergeModuleData>> {
  try {
    return await withActor(eventId, "item_reject", async ({ actor, repo }) => {
      await rejectConciergeItem(repo, eventId, itemId, actor, reason);
      return loadValidated(eventId, actor, repo);
    });
  } catch (error) {
    if (error instanceof ConciergeAuthError) {
      return { ok: false, error: error.code, message: error.message };
    }
    return { ok: false, error: "reject_failed", message: "Rejeição falhou." };
  }
}

export async function archiveItem(
  eventId: string,
  itemId: string
): Promise<ConciergeServiceResult<ConciergeModuleData>> {
  try {
    return await withActor(eventId, "item_archive", async ({ actor, repo }) => {
      await archiveConciergeItem(repo, eventId, itemId, actor);
      return loadValidated(eventId, actor, repo);
    });
  } catch (error) {
    if (error instanceof ConciergeAuthError) {
      return { ok: false, error: error.code, message: error.message };
    }
    return { ok: false, error: "archive_failed", message: "Arquivo falhou." };
  }
}

export async function applySuggestion(
  eventId: string,
  suggestionId: string
): Promise<ConciergeServiceResult<ConciergeModuleData>> {
  try {
    return await withActor(eventId, "suggestion_apply", async ({ actor, repo }) => {
      await applyConciergeSuggestion(repo, eventId, suggestionId, actor);
      return loadValidated(eventId, actor, repo);
    });
  } catch (error) {
    if (error instanceof ConciergeAuthError) {
      return { ok: false, error: error.code, message: error.message };
    }
    return { ok: false, error: "apply_failed", message: "Aplicação da sugestão falhou." };
  }
}
