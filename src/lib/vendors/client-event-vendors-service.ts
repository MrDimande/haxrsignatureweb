import {
  resolveClientEventDashboardAccess,
  type ClientEventDashboardAuthClient,
} from "@/lib/dashboard/client-event-dashboard-service";
import type { ClientEventRow } from "@/lib/events/client-app-database.types";
import type {
  EventModuleContext,
  Vendor,
  VendorCategory,
  VendorModuleData,
  VendorStatus,
} from "@/lib/event-modules/types";
import {
  ClientEventVendorsRpcError,
  fetchClientEventVendorsViaRpc,
  type ClientEventVendorsRpcClient,
  type ClientEventVendorsRpcPayload,
  type ClientEventVendorsRpcVendorRow,
} from "@/lib/vendors/client-event-vendors-rpc";

export type ClientEventVendorsAuthClient = ClientEventDashboardAuthClient;

export type ClientEventVendorsAccessResult =
  | { kind: "not_found" }
  | { kind: "forbidden" }
  | { kind: "operational_not_linked"; event: ClientEventRow }
  | { kind: "unavailable"; message: string }
  | { kind: "ok"; data: VendorModuleData };

export { ClientEventVendorsRpcError };

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

export function buildVendorModuleContext(event: ClientEventRow): EventModuleContext {
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

function normalizeStatusToken(status: string): string {
  return status
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function mapDbVendorStatusToUiStatus(status: string): VendorStatus {
  const normalized = normalizeStatusToken(status);

  if (normalized.includes("rejeit")) return "rejeitado";
  if (normalized.includes("conclu")) return "concluído";
  if (normalized.includes("contrat") || normalized.includes("assin")) return "contratado";
  if (normalized.includes("aprov")) return "aprovado";
  if (normalized.includes("suger")) return "sugerido";
  if (
    normalized.includes("analise") ||
    normalized.includes("pend") ||
    normalized.includes("aguard") ||
    normalized.includes("revis")
  ) {
    return "em_análise";
  }

  return "em_análise";
}

function mapServiceCategoryToVendorCategory(category: string | null): VendorCategory {
  const normalized = normalizeStatusToken(category ?? "");

  if (normalized.includes("decor")) return "decoração";
  if (normalized.includes("cater") || normalized.includes("buffet")) return "catering";
  if (normalized.includes("foto") || normalized.includes("video")) return "fotografia";
  if (normalized.includes("music") || normalized.includes("dj")) return "música";
  if (normalized.includes("local") || normalized.includes("venue") || normalized.includes("espaco")) {
    return "local";
  }

  return "outro";
}

function formatVendorContact(row: ClientEventVendorsRpcVendorRow): string {
  const parts = [row.contact_email, row.contact_phone].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "Contacto por definir";
}

function formatVendorLocation(row: ClientEventVendorsRpcVendorRow): string {
  if (row.payment_terms?.trim()) return row.payment_terms.trim();
  if (row.notes?.trim()) return row.notes.trim();
  return "Local por definir";
}

function formatDeadlineLabel(deadline: string | null): string {
  if (!deadline) return "Prazo por definir";
  const parsed = new Date(`${deadline}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return deadline;
  return parsed.toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function resolveNextAction(status: VendorStatus, deadline: string | null): string {
  switch (status) {
    case "em_análise":
      return "Aguardar validação HAXR";
    case "aprovado":
      return "Preparar contrato";
    case "contratado":
      return "Acompanhar execução";
    case "rejeitado":
      return "Arquivado";
    case "concluído":
      return "Serviço concluído";
    case "sugerido":
      return "Avaliar proposta";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function mapVendorRowToUiVendor(row: ClientEventVendorsRpcVendorRow): Vendor {
  const status = mapDbVendorStatusToUiStatus(row.status);
  const isContracted =
    status === "contratado" ||
    status === "concluído" ||
    row.contract_signed === true ||
    (typeof row.contracted_amount === "number" && row.contracted_amount > 0);

  const contractedAmount =
    typeof row.contracted_amount === "number" && row.contracted_amount > 0
      ? row.contracted_amount
      : 0;

  const proposedAmount = typeof row.proposed_amount === "number" ? row.proposed_amount : 0;
  const hasSignedContract = isContracted;

  return {
    id: row.id,
    name: row.name,
    category: mapServiceCategoryToVendorCategory(row.service_category),
    contact: formatVendorContact(row),
    location: formatVendorLocation(row),
    status,
    contractedAmount,
    proposal:
      proposedAmount > 0
        ? {
            id: `${row.id}-proposal`,
            amount: proposedAmount,
            receivedAt: row.created_at,
            status: isContracted ? "aprovada" : status === "rejeitado" ? "rejeitada" : "pendente",
          }
        : undefined,
    contract: hasSignedContract
      ? {
          id: `${row.id}-contract`,
          signed: true,
          signedAt: row.updated_at,
        }
      : undefined,
    nextAction: `${resolveNextAction(status, row.deadline)} · ${formatDeadlineLabel(row.deadline)}`,
  };
}

function countSignedContracts(vendors: Vendor[]): number {
  return vendors.filter((vendor) => vendor.contract?.signed).length;
}

export function mapRpcPayloadToVendorModuleData(
  event: ClientEventRow,
  payload: ClientEventVendorsRpcPayload,
): VendorModuleData {
  const vendors = payload.vendors.map(mapVendorRowToUiVendor);

  return {
    context: buildVendorModuleContext(event),
    summary: {
      active: payload.summary.activeVendors,
      inReview: payload.summary.pendingVendors,
      signedContracts: countSignedContracts(vendors),
      pendingPayments: 0,
    },
    vendors,
  };
}

export async function getClientEventVendorsData(input: {
  authClient: ClientEventVendorsAuthClient;
  rpcClient: ClientEventVendorsRpcClient;
  userId: string;
  eventId: string;
}): Promise<ClientEventVendorsAccessResult> {
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
    const payload = await fetchClientEventVendorsViaRpc(
      input.rpcClient,
      access.event.id,
    );

    return {
      kind: "ok",
      data: mapRpcPayloadToVendorModuleData(access.event, payload),
    };
  } catch (error) {
    if (error instanceof ClientEventVendorsRpcError) {
      if (error.code === "client_event_not_found") {
        return { kind: "not_found" };
      }
      if (error.code === "operational_not_linked") {
        return { kind: "operational_not_linked", event: access.event };
      }
    }

    return {
      kind: "unavailable",
      message: "Não foi possível carregar os fornecedores operacionais.",
    };
  }
}
