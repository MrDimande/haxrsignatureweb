import { ZodError } from "zod";
import { CONCIERGE_CONFIDENCE_LOW_THRESHOLD } from "@/lib/concierge/concierge-confidence";
import {
  IRRELEVANT_OPERATOR_MESSAGE,
  isIrrelevantExtraction,
  isNonApplicableDocumentType,
} from "@/lib/concierge/concierge-applicability";
import {
  conciergeExtractionSchema,
  type ConciergeExtraction,
} from "@/lib/concierge/schemas";

export type FieldValidationError = {
  path: string;
  message: string;
};

export type ConciergeValidationResult =
  | { ok: true; data: ConciergeExtraction }
  | { ok: false; errors: FieldValidationError[] };

function zodErrorToFieldErrors(error: ZodError): FieldValidationError[] {
  return error.errors.map((issue) => ({
    path: issue.path.length ? issue.path.join(".") : "(raiz)",
    message: issue.message,
  }));
}

function hasVisualReferenceContent(
  vis: NonNullable<ConciergeExtraction["visualReference"]>
): boolean {
  if (vis.title?.trim()) return true;
  if (vis.colorPalette?.trim()) return true;
  if (vis.notes?.trim()) return true;
  if (vis.categories?.some((c) => c.trim())) return true;
  if (vis.tags?.some((t) => t.trim())) return true;
  return false;
}

function validateBusinessRules(data: ConciergeExtraction): FieldValidationError[] {
  const errors: FieldValidationError[] = [];
  const asRecord = data as unknown as Record<string, unknown>;

  if (isIrrelevantExtraction(asRecord)) {
    errors.push({
      path: "documentType",
      message: IRRELEVANT_OPERATOR_MESSAGE,
    });
    return errors;
  }

  if (isNonApplicableDocumentType(data.documentType)) {
    errors.push({
      path: "documentType",
      message:
        data.documentType === "contract"
          ? "Contratos e documentos de arquivo ainda não têm aplicação automática. Rejeite ou registe manualmente."
          : "Este tipo não tem aplicação automática. Rejeite ou registe manualmente noutros módulos.",
    });
    return errors;
  }

  if (
    typeof data.confidence === "number" &&
    data.confidence < CONCIERGE_CONFIDENCE_LOW_THRESHOLD
  ) {
    errors.push({
      path: "confidence",
      message:
        "A IA não tem confiança suficiente. Revise cuidadosamente e só aplique se tiver a certeza — ou aumente confidence após validação manual.",
    });
  }

  switch (data.documentType) {
    case "vendor_proposal": {
      const name = data.vendorProposal?.vendorName?.trim();
      const category = data.vendorProposal?.serviceCategory?.trim();
      if (!name) {
        errors.push({
          path: "vendorProposal.vendorName",
          message: "Nome do fornecedor é obrigatório.",
        });
      }
      if (!category) {
        errors.push({
          path: "vendorProposal.serviceCategory",
          message: "Categoria de serviço é obrigatória.",
        });
      }
      break;
    }
    case "payment_receipt": {
      const receipt = data.paymentReceipt;
      const amount = receipt?.amount;
      if (amount == null || amount <= 0) {
        errors.push({
          path: "paymentReceipt.amount",
          message: "Valor do pagamento deve ser maior que zero.",
        });
      }
      const hasReference =
        Boolean(receipt?.paidAt?.trim()) ||
        Boolean(receipt?.paymentMethod?.trim()) ||
        Boolean(receipt?.reference?.trim());
      if (!hasReference) {
        errors.push({
          path: "paymentReceipt",
          message:
            "Recibo incompleto — inclua data (paidAt), método de pagamento ou referência.",
        });
      }
      break;
    }
    case "guest_list": {
      const csv = data.guestList?.csvText?.trim() ?? "";
      const guests = data.guestList?.guests ?? [];
      if (!csv && guests.length === 0) {
        errors.push({
          path: "guestList",
          message: "Lista de convidados vazia — inclua guestList.guests ou guestList.csvText.",
        });
      } else if (guests.length > 0) {
        const named = guests.filter((g) => g.name?.trim());
        if (!named.length) {
          errors.push({
            path: "guestList.guests",
            message: "Nenhum convidado com nome válido.",
          });
        }
      }
      break;
    }
    case "checklist": {
      const items = data.checklist?.items ?? [];
      if (!items.length) {
        errors.push({
          path: "checklist.items",
          message: "Checklist sem tarefas.",
        });
      } else {
        items.forEach((item, index) => {
          if (!item.title?.trim()) {
            errors.push({
              path: `checklist.items[${index}].title`,
              message: "Título da tarefa é obrigatório.",
            });
          }
        });
      }
      break;
    }
    case "visual_reference": {
      const vis = data.visualReference;
      if (!vis || !hasVisualReferenceContent(vis)) {
        errors.push({
          path: "visualReference",
          message:
            "Referência visual genérica — inclua título, categoria, tags, paleta ou notas descritivas.",
        });
      }
      break;
    }
    case "contract":
    case "other":
      return errors;
    default: {
      const _exhaustive: never = data.documentType;
      return _exhaustive;
    }
  }

  return errors;
}

export function validateConciergeExtraction(
  input: unknown
): ConciergeValidationResult {
  const parsed = conciergeExtractionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: zodErrorToFieldErrors(parsed.error) };
  }

  const businessErrors = validateBusinessRules(parsed.data);
  if (businessErrors.length) {
    return { ok: false, errors: businessErrors };
  }

  return { ok: true, data: parsed.data };
}

export function parseAndValidateConciergeJson(
  json: string
): ConciergeValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json) as unknown;
  } catch {
    return {
      ok: false,
      errors: [{ path: "(json)", message: "JSON inválido — verifique vírgulas e aspas." }],
    };
  }
  return validateConciergeExtraction(parsed);
}

export function formatValidationErrors(errors: FieldValidationError[]): string {
  return errors.map((e) => (e.path ? `${e.path}: ${e.message}` : e.message)).join("\n");
}
