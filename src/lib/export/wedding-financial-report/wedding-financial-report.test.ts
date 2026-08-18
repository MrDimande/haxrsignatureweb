import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PDFParse } from "pdf-parse";
import type { NormalizedEventFinancialLedger } from "@/lib/finance/wedding-financial-engine";
import {
  formatReportCurrency,
  formatReportPercent,
  generateWeddingFinancialReportFilename,
  safeReportText,
} from "./report-formatters";
import {
  classifyPaymentsAndContractualPosition,
  extractNegotiatedSavings,
} from "./report-insights";
import { generateWeddingFinancialReportBuffer } from "./pdf-generator";
import { handleClientEventFinancialReportRequest } from "@/lib/payments/client-event-payments-api";
import type { ClientEventPaymentsAuthClient } from "@/lib/payments/client-event-payments-service";

// ═══════════════════════════════════════════════════════════════════
// FIXTURES
// ═══════════════════════════════════════════════════════════════════

function createLeilaArmandoLedger(): NormalizedEventFinancialLedger {
  const items = [
    {
      id: "v-catering",
      categoryId: "cat-1",
      category: "Catering & Bar",
      vendorOrItem: "Chef Silva Catering",
      initialPlanned: 500000,
      proposedAmount: 500000,
      contractedAmount: 470000,
      actualAmount: 470000,
      paidAmount: 200000,
      balance: 270000,
      variance: 30000,
      dueDate: "Conforme Contrato",
      dueDateIso: "2026-10-01",
      status: "parcial" as const,
      notes: "Degustação aprovada. Falta pagamento da 2ª tranche.",
    },
    {
      id: "v-venue",
      categoryId: "cat-2",
      category: "Espaço",
      vendorOrItem: "Catembe Gallery Hotel",
      initialPlanned: 330000,
      proposedAmount: 330000,
      contractedAmount: 330000,
      actualAmount: 330000,
      paidAmount: 150000,
      balance: 180000,
      variance: 0,
      dueDate: "Conforme Contrato",
      dueDateIso: "2026-10-15",
      status: "parcial" as const,
      notes: "Sinal pago.",
    },
  ];

  return {
    context: {
      eventId: "ce-leila-armando-2026",
      currency: "MZN",
      eventOverview: {
        id: "ce-leila-armando-2026",
        name: "Casamento Leila & Armando",
        type: "Casamento",
        date: "14 de Novembro de 2026",
        location: "Catembe Gallery Hotel, Maputo",
        status: "Em planeamento",
        slug: "leila-armando-2026",
      },
    },
    summary: {
      budgetCeiling: 1200000,
      approvedBudget: 1200000,
      contractedAmount: 800000,
      paidAmount: 350000,
      outstandingAmount: 450000,
      uncommittedBudget: 400000,
      forecastFinalCost: 980000,
      projectedVariance: 220000,
      totalCommitted: 800000,
      executionRate: 43.75,
      commitmentRate: 66.67,
      costPerGuest: 4900,
      nextPayment: {
        vendorName: "Chef Silva Catering",
        dueDate: "01/10/2026",
        amount: 150000,
      },
    },
    categories: [
      {
        name: "Catering & Bar",
        allocated: 500000,
        contracted: 470000,
        paid: 200000,
        balance: 270000,
        itemCount: 1,
        shareOfTotal: 58.75,
      },
      {
        name: "Espaço",
        allocated: 330000,
        contracted: 330000,
        paid: 150000,
        balance: 180000,
        itemCount: 1,
        shareOfTotal: 41.25,
      },
    ],
    items,
    installments: [
      {
        id: "inst-1",
        vendorOrItem: "Chef Silva Catering",
        category: "Catering & Bar",
        amount: 200000,
        dueDate: "01/08/2026",
        dueDateIso: "2026-08-01",
        status: "pago",
      },
      {
        id: "inst-2",
        vendorOrItem: "Chef Silva Catering",
        category: "Catering & Bar",
        amount: 270000,
        dueDate: "01/10/2026",
        dueDateIso: "2026-10-01",
        status: "pendente",
      },
      {
        id: "inst-3",
        vendorOrItem: "Catembe Gallery Hotel",
        category: "Espaço",
        amount: 180000,
        dueDate: "15/10/2026",
        dueDateIso: "2026-10-15",
        status: "pendente",
      },
    ],
    recentPayments: [
      {
        id: "p-1",
        vendorOrItem: "Chef Silva Catering",
        amount: 200000,
        paidAt: "2026-08-01T10:00:00Z",
        paidAtLabel: "1 ago 2026",
        method: "Transferência Bancária",
        vendorId: "v-catering",
      },
      {
        id: "p-2",
        vendorOrItem: "Catembe Gallery Hotel",
        amount: 150000,
        paidAt: "2026-08-05T14:30:00Z",
        paidAtLabel: "5 ago 2026",
        method: "M-Pesa",
        vendorId: "v-venue",
      },
    ],
    clientNames: "Leila & Armando",
    eventTitle: "Casamento Leila & Armando",
    eventDateFormatted: "14 de Novembro de 2026",
    eventDateIso: "2026-11-14",
    eventLocation: "Catembe Gallery Hotel, Maputo",
    guestCount: 200,
    currency: "MZN",
    currencySymbol: "MT",
  };
}

