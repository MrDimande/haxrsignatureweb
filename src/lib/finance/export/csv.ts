import { formatCurrency } from "@/lib/calculations";
import {
  documentTypeLabel,
  EXPENSE_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/finance/constants";
import type { CashAnalytics } from "@/lib/finance/types";

function escapeCsv(value: string | number): string {
  const raw = String(value);
  if (raw.includes(",") || raw.includes('"') || raw.includes("\n")) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function row(values: (string | number)[]): string {
  return values.map(escapeCsv).join(",");
}

export function buildFinanceCsv(analytics: CashAnalytics, year: number): string {
  const lines: string[] = [
    "HAXR Signature — Relatório Financeiro",
    `Ano,${year}`,
    `Gerado em,${new Date().toISOString()}`,
    "",
    "RESUMO",
    row(["Total recebido", formatCurrency(analytics.totalReceived)]),
    row(["Total despesas", formatCurrency(analytics.margin.totalExpenses)]),
    row(["Margem líquida", formatCurrency(analytics.margin.netMargin)]),
    row(["Taxa de margem", `${analytics.margin.marginRate}%`]),
    row(["Por receber", formatCurrency(analytics.pendingInvoicesAmount + analytics.pendingProformasAmount)]),
    "",
    "RECEITAS MENSAIS",
    row(["Mês", "Recebido", "Documentos"]),
    ...(analytics.monthlyTrendByYear[year] ?? analytics.monthlyTrend).map(
      (point) =>
        row([point.label, formatCurrency(point.received), point.count])
    ),
    "",
    "PAGAMENTOS",
    row([
      "Data",
      "Cliente",
      "Método",
      "Referência",
      "Origem",
      "Recibo",
      "Valor",
    ]),
    ...analytics.payments.map((payment) =>
      row([
        payment.paidAt.slice(0, 10),
        payment.clientName,
        PAYMENT_METHOD_LABELS[payment.paymentMethod],
        payment.reference,
        payment.sourceDocumentNumber ?? "",
        payment.documentNumber ?? "",
        formatCurrency(payment.amount, payment.currency),
      ])
    ),
    "",
    "DESPESAS",
    row(["Data", "Categoria", "Descrição", "Evento", "Valor"]),
    ...analytics.expenses.map((expense) =>
      row([
        expense.expenseDate,
        EXPENSE_CATEGORY_LABELS[expense.category],
        expense.description,
        expense.eventName,
        formatCurrency(expense.amount, expense.currency),
      ])
    ),
    "",
    "ALERTAS VENCIDOS",
    row(["Documento", "Cliente", "Vencimento", "Dias", "Valor"]),
    ...analytics.overdueAlerts.map((alert) =>
      row([
        alert.documentNumber,
        alert.clientName,
        alert.dueDate,
        alert.daysOverdue,
        formatCurrency(alert.amount, alert.currency),
      ])
    ),
    "",
    "RECEITA POR EVENTO",
    row(["Evento", "Recebido", "Pendente", "Despesas", "Margem"]),
    ...analytics.eventRevenue.map((item) =>
      row([
        item.eventName,
        formatCurrency(item.received),
        formatCurrency(item.pending),
        formatCurrency(item.expenses),
        formatCurrency(item.netMargin),
      ])
    ),
  ];

  return lines.join("\n");
}

export function downloadCsvFile(content: string, filename: string): void {
  const blob = new Blob([`\uFEFF${content}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
