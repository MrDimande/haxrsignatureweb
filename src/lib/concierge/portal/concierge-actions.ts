import { createConciergeAIProvider } from "./create-concierge-ai-provider";
import { itemToProviderInput } from "./gemini-concierge-provider";
import { getAiEngineLabel } from "./concierge-portal-data";
import type { ConciergePortalRepository } from "./concierge-portal-repository";
import { routeConciergeItemToDestination } from "./concierge-routing";
import type { PortalConciergeActor } from "./portal-concierge-auth";
import type { ConciergeSuggestion } from "./types";

export async function classifyConciergeItemAction(
  repo: ConciergePortalRepository,
  eventId: string,
  itemId: string,
  actor: PortalConciergeActor
): Promise<void> {
  const item = await repo.getItem(itemId);
  if (!item) return;

  const provider = createConciergeAIProvider();
  const input = itemToProviderInput(item);
  let usedFallback = false;

  const classification = await provider.classify(input);
  classification.itemId = itemId;

  if (classification.provider === "rule_based" && (await import("./gemini-config")).isGeminiConfigured()) {
    usedFallback = true;
  }

  let extractedFields = { ...classification.extractedFields };
  try {
    const fields = await provider.extractFields(input);
    extractedFields = { ...extractedFields, ...fields };
    classification.extractedFields = extractedFields;
  } catch {
    // mantém campos da classificação
  }

  const suggestedActions = await provider.suggestActions(input, classification);
  classification.suggestedActions = suggestedActions;

  await repo.createClassification({
    itemId,
    classification,
  });

  await repo.updateItem(itemId, {
    type: classification.detectedType,
    status: "aguardando_validacao",
    suggestedDestination: classification.suggestedDestination,
    confidence: classification.confidence,
    classificationReason: classification.reason,
    extractedData: extractedFields,
  });

  const existingSuggestions = (await repo.listSuggestions(eventId)).filter(
    (s) => s.itemId === itemId
  );
  for (const s of existingSuggestions) {
    await repo.updateSuggestion(s.id, { status: "rejeitada" });
  }

  for (const action of suggestedActions) {
    await repo.createSuggestion({
      itemId,
      suggestion: {
        title: action.title,
        description: action.description,
        actionType: action.actionType as ConciergeSuggestion["actionType"],
        destination: action.destination,
        payload: extractedFields,
        confidence: classification.confidence,
      },
    });
  }

  const providerLabel = classification.provider === "gemini" ? getAiEngineLabel() : "Classificação assistida (regras)";

  await repo.createActivity({
    eventId,
    itemId,
    title: `${item.title} classificado`,
    description: usedFallback
      ? `${providerLabel} — fallback para regras após falha Gemini.`
      : `${providerLabel}: ${classification.reason}`,
    type: usedFallback ? "system" : "classification",
    actor: { id: actor.id, name: actor.name, role: actor.role },
  });
}

export async function validateConciergeItem(
  repo: ConciergePortalRepository,
  eventId: string,
  itemId: string,
  actor: PortalConciergeActor
): Promise<void> {
  const item = await repo.getItem(itemId);
  if (!item) return;

  await repo.validateItem(itemId);
  await repo.createActivity({
    eventId,
    itemId,
    title: "Classificação validada",
    description: `${item.title} — pronto para enviar ao módulo.`,
    type: "validation",
    actor: { id: actor.id, name: actor.name, role: actor.role },
  });
}

export async function sendConciergeItemToModule(
  repo: ConciergePortalRepository,
  eventId: string,
  itemId: string,
  actor: PortalConciergeActor
): Promise<void> {
  const item = await repo.getItem(itemId);
  if (!item?.suggestedDestination) return;

  const result = routeConciergeItemToDestination(item, item.suggestedDestination);
  if (!result.ok) return;

  await repo.markItemRouted(itemId, result.destination, result);
  await repo.createActivity({
    eventId,
    itemId,
    title: "Enviado para módulo",
    description: result.message,
    type: "routing",
    actor: { id: actor.id, name: actor.name, role: actor.role },
  });
}

export async function rejectConciergeItem(
  repo: ConciergePortalRepository,
  eventId: string,
  itemId: string,
  actor: PortalConciergeActor,
  reason?: string
): Promise<void> {
  await repo.rejectItem(itemId, reason);
  await repo.createActivity({
    eventId,
    itemId,
    title: "Item rejeitado",
    description: reason ?? "O item foi marcado como rejeitado.",
    type: "rejection",
    actor: { id: actor.id, name: actor.name, role: actor.role },
  });
}

export async function archiveConciergeItem(
  repo: ConciergePortalRepository,
  eventId: string,
  itemId: string,
  actor: PortalConciergeActor
): Promise<void> {
  await repo.archiveItem(itemId);
  await repo.createActivity({
    eventId,
    itemId,
    title: "Item arquivado",
    description: "O item foi movido para arquivo.",
    type: "archive",
    actor: { id: actor.id, name: actor.name, role: actor.role },
  });
}

export async function applyConciergeSuggestion(
  repo: ConciergePortalRepository,
  eventId: string,
  suggestionId: string,
  actor: PortalConciergeActor
): Promise<void> {
  const suggestions = await repo.listSuggestions(eventId);
  const suggestion = suggestions.find((s) => s.id === suggestionId);
  if (!suggestion) return;

  await repo.updateSuggestion(suggestionId, { status: "aplicada" });
  await repo.createActivity({
    eventId,
    itemId: suggestion.itemId,
    title: "Sugestão aplicada",
    description: suggestion.title,
    type: "routing",
    actor: { id: actor.id, name: actor.name, role: actor.role },
  });

  await sendConciergeItemToModule(repo, eventId, suggestion.itemId, actor);
}
