import type {
  ConciergeDestination,
  ConciergeInboxItem,
  ConciergeRoutingResult,
} from "./types";

function mockRoute(
  item: ConciergeInboxItem,
  destination: ConciergeDestination,
  label: string
): ConciergeRoutingResult {
  // TODO: persistir escrita real nos módulos de evento quando backend estiver disponível
  return {
    ok: true,
    destination,
    message: `${label} — preparado para envio ao módulo ${destination}.`,
    linkedRecordId: `mock-${destination}-${item.id}`,
  };
}

export function sendToVendors(item: ConciergeInboxItem): ConciergeRoutingResult {
  return mockRoute(item, "fornecedores", "Fornecedor");
}

export function sendToBudget(item: ConciergeInboxItem): ConciergeRoutingResult {
  return mockRoute(item, "financeiro", "Financeiro");
}

export function sendToGuests(item: ConciergeInboxItem): ConciergeRoutingResult {
  return mockRoute(item, "convidados", "Convidados");
}

export function sendToDocuments(item: ConciergeInboxItem): ConciergeRoutingResult {
  return mockRoute(item, "documentos", "Documentos");
}

export function sendToMoodboard(item: ConciergeInboxItem): ConciergeRoutingResult {
  return mockRoute(item, "moodboard", "Moodboard");
}

export function sendToChecklist(item: ConciergeInboxItem): ConciergeRoutingResult {
  return mockRoute(item, "checklist", "Checklist");
}

export function sendToContracts(item: ConciergeInboxItem): ConciergeRoutingResult {
  return mockRoute(item, "contratos", "Contratos");
}

export function sendToRSVP(item: ConciergeInboxItem): ConciergeRoutingResult {
  return mockRoute(item, "rsvp", "RSVP");
}

export function sendToGifts(item: ConciergeInboxItem): ConciergeRoutingResult {
  return mockRoute(item, "presentes", "Presentes");
}

export function routeConciergeItemToDestination(
  item: ConciergeInboxItem,
  destination: ConciergeDestination
): ConciergeRoutingResult {
  switch (destination) {
    case "fornecedores":
      return sendToVendors(item);
    case "financeiro":
      return sendToBudget(item);
    case "convidados":
      return sendToGuests(item);
    case "documentos":
      return sendToDocuments(item);
    case "moodboard":
      return sendToMoodboard(item);
    case "checklist":
      return sendToChecklist(item);
    case "contratos":
      return sendToContracts(item);
    case "rsvp":
      return sendToRSVP(item);
    case "presentes":
      return sendToGifts(item);
    case "dashboard":
      return mockRoute(item, "dashboard", "Dashboard");
    default: {
      const _exhaustive: never = destination;
      return _exhaustive;
    }
  }
}