function createEmptyLedger(): NormalizedEventFinancialLedger {
  return {
    context: {
      eventId: "ce-empty-2026",
      currency: "MZN",
      eventOverview: {
        id: "ce-empty-2026",
        name: "Casamento Sem Dados",
        type: "Casamento",
        date: "Data por definir",
        location: "Local por definir",
        status: "Em planeamento",
        slug: "empty-2026",
      },
    },
    summary: {
      budgetCeiling: 0,
      approvedBudget: null,
      contractedAmount: 0,
      paidAmount: 0,
      outstandingAmount: 0,
      uncommittedBudget: 0,
      forecastFinalCost: 0,
      projectedVariance: 0,
      totalCommitted: 0,
      executionRate: 0,
      commitmentRate: 0,
      costPerGuest: 0,
      nextPayment: null,
    },
    categories: [],
    items: [],
    installments: [],
    recentPayments: [],
    clientNames: "Cliente Não Registado",
    eventTitle: "Casamento Sem Dados",
    eventDateFormatted: "Data por definir",
    eventDateIso: null,
    eventLocation: "Local por definir",
    guestCount: 0,
    currency: "MZN",
    currencySymbol: "MT",
  };
}

// ═══════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════

describe("HAXR Wedding Financial Report (PDF System)", () => {
  it("A. Paridade Financeira: métricas canónicas coincidem com a fixture Leila & Armando", () => {
    const ledger = createLeilaArmandoLedger();

    assert.equal(ledger.summary.budgetCeiling, 1200000);
    assert.equal(ledger.summary.contractedAmount, 800000);
    assert.equal(ledger.summary.paidAmount, 350000);
    assert.equal(ledger.summary.outstandingAmount, 450000);
    assert.equal(ledger.summary.forecastFinalCost, 980000);
    assert.equal(ledger.summary.projectedVariance, 220000);
    assert.equal(ledger.summary.costPerGuest, 4900);
    assert.equal(ledger.guestCount, 200);
  });

  it("B. Negotiation & Savings: derivação estrita de poupanças negociadas reais", () => {
    const ledger = createLeilaArmandoLedger();
    const { savingsList, totalSavingsGenerated } = extractNegotiatedSavings(ledger.items);

    assert.equal(savingsList.length, 1);
    assert.equal(savingsList[0].vendorOrItem, "Chef Silva Catering");
    assert.equal(savingsList[0].proposedAmount, 500000);
    assert.equal(savingsList[0].contractedAmount, 470000);
    assert.equal(savingsList[0].saving, 30000);
    assert.equal(savingsList[0].savingPercentage, 6);
    assert.equal(totalSavingsGenerated, 30000);

    // Itens sem proposed > contracted não entram como poupança
    const itemWithoutSaving = {
      id: "v-test",
      category: "Decoração",
      vendorOrItem: "Deco Pro",
      initialPlanned: 100000,
      proposedAmount: 0,
      contractedAmount: 80000,
      actualAmount: 80000,
      paidAmount: 0,
      balance: 80000,
      variance: 20000,
      dueDate: "Conforme Contrato",
      status: "pendente" as const,
    };
    const { savingsList: filteredSavings } = extractNegotiatedSavings([itemWithoutSaving]);
    assert.equal(filteredSavings.length, 0);
  });

  it("C. Formatação e Geração de Nome de Ficheiro Sanitizado", () => {
    const ledger = createLeilaArmandoLedger();
    const filename = generateWeddingFinancialReportFilename(ledger);
    assert.equal(filename, "HAXR_Wedding_Financial_Report_Leila_Armando_2026-11-14.pdf");

    // Evento sem data no ISO
    const noDateLedger = { ...ledger, eventDateIso: null, clientNames: "Jéssica & Flávio" };
    const noDateFilename = generateWeddingFinancialReportFilename(noDateLedger);
    assert.equal(noDateFilename, "HAXR_Wedding_Financial_Report_Jessica_Flavio.pdf");

    // Formatação monetária
    assert.equal(formatReportCurrency(1200000, "MT"), "1.200.000 MT");
    assert.equal(formatReportCurrency(0, "MT"), "0 MT");
    assert.equal(formatReportCurrency(null, "MT"), "0 MT");

    // Formatação de percentagem
    assert.equal(formatReportPercent(6), "6,0%");
    assert.equal(formatReportPercent(43.75), "43,8%");
    assert.equal(formatReportPercent(null), "0,0%");

    // Sanitização de texto
    assert.equal(safeReportText("Catembe"), "Catembe");
    assert.equal(safeReportText(null), "—");
    assert.equal(safeReportText(undefined), "—");
    assert.equal(safeReportText("NaN"), "—");
    assert.equal(safeReportText("Invalid Date"), "—");
  });

  it("D. Classificação rigorosa de Payments & Contractual Position", () => {
    const ledger = createLeilaArmandoLedger();
    const { installments, totalScheduled, totalOverdue, totalUpcoming30Days } =
      classifyPaymentsAndContractualPosition(ledger, "2026-09-01");

    assert.equal(installments.length, 3);
    assert.equal(installments[0].status, "liquidado");
    assert.equal(totalScheduled, 450000); // 270000 + 180000
    assert.equal(totalOverdue, 0);
    assert.equal(totalUpcoming30Days, 270000); // 2026-10-01 é 30 dias após 2026-09-01
  });

  it("E. Geração de PDF Buffer e Text Safety via pdf-parse", async () => {
    const ledger = createLeilaArmandoLedger();
    const buffer = await generateWeddingFinancialReportBuffer(ledger, {
      generatedAt: "2026-08-18T20:00:00Z",
    });

    assert.ok(buffer instanceof Buffer, "Deve retornar um Buffer válido");
    assert.ok(buffer.length > 1000, "Buffer deve conter dados de PDF");

    const parser = new PDFParse({ data: buffer });
    const res = await parser.getText();
    const pdfText = res.text;
    await parser.destroy();

    // Asserções de conteúdo editorial e financeiro
    assert.ok(pdfText.includes("HAXR SIGNATURE"), "Deve conter a marca HAXR SIGNATURE");
    assert.ok(pdfText.includes("THE WEDDING"), "Deve conter o título THE WEDDING");
    assert.ok(pdfText.includes("FINANCIAL REPORT"), "Deve conter FINANCIAL REPORT");
    assert.ok(pdfText.includes("Leila & Armando"), "Deve conter o nome do casal");
    assert.ok(pdfText.includes("1.200.000 MT"), "Deve conter o orçamento de 1.200.000 MT");
    assert.ok(pdfText.includes("800.000 MT"), "Deve conter o contratado de 800.000 MT");
    assert.ok(pdfText.includes("350.000 MT"), "Deve conter o pago de 350.000 MT");
    assert.ok(pdfText.includes("450.000 MT"), "Deve conter o saldo de 450.000 MT");
    assert.ok(pdfText.includes("30.000 MT"), "Deve conter a poupança gerada de 30.000 MT");
    assert.ok(pdfText.includes("Chef Silva Catering"), "Deve conter o fornecedor Chef Silva Catering");

    // Zero Mock e Zero Glitch Assertions
    assert.ok(!pdfText.includes("undefined"), "Não pode conter a palavra 'undefined'");
    assert.ok(!pdfText.includes("null"), "Não pode conter a palavra 'null'");
    assert.ok(!pdfText.includes("NaN"), "Não pode conter a palavra 'NaN'");
    assert.ok(!pdfText.includes("Invalid Date"), "Não pode conter 'Invalid Date'");
    assert.ok(!pdfText.includes("[object Object]"), "Não pode conter '[object Object]'");
    assert.ok(!pdfText.includes("15.000"), "Não pode conter valores fictícios demo como 15.000");
    assert.ok(!pdfText.includes("10.000"), "Não pode conter valores fictícios demo como 10.000");
  });

  it("F. Empty Event: evento sem fornecedores ou pagamentos gera PDF limpo e válido", async () => {
    const emptyLedger = createEmptyLedger();
    const buffer = await generateWeddingFinancialReportBuffer(emptyLedger);

    assert.ok(buffer instanceof Buffer);
    assert.ok(buffer.length > 500);

    const parser = new PDFParse({ data: buffer });
    const res = await parser.getText();
    const pdfText = res.text;
    await parser.destroy();

    assert.ok(pdfText.includes("HAXR SIGNATURE"));
    assert.ok(pdfText.includes("Cliente Não Registado"));
    assert.ok(pdfText.includes("Sem categorias ativas") || pdfText.includes("Sem fornecedores registados"));
    assert.ok(!pdfText.includes("undefined"));
    assert.ok(!pdfText.includes("NaN"));
    assert.ok(!pdfText.includes("Invalid Date"));
  });

  it("G. Large Event: evento com 40+ itens gera PDF multipágina com sucesso", async () => {
    const largeItems = Array.from({ length: 45 }, (_, i) => ({
      id: `item-${i + 1}`,
      categoryId: `cat-${(i % 5) + 1}`,
      category: `Categoria ${(i % 5) + 1}`,
      vendorOrItem: `Fornecedor Premium de Eventos nº ${i + 1}`,
      initialPlanned: 50000 + i * 2000,
      proposedAmount: 50000 + i * 2000,
      contractedAmount: 48000 + i * 2000,
      actualAmount: 48000 + i * 2000,
      paidAmount: 20000 + i * 1000,
      balance: 28000 + i * 1000,
      variance: 2000,
      dueDate: "Conforme Contrato",
      dueDateIso: "2026-11-01",
      status: "parcial" as const,
      notes: `Item de teste ${i + 1}`,
    }));

    const largeLedger: NormalizedEventFinancialLedger = {
      ...createLeilaArmandoLedger(),
      items: largeItems,
    };

    const buffer = await generateWeddingFinancialReportBuffer(largeLedger);
    assert.ok(buffer instanceof Buffer);

    const parser = new PDFParse({ data: buffer });
    const res = await parser.getText();
    const pdfText = res.text;
    const numpages = res.total;
    await parser.destroy();

    assert.ok(numpages >= 6, "Deve conter pelo menos 6 páginas com a tabela contínua");
    assert.ok(!pdfText.includes("undefined"));
    assert.ok(!pdfText.includes("NaN"));
  });

  it("H. Segurança e Autorização do API Handler", async () => {
    // 1. Rejeição de eventos demo/mock
    const mockRes = await handleClientEventFinancialReportRequest({
      envCheck: { ok: true },
      serviceRoleCheck: { ok: true },
      user: { id: "u-123" },
      eventId: "demo-event",
      authClient: {} as ClientEventPaymentsAuthClient,
    });
    assert.equal(mockRes.status, 404);

    // 2. Rejeição sem utilizador autenticado
    const unauthRes = await handleClientEventFinancialReportRequest({
      envCheck: { ok: true },
      serviceRoleCheck: { ok: true },
      user: null,
      eventId: "ce-real-123",
      authClient: {} as ClientEventPaymentsAuthClient,
    });
    assert.equal(unauthRes.status, 401);

    // 3. Rejeição por ambiente indisponível
    const envErrRes = await handleClientEventFinancialReportRequest({
      envCheck: { ok: false, message: "Missing SUPABASE_URL" },
      serviceRoleCheck: { ok: true },
      user: { id: "u-123" },
      eventId: "ce-real-123",
      authClient: {} as ClientEventPaymentsAuthClient,
    });
    assert.equal(envErrRes.status, 503);
  });
});
