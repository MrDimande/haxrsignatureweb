import fs from "node:fs/promises";
import path from "node:path";
import React from "react";
import { renderToFile } from "@react-pdf/renderer";
import { createCanvas } from "@napi-rs/canvas";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

import GuestReportPDFDocModule from "../src/components/events/GuestReportPDF.tsx";
import { getBusiness } from "../src/lib/admin/businesses.ts";
import {
  resolveDocumentLogoPath,
  normalizePdfLogoPath,
} from "../src/lib/admin/pdf-assets.ts";
import {
  buildGuestEventReport,
  calculateGuestReportStats,
} from "../src/lib/events/export/report.ts";
import { buildGuestReportExcelBuffer } from "../src/lib/events/export/excel-guest-operations.ts";

const GuestReportPDF = GuestReportPDFDocModule.default || GuestReportPDFDocModule;

const outputDir = path.join(process.cwd(), ".qa-pdf-output", "guest-report");
const artifactsDir = "C:\\Users\\Aldim\\.gemini\\antigravity-ide\\brain\\2e2e129d-ef54-4596-822b-200e772ffc24";
await fs.mkdir(outputDir, { recursive: true });

async function loadLocalLogoBase64(logoPath) {
  const normalized = normalizePdfLogoPath(logoPath);
  const relativePath = normalized.replace(/^\//, "");
  const filePath = path.join(process.cwd(), "public", relativePath);
  const buffer = await fs.readFile(filePath);
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const mime =
    ext === "jpg" || ext === "jpeg"
      ? "image/jpeg"
      : ext === "webp"
        ? "image/webp"
        : "image/png";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

async function renderPdfPagesToPng(pdfPath, baseName) {
  const data = new Uint8Array(await fs.readFile(pdfPath));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const numPages = doc.numPages;
  console.log(`Rendering ${numPages} page(s) of ${baseName}...`);

  for (let i = 1; i <= numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = createCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext("2d");

    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise;

    const pngBuffer = canvas.toBuffer("image/png");
    const outPngName = `${baseName}_page_${i}.png`;
    const localPngPath = path.join(outputDir, outPngName);
    const artifactPngPath = path.join(artifactsDir, outPngName);

    await fs.writeFile(localPngPath, pngBuffer);
    try {
      await fs.writeFile(artifactPngPath, pngBuffer);
    } catch {}
    console.log(`  -> Saved ${outPngName} (${pngBuffer.length} bytes)`);
  }
}

// ── Mock Generators ──
const haxrBusiness = getBusiness("haxr-signature");
const brainyBusiness = getBusiness("brainywrite");

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
  editionRegistryKey: "",
  postEventReportSentAt: null,
  dateHoldUntil: null,
  createdAt: "2026-08-20T10:00:00Z",
  updatedAt: "2026-08-20T10:00:00Z",
};

function makeGuest(id, name, overrides = {}) {
  return {
    id,
    eventId: "ev-carolina-mario",
    name,
    nameNormalized: name.toLowerCase(),
    email: `${name.toLowerCase().replace(/[^a-z0-9]/g, "")}@example.com`,
    phone: "+258 84 100 2000",
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

function makeSeat(id, tableName, seatNumber, label = "") {
  return {
    id,
    eventId: "ev-carolina-mario",
    tableName,
    seatNumber,
    label,
    createdAt: "2026-08-20T10:00:00Z",
    guestId: null,
    guestName: null,
  };
}

// ─────────────────────────────────────────────────────────────
// FIXTURE 01: Canonical 22 Eligible Guests (Wedding Editorial Ivory)
// ─────────────────────────────────────────────────────────────
console.log("Generating Fixture 01: Canonical 22 Eligible Guests...");
const logo01 = await loadLocalLogoBase64(
  resolveDocumentLogoPath(haxrBusiness, "editorial_ivory")
);

const fixture01RawGuests = [
  makeGuest("g-01", "Ana Nhaca", {
    status: "confirmed",
    plusOnes: 1,
    guestNotes: "Acompanhante: Eng. Roberto Nhaca · Telefone: +258 84 111 2222",
    dietaryNotes: "Alérgica severa a frutos do mar e marisco",
    seatId: "s-01",
    seat: { tableName: "Imperial", seatNumber: 1, label: "VIP" },
  }),
  makeGuest("g-02", "Bernardo Silva & Sofia Albuquerque", {
    status: "confirmed",
    plusOnes: 1,
    seatId: "s-02",
    seat: { tableName: "Imperial", seatNumber: 2, label: "VIP" },
  }),
  makeGuest("g-03", "Carlos Tembe", {
    status: "checked_in",
    plusOnes: 2,
    checkedInAt: "2026-11-28T14:30:00Z",
    seatId: "s-03",
    seat: { tableName: "Imperial", seatNumber: 3, label: "" },
  }),
  makeGuest("g-04", "Daniela Matusse", {
    status: "declined",
    guestNotes: "Ausente no estrangeiro durante a data da cerimónia.",
  }),
  makeGuest("g-05", "Eduardo Cossa", {
    status: "invited",
    seatId: "s-04",
    seat: { tableName: "Imperial", seatNumber: 4, label: "" },
  }),
  makeGuest("g-06", "Fernanda Langa", {
    status: "confirmed",
    plusOnes: 1,
    seatId: "s-05",
    seat: { tableName: "Presidencial", seatNumber: 1, label: "Padrinhos" },
  }),
  makeGuest("g-07", "Gabriel Machava", {
    status: "invited",
    plusOnes: 1,
    seatId: "s-06",
    seat: { tableName: "Presidencial", seatNumber: 2, label: "Padrinhos" },
  }),
  makeGuest("g-08", "Helena Mabunda", {
    status: "confirmed",
    dietaryNotes: "Dieta Vegetariana estrita",
    seatId: "s-07",
    seat: { tableName: "Presidencial", seatNumber: 3, label: "" },
  }),
  makeGuest("g-09", "Inácio Macamo", {
    status: "declined",
  }),
  makeGuest("g-10", "Joana Mondlane", {
    status: "checked_in",
    checkedInAt: "2026-11-28T14:45:00Z",
    seatId: "s-08",
    seat: { tableName: "Presidencial", seatNumber: 4, label: "" },
  }),
  makeGuest("g-11", "Kátia Chissano", {
    status: "invited",
    seatId: "s-09",
    seat: { tableName: "Família", seatNumber: 1, label: "" },
  }),
  makeGuest("g-12", "Lucas Guebuza", {
    status: "confirmed",
    plusOnes: 1,
    guestNotes: "Cônjuge: Maria Guebuza",
    seatId: "s-10",
    seat: { tableName: "Família", seatNumber: 2, label: "" },
  }),
  makeGuest("g-13", "Marta Nyusi", {
    status: "confirmed",
    dietaryNotes: "Sem glúten (Celíaca)",
    seatId: "s-11",
    seat: { tableName: "Família", seatNumber: 3, label: "" },
  }),
  makeGuest("g-14", "Nelson Diogo", {
    status: "invited",
    seatId: "s-12",
    seat: { tableName: "Família", seatNumber: 4, label: "" },
  }),
  makeGuest("g-15", "Olívia Sitoe", {
    status: "confirmed",
    seatId: "s-13",
    seat: { tableName: "Amigos de Honra", seatNumber: 1, label: "" },
  }),
  makeGuest("g-16", "Paulo Zandamela", {
    status: "declined",
  }),
  makeGuest("g-17", "Quitéria Manjate", {
    status: "invited",
    seatId: "s-14",
    seat: { tableName: "Amigos de Honra", seatNumber: 2, label: "" },
  }),
  makeGuest("g-18", "Rui Simango", {
    status: "confirmed",
    seatId: "s-15",
    seat: { tableName: "Amigos de Honra", seatNumber: 3, label: "" },
  }),
  makeGuest("g-19", "Sara Dhlakama", {
    status: "checked_in",
    checkedInAt: "2026-11-28T15:00:00Z",
    seatId: "s-16",
    seat: { tableName: "Amigos de Honra", seatNumber: 4, label: "" },
  }),
  makeGuest("g-20", "Tiago Matsinhe", {
    status: "invited",
  }), // Sem lugar
  makeGuest("g-21", "Úrsula Magaia", {
    status: "confirmed",
    plusOnes: 1,
  }), // Sem lugar
  makeGuest("g-22", "Valdemar Banze", {
    status: "invited",
  }), // Sem lugar

  // 5 Ineligible records that MUST be excluded
  makeGuest("g-in-01", "Ineligible Archived 1", { archivedAt: "2026-08-19T00:00:00Z" }),
  makeGuest("g-in-02", "Ineligible Archived 2", { archivedAt: "2026-08-18T00:00:00Z" }),
  makeGuest("g-in-03", "Ineligible Deleted 1", { deletedAt: "2026-08-19T00:00:00Z" }),
  makeGuest("g-in-04", "Ineligible Deleted 2", { deletedAt: "2026-08-18T00:00:00Z" }),
  makeGuest("g-in-05", "Ineligible Incorrect 1", { isIncorrect: true }),
];

const fixture01Seats = [
  makeSeat("s-01", "Imperial", 1, "VIP"),
  makeSeat("s-02", "Imperial", 2, "VIP"),
  makeSeat("s-03", "Imperial", 3),
  makeSeat("s-04", "Imperial", 4),
  makeSeat("s-05", "Presidencial", 1, "Padrinhos"),
  makeSeat("s-06", "Presidencial", 2, "Padrinhos"),
  makeSeat("s-07", "Presidencial", 3),
  makeSeat("s-08", "Presidencial", 4),
  makeSeat("s-09", "Família", 1),
  makeSeat("s-10", "Família", 2),
  makeSeat("s-11", "Família", 3),
  makeSeat("s-12", "Família", 4),
  makeSeat("s-13", "Amigos de Honra", 1),
  makeSeat("s-14", "Amigos de Honra", 2),
  makeSeat("s-15", "Amigos de Honra", 3),
  makeSeat("s-16", "Amigos de Honra", 4),
];

const report01 = buildGuestEventReport({
  event: baseEvent,
  guests: fixture01RawGuests,
  seats: fixture01Seats,
  generatedAt: "2026-08-21T00:00:00.000Z",
});

const pdf01Path = path.join(outputDir, "01_wedding_editorial_ivory_canonical_22_guests.pdf");
await renderToFile(
  React.createElement(GuestReportPDF, {
    report: report01,
    logoUrl: logo01,
  }),
  pdf01Path
);

// Also generate Excel workbook for fixture 01
const excel01Buffer = await buildGuestReportExcelBuffer(report01);
const excel01Path = path.join(outputDir, "01_wedding_operations_master_workbook.xlsx");
await fs.writeFile(excel01Path, excel01Buffer);
console.log(`Saved Excel Master Workbook: ${excel01Path} (${excel01Buffer.length} bytes)`);

// ─────────────────────────────────────────────────────────────
// FIXTURE 02: Multipage 120 Guests Banquet Stress
// ─────────────────────────────────────────────────────────────
console.log("Generating Fixture 02: Multipage 120 Guests Banquet Stress...");
const fixture02Guests = Array.from({ length: 120 }, (_, i) => {
  const num = i + 1;
  const hasPlus = num % 3 === 0;
  const isDiet = num % 8 === 0;
  const tableIndex = Math.floor(i / 10) + 1;
  const seatIndex = (i % 10) + 1;
  return makeGuest(`g-stress-${num}`, `Convidado Distinto Dr. António Sebastião de Albuquerque Nº ${num}`, {
    status: num % 4 === 0 ? "confirmed" : num % 4 === 1 ? "checked_in" : num % 4 === 2 ? "invited" : "declined",
    plusOnes: hasPlus ? 1 : 0,
    guestNotes: hasPlus ? `Acompanhante: Dr.ª Maria Teresa de Albuquerque Nº ${num}` : "",
    dietaryNotes: isDiet ? "Intolerância severa a lactose e frutos secos" : "",
    seatId: `s-stress-${tableIndex}-${seatIndex}`,
    seat: { tableName: `Mesa ${tableIndex}`, seatNumber: seatIndex, label: "" },
  });
});

const fixture02Seats = [];
for (let t = 1; t <= 12; t++) {
  for (let s = 1; s <= 10; s++) {
    fixture02Seats.push(makeSeat(`s-stress-${t}-${s}`, `Mesa ${t}`, s));
  }
}

const report02 = buildGuestEventReport({
  event: {
    ...baseEvent,
    name: "Grande Banquete de Gala 2026",
    type: "banquet",
  },
  guests: fixture02Guests,
  seats: fixture02Seats,
});

const pdf02Path = path.join(outputDir, "02_multipage_120_guests_banquet_stress.pdf");
await renderToFile(
  React.createElement(GuestReportPDF, {
    report: report02,
    logoUrl: logo01,
  }),
  pdf02Path
);

// ─────────────────────────────────────────────────────────────
// FIXTURE 03: Table Seating Flow (24 Seats per Table)
// ─────────────────────────────────────────────────────────────
console.log("Generating Fixture 03: Table Seating Flow (24 Seats per Table)...");
const fixture03Seats = [];
const fixture03Guests = [];

for (let t = 1; t <= 2; t++) {
  for (let s = 1; s <= 24; s++) {
    const sId = `s-mega-${t}-${s}`;
    fixture03Seats.push(makeSeat(sId, `Mesa Imperial Magna ${t}`, s, s <= 4 ? "Honra" : ""));
    if (s <= 20) {
      fixture03Guests.push(
        makeGuest(`g-mega-${t}-${s}`, `Convidado Mesa ${t} Lugar ${s}`, {
          status: s % 2 === 0 ? "confirmed" : "checked_in",
          plusOnes: s % 5 === 0 ? 1 : 0,
          seatId: sId,
          seat: { tableName: `Mesa Imperial Magna ${t}`, seatNumber: s, label: s <= 4 ? "Honra" : "" },
        })
      );
    }
  }
}

const report03 = buildGuestEventReport({
  event: baseEvent,
  guests: fixture03Guests,
  seats: fixture03Seats,
});

const pdf03Path = path.join(outputDir, "03_table_seating_flow_24_seats_per_table.pdf");
await renderToFile(
  React.createElement(GuestReportPDF, {
    report: report03,
    logoUrl: logo01,
  }),
  pdf03Path
);

// ─────────────────────────────────────────────────────────────
// FIXTURE 04: Dietary & Kitchen Manifest Ops
// ─────────────────────────────────────────────────────────────
console.log("Generating Fixture 04: Dietary Manifest & Kitchen Ops...");
const fixture04Guests = [
  makeGuest("g-diet-01", "Beatriz Fontes", {
    status: "confirmed",
    dietaryNotes: "Alergia anafilática a amendoim e frutos secos (EpiPen)",
    guestNotes: "Mesa próxima à saída de emergência recomendada.",
    seat: { tableName: "Mesa 1", seatNumber: 1, label: "" },
  }),
  makeGuest("g-diet-02", "Carlos Eduardo", {
    status: "confirmed",
    dietaryNotes: "Dieta Kosher estrita",
    guestNotes: "Refeição selada fornecida por fornecedor certificado.",
    seat: { tableName: "Mesa 1", seatNumber: 2, label: "" },
  }),
  makeGuest("g-diet-03", "Dra. Diana Vasconcelos", {
    status: "checked_in",
    dietaryNotes: "Dieta Halal",
    seat: { tableName: "Mesa 2", seatNumber: 1, label: "" },
  }),
  makeGuest("g-diet-04", "Eng. Ernesto Matos", {
    status: "confirmed",
    dietaryNotes: "Vegano estrito — sem derivados animais",
    seat: { tableName: "Mesa 2", seatNumber: 2, label: "" },
  }),
];

const report04 = buildGuestEventReport({
  event: baseEvent,
  guests: fixture04Guests,
  seats: [],
});

const pdf04Path = path.join(outputDir, "04_dietary_manifest_kitchen_ops.pdf");
await renderToFile(
  React.createElement(GuestReportPDF, {
    report: report04,
    logoUrl: logo01,
  }),
  pdf04Path
);

// ─────────────────────────────────────────────────────────────
// FIXTURE 05: BrainyWrite Corporate Event Guest Report
// ─────────────────────────────────────────────────────────────
console.log("Generating Fixture 05: BrainyWrite Corporate Event Guest Report...");
const logo05 = await loadLocalLogoBase64(
  resolveDocumentLogoPath(brainyBusiness, "editorial_ivory")
);

const report05 = buildGuestEventReport({
  event: {
    ...baseEvent,
    businessId: "brainywrite",
    name: "BrainyWrite Corporate Summit 2026",
    type: "corporate",
    location: "Radisson Blu Hotel, Maputo",
  },
  guests: [
    makeGuest("g-corp-01", "Dra. Alice Nogueira", { status: "confirmed", clientType: "corporate" }),
    makeGuest("g-corp-02", "Dr. Bruno Esteves", { status: "checked_in", clientType: "corporate" }),
    makeGuest("g-corp-03", "Dra. Cecília Mendes", { status: "invited", clientType: "corporate" }),
  ],
  seats: [],
});

const pdf05Path = path.join(outputDir, "05_brainywrite_corporate_event_guest_report.pdf");
await renderToFile(
  React.createElement(GuestReportPDF, {
    report: report05,
    logoUrl: logo05,
  }),
  pdf05Path
);

// ─────────────────────────────────────────────────────────────
// FIXTURE 06: Empty State (Zero Guests and Seats)
// ─────────────────────────────────────────────────────────────
console.log("Generating Fixture 06: Empty State...");
const report06 = buildGuestEventReport({
  event: {
    ...baseEvent,
    name: "Novo Evento Por Configurar",
    date: "",
    location: "",
  },
  guests: [],
  seats: [],
});

const pdf06Path = path.join(outputDir, "06_empty_state_zero_guests_and_seats.pdf");
await renderToFile(
  React.createElement(GuestReportPDF, {
    report: report06,
    logoUrl: logo01,
  }),
  pdf06Path
);

// ─────────────────────────────────────────────────────────────
// RENDER ALL FIXTURES TO PNG FOR VISUAL INSPECTION
// ─────────────────────────────────────────────────────────────
console.log("\nRendering PDF fixtures to PNGs...");
await renderPdfPagesToPng(pdf01Path, "01_wedding_editorial_ivory_canonical_22_guests");
await renderPdfPagesToPng(pdf02Path, "02_multipage_120_guests_banquet_stress");
await renderPdfPagesToPng(pdf03Path, "03_table_seating_flow_24_seats_per_table");
await renderPdfPagesToPng(pdf04Path, "04_dietary_manifest_kitchen_ops");
await renderPdfPagesToPng(pdf05Path, "05_brainywrite_corporate_event_guest_report");
await renderPdfPagesToPng(pdf06Path, "06_empty_state_zero_guests_and_seats");

console.log("\nAll 6 PDF fixtures and PNGs rendered successfully!");
