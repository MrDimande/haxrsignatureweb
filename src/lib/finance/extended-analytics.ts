import type { InvoiceDocument } from "@/lib/admin/types";
import type { ManagedEvent } from "@/lib/events/types";
import type {
  ExpenseRecord,
  EventRevenueRow,
  MarginSummary,
  MonthlyTarget,
  OverdueAlert,
  PaymentRecord,
} from "@/lib/finance/types";

const OVERDUE_GRACE_DAYS = 30;

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function parseDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function daysBetween(start: string, end: Date): number {
  const startDate = parseDate(start);
  const endUtc = Date.UTC(
    end.getUTCFullYear(),
    end.getUTCMonth(),
    end.getUTCDate()
  );
  const diff = endUtc - startDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function defaultDueDate(doc: InvoiceDocument): string {
  const issue = parseDate(doc.issueDate);
  issue.setUTCDate(issue.getUTCDate() + OVERDUE_GRACE_DAYS);
  return issue.toISOString().slice(0, 10);
}

export function buildOverdueAlerts(
  documents: InvoiceDocument[]
): OverdueAlert[] {
  const now = new Date();

  return documents
    .filter(
      (doc) =>
        doc.status === "sent" &&
        (doc.documentType === "invoice" || doc.documentType === "proforma")
    )
    .map((doc) => {
      const dueDate =
        doc.expiryDate && doc.expiryDate.trim()
          ? doc.expiryDate
          : defaultDueDate(doc);
      const daysOverdue = daysBetween(dueDate, now);
      return {
        documentId: doc.id,
        documentNumber: doc.documentNumber,
        documentType: doc.documentType,
        clientName: doc.clientName || "—",
        amount: doc.totals.grandTotal,
        currency: doc.totals.currency,
        dueDate,
        daysOverdue,
        issueDate: doc.issueDate,
      };
    })
    .filter((alert) => alert.daysOverdue > 0)
    .sort((a, b) => b.daysOverdue - a.daysOverdue);
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

export function buildEventRevenue(
  events: ManagedEvent[],
  documents: InvoiceDocument[],
  payments: PaymentRecord[],
  expenses: ExpenseRecord[]
): EventRevenueRow[] {
  const rows = new Map<string, EventRevenueRow>();

  function ensureRow(
    eventId: string | null,
    eventName: string,
    eventDate: string | null
  ) {
    const key = eventId ?? `name:${normalizeName(eventName)}`;
    if (!rows.has(key)) {
      rows.set(key, {
        eventId,
        eventName: eventName || "Sem evento",
        eventDate,
        received: 0,
        pending: 0,
        expenses: 0,
        netMargin: 0,
        paymentCount: 0,
      });
    }
    return rows.get(key)!;
  }

  for (const event of events) {
    ensureRow(event.id, event.name, event.date);
  }

  for (const payment of payments) {
    const event = payment.eventId
      ? events.find((item) => item.id === payment.eventId)
      : null;
    const row = ensureRow(
      payment.eventId,
      event?.name ?? payment.eventName,
      event?.date ?? null
    );
    row.received += payment.amount;
    row.paymentCount += 1;
  }

  for (const doc of documents) {
    if (!doc.event.eventName.trim()) continue;
    const matched =
      events.find(
        (event) =>
          normalizeName(event.name) === normalizeName(doc.event.eventName)
      ) ?? null;
    const row = ensureRow(
      matched?.id ?? null,
      doc.event.eventName,
      doc.event.eventDate ?? matched?.date ?? null
    );

    if (doc.status === "paid") {
      const linked = payments.some(
        (payment) =>
          payment.sourceDocumentId === doc.id || payment.documentId === doc.id
      );
      if (!linked) row.received += doc.totals.grandTotal;
    } else if (doc.status === "sent") {
      row.pending += doc.totals.grandTotal;
    }
  }

  for (const expense of expenses) {
    const event = expense.eventId
      ? events.find((item) => item.id === expense.eventId)
      : null;
    const row = ensureRow(
      expense.eventId,
      event?.name ?? expense.eventName,
      event?.date ?? null
    );
    row.expenses += expense.amount;
  }

  return Array.from(rows.values())
    .map((row) => ({
      ...row,
      received: round(row.received),
      pending: round(row.pending),
      expenses: round(row.expenses),
      netMargin: round(row.received - row.expenses),
    }))
    .filter(
      (row) =>
        row.received > 0 || row.pending > 0 || row.expenses > 0 || row.eventId
    )
    .sort((a, b) => b.received - a.received || b.pending - a.pending);
}

export function buildMarginSummary(
  payments: PaymentRecord[],
  paidDocuments: InvoiceDocument[],
  expenses: ExpenseRecord[]
): MarginSummary {
  const paymentTotal = payments.reduce((sum, item) => sum + item.amount, 0);
  const docOnlyPaid = paidDocuments
    .filter(
      (doc) =>
        !payments.some(
          (payment) =>
            payment.documentId === doc.id ||
            payment.sourceDocumentId === doc.id
        )
    )
    .reduce((sum, doc) => sum + doc.totals.grandTotal, 0);

  const totalReceived = round(paymentTotal + docOnlyPaid);
  const totalExpenses = round(
    expenses.reduce((sum, item) => sum + item.amount, 0)
  );
  const netMargin = round(totalReceived - totalExpenses);

  const now = new Date();
  const currentMonth = now.getUTCMonth() + 1;
  const currentYear = now.getUTCFullYear();

  const monthPayments = payments.filter((payment) => {
    const date = new Date(payment.paidAt);
    return (
      date.getUTCFullYear() === currentYear &&
      date.getUTCMonth() + 1 === currentMonth
    );
  });

  const monthDocs = paidDocuments.filter((doc) => {
    const date = parseDate(doc.issueDate);
    return (
      date.getUTCFullYear() === currentYear &&
      date.getUTCMonth() + 1 === currentMonth
    );
  });

  const monthReceived = round(
    monthPayments.reduce((sum, item) => sum + item.amount, 0) +
      monthDocs
        .filter(
          (doc) =>
            !payments.some(
              (payment) =>
                payment.documentId === doc.id ||
                payment.sourceDocumentId === doc.id
            )
        )
        .reduce((sum, doc) => sum + doc.totals.grandTotal, 0)
  );

  const monthExpenses = round(
    expenses
      .filter((expense) => {
        const date = parseDate(expense.expenseDate);
        return (
          date.getUTCFullYear() === currentYear &&
          date.getUTCMonth() + 1 === currentMonth
        );
      })
      .reduce((sum, item) => sum + item.amount, 0)
  );

  return {
    totalReceived,
    totalExpenses,
    netMargin,
    marginRate:
      totalReceived > 0 ? round((netMargin / totalReceived) * 100) : 0,
    monthReceived,
    monthExpenses,
    monthNetMargin: round(monthReceived - monthExpenses),
  };
}

export function resolveCurrentMonthTarget(
  targets: MonthlyTarget[],
  businessId?: string
): MonthlyTarget | null {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  const match = targets.find(
    (target) =>
      target.year === year &&
      target.month === month &&
      (!businessId || target.businessId === businessId)
  );

  return match ?? null;
}

export function computeMonthProgress(
  received: number,
  target: MonthlyTarget | null
): number {
  if (!target || target.targetAmount <= 0) return 0;
  return Math.min(round((received / target.targetAmount) * 100), 100);
}
