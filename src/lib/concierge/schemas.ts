import { z } from "zod";

export const conciergeDocTypeSchema = z.enum([
  "vendor_proposal",
  "payment_receipt",
  "guest_list",
  "visual_reference",
  "checklist",
  "contract",
  "other",
]);

/** Tipos adicionais que a IA pode devolver antes de normalização para a BD. */
export const classifierDocTypeSchema = z.enum([
  "vendor_proposal",
  "payment_receipt",
  "guest_list",
  "visual_reference",
  "checklist",
  "contract",
  "other",
  "irrelevant",
  "event_document",
]);

export const vendorProposalSchema = z.object({
  vendorName: z.string(),
  serviceCategory: z.string(),
  contactEmail: z.string().optional().default(""),
  contactPhone: z.string().optional().default(""),
  amount: z.number().nullable().optional(),
  currency: z.string().optional().default("MZN"),
  paymentTerms: z.string().optional().default(""),
  deadline: z.string().nullable().optional(),
  notes: z.string().optional().default(""),
});

export const paymentReceiptSchema = z.object({
  amount: z.number(),
  currency: z.string().optional().default("MZN"),
  paidAt: z.string().optional().default(""),
  paymentMethod: z.string().optional().default(""),
  vendorOrService: z.string().optional().default(""),
  reference: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

export const guestRowSchema = z.object({
  name: z.string(),
  email: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  groupName: z.string().optional().default(""),
  plusOnes: z.number().int().min(0).optional().default(0),
  notes: z.string().optional().default(""),
});

export const guestListSchema = z.object({
  guests: z.array(guestRowSchema).optional().default([]),
  csvText: z.string().optional().default(""),
});

export const visualReferenceSchema = z.object({
  title: z.string().optional().default(""),
  categories: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  colorPalette: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

export const checklistItemSchema = z.object({
  title: z.string(),
  dueDate: z.string().nullable().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional().default("normal"),
});

export const checklistSchema = z.object({
  items: z.array(checklistItemSchema).optional().default([]),
});

export const conciergeExtractionSchema = z.object({
  documentType: conciergeDocTypeSchema,
  confidence: z.number().min(0).max(1).optional().default(0.8),
  summary: z.string().optional().default(""),
  rejectionReason: z.string().optional(),
  notEventRelated: z.boolean().optional(),
  vendorProposal: vendorProposalSchema.optional(),
  paymentReceipt: paymentReceiptSchema.optional(),
  guestList: guestListSchema.optional(),
  visualReference: visualReferenceSchema.optional(),
  checklist: checklistSchema.optional(),
});

export const classifierExtractionSchema = z.object({
  documentType: classifierDocTypeSchema,
  confidence: z.number().min(0).max(1).optional().default(0.8),
  summary: z.string().optional().default(""),
  rejectionReason: z.string().optional(),
  notEventRelated: z.boolean().optional(),
  vendorProposal: vendorProposalSchema.optional(),
  paymentReceipt: paymentReceiptSchema.optional(),
  guestList: guestListSchema.optional(),
  visualReference: visualReferenceSchema.optional(),
  checklist: checklistSchema.optional(),
});

export type ClassifierExtraction = z.infer<typeof classifierExtractionSchema>;

export type ConciergeExtraction = z.infer<typeof conciergeExtractionSchema>;

export const reviewDecisionSchema = z.object({
  reviewId: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
  finalData: z.record(z.unknown()).optional(),
});
