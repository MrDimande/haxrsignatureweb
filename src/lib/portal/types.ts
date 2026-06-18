/**
 * Tipos do portal do cliente — especificação Fase 9.
 * Sem implementação de rotas/API; alinhado com admin e Supabase existentes.
 */

import type { Currency, DocumentStatus, DocumentType } from "@/lib/admin/types";

/** Módulos visíveis no portal (roadmap comercial). */
export type PortalModuleId =
  | "dashboard"
  | "events"
  | "guests"
  | "documents"
  | "finance"
  | "timeline"
  | "approvals"
  | "suppliers"
  | "contracts";

export type PortalRole = "owner" | "collaborator" | "viewer";

/** Sessão do portal (futuro — cookie ou Supabase Auth). */
export interface PortalSession {
  userId: string;
  clientId: string;
  email: string;
  role: PortalRole;
  expiresAt: string;
}

/** Resumo do dashboard — derivado de ClientCommercialOverview (read-only). */
export interface PortalDashboardSummary {
  clientId: string;
  clientName: string;
  eventCount: number;
  invoicedTotal: number;
  receivedTotal: number;
  pendingBalance: number;
  currency: Currency;
  nextMilestone: PortalTimelineItem | null;
  pendingApprovals: number;
}

/** Evento no portal — subconjunto de ManagedEvent. */
export interface PortalEventSummary {
  id: string;
  name: string;
  eventType: string;
  eventDate: string | null;
  venue: string | null;
  status: "planning" | "active" | "completed" | "archived";
  guestStats: PortalGuestStats | null;
}

/** KPIs de convidados — sem PII (privacidade). */
export interface PortalGuestStats {
  totalGuests: number;
  confirmed: number;
  declined: number;
  pending: number;
  checkedIn: number;
  adults: number;
  children: number;
}

/** Documento visível ao cliente. */
export interface PortalDocument {
  id: string;
  documentType: DocumentType;
  documentNumber: string;
  status: DocumentStatus;
  issueDate: string;
  dueDate: string | null;
  grandTotal: number;
  currency: Currency;
  eventId: string | null;
  eventName: string | null;
  /** PDF só quando status ∈ sent | paid */
  canDownload: boolean;
}

/** Pagamento / movimento financeiro visível. */
export interface PortalPayment {
  id: string;
  amount: number;
  currency: Currency;
  method: string;
  paidAt: string;
  documentNumber: string | null;
  eventName: string | null;
  notes: string | null;
}

/** Cronograma partilhado (tabela nova — Fase 10+). */
export interface PortalTimelineItem {
  id: string;
  eventId: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  category: "milestone" | "meeting" | "delivery" | "event_day" | "other";
  visibility: "client" | "internal";
  status: "scheduled" | "done" | "delayed";
}

/** Aprovação de entrega (tabela nova). */
export interface PortalApproval {
  id: string;
  eventId: string;
  title: string;
  description: string | null;
  status: "pending" | "approved" | "changes_requested";
  dueAt: string | null;
  decidedAt: string | null;
  attachmentUrl: string | null;
}

/** Fornecedor visível ao cliente (referência, sem dados internos). */
export interface PortalSupplier {
  id: string;
  eventId: string;
  name: string;
  category: string;
  contactLabel: string | null;
  status: "confirmed" | "pending" | "cancelled";
}

/** Convite de acesso ao portal (tabela nova). */
export interface PortalInvite {
  id: string;
  clientId: string;
  email: string;
  role: PortalRole;
  tokenHash: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdByAdminId: string | null;
}
