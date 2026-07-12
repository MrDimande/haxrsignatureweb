export type PortalTimelineCategory =
  | "briefing"
  | "proposal"
  | "deposit"
  | "invite"
  | "rsvp"
  | "seating"
  | "checkin"
  | "report"
  | "milestone"
  | "meeting"
  | "delivery"
  | "event_day"
  | "other";

export type PortalApprovalType = "invite" | "layout" | "delivery" | "other";

export type PortalApprovalStatus = "pending" | "approved" | "changes_requested";

export type PortalPaymentProofStatus = "pending_review" | "approved" | "rejected";

export type PortalTimelineItem = {
  id: string;
  eventId: string;
  clientId: string | null;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  category: PortalTimelineCategory;
  visibility: "client" | "internal";
  status: "scheduled" | "done" | "delayed" | "skipped";
  sortOrder: number;
  createdAt: string;
};

export type PortalCreativeApproval = {
  id: string;
  eventId: string;
  clientId: string | null;
  approvalType: PortalApprovalType;
  title: string;
  description: string | null;
  status: PortalApprovalStatus;
  dueAt: string | null;
  decidedAt: string | null;
  decidedNote: string | null;
  attachmentUrl: string | null;
  createdAt: string;
};

export type PortalTeamMessage = {
  id: string;
  clientId: string;
  eventId: string | null;
  authorName: string;
  body: string;
  isPinned: boolean;
  createdAt: string;
};

export type PortalPaymentProof = {
  id: string;
  clientId: string;
  eventId: string | null;
  documentId: string | null;
  amount: number | null;
  currency: string;
  paymentMethod: string;
  reference: string | null;
  notes: string | null;
  fileName: string | null;
  status: PortalPaymentProofStatus;
  createdAt: string;
};

export type PortalContract = {
  id: string;
  clientId: string;
  eventId: string | null;
  title: string;
  description: string | null;
  fileUrl: string | null;
  signedAt: string | null;
  status: "draft" | "active" | "archived";
  createdAt: string;
};

export const DEFAULT_OPERATIONAL_PHASES: Array<{
  category: PortalTimelineCategory;
  title: string;
  sortOrder: number;
}> = [
  { category: "briefing", title: "Briefing e alinhamento", sortOrder: 10 },
  { category: "proposal", title: "Proposta comercial", sortOrder: 20 },
  { category: "deposit", title: "Sinal e confirmação", sortOrder: 30 },
  { category: "invite", title: "Convite digital", sortOrder: 40 },
  { category: "rsvp", title: "Gestão de RSVP", sortOrder: 50 },
  { category: "seating", title: "Seating plan", sortOrder: 60 },
  { category: "checkin", title: "Check-in no dia", sortOrder: 70 },
  { category: "report", title: "Relatório final", sortOrder: 80 },
];
