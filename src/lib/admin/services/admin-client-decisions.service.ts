import type { AdminOperationalDocument } from "@/lib/admin/types";
import type { ManagedEvent } from "@/lib/events/types";
import type {
  PortalCreativeApproval,
  PortalPaymentProof,
} from "@/lib/portal/portal-premium.types";
import { isPortalApprovalPending } from "@/lib/portal/services/portal-approval-rules";
import { isDateHoldActive } from "@/lib/portal/date-hold";
import { formatCurrencyMZN } from "@/lib/formatters";

export type AdminDecisionOwner = "client" | "haxr";

export type AdminClientDecisionKind =
  | "proforma_approval"
  | "proforma_changes"
  | "proforma_conversion"
  | "creative_approval"
  | "creative_changes"
  | "payment_proof"
  | "date_hold";

export type AdminClientDecisionItem = {
  id: string;
  owner: AdminDecisionOwner;
  kind: AdminClientDecisionKind;
  title: string;
  detail: string | null;
  clientName: string | null;
  eventId: string | null;
  eventName: string | null;
  href: string;
  occurredAt: string;
  dueAt: string | null;
};

export type AdminClientDecisionSummary = {
  total: number;
  awaitingClient: number;
  awaitingHaxr: number;
};

export type AdminClientDecisionCoverage = {
  complete: boolean;
  creativeApprovals: boolean;
  paymentProofs: boolean;
};

export type AdminClientDecisions = {
  awaitingClient: AdminClientDecisionItem[];
  awaitingHaxr: AdminClientDecisionItem[];
  summary: AdminClientDecisionSummary;
  coverage: AdminClientDecisionCoverage;
};

export type BuildAdminClientDecisionsInput = {
  documents: readonly AdminOperationalDocument[];
  events: ManagedEvent[];
  creativeApprovals: {
    available: boolean;
    items: PortalCreativeApproval[];
  };
  paymentProofs: {
    available: boolean;
    items: PortalPaymentProof[];
  };
  options?: {
    now?: Date;
  };
};

/**
 * Pure builder that derives factual ownership and handoff items between
 * clients and HAXR.
 *
 * Free of database queries and side-effects.
 */
