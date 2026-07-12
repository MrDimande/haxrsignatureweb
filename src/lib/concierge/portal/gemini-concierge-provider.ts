/**
 * SERVER ONLY — Provider Gemini para o HAXR Concierge portal.
 * Não importar em componentes cliente.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { z } from "zod";
import { classifyConciergeInput } from "./concierge-classifier";
import type {
  ConciergeAIProvider,
  ConciergeAIProviderInput,
  ConciergeSuggestedAction,
} from "./concierge-ai-provider";
import { RuleBasedConciergeProvider } from "./concierge-ai-provider";
import { getGeminiModelName, requireGeminiApiKey } from "./gemini-config";
import {
  GEMINI_TO_PORTAL_ACTION,
  geminiClassifyResponseSchema,
  geminiExtractFieldsResponseSchema,
  geminiSuggestActionsResponseSchema,
  geminiSummarizeResponseSchema,
} from "./gemini-schemas";
import type {
  ConciergeClassification,
  ConciergeExtractedFields,
  ConciergeSummaryResult,
} from "./types";

const SYSTEM_PROMPT = `És o assistente HAXR Concierge para eventos premium em Moçambique.
Responde SEMPRE em português de Moçambique.
Regras obrigatórias:
- Nunca inventes valores, datas, montantes ou nomes que não estejam no conteúdo fornecido.
- Se um campo não estiver presente, usa null.
- Se houver incerteza, reduz a confiança (confidence).
- Não afirmes que um pagamento está confirmado a menos que o documento o comprove claramente.
- Não cries certeza jurídica sobre contratos; apenas resume e sinaliza pontos para revisão humana.
- Recomenda sempre validação humana pela equipa HAXR antes de acções definitivas.
- Devolve APENAS JSON válido, sem markdown.`;

function buildContextBlock(input: ConciergeAIProviderInput): string {
  return [
    `Título: ${input.title}`,
    input.description ? `Descrição: ${input.description}` : null,
    input.fileName ? `Ficheiro: ${input.fileName}` : null,
    input.mimeType ? `MIME: ${input.mimeType}` : null,
    input.extractedText ? `Texto extraído:\n${input.extractedText.slice(0, 80_000)}` : null,
    input.clippedUrl ? `URL: ${input.clippedUrl}` : null,
    input.clippedTitle ? `Título do link: ${input.clippedTitle}` : null,
    input.emailSubject ? `Assunto email: ${input.emailSubject}` : null,
    input.emailSender ? `Remetente: ${input.emailSender}` : null,
    `Origem: ${input.source}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function isComplexDocument(input: ConciergeAIProviderInput): boolean {
  const mime = input.mimeType?.toLowerCase() ?? "";
  const name = input.fileName?.toLowerCase() ?? "";
  return (
    mime.includes("pdf") ||
    mime.startsWith("image/") ||
    name.endsWith(".pdf") ||
    name.endsWith(".doc") ||
    name.endsWith(".docx") ||
    (input.extractedText?.length ?? 0) > 400
  );
}

async function callGeminiJson<T extends z.ZodType>(
  taskPrompt: string,
  input: ConciergeAIProviderInput,
  schema: T,
  strictRetry: boolean
): Promise<z.infer<T>> {
  const modelName = getGeminiModelName();
  const genAI = new GoogleGenerativeAI(requireGeminiApiKey());
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.15,
    },
  });

  const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [
    { text: `${taskPrompt}\n\n${buildContextBlock(input)}` },
  ];

  // TODO: integrar Gemini Files API + storage seguro com URLs assinadas para PDFs/documentos
  if (input.imageBase64 && input.mimeType?.startsWith("image/")) {
    parts.unshift({
      inlineData: { data: input.imageBase64, mimeType: input.mimeType },
    });
  }

  const attempt = async (extraInstruction?: string) => {
    const prompt = extraInstruction
      ? `${taskPrompt}\n\nINSTRUÇÃO EXTRA: ${extraInstruction}\n\n${buildContextBlock(input)}`
      : `${taskPrompt}\n\n${buildContextBlock(input)}`;

    const contentParts: typeof parts = [...parts];
    if (contentParts[contentParts.length - 1]) {
      contentParts[contentParts.length - 1] = { text: prompt };
    }

    const result = await model.generateContent({
      contents: [{ role: "user", parts: contentParts }],
    });
    const raw = result.response.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("Gemini devolveu JSON inválido.");
    }
    return schema.parse(parsed);
  };

  try {
    return await attempt();
  } catch (firstError) {
    if (!strictRetry) throw firstError;
    return attempt(
      "Responde estritamente ao schema JSON pedido. Não incluas texto fora do JSON. Usa null para campos ausentes."
    );
  }
}

function mapGeminiActions(
  actions: Array<{
    actionType: string;
    title: string;
    description: string;
    destination: ConciergeClassification["suggestedDestination"];
  }>
): ConciergeSuggestedAction[] {
  return actions.map((a) => ({
    actionType: GEMINI_TO_PORTAL_ACTION[a.actionType] ?? "custom",
    title: a.title,
    description: a.description,
    destination: a.destination,
  }));
}

function toClassification(
  itemId: string,
  gemini: z.infer<typeof geminiClassifyResponseSchema>,
  summary?: ConciergeSummaryResult
): ConciergeClassification {
  return {
    itemId,
    detectedType: gemini.detectedType,
    suggestedDestination: gemini.suggestedDestination,
    confidence: gemini.confidence,
    extractedFields: gemini.extractedFields,
    reason: gemini.reason,
    createdAt: new Date().toISOString(),
    provider: "gemini",
    summary,
    suggestedActions: mapGeminiActions(gemini.suggestedActions),
  };
}

export class GeminiConciergeProvider implements ConciergeAIProvider {
  readonly kind = "gemini" as const;
  private readonly fallback = new RuleBasedConciergeProvider();

  async classify(input: ConciergeAIProviderInput): Promise<ConciergeClassification> {
    try {
      if (!isComplexDocument(input) && !input.extractedText && !input.description) {
        const rule = await this.fallback.classify(input);
        return { ...rule, provider: "rule_based" };
      }

      const gemini = await callGeminiJson(
        `Classifica este conteúdo para o HAXR Concierge.
Devolve JSON com: detectedType, suggestedDestination, confidence (0-1), reason, extractedFields (object), suggestedActions (array).
Cada suggestedAction deve ter: actionType (create_vendor|create_budget_item|save_document|create_checklist_task|import_guests|send_to_moodboard|flag_for_review|link_contract|create_gift_item), title, description, destination.`,
        input,
        geminiClassifyResponseSchema,
        true
      );

      let summary: ConciergeSummaryResult | undefined;
      try {
        summary = await this.summarize(input);
      } catch {
        // summary opcional — não bloqueia classificação
      }

      return toClassification("", gemini, summary);
    } catch {
      const rule = await this.fallback.classify(input);
      return { ...rule, provider: "rule_based" };
    }
  }

  async summarize(input: ConciergeAIProviderInput): Promise<ConciergeSummaryResult> {
    try {
      return await callGeminiJson(
        `Resume este conteúdo para revisão humana HAXR.
Devolve JSON com: summary (string), importantPoints (string[]), risksOrWarnings (string[]), nextSteps (string[]).`,
        input,
        geminiSummarizeResponseSchema,
        true
      );
    } catch {
      return this.fallback.summarize(input);
    }
  }

  async extractFields(input: ConciergeAIProviderInput): Promise<ConciergeExtractedFields> {
    try {
      return await callGeminiJson(
        `Extrai campos estruturados se existirem no conteúdo (propostas, contratos, pagamentos).
Devolve JSON com: vendorName, service, amount, currency ("MT" ou null), paymentStatus, dueDate (ISO ou null), eventDate (ISO ou null), contact.
Usa null quando o campo não estiver presente.`,
        input,
        geminiExtractFieldsResponseSchema,
        true
      );
    } catch {
      const fields = await this.fallback.extractFields(input);
      return {
        vendorName: typeof fields.vendorName === "string" ? fields.vendorName : null,
        service: typeof fields.service === "string" ? fields.service : null,
        amount: typeof fields.amount === "number" ? fields.amount : null,
        currency: fields.currency === "MT" ? "MT" : null,
        paymentStatus: typeof fields.paymentStatus === "string" ? fields.paymentStatus : null,
        dueDate: typeof fields.dueDate === "string" ? fields.dueDate : null,
        eventDate: typeof fields.eventDate === "string" ? fields.eventDate : null,
        contact: typeof fields.contact === "string" ? fields.contact : null,
      };
    }
  }

  async suggestActions(
    input: ConciergeAIProviderInput,
    classification: ConciergeClassification
  ): Promise<ConciergeSuggestedAction[]> {
    if (classification.suggestedActions?.length) {
      return classification.suggestedActions;
    }

    try {
      const result = await callGeminiJson(
        `Sugere acções operacionais para a equipa HAXR com base na classificação.
Tipo detectado: ${classification.detectedType}
Destino: ${classification.suggestedDestination}
Devolve JSON: { "actions": [{ "actionType", "title", "description", "destination" }] }`,
        input,
        geminiSuggestActionsResponseSchema,
        true
      );
      return mapGeminiActions(result.actions);
    } catch {
      return this.fallback.suggestActions(input, classification);
    }
  }
}

export function itemToProviderInput(item: {
  title: string;
  description: string;
  fileName?: string;
  mimeType?: string;
  extractedText?: string;
  clippedUrl?: string;
  clippedTitle?: string;
  originalEmailSubject?: string;
  originalEmailFrom?: string;
  source: ConciergeAIProviderInput["source"];
}): ConciergeAIProviderInput {
  return {
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
  };
}

/** Classificação rápida local — útil para testes sem rede. */
export function classifyWithRules(input: ConciergeAIProviderInput): ConciergeClassification {
  const result = classifyConciergeInput(input);
  return { ...result, provider: "rule_based" };
}
