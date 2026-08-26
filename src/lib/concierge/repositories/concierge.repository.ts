import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import * as neon from "./concierge.neon.repository";
import * as supabase from "./concierge.supabase.repository";

export const createUploadRecord: typeof supabase.createUploadRecord = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.createUploadRecord(...args)
    : supabase.createUploadRecord(...args);

export const updateUpload: typeof supabase.updateUpload = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.updateUpload(...args)
    : supabase.updateUpload(...args);

export const createReviewItem: typeof supabase.createReviewItem = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.createReviewItem(...args)
    : supabase.createReviewItem(...args);

export const listReviewItemsByEvent: typeof supabase.listReviewItemsByEvent = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.listReviewItemsByEvent(...args)
    : supabase.listReviewItemsByEvent(...args);

export const getReviewItemById: typeof supabase.getReviewItemById = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.getReviewItemById(...args)
    : supabase.getReviewItemById(...args);

export const updateReviewItem: typeof supabase.updateReviewItem = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.updateReviewItem(...args)
    : supabase.updateReviewItem(...args);

export const logAiAudit: typeof supabase.logAiAudit = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.logAiAudit(...args)
    : supabase.logAiAudit(...args);

export const listEventVendors: typeof supabase.listEventVendors = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.listEventVendors(...args)
    : supabase.listEventVendors(...args);

export const insertEventVendor: typeof supabase.insertEventVendor = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.insertEventVendor(...args)
    : supabase.insertEventVendor(...args);

export const insertChecklistItems: typeof supabase.insertChecklistItems = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.insertChecklistItems(...args)
    : supabase.insertChecklistItems(...args);

export const listEventChecklistItems: typeof supabase.listEventChecklistItems = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.listEventChecklistItems(...args)
    : supabase.listEventChecklistItems(...args);

export const listEventMoodboardItems: typeof supabase.listEventMoodboardItems = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.listEventMoodboardItems(...args)
    : supabase.listEventMoodboardItems(...args);

export const insertMoodboardItem: typeof supabase.insertMoodboardItem = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.insertMoodboardItem(...args)
    : supabase.insertMoodboardItem(...args);

export const countPendingConciergeReviews: typeof supabase.countPendingConciergeReviews = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.countPendingConciergeReviews(...args)
    : supabase.countPendingConciergeReviews(...args);

export const countPendingConciergeReviewsByEventIds: typeof supabase.countPendingConciergeReviewsByEventIds = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.countPendingConciergeReviewsByEventIds(...args)
    : supabase.countPendingConciergeReviewsByEventIds(...args);