export function buildAdminClientDecisions(
  input: BuildAdminClientDecisionsInput
): AdminClientDecisions {
  const now = input.options?.now ?? new Date();
  const awaitingClient: AdminClientDecisionItem[] = [];
  const awaitingHaxr: AdminClientDecisionItem[] = [];

  const convertedProformaIds = new Set(
    input.documents
      .filter((d) => d.convertedFromDocumentId)
      .map((d) => d.convertedFromDocumentId!)
  );

  // 1. Proforma Documents
  for (const doc of input.documents) {
    if (doc.documentType !== "proforma" || doc.status !== "sent") {
      continue;
    }

    if (isPortalApprovalPending(doc)) {
      // Proforma awaiting client decision
      awaitingClient.push({
        id: `proforma-approval-${doc.id}`,
        owner: "client",
        kind: "proforma_approval",
        title: `Proposta ${doc.documentNumber} aguarda aprovação`,
        detail: doc.event.eventName ? doc.event.eventName : null,
        clientName: doc.clientName || null,
        eventId: doc.event.eventId ?? null,
        eventName: doc.event.eventName ?? null,
        href: `/admin/documents/${doc.id}`,
        occurredAt: doc.emailSentAt || doc.updatedAt || doc.createdAt,
        dueAt: doc.expiryDate && doc.expiryDate.trim() ? doc.expiryDate : null,
      });
    } else if (doc.clientApprovalStatus === "changes_requested") {
      // Proforma changes requested by client -> awaiting HAXR
      awaitingHaxr.push({
        id: `proforma-changes-${doc.id}`,
        owner: "haxr",
        kind: "proforma_changes",
        title: `Alterações solicitadas em ${doc.documentNumber}`,
        detail: doc.clientApprovalNote?.trim() || null,
        clientName: doc.clientName || null,
        eventId: doc.event.eventId ?? null,
        eventName: doc.event.eventName ?? null,
        href: `/admin/documents/${doc.id}`,
        occurredAt: doc.clientApprovedAt || doc.updatedAt || doc.createdAt,
        dueAt: null,
      });
    } else if (
      doc.clientApprovalStatus === "approved" &&
      !convertedProformaIds.has(doc.id)
    ) {
      // Proforma approved but invoice conversion incomplete -> awaiting HAXR
      awaitingHaxr.push({
        id: `proforma-conversion-${doc.id}`,
        owner: "haxr",
        kind: "proforma_conversion",
        title: "Proposta aprovada · conversão por concluir",
        detail: `${doc.documentNumber} aguarda emissão de factura`,
        clientName: doc.clientName || null,
        eventId: doc.event.eventId ?? null,
        eventName: doc.event.eventName ?? null,
        href: `/admin/documents/${doc.id}`,
        occurredAt: doc.clientApprovedAt || doc.updatedAt || doc.createdAt,
        dueAt: null,
      });
    }
  }

  // 2. Creative Approvals
  if (input.creativeApprovals.available) {
    for (const approval of input.creativeApprovals.items) {
      const event = input.events.find((e) => e.id === approval.eventId);

      if (approval.status === "pending") {
        awaitingClient.push({
          id: `creative-approval-${approval.id}`,
          owner: "client",
          kind: "creative_approval",
          title: `Aprovação: ${approval.title}`,
          detail: approval.description || null,
          clientName: event?.clientName ?? null,
          eventId: approval.eventId,
          eventName: event?.name ?? null,
          href: `/admin/events/${approval.eventId}`,
          occurredAt: approval.createdAt,
          dueAt: approval.dueAt || null,
        });
      } else if (approval.status === "changes_requested") {
        awaitingHaxr.push({
          id: `creative-changes-${approval.id}`,
          owner: "haxr",
          kind: "creative_changes",
          title: `Alterações em aprovação: ${approval.title}`,
          detail: approval.decidedNote?.trim() || null,
          clientName: event?.clientName ?? null,
          eventId: approval.eventId,
          eventName: event?.name ?? null,
          href: `/admin/events/${approval.eventId}`,
          occurredAt: approval.decidedAt || approval.createdAt,
          dueAt: null,
        });
      }
    }
  }

  // 3. Payment Proofs & Event Resolution
  const pendingProofEventIds = new Set<string>();

  if (input.paymentProofs.available) {
    for (const proof of input.paymentProofs.items) {
      if (proof.status !== "pending_review") {
        continue;
      }

      // Factual event resolution: proof.eventId -> matching document -> null (no client guessing)
      let resolvedEventId: string | null = proof.eventId ?? null;
      let matchedDoc: AdminOperationalDocument | null = null;

      if (!resolvedEventId && proof.documentId) {
        matchedDoc =
          input.documents.find((d) => d.id === proof.documentId) ?? null;
        if (matchedDoc?.event.eventId) {
          resolvedEventId = matchedDoc.event.eventId;
        }
      }

      if (resolvedEventId) {
        pendingProofEventIds.add(resolvedEventId);
      }

      const event = resolvedEventId
        ? input.events.find((e) => e.id === resolvedEventId)
        : null;

      const titleAmount =
        typeof proof.amount === "number" && proof.amount > 0
          ? ` · ${formatCurrencyMZN(proof.amount, proof.currency)}`
          : "";

      const detailText = proof.reference
        ? `Ref: ${proof.reference}`
        : proof.notes
          ? `Nota: ${proof.notes}`
          : null;

      awaitingHaxr.push({
        id: `payment-proof-${proof.id}`,
        owner: "haxr",
        kind: "payment_proof",
        title: `Comprovativo por validar${titleAmount}`,
        detail: detailText,
        clientName: event?.clientName ?? matchedDoc?.clientName ?? null,
        eventId: resolvedEventId,
        eventName: event?.name ?? matchedDoc?.event.eventName ?? null,
        href: resolvedEventId
          ? `/admin/events/${resolvedEventId}`
          : "/admin/cash",
        occurredAt: proof.createdAt,
        dueAt: null,
      });
    }
  }

  // 4. Date Holds (Awaiting Client) with Critical Suppression Rule
  // Date-hold ownership requires payment-proof coverage to be safely established.
  // If paymentProofs.available === false, we cannot verify whether a proof was already submitted,
  // so we do not emit date_hold decisions (coverage.paymentProofs and coverage.complete will be false).
  if (input.paymentProofs.available) {
    for (const event of input.events) {
      if (!isDateHoldActive(event.dateHoldUntil, now)) {
        continue;
      }

      // Critical Rule: If a pending_review payment proof exists for this event,
      // the client already submitted it -> suppress date hold from awaitingClient!
      if (pendingProofEventIds.has(event.id)) {
        continue;
      }

      awaitingClient.push({
        id: `date-hold-${event.id}`,
        owner: "client",
        kind: "date_hold",
        title: "Reserva de data activa · aguarda sinal",
        detail: event.name,
        clientName: event.clientName ?? null,
        eventId: event.id,
        eventName: event.name,
        href: `/admin/events/${event.id}`,
        occurredAt: event.dateHoldUntil!,
        dueAt: event.dateHoldUntil!,
      });
    }
  }

  // Sorting:
  // Awaiting HAXR: Most recent client handoff first (occurredAt DESC), tie-breaker id ASC
  awaitingHaxr.sort((a, b) => {
    const timeA = new Date(a.occurredAt).getTime();
    const timeB = new Date(b.occurredAt).getTime();
    if (timeB !== timeA) {
      return timeB - timeA;
    }
    return a.id.localeCompare(b.id);
  });

  // Awaiting Client:
  // 1. Items with dueAt first, sorted by dueAt ASC (nearest deadline)
  // 2. Items without dueAt after, sorted by occurredAt DESC
  // 3. Stable tie-breaker: id ASC
  awaitingClient.sort((a, b) => {
    const hasDueA = a.dueAt !== null && a.dueAt !== undefined;
    const hasDueB = b.dueAt !== null && b.dueAt !== undefined;

    if (hasDueA && hasDueB) {
      const dueTimeA = new Date(a.dueAt!).getTime();
      const dueTimeB = new Date(b.dueAt!).getTime();
      if (dueTimeA !== dueTimeB) {
        return dueTimeA - dueTimeB;
      }
    } else if (hasDueA && !hasDueB) {
      return -1;
    } else if (!hasDueA && hasDueB) {
      return 1;
    } else {
      const timeA = new Date(a.occurredAt).getTime();
      const timeB = new Date(b.occurredAt).getTime();
      if (timeB !== timeA) {
        return timeB - timeA;
      }
    }

    return a.id.localeCompare(b.id);
  });

  const summary: AdminClientDecisionSummary = {
    total: awaitingClient.length + awaitingHaxr.length,
    awaitingClient: awaitingClient.length,
    awaitingHaxr: awaitingHaxr.length,
  };

  const coverage: AdminClientDecisionCoverage = {
    complete:
      input.creativeApprovals.available && input.paymentProofs.available,
    creativeApprovals: input.creativeApprovals.available,
    paymentProofs: input.paymentProofs.available,
  };

  return {
    awaitingClient,
    awaitingHaxr,
    summary,
    coverage,
  };
}
