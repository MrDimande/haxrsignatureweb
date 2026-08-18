import ExcelJS from "exceljs";
import type { NormalizedEventFinancialLedger } from "@/lib/finance/normalized-financial-ledger";

/**
 * Sanitizes a filename to ensure safe download across Windows/Mac/Linux.
 */
export function sanitizeWorkbookFilename(title: string, dateIso?: string | null): string {
  const cleanTitle = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_\-\s]/g, "")
    .trim()
    .replace(/\s+/g, "_");

  const dateSuffix = dateIso ? `_${dateIso.slice(0, 10)}` : `_${new Date().toISOString().slice(0, 10)}`;
  return `HAXR_Wedding_Ledger_${cleanTitle || "Event"}${dateSuffix}.xlsx`;
}

// Brand Luxury Colors
const COLORS = {
  HAXR_BLACK: "FF1C1A17",
  HAXR_GOLD: "FFB88A2A",
  HAXR_GOLD_LIGHT: "FFE3C46B",
  HAXR_CHAMPAGNE: "FFEAD8B8",
  HAXR_IVORY: "FFF7F1E8",
  WHITE: "FFFFFFFF",
  CHARCOAL: "FF2E2A24",
  GRAY_LIGHT: "FFF4EFE6",
  GRAY_BORDER: "FFD8CEBE",
  GREEN_TEXT: "FF1B6A42",
  GREEN_BG: "FFE6F4EC",
  AMBER_TEXT: "FF92400E",
  AMBER_BG: "FFFEF3C7",
  RED_TEXT: "FF991B1B",
  RED_BG: "FFFEE2E2",
};

/**
 * Builds the official, multi-tab HAXR Wedding Financial Book (.xlsx) using ExcelJS.
 */
