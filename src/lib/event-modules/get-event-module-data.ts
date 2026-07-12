import type {
  BudgetModuleData,
  ChecklistModuleData,
  ConciergeModuleData,
  DocumentModuleData,
  EventModuleId,
  GuestModuleData,
  ModuleDataResult,
  RSVPModuleData,
  VendorModuleData,
} from "@/lib/event-modules/types";
import {
  getMockBudgetModuleData,
  getMockChecklistModuleData,
  getMockConciergeModuleData,
  getMockDocumentModuleData,
  getMockGuestModuleData,
  getMockRsvpModuleData,
  getMockVendorModuleData,
} from "@/lib/event-modules/mock-event-data";

async function resolveMock<T>(loader: (eventId?: string) => T | null, eventId?: string): Promise<ModuleDataResult<T>> {
  try {
    // TODO: Replace with Supabase repositories + session-scoped event access.
    const data = loader(eventId);
    if (!data) {
      return { ok: false, error: "not_found", message: "Evento não encontrado." };
    }
    if (process.env.NODE_ENV === "development") {
      await new Promise((r) => setTimeout(r, 60));
    }
    return { ok: true, data };
  } catch {
    return { ok: false, error: "unavailable", message: "Não foi possível carregar o módulo." };
  }
}

export async function getGuestModuleData(eventId?: string): Promise<ModuleDataResult<GuestModuleData>> {
  return resolveMock(getMockGuestModuleData, eventId);
}

export async function getRsvpModuleData(eventId?: string): Promise<ModuleDataResult<RSVPModuleData>> {
  return resolveMock(getMockRsvpModuleData, eventId);
}

export async function getBudgetModuleData(eventId?: string): Promise<ModuleDataResult<BudgetModuleData>> {
  return resolveMock(getMockBudgetModuleData, eventId);
}

export async function getVendorModuleData(eventId?: string): Promise<ModuleDataResult<VendorModuleData>> {
  return resolveMock(getMockVendorModuleData, eventId);
}

export async function getDocumentModuleData(eventId?: string): Promise<ModuleDataResult<DocumentModuleData>> {
  return resolveMock(getMockDocumentModuleData, eventId);
}

export async function getChecklistModuleData(eventId?: string): Promise<ModuleDataResult<ChecklistModuleData>> {
  return resolveMock(getMockChecklistModuleData, eventId);
}

export async function getConciergeModuleData(eventId?: string): Promise<ModuleDataResult<ConciergeModuleData>> {
  return resolveMock(getMockConciergeModuleData, eventId);
}

export async function getEventModuleData(
  module: EventModuleId,
  eventId?: string
): Promise<ModuleDataResult<unknown>> {
  switch (module) {
    case "guests":
      return getGuestModuleData(eventId);
    case "rsvp":
      return getRsvpModuleData(eventId);
    case "budget":
      return getBudgetModuleData(eventId);
    case "vendors":
      return getVendorModuleData(eventId);
    case "documents":
      return getDocumentModuleData(eventId);
    case "checklist":
      return getChecklistModuleData(eventId);
    case "concierge":
      return getConciergeModuleData(eventId);
    default: {
      const _exhaustive: never = module;
      return _exhaustive;
    }
  }
}
