import {
  resolveClientEventDashboardAccess,
  type ClientEventDashboardAuthClient,
} from "@/lib/dashboard/client-event-dashboard-service";
import type { ClientEventRow } from "@/lib/events/client-app-database.types";
import type {
  DocumentModuleData,
  DocumentStatus,
  DocumentType,
  EventDocument,
  EventModuleContext,
} from "@/lib/event-modules/types";
import {
  ClientEventDocumentsRpcError,
  fetchClientEventDocumentsViaRpc,
  type ClientEventDocumentsRpcClient,
  type ClientEventDocumentsRpcItemRow,
  type ClientEventDocumentsRpcPayload,
} from "@/lib/documents/client-event-documents-rpc";

export type ClientEventDocumentsAuthClient = ClientEventDashboardAuthClient;

export type ClientEventDocumentsAccessResult =
  | { kind: "not_found" }
  | { kind: "forbidden" }
  | { kind: "operational_not_linked"; event: ClientEventRow }
  | { kind: "unavailable"; message: string }
  | { kind: "ok"; data: DocumentModuleData };

export { ClientEventDocumentsRpcError };

function formatEventDate(date: string | null): string {
  if (!date) return "Data por definir";
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function mapEventTypeLabel(type: ClientEventRow["event_type"]): string {
  switch (type) {
    case "wedding":
      return "Casamento";
    case "birthday":
      return "Aniversário";
    case "corporate":
      return "Evento corporativo";
    case "baby_shower":
      return "Baby shower";
    case "graduation":
      return "Formatura";
    case "other":
      return "Evento";
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export function buildDocumentsModuleContext(event: ClientEventRow): EventModuleContext {
  return {
    eventId: event.id,
    currency: "MT",
    eventOverview: {
      name: event.event_name,
      type: mapEventTypeLabel(event.event_type),
      date: formatEventDate(event.event_date),
      location: event.event_location || "Local por definir",
      status: event.status === "planning" ? "Em planeamento" : event.status,
      slug: event.slug,
    },
  };
}

function normalizeToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function mapDocumentTypeToken(token: string): DocumentType {
  const normalized = normalizeToken(token);
  if (normalized.includes("proforma") || normalized.includes("proposta") || normalized.includes("vendor_proposal")) {
    return "proposta";
  }
  if (normalized.includes("contract") || normalized.includes("contrato") || normalized.includes("invoice")) {
    return "contrato";
  }
  if (normalized.includes("receipt") || normalized.includes("recibo") || normalized.includes("payment_receipt") || normalized.includes("comprovativo")) {
    return "comprovativo";
  }
  if (normalized.includes("guest") || normalized.includes("convidado")) {
    return "lista_convidados";
  }
  if (normalized.includes("visual") || normalized.includes("inspir") || normalized.includes("moodboard")) {
    return "inspiração";
  }
  if (normalized.includes("checklist")) {
    return "programa";
  }
  return "outro";
}

function isPendingReviewStatus(status: string): boolean {
  const normalized = normalizeToken(status);
  return (
    normalized.includes("uploaded") ||
    normalized.includes("processing") ||
    normalized.includes("pending") ||
    normalized.includes("por_validar") ||
    normalized.includes("novo") ||
    normalized.includes("classificar") ||
    normalized.includes("aguardando") ||
    normalized === "sent"
  );
}

export function mapDbDocumentStatusToUiStatus(status: string): DocumentStatus {
  const normalized = normalizeToken(status);
  if (
    normalized.includes("approved") ||
    normalized.includes("validado") ||
    normalized.includes("paid") ||
    normalized.includes("classificado")
  ) {
    return "validado";
  }
  if (normalized.includes("reject") || normalized.includes("rejeit") || normalized.includes("failed")) {
    return "rejeitado";
  }
  if (normalized.includes("archiv") || normalized.includes("cancel")) {
    return "arquivado";
  }
  return "por_validar";
}

function formatUploadedLabel(createdAt: string): string {
  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) return createdAt;

  const now = Date.now();
  const diffMs = now - parsed.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return "Há instantes";
  if (diffHours < 24) return `Há ${diffHours} h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) return `Há ${diffDays} dias`;

  return parsed.toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function mapSuggestedDestination(row: ClientEventDocumentsRpcItemRow): string {
  if (row.suggested_destination) return row.suggested_destination;

  const type = mapDocumentTypeToken(row.document_type || row.category);
  switch (type) {
    case "proposta":
      return "Fornecedores";
    case "contrato":
      return "Documentos";
    case "comprovativo":
      return "Orçamento";
    case "lista_convidados":
      return "Convidados";
    case "inspiração":
      return "Moodboard";
    case "programa":
      return "Checklist";
    default:
      return "Documentos";
  }
}

function mapItemRowToUiDocument(row: ClientEventDocumentsRpcItemRow): EventDocument {
  return {
    id: row.id,
    name: row.title || row.file_name,
    type: mapDocumentTypeToken(row.document_type || row.category),
    associatedWith: row.associated_with,
    status: mapDbDocumentStatusToUiStatus(row.status),
    uploadedBy: row.uploaded_by,
    uploadedAt: row.created_at,
    uploadedLabel: formatUploadedLabel(row.created_at),
    suggestedDestination: mapSuggestedDestination(row),
  };
}

function countByType(documents: EventDocument[], type: DocumentType): number {
  return documents.filter((doc) => doc.type === type).length;
}

export function mapRpcPayloadToDocumentModuleData(
  event: ClientEventRow,
  payload: ClientEventDocumentsRpcPayload,
): DocumentModuleData {
  const documents = payload.items.map(mapItemRowToUiDocument);

  return {
    context: buildDocumentsModuleContext(event),
    summary: {
      total: payload.summary.totalItems || documents.length,
      proposals: countByType(documents, "proposta"),
      contracts: countByType(documents, "contrato"),
      receipts: countByType(documents, "comprovativo"),
      pendingValidation:
        payload.summary.pendingReviewCount ||
        documents.filter((doc) => doc.status === "por_validar").length,
    },
    documents,
  };
}

export async function getClientEventDocumentsData(input: {
  authClient: ClientEventDocumentsAuthClient;
  rpcClient: ClientEventDocumentsRpcClient;
  userId: string;
  eventId: string;
}): Promise<ClientEventDocumentsAccessResult> {
  const access = await resolveClientEventDashboardAccess(
    input.authClient,
    input.userId,
    input.eventId,
  );

  if (access.kind === "not_found") {
    return { kind: "not_found" };
  }

  if (access.kind === "forbidden") {
    return { kind: "forbidden" };
  }

  if (!access.event.operational_event_id) {
    return { kind: "operational_not_linked", event: access.event };
  }

  try {
    const payload = await fetchClientEventDocumentsViaRpc(
      input.rpcClient,
      access.event.id,
    );

    return {
      kind: "ok",
      data: mapRpcPayloadToDocumentModuleData(access.event, payload),
    };
  } catch (error) {
    if (error instanceof ClientEventDocumentsRpcError) {
      if (error.code === "client_event_not_found") {
        return { kind: "not_found" };
      }
      if (error.code === "operational_not_linked") {
        return { kind: "operational_not_linked", event: access.event };
      }
    }

    return {
      kind: "unavailable",
      message: "Não foi possível carregar os documentos operacionais.",
    };
  }
}

export function isDbDocumentPendingReview(status: string): boolean {
  return isPendingReviewStatus(status);
}
