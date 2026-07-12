import type {
  ConciergeClassification,
  ConciergeDestination,
  ConciergeInboxItem,
  ConciergeItemType,
  ConciergeIntakeSource,
} from "./types";

interface ClassifierInput {
  title: string;
  description?: string;
  fileName?: string;
  mimeType?: string;
  extractedText?: string;
  clippedUrl?: string;
  clippedTitle?: string;
  emailSubject?: string;
  emailSender?: string;
  source: ConciergeIntakeSource;
}

interface RuleMatch {
  type: ConciergeItemType;
  destination: ConciergeDestination;
  confidence: number;
  reason: string;
  partial?: boolean;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function collectText(input: ClassifierInput): string {
  return normalize(
    [
      input.title,
      input.description,
      input.fileName,
      input.extractedText,
      input.clippedUrl,
      input.clippedTitle,
      input.emailSubject,
      input.emailSender,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

const VENDOR_URL_KEYWORDS = [
  "catering",
  "buffet",
  "decor",
  "decoração",
  "decoracao",
  "photography",
  "fotograf",
  "venue",
  "local",
  "makeup",
  "maquilhagem",
  "music",
  "dj",
  "mc",
  "dress",
  "vestido",
  "cake",
  "bolo",
  "florist",
  "flores",
];

function matchKeywords(text: string, keywords: string[], partial = false): boolean {
  return keywords.some((kw) => {
    const n = normalize(kw);
    return partial ? text.includes(n) : new RegExp(`\\b${n}\\b`).test(text) || text.includes(n);
  });
}

function evaluateRules(input: ClassifierInput): RuleMatch | null {
  const text = collectText(input);

  if (
    matchKeywords(text, [
      "proposta",
      "orcamento",
      "orçamento",
      "cotacao",
      "cotação",
      "quote",
      "quotation",
      "budget proposal",
    ])
  ) {
    const financeiro = matchKeywords(text, ["valor", "total", "pagamento", "mt", "mzn"]);
    return {
      type: "proposta",
      destination: financeiro ? "financeiro" : "fornecedores",
      confidence: 0.9,
      reason: "Palavras-chave: proposta, orçamento ou cotação.",
    };
  }

  if (matchKeywords(text, ["contrato", "contract", "agreement", "termos"])) {
    return {
      type: "contrato",
      destination: matchKeywords(text, ["assinado", "signed"]) ? "contratos" : "documentos",
      confidence: 0.9,
      reason: "Palavras-chave: contrato ou agreement.",
    };
  }

  if (
    matchKeywords(text, ["comprovativo", "pagamento", "mpesa", "m-pesa", "emola", "e-mola", "transferencia", "transferência", "deposito", "depósito"])
  ) {
    return {
      type: "comprovativo_pagamento",
      destination: "financeiro",
      confidence: 0.9,
      reason: "Palavras-chave: comprovativo ou método de pagamento.",
    };
  }

  if (matchKeywords(text, ["recibo", "receipt", "fatura", "factura", "invoice"])) {
    return {
      type: "recibo",
      destination: matchKeywords(text, ["pago", "paid"]) ? "financeiro" : "documentos",
      confidence: 0.9,
      reason: "Palavras-chave: recibo, fatura ou invoice.",
    };
  }

  const guestStrong = matchKeywords(text, ["convidados", "guest", "rsvp", "lista de convidados"]);
  const guestPartial =
    matchKeywords(text, ["lista", "excel", "csv", "xlsx"], true) &&
    (input.mimeType?.includes("spreadsheet") ||
      input.mimeType?.includes("csv") ||
      input.fileName?.endsWith(".xlsx") ||
      input.fileName?.endsWith(".csv"));

  if (guestStrong || guestPartial) {
    return {
      type: "lista_convidados",
      destination: matchKeywords(text, ["rsvp"]) ? "rsvp" : "convidados",
      confidence: guestStrong ? 0.9 : 0.7,
      reason: guestStrong
        ? "Palavras-chave: convidados, guest ou RSVP."
        : "Ficheiro tabular com indícios de lista de convidados.",
      partial: !guestStrong,
    };
  }

  if (
    matchKeywords(text, [
      "inspiracao",
      "inspiração",
      "moodboard",
      "decoração",
      "decoracao",
      "cores",
      "flores",
      "pinterest",
      "referência",
      "referencia",
    ])
  ) {
    return {
      type: "inspiracao",
      destination: "moodboard",
      confidence: 0.9,
      reason: "Palavras-chave: inspiração ou moodboard.",
    };
  }

  if (matchKeywords(text, ["programa", "timeline", "agenda", "cronograma", "ordem do evento"])) {
    return {
      type: "programa_evento",
      destination: matchKeywords(text, ["tarefa", "checklist"]) ? "checklist" : "documentos",
      confidence: 0.9,
      reason: "Palavras-chave: programa ou cronograma.",
    };
  }

  if (
    input.source === "web_clip" &&
    matchKeywords(text, VENDOR_URL_KEYWORDS, true)
  ) {
    return {
      type: "link_fornecedor",
      destination: "fornecedores",
      confidence: 0.7,
      reason: "Link web com indícios de fornecedor de evento.",
      partial: true,
    };
  }

  if (matchKeywords(text, ["wishlist", "presente", "gift", "comprar", "produto", "item"])) {
    return {
      type: "produto_ou_presente",
      destination: "presentes",
      confidence: 0.7,
      reason: "Palavras-chave: presente, wishlist ou produto.",
      partial: true,
    };
  }

  if (input.source === "manual_note") {
    return {
      type: "nota_operacional",
      destination: "checklist",
      confidence: 0.5,
      reason: "Nota manual registada — revisão recomendada.",
      partial: true,
    };
  }

  return null;
}

export function classifyConciergeInput(input: ClassifierInput): ConciergeClassification {
  const match = evaluateRules(input);
  const now = new Date().toISOString();

  if (match) {
    return {
      itemId: "",
      detectedType: match.type,
      suggestedDestination: match.destination,
      confidence: match.confidence,
      extractedFields: {
        source: input.source,
        fileName: input.fileName,
        clippedUrl: input.clippedUrl,
      },
      reason: match.reason,
      createdAt: now,
    };
  }

  return {
    itemId: "",
    detectedType: "outro",
    suggestedDestination: "documentos",
    confidence: 0.3,
    extractedFields: { source: input.source },
    reason: "Sem correspondência directa — classificado como outro.",
    createdAt: now,
  };
}

export function classifyConciergeItem(item: ConciergeInboxItem): ConciergeClassification {
  const result = classifyConciergeInput({
    title: item.title,
    description: item.description,
    fileName: item.fileName,
    mimeType: item.mimeType,
    extractedText: item.extractedText ?? item.description,
    clippedUrl: item.clippedUrl,
    clippedTitle: item.clippedTitle,
    emailSubject: item.originalEmailSubject,
    emailSender: item.originalEmailFrom,
    source: item.source,
  });
  return { ...result, itemId: item.id };
}
