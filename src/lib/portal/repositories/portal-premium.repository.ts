import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import * as neon from "@/lib/portal/repositories/portal-premium.neon.repository";
import * as supabase from "@/lib/portal/repositories/portal-premium.supabase.repository";

export type {
  CreativeApprovalsBatchResult,
  PaymentProofsBatchResult,
  TimelineBatchResult,
} from "@/lib/portal/repositories/portal-premium.supabase.repository";

export const listTimelineForClient: typeof supabase.listTimelineForClient = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.listTimelineForClient(...args)
    : supabase.listTimelineForClient(...args);

export const listTimelineForEvent: typeof supabase.listTimelineForEvent = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.listTimelineForEvent(...args)
    : supabase.listTimelineForEvent(...args);

export const listTimelineByEventIds: typeof supabase.listTimelineByEventIds = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.listTimelineByEventIds(...args)
    : supabase.listTimelineByEventIds(...args);

export const upsertOperationalTimelineForEvent: typeof supabase.upsertOperationalTimelineForEvent = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.upsertOperationalTimelineForEvent(...args)
    : supabase.upsertOperationalTimelineForEvent(...args);

export const listCreativeApprovalsForClient: typeof supabase.listCreativeApprovalsForClient = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.listCreativeApprovalsForClient(...args)
    : supabase.listCreativeApprovalsForClient(...args);

export const listCreativeApprovalsByEventIds: typeof supabase.listCreativeApprovalsByEventIds = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.listCreativeApprovalsByEventIds(...args)
    : supabase.listCreativeApprovalsByEventIds(...args);

export const decideCreativeApproval: typeof supabase.decideCreativeApproval = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.decideCreativeApproval(...args)
    : supabase.decideCreativeApproval(...args);

export const listMessagesForClient: typeof supabase.listMessagesForClient = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.listMessagesForClient(...args)
    : supabase.listMessagesForClient(...args);

export const listContractsForClient: typeof supabase.listContractsForClient = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.listContractsForClient(...args)
    : supabase.listContractsForClient(...args);

export const createPaymentProof: typeof supabase.createPaymentProof = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.createPaymentProof(...args)
    : supabase.createPaymentProof(...args);

export const listPaymentProofsForClient: typeof supabase.listPaymentProofsForClient = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.listPaymentProofsForClient(...args)
    : supabase.listPaymentProofsForClient(...args);

export const listPendingPaymentProofs: typeof supabase.listPendingPaymentProofs = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.listPendingPaymentProofs(...args)
    : supabase.listPendingPaymentProofs(...args);

export const listPendingPaymentProofsBatch: typeof supabase.listPendingPaymentProofsBatch = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.listPendingPaymentProofsBatch(...args)
    : supabase.listPendingPaymentProofsBatch(...args);

export const getPaymentProofById: typeof supabase.getPaymentProofById = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.getPaymentProofById(...args)
    : supabase.getPaymentProofById(...args);

export const updatePaymentProofStatus: typeof supabase.updatePaymentProofStatus = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.updatePaymentProofStatus(...args)
    : supabase.updatePaymentProofStatus(...args);

export const createPortalMessage: typeof supabase.createPortalMessage = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.createPortalMessage(...args)
    : supabase.createPortalMessage(...args);

export const createCreativeApproval: typeof supabase.createCreativeApproval = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.createCreativeApproval(...args)
    : supabase.createCreativeApproval(...args);

export const createPortalContract: typeof supabase.createPortalContract = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.createPortalContract(...args)
    : supabase.createPortalContract(...args);

export const setEventDateHold: typeof supabase.setEventDateHold = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.setEventDateHold(...args)
    : supabase.setEventDateHold(...args);

export const clearEventDateHold: typeof supabase.clearEventDateHold = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.clearEventDateHold(...args)
    : supabase.clearEventDateHold(...args);

export const countPendingPaymentProofs: typeof supabase.countPendingPaymentProofs = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.countPendingPaymentProofs(...args)
    : supabase.countPendingPaymentProofs(...args);

export const countPendingPaymentProofsByEventIds: typeof supabase.countPendingPaymentProofsByEventIds = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.countPendingPaymentProofsByEventIds(...args)
    : supabase.countPendingPaymentProofsByEventIds(...args);

export const countPendingCreativeApprovals: typeof supabase.countPendingCreativeApprovals = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.countPendingCreativeApprovals(...args)
    : supabase.countPendingCreativeApprovals(...args);

export const markTimelineCategoryDone: typeof supabase.markTimelineCategoryDone = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.markTimelineCategoryDone(...args)
    : supabase.markTimelineCategoryDone(...args);
