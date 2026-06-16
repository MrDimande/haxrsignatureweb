import { namesAreEquivalent } from "@/lib/events/normalize";
import type { EventGuest, EventSeat } from "@/lib/events/types";
import type { SheetGuestRow } from "@/lib/events/sheets/types";

export type GuestValidationIssue = {
  code:
    | "empty_name"
    | "name_too_short"
    | "possible_duplicate"
    | "seat_not_found"
    | "seat_occupied"
    | "missing_event"
    | "invalid_table"
    | "invalid_seat";
  message: string;
  rowNumber?: number;
  field?: string;
};

export type GuestValidationContext = {
  eventId: string;
  existingGuests: EventGuest[];
  seats?: EventSeat[];
  excludeGuestId?: string;
};

const MIN_NAME_LENGTH = 2;

export function validateGuestName(
  name: string,
  rowNumber?: number
): GuestValidationIssue | null {
  const trimmed = name.trim();

  if (!trimmed) {
    return {
      code: "empty_name",
      message: "O nome do convidado é obrigatório.",
      rowNumber,
      field: "name",
    };
  }

  if (trimmed.length < MIN_NAME_LENGTH) {
    return {
      code: "name_too_short",
      message: "O nome deve ter pelo menos 2 caracteres.",
      rowNumber,
      field: "name",
    };
  }

  return null;
}

export function validatePossibleDuplicate(
  name: string,
  context: GuestValidationContext,
  rowNumber?: number
): GuestValidationIssue | null {
  const duplicate = context.existingGuests.find(
    (guest) =>
      guest.id !== context.excludeGuestId &&
      namesAreEquivalent(guest.name, name)
  );

  if (!duplicate) return null;

  return {
    code: "possible_duplicate",
    message: `Possível duplicado detectado: «${duplicate.name}».`,
    rowNumber,
    field: "name",
  };
}

export function validateSeatReference(
  seatId: string | null | undefined,
  context: GuestValidationContext,
  rowNumber?: number
): GuestValidationIssue | null {
  if (!seatId) return null;
  if (!context.seats?.length) {
    return {
      code: "seat_not_found",
      message: "Não existem lugares definidos para este evento.",
      rowNumber,
      field: "seat",
    };
  }

  const seat = context.seats.find((item) => item.id === seatId);
  if (!seat) {
    return {
      code: "seat_not_found",
      message: "Lugar inexistente para este evento.",
      rowNumber,
      field: "seat",
    };
  }

  const occupiedBy = context.existingGuests.find(
    (guest) =>
      guest.seatId === seatId && guest.id !== context.excludeGuestId
  );

  if (occupiedBy) {
    return {
      code: "seat_occupied",
      message: `Lugar já atribuído a «${occupiedBy.name}».`,
      rowNumber,
      field: "seat",
    };
  }

  return null;
}

export function validateSheetRow(
  row: SheetGuestRow,
  context: GuestValidationContext
): GuestValidationIssue[] {
  const issues: GuestValidationIssue[] = [];

  if (!context.eventId) {
    issues.push({
      code: "missing_event",
      message: "Convidado sem evento associado.",
      rowNumber: row.rowNumber,
    });
    return issues;
  }

  const nameIssue = validateGuestName(row.name, row.rowNumber);
  if (nameIssue) issues.push(nameIssue);

  if (!nameIssue) {
    const match = context.existingGuests.find(
      (guest) =>
        guest.id !== context.excludeGuestId &&
        namesAreEquivalent(guest.name, row.name)
    );
    const isUpdate = Boolean(
      match &&
        (row.email || row.phone || namesAreEquivalent(match.name, row.name))
    );
    if (!isUpdate) {
      const dupIssue = validatePossibleDuplicate(
        row.name,
        context,
        row.rowNumber
      );
      if (dupIssue) issues.push({ ...dupIssue, message: dupIssue.message });
    }
  }

  return issues;
}

export function validateGuestForm(
  name: string,
  seatId: string | null,
  context: GuestValidationContext
): GuestValidationIssue[] {
  const issues: GuestValidationIssue[] = [];

  const nameIssue = validateGuestName(name);
  if (nameIssue) issues.push(nameIssue);

  if (!nameIssue) {
    const dupIssue = validatePossibleDuplicate(name, context);
    if (dupIssue) issues.push(dupIssue);
  }

  const seatIssue = validateSeatReference(seatId, context);
  if (seatIssue) issues.push(seatIssue);

  return issues;
}

export function formatValidationErrors(issues: GuestValidationIssue[]): string {
  return issues.map((issue) => issue.message).join(" ");
}
