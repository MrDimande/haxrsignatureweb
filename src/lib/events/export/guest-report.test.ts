import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildGuestEventReport,
  calculateGuestReportStats,
  getEventSocialClass,
  resolveGuestCompanionInfo,
  shouldReportExactSeat,
} from "./report";
import {
  buildOfficialGuestOperationsWorkbook,
  buildGuestReportExcelBuffer,
} from "./excel-guest-operations";
import {
  buildOfficialRsvpGiftingWorkbook,
  buildRsvpGiftingExcelBuffer,
} from "./excel-rsvp-gifting";
import { generateGuestReportPDFBuffer } from "./pdf-server";
import type { EventGuest, EventSeat, ManagedEvent } from "@/lib/events/types";
import type { EditionGiftReservation } from "@/lib/events/repositories/edition-gifts.repository";

// ── Mock Factory Helpers ──
function createMockEvent(overrides: Partial<ManagedEvent> = {}): ManagedEvent {
  return {
    id: "ev-wedding-01",
    businessId: "haxr-signature",
    clientId: "cli-01",
    clientName: "Carolina & Mário",
    name: "Casamento Carolina & Mário",
    type: "wedding",
    date: "2026-11-28",
    location: "Polana Serena Hotel, Maputo",
    notes: "Casamento de alta distinção com curadoria e banquete completo.",
    isActive: true,
    googleSheetUrl: "",
    googleSheetGid: "",
    sheetsLastSyncedAt: null,
    sheetsSyncSummary: "",
    sheetsSyncMode: "master",
    findSeatCode: "CAROL-MARIO",
    editionRegistryKey: "",
    postEventReportSentAt: null,
    dateHoldUntil: null,
    createdAt: "2026-08-20T10:00:00Z",
    updatedAt: "2026-08-20T10:00:00Z",
    ...overrides,
  };
}

function createMockGuest(id: string, name: string, overrides: Partial<EventGuest> = {}): EventGuest {
  return {
    id,
    eventId: "ev-wedding-01",
    name,
    nameNormalized: name.toLowerCase(),
    email: `${name.toLowerCase().replace(/[^a-z0-9]/g, "")}@example.com`,
    phone: "+258 84 000 0000",
    clientType: "individual",
    seatId: null,
    groupId: null,
    groupName: null,
    qrToken: `qr-${id}`,
    status: "invited",
    plusOnes: 0,
    dietaryNotes: "",
    guestNotes: "",
    label: "none",
    guestSource: "manual",
    importBatchId: null,
    archivedAt: null,
    archiveReason: "",
    isIncorrect: false,
    deletedAt: null,
    inviteSentAt: "2026-08-20T10:00:00Z",
    createdAt: "2026-08-20T10:00:00Z",
    updatedAt: "2026-08-20T10:00:00Z",
    seat: null,
    checkedInAt: null,
    ...overrides,
  };
}

function createMockSeat(id: string, tableName: string, seatNumber: number, label = ""): EventSeat {
  return {
    id,
    eventId: "ev-wedding-01",
    tableName,
    seatNumber,
    label,
    createdAt: "2026-08-20T10:00:00Z",
    guestId: null,
    guestName: null,
  };
}

