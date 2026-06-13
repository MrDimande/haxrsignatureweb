import type { InvoiceDocument } from "@/lib/admin/types";
import {
  buildClientBalances,
  buildPaymentMethodBreakdown,
} from "@/lib/finance/balances";
import {
  buildEventRevenue,
  buildMarginSummary,
  buildOverdueAlerts,
  computeMonthProgress,
  resolveCurrentMonthTarget,
} from "@/lib/finance/extended-analytics";
import type {
  BusinessRevenue,
  CashAnalytics,
  DocumentTypeBreakdown,
  FinanceOverview,
  MonthPoint,
  PaymentRecord,
  StatusBreakdown,
  TopClient,
} from "@/lib/finance/types";

const MONTH_LABELS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
] as const;

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function getYear(date: string): number | null {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.getUTCFullYear();
}

function getMonth(date: string): number | null {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.getUTCMonth() + 1;
}

function isCurrentMonth(date: string): boolean {
  const now = new Date();
  const year = getYear(date);
  const month = getMonth(date);
  return (
    year === now.getUTCFullYear() && month === now.getUTCMonth() + 1
  );
}

function sumDocs(docs: InvoiceDocument[]): number {
  return round(docs.reduce((sum, doc) => sum + doc.totals.grandTotal, 0));
}

function buildMonthlyTrend(
  paidDocs: InvoiceDocument[],
  year: number
): MonthPoint[] {
  return MONTH_LABELS.map((label, index) => {
    const month = index + 1;
    const monthDocs = paidDocs.filter((doc) => {
      return getYear(doc.issueDate) === year && getMonth(doc.issueDate) === month;
    });

    return {
      month,
      label,
      received: sumDocs(monthDocs),
      count: monthDocs.length,
    };
  });
}

function buildMonthlyTrendByYear(
  paidDocs: InvoiceDocument[]
): Record<number, MonthPoint[]> {
  const years = new Set<number>();
  const currentYear = new Date().getUTCFullYear();
  years.add(currentYear);

  for (const doc of paidDocs) {
    const year = getYear(doc.issueDate);
    if (year) years.add(year);
  }

  const map: Record<number, MonthPoint[]> = {};
  for (const year of Array.from(years).sort((a, b) => b - a)) {
    map[year] = buildMonthlyTrend(paidDocs, year);
  }
  return map;
}

function monthOverMonthChange(trend: MonthPoint[]): number | null {
  const now = new Date();
  const currentMonth = now.getUTCMonth() + 1;
  const current = trend.find((point) => point.month === currentMonth);
  const previous = trend.find((point) => point.month === currentMonth - 1);

  if (!current || !previous || previous.received === 0) return null;
  return round(((current.received - previous.received) / previous.received) * 100);
}

