import {
  classifierExtractionSchema,
  type ClassifierExtraction,
  type ConciergeExtraction,
} from "@/lib/concierge/schemas";
import {
  normalizeClassifierDocumentType,
  type ClassifierDocType,
} from "@/lib/concierge/concierge-applicability";
import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_MODEL = "gemini-2.0-flash";

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY em falta. Obtenha uma chave grátis em https://aistudio.google.com/apikey"
    );
  }
  return key;
}

export function getConciergeModelName(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

export function isConciergeAiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export function normalizeClassifierExtraction(
  raw: ClassifierExtraction
): ConciergeExtraction {
  const normalized = normalizeClassifierDocumentType(
    raw.documentType as ClassifierDocType,
    raw.rejectionReason
  );

  return {
    ...raw,
    documentType: normalized.documentType,
    rejectionReason: normalized.rejectionReason ?? raw.rejectionReason,
    notEventRelated:
      raw.notEventRelated === true ||
      normalized.rejectionReason === "not_event_related",
  };
}

const SYSTEM_PROMPT = `És o motor de extracção do HAXR Concierge para eventos em Moçambique (casamentos e celebrações).

A tua tarefa é LER o documento com atenção e decidir se o conteúdo está relacionado com planeamento de eventos.

documentType permitidos:
- vendor_proposal — proposta/orçamento de fornecedor (catering, fotografia, decoração, venue, etc.)
- payment_receipt — comprovativo M-Pesa, BIM, transferência, recibo ou factura de pagamento do evento
- guest_list — lista de convidados (Excel, CSV, tabela com nomes)
- visual_reference — inspiração visual (paleta, decoração, convite, vestido, mesa, moodboard)
- checklist — tarefas ou cronograma do evento
- contract — contrato formal do evento (apenas arquivo; sem apply automático nesta fase)
- event_document — documento do evento sem dados estruturados para apply (apenas arquivo)
- irrelevant — conteúdo SEM relação com eventos (CV, trabalho académico, factura pessoal, spam, imagem aleatória, texto genérico)
- other — não consegues classificar com evidência suficiente

Regras obrigatórias:
- Moeda preferida: MZN (meticais)
- Datas em ISO YYYY-MM-DD quando possível
- NUNCA inventes dados ausentes no documento; usa strings vazias, null ou omita campos
- Se o documento NÃO for claramente sobre o evento, usa irrelevant ou other com rejectionReason: "not_event_related"
- NÃO forces vendor_proposal, guest_list ou payment_receipt se o conteúdo não suportar essa classificação
- Devolve confidence entre 0 e 1 (honesta — baixa se houver dúvida)
- Devolve rejectionReason quando irrelevant, other sem apply, ou event_document
- Para listas de convidados: guestList.guests e/ou guestList.csvText (cabeçalho name,email,phone,group,plus_ones)
- Responde APENAS com JSON válido, sem markdown`;

export async function extractWithGemini(input: {
  textContent: string;
  mimeType: string;
  fileName: string;
  imageBase64?: string;
}): Promise<{ extraction: ConciergeExtraction; raw: string; model: string }> {
  const modelName = getConciergeModelName();
  const genAI = new GoogleGenerativeAI(getApiKey());
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.15,
    },
  });

  const userPrompt = `Ficheiro: ${input.fileName}
Tipo MIME: ${input.mimeType}

Conteúdo extraído:
${input.textContent.slice(0, 120_000)}

Devolve JSON com: documentType, confidence, summary, rejectionReason (se aplicável), e o objeto correspondente ao tipo (vendorProposal, paymentReceipt, guestList, visualReference ou checklist).`;

  const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> =
    [{ text: userPrompt }];

  if (input.imageBase64 && input.mimeType.startsWith("image/")) {
    parts.unshift({
      inlineData: {
        data: input.imageBase64,
        mimeType: input.mimeType,
      },
    });
  }

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
  });

  const raw = result.response.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("A IA devolveu JSON inválido. Tente novamente ou edite manualmente.");
  }

  const classified = classifierExtractionSchema.parse(parsed);
  const extraction = normalizeClassifierExtraction(classified);
  return { extraction, raw, model: modelName };
}
