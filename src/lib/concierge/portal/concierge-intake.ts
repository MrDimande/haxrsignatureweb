import { buildConciergeDetectionMessage } from "@/lib/portal/services/concierge-detection-messages";
import { createConciergeAIProvider } from "./create-concierge-ai-provider";
import type { ConciergePortalRepository } from "./concierge-portal-repository";
import type { ConciergeStorageProvider } from "./concierge-storage-provider";
import type { PortalConciergeActor } from "./portal-concierge-auth";
import type { ConciergeIntakeInput, ConciergeSuggestion } from "./types";

export async function processConciergeIntake(
  repo: ConciergePortalRepository,
  storage: ConciergeStorageProvider,
  input: ConciergeIntakeInput,
  actor: PortalConciergeActor,
  fileBuffer?: Buffer
): Promise<string> {
  const provider = createConciergeAIProvider();

  const classification = await provider.classify({
    title: input.title,
    description: input.description ?? input.manualText,
    fileName: input.file?.fileName,
    mimeType: input.file?.mimeType,
    extractedText: input.manualText ?? input.description,
    clippedUrl: input.url,
    clippedTitle: input.clippedTitle,
    emailSubject: input.email?.subject,
    emailSender: input.email?.from,
    source: input.source,
  });

  let storagePath: string | undefined;
  let fileUrl: string | undefined;

  const item = await repo.createItem({
    ...input,
    type: classification.detectedType,
    status: "aguardando_validacao",
    uploadedBy: actor.name,
    confidence: classification.confidence,
    suggestedDestination: input.suggestedDestination ?? classification.suggestedDestination,
    classificationReason: classification.reason,
    extractedText: input.manualText ?? input.description,
    storagePath,
    fileUrl,
  });

  if (fileBuffer && input.file?.fileName && input.file.mimeType) {
    try {
      const uploaded = await storage.uploadFile({
        eventId: input.eventId,
        itemId: item.id,
        fileName: input.file.fileName,
        mimeType: input.file.mimeType,
        buffer: fileBuffer,
      });
      storagePath = uploaded.storagePath;
      const signed = await storage.getSignedUrl(storagePath);
      fileUrl = signed ?? undefined;
      await repo.updateItem(item.id, { storagePath, fileUrl });
    } catch {
      await repo.createActivity({
        eventId: input.eventId,
        itemId: item.id,
        title: "Ficheiro registado (metadados)",
        description:
          "Armazenamento permanente em preparação — apenas metadados guardados.",
        type: "system",
        actor: { id: actor.id, name: actor.name, role: actor.role },
      });
    }
  }

  const fullClassification = { ...classification, itemId: item.id };
  await repo.createClassification({ itemId: item.id, classification: fullClassification });

  const suggestedActions = await provider.suggestActions(
    {
      title: input.title,
      description: input.description ?? input.manualText,
      fileName: input.file?.fileName,
      mimeType: input.file?.mimeType,
      extractedText: input.manualText ?? input.description,
      clippedUrl: input.url,
      clippedTitle: input.clippedTitle,
      emailSubject: input.email?.subject,
      emailSender: input.email?.from,
      source: input.source,
    },
    fullClassification
  );

  for (const action of suggestedActions) {
    await repo.createSuggestion({
      itemId: item.id,
      suggestion: {
        title: action.title,
        description: action.description,
        actionType: action.actionType as ConciergeSuggestion["actionType"],
        destination: action.destination,
        payload: classification.extractedFields,
        confidence: classification.confidence,
      },
    });
  }

  await repo.createActivity({
    eventId: input.eventId,
    itemId: item.id,
    title: buildConciergeDetectionMessage(
      classification.detectedType,
      input.file?.fileName
    ),
    description: `${item.title} — classificação assistida aplicada.`,
    type: "intake",
    actor: { id: actor.id, name: actor.name, role: actor.role },
  });

  // TODO: extracção segura de PDF/imagem + Gemini Files API quando storage estiver activo

  return item.id;
}
