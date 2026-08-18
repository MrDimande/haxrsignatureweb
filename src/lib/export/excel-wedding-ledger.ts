import * as XLSX from "xlsx";

export interface LedgerExpense {
  name: string;
  category: string;
  planned: number;
  paid: number;
  status: "Pendente" | "Sinalizado" | "Pago";
}

export interface LedgerExportOptions {
  totalBudget: number;
  guestCount: number;
  currency: string;
  currencySymbol: string;
  rateFromMzn: number;
  prestigeTierTitle: string;
  prestigeTierBadge: string;
  expenses: LedgerExpense[];
  eventName?: string;
  exportDate?: string;
}

export function buildWeddingLedgerWorkbook(options: LedgerExportOptions): XLSX.WorkBook {
  const {
    totalBudget,
    guestCount,
    currency,
    currencySymbol,
    rateFromMzn,
    prestigeTierTitle,
    prestigeTierBadge,
    expenses,
    eventName = "Casamento Privado",
    exportDate = new Date().toLocaleDateString("pt-MZ", { year: "numeric", month: "long", day: "numeric" }),
  } = options;

  const wb = XLSX.utils.book_new();

  const totalPlanned = expenses.reduce((acc, curr) => acc + curr.planned, 0);
  const totalPaid = expenses.reduce((acc, curr) => acc + curr.paid, 0);
  const totalRemaining = totalPlanned - totalPaid;
  const costPerGuest = guestCount > 0 ? Math.round(totalPlanned / guestCount) : 0;
  const variance = totalBudget - totalPlanned;
  const isOverBudget = variance < 0;

  const conv = (mznAmount: number) => Math.round(mznAmount * rateFromMzn);

  // --- SHEET 1: DASHBOARD & BALANÇO GERAL ---
  const dashboardRows: (string | number)[][] = [
    ["HAXR SIGNATURE · PRIVATE WEALTH & WEDDING FINANCIAL ATELIER"],
    ["RELATÓRIO EXECUTIVO & LIVRO DE REGISTRO ORÇAMENTAL"],
    [""],
    ["DADOS DA CELEBRAÇÃO", "", "DATA DE EMISSÃO", exportDate],
    ["Evento:", eventName, "Moeda Base:", `${currency} (${currencySymbol})`],
    ["Lotação Estimada:", `${guestCount} Convidados (Pax)`, "Índice de Prestígio:", `${prestigeTierTitle} [${prestigeTierBadge}]`],
    [""],
    ["════════════════════════════════════════════════════════════════════════════════════════════════════"],
    ["DASHBOARD DE ALTA GESTÃO FINANCEIRA"],
    ["INDICADOR", "VALOR (" + currency + ")", "PERCENTUAL", "OBSERVAÇÃO ESTRATÉGICA"],
    [
      "Teto Global Estipulado",
      conv(totalBudget),
      "100.0%",
      "Limite de capital definido pelo casal"
    ],
    [
      "Custos Comprometidos (Total)",
      conv(totalPlanned),
      `${((totalPlanned / (totalBudget || 1)) * 100).toFixed(1)}%`,
      isOverBudget ? `ATENÇÃO: Excedido em ${conv(Math.abs(variance))} ${currencySymbol}` : `Margem livre: ${conv(variance)} ${currencySymbol}`
    ],
    [
      "Património Já Liquidado (Pago)",
      conv(totalPaid),
      `${totalPlanned > 0 ? ((totalPaid / totalPlanned) * 100).toFixed(1) : 0}%`,
      "Valores já transferidos e sinalizados"
    ],
    [
      "Saldo Pendente de Liquidação",
      conv(totalRemaining),
      `${totalPlanned > 0 ? ((totalRemaining / totalPlanned) * 100).toFixed(1) : 0}%`,
      "Montante necessário para fecho de contratos"
    ],
    [
      "Investimento Médio por Convidado",
      conv(costPerGuest),
      "-",
      `Nível de experiência: ${prestigeTierBadge}`
    ],
    [""],
    ["════════════════════════════════════════════════════════════════════════════════════════════════════"],
    ["RITMO DE FLUXO DE CAIXA (CASH-FLOW SCHEDULE 30 · 40 · 30)"],
    ["FASE", "META PREVISTA (" + currency + ")", "LIQUIDADO (" + currency + ")", "ESTADO OPERACIONAL"],
    [
      "Fase 1: Sinais de Bloqueio (30% Imediato)",
      conv(Math.round(totalPlanned * 0.3)),
      conv(Math.min(totalPaid, Math.round(totalPlanned * 0.3))),
      totalPaid >= Math.round(totalPlanned * 0.3) ? "Concluído" : "Em Progresso"
    ],
    [
      "Fase 2: Reforço de Produção (40% a 90 Dias)",
      conv(Math.round(totalPlanned * 0.4)),
      conv(Math.min(Math.max(0, totalPaid - Math.round(totalPlanned * 0.3)), Math.round(totalPlanned * 0.4))),
      totalPaid >= Math.round(totalPlanned * 0.7) ? "Concluído" : "Pendente"
    ],
    [
      "Fase 3: Liquidação Final (30% na Semana)",
      conv(Math.round(totalPlanned * 0.3)),
      conv(Math.min(Math.max(0, totalPaid - Math.round(totalPlanned * 0.7)), Math.round(totalPlanned * 0.3))),
      totalPaid >= totalPlanned ? "Concluído" : "Aguardando Semana do Evento"
    ],
    [""],
    ["════════════════════════════════════════════════════════════════════════════════════════════════════"],
    ["LIVRO DE REGISTRO DETALHADO DE CONTRATOS & RUBRICAS"],
    ["ITEM / FORNECEDOR", "CATEGORIA", "VALOR PLANEADO (" + currency + ")", "VALOR PAGO (" + currency + ")", "SALDO A PAGAR (" + currency + ")", "ESTADO DO CONTRATO", "% LIQUIDADO"]
  ];

  // Append expenses rows
  expenses.forEach((exp) => {
    const plannedConv = conv(exp.planned);
    const paidConv = conv(exp.paid);
    const remConv = plannedConv - paidConv;
    const pctPaid = plannedConv > 0 ? `${((paidConv / plannedConv) * 100).toFixed(0)}%` : "0%";

    dashboardRows.push([
      exp.name,
      exp.category,
      plannedConv,
      paidConv,
      remConv,
      exp.status,
      pctPaid,
    ]);
  });

  // Total Summary row
  dashboardRows.push([
    "TOTAL GERAL HAXR",
    "TODAS AS RUBRICAS",
    conv(totalPlanned),
    conv(totalPaid),
    conv(totalRemaining),
    isOverBudget ? "DESVIO DE ORÇAMENTO" : "DENTRO DO TETO",
    `${totalPlanned > 0 ? ((totalPaid / totalPlanned) * 100).toFixed(0) : 0}%`,
  ]);

  dashboardRows.push([""]);
  dashboardRows.push(["════════════════════════════════════════════════════════════════════════════════════════════════════"]);
  dashboardRows.push(["PROTOCOLO DE AUDITORIA & ASSINATURA HAXR SIGNATURE"]);
  dashboardRows.push(["Emitido por:", "HAXR Signature · Private Wealth & Wedding Atelier", "Website:", "https://www.haxrsignature.com"]);
  dashboardRows.push(["Concierge Privado:", "+258 87 088 3428", "Localização:", "Maputo, Moçambique"]);
  dashboardRows.push(["Aviso de Confidencialidade:", "Este balanço financeiro é reservado exclusivamente aos noivos e à comissão organizadora credenciada."]);

  const ws = XLSX.utils.aoa_to_sheet(dashboardRows);

  // Set column widths for elegant readability in Excel
  ws["!cols"] = [
    { wch: 45 }, // A: Item / Nome
    { wch: 30 }, // B: Categoria
    { wch: 24 }, // C: Planeado
    { wch: 24 }, // D: Pago
    { wch: 24 }, // E: Saldo
    { wch: 24 }, // F: Estado
    { wch: 18 }, // G: % Liquidado
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Balanço HAXR Signature");

  return wb;
}

export function downloadWeddingLedgerExcel(options: LedgerExportOptions): void {
  const wb = buildWeddingLedgerWorkbook(options);
  const fileName = `HAXR_Signature_Wedding_Ledger_${options.currency}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName, { bookType: "xlsx" });
}
