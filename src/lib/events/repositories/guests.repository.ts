import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import * as neon from "@/lib/events/repositories/guests.neon.repository";
import * as supabase from "@/lib/events/repositories/guests.supabase.repository";

export type { ListGuestsOptions } from "@/lib/events/repositories/guests.supabase.repository";

export const listGuestsByEvent: typeof supabase.listGuestsByEvent = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.listGuestsByEvent(...args)
    : supabase.listGuestsByEvent(...args);

export const listGuestsByEventIncludingArchived: typeof supabase.listGuestsByEventIncludingArchived =
  (...args) =>
    shouldUseNeonServerDatabase()
      ? neon.listGuestsByEventIncludingArchived(...args)
      : supabase.listGuestsByEventIncludingArchived(...args);

export const setGuestImportBatchId: typeof supabase.setGuestImportBatchId = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.setGuestImportBatchId(...args)
    : supabase.setGuestImportBatchId(...args);

export const markGuestInviteSent: typeof supabase.markGuestInviteSent = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.markGuestInviteSent(...args)
    : supabase.markGuestInviteSent(...args);

export const listGuestsPage: typeof supabase.listGuestsPage = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.listGuestsPage(...args)
    : supabase.listGuestsPage(...args);

export const getGuestById: typeof supabase.getGuestById = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.getGuestById(...args)
    : supabase.getGuestById(...args);

export const createGuest: typeof supabase.createGuest = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.createGuest(...args)
    : supabase.createGuest(...args);

export const updateGuest: typeof supabase.updateGuest = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.updateGuest(...args)
    : supabase.updateGuest(...args);

export const softDeleteGuest: typeof supabase.softDeleteGuest = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.softDeleteGuest(...args)
    : supabase.softDeleteGuest(...args);

export const deleteGuest: typeof supabase.deleteGuest = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.deleteGuest(...args)
    : supabase.deleteGuest(...args);

export const archiveGuest: typeof supabase.archiveGuest = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.archiveGuest(...args)
    : supabase.archiveGuest(...args);

export const restoreGuest: typeof supabase.restoreGuest = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.restoreGuest(...args)
    : supabase.restoreGuest(...args);

export const markGuestIncorrect: typeof supabase.markGuestIncorrect = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.markGuestIncorrect(...args)
    : supabase.markGuestIncorrect(...args);

export const assignSeatToGuest: typeof supabase.assignSeatToGuest = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.assignSeatToGuest(...args)
    : supabase.assignSeatToGuest(...args);

export const updateGuestStatus: typeof supabase.updateGuestStatus = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.updateGuestStatus(...args)
    : supabase.updateGuestStatus(...args);

export const confirmGuest: typeof supabase.confirmGuest = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.confirmGuest(...args)
    : supabase.confirmGuest(...args);

export const checkInGuest: typeof supabase.checkInGuest = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.checkInGuest(...args)
    : supabase.checkInGuest(...args);

export const createGuestFromSheet: typeof supabase.createGuestFromSheet = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.createGuestFromSheet(...args)
    : supabase.createGuestFromSheet(...args);

export const updateGuestFromSheet: typeof supabase.updateGuestFromSheet = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.updateGuestFromSheet(...args)
    : supabase.updateGuestFromSheet(...args);

export const regenerateGuestToken: typeof supabase.regenerateGuestToken = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.regenerateGuestToken(...args)
    : supabase.regenerateGuestToken(...args);

export const searchGuestsByName: typeof supabase.searchGuestsByName = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.searchGuestsByName(...args)
    : supabase.searchGuestsByName(...args);

export const searchGuestsForFindSeat: typeof supabase.searchGuestsForFindSeat = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.searchGuestsForFindSeat(...args)
    : supabase.searchGuestsForFindSeat(...args);

export const getEventStats: typeof supabase.getEventStats = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.getEventStats(...args)
    : supabase.getEventStats(...args);

export const listGuestStatsByEventIds: typeof supabase.listGuestStatsByEventIds = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.listGuestStatsByEventIds(...args)
    : supabase.listGuestStatsByEventIds(...args);

export const bulkConfirmGuests: typeof supabase.bulkConfirmGuests = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.bulkConfirmGuests(...args)
    : supabase.bulkConfirmGuests(...args);

export const bulkCheckInGuests: typeof supabase.bulkCheckInGuests = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.bulkCheckInGuests(...args)
    : supabase.bulkCheckInGuests(...args);

export const bulkAssignTable: typeof supabase.bulkAssignTable = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.bulkAssignTable(...args)
    : supabase.bulkAssignTable(...args);

export const mergeGuests: typeof supabase.mergeGuests = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.mergeGuests(...args)
    : supabase.mergeGuests(...args);