export function buildCashAnalytics(
  documents: InvoiceDocument[],
  businesses: { id: string; name: string }[],
  fiscalYear: number = new Date().getUTCFullYear(),
  payments: PaymentRecord[] = [],
  paymentsEnabled = false
): CashAnalytics {
  const paidDocs = documents.filter((doc) => doc.status === "paid");
  const sentInvoices = documents.filter(
    (doc) => doc.documentType === "invoice" && doc.status === "sent"
  );
  const sentProformas = documents.filter(
    (doc) => doc.documentType === "proforma" && doc.status === "sent"
  );
  const receipts = documents.filter((doc) => doc.documentType === "receipt");
  const receiptsPaid = paidDocs.filter((doc) => doc.documentType === "receipt");
  const drafts = documents.filter((doc) => doc.status === "draft");
  const cancelled = documents.filter((doc) => doc.status === "cancelled");

  const yearPaid = paidDocs.filter(
    (doc) => getYear(doc.issueDate) === fiscalYear
  );

  const monthlyTrend = buildMonthlyTrend(paidDocs, fiscalYear);
  const monthlyTrendByYear = buildMonthlyTrendByYear(paidDocs);

  const totalReceived = sumDocs(paidDocs);
  const pendingInvoicesAmount = sumDocs(sentInvoices);
  const pendingProformasAmount = sumDocs(sentProformas);
  const totalOutstanding = pendingInvoicesAmount + pendingProformasAmount;
  const collectionRate =
    totalReceived + totalOutstanding > 0
      ? round((totalReceived / (totalReceived + totalOutstanding)) * 100)
      : paidDocs.length > 0
        ? 100
        : 0;

  const byBusiness: BusinessRevenue[] = businesses.map((business) => {
    const businessPaid = paidDocs.filter((doc) => doc.businessId === business.id);
    const businessPending = [...sentInvoices, ...sentProformas].filter(
      (doc) => doc.businessId === business.id
    );
    const received = sumDocs(businessPaid);
    return {
      businessId: business.id as BusinessRevenue["businessId"],
      businessName: business.name,
      received,
      pending: sumDocs(businessPending),
      share: totalReceived > 0 ? round((received / totalReceived) * 100) : 0,
    };
  });

  const documentTypes = ["proforma", "invoice", "receipt"] as const;
  const byDocumentType: DocumentTypeBreakdown[] = documentTypes.map((type) => {
    const typePaid = paidDocs.filter((doc) => doc.documentType === type);
    const typePending = documents.filter(
      (doc) =>
        doc.documentType === type &&
        (doc.status === "sent" || doc.status === "draft")
    );
    return {
      type,
      paidAmount: sumDocs(typePaid),
      paidCount: typePaid.length,
      pendingAmount: sumDocs(typePending.filter((d) => d.status === "sent")),
      pendingCount: typePending.filter((d) => d.status === "sent").length,
    };
  });

  const statuses = ["draft", "sent", "paid", "cancelled"] as const;
  const byStatus: StatusBreakdown[] = statuses.map((status) => {
    const statusDocs = documents.filter((doc) => doc.status === status);
    return {
      status,
      count: statusDocs.length,
      amount: sumDocs(statusDocs),
    };
  });

  const clientMap = new Map<string, { received: number; count: number }>();
  for (const doc of paidDocs) {
    const name = doc.clientName.trim() || "Sem nome";
    const current = clientMap.get(name) ?? { received: 0, count: 0 };
    current.received += doc.totals.grandTotal;
    current.count += 1;
    clientMap.set(name, current);
  }

  const topClients: TopClient[] = Array.from(clientMap.entries())
    .map(([clientName, data]) => ({
      clientName,
      received: round(data.received),
      documentCount: data.count,
    }))
    .sort((a, b) => b.received - a.received)
    .slice(0, 6);

  const pendingCollection = [...sentInvoices, ...sentProformas]
    .sort(
      (a, b) =>
        new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
    )
    .slice(0, 12);

  const paidMovements = [...paidDocs].sort(
    (a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
  );

  const thisMonthPaid = paidDocs.filter((doc) => isCurrentMonth(doc.issueDate));
  const thisMonthReceipts = receiptsPaid.filter((doc) =>
    isCurrentMonth(doc.issueDate)
  );

  const enrichedPayments = paymentsEnabled
    ? payments
    : [];

  return {
    totalReceived,
    totalReceiptsAmount: sumDocs(receiptsPaid),
    pendingInvoicesCount: sentInvoices.length,
    pendingInvoicesAmount,
    sentProformasCount: sentProformas.length,
    pendingProformasAmount,
    thisMonthReceived: sumDocs(thisMonthPaid),
    thisMonthReceiptsCount: thisMonthReceipts.length,
    recentReceipts: receipts
      .filter((doc) => doc.status === "paid")
      .sort(
        (a, b) =>
          new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
      )
      .slice(0, 8),
    pendingCollection,
    fiscalYear,
    yearReceived: sumDocs(yearPaid),
    yearVat: round(
      yearPaid.reduce((sum, doc) => sum + doc.totals.vatAmount, 0)
    ),
    yearSubtotal: round(
      yearPaid.reduce((sum, doc) => sum + doc.totals.subtotal, 0)
    ),
    averageTicket:
      paidDocs.length > 0 ? round(totalReceived / paidDocs.length) : 0,
    collectionRate,
    monthOverMonthChange: monthOverMonthChange(monthlyTrend),
    monthlyTrend,
    monthlyTrendByYear,
    byBusiness,
    byDocumentType,
    byStatus,
    topClients,
    paidMovements,
    draftCount: drafts.length,
    draftAmount: sumDocs(drafts),
    cancelledCount: cancelled.length,
    payments: enrichedPayments,
    byPaymentMethod: buildPaymentMethodBreakdown(enrichedPayments),
    clientBalances: buildClientBalances(documents, enrichedPayments),
    paymentsEnabled,
    expenses: [],
    monthlyTargets: [],
    overdueAlerts: buildOverdueAlerts(documents),
    eventRevenue: [],
    margin: {
      totalReceived: 0,
      totalExpenses: 0,
      netMargin: 0,
      marginRate: 0,
      monthReceived: 0,
      monthExpenses: 0,
      monthNetMargin: 0,
    },
    currentMonthTarget: null,
    currentMonthProgress: 0,
    financeExtrasEnabled: false,
  };
}

export function pickFinanceOverview(analytics: CashAnalytics): FinanceOverview {
  return {
    totalReceived: analytics.totalReceived,
    totalReceiptsAmount: analytics.totalReceiptsAmount,
    pendingInvoicesCount: analytics.pendingInvoicesCount,
    pendingInvoicesAmount: analytics.pendingInvoicesAmount,
    sentProformasCount: analytics.sentProformasCount,
    pendingProformasAmount: analytics.pendingProformasAmount,
    thisMonthReceived: analytics.thisMonthReceived,
    thisMonthReceiptsCount: analytics.thisMonthReceiptsCount,
    recentReceipts: analytics.recentReceipts,
    pendingCollection: analytics.pendingCollection,
  };
}