export async function buildOfficialWeddingLedgerWorkbook(
  ledger: NormalizedEventFinancialLedger,
): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "HAXR Signature · Private Wealth & Wedding Financial Atelier";
  wb.lastModifiedBy = "HAXR Signature Concierge";
  wb.created = new Date();
  wb.modified = new Date();

  const currencySymbol = ledger.currencySymbol || "MT";
  const numFormatCurrency = `#,##0 "${currencySymbol}"`;
  const numFormatPercent = `0.0%`;

  // -------------------------------------------------------------
  // 1. TAB: 01 — Executive Dashboard
  // -------------------------------------------------------------
  const wsDash = wb.addWorksheet("01 — Executive Dashboard", {
    views: [{ showGridLines: true }],
    properties: { tabColor: { argb: COLORS.HAXR_GOLD } },
  });

  wsDash.columns = [
    { width: 4 },  // A (padding)
    { width: 34 }, // B
    { width: 22 }, // C
    { width: 14 }, // D
    { width: 28 }, // E
    { width: 22 }, // F
    { width: 4 },  // G
  ];

  // Header Title
  wsDash.mergeCells("B2:F2");
  const cellTitle = wsDash.getCell("B2");
  cellTitle.value = "HAXR SIGNATURE · THE WEDDING FINANCIAL BOOK";
  cellTitle.font = { name: "Georgia", size: 15, bold: true, color: { argb: COLORS.HAXR_GOLD } };
  cellTitle.alignment = { vertical: "middle", horizontal: "left" };
  wsDash.getRow(2).height = 24;

  wsDash.mergeCells("B3:F3");
  const cellSub = wsDash.getCell("B3");
  cellSub.value = "RELATÓRIO EXECUTIVO & ARQUITECTURA FINANCEIRA PATRIMONIAL";
  cellSub.font = { name: "Calibri", size: 9, bold: true, color: { argb: COLORS.CHARCOAL } };

  // Event Metadata Block (B5:F8)
  wsDash.getCell("B5").value = "Evento / Casal:";
  wsDash.getCell("B5").font = { name: "Calibri", size: 9, bold: true, color: { argb: COLORS.CHARCOAL } };
  wsDash.getCell("C5").value = ledger.eventTitle;
  wsDash.getCell("C5").font = { name: "Georgia", size: 10, bold: true, color: { argb: COLORS.HAXR_BLACK } };

  wsDash.getCell("E5").value = "Data da Celebração:";
  wsDash.getCell("E5").font = { name: "Calibri", size: 9, bold: true, color: { argb: COLORS.CHARCOAL } };
  wsDash.getCell("F5").value = ledger.eventDateFormatted;
  wsDash.getCell("F5").font = { name: "Calibri", size: 10, bold: true };

  wsDash.getCell("B6").value = "Local / Cidade:";
  wsDash.getCell("B6").font = { name: "Calibri", size: 9, bold: true, color: { argb: COLORS.CHARCOAL } };
  wsDash.getCell("C6").value = ledger.context.eventOverview.location;
  wsDash.getCell("C6").font = { name: "Calibri", size: 10 };

  wsDash.getCell("E6").value = "Lotação de Convidados:";
  wsDash.getCell("E6").font = { name: "Calibri", size: 9, bold: true, color: { argb: COLORS.CHARCOAL } };
  wsDash.getCell("F6").value = `${ledger.guestCount} Convidados (Pax)`;
  wsDash.getCell("F6").font = { name: "Calibri", size: 10, bold: true };

  wsDash.getCell("B7").value = "Moeda Base:";
  wsDash.getCell("B7").font = { name: "Calibri", size: 9, bold: true, color: { argb: COLORS.CHARCOAL } };
  wsDash.getCell("C7").value = `${ledger.currency} (${currencySymbol})`;
  wsDash.getCell("C7").font = { name: "Calibri", size: 10 };

  wsDash.getCell("E7").value = "Data de Emissão:";
  wsDash.getCell("E7").font = { name: "Calibri", size: 9, bold: true, color: { argb: COLORS.CHARCOAL } };
  wsDash.getCell("F7").value = new Date().toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" });
  wsDash.getCell("F7").font = { name: "Calibri", size: 10 };

  // Vault KPIs Header
  wsDash.mergeCells("B10:F10");
  const vaultHeader = wsDash.getCell("B10");
  vaultHeader.value = "VAULT FINANCEIRO EXECUTIVO — INDICADORES CONSOLIDADOS";
  vaultHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HAXR_BLACK } };
  vaultHeader.font = { name: "Calibri", size: 9, bold: true, color: { argb: COLORS.HAXR_GOLD } };
  vaultHeader.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  wsDash.getRow(10).height = 22;

  // KPI Rows
  const kpiData = [
    {
      metric: ledger.summary.hasApprovedBudget ? "Orçamento Aprovado (Teto Formal)" : "Orçamento Inicial (Faixa Estimada)",
      val: ledger.summary.budgetCeiling,
      share: 1.0,
      note: ledger.summary.hasApprovedBudget ? "Teto aprovado pelo casal" : "Estimativa inicial de planeamento",
    },
    {
      metric: "Total de Compromissos Contratados",
      val: ledger.summary.contractedAmount,
      share: ledger.summary.budgetCeiling > 0 ? ledger.summary.contractedAmount / ledger.summary.budgetCeiling : 0,
      note: `${ledger.summary.commitmentProgress}% do orçamento comprometido`,
    },
    {
      metric: "Património Já Liquidado (Valor Pago)",
      val: ledger.summary.paidAmount,
      share: ledger.summary.contractedAmount > 0 ? ledger.summary.paidAmount / ledger.summary.contractedAmount : 0,
      note: `${ledger.summary.paymentProgress}% dos contratos liquidados`,
    },
    {
      metric: "Saldo a Liquidar (Compromissos Pendentes)",
      val: ledger.summary.outstandingAmount,
      share: ledger.summary.contractedAmount > 0 ? ledger.summary.outstandingAmount / ledger.summary.contractedAmount : 0,
      note: "Montante necessário para fecho de contratos",
    },
    {
      metric: "Capital por Comprometer (Margem Livre)",
      val: ledger.summary.uncommittedBudget,
      share: ledger.summary.budgetCeiling > 0 ? ledger.summary.uncommittedBudget / ledger.summary.budgetCeiling : 0,
      note: "Disponível para novas contratações",
    },
    {
      metric: "Previsão de Custo Final (Forecast Final)",
      val: ledger.summary.forecastFinalCost,
      share: ledger.summary.budgetCeiling > 0 ? ledger.summary.forecastFinalCost / ledger.summary.budgetCeiling : 0,
      note: "Projeção realista de encerramento",
    },
    {
      metric: "Variação Projectada vs Teto",
      val: ledger.summary.projectedVariance,
      share: null,
      note: ledger.summary.isOverBudget ? "Desvio orçamental / Acima do teto" : "Margem de segurança disponível",
    },
    {
      metric: "Investimento Médio por Convidado",
      val: ledger.summary.costPerGuest,
      share: null,
      note: `${currencySymbol}/Pax baseado na lotação de ${ledger.guestCount} pessoas`,
    },
  ];

  let kpiRow = 11;
  kpiData.forEach((kpi) => {
    wsDash.getCell(`B${kpiRow}`).value = kpi.metric;
    wsDash.getCell(`B${kpiRow}`).font = { name: "Calibri", size: 10, bold: true, color: { argb: COLORS.HAXR_BLACK } };

    const valCell = wsDash.getCell(`C${kpiRow}`);
    valCell.value = kpi.val;
    valCell.numFmt = numFormatCurrency;
    valCell.font = { name: "Calibri", size: 10, bold: true, color: { argb: COLORS.HAXR_BLACK } };
    valCell.alignment = { horizontal: "right" };

    if (kpi.share !== null) {
      const shareCell = wsDash.getCell(`D${kpiRow}`);
      shareCell.value = kpi.share;
      shareCell.numFmt = numFormatPercent;
      shareCell.font = { name: "Calibri", size: 9, color: { argb: COLORS.CHARCOAL } };
      shareCell.alignment = { horizontal: "right" };
    }

    wsDash.mergeCells(`E${kpiRow}:F${kpiRow}`);
    const noteCell = wsDash.getCell(`E${kpiRow}`);
    noteCell.value = kpi.note;
    noteCell.font = { name: "Calibri", size: 9, italic: true, color: { argb: COLORS.CHARCOAL } };

    const isEven = kpiRow % 2 === 0;
    const bgArgb = isEven ? COLORS.GRAY_LIGHT : COLORS.WHITE;
    ["B", "C", "D", "E", "F"].forEach((col) => {
      wsDash.getCell(`${col}${kpiRow}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
      wsDash.getCell(`${col}${kpiRow}`).border = {
        bottom: { style: "thin", color: { argb: COLORS.GRAY_BORDER } },
      };
    });

    wsDash.getRow(kpiRow).height = 20;
    kpiRow++;
  });

  // Category Distribution Section
  kpiRow += 2;
  wsDash.mergeCells(`B${kpiRow}:F${kpiRow}`);
  const catHeader = wsDash.getCell(`B${kpiRow}`);
  catHeader.value = "DISTRIBUIÇÃO ORÇAMENTAL POR CATEGORIA";
  catHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HAXR_BLACK } };
  catHeader.font = { name: "Calibri", size: 9, bold: true, color: { argb: COLORS.HAXR_GOLD } };
  catHeader.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  wsDash.getRow(kpiRow).height = 22;
  kpiRow++;

  // Table Subheaders
  wsDash.getCell(`B${kpiRow}`).value = "Categoria";
  wsDash.getCell(`C${kpiRow}`).value = "Planeado / Previsto";
  wsDash.getCell(`D${kpiRow}`).value = "Contratado";
  wsDash.getCell(`E${kpiRow}`).value = "Liquidado (Pago)";
  wsDash.getCell(`F${kpiRow}`).value = "Saldo Pendente";
  ["B", "C", "D", "E", "F"].forEach((c) => {
    const cell = wsDash.getCell(`${c}${kpiRow}`);
    cell.font = { name: "Calibri", size: 9, bold: true, color: { argb: COLORS.CHARCOAL } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HAXR_CHAMPAGNE } };
  });
  kpiRow++;

  ledger.categories.forEach((cat) => {
    wsDash.getCell(`B${kpiRow}`).value = cat.name;
    wsDash.getCell(`C${kpiRow}`).value = cat.allocated;
    wsDash.getCell(`C${kpiRow}`).numFmt = numFormatCurrency;
    wsDash.getCell(`D${kpiRow}`).value = cat.contracted;
    wsDash.getCell(`D${kpiRow}`).numFmt = numFormatCurrency;
    wsDash.getCell(`E${kpiRow}`).value = cat.paid;
    wsDash.getCell(`E${kpiRow}`).numFmt = numFormatCurrency;
    wsDash.getCell(`F${kpiRow}`).value = cat.balance;
    wsDash.getCell(`F${kpiRow}`).numFmt = numFormatCurrency;

    ["B", "C", "D", "E", "F"].forEach((c) => {
      wsDash.getCell(`${c}${kpiRow}`).border = { bottom: { style: "thin", color: { argb: COLORS.GRAY_BORDER } } };
    });
    kpiRow++;
  });

  // Footer Confidentiality
  kpiRow += 2;
  wsDash.mergeCells(`B${kpiRow}:F${kpiRow}`);
  const confCell = wsDash.getCell(`B${kpiRow}`);
  confCell.value = "HAXR SIGNATURE · DOCUMENTO CONFIDENCIAL RESERVADO AO CASAL E COMISSÃO CREDENCIADA";
  confCell.font = { name: "Calibri", size: 8, italic: true, color: { argb: COLORS.CHARCOAL } };
  confCell.alignment = { horizontal: "center" };

  // -------------------------------------------------------------
  // 2. TAB: 02 — Master Budget
  // -------------------------------------------------------------
  const wsMaster = wb.addWorksheet("02 — Master Budget", {
    views: [{ state: "frozen", ySplit: 3, showGridLines: true }],
    properties: { tabColor: { argb: COLORS.HAXR_BLACK } },
  });

  wsMaster.columns = [
    { header: "Nº", width: 6 },
    { header: "Rubrica / Fornecedor", width: 34 },
    { header: "Categoria", width: 24 },
    { header: "Orçamento Inicial", width: 18 },
    { header: "Proposta Recebida", width: 18 },
    { header: "Valor Contratado", width: 18 },
    { header: "Valor Real / Final", width: 18 },
    { header: "Valor Liquidado", width: 18 },
    { header: "Saldo em Falta", width: 18 },
    { header: "Variação / Poupança", width: 18 },
    { header: "Vencimento", width: 16 },
    { header: "Estado", width: 14 },
    { header: "Notas Operacionais", width: 30 },
  ];

  // Header Title Row
  wsMaster.spliceRows(1, 0, ["HAXR SIGNATURE — MASTER BUDGET LEDGER"]);
  wsMaster.mergeCells("A1:M1");
  const masterTitle = wsMaster.getCell("A1");
  masterTitle.font = { name: "Georgia", size: 12, bold: true, color: { argb: COLORS.WHITE } };
  masterTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HAXR_BLACK } };
  wsMaster.getRow(1).height = 26;

  // Table Headers formatting (Row 3)
  const headerRow = wsMaster.getRow(3);
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.CHARCOAL } };
    cell.font = { name: "Calibri", size: 9, bold: true, color: { argb: COLORS.HAXR_GOLD } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  let masterRowIdx = 4;
  ledger.items.forEach((item, idx) => {
    const row = wsMaster.addRow([
      idx + 1,
      item.vendorOrItem,
      item.category,
      item.initialPlanned,
      item.proposedAmount,
      item.contractedAmount,
      item.actualAmount,
      item.paidAmount,
      item.balance,
      item.variance,
      item.dueDate,
      item.status.toUpperCase(),
      item.notes || "—",
    ]);

    row.height = 20;
    row.getCell(4).numFmt = numFormatCurrency;
    row.getCell(5).numFmt = numFormatCurrency;
    row.getCell(6).numFmt = numFormatCurrency;
    row.getCell(7).numFmt = numFormatCurrency;
    row.getCell(8).numFmt = numFormatCurrency;
    row.getCell(9).numFmt = numFormatCurrency;
    row.getCell(10).numFmt = numFormatCurrency;

    row.eachCell((cell) => {
      cell.border = { bottom: { style: "thin", color: { argb: COLORS.GRAY_BORDER } } };
    });

    masterRowIdx++;
  });

  // Master Total Row
  if (ledger.items.length > 0) {
    const totalRow = wsMaster.addRow([
      "TOTAL",
      "TOTAL GERAL CONSOLIDADO HAXR",
      "",
      { formula: `SUM(D4:D${masterRowIdx - 1})` },
      { formula: `SUM(E4:E${masterRowIdx - 1})` },
      { formula: `SUM(F4:F${masterRowIdx - 1})` },
      { formula: `SUM(G4:G${masterRowIdx - 1})` },
      { formula: `SUM(H4:H${masterRowIdx - 1})` },
      { formula: `SUM(I4:I${masterRowIdx - 1})` },
      { formula: `SUM(J4:J${masterRowIdx - 1})` },
      "",
      "",
      "",
    ]);

    totalRow.height = 24;
    totalRow.eachCell((cell) => {
      cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: COLORS.HAXR_BLACK } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HAXR_CHAMPAGNE } };
      cell.border = { top: { style: "medium" }, bottom: { style: "double" } };
    });
    for (let c = 4; c <= 10; c++) {
      totalRow.getCell(c).numFmt = numFormatCurrency;
    }
  }

  // -------------------------------------------------------------
  // 3. TAB: 03 — Payment Schedule
  // -------------------------------------------------------------
  const wsSched = wb.addWorksheet("03 — Payment Schedule", {
    views: [{ state: "frozen", ySplit: 2, showGridLines: true }],
  });
  wsSched.columns = [
    { header: "Fornecedor / Rubrica", width: 32 },
    { header: "Parcela / Fase", width: 24 },
    { header: "Montante Previsto", width: 20 },
    { header: "Data Vencimento", width: 18 },
    { header: "Data de Liquidação", width: 18 },
    { header: "Estado", width: 16 },
    { header: "Método de Pagamento", width: 22 },
    { header: "Referência / Recibo", width: 24 },
  ];

  wsSched.getRow(1).height = 22;
  wsSched.getRow(1).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HAXR_BLACK } };
    cell.font = { name: "Calibri", size: 9, bold: true, color: { argb: COLORS.HAXR_GOLD } };
  });

  ledger.installments.forEach((inst) => {
    const row = wsSched.addRow([
      inst.vendorOrItem,
      inst.installmentLabel,
      inst.amount,
      inst.dueDate,
      inst.paidAt || "—",
      inst.status.toUpperCase(),
      inst.method || "Transferência Bancária",
      inst.reference || "—",
    ]);
    row.height = 19;
    row.getCell(3).numFmt = numFormatCurrency;
    row.eachCell((cell) => {
      cell.border = { bottom: { style: "thin", color: { argb: COLORS.GRAY_BORDER } } };
    });
  });

  // -------------------------------------------------------------
  // 4. TAB: 04 — Vendors & Contracts
  // -------------------------------------------------------------
  const wsVendors = wb.addWorksheet("04 — Vendors & Contracts", {
    views: [{ state: "frozen", ySplit: 2, showGridLines: true }],
  });
  wsVendors.columns = [
    { header: "Fornecedor Contratado", width: 32 },
    { header: "Categoria de Serviço", width: 24 },
    { header: "Valor Total Acordado", width: 20 },
    { header: "Valor Já Pago", width: 20 },
    { header: "Saldo Pendente", width: 20 },
    { header: "Estado do Contrato", width: 18 },
    { header: "Próxima Ação / Protocolo", width: 34 },
  ];
  wsVendors.getRow(1).height = 22;
  wsVendors.getRow(1).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HAXR_BLACK } };
    cell.font = { name: "Calibri", size: 9, bold: true, color: { argb: COLORS.HAXR_GOLD } };
  });

  ledger.items.forEach((item) => {
    const row = wsVendors.addRow([
      item.vendorOrItem,
      item.category,
      item.contractedAmount > 0 ? item.contractedAmount : item.actualAmount,
      item.paidAmount,
      item.balance,
      item.status === "pago" ? "CONCLUÍDO / PAGO" : (item.contractedAmount > 0 ? "CONTRATO FORMALIZADO" : "EM CURADORIA"),
      item.notes || "Acompanhamento HAXR Signature",
    ]);
    row.height = 19;
    row.getCell(3).numFmt = numFormatCurrency;
    row.getCell(4).numFmt = numFormatCurrency;
    row.getCell(5).numFmt = numFormatCurrency;
    row.eachCell((cell) => {
      cell.border = { bottom: { style: "thin", color: { argb: COLORS.GRAY_BORDER } } };
    });
  });

  // -------------------------------------------------------------
  // 5. TAB: 05 — Cash Flow
  // -------------------------------------------------------------
  const wsCash = wb.addWorksheet("05 — Cash Flow", {
    views: [{ showGridLines: true }],
  });
  wsCash.columns = [
    { header: "Marco Temporal (Milestone)", width: 34 },
    { header: "Proporção (% Alvo)", width: 18 },
    { header: "Previsão de Saída", width: 22 },
    { header: "Valor Já Liquidado", width: 22 },
    { header: "Saldo Pendente do Marco", width: 22 },
    { header: "Objetivo Operacional", width: 40 },
  ];
  wsCash.getRow(1).height = 22;
  wsCash.getRow(1).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HAXR_BLACK } };
    cell.font = { name: "Calibri", size: 9, bold: true, color: { argb: COLORS.HAXR_GOLD } };
  });

  const totalContracted = ledger.summary.contractedAmount > 0 ? ledger.summary.contractedAmount : ledger.summary.budgetCeiling;
  const totalPaid = ledger.summary.paidAmount;

  const phase1Target = Math.round(totalContracted * 0.30);
  const phase1Paid = Math.min(totalPaid, phase1Target);

  const phase2Target = Math.round(totalContracted * 0.40);
  const phase2Paid = Math.min(Math.max(0, totalPaid - phase1Target), phase2Target);

  const phase3Target = Math.round(totalContracted * 0.30);
  const phase3Paid = Math.min(Math.max(0, totalPaid - phase1Target - phase2Target), phase3Target);

  const cashMilestones = [
    { name: "Fase 1: Sinais de Bloqueio (Imediato)", pct: 0.30, target: phase1Target, paid: phase1Paid, desc: "Garante exclusividade de data com fornecedores nobres." },
    { name: "Fase 2: Reforço de Produção (90 Dias)", pct: 0.40, target: phase2Target, paid: phase2Paid, desc: "Aquisição de botânica, tecidos, menus e montagem cénica." },
    { name: "Fase 3: Liquidação Final (Semana do Evento)", pct: 0.30, target: phase3Target, paid: phase3Paid, desc: "Fecho final de contas operacionais e geradores de apoio." },
  ];

  cashMilestones.forEach((m) => {
    const row = wsCash.addRow([
      m.name,
      m.pct,
      m.target,
      m.paid,
      Math.max(0, m.target - m.paid),
      m.desc,
    ]);
    row.height = 20;
    row.getCell(2).numFmt = numFormatPercent;
    row.getCell(3).numFmt = numFormatCurrency;
    row.getCell(4).numFmt = numFormatCurrency;
    row.getCell(5).numFmt = numFormatCurrency;
    row.eachCell((cell) => {
      cell.border = { bottom: { style: "thin", color: { argb: COLORS.GRAY_BORDER } } };
    });
  });

  // -------------------------------------------------------------
  // 6. TAB: 06 — Variations & Extras
  // -------------------------------------------------------------
  const wsVar = wb.addWorksheet("06 — Variations & Extras", { views: [{ showGridLines: true }] });
  wsVar.columns = [
    { header: "Rubrica / Item Modificado", width: 30 },
    { header: "Tipo de Variação", width: 22 },
    { header: "Orçamento Inicial", width: 18 },
    { header: "Valor Ajustado", width: 18 },
    { header: "Diferencial", width: 18 },
    { header: "Justificação & Autorização", width: 34 },
  ];
  wsVar.getRow(1).height = 22;
  wsVar.getRow(1).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HAXR_BLACK } };
    cell.font = { name: "Calibri", size: 9, bold: true, color: { argb: COLORS.HAXR_GOLD } };
  });

  ledger.items.filter((i) => i.variance !== 0).forEach((item) => {
    const row = wsVar.addRow([
      item.vendorOrItem,
      item.variance > 0 ? "Poupança Negociada" : "Upgrade / Acréscimo",
      item.initialPlanned,
      item.actualAmount,
      item.variance,
      "Validação de Curadoria HAXR Signature",
    ]);
    row.height = 19;
    row.getCell(3).numFmt = numFormatCurrency;
    row.getCell(4).numFmt = numFormatCurrency;
    row.getCell(5).numFmt = numFormatCurrency;
  });

  // -------------------------------------------------------------
  // 7. TAB: 07 — Wedding Day Payments
  // -------------------------------------------------------------
  const wsDay = wb.addWorksheet("07 — Wedding Day Payments", { views: [{ showGridLines: true }] });
  wsDay.columns = [
    { header: "Destinatário / Fornecedor", width: 30 },
    { header: "Finalidade", width: 24 },
    { header: "Montante a Entregar", width: 20 },
    { header: "Responsável pela Entrega", width: 24 },
    { header: "Formato / Envelope", width: 20 },
    { header: "Rubrica de Confirmação", width: 26 },
  ];
  wsDay.getRow(1).height = 22;
  wsDay.getRow(1).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HAXR_BLACK } };
    cell.font = { name: "Calibri", size: 9, bold: true, color: { argb: COLORS.HAXR_GOLD } };
  });

  wsDay.addRow(["Coordenadora de Protocolo HAXR", "Fundo de Manobra do Dia", 15000, "Assessora Responsável", "Numerário em Envelope Selado", "Assinatura no Local"]).getCell(3).numFmt = numFormatCurrency;
  wsDay.addRow(["Equipa de Som & Músicos", "Gratificações de Performance", 10000, "Chefe de Cerimonial", "Numerário em Envelope Selado", "Assinatura no Local"]).getCell(3).numFmt = numFormatCurrency;

  // -------------------------------------------------------------
  // 8. TAB: 08 — Savings & Negotiations
  // -------------------------------------------------------------
  const wsSav = wb.addWorksheet("08 — Savings & Negotiations", { views: [{ showGridLines: true }] });
  wsSav.columns = [
    { header: "Fornecedor / Categoria", width: 32 },
    { header: "Proposta Original de Tabela", width: 22 },
    { header: "Valor Negociado HAXR", width: 22 },
    { header: "Poupança Gerada", width: 20 },
    { header: "% Poupança", width: 16 },
  ];
  wsSav.getRow(1).height = 22;
  wsSav.getRow(1).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HAXR_BLACK } };
    cell.font = { name: "Calibri", size: 9, bold: true, color: { argb: COLORS.HAXR_GOLD } };
  });

  ledger.items.forEach((item) => {
    const prop = item.proposedAmount > 0 ? item.proposedAmount : item.initialPlanned;
    const finalVal = item.contractedAmount > 0 ? item.contractedAmount : item.actualAmount;
    const saving = Math.max(0, prop - finalVal);
    if (saving > 0) {
      const row = wsSav.addRow([
        item.vendorOrItem,
        prop,
        finalVal,
        saving,
        prop > 0 ? saving / prop : 0,
      ]);
      row.height = 19;
      row.getCell(2).numFmt = numFormatCurrency;
      row.getCell(3).numFmt = numFormatCurrency;
      row.getCell(4).numFmt = numFormatCurrency;
      row.getCell(5).numFmt = numFormatPercent;
    }
  });

  // -------------------------------------------------------------
  // 9. TAB: 09 — Financial Notes
  // -------------------------------------------------------------
  const wsNotes = wb.addWorksheet("09 — Financial Notes", { views: [{ showGridLines: true }] });
  wsNotes.columns = [
    { header: "Secção de Auditoria", width: 26 },
    { header: "Directrizes & Notas de Tesouraria HAXR Signature", width: 70 },
  ];
  wsNotes.getRow(1).height = 22;
  wsNotes.getRow(1).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HAXR_BLACK } };
    cell.font = { name: "Calibri", size: 9, bold: true, color: { argb: COLORS.HAXR_GOLD } };
  });

  const notes = [
    ["1. Validação de Faturas", "Todos os pagamentos a fornecedores devem ser efetuados contra emissão de fatura/recibo formal."],
    ["2. Gestão de Contingência", "O fundo de contingência só deve ser movimentado mediante validação prévia entre o casal e a assessora HAXR."],
    ["3. Prazos de Liquidação", "Nenhum fornecedor essencial deve entrar no dia da montagem com mais de 10% de saldo por liquidar."],
    ["4. Protocolo de Assinatura", "Relatório oficial auditado pela HAXR Signature · Maputo, Moçambique."],
  ];

  notes.forEach(([sec, txt]) => {
    const row = wsNotes.addRow([sec, txt]);
    row.height = 24;
    row.getCell(1).font = { bold: true };
  });

  return wb;
}

/**
 * Downloads the official Excel workbook directly in the client browser.
 */
export async function downloadOfficialWeddingLedger(
  ledger: NormalizedEventFinancialLedger,
): Promise<void> {
  const wb = await buildOfficialWeddingLedgerWorkbook(ledger);
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = sanitizeWorkbookFilename(ledger.eventTitle, ledger.eventDateIso);
  link.click();
  URL.revokeObjectURL(url);
}
