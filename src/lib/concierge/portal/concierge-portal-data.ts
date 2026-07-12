import {
  CONCIERGE_INBOUND_EMAIL,
  DEFAULT_CONCIERGE_ALLOWED_ACTIONS,
  buildConciergeStats,
  createInitialConciergeModuleData,
} from "./mock-concierge-data";
import type { ConciergePortalRepository } from "./concierge-portal-repository";
import { createConciergePortalRepositorySafe } from "./create-concierge-portal-repository";
import { isConciergeStorageActive } from "./create-concierge-storage-provider";
import { isGeminiConfigured } from "./gemini-config";
import {
  canPerformAction,
  type PortalConciergeActor,
} from "./portal-concierge-auth";
import type { ConciergeModuleData, ConciergeWorkspaceMeta } from "./types";

function buildWorkspaceMeta(
  repo: ConciergePortalRepository,
  actor: PortalConciergeActor
): ConciergeWorkspaceMeta {
  const persistenceMode = repo.mode;
  const storageActive = isConciergeStorageActive();

  return {
    persistenceMode,
    storageMode: storageActive ? "supabase" : "metadata_only",
    persistenceLabel:
      persistenceMode === "supabase" ? "Guardado no workspace" : "Modo local",
    storageLabel: storageActive
      ? "Armazenamento activo"
      : "Armazenamento permanente em preparação",
    actorRole: actor.role,
    permissions: {
      canClassify: canPerformAction(actor, "item_classify"),
      canValidate: canPerformAction(actor, "item_validate"),
      canRoute: canPerformAction(actor, "item_route"),
      canReject: canPerformAction(actor, "item_reject"),
      canArchive: canPerformAction(actor, "item_archive"),
      canApplySuggestions: canPerformAction(actor, "suggestion_apply"),
      showConfidence: canPerformAction(actor, "view_confidence"),
      showActivity: canPerformAction(actor, "view_activity"),
    },
  };
}

export async function loadConciergeModuleData(
  eventId: string,
  actor: PortalConciergeActor,
  repo?: ConciergePortalRepository
): Promise<ConciergeModuleData> {
  const repository = repo ?? (await createConciergePortalRepositorySafe());
  const shell = createInitialConciergeModuleData(eventId);

  const [inboxItems, classifications, suggestions, activities] = await Promise.all([
    repository.listItems(eventId),
    repository.listClassifications(eventId),
    repository.listSuggestions(eventId),
    repository.listActivities(eventId),
  ]);

  const workspaceMeta = buildWorkspaceMeta(repository, actor);

  return {
    eventOverview: shell.eventOverview,
    stats: buildConciergeStats(inboxItems),
    inboxItems,
    classifications: workspaceMeta.permissions.showConfidence
      ? classifications
      : classifications.map((c) => ({ ...c, confidence: 0 })),
    suggestions,
    activities: workspaceMeta.permissions.showActivity ? activities : activities.slice(0, 3),
    allowedActions: [...DEFAULT_CONCIERGE_ALLOWED_ACTIONS],
    inboundEmailAddress: CONCIERGE_INBOUND_EMAIL,
    dashboardHref: "/app/dashboard",
    workspaceMeta,
  };
}

export function getAiEngineLabel(): string {
  return isGeminiConfigured() ? "Classificação assistida (Gemini)" : "Classificação assistida (regras)";
}
