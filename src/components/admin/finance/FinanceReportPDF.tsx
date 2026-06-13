"use client";

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { formatCurrency } from "@/lib/calculations";
import type { CashAnalytics } from "@/lib/finance/types";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    padding: 40,
    color: "#1a1a1a",
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 16,
    marginBottom: 4,
    color: "#000000",
  },
  subtitle: {
    fontSize: 10,
    color: "#666666",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    marginTop: 16,
    marginBottom: 8,
    color: "#C9A227",
    borderBottomWidth: 1,
    borderBottomColor: "#C9A227",
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: { color: "#555555" },
  value: { fontFamily: "Helvetica-Bold" },
});

type FinanceReportPDFProps = {
  analytics: CashAnalytics;
  year: number;
  generatedAt: string;
};

export default function FinanceReportPDF({
  analytics,
  year,
  generatedAt,
}: FinanceReportPDFProps) {
  const monthly = analytics.monthlyTrendByYear[year] ?? analytics.monthlyTrend;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Relatório Financeiro Interno</Text>
        <Text style={styles.subtitle}>
          HAXR Signature · {year} · {generatedAt}
        </Text>

        <Text style={styles.sectionTitle}>Resumo executivo</Text>
        {[
          ["Total recebido", formatCurrency(analytics.totalReceived)],
          ["Total despesas", formatCurrency(analytics.margin.totalExpenses)],
          ["Margem líquida", formatCurrency(analytics.margin.netMargin)],
          ["Taxa de margem", `${analytics.margin.marginRate}%`],
          [
            "Por receber",
            formatCurrency(
              analytics.pendingInvoicesAmount +
                analytics.pendingProformasAmount
            ),
          ],
          [
            "Meta do mês",
            analytics.currentMonthTarget
              ? formatCurrency(analytics.currentMonthTarget.targetAmount)
              : "—",
          ],
          ["Progresso da meta", `${analytics.currentMonthProgress}%`],
        ].map(([label, value]) => (
          <View key={label} style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Receitas mensais</Text>
        {monthly.map((point) => (
          <View key={point.label} style={styles.row}>
            <Text style={styles.label}>{point.label}</Text>
            <Text style={styles.value}>
              {formatCurrency(point.received)} ({point.count} doc.)
            </Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Alertas vencidos</Text>
        {analytics.overdueAlerts.length === 0 ? (
          <Text>Sem documentos vencidos.</Text>
        ) : (
          analytics.overdueAlerts.slice(0, 8).map((alert) => (
            <View key={alert.documentId} style={styles.row}>
              <Text style={styles.label}>
                {alert.documentNumber} · {alert.clientName}
              </Text>
              <Text style={styles.value}>
                {formatCurrency(alert.amount, alert.currency)} ·{" "}
                {alert.daysOverdue}d
              </Text>
            </View>
          ))
        )}
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Receita por evento</Text>
        {analytics.eventRevenue.slice(0, 12).map((item) => (
          <View key={`${item.eventId ?? item.eventName}`} style={styles.row}>
            <Text style={styles.label}>{item.eventName}</Text>
            <Text style={styles.value}>
              {formatCurrency(item.received)} / margem{" "}
              {formatCurrency(item.netMargin)}
            </Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Últimas despesas</Text>
        {analytics.expenses.slice(0, 12).map((expense) => (
          <View key={expense.id} style={styles.row}>
            <Text style={styles.label}>
              {expense.expenseDate} · {expense.description}
            </Text>
            <Text style={styles.value}>
              {formatCurrency(expense.amount, expense.currency)}
            </Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}
