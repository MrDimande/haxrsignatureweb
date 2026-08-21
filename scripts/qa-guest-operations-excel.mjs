import fs from "node:fs/promises";
import path from "node:path";
import { buildGuestEventReport } from "../src/lib/events/export/report.ts";
import { buildGuestReportExcelBuffer } from "../src/lib/events/export/excel-guest-operations.ts";
import { buildRsvpGiftingExcelBuffer } from "../src/lib/events/export/excel-rsvp-gifting.ts";

const outputDir = path.join(process.cwd(), ".qa-pdf-output", "guest-report");
await fs.mkdir(outputDir, { recursive: true });

function makeGuest(id, name, overrides = {}) {
  return {
    id,
    eventId: "ev-carolina-mario",
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

const baseEvent = {
  id: "ev-carolina-mario",
  businessId: "haxr-signature",
  clientId: "c-1",
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
  editionRegistryKey: "KEY-CAROL-MARIO",
  postEventReportSentAt: null,
  dateHoldUntil: null,
  createdAt: "2026-08-20T10:00:00Z",
  updatedAt: "2026-08-20T10:00:00Z",
};

// 1. Stan Case: 22 guests, 20 companions, 42 headcount, NO seating
console.log("Generating XLSX 01: Guest Operations (No Seating - Stan Case)...");
const stanGuests = Array.from({ length: 22 }, (_, i) =>
  makeGuest(`stan-${i + 1}`, `Convidado VIP ${i + 1}`, {
    status: "confirmed",
    plusOnes: i < 20 ? 1 : 0,
  })
);
const report01 = buildGuestEventReport({ event: baseEvent, guests: stanGuests, seats: [] });
const buf01 = await buildGuestReportExcelBuffer(report01);
await fs.writeFile(path.join(outputDir, "01_guest_operations_no_seating.xlsx"), buf01);
console.log("  -> Saved 01_guest_operations_no_seating.xlsx (" + buf01.length + " bytes)");

// 2. Social event with full seating
console.log("Generating XLSX 02: Guest Operations (With Seating)...");
const seatedGuests = [
  makeGuest("g-01", "Ana Nhaca", { status: "confirmed", plusOnes: 1, seatId: "s-01" }),
  makeGuest("g-02", "Bernardo Silva", { status: "confirmed", plusOnes: 0, seatId: "s-02" }),
  makeGuest("g-03", "Carlos Tembe", { status: "checked_in", plusOnes: 1, seatId: "s-03" }),
  makeGuest("g-04", "Daniela Matusse", { status: "confirmed", plusOnes: 0, seatId: "s-04" }),
];
const seats = [
  { id: "s-01", eventId: "ev-carolina-mario", tableName: "Imperial", seatNumber: 1, label: "Noiva", createdAt: "", guestId: null, guestName: null },
  { id: "s-02", eventId: "ev-carolina-mario", tableName: "Imperial", seatNumber: 2, label: "Noivo", createdAt: "", guestId: null, guestName: null },
  { id: "s-03", eventId: "ev-carolina-mario", tableName: "Família", seatNumber: 1, label: "", createdAt: "", guestId: null, guestName: null },
  { id: "s-04", eventId: "ev-carolina-mario", tableName: "Família", seatNumber: 2, label: "", createdAt: "", guestId: null, guestName: null },
];
const report02 = buildGuestEventReport({ event: baseEvent, guests: seatedGuests, seats });
const buf02 = await buildGuestReportExcelBuffer(report02);
await fs.writeFile(path.join(outputDir, "02_guest_operations_with_seating.xlsx"), buf02);
console.log("  -> Saved 02_guest_operations_with_seating.xlsx (" + buf02.length + " bytes)");

// 3. Event with dietary requirements + messages
console.log("Generating XLSX 03: Guest Operations (Dietary & Messages)...");
const dietaryGuests = [
  makeGuest("g-01", "Beatriz Fontes", { status: "confirmed", dietaryNotes: "Alergia severa a marisco", guestNotes: "Muitas felicidades ao lindo casal!" }),
  makeGuest("g-02", "Carlos Eduardo", { status: "confirmed", dietaryNotes: "Vegetariano estrito", guestNotes: "Que Deus abençoe esta união." }),
  makeGuest("g-03", "Diana Vasconcelos", { status: "checked_in", guestNotes: "Honrada pelo convite!" }),
];
const report03 = buildGuestEventReport({ event: baseEvent, guests: dietaryGuests, seats: [] });
const buf03 = await buildGuestReportExcelBuffer(report03);
await fs.writeFile(path.join(outputDir, "03_guest_operations_dietary.xlsx"), buf03);
console.log("  -> Saved 03_guest_operations_dietary.xlsx (" + buf03.length + " bytes)");

// 4. Dedicated RSVP & Gifting Book
console.log("Generating XLSX 04: Dedicated RSVP & Gifting Book...");
const giftReservations = [
  {
    id: "gift-01",
    editionId: "ed-01",
    editionRegistryKey: "KEY-CAROL-MARIO",
    giftId: "g-01",
    giftName: "Serviço de Jantar Vista Alegre 68 Peças",
    category: "Cozinha & Mesa",
    reservedBy: "Beatriz Fontes",
    reservedByEmail: "beatriz@example.com",
    reservedByPhone: "+258 84 111 2222",
    notes: "Com todo carinho!",
    isArchived: false,
    createdAt: "2026-08-20T14:30:00Z",
    updatedAt: "2026-08-20T14:30:00Z",
  },
  {
    id: "gift-02",
    editionId: "ed-01",
    editionRegistryKey: "KEY-CAROL-MARIO",
    giftId: "g-02",
    giftName: "Conjunto de Faqueiro Ouro Mate Cutipol",
    category: "Cozinha & Mesa",
    reservedBy: "Carlos Eduardo",
    reservedByEmail: "carlos@example.com",
    reservedByPhone: "+258 84 333 4444",
    notes: "Parabéns aos noivos!",
    isArchived: false,
    createdAt: "2026-08-20T15:00:00Z",
    updatedAt: "2026-08-20T15:00:00Z",
  },
];
const report04 = buildGuestEventReport({ event: baseEvent, guests: dietaryGuests, seats: [] });
const buf04 = await buildRsvpGiftingExcelBuffer(report04, giftReservations);
await fs.writeFile(path.join(outputDir, "04_rsvp_gifting_book.xlsx"), buf04);
console.log("  -> Saved 04_rsvp_gifting_book.xlsx (" + buf04.length + " bytes)");

// 5. Non-HAXR Corporate Event Operations
console.log("Generating XLSX 05: Non-HAXR Operations (BrainyWrite Corporate)...");
const corpEvent = {
  ...baseEvent,
  businessId: "brainywrite",
  name: "BrainyWrite Corporate Summit 2026",
  type: "corporate",
  location: "Radisson Blu Hotel, Maputo",
};
const corpGuests = [
  makeGuest("g-corp-01", "Dra. Alice Nogueira", { status: "confirmed", clientType: "corporate" }),
  makeGuest("g-corp-02", "Dr. Bruno Esteves", { status: "checked_in", clientType: "corporate" }),
  makeGuest("g-corp-03", "Dra. Cecília Mendes", { status: "invited", clientType: "corporate" }),
];
const report05 = buildGuestEventReport({ event: corpEvent, guests: corpGuests, seats: [] });
const buf05 = await buildGuestReportExcelBuffer(report05, "BrainyWrite");
await fs.writeFile(path.join(outputDir, "05_non_haxr_operations.xlsx"), buf05);
console.log("  -> Saved 05_non_haxr_operations.xlsx (" + buf05.length + " bytes)");

console.log("\nAll 5 Excel workbooks generated successfully!");
