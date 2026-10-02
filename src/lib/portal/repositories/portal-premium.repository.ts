import * as neon from "@/lib/portal/repositories/portal-premium.neon.repository";

export type {
  CreativeApprovalsBatchResult,
  PaymentProofsBatchResult,
  TimelineBatchResult,
} from "@/lib/portal/repositories/portal-premium.neon.repository";

export const listTimelineForClient: typeof neon.listTimelineForClient = (...args) =>
  neon.listTimelineForClient(...args);

export const listTimelineForEvent: typeof neon.listTimelineForEvent = (...args) =>
  neon.listTimelineForEvent(...args);

export const listTimelineByEventIds: typeof neon.listTimelineByEventIds = (...args) =>
  neon.listTimelineByEventIds(...args);

export const upsertOperationalTimelineForEvent: typeof neon.upsertOperationalTimelineForEvent = (...args) =>
  neon.upsertOperationalTimelineForEvent(...args);

export const listCreativeApprovalsForClient: typeof neon.listCreativeApprovalsForClient = (...args) =>
  neon.listCreativeApprovalsForClient(...args);

export const listCreativeApprovalsByEventIds: typeof neon.listCreativeApprovalsByEventIds = (...args) =>
  neon.listCreativeApprovalsByEventIds(...args);

export const decideCreativeApproval: typeof neon.decideCreativeApproval = (...args) =>
  neon.decideCreativeApproval(...args);

export const listMessagesForClient: typeof neon.listMessagesForClient = (...args) =>
  neon.listMessagesForClient(...args);

export const listContractsForClient: typeof neon.listContractsForClient = (...args) =>
  neon.listContractsForClient(...args);

export const createPaymentProof: typeof neon.createPaymentProof = (...args) =>
  neon.createPaymentProof(...args);

export const listPaymentProofsForClient: typeof neon.listPaymentProofsForClient = (...args) =>
  neon.listPaymentProofsForClient(...args);

export const listPendingPaymentProofs: typeof neon.listPendingPaymentProofs = (...args) =>
  neon.listPendingPaymentProofs(...args);

export const listPendingPaymentProofsBatch: typeof neon.listPendingPaymentProofsBatch = (...args) =>
  neon.listPendingPaymentProofsBatch(...args);

export const getPaymentProofById: typeof neon.getPaymentProofById = (...args) =>
  neon.getPaymentProofById(...args);

export const updatePaymentProofStatus: typeof neon.updatePaymentProofStatus = (...args) =>
  neon.updatePaymentProofStatus(...args);

export const createPortalMessage: typeof neon.createPortalMessage = (...args) =>
  neon.createPortalMessage(...args);

export const createCreativeApproval: typeof neon.createCreativeApproval = (...args) =>
  neon.createCreativeApproval(...args);

export const createPortalContract: typeof neon.createPortalContract = (...args) =>
  neon.createPortalContract(...args);

export const setEventDateHold: typeof neon.setEventDateHold = (...args) =>
  neon.setEventDateHold(...args);

export const clearEventDateHold: typeof neon.clearEventDateHold = (...args) =>
  neon.clearEventDateHold(...args);

export const countPendingPaymentProofs: typeof neon.countPendingPaymentProofs = (...args) =>
  neon.countPendingPaymentProofs(...args);

export const countPendingPaymentProofsByEventIds: typeof neon.countPendingPaymentProofsByEventIds = (...args) =>
  neon.countPendingPaymentProofsByEventIds(...args);

export const countPendingCreativeApprovals: typeof neon.countPendingCreativeApprovals = (...args) =>
  neon.countPendingCreativeApprovals(...args);

export const markTimelineCategoryDone: typeof neon.markTimelineCategoryDone = (...args) =>
  neon.markTimelineCategoryDone(...args);
