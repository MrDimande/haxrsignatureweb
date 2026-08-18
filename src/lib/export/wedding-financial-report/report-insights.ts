import type {
  ClassifiedInstallment,
  MasterBudgetItem,
  NegotiatedSavingItem,
  NormalizedEventFinancialLedger,
  VendorExposureItem,
} from "./report-types";

/**
 * Extrai poupanças negociadas reais estritas:
 * Apenas quando proposedAmount > 0 AND contractedAmount > 0 AND proposedAmount > contractedAmount.
 */
export function extractNegotiatedSavings(
  items: MasterBudgetItem[],
): {
  savingsList: NegotiatedSavingItem[];
  totalSavingsGenerated: number;
} {
  const savingsList: NegotiatedSavingItem[] = [];

  for (const item of items) {
    const proposed = item.proposedAmount || 0;
    const contracted = item.contractedAmount || 0;

    if (proposed > 0 && contracted > 0 && proposed > contracted) {
      const saving = proposed - contracted;
      const savingPercentage = (saving / proposed) * 100;

      savingsList.push({
        id: item.id,
        category: item.category,
        vendorOrItem: item.vendorOrItem,
        proposedAmount: proposed,
        contractedAmount: contracted,
        saving,
        savingPercentage,
      });
    }
  }

  const totalSavingsGenerated = savingsList.reduce((acc, s) => acc + s.saving, 0);

  return {
    savingsList,
    totalSavingsGenerated,
  };
}

/**
 * Extrai a exposição contratual de fornecedores ordenada por valor contratado.
 */
export function extractVendorExposures(
  items: MasterBudgetItem[],
): VendorExposureItem[] {
  const exposures: VendorExposureItem[] = items
    .filter((item) => item.contractedAmount > 0 || item.paidAmount > 0)
    .map((item) => {
      const percentPaid =
        item.contractedAmount > 0
          ? Math.min(100, (item.paidAmount / item.contractedAmount) * 100)
          : item.paidAmount > 0
          ? 100
          : 0;

      return {
        id: item.id,
        name: item.vendorOrItem,
        category: item.category,
        contractedAmount: item.contractedAmount,
        paidAmount: item.paidAmount,
        balance: item.balance,
        percentPaid,
        status: item.status,
      };
    })
    .sort((a, b) => b.contractedAmount - a.contractedAmount);

  return exposures;
}

/**
 * Classifica a posição de pagamentos e parcelas contratuais.
 * Trata datas com rigor: "Conforme Contrato" nunca é classificado como vencimento datado.
 */
export function classifyPaymentsAndContractualPosition(
  ledger: NormalizedEventFinancialLedger,
  nowIso = new Date().toISOString().split("T")[0],
): {
  installments: ClassifiedInstallment[];
  totalScheduled: number;
  totalOverdue: number;
  totalUpcoming30Days: number;
} {
  const result: ClassifiedInstallment[] = [];
  let totalOverdue = 0;
  let totalUpcoming30Days = 0;

  // Processa parcelas / pagamentos do ledger
  for (const inst of ledger.installments) {
    const isDated = Boolean(inst.dueDateIso && /^\d{4}-\d{2}-\d{2}/.test(inst.dueDateIso));
    let status: ClassifiedInstallment["status"] = "a_programar";

    if (inst.status === "pago") {
      status = "liquidado";
    } else if (isDated && inst.dueDateIso) {
      if (inst.dueDateIso < nowIso) {
        status = "vencido";
        totalOverdue += inst.amount;
      } else {
        status = "a_vencer";
        // Check se é nos próximos 30 dias
        const nowDate = new Date(nowIso);
        const dueDate = new Date(inst.dueDateIso);
        const diffDays = (dueDate.getTime() - nowDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays <= 30) {
          totalUpcoming30Days += inst.amount;
        }
      }
    } else {
      status = "a_programar";
    }

    // Deriva a categoria associada a partir do item ou usa installmentLabel
    const matchingItem = ledger.items.find(
      (item) => item.vendorOrItem === inst.vendorOrItem || item.id === inst.id,
    );
    const category = matchingItem?.category || inst.installmentLabel || "Pagamento";

    result.push({
      id: inst.id,
      vendorOrItem: inst.vendorOrItem,
      category,
      dueDate: inst.dueDate || "Conforme Contrato",
      dueDateIso: inst.dueDateIso || null,
      amount: inst.amount,
      status,
      isDated,
    });
  }

  const totalScheduled = result
    .filter((i) => i.status !== "liquidado")
    .reduce((sum, i) => sum + i.amount, 0);

  return {
    installments: result,
    totalScheduled,
    totalOverdue,
    totalUpcoming30Days,
  };
}

/**
 * Deriva notas de auditoria e alertas deterministicamente do ledger.
 */
export function extractPlannerAuditingNotes(
  ledger: NormalizedEventFinancialLedger,
): string[] {
  const notes: string[] = [];

  // 1. Fornecedores com notas explícitas persistidas
  for (const item of ledger.items) {
    if (item.notes && item.notes.trim()) {
      notes.push(`[${item.category} · ${item.vendorOrItem}] ${item.notes.trim()}`);
    }
  }

  // 2. Pagamentos não reconciliados
  const unallocatedPayments = ledger.recentPayments.filter(
    (p) => p.isUnallocated || !p.vendorId,
  );
  if (unallocatedPayments.length > 0) {
    const unallocatedTotal = unallocatedPayments.reduce((s, p) => s + p.amount, 0);
    notes.push(
      `Existem ${unallocatedPayments.length} pagamento(s) liquidado(s) no total de ${unallocatedTotal.toLocaleString()} ${ledger.currencySymbol} registados sem vinculação a contrato formalizado.`,
    );
  }

  // 3. Contratos com valor contratual pendente de registo
  const pendingValueContracts = ledger.items.filter(
    (item) => item.status === "pendente" && item.contractedAmount === 0,
  );
  if (pendingValueContracts.length > 0) {
    notes.push(
      `${pendingValueContracts.length} fornecedor(es) constam em fase de contratação com valor final a registar.`,
    );
  }

  return notes;
}
