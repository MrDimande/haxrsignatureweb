import type { ClientType } from "@/lib/admin/types";
import type { GuestStatus, GuestLabel } from "@/lib/events/types";

export interface SheetGuestRow {
  name: string;
  email: string;
  phone: string;
  clientType: ClientType;
  status?: GuestStatus;
  statusRaw?: string;
  plusOnes?: number;
  dietaryNotes?: string;
  guestNotes?: string;
  label?: GuestLabel;
  groupId?: string | null;
  groupName?: string;
  rowNumber: number;
}

export interface ParsedSheetUrl {
  spreadsheetId: string;
  gid: string;
}
