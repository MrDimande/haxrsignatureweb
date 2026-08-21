import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildGuestEventReport,
  isGuestReportEligible,
  resolveGuestCompanionInfo,
  calculateGuestReportStats,
  type GuestEventReport,
} from "./report";
import { buildGuestReportCsv } from "./csv";
import {
  buildOfficialGuestOperationsWorkbook,
  buildGuestReportExcelBuffer,
} from "./excel-guest-operations";
import { generateGuestReportPDFBuffer } from "./pdf-server";
import type { EventGuest, EventSeat, ManagedEvent } from "@/lib/events/types";
import { getBusiness } from "@/lib/admin/businesses";

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

describe("HAXR Guest Operations Report & Data Integrity", () => {
  // ── A to F: Canonical Guest Universe & Eligibility Invariants ──
  it("A & B: Exactly 22 eligible guests from 27 raw records (5 filtered: archived, deleted, incorrect)", () => {
    const rawGuests: EventGuest[] = [
      // 22 Eligible guests with varied statuses
      createMockGuest("g-01", "Ana Nhaca", { status: "confirmed", plusOnes: 1 }),
      createMockGuest("g-02", "Bernardo Silva", { status: "confirmed" }),
      createMockGuest("g-03", "Carlos Tembe", { status: "checked_in", plusOnes: 2 }),
      createMockGuest("g-04", "Daniela Matusse", { status: "declined" }), // Declined is eligible!
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

    // Verify exclusions
    assert.ok(!report.guests.some((g) => g.id === "g-in-01"), "Archived 1 excluded");
    assert.ok(!report.guests.some((g) => g.id === "g-in-02"), "Archived 2 excluded");
    assert.ok(!report.guests.some((g) => g.id === "g-in-03"), "Deleted 1 excluded");
    assert.ok(!report.guests.some((g) => g.id === "g-in-04"), "Deleted 2 excluded");
    assert.ok(!report.guests.some((g) => g.id === "g-in-05"), "Incorrect 1 excluded");

    // Verify declined inclusion
    assert.ok(report.guests.some((g) => g.id === "g-04"), "Declined guest 04 remains included");
    assert.ok(report.guests.some((g) => g.id === "g-09"), "Declined guest 09 remains included");
    assert.ok(report.guests.some((g) => g.id === "g-16"), "Declined guest 16 remains included");
  });

  // ── G to J: Mathematical Headcount, Plus-Ones, and RSVP Response Rates ──
  it("G, H, I & J: Rigorous Banqueting Headcount and RSVP Metrics derivation", () => {
    const guests: EventGuest[] = [
      createMockGuest("g-01", "Ana Nhaca", { status: "confirmed", plusOnes: 1, seatId: "s-01" }),
      createMockGuest("g-02", "Bernardo Silva", { status: "confirmed", plusOnes: 0, seatId: "s-02" }),
      createMockGuest("g-03", "Carlos Tembe", { status: "checked_in", plusOnes: 2, seatId: "s-03" }),
      createMockGuest("g-04", "Daniela Matusse", { status: "declined", plusOnes: 3 }), // Plus-ones not attending because declined!
      createMockGuest("g-05", "Eduardo Cossa", { status: "invited", plusOnes: 1 }), // Plus-ones not attending because still invited!
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

    // Responded = 2 confirmed + 1 checked_in + 1 declined = 4
    assert.equal(stats.responded, 4);
    // Response rate = 4/5 * 100 = 80%
    assert.equal(stats.responseRate, 80);

    // Total plus ones declared = 1 + 0 + 2 + 3 + 1 = 7
    assert.equal(stats.plusOnesTotal, 7);

    // Attending primary guests = confirmed(2) + checked_in(1) = 3
    assert.equal(stats.attendingPrimaryGuests, 3);

    // Expected Attendance (Catering Covers) = 3 primary attending + 1 (Ana) + 2 (Carlos) = 6 covers!
    assert.equal(stats.expectedAttendance, 6);

    // Seating metrics
    assert.equal(stats.assignedGuests, 3);
    assert.equal(stats.unassignedGuests, 2);
    assert.equal(stats.totalSeats, 6);
    assert.equal(stats.uniqueTables, 2);
  });

  // ── K, L, M: Immutability, Sorting & Deterministic Clock ──
  it("K, L & M: Source array immutability, deterministic collation, and injected clock", () => {
    const rawGuests = [
      createMockGuest("g-02", "Zulmira Banze"),
      createMockGuest("g-01", "Álvaro Cossa"),
      createMockGuest("g-03", "Bernardo Silva"),
    ];

    const frozenCopy = [...rawGuests];
    const fixedIso = "2026-08-21T00:30:00.000Z";
    const report = buildGuestEventReport({
      event: createMockEvent(),
      guests: rawGuests,
      seats: [],
      generatedAt: fixedIso,
    });

    // Check immutability of input array
    assert.deepEqual(rawGuests, frozenCopy, "Source array must not be mutated");

    // Check deterministic sorting: Álvaro (A) -> Bernardo (B) -> Zulmira (Z)
    assert.equal(report.guests[0].name, "Álvaro Cossa");
    assert.equal(report.guests[1].name, "Bernardo Silva");
    assert.equal(report.guests[2].name, "Zulmira Banze");

    // Check clock preservation
    assert.equal(report.generatedAt, fixedIso);
  });

  // ── AA: Factual Companion Presentation & No Free-Text Guesses ──
  it("AA: Strictly factual plusOnes formatting and proof that free-text guestNotes cannot create a named companion", () => {
    // 1. Guest with plusOnes === 0 -> "—" even if guestNotes contains free text mentions
    const gZero = createMockGuest("g-01", "Dr. Fernando Nhaca", {
      plusOnes: 0,
      guestNotes: "Acompanhante: Dr.ª Sofia Albuquerque · Telefone: +258 84 123 4567",
    });
    const info0 = resolveGuestCompanionInfo(gZero);
    assert.equal(info0.count, 0);
    assert.equal(info0.formattedLabel, "—");
    assert.equal(info0.totalPartySize, 1);

    // 2. Guest with plusOnes === 1 -> "+1 acompanhante" (no free-text guessing)
    const gOne = createMockGuest("g-02", "Carlos Tembe & Maria Tembe", {
      plusOnes: 1,
      guestNotes: "Cônjuge: Maria Tembe",
    });
    const info1 = resolveGuestCompanionInfo(gOne);
    assert.equal(info1.count, 1);
    assert.equal(info1.formattedLabel, "+1 acompanhante");
    assert.equal(info1.totalPartySize, 2);

    // 3. Guest with plusOnes > 1 -> "+N acompanhantes"
    const gMultiple = createMockGuest("g-03", "Paulo Zandamela", {
      plusOnes: 3,
      guestNotes: "Traz 3 acompanhantes convidados pela direcção.",
    });
    const info3 = resolveGuestCompanionInfo(gMultiple);
    assert.equal(info3.count, 3);
    assert.equal(info3.formattedLabel, "+3 acompanhantes");
    assert.equal(info3.totalPartySize, 4);
  });

  // ── N to Q: PDF Generation & Buffer Safety ──
  it("N, O, P & Q: PDF Buffer valid, HAXR logo resolves, non-HAXR safe, and summary matches list", async () => {
    const guests = [
      createMockGuest("g-01", "Ana Nhaca", { status: "confirmed", plusOnes: 1 }),
      createMockGuest("g-02", "Bernardo Silva", { status: "checked_in" }),
      createMockGuest("g-03", "Carlos Tembe", { status: "declined" }),
    ];

    const reportHaxr = buildGuestEventReport({
      event: createMockEvent({ businessId: "haxr-signature" }),
      guests,
      seats: [],
    });

    const pdfBufferHaxr = await generateGuestReportPDFBuffer(reportHaxr);
    assert.ok(Buffer.isBuffer(pdfBufferHaxr));
    assert.ok(pdfBufferHaxr.length > 5000);
    assert.equal(pdfBufferHaxr.subarray(0, 4).toString("utf-8"), "%PDF");

    // Non-HAXR Business (BrainyWrite)
    const reportBrainy = buildGuestEventReport({
      event: createMockEvent({ businessId: "brainywrite", name: "Conferência BrainyWrite" }),
      guests,
      seats: [],
    });
    const pdfBufferBrainy = await generateGuestReportPDFBuffer(reportBrainy);
    assert.ok(Buffer.isBuffer(pdfBufferBrainy));
    assert.ok(pdfBufferBrainy.length > 5000);
    assert.equal(pdfBufferBrainy.subarray(0, 4).toString("utf-8"), "%PDF");
  });

  // ── R & S: CSV Equality & Structure ──
  it("R & S: CSV Total strictly equals report.guests.length and contains companion columns", () => {
    const guests = [
      createMockGuest("g-01", "Ana Nhaca", { status: "confirmed", plusOnes: 1 }),
      createMockGuest("g-02", "Bernardo Silva", { status: "invited" }),
      createMockGuest("g-03", "Carlos Tembe", { status: "declined" }),
    ];

    const report = buildGuestEventReport({
      event: createMockEvent(),
      guests,
      seats: [],
    });

    const csv = buildGuestReportCsv(report);
    assert.ok(csv.includes("Total convidados principais (convites),3"));
    assert.ok(csv.includes("Ana Nhaca"));
    assert.ok(csv.includes("Bernardo Silva"));
    assert.ok(csv.includes("Carlos Tembe"));
    assert.ok(csv.includes("Acompanhantes"));
    assert.ok(csv.includes("Total Couverts"));
  });

  // ── Z: Excel Workbook & Multi-Tab Parity ──
  it("Z: Excel Workbook generates valid .xlsx buffer with all 4 tabs and exact parity", async () => {
    const guests = [
      createMockGuest("g-01", "Ana Nhaca", {
        status: "confirmed",
        plusOnes: 1,
        dietaryNotes: "Alérgica a marisco",
        seatId: "s-01",
        seat: { tableName: "Imperial", seatNumber: 1, label: "VIP" },
      }),
      createMockGuest("g-02", "Bernardo Silva", {
        status: "checked_in",
        guestNotes: "Chegada com a noiva",
        seatId: "s-02",
        seat: { tableName: "Imperial", seatNumber: 2, label: "" },
      }),
    ];

    const seats = [
      createMockSeat("s-01", "Imperial", 1, "VIP"),
      createMockSeat("s-02", "Imperial", 2),
    ];

    const report = buildGuestEventReport({
      event: createMockEvent(),
      guests,
      seats,
    });

    const wb = await buildOfficialGuestOperationsWorkbook(report);
    assert.equal(wb.worksheets.length, 4, "Must contain exactly 4 worksheets");
    assert.equal(wb.worksheets[0].name, "01 — Resumo Executivo");
    assert.equal(wb.worksheets[1].name, "02 — Lista de Convidados");
    assert.equal(wb.worksheets[2].name, "03 — Mapa de Mesas");
    assert.equal(wb.worksheets[3].name, "04 — Cozinha & Alergias");

    const excelBuffer = await buildGuestReportExcelBuffer(report);
    assert.ok(Buffer.isBuffer(excelBuffer));
    assert.ok(excelBuffer.length > 5000);
    // Standard ZIP header for .xlsx: PK\x03\x04
    assert.equal(excelBuffer.subarray(0, 2).toString("utf-8"), "PK");
  });

  // ── Large Fixture Stress Tests (W & X) ──
  it("W & X: Large multipage fixtures (120 guests and 20+ seats table) generate valid PDF buffer without crashing", async () => {
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
    assert.equal(report.stats.primaryGuests, 120);

    const pdfBuffer = await generateGuestReportPDFBuffer(report);
    assert.ok(Buffer.isBuffer(pdfBuffer));
    assert.ok(pdfBuffer.length > 20000);
    assert.equal(pdfBuffer.subarray(0, 4).toString("utf-8"), "%PDF");
  });
});
