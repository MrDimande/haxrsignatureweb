import React from "react";
import {
  Document,
  Page,
  Text,
  View,
} from "@react-pdf/renderer";
import type {
  NormalizedEventFinancialLedger,
  WeddingFinancialReportOptions,
} from "./report-types";
import {
  formatReportCurrency,
  formatReportEmissionDate,
  formatReportPercent,
  safeReportText,
} from "./report-formatters";
import { PDF_COLORS, styles } from "./report-styles";
import {
  classifyPaymentsAndContractualPosition,
  extractNegotiatedSavings,
  extractPlannerAuditingNotes,
  extractVendorExposures,
} from "./report-insights";

interface WeddingFinancialReportDocumentProps {
  ledger: NormalizedEventFinancialLedger;
  options?: WeddingFinancialReportOptions;
}

export function WeddingFinancialReportDocument({
  ledger,
  options,
}: WeddingFinancialReportDocumentProps) {
  const { summary, categories, items, currencySymbol } = ledger;

  const emissionDateFormatted = formatReportEmissionDate(options?.generatedAt);
  const clientNames = safeReportText(ledger.clientNames || ledger.eventTitle, "Cliente");
  const eventDateFormatted = safeReportText(ledger.eventDateFormatted, "Data por definir");
  const eventLocation = safeReportText(ledger.eventLocation, "Local por definir");
  const guestCount = ledger.guestCount > 0 ? `${ledger.guestCount} convidados` : "Por definir";

  // Insights & Classifications
  const { savingsList, totalSavingsGenerated } = extractNegotiatedSavings(items);
  const vendorExposures = extractVendorExposures(items);
  const {
    installments: classifiedInstallments,
    totalScheduled,
    totalOverdue,
    totalUpcoming30Days,
  } = classifyPaymentsAndContractualPosition(ledger);
  const auditNotes = extractPlannerAuditingNotes(ledger);

  return (
    <Document
      title={`HAXR Wedding Financial Report — ${clientNames}`}
      author="HAXR Signature"
      subject="Wedding Financial Report · Private Client Edition"
      creator="HAXR Signature Financial Engine"
    >
      {/* ═══════════════════════════════════════════════════════════════════
          PAGE 01 — COVER PAGE
          ═══════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={styles.coverPage}>
        {/* Top Header */}
        <View style={styles.coverTop}>
          <Text style={styles.coverBrandLabel}>HAXR SIGNATURE</Text>
          <Text style={styles.coverEditionLabel}>PRIVATE CLIENT EDITION</Text>
        </View>

        {/* Center Editorial Title */}
        <View style={styles.coverCenter}>
          <Text style={styles.coverTitleMain}>THE WEDDING</Text>
          <Text style={styles.coverTitleSub}>FINANCIAL REPORT</Text>
          <View style={styles.coverDivider} />

          <Text style={styles.coverCoupleName}>{clientNames}</Text>
          <Text style={styles.coverMetadataText}>{eventDateFormatted}</Text>
          <Text style={styles.coverMetadataText}>{eventLocation}</Text>
          <Text style={styles.coverMetadataText}>Capacidade: {guestCount}</Text>
        </View>

        {/* Bottom Metadata & Notice */}
        <View style={styles.coverBottom}>
          <View>
            <Text style={styles.coverConfidentialNotice}>
              Documento Privado & Confidencial
            </Text>
            <Text style={styles.coverConfidentialNotice}>
              Emissão: {emissionDateFormatted}
            </Text>
          </View>
          <Text style={styles.coverSignatureStamp}>
            Prepared by HAXR Signature
          </Text>
        </View>
      </Page>

      {/* ═══════════════════════════════════════════════════════════════════
          PAGE 02 — EXECUTIVE FINANCIAL OVERVIEW
          ═══════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={styles.page}>
        {/* Running Header */}
        <View style={styles.runningHeader} fixed>
          <Text style={styles.runningHeaderBrand}>HAXR SIGNATURE</Text>
          <Text style={styles.runningHeaderDoc}>
            THE WEDDING FINANCIAL REPORT · {clientNames}
          </Text>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionPreTitle}>Sumário de Capital</Text>
          <Text style={styles.sectionTitle}>EXECUTIVE FINANCIAL OVERVIEW</Text>
          <Text style={styles.sectionSubtitle}>
            Uma leitura consolidada da posição financeira do casamento à data desta edição.
          </Text>
        </View>

        {/* Metadata Strip */}
        <View style={styles.metaGrid}>
          <View style={[styles.metaCol, styles.metaColDivider]}>
            <Text style={styles.metaLabel}>Evento / Casal</Text>
            <Text style={styles.metaValue}>{clientNames}</Text>
          </View>
          <View style={[styles.metaCol, styles.metaColDivider]}>
            <Text style={styles.metaLabel}>Data Oficial</Text>
            <Text style={styles.metaValue}>{eventDateFormatted}</Text>
          </View>
          <View style={[styles.metaCol, styles.metaColDivider]}>
            <Text style={styles.metaLabel}>Localização</Text>
            <Text style={styles.metaValue}>{eventLocation}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Data de Emissão</Text>
            <Text style={styles.metaValue}>{emissionDateFormatted}</Text>
          </View>
        </View>

        {/* Layer 1 KPIs: Primary Vault */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Orçamento de Referência</Text>
            <Text style={styles.kpiValue}>
              {summary.budgetCeiling > 0
                ? formatReportCurrency(summary.budgetCeiling, currencySymbol)
                : "Por definir"}
            </Text>
            <Text style={styles.kpiSubtext}>Teto orçamental estimado</Text>
          </View>

          <View style={styles.kpiCardHighlighted}>
            <Text style={styles.kpiLabel}>Total Contratado</Text>
            <Text style={styles.kpiValueGold}>
              {formatReportCurrency(summary.contractedAmount, currencySymbol)}
            </Text>
            <Text style={styles.kpiSubtext}>Compromissos formalizados</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Total Liquidado</Text>
            <Text style={styles.kpiValue}>
              {formatReportCurrency(summary.paidAmount, currencySymbol)}
            </Text>
            <Text style={styles.kpiSubtext}>Pagamentos executados</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Saldo Contratual</Text>
            <Text style={styles.kpiValue}>
              {formatReportCurrency(summary.outstandingAmount, currencySymbol)}
            </Text>
            <Text style={styles.kpiSubtext}>A liquidar conforme contrato</Text>
          </View>
        </View>

        {/* Layer 2 KPIs: Secondary Analytics */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Forecast Final</Text>
            <Text style={styles.kpiValue}>
              {formatReportCurrency(summary.forecastFinalCost, currencySymbol)}
            </Text>
            <Text style={styles.kpiSubtext}>Custo final projetado</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Variação Projetada</Text>
            <Text style={styles.kpiValue}>
              {formatReportCurrency(summary.projectedVariance, currencySymbol)}
            </Text>
            <Text style={styles.kpiSubtext}>
              {summary.projectedVariance >= 0 ? "Margem positiva" : "Excesso sobre teto"}
            </Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Capital Livre</Text>
            <Text style={styles.kpiValue}>
              {formatReportCurrency(summary.uncommittedBudget, currencySymbol)}
            </Text>
            <Text style={styles.kpiSubtext}>Disponível para contratação</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Investimento / Pax</Text>
            <Text style={styles.kpiValue}>
              {summary.costPerGuest > 0
                ? formatReportCurrency(summary.costPerGuest, currencySymbol)
                : "—"}
            </Text>
            <Text style={styles.kpiSubtext}>
              {ledger.guestCount > 0 ? `Base: ${ledger.guestCount} convidados` : "Convidados por definir"}
            </Text>
          </View>
        </View>

        {/* Running Footer */}
        <View style={styles.runningFooter} fixed>
          <Text style={styles.runningFooterText}>
            HAXR SIGNATURE · PRIVATE CLIENT EDITION · CONFIDENCIAL
          </Text>
          <Text
            style={styles.runningFooterPage}
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>

      {/* ═══════════════════════════════════════════════════════════════════
          PAGE 03 — BUDGET ARCHITECTURE
          ═══════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.runningHeader} fixed>
          <Text style={styles.runningHeaderBrand}>HAXR SIGNATURE</Text>
          <Text style={styles.runningHeaderDoc}>
            BUDGET ARCHITECTURE · {clientNames}
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionPreTitle}>Estrutura de Alocação</Text>
          <Text style={styles.sectionTitle}>BUDGET ARCHITECTURE</Text>
          <Text style={styles.sectionSubtitle}>
            Distribuição proporcional de capital por categoria orçamental.
          </Text>
        </View>

        {categories.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Sem categorias ativas</Text>
            <Text style={styles.emptyStateText}>
              Nenhuma categoria com valores alocados ou contratados nesta edição.
            </Text>
          </View>
        ) : (
          <View style={{ marginTop: 8 }}>
            {/* Category Table */}
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { width: "30%" }]}>Categoria</Text>
                <Text style={[styles.th, styles.tdRight, { width: "17%" }]}>Alocado</Text>
                <Text style={[styles.th, styles.tdRight, { width: "18%" }]}>Contratado</Text>
                <Text style={[styles.th, styles.tdRight, { width: "17%" }]}>Liquidado</Text>
                <Text style={[styles.th, styles.tdRight, { width: "18%" }]}>Participação</Text>
              </View>

              {categories.map((cat, idx) => {
                const isAlternate = idx % 2 === 1;
                return (
                  <View
                    key={`cat-row-${cat.name}-${idx}`}
                    style={isAlternate ? [styles.tableRow, styles.tableRowAlternate] : styles.tableRow}
                    wrap={false}
                  >
                    <Text style={[styles.tdBold, { width: "30%" }]}>{cat.name}</Text>
                    <Text style={[styles.td, styles.tdRight, { width: "17%" }]}>
                      {formatReportCurrency(cat.allocated, currencySymbol)}
                    </Text>
                    <Text style={[styles.tdGold, styles.tdRight, { width: "18%" }]}>
                      {formatReportCurrency(cat.contracted, currencySymbol)}
                    </Text>
                    <Text style={[styles.td, styles.tdRight, { width: "17%" }]}>
                      {formatReportCurrency(cat.paid, currencySymbol)}
                    </Text>
                    <Text style={[styles.tdMuted, styles.tdRight, { width: "18%" }]}>
                      {formatReportPercent(cat.shareOfTotal)}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Visual Bars Composition */}
            <View style={{ marginTop: 14 }}>
              <Text
                style={{
                  fontFamily: "Helvetica-Bold",
                  fontSize: 7.5,
                  letterSpacing: 1.2,
                  color: PDF_COLORS.slate,
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Composição Visual de Contratação e Liquidação
              </Text>

              {categories.map((cat, idx) => {
                const maxBudget = summary.budgetCeiling > 0 ? summary.budgetCeiling : summary.contractedAmount || 1;
                const paidWidthPercent = Math.min(100, Math.max(0, (cat.paid / maxBudget) * 100));
                const contractedWidthPercent = Math.min(
                  100 - paidWidthPercent,
                  Math.max(0, ((cat.contracted - cat.paid) / maxBudget) * 100),
                );

                return (
                  <View key={`bar-${cat.name}-${idx}`} style={styles.barRow} wrap={false}>
                    <View style={styles.barLabelRow}>
                      <Text style={styles.barCategoryName}>{cat.name}</Text>
                      <Text style={styles.barCategoryValues}>
                        Contratado: {formatReportCurrency(cat.contracted, currencySymbol)} · Liquidado:{" "}
                        {formatReportCurrency(cat.paid, currencySymbol)} ({formatReportPercent(cat.shareOfTotal)})
                      </Text>
                    </View>
                    <View style={styles.barTrack}>
                      {paidWidthPercent > 0 && (
                        <View style={[styles.barFillPaid, { width: `${paidWidthPercent}%` }]} />
                      )}
                      {contractedWidthPercent > 0 && (
                        <View style={[styles.barFillOutstanding, { width: `${contractedWidthPercent}%` }]} />
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.runningFooter} fixed>
          <Text style={styles.runningFooterText}>
            HAXR SIGNATURE · PRIVATE CLIENT EDITION · CONFIDENCIAL
          </Text>
          <Text
            style={styles.runningFooterPage}
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>

      {/* ═══════════════════════════════════════════════════════════════════
          PAGE 04+ — MASTER BUDGET (Continuous Table)
          ═══════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.runningHeader} fixed>
          <Text style={styles.runningHeaderBrand}>HAXR SIGNATURE</Text>
          <Text style={styles.runningHeaderDoc}>
            MASTER BUDGET · {clientNames}
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionPreTitle}>Posição Contratual Detalhada</Text>
          <Text style={styles.sectionTitle}>MASTER BUDGET</Text>
          <Text style={styles.sectionSubtitle}>
            Registo executivo de fornecedores, valores contratados e saldos pendentes.
          </Text>
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Sem fornecedores registados</Text>
            <Text style={styles.emptyStateText}>
              Nenhum item ou fornecedor associado aos registos operacionais desta edição.
            </Text>
          </View>
        ) : (
          <View style={styles.table}>
            {/* Table Header Row (Repeated on Page Breaks) */}
            <View style={styles.tableHeaderRow} fixed>
              <Text style={[styles.th, { width: "18%" }]}>Categoria</Text>
              <Text style={[styles.th, { width: "26%" }]}>Item / Fornecedor</Text>
              <Text style={[styles.th, styles.tdRight, { width: "14%" }]}>Proposta</Text>
              <Text style={[styles.th, styles.tdRight, { width: "14%" }]}>Contratado</Text>
              <Text style={[styles.th, styles.tdRight, { width: "14%" }]}>Liquidado</Text>
              <Text style={[styles.th, styles.tdRight, { width: "14%" }]}>Saldo</Text>
            </View>

            {/* Table Data Rows */}
            {items.map((item, idx) => {
              const isAlternate = idx % 2 === 1;
              return (
                <View
                  key={`item-row-${item.id}-${idx}`}
                  style={isAlternate ? [styles.tableRow, styles.tableRowAlternate] : styles.tableRow}
                  wrap={false}
                >
                  <Text style={[styles.tdMuted, { width: "18%" }]}>{item.category}</Text>
                  <Text style={[styles.tdBold, { width: "26%" }]}>{item.vendorOrItem}</Text>
                  <Text style={[styles.td, styles.tdRight, { width: "14%" }]}>
                    {item.proposedAmount > 0
                      ? formatReportCurrency(item.proposedAmount, currencySymbol)
                      : "—"}
                  </Text>
                  <Text style={[styles.tdGold, styles.tdRight, { width: "14%" }]}>
                    {item.contractedAmount > 0
                      ? formatReportCurrency(item.contractedAmount, currencySymbol)
                      : "—"}
                  </Text>
                  <Text style={[styles.td, styles.tdRight, { width: "14%" }]}>
                    {item.paidAmount > 0
                      ? formatReportCurrency(item.paidAmount, currencySymbol)
                      : "0 " + currencySymbol}
                  </Text>
                  <Text style={[styles.tdBold, styles.tdRight, { width: "14%" }]}>
                    {formatReportCurrency(item.balance, currencySymbol)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.runningFooter} fixed>
          <Text style={styles.runningFooterText}>
            HAXR SIGNATURE · PRIVATE CLIENT EDITION · CONFIDENCIAL
          </Text>
          <Text
            style={styles.runningFooterPage}
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>

      {/* ═══════════════════════════════════════════════════════════════════
          PAGE 05 — PAYMENTS & CONTRACTUAL POSITION
          ═══════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.runningHeader} fixed>
          <Text style={styles.runningHeaderBrand}>HAXR SIGNATURE</Text>
          <Text style={styles.runningHeaderDoc}>
            PAYMENTS & CONTRACTUAL POSITION · {clientNames}
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionPreTitle}>Posição de Liquidação & Vencimentos</Text>
          <Text style={styles.sectionTitle}>PAYMENTS & CONTRACTUAL POSITION</Text>
          <Text style={styles.sectionSubtitle}>
            Histórico de liquidações executadas e saldos contratuais pendentes de pagamento.
          </Text>
        </View>

        {/* Summary Metric Strip */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Total Liquidado</Text>
            <Text style={styles.kpiValue}>
              {formatReportCurrency(summary.paidAmount, currencySymbol)}
            </Text>
            <Text style={styles.kpiSubtext}>Executado com recibo/registo</Text>
          </View>

          <View style={styles.kpiCardHighlighted}>
            <Text style={styles.kpiLabel}>Total a Programar / Vencer</Text>
            <Text style={styles.kpiValueGold}>
              {formatReportCurrency(totalScheduled, currencySymbol)}
            </Text>
            <Text style={styles.kpiSubtext}>Saldos contratuais em aberto</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Vencido</Text>
            <Text style={styles.kpiValue}>
              {formatReportCurrency(totalOverdue, currencySymbol)}
            </Text>
            <Text style={styles.kpiSubtext}>Com data ultrapassada</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Próximos 30 Dias</Text>
            <Text style={styles.kpiValue}>
              {formatReportCurrency(totalUpcoming30Days, currencySymbol)}
            </Text>
            <Text style={styles.kpiSubtext}>Exigibilidade a curto prazo</Text>
          </View>
        </View>

        {classifiedInstallments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Sem registos de pagamentos</Text>
            <Text style={styles.emptyStateText}>
              Nenhum vencimento contratual ou pagamento liquidado registado nesta edição.
            </Text>
          </View>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeaderRow} fixed>
              <Text style={[styles.th, { width: "20%" }]}>Categoria</Text>
              <Text style={[styles.th, { width: "30%" }]}>Fornecedor / Descrição</Text>
              <Text style={[styles.th, { width: "18%" }]}>Vencimento</Text>
              <Text style={[styles.th, styles.tdRight, { width: "18%" }]}>Montante</Text>
              <Text style={[styles.th, styles.tdCenter, { width: "14%" }]}>Estado</Text>
            </View>

            {classifiedInstallments.map((inst, idx) => {
              const isAlternate = idx % 2 === 1;
              let badgeStyle = styles.statusPlanned;
              let statusLabel = "A Programar";

              if (inst.status === "liquidado") {
                badgeStyle = styles.statusPaid;
                statusLabel = "Liquidado";
              } else if (inst.status === "vencido") {
                badgeStyle = styles.statusPending;
                statusLabel = "Vencido";
              } else if (inst.status === "a_vencer") {
                badgeStyle = styles.statusPartial;
                statusLabel = "A Vencer";
              }

              return (
                <View
                  key={`inst-row-${inst.id}-${idx}`}
                  style={isAlternate ? [styles.tableRow, styles.tableRowAlternate] : styles.tableRow}
                  wrap={false}
                >
                  <Text style={[styles.tdMuted, { width: "20%" }]}>{inst.category}</Text>
                  <Text style={[styles.tdBold, { width: "30%" }]}>{inst.vendorOrItem}</Text>
                  <Text style={[styles.td, { width: "18%" }]}>{inst.dueDate}</Text>
                  <Text style={[styles.tdBold, styles.tdRight, { width: "18%" }]}>
                    {formatReportCurrency(inst.amount, currencySymbol)}
                  </Text>
                  <View style={{ width: "14%", alignItems: "center" }}>
                    <Text style={[styles.statusBadge, badgeStyle]}>{statusLabel}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.runningFooter} fixed>
          <Text style={styles.runningFooterText}>
            HAXR SIGNATURE · PRIVATE CLIENT EDITION · CONFIDENCIAL
          </Text>
          <Text
            style={styles.runningFooterPage}
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>

      {/* ═══════════════════════════════════════════════════════════════════
          PAGE 06 — VENDOR EXPOSURE & SAVINGS
          ═══════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.runningHeader} fixed>
          <Text style={styles.runningHeaderBrand}>HAXR SIGNATURE</Text>
          <Text style={styles.runningHeaderDoc}>
            VENDOR EXPOSURE & SAVINGS · {clientNames}
          </Text>
        </View>

        {/* Part 1: Vendor Exposure */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionPreTitle}>Concentração Contratual</Text>
          <Text style={styles.sectionTitle}>VENDOR & CONTRACT EXPOSURE</Text>
          <Text style={styles.sectionSubtitle}>
            Principais exposições financeiras e taxa de liquidação por parceiro.
          </Text>
        </View>

        {vendorExposures.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Sem contratos formalizados</Text>
            <Text style={styles.emptyStateText}>
              Nenhum parceiro com contrato ou pagamento ativo registado nesta edição.
            </Text>
          </View>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.th, { width: "28%" }]}>Fornecedor</Text>
              <Text style={[styles.th, { width: "18%" }]}>Categoria</Text>
              <Text style={[styles.th, styles.tdRight, { width: "18%" }]}>Contratado</Text>
              <Text style={[styles.th, styles.tdRight, { width: "18%" }]}>Liquidado</Text>
              <Text style={[styles.th, styles.tdRight, { width: "18%" }]}>Saldo</Text>
            </View>

            {vendorExposures.map((exp, idx) => {
              const isAlternate = idx % 2 === 1;
              return (
                <View
                  key={`exp-row-${exp.id}-${idx}`}
                  style={isAlternate ? [styles.tableRow, styles.tableRowAlternate] : styles.tableRow}
                  wrap={false}
                >
                  <Text style={[styles.tdBold, { width: "28%" }]}>{exp.name}</Text>
                  <Text style={[styles.tdMuted, { width: "18%" }]}>{exp.category}</Text>
                  <Text style={[styles.tdGold, styles.tdRight, { width: "18%" }]}>
                    {formatReportCurrency(exp.contractedAmount, currencySymbol)}
                  </Text>
                  <Text style={[styles.td, styles.tdRight, { width: "18%" }]}>
                    {formatReportCurrency(exp.paidAmount, currencySymbol)}
                  </Text>
                  <Text style={[styles.tdBold, styles.tdRight, { width: "18%" }]}>
                    {formatReportCurrency(exp.balance, currencySymbol)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Part 2: Negotiated Savings (Strict Definition) */}
        <View style={[styles.sectionHeader, { marginTop: 18 }]}>
          <Text style={styles.sectionPreTitle}>Otimização de Propostas</Text>
          <Text style={styles.sectionTitle}>SAVINGS & NEGOTIATIONS</Text>
          <Text style={styles.sectionSubtitle}>
            Poupanças efetivas geradas através da negociação de propostas comerciais.
          </Text>
        </View>

        {savingsList.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Sem negociações com poupança registada</Text>
            <Text style={styles.emptyStateText}>
              Nenhum contrato formalizado com valor inferior à proposta comercial inicial nesta edição.
            </Text>
          </View>
        ) : (
          <View>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { width: "28%" }]}>Fornecedor</Text>
                <Text style={[styles.th, { width: "18%" }]}>Categoria</Text>
                <Text style={[styles.th, styles.tdRight, { width: "18%" }]}>Proposta</Text>
                <Text style={[styles.th, styles.tdRight, { width: "18%" }]}>Contratado</Text>
                <Text style={[styles.th, styles.tdRight, { width: "18%" }]}>Poupança</Text>
              </View>

              {savingsList.map((item, idx) => {
                const isAlternate = idx % 2 === 1;
                return (
                  <View
                    key={`saving-row-${item.id}-${idx}`}
                    style={isAlternate ? [styles.tableRow, styles.tableRowAlternate] : styles.tableRow}
                    wrap={false}
                  >
                    <Text style={[styles.tdBold, { width: "28%" }]}>{item.vendorOrItem}</Text>
                    <Text style={[styles.tdMuted, { width: "18%" }]}>{item.category}</Text>
                    <Text style={[styles.td, styles.tdRight, { width: "18%" }]}>
                      {formatReportCurrency(item.proposedAmount, currencySymbol)}
                    </Text>
                    <Text style={[styles.tdGold, styles.tdRight, { width: "18%" }]}>
                      {formatReportCurrency(item.contractedAmount, currencySymbol)}
                    </Text>
                    <Text style={[styles.tdBold, styles.tdRight, { width: "18%", color: PDF_COLORS.success }]}>
                      {formatReportCurrency(item.saving, currencySymbol)} ({formatReportPercent(item.savingPercentage)})
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Total Savings Generated Highlight */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#F2EBE0",
                borderWidth: 0.5,
                borderColor: PDF_COLORS.gold,
                padding: 10,
                marginTop: 6,
              }}
              wrap={false}
            >
              <Text
                style={{
                  fontFamily: "Helvetica-Bold",
                  fontSize: 7.5,
                  letterSpacing: 1.2,
                  color: PDF_COLORS.charcoal,
                  textTransform: "uppercase",
                }}
              >
                TOTAL SAVINGS GENERATED
              </Text>
              <Text
                style={{
                  fontFamily: "Times-Bold",
                  fontSize: 13,
                  color: PDF_COLORS.goldMuted,
                }}
              >
                {formatReportCurrency(totalSavingsGenerated, currencySymbol)}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.runningFooter} fixed>
          <Text style={styles.runningFooterText}>
            HAXR SIGNATURE · PRIVATE CLIENT EDITION · CONFIDENCIAL
          </Text>
          <Text
            style={styles.runningFooterPage}
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>

      {/* ═══════════════════════════════════════════════════════════════════
          PAGE 07 — PLANNER COMMENTARY & CLOSING
          ═══════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.runningHeader} fixed>
          <Text style={styles.runningHeaderBrand}>HAXR SIGNATURE</Text>
          <Text style={styles.runningHeaderDoc}>
            AUDIT NOTES & CLOSING · {clientNames}
          </Text>
        </View>

        {/* Section 1: Notes & Observations */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionPreTitle}>Observações Financeiras</Text>
          <Text style={styles.sectionTitle}>HAXR PLANNER COMMENTARY</Text>
          <Text style={styles.sectionSubtitle}>
            Notas operacionais, alertas de conciliação e registos específicos do casamento.
          </Text>
        </View>

        {auditNotes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Sem observações pendentes</Text>
            <Text style={styles.emptyStateText}>
              Nenhum alerta de conciliação ou nota operacional pendente nesta edição.
            </Text>
          </View>
        ) : (
          <View style={{ marginBottom: 24 }}>
            {auditNotes.map((note, idx) => (
              <View
                key={`note-${idx}`}
                style={{
                  flexDirection: "row",
                  backgroundColor: PDF_COLORS.cardBg,
                  borderWidth: 0.5,
                  borderColor: PDF_COLORS.hairline,
                  padding: 10,
                  marginBottom: 6,
                }}
                wrap={false}
              >
                <Text style={{ width: 14, color: PDF_COLORS.gold, fontFamily: "Helvetica-Bold", fontSize: 8 }}>
                  •
                </Text>
                <Text style={{ flex: 1, fontFamily: "Helvetica", fontSize: 7.5, color: PDF_COLORS.charcoal, lineHeight: 1.35 }}>
                  {note}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Section 2: Institutional Closing Statement */}
        <View style={styles.closingContainer} wrap={false}>
          <View style={styles.closingStatementBox}>
            <Text style={styles.closingStatementText}>
              {'"Este relatório apresenta a posição financeira consolidada a partir dos registos disponíveis no ecossistema HAXR Signature à data da sua emissão. Documento preparado com rigor e confidencialidade para o acompanhamento executivo do casal."'}
            </Text>
          </View>

          {/* Signature & Identification Blocks */}
          <View style={styles.closingSignaturesRow}>
            <View style={styles.closingSignatureBlock}>
              <Text style={styles.closingSignatureTitle}>HAXR SIGNATURE</Text>
              <Text style={styles.closingSignatureSub}>Private Client Financial Planning</Text>
              <Text style={[styles.closingSignatureSub, { marginTop: 4 }]}>
                Emissão: {emissionDateFormatted}
              </Text>
            </View>

            <View style={styles.closingSignatureBlock}>
              <Text style={styles.closingSignatureTitle}>REGISTO DO CASAL</Text>
              <Text style={styles.closingSignatureSub}>{clientNames}</Text>
              <Text style={[styles.closingSignatureSub, { marginTop: 4 }]}>
                Data do Casamento: {eventDateFormatted}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.runningFooter} fixed>
          <Text style={styles.runningFooterText}>
            HAXR SIGNATURE · PRIVATE CLIENT EDITION · CONFIDENCIAL
          </Text>
          <Text
            style={styles.runningFooterPage}
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

export default WeddingFinancialReportDocument;
