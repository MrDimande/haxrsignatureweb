import type {
  ConciergeClassification,
  ConciergeDestination,
  ConciergeExtractedFields,
  ConciergeSummaryResult,
} from "./types";
import type { ConciergeActionType, ConciergeIntakeSource } from "./types";
import { classifyConciergeInput } from "./concierge-classifier";

export interface ConciergeAIProviderInput {
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
  /** SERVER ONLY — base64 sem prefixo data: URL */
  imageBase64?: string;
}

export interface ConciergeSuggestedAction {
  title: string;
  description: string;
  actionType: ConciergeActionType;
  destination: ConciergeDestination;
}

export interface ConciergeAIProvider {
  classify(input: ConciergeAIProviderInput): Promise<ConciergeClassification>;
  summarize(input: ConciergeAIProviderInput): Promise<ConciergeSummaryResult>;
  extractFields(input: ConciergeAIProviderInput): Promise<ConciergeExtractedFields>;
  suggestActions(
    input: ConciergeAIProviderInput,
    classification: ConciergeClassification
  ): Promise<ConciergeSuggestedAction[]>;
}

export class RuleBasedConciergeProvider implements ConciergeAIProvider {
  readonly kind = "rule_based" as const;

  async classify(input: ConciergeAIProviderInput): Promise<ConciergeClassification> {
    const result = classifyConciergeInput(input);
    return { ...result, provider: "rule_based" };
  }

  async summarize(input: ConciergeAIProviderInput): Promise<ConciergeSummaryResult> {
    const parts = [input.title, input.description, input.extractedText].filter(Boolean);
    const text = parts.join(" — ");
    const summary = text.length > 160 ? `${text.slice(0, 157)}...` : text;
    return {
      summary,
      importantPoints: summary ? [summary] : [],
      risksOrWarnings: ["Classificação por regras — validação humana recomendada."],
      nextSteps: ["Rever com a equipa HAXR antes de enviar ao módulo."],
    };
  }

  async extractFields(input: ConciergeAIProviderInput): Promise<ConciergeExtractedFields> {
    const classification = await this.classify(input);
    const fields = classification.extractedFields;
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

  async suggestActions(
    _input: ConciergeAIProviderInput,
    classification: ConciergeClassification
  ): Promise<ConciergeSuggestedAction[]> {
    const map: Record<
      ConciergeDestination,
      { title: string; description: string; actionType: ConciergeActionType }
    > = {
      fornecedores: {
        title: "Adicionar fornecedor",
        description: "Criar entrada no Vendor Manager.",
        actionType: "add_vendor",
      },
      financeiro: {
        title: "Criar item no financeiro",
        description: "Registar no Budget Tracker.",
        actionType: "create_budget_item",
      },
      convidados: {
        title: "Importar para convidados",
        description: "Enviar lista para Guest List.",
        actionType: "import_guests",
      },
      documentos: {
        title: "Guardar em documentos",
        description: "Arquivar no módulo de documentos.",
        actionType: "save_document",
      },
      moodboard: {
        title: "Enviar para moodboard",
        description: "Adicionar referência visual.",
        actionType: "send_moodboard",
      },
      checklist: {
        title: "Criar tarefa no checklist",
        description: "Gerar tarefa de planeamento.",
        actionType: "create_checklist_task",
      },
      contratos: {
        title: "Associar a contrato",
        description: "Ligar ao módulo de contratos.",
        actionType: "link_contract",
      },
      presentes: {
        title: "Adicionar à wishlist",
        description: "Registar produto ou presente.",
        actionType: "create_gift_item",
      },
      rsvp: {
        title: "Actualizar RSVP",
        description: "Sincronizar confirmações.",
        actionType: "import_guests",
      },
      dashboard: {
        title: "Destacar no dashboard",
        description: "Mostrar resumo no painel.",
        actionType: "custom",
      },
    };

    const suggestion = map[classification.suggestedDestination];
    if (!suggestion) return [];

    return [
      {
        ...suggestion,
        destination: classification.suggestedDestination,
      },
    ];
  }
}

// TODO: OpenAIConciergeProvider
// TODO: OllamaConciergeProvider
