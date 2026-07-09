import { z } from "zod";

const dashboardEventOverviewSchema = z.object({
  eventId: z.string(),
  slug: z.string(),
  name: z.string(),
  type: z.string(),
  date: z.string(),
  dateIso: z.string().optional(),
  location: z.string(),
  status: z.string(),
  responsible: z.string(),
  progress: z.number().min(0).max(100),
});

const dashboardStatCardSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.union([z.number(), z.string()]),
  valueType: z.enum(["number", "currency", "text"]).optional(),
  detail: z.string(),
  trend: z.string().optional(),
  status: z.string().optional(),
});

const dashboardProgressItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.number().min(0).max(100),
});

const dashboardNextActionSchema = z.object({
  id: z.string(),
  title: z.string(),
  dueDate: z.string(),
  priority: z.enum(["Alta", "Média", "Baixa"]),
  status: z.enum(["open", "in_progress", "done"]).optional(),
  href: z.string().optional(),
});

const dashboardModuleSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  metric: z.string(),
  href: z.string(),
  status: z.enum(["active", "setup", "inactive"]),
  category: z.string().optional(),
});

const dashboardFinanceSnapshotSchema = z.object({
  currency: z.string(),
  budgetEstimated: z.number(),
  budgetRegistered: z.number(),
  paidAmount: z.number(),
  pendingAmount: z.number(),
  nextPayment: z.object({
    vendorName: z.string(),
    dueDate: z.string(),
    dueDateIso: z.string().optional(),
    amount: z.number(),
  }),
});

const dashboardGuestSnapshotSchema = z.object({
  total: z.number(),
  confirmed: z.number(),
  pending: z.number(),
  declined: z.number(),
  plusOnes: z.number(),
  tablesAssigned: z.number(),
  tablesTotal: z.number(),
});

const dashboardVendorSnapshotSchema = z.object({
  id: z.string(),
  name: z.string(),
  service: z.string(),
  status: z.enum(["Em revisão", "Pendente", "Assinado", "Aguardando"]),
});

const dashboardRecentActivitySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  timestamp: z.string(),
  relativeLabel: z.string(),
  type: z.enum(["guests", "finance", "vendor", "rsvp", "moodboard", "document", "other"]),
});

const dashboardConciergeSummarySchema = z.object({
  documentsToday: z.number(),
  contractsAwaiting: z.number(),
  proposalsApproval: z.number(),
  guestsNoResponse: z.number(),
  href: z.string(),
});

const dashboardChecklistTemplateSchema = z.object({
  id: z.string(),
  title: z.string(),
  badge: z.string(),
  description: z.string(),
});

const dashboardMetaSchema = z.object({
  lastSyncedAt: z.string(),
  lastSyncedLabel: z.string(),
  role: z.enum(["admin", "client", "vendor", "team"]).optional(),
  operationalLinked: z.boolean().optional(),
  operationalEventId: z.string().nullable().optional(),
});

export const dashboardDataSchema = z.object({
  eventOverview: dashboardEventOverviewSchema,
  meta: dashboardMetaSchema,
  stats: z.array(dashboardStatCardSchema),
  progress: z.array(dashboardProgressItemSchema),
  nextActions: z.array(dashboardNextActionSchema),
  checklistTemplates: z.array(dashboardChecklistTemplateSchema),
  modules: z.array(dashboardModuleSchema),
  financeSnapshot: dashboardFinanceSnapshotSchema,
  guestSnapshot: dashboardGuestSnapshotSchema,
  vendorSnapshot: z.array(dashboardVendorSnapshotSchema),
  recentActivity: z.array(dashboardRecentActivitySchema),
  conciergeSummary: dashboardConciergeSummarySchema,
});

export type DashboardDataSchema = z.infer<typeof dashboardDataSchema>;
