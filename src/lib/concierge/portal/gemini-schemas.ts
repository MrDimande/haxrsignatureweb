import { z } from "zod";
import {
  conciergeActionTypeSchema,
  conciergeDestinationSchema,
  conciergeItemTypeSchema,
} from "./schemas";

export const geminiClassifyResponseSchema = z.object({
  detectedType: conciergeItemTypeSchema,
  suggestedDestination: conciergeDestinationSchema,
  confidence: z.number().min(0).max(1),
  reason: z.string(),
  extractedFields: z.record(z.string(), z.unknown()).default({}),
  suggestedActions: z
    .array(
      z.object({
        actionType: z.enum([
          "create_vendor",
          "create_budget_item",
          "save_document",
          "create_checklist_task",
          "import_guests",
          "send_to_moodboard",
          "flag_for_review",
          "link_contract",
          "create_gift_item",
        ]),
        title: z.string(),
        description: z.string(),
        destination: conciergeDestinationSchema,
      })
    )
    .default([]),
});

export const geminiSummarizeResponseSchema = z.object({
  summary: z.string(),
  importantPoints: z.array(z.string()).default([]),
  risksOrWarnings: z.array(z.string()).default([]),
  nextSteps: z.array(z.string()).default([]),
});

export const geminiExtractFieldsResponseSchema = z.object({
  vendorName: z.string().nullable().default(null),
  service: z.string().nullable().default(null),
  amount: z.number().nullable().default(null),
  currency: z.literal("MT").nullable().default(null),
  paymentStatus: z.string().nullable().default(null),
  dueDate: z.string().nullable().default(null),
  eventDate: z.string().nullable().default(null),
  contact: z.string().nullable().default(null),
});

export const geminiSuggestActionsResponseSchema = z.object({
  actions: z
    .array(
      z.object({
        actionType: z.enum([
          "create_vendor",
          "create_budget_item",
          "save_document",
          "create_checklist_task",
          "import_guests",
          "send_to_moodboard",
          "flag_for_review",
          "link_contract",
          "create_gift_item",
        ]),
        title: z.string(),
        description: z.string(),
        destination: conciergeDestinationSchema,
      })
    )
    .default([]),
});

export type GeminiClassifyResponse = z.infer<typeof geminiClassifyResponseSchema>;
export type GeminiSummarizeResponse = z.infer<typeof geminiSummarizeResponseSchema>;
export type GeminiExtractFieldsResponse = z.infer<typeof geminiExtractFieldsResponseSchema>;

export const GEMINI_TO_PORTAL_ACTION: Record<string, z.infer<typeof conciergeActionTypeSchema>> = {
  create_vendor: "add_vendor",
  create_budget_item: "create_budget_item",
  save_document: "save_document",
  create_checklist_task: "create_checklist_task",
  import_guests: "import_guests",
  send_to_moodboard: "send_moodboard",
  flag_for_review: "custom",
  link_contract: "link_contract",
  create_gift_item: "create_gift_item",
};
