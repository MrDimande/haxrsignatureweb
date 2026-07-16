import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCommandCenterCriticalTasks,
} from "@/lib/admin/services/event-command-center.service";
import type { ManagedEvent } from "@/lib/events/types";
import type { EventStats } from "@/lib/events/types";

const event: ManagedEvent = {
  id: "event-1",
  businessId: "haxr-signature",
  clientId: "client-1",
  clientName: "Cliente",
  name: "Casamento",
  type: "wedding",
  date: "2026-08-01",
  location: "Maputo",
  notes: "",
  isActive: true,
  googleSheetUrl: "",
  googleSheetGid: "0",
  sheetsLastSyncedAt: null,
  sheetsSyncSummary: "",
  sheetsSyncMode: "master",
  findSeatCode: "ABC",
  editionRegistryKey: "",
  postEventReportSentAt: null,
  dateHoldUntil: new Date(Date.now() + 5 * 86400000).toISOString(),
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const guestStats: EventStats = {
  totalGuests: 100,
  invited: 20,
  confirmed: 60,
  checkedIn: 10,
  declined: 10,
  plusOnesTotal: 5,
  expectedAttendance: 75,
  unassignedGuests: 0,
  duplicateGuests: 0,
  assignedSeats: 40,
  totalSeats: 80,
  uniqueTables: 8,
  confirmationRate: 70,
  capacityUsed: 50,
  capacityAvailable: 30,
  groupCount: 3,
};

describe("buildCommandCenterCriticalTasks", () => {
  it("inclui fila de convidados e reserva de data", () => {
    const tasks = buildCommandCenterCriticalTasks({
      event,
      reviewOpen: 3,
      reviewSummary: { toReview: 2, missingGuest: 1, syncErrors: 0, possibleDuplicates: 0 },
      conciergePending: 1,
      pendingPaymentProofs: 2,
      openInvoices: 1,
      financialPending: 50000,
      guestStats,
    });

    assert.ok(tasks.some((task) => task.id === "guest-review"));
    assert.ok(tasks.some((task) => task.id === "date-hold"));
    assert.ok(tasks.some((task) => task.id === "payment-proofs"));
  });
});
