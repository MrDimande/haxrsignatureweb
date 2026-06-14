import type { BusinessId, ClientType, EventType } from "@/lib/admin/types";

export type GuestStatus = "invited" | "confirmed" | "checked_in" | "declined";

export type GuestLabel =
  | "none"
  | "vip"
  | "family"
  | "wedding_party"
  | "corporate"
  | "other";

export type SheetsSyncMode = "master" | "rsvp";

export type GuestSource = "manual" | "sheet_master" | "sheet_rsvp";

export interface ManagedEvent {
  id: string;
  businessId: BusinessId;
  clientId: string | null;
  clientName: string | null;
  name: string;
  type: EventType;
  date: string | null;
  location: string;
  notes: string;
  isActive: boolean;
  googleSheetUrl: string;
  googleSheetGid: string;
  sheetsLastSyncedAt: string | null;
  sheetsSyncSummary: string;
  sheetsSyncMode: SheetsSyncMode;
  createdAt: string;
  updatedAt: string;
}

export interface EventFormData {
  businessId: BusinessId;
  clientId: string | null;
  name: string;
  type: EventType;
  date: string;
  location: string;
  notes: string;
}

export interface EventSeat {
  id: string;
  eventId: string;
  tableName: string;
  seatNumber: number;
  label: string;
  createdAt: string;
  guestId: string | null;
  guestName: string | null;
}

export interface SeatFormData {
  tableName: string;
  seatNumber: number;
  label: string;
}

export interface EventGuest {
  id: string;
  eventId: string;
  name: string;
  email: string;
  phone: string;
  clientType: ClientType;
  seatId: string | null;
  qrToken: string;
  status: GuestStatus;
  plusOnes: number;
  dietaryNotes: string;
  guestNotes: string;
  label: GuestLabel;
  guestSource: GuestSource;
  createdAt: string;
  updatedAt: string;
  seat: {
    tableName: string;
    seatNumber: number;
    label: string;
  } | null;
  checkedInAt: string | null;
}

export interface GuestFormData {
  name: string;
  email: string;
  phone: string;
  clientType: ClientType;
  status: GuestStatus;
  seatId: string | null;
  plusOnes: number;
  dietaryNotes: string;
  guestNotes: string;
  label: GuestLabel;
}

export interface GuestAuditEntry {
  id: string;
  guestId: string;
  eventId: string;
  guestName: string;
  action: string;
  details: string;
  changedAt: string;
}

export interface CheckinLookup {
  ok: boolean;
  error?: string;
  guest?: {
    name: string;
    email?: string;
    phone?: string;
    status: GuestStatus;
    plusOnes?: number;
    dietaryNotes?: string;
    guestNotes?: string;
  };
  event?: {
    name: string;
    type: EventType;
    date: string | null;
    location: string;
  };
  seat?: {
    tableName: string;
    seatNumber: number;
    label: string;
  } | null;
  checkedIn?: boolean;
  alreadyCheckedIn?: boolean;
  confirmedRsvp?: boolean;
  alreadyConfirmed?: boolean;
  declinedRsvp?: boolean;
  alreadyDeclined?: boolean;
}

export interface RsvpSubmitInput {
  eventId: string;
  token: string;
  name: string;
  phone?: string;
  email?: string;
  attendance: "confirm" | "decline";
  plusOnes: number;
  dietaryNotes?: string;
  guestNotes?: string;
}

export interface EventListGuestStats {
  totalGuests: number;
  confirmed: number;
  checkedIn: number;
  unassigned: number;
}

export interface EventStats {
  totalGuests: number;
  invited: number;
  confirmed: number;
  checkedIn: number;
  declined: number;
  assignedSeats: number;
  totalSeats: number;
  uniqueTables: number;
  confirmationRate: number;
  capacityUsed: number;
  capacityAvailable: number;
}

export interface EventPublicInfo {
  id: string;
  name: string;
  type: EventType;
  date: string | null;
  location: string;
}

export interface FindSeatResult {
  name: string;
  seat: {
    tableName: string;
    seatNumber: number;
    label: string;
  } | null;
}

export interface SheetConnectionInput {
  googleSheetUrl: string;
  googleSheetGid?: string;
  sheetsSyncMode?: SheetsSyncMode;
}

export interface SheetSyncResult {
  created: number;
  updated: number;
  skipped: number;
  totalRows: number;
  syncedAt: string;
  errors: string[];
  syncMode: SheetsSyncMode;
  confirmedFromSheet: number;
  pendingGuests: number;
  declined: number;
}

export interface FindSeatSearchResponse {
  ok: boolean;
  error?: string;
  event?: EventPublicInfo;
  results?: FindSeatResult[];
}
