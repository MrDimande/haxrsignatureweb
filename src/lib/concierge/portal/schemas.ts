import { z } from "zod";

export const conciergeIntakeSourceSchema = z.enum([
  "upload",
  "manual_note",
  "forwarded_email_future",
  "web_clip",
  "whatsapp_future",
  "system",
]);

export const conciergeItemTypeSchema = z.enum([
  "proposta",
  "contrato",
  "recibo",
  "comprovativo_pagamento",
  "lista_convidados",
  "inspiracao",
  "programa_evento",
  "nota_operacional",
  "link_fornecedor",
  "produto_ou_presente",
  "outro",
]);

export const conciergeItemStatusSchema = z.enum([
  "novo",
  "por_classificar",
  "classificado",
  "aguardando_validacao",
  "validado",
  "enviado_para_modulo",
  "rejeitado",
  "arquivado",
]);

export const conciergePrioritySchema = z.enum(["baixa", "media", "alta", "urgente"]);

export const conciergeDestinationSchema = z.enum([
  "fornecedores",
  "financeiro",
  "convidados",
  "documentos",
  "moodboard",
  "checklist",
  "contratos",
  "rsvp",
  "presentes",
  "dashboard",
]);

export const conciergeSuggestionStatusSchema = z.enum([
  "pendente",
  "aceite",
  "rejeitada",
  "aplicada",
]);

export const conciergeActionTypeSchema = z.enum([
  "add_vendor",
  "create_budget_item",
  "import_guests",
  "save_document",
  "send_moodboard",
  "create_checklist_task",
  "link_contract",
  "create_gift_item",
  "custom",
]);

export const conciergeIntakeInputSchema = z.object({
  eventId: z.string().min(1),
  source: conciergeIntakeSourceSchema,
  title: z.string().min(1),
  description: z.string().optional(),
  file: z
    .object({
      fileName: z.string(),
      mimeType: z.string(),
      sizeBytes: z.number().nonnegative(),
      fileUrl: z.string().optional(),
    })
    .optional(),
  url: z.string().url().optional(),
  clippedTitle: z.string().optional(),
  email: z
    .object({
      from: z.string(),
      subject: z.string(),
      receivedAt: z.string(),
    })
    .optional(),
  manualText: z.string().optional(),
  notes: z.string().optional(),
  priority: conciergePrioritySchema.optional(),
  suggestedDestination: conciergeDestinationSchema.optional(),
});

export const conciergeInboxItemSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  title: z.string(),
  description: z.string(),
  type: conciergeItemTypeSchema,
  status: conciergeItemStatusSchema,
  priority: conciergePrioritySchema,
  source: conciergeIntakeSourceSchema,
  uploadedBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  fileName: z.string().optional(),
  fileUrl: z.string().optional(),
  mimeType: z.string().optional(),
  sizeBytes: z.number().optional(),
  originalEmailFrom: z.string().optional(),
  originalEmailSubject: z.string().optional(),
  originalEmailReceivedAt: z.string().optional(),
  clippedUrl: z.string().optional(),
  clippedTitle: z.string().optional(),
  clippedDescription: z.string().optional(),
  extractedText: z.string().optional(),
  extractedData: z.record(z.string(), z.unknown()).optional(),
  suggestedDestination: conciergeDestinationSchema.optional(),
  confidence: z.number().min(0).max(1).optional(),
  linkedModule: conciergeDestinationSchema.optional(),
  linkedRecordId: z.string().optional(),
  notes: z.string().optional(),
  classificationReason: z.string().optional(),
  storagePath: z.string().optional(),
});

export const conciergeClassificationSchema = z.object({
  itemId: z.string(),
  detectedType: conciergeItemTypeSchema,
  suggestedDestination: conciergeDestinationSchema,
  confidence: z.number().min(0).max(1),
  extractedFields: z.record(z.string(), z.unknown()),
  reason: z.string(),
  createdAt: z.string(),
  provider: z.enum(["gemini", "rule_based"]).optional(),
  summary: z
    .object({
      summary: z.string(),
      importantPoints: z.array(z.string()),
      risksOrWarnings: z.array(z.string()),
      nextSteps: z.array(z.string()),
    })
    .optional(),
  suggestedActions: z
    .array(
      z.object({
        actionType: conciergeActionTypeSchema,
        title: z.string(),
        description: z.string(),
        destination: conciergeDestinationSchema,
      })
    )
    .optional(),
});

export const conciergeSuggestionSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  title: z.string(),
  description: z.string(),
  actionType: conciergeActionTypeSchema,
  destination: conciergeDestinationSchema,
  payload: z.record(z.string(), z.unknown()),
  confidence: z.number().min(0).max(1),
  status: conciergeSuggestionStatusSchema,
});

export const conciergeActivitySchema = z.object({
  id: z.string(),
  itemId: z.string().optional(),
  title: z.string(),
  description: z.string(),
  type: z.enum([
    "intake",
    "classification",
    "validation",
    "routing",
    "rejection",
    "archive",
    "system",
  ]),
  createdAt: z.string(),
  actorName: z.string(),
  actorId: z.string().optional(),
  actorRole: z.string().optional(),
});

export const conciergeStatsSchema = z.object({
  totalItems: z.number(),
  pendingClassification: z.number(),
  awaitingValidation: z.number(),
  sentToModules: z.number(),
  rejected: z.number(),
  urgentItems: z.number(),
  emailReadyItems: z.number(),
  webClips: z.number(),
});

export const conciergeModuleDataSchema = z.object({
  eventOverview: z.object({
    eventId: z.string(),
    coupleNames: z.string(),
    eventDate: z.string(),
    eventDateLabel: z.string(),
    location: z.string(),
  }),
  stats: conciergeStatsSchema,
  inboxItems: z.array(conciergeInboxItemSchema),
  classifications: z.array(conciergeClassificationSchema),
  suggestions: z.array(conciergeSuggestionSchema),
  activities: z.array(conciergeActivitySchema),
  allowedActions: z.array(conciergeActionTypeSchema),
  inboundEmailAddress: z.string(),
  dashboardHref: z.string(),
  workspaceMeta: z.object({
    persistenceMode: z.enum(["memory", "supabase"]),
    storageMode: z.enum(["metadata_only", "supabase"]),
    persistenceLabel: z.string(),
    storageLabel: z.string(),
    actorRole: z.string(),
    permissions: z.object({
      canClassify: z.boolean(),
      canValidate: z.boolean(),
      canRoute: z.boolean(),
      canReject: z.boolean(),
      canArchive: z.boolean(),
      canApplySuggestions: z.boolean(),
      showConfidence: z.boolean(),
      showActivity: z.boolean(),
    }),
  }),
});
