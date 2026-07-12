import type { InvoiceDocument } from "@/lib/admin/types";
import type { EventStats, ManagedEvent } from "@/lib/events/types";
import type { PaymentRecord } from "@/lib/finance/types";
import type { Currency } from "@/lib/admin/types";
import { isDateHoldActive } from "@/lib/portal/date-hold";

export type CommandCenterCriticalTask = {
  id: string;
  label: string;
  detail?: string;
  tab?: "review" | "concierge" | "portal";
  priority: "high" | "medium";
};

export type EventCommandCenterData = {
  financial: {
    invoiced: number;
    received: number;
    pending: number;
    currency: Currency;
  };
  documents: InvoiceDocument[];
  payments: PaymentRecord[];
  conciergePending: number;
  reviewOpen: number;
  openInvoices: number;
  pendingPaymentProofs: number;
  criticalTasks: CommandCenterCriticalTask[];
};

export type CommandCenterReviewSummary = {
  toReview: number;
  missingGuest: number;
  syncErrors: number;
  possibleDuplicates: number;
};

type BuildEventCommandCenterInput = {
  event: ManagedEvent;
  guestStats: EventStats;
  documents: InvoiceDocument[];
  payments: PaymentRecord[];
  conciergePending: number;
  reviewOpen: number;
  reviewSummary?: CommandCenterReviewSummary;
  pendingPaymentProofs?: number;
};

export function buildCommandCenterCriticalTasks(input: {
  event: ManagedEvent;
  reviewOpen: number;
  reviewSummary?: CommandCenterReviewSummary;
  conciergePending: number;
  pendingPaymentProofs: number;
  openInvoices: number;
  financialPending: number;
  guestStats: EventStats;
}): CommandCenterCriticalTask[] {
  const tasks: CommandCenterCriticalTask[] = [];

  if (input.reviewOpen > 0) {
    const parts: string[] = [];
    if (input.reviewSummary?.toReview) {
      parts.push(`${input.reviewSummary.toReview} para rever`);
    }
    if (input.reviewSummary?.missingGuest) {
      parts.push(`${input.reviewSummary.missingGuest} convidado em falta`);
    }
    if (input.reviewSummary?.syncErrors) {
      parts.push(`${input.reviewSummary.syncErrors} erro(s) de sync`);
    }
    tasks.push({
      id: "guest-review",
      label: `${input.reviewOpen} item(ns) na fila de convidados`,
      detail: parts.join(" · ") || undefined,
      tab: "review",
      priority: "high",
    });
  }

  if (input.pendingPaymentProofs > 0) {
    tasks.push({
      id: "payment-proofs",
      label: `${input.pendingPaymentProofs} comprovativo(s) por validar`,
      tab: "portal",
      priority: "high",
    });
  }

  if (input.conciergePending > 0) {
    tasks.push({
      id: "concierge",
      label: `${input.conciergePending} item(ns) Concierge pendentes`,
      tab: "concierge",
      priority: "medium",
    });
  }

  if (input.openInvoices > 0) {
    tasks.push({
      id: "open-invoices",
      label: `${input.openInvoices} documento(s) comercial(is) em aberto`,
      priority: "medium",
    });
  }

  if (input.financialPending > 0) {
    tasks.push({
      id: "financial-balance",
      label: "Saldo comercial pendente",
      detail: `${input.financialPending.toLocaleString("pt-MZ")} por receber`,
      priority: "medium",
    });
  }

  if (isDateHoldActive(input.event.dateHoldUntil)) {
    tasks.push({
      id: "date-hold",
      label: "Reserva de data activa — aguarda sinal",
      detail: input.event.dateHoldUntil
        ? `Válida até ${new Date(input.event.dateHoldUntil).toLocaleDateString("pt-MZ", { timeZone: "Africa/Maputo" })}`
        : undefined,
      tab: "portal",
      priority: "high",
    });
  }

  if (input.guestStats.invited > 0 && input.guestStats.confirmationRate < 50) {
    tasks.push({
      id: "rsvp-low",
      label: "RSVP abaixo de 50% — follow-up recomendado",
      detail: `${input.guestStats.invited} convidados pendentes`,
      priority: "medium",
    });
  }

  return tasks;
}

export function buildEventCommandCenterData({
  event,
  guestStats,
  documents,
  payments,
  conciergePending,
  reviewOpen,
  reviewSummary,
  pendingPaymentProofs = 0,
}: BuildEventCommandCenterInput): EventCommandCenterData {
  const currency = documents[0]?.totals.currency ?? payments[0]?.currency ?? "MZN";

  const invoiced = documents
    .filter(
      (doc) => doc.documentType === "invoice" || doc.documentType === "proforma"
    )
    .reduce((sum, doc) => sum + doc.totals.grandTotal, 0);

  const received = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const pending = Math.max(0, invoiced - received);

  const openInvoices = documents.filter(
    (doc) =>
      (doc.documentType === "invoice" || doc.documentType === "proforma") &&
      doc.status === "sent"
  ).length;

  const criticalTasks = buildCommandCenterCriticalTasks({
    event,
    reviewOpen,
    reviewSummary,
    conciergePending,
    pendingPaymentProofs,
    openInvoices,
    financialPending: pending,
    guestStats,
  });

  return {
    financial: {
      invoiced,
      received,
      pending,
      currency,
    },
    documents,
    payments,
    conciergePending,
    reviewOpen,
    openInvoices,
    pendingPaymentProofs,
    criticalTasks,
  };
}

export type EventCommandCenterHealth = {
  label: string;
  value: string;
  tone: "neutral" | "good" | "warn" | "gold";
};

export function buildEventHealthSignals(
  event: ManagedEvent,
  guestStats: EventStats,
  command: EventCommandCenterData
): EventCommandCenterHealth[] {
  return [
    {
      label: "Confirmação RSVP",
      value: `${guestStats.confirmationRate}%`,
      tone:
        guestStats.confirmationRate >= 70
          ? "good"
          : guestStats.confirmationRate >= 40
            ? "warn"
            : "neutral",
    },
    {
      label: "Fila convidados",
      value: String(command.reviewOpen),
      tone: command.reviewOpen > 0 ? "warn" : "good",
    },
    {
      label: "Concierge pendente",
      value: String(command.conciergePending),
      tone: command.conciergePending > 0 ? "warn" : "good",
    },
    {
      label: "Cobrança aberta",
      value: String(command.openInvoices),
      tone: command.openInvoices > 0 ? "warn" : "good",
    },
    {
      label: "Saldo pendente",
      value:
        command.financial.pending > 0
          ? `${command.financial.pending.toLocaleString("pt-MZ")} ${command.financial.currency}`
          : "Em dia",
      tone: command.financial.pending > 0 ? "gold" : "good",
    },
    {
      label: "Sheets",
      value: event.sheetsLastSyncedAt ? "Sincronizado" : "Por sincronizar",
      tone: event.sheetsLastSyncedAt ? "good" : "neutral",
    },
  ];
}