describe("HAXR Guest Operations Report & Adaptive Readiness Standard", () => {
  // ── 1. Canonical Guest Universe & Eligibility Invariants ──
  it("A & B: Exactly 22 eligible guests from 27 raw records (5 filtered: archived, deleted, incorrect)", () => {
    const rawGuests: EventGuest[] = [
      createMockGuest("g-01", "Ana Nhaca", { status: "confirmed", plusOnes: 1 }),
      createMockGuest("g-02", "Bernardo Silva", { status: "confirmed" }),
      createMockGuest("g-03", "Carlos Tembe", { status: "checked_in", plusOnes: 2 }),
      createMockGuest("g-04", "Daniela Matusse", { status: "declined" }),
      createMockGuest("g-05", "Eduardo Cossa", { status: "invited" }),
      createMockGuest("g-06", "Fernanda Langa", { status: "confirmed" }),
      createMockGuest("g-07", "Gabriel Machava", { status: "invited", plusOnes: 1 }),
      createMockGuest("g-08", "Helena Mabunda", { status: "confirmed" }),
      createMockGuest("g-09", "Inácio Macamo", { status: "declined" }),
      createMockGuest("g-10", "Joana Mondlane", { status: "checked_in" }),
      createMockGuest("g-11", "Kátia Chissano", { status: "invited" }),
      createMockGuest("g-12", "Lucas Guebuza", { status: "confirmed", plusOnes: 1 }),
      createMockGuest("g-13", "Marta Nyusi", { status: "confirmed" }),
      createMockGuest("g-14", "Nelson Diogo", { status: "invited" }),
      createMockGuest("g-15", "Olívia Sitoe", { status: "confirmed" }),
      createMockGuest("g-16", "Paulo Zandamela", { status: "declined" }),
      createMockGuest("g-17", "Quitéria Manjate", { status: "invited" }),
      createMockGuest("g-18", "Rui Simango", { status: "confirmed" }),
      createMockGuest("g-19", "Sara Dhlakama", { status: "checked_in" }),
      createMockGuest("g-20", "Tiago Matsinhe", { status: "invited" }),
      createMockGuest("g-21", "Úrsula Magaia", { status: "confirmed" }),
      createMockGuest("g-22", "Valdemar Banze", { status: "invited" }),

      // 5 INELIGIBLE records
      createMockGuest("g-in-01", "Archived Guest 1", { archivedAt: "2026-08-19T00:00:00Z" }),
      createMockGuest("g-in-02", "Archived Guest 2", { archivedAt: "2026-08-18T00:00:00Z" }),
      createMockGuest("g-in-03", "Deleted Guest 1", { deletedAt: "2026-08-19T00:00:00Z" }),
      createMockGuest("g-in-04", "Deleted Guest 2", { deletedAt: "2026-08-18T00:00:00Z" }),
      createMockGuest("g-in-05", "Incorrect Guest 1", { isIncorrect: true }),
    ];

    assert.equal(rawGuests.length, 27, "Total raw input must be 27");

    const event = createMockEvent();
    const report = buildGuestEventReport({ event, guests: rawGuests, seats: [] });

    assert.equal(report.guests.length, 22, "Report guest count must be exactly 22");
    assert.equal(report.stats.primaryGuests, 22, "Primary guests stat must be exactly 22");
    assert.equal(report.stats.totalGuests, 22, "Total guests alias must be exactly 22");

    assert.ok(!report.guests.some((g) => g.id === "g-in-01"), "Archived 1 excluded");
    assert.ok(!report.guests.some((g) => g.id === "g-in-02"), "Archived 2 excluded");
    assert.ok(!report.guests.some((g) => g.id === "g-in-03"), "Deleted 1 excluded");
    assert.ok(!report.guests.some((g) => g.id === "g-in-04"), "Deleted 2 excluded");
    assert.ok(!report.guests.some((g) => g.id === "g-in-05"), "Incorrect 1 excluded");

    assert.ok(report.guests.some((g) => g.id === "g-04"), "Declined guest 04 remains included");
    assert.ok(report.guests.some((g) => g.id === "g-09"), "Declined guest 09 remains included");
    assert.ok(report.guests.some((g) => g.id === "g-16"), "Declined guest 16 remains included");
  });

  // ── 2. Rigorous Banqueting Headcount & RSVP Metrics Derivation ──
  it("G, H, I & J: Headcount and RSVP Metrics derivation", () => {
    const guests: EventGuest[] = [
      createMockGuest("g-01", "Ana Nhaca", { status: "confirmed", plusOnes: 1, seatId: "s-01" }),
      createMockGuest("g-02", "Bernardo Silva", { status: "confirmed", plusOnes: 0, seatId: "s-02" }),
      createMockGuest("g-03", "Carlos Tembe", { status: "checked_in", plusOnes: 2, seatId: "s-03" }),
      createMockGuest("g-04", "Daniela Matusse", { status: "declined", plusOnes: 3 }),
      createMockGuest("g-05", "Eduardo Cossa", { status: "invited", plusOnes: 1 }),
    ];

    const seats: EventSeat[] = [
      createMockSeat("s-01", "Imperial", 1),
      createMockSeat("s-02", "Imperial", 2),
      createMockSeat("s-03", "Imperial", 3),
      createMockSeat("s-04", "Imperial", 4),
      createMockSeat("s-05", "VIP", 1),
      createMockSeat("s-06", "VIP", 2),
    ];

    const stats = calculateGuestReportStats(guests, seats);

    assert.equal(stats.primaryGuests, 5);
    assert.equal(stats.confirmed, 2);
    assert.equal(stats.checkedIn, 1);
    assert.equal(stats.declined, 1);
    assert.equal(stats.invited, 1);
    assert.equal(stats.responded, 4);
    assert.equal(stats.responseRate, 80);
    assert.equal(stats.attendingPrimaryGuests, 3);
    assert.equal(stats.attendingPlusOnes, 3);
    assert.equal(stats.expectedAttendance, 6);
  });

  // ── 3. STAN CASE REGRESSION: 22 eligible, 20 companions, 42 expected attendance, NO seating ──
  it("Stan Case Regression: 22 guests, 20 companions, 42 expected attendance, 0 pending, 0 declined, 0 check-ins, NO seating", async () => {
    // 22 primary guests, each confirmed, 20 companions in total
    const stanGuests: EventGuest[] = Array.from({ length: 22 }, (_, i) => {
      const plusOnes = i < 20 ? 1 : 0; // 20 guests with +1, 2 guests with 0 => 20 companions
      return createMockGuest(`stan-${i + 1}`, `Convidado Real ${i + 1}`, {
        status: "confirmed",
        plusOnes,
        dietaryNotes: "",
        guestNotes: "",
      });
    });

    const event = createMockEvent({ name: "Casamento Real de Stan", type: "wedding" });
    const report = buildGuestEventReport({ event, guests: stanGuests, seats: [] });

    // Mathematical Invariants
    assert.equal(report.stats.primaryGuests, 22);
    assert.equal(report.stats.confirmed, 22);
    assert.equal(report.stats.invited, 0);
    assert.equal(report.stats.declined, 0);
    assert.equal(report.stats.checkedIn, 0);
    assert.equal(report.stats.plusOnesTotal, 20);
    assert.equal(report.stats.expectedAttendance, 42); // 22 + 20 = 42
    assert.equal(report.stats.responseRate, 100);

    // Adaptive Readiness Invariants (REPORT ONLY WHAT IS OPERATIONALLY TRUE)
    assert.equal(report.readiness.hasSeating, false, "Must report NO seating configured");
    assert.equal(report.readiness.seatingState, "not_configured");
    assert.equal(report.readiness.hasDietaryRequirements, false, "Must report NO dietary restrictions");
    assert.equal(report.readiness.hasGuestMessages, false, "Must report NO guest messages");
    assert.equal(report.readiness.hasCheckIns, false, "Must report NO check-ins");
    assert.equal(report.readiness.isSocialEvent, true, "Wedding is a social event");

    // Excel Workbook Invariant: Exactly 3 core worksheets, NO seating, NO dietary, NO messages
    const wb = await buildOfficialGuestOperationsWorkbook(report);
    assert.equal(wb.worksheets.length, 3, "Must have exactly 3 worksheets (Resumo, Lista, RSVP)");
    assert.equal(wb.worksheets[0].name, "01 — Resumo Executivo");
    assert.equal(wb.worksheets[1].name, "02 — Lista de Convidados");
    assert.equal(wb.worksheets[2].name, "03 — RSVP & Banquete");
    assert.ok(!wb.getWorksheet("04 — Mapa de Mesas"), "Must NOT create Mapa de Mesas worksheet");
    assert.ok(!wb.getWorksheet("05 — Cozinha & Alergias"), "Must NOT create Cozinha worksheet");
    assert.ok(!wb.getWorksheet("06 — Mensagens dos Convidados"), "Must NOT create Mensagens worksheet");

    // PDF Buffer renders cleanly without empty chapters
    const pdfBuffer = await generateGuestReportPDFBuffer(report);
    assert.ok(Buffer.isBuffer(pdfBuffer));
    assert.ok(pdfBuffer.length > 5000);
    assert.equal(pdfBuffer.subarray(0, 4).toString("utf-8"), "%PDF");
  });

  // ── 4. Conditional Section Tests (A to L) ──
  it("A & B: Seating configuration toggles seating readiness and worksheets", async () => {
    const guests = [
      createMockGuest("g-01", "Ana Nhaca", { status: "confirmed", seatId: "s-01" }),
      createMockGuest("g-02", "Bernardo Silva", { status: "confirmed", seatId: "s-02" }),
    ];
    const seats = [
      createMockSeat("s-01", "Mesa 1", 1),
      createMockSeat("s-02", "Mesa 1", 2),
    ];

    const reportWithSeats = buildGuestEventReport({
      event: createMockEvent(),
      guests,
      seats,
    });

    assert.equal(reportWithSeats.readiness.hasSeating, true);
    assert.equal(reportWithSeats.readiness.seatingState, "complete");

    const wb = await buildOfficialGuestOperationsWorkbook(reportWithSeats);
    assert.ok(wb.getWorksheet("04 — Mapa de Mesas"), "Mapa de Mesas worksheet must exist when seating is configured");
  });

  it("C: Partial seating reports partial state and unassigned count", () => {
    const guests = [
      createMockGuest("g-01", "Ana Nhaca", { status: "confirmed", seatId: "s-01" }),
      createMockGuest("g-02", "Bernardo Silva", { status: "confirmed", seatId: null }),
    ];
    const seats = [createMockSeat("s-01", "Mesa 1", 1)];

    const report = buildGuestEventReport({
      event: createMockEvent(),
      guests,
      seats,
    });

    assert.equal(report.readiness.hasSeating, true);
    assert.equal(report.readiness.seatingState, "partial");
    assert.equal(report.stats.unassignedGuests, 1);
  });

  it("D & E: Dietary restrictions toggle kitchen chapter and worksheet", async () => {
    const guests = [
      createMockGuest("g-01", "Ana Nhaca", { status: "confirmed", dietaryNotes: "Sem lactose" }),
      createMockGuest("g-02", "Bernardo Silva", { status: "confirmed" }),
    ];

    const report = buildGuestEventReport({
      event: createMockEvent(),
      guests,
      seats: [],
    });

    assert.equal(report.readiness.hasDietaryRequirements, true);
    assert.equal(report.dietaryGuests.length, 1);
    assert.equal(report.dietaryGuests[0].dietaryNotes, "Sem lactose");

    const wb = await buildOfficialGuestOperationsWorkbook(report);
    assert.ok(wb.getWorksheet("05 — Cozinha & Alergias"), "Cozinha worksheet must exist when dietary notes exist");
  });

  it("F & G: Guest messages and greetings separation from kitchen", async () => {
    const guests = [
      createMockGuest("g-01", "Ana Nhaca", { status: "confirmed", guestNotes: "Muitas felicidades aos noivos!" }),
      createMockGuest("g-02", "Bernardo Silva", { status: "confirmed", dietaryNotes: "Vegetariano", guestNotes: "Que Deus abençoe!" }),
    ];

    const report = buildGuestEventReport({
      event: createMockEvent(),
      guests,
      seats: [],
    });

    assert.equal(report.readiness.hasGuestMessages, true);
    assert.equal(report.messageGuests.length, 2);
    assert.equal(report.messageGuests[0].message, "Muitas felicidades aos noivos!");
    assert.equal(report.readiness.hasDietaryRequirements, true);
    assert.equal(report.dietaryGuests.length, 1, "Kitchen manifest contains ONLY the guest with dietaryNotes");

    const wb = await buildOfficialGuestOperationsWorkbook(report);
    assert.ok(wb.getWorksheet("06 — Mensagens dos Convidados"), "Mensagens worksheet must exist");
  });

  it("J, K & L: Event social class and exact seat reporting rules", () => {
    const socialEvent = createMockEvent({ type: "wedding" });
    assert.equal(getEventSocialClass(socialEvent.type), "social");
    assert.equal(shouldReportExactSeat(socialEvent, []), false);

    const corporateEvent = createMockEvent({ type: "corporate" });
    assert.equal(getEventSocialClass(corporateEvent.type), "corporate");

    const protocolEvent = createMockEvent({ type: "other" });
    const labeledSeats = [createMockSeat("s-01", "Mesa Presidencial", 1, "Cadeira 1 · Ministro")];
    assert.equal(shouldReportExactSeat(protocolEvent, labeledSeats), true);
  });

  // ── 5. Companion Semantics (M to P) ──
  it("M, N, O & P: Factual companion resolution and no heuristic guessing", () => {
    // 0 companions
    const g0 = createMockGuest("g-01", "Ana Nhaca", { plusOnes: 0, guestNotes: "Vem com o esposo Carlos" });
    const info0 = resolveGuestCompanionInfo(g0);
    assert.equal(info0.count, 0);
    assert.equal(info0.formattedLabel, "—");
    assert.equal(info0.totalPartySize, 1);

    // 1 companion
    const g1 = createMockGuest("g-02", "Bernardo Silva", { plusOnes: 1, guestNotes: "Traz acompanhante" });
    const info1 = resolveGuestCompanionInfo(g1);
    assert.equal(info1.count, 1);
    assert.equal(info1.formattedLabel, "+1 acompanhante");
    assert.equal(info1.totalPartySize, 2);

    // N companions
    const gN = createMockGuest("g-03", "Carlos Tembe", { plusOnes: 3 });
    const infoN = resolveGuestCompanionInfo(gN);
    assert.equal(infoN.count, 3);
    assert.equal(infoN.formattedLabel, "+3 acompanhantes");
    assert.equal(infoN.totalPartySize, 4);
  });

  // ── 6. Dedicated RSVP & Gifting Workbook Tests ──
  it("Dedicated RSVP & Gifting Workbook generates valid .xlsx buffer and sheets", async () => {
    const guests = [
      createMockGuest("g-01", "Ana Nhaca", { status: "confirmed", plusOnes: 1, guestNotes: "Muitas felicidades!" }),
      createMockGuest("g-02", "Bernardo Silva", { status: "confirmed" }),
    ];

    const giftReservations: EditionGiftReservation[] = [
      {
        id: "gift-01",
        registryKey: "KEY-01",
        giftId: "cozinha-01",
        giftName: "Serviço de Jantar Vista Alegre 68 Peças",
        category: "Cozinha",
        reservedBy: "Ana Nhaca",
        createdAt: "2026-08-20T12:00:00Z",
      },
    ];

    const report = buildGuestEventReport({
      event: createMockEvent({ editionRegistryKey: "KEY-01" }),
      guests,
      seats: [],
    });

    const wb = await buildOfficialRsvpGiftingWorkbook(report, giftReservations);
    assert.ok(wb.worksheets.length >= 4);
    assert.equal(wb.worksheets[0].name, "01 — Resumo Executivo");
    assert.equal(wb.worksheets[1].name, "02 — Lista RSVP");
    assert.equal(wb.worksheets[2].name, "03 — Dimensão de Grupos");
    assert.equal(wb.worksheets[3].name, "04 — Registo de Presentes");
    assert.ok(wb.getWorksheet("05 — Mensagens & Votos"), "Mensagens sheet present because guestNotes exist");

    const buffer = await buildRsvpGiftingExcelBuffer(report, giftReservations);
    assert.ok(Buffer.isBuffer(buffer));
    assert.ok(buffer.length > 5000);
    assert.equal(buffer.subarray(0, 2).toString("utf-8"), "PK");
  });

  // ── 7. Stress Tests ──
  it("Stress test: 120 guests and 30 seats per table generate valid PDF and Excel", async () => {
    const largeGuests = Array.from({ length: 120 }, (_, i) =>
      createMockGuest(`g-${i + 1}`, `Convidado Especial Nº ${i + 1}`, {
        status: i % 4 === 0 ? "confirmed" : i % 4 === 1 ? "checked_in" : i % 4 === 2 ? "invited" : "declined",
        plusOnes: i % 3 === 0 ? 1 : 0,
        dietaryNotes: i % 10 === 0 ? "Sem glúten" : "",
        seatId: `s-${(i % 30) + 1}`,
      })
    );

    const largeSeats = Array.from({ length: 30 }, (_, i) =>
      createMockSeat(`s-${i + 1}`, "Mesa Magna Imperial", i + 1)
    );

    const report = buildGuestEventReport({
      event: createMockEvent(),
      guests: largeGuests,
      seats: largeSeats,
    });

    assert.equal(report.guests.length, 120);

    const pdfBuffer = await generateGuestReportPDFBuffer(report);
    assert.ok(Buffer.isBuffer(pdfBuffer));
    assert.ok(pdfBuffer.length > 20000);
    assert.equal(pdfBuffer.subarray(0, 4).toString("utf-8"), "%PDF");

    const excelBuffer = await buildGuestReportExcelBuffer(report);
    assert.ok(Buffer.isBuffer(excelBuffer));
    assert.ok(excelBuffer.length > 10000);
  });
});
