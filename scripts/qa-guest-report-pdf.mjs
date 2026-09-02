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

const GuestReportPDF = GuestReportPDFDocModule.default || GuestReportPDFDocModule;

const outputDir = path.join(process.cwd(), ".qa-pdf-output", "guest-report");
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

    await fs.writeFile(localPngPath, pngBuffer);
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
// FIXTURE 01: Stan Case (22 Eligible Confirmed Guests, 20 Companions, 42 Headcount, NO Seating)
// ─────────────────────────────────────────────────────────────
console.log("Generating Fixture 01: Stan Case (No Seating)...");
const logo01 = await loadLocalLogoBase64(
  resolveDocumentLogoPath(haxrBusiness, "editorial_ivory")
);
const coverLogo01 = await loadLocalLogoBase64(
  resolveDocumentLogoPath(haxrBusiness, "maison_signature")
);
const sigMark01 = await loadLocalLogoBase64("/images/brand/aldimande-signature-gold.png");

const stanNames = [
  "Ana Nhaca", "Bernardo Silva", "Carlos Tembe", "Daniela Matusse",
  "Eduardo Cossa", "Fernanda Langa", "Gabriel Machava", "Helena Mabunda",
  "Inácio Macamo", "Joana Mondlane", "Kátia Chissano", "Lucas Guebuza",
  "Marta Nyusi", "Nelson Diogo", "Olívia Sitoe", "Paulo Zandamela",
  "Quitéria Manjate", "Rui Simango", "Sara Dhlakama", "Tiago Matsinhe",
  "Úrsula Magaia", "Valdemar Banze"
];

const fixture01Guests = stanNames.map((name, i) =>
  makeGuest(`stan-${i + 1}`, name, {
    status: "confirmed",
    plusOnes: i < 20 ? 1 : 0, // 20 with +1, 2 with 0 = 20 companions
    dietaryNotes: "",
    guestNotes: "",
  })
);

const report01 = buildGuestEventReport({
  event: baseEvent,
  guests: fixture01Guests,
  seats: [],
  plannerNotes: "Recepção com protocolo de boas-vindas na entrada poente. Coordenação de banquete alinhada com o maître para serviço às 15:30.",
});

const pdf01Path = path.join(outputDir, "01_social_event_no_seating.pdf");
await renderToFile(
  React.createElement(GuestReportPDF, {
    report: report01,
    logoUrl: logo01,
    coverLogoUrl: coverLogo01,
    signatureMarkUrl: sigMark01,
    businessName: "HAXR Signature",
  }),
  pdf01Path
);

// ─────────────────────────────────────────────────────────────
// FIXTURE 02: Multipage 120 Guests Banquet Stress (with repeated continuation headers)
// ─────────────────────────────────────────────────────────────
console.log("Generating Fixture 02: Multipage 120 Guests Banquet Stress...");
const firstNames = [
  "Abel", "Beatriz", "Carlos", "Duarte", "Ema", "Filipe", "Graça", "Hélder",
  "Ilda", "Jorge", "Leonor", "Manuel", "Nádia", "Orlando", "Patrícia", "Rui",
  "Sónia", "Tomás", "Valdemar", "Zulmira", "Amilcar", "Bruna", "Cláudio", "Dulce"
];
const lastNames = [
  "Mabunda", "Nhaca", "Sitoe", "Tembe", "Cossa", "Langa", "Matusse", "Macamo",
  "Mondlane", "Chissano", "Guebuza", "Nyusi", "Diogo", "Zandamela", "Simango", "Banze"
];

const fixture02Guests = [];
for (let i = 1; i <= 120; i++) {
  const fn = firstNames[(i - 1) % firstNames.length];
  const ln = lastNames[(i - 1) % lastNames.length];
  const fullName = `${fn} ${ln} (${i})`;
  const statusCycle = ["confirmed", "confirmed", "checked_in", "invited", "declined"];
  const status = statusCycle[(i - 1) % statusCycle.length];
  const plusOnes = i % 4 === 0 ? 2 : i % 2 === 0 ? 1 : 0;
  const tableNum = Math.ceil(i / 10);
  const seatNum = ((i - 1) % 10) + 1;

  fixture02Guests.push(
    makeGuest(`g-120-${i}`, fullName, {
      status,
      plusOnes,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}.${i}@empresa-parceira.co.mz`,
      phone: `+258 84 ${100 + (i % 900)} ${1000 + i}`,
      seatId: `s-120-${tableNum}-${seatNum}`,
      seat: { tableName: `Mesa ${tableNum}`, seatNumber: seatNum, label: "" },
    })
  );
}

const fixture02Seats = [];
for (let t = 1; t <= 12; t++) {
  for (let s = 1; s <= 10; s++) {
    fixture02Seats.push(makeSeat(`s-120-${t}-${s}`, `Mesa ${t}`, s));
  }
}

const report02 = buildGuestEventReport({
  event: baseEvent,
  guests: fixture02Guests,
  seats: fixture02Seats,
});

const pdf02Path = path.join(outputDir, "02_large_guest_book_120.pdf");
await renderToFile(
  React.createElement(GuestReportPDF, {
    report: report02,
    logoUrl: logo01,
    coverLogoUrl: coverLogo01,
    signatureMarkUrl: sigMark01,
    businessName: "HAXR Signature",
  }),
  pdf02Path
);

// ─────────────────────────────────────────────────────────────
// FIXTURE 03: Social Event with Seating (Table Flow)
// ─────────────────────────────────────────────────────────────
console.log("Generating Fixture 03: Social Event with Seating...");
const fixture03Guests = [
  makeGuest("g-01", "Ana Nhaca", { status: "confirmed", plusOnes: 1, seatId: "s-01", seat: { tableName: "Imperial", seatNumber: 1, label: "VIP" } }),
  makeGuest("g-02", "Bernardo Silva", { status: "confirmed", seatId: "s-02", seat: { tableName: "Imperial", seatNumber: 2, label: "VIP" } }),
  makeGuest("g-03", "Carlos Tembe", { status: "checked_in", plusOnes: 2, seatId: "s-03", seat: { tableName: "Imperial", seatNumber: 3, label: "" } }),
  makeGuest("g-04", "Daniela Matusse", { status: "confirmed", seatId: "s-04", seat: { tableName: "Imperial", seatNumber: 4, label: "" } }),
  makeGuest("g-05", "Eduardo Cossa", { status: "invited", seatId: "s-05", seat: { tableName: "Família", seatNumber: 1, label: "" } }),
  makeGuest("g-06", "Fernanda Langa", { status: "confirmed", seatId: "s-06", seat: { tableName: "Família", seatNumber: 2, label: "" } }),
  makeGuest("g-07", "Gabriel Machava", { status: "invited" }), // Unassigned
  makeGuest("g-08", "Helena Mabunda", { status: "confirmed" }), // Unassigned
];

const fixture03Seats = [
  makeSeat("s-01", "Imperial", 1, "VIP"),
  makeSeat("s-02", "Imperial", 2, "VIP"),
  makeSeat("s-03", "Imperial", 3),
  makeSeat("s-04", "Imperial", 4),
  makeSeat("s-05", "Família", 1),
  makeSeat("s-06", "Família", 2),
];

const report03 = buildGuestEventReport({
  event: baseEvent,
  guests: fixture03Guests,
  seats: fixture03Seats,
});

const pdf03Path = path.join(outputDir, "03_social_event_with_seating.pdf");
await renderToFile(
  React.createElement(GuestReportPDF, {
    report: report03,
    logoUrl: logo01,
    coverLogoUrl: coverLogo01,
    signatureMarkUrl: sigMark01,
    businessName: "HAXR Signature",
  }),
  pdf03Path
);

// ─────────────────────────────────────────────────────────────
// FIXTURE 04: Dietary Manifest & Kitchen Ops
// ─────────────────────────────────────────────────────────────
console.log("Generating Fixture 04: Dietary Manifest & Kitchen Ops...");
const fixture04Guests = [
  makeGuest("g-diet-01", "Beatriz Fontes", {
    status: "confirmed",
    dietaryNotes: "Alergia anafilática a amendoim e frutos secos (EpiPen)",
    seat: { tableName: "Imperial", seatNumber: 1, label: "" },
  }),
  makeGuest("g-diet-02", "Carlos Eduardo", {
    status: "confirmed",
    dietaryNotes: "Intolerância severa à lactose e derivados lácteos",
    seat: { tableName: "Imperial", seatNumber: 2, label: "" },
  }),
  makeGuest("g-diet-03", "Dra. Diana Matos", {
    status: "checked_in",
    dietaryNotes: "Regime vegetariano estrito (sem ovos nem gelatina)",
    seat: { tableName: "Família", seatNumber: 1, label: "" },
  }),
  makeGuest("g-diet-04", "Eng. Fernando Dias", {
    status: "confirmed",
    dietaryNotes: "Diabético Tipo 1 (sem adição de açúcares refinados)",
    seat: { tableName: "Família", seatNumber: 2, label: "" },
  }),
];

const report04 = buildGuestEventReport({
  event: baseEvent,
  guests: fixture04Guests,
  seats: fixture03Seats,
});

const pdf04Path = path.join(outputDir, "04_dietary_manifest.pdf");
await renderToFile(
  React.createElement(GuestReportPDF, {
    report: report04,
    logoUrl: logo01,
    coverLogoUrl: coverLogo01,
    signatureMarkUrl: sigMark01,
    businessName: "HAXR Signature",
  }),
  pdf04Path
);

// ─────────────────────────────────────────────────────────────
// FIXTURE 05: Empty State (Zero Guests and Seats)
// ─────────────────────────────────────────────────────────────
console.log("Generating Fixture 05: Empty State...");
const report05 = buildGuestEventReport({
  event: {
    ...baseEvent,
    name: "Novo Evento Por Configurar",
    date: "",
    location: "",
  },
  guests: [],
  seats: [],
});

const pdf05Path = path.join(outputDir, "05_empty_or_early_stage.pdf");
await renderToFile(
  React.createElement(GuestReportPDF, {
    report: report05,
    logoUrl: logo01,
    coverLogoUrl: coverLogo01,
    signatureMarkUrl: sigMark01,
    businessName: "HAXR Signature",
  }),
  pdf05Path
);

// ─────────────────────────────────────────────────────────────
// FIXTURE 06: Non-HAXR Corporate Event Guest Report (BrainyWrite)
// ─────────────────────────────────────────────────────────────
console.log("Generating Fixture 06: Non-HAXR Corporate Event Guest Report (BrainyWrite)...");
const logo06 = await loadLocalLogoBase64(
  resolveDocumentLogoPath(brainyBusiness, "editorial_ivory")
);

const report06 = buildGuestEventReport({
  event: {
    ...baseEvent,
    businessId: "brainywrite",
    name: "BrainyWrite Corporate Summit 2026",
    type: "corporate",
    location: "Radisson Blu Hotel, Maputo",
  },
  guests: [
    makeGuest("g-corp-01", "Dra. Alice Nogueira", { status: "confirmed", groupName: "Banco Comercial" }),
    makeGuest("g-corp-02", "Dr. Bruno Esteves", { status: "checked_in", groupName: "Seguradora Global" }),
    makeGuest("g-corp-03", "Dra. Cecília Mendes", { status: "invited", groupName: "Consultoria Estratégica" }),
  ],
  seats: [],
});

const pdf06Path = path.join(outputDir, "06_non_haxr_guest_book.pdf");
await renderToFile(
  React.createElement(GuestReportPDF, {
    report: report06,
    logoUrl: logo06,
    coverLogoUrl: logo06,
    businessName: "BrainyWrite",
  }),
  pdf06Path
);

// ─────────────────────────────────────────────────────────────
// FIXTURE 07 (QA STRESS): Large Single Table (75 Guests in 1 Table → Forces Table Cross-Page Pagination)
// ─────────────────────────────────────────────────────────────
console.log("Generating Fixture 07: Forced Cross-Page Table Pagination Stress (75 guests in 1 table)...");

const fixture07Guests = [];
for (let i = 1; i <= 75; i++) {
  const statusCycle = ["confirmed", "confirmed", "checked_in", "invited", "declined"];
  const status = statusCycle[(i - 1) % statusCycle.length];
  const plusOnes = i % 5 === 0 ? 2 : i % 3 === 0 ? 1 : 0;
  fixture07Guests.push(
    makeGuest(`g-bigT-${i}`, `Convidado Banquete Imperial ${i}`, {
      status,
      plusOnes,
      phone: `+258 84 ${500 + i} ${2000 + i}`,
      seatId: `s-bigT-${i}`,
      seat: { tableName: "Mesa Imperial Magna", seatNumber: i, label: "" },
    })
  );
}

const fixture07Seats = [];
for (let s = 1; s <= 80; s++) {
  fixture07Seats.push(makeSeat(`s-bigT-${s}`, "Mesa Imperial Magna", s));
}

const report07 = buildGuestEventReport({
  event: { ...baseEvent, name: "Stress Test — Mesa Imperial Magna (75 Convidados)" },
  guests: fixture07Guests,
  seats: fixture07Seats,
});

const pdf07Path = path.join(outputDir, "07_large_table_pagination_stress.pdf");
await renderToFile(
  React.createElement(GuestReportPDF, {
    report: report07,
    logoUrl: logo01,
    coverLogoUrl: coverLogo01,
    signatureMarkUrl: sigMark01,
    businessName: "HAXR Signature",
  }),
  pdf07Path
);

// ─────────────────────────────────────────────────────────────
// FIXTURE 08 (QA STRESS): Long Names & Contacts Registry Height Stress
// ─────────────────────────────────────────────────────────────
console.log("Generating Fixture 08: Registry Height Stress (long names, long contacts)...");

const longNames = [
  "Prof.ª Dra. Maria Fernanda de Albuquerque Figueiredo Montenegro e Silva",
  "Eng.º João Carlos Alberto Sebastião Mondlane Chissano de Matos",
  "Dra. Ana Beatriz Fernandes Vasconcelos Castelo-Branco Pereira",
  "Dr. Pedro Henrique Alexandre Monteiro de Almeida e Sousa-Martins",
  "Arq. Catarina Isabel Domingos Correia Magalhães Fonseca-Tavares",
  "Sra. D. Margarida Filomena do Rosário Ribeiro Gonçalves da Costa",
  "Prof. Doutor António Eduardo Machado Ferreira Vieira Brandão",
  "Dra. Luísa Madalena Henriques de Vasconcelos Alvim e Castro",
  "Sr. Comendador Francisco Xavier de Bragança Barreto Mascarenhas",
  "Sra. Marquesa D. Carlota Fernanda de Assis Monteiro Brandão",
];

const fixture08Guests = longNames.map((name, i) => {
  const statusCycle = ["confirmed", "confirmed", "checked_in", "invited"];
  const status = statusCycle[i % statusCycle.length];
  const plusOnes = i % 4 === 0 ? 2 : i % 2 === 0 ? 1 : 0;
  return makeGuest(`g-long-${i + 1}`, name, {
    status,
    plusOnes,
    phone: `+258 84 ${700 + i} ${3000 + i}`,
    email: `${name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20)}@universidade-maputo.edu.mz`,
  });
});

const report08 = buildGuestEventReport({
  event: { ...baseEvent, name: "Stress Test — Nomes Longos & Contactos" },
  guests: fixture08Guests,
  seats: [],
});

const pdf08Path = path.join(outputDir, "08_long_name_registry_stress.pdf");
await renderToFile(
  React.createElement(GuestReportPDF, {
    report: report08,
    logoUrl: logo01,
    coverLogoUrl: coverLogo01,
    signatureMarkUrl: sigMark01,
    businessName: "HAXR Signature",
  }),
  pdf08Path
);

// ─────────────────────────────────────────────────────────────
// FIXTURE 09 (QA PROTOCOL): Protocol / State Dinner Seating (Exact Seats & Labels)
// ─────────────────────────────────────────────────────────────
console.log("Generating Fixture 09: Protocol State Dinner (Exact Seat & Distinctive Labels)...");

const protocolGuests = [
  makeGuest("g-proto-1", "S.Exª Sr. Presidente da República", {
    status: "confirmed",
    groupName: "Presidência da República",
    phone: "+258 84 100 0001",
    seatId: "s-honra-1",
    seat: { tableName: "Mesa de Honra Presidencial", seatNumber: 1, label: "Chefe de Estado" },
  }),
  makeGuest("g-proto-2", "Sra. Dra. Primeira-Dama da República", {
    status: "confirmed",
    groupName: "Presidência da República",
    phone: "+258 84 100 0002",
    seatId: "s-honra-2",
    seat: { tableName: "Mesa de Honra Presidencial", seatNumber: 2, label: "Primeira-Dama" },
  }),
  makeGuest("g-proto-3", "S.Exª Sr. Embaixador da União Europeia", {
    status: "confirmed",
    groupName: "Corpo Diplomático",
    phone: "+258 84 100 0003",
    seatId: "s-honra-3",
    seat: { tableName: "Mesa de Honra Presidencial", seatNumber: 3, label: "Embaixador Decano" },
  }),
  makeGuest("g-proto-4", "Exmo. Sr. Ministro dos Negócios Estrangeiros", {
    status: "confirmed",
    groupName: "Governo de Moçambique",
    phone: "+258 84 100 0004",
    seatId: "s-honra-4",
    seat: { tableName: "Mesa de Honra Presidencial", seatNumber: 4, label: "Ministro de Estado" },
  }),
  makeGuest("g-proto-5", "S.Exª Sr. Alto Comissário Britânico", {
    status: "confirmed",
    groupName: "Corpo Diplomático",
    phone: "+258 84 100 0005",
    seatId: "s-honra-5",
    seat: { tableName: "Mesa de Honra Presidencial", seatNumber: 5, label: "Alto Comissário" },
  }),
  makeGuest("g-proto-6", "Exmo. Sr. Chefe do Protocolo de Estado", {
    status: "checked_in",
    groupName: "Protocolo de Estado",
    phone: "+258 84 100 0006",
    seatId: "s-honra-6",
    seat: { tableName: "Mesa de Honra Presidencial", seatNumber: 6, label: "Chefe do Protocolo" },
  }),
  makeGuest("g-proto-7", "S.Exª Sr. Embaixador de Portugal", {
    status: "confirmed",
    groupName: "Corpo Diplomático",
    phone: "+258 84 100 0007",
    seatId: "s-diplo-1",
    seat: { tableName: "Mesa do Corpo Diplomático", seatNumber: 1, label: "Embaixador" },
  }),
  makeGuest("g-proto-8", "S.Exª Sr. Embaixador dos Estados Unidos", {
    status: "confirmed",
    groupName: "Corpo Diplomático",
    phone: "+258 84 100 0008",
    seatId: "s-diplo-2",
    seat: { tableName: "Mesa do Corpo Diplomático", seatNumber: 2, label: "Embaixador" },
  }),
  makeGuest("g-proto-9", "S.Exª Sr. Embaixador da África do Sul", {
    status: "confirmed",
    groupName: "Corpo Diplomático",
    phone: "+258 84 100 0009",
    seatId: "s-diplo-3",
    seat: { tableName: "Mesa do Corpo Diplomático", seatNumber: 3, label: "Embaixador" },
  }),
  makeGuest("g-proto-10", "S.Exª Sr. Embaixador do Brasil", {
    status: "confirmed",
    groupName: "Corpo Diplomático",
    phone: "+258 84 100 0010",
    seatId: "s-diplo-4",
    seat: { tableName: "Mesa do Corpo Diplomático", seatNumber: 4, label: "Embaixador" },
  }),
];

const protocolSeats = [
  makeSeat("s-honra-1", "Mesa de Honra Presidencial", 1, "Chefe de Estado"),
  makeSeat("s-honra-2", "Mesa de Honra Presidencial", 2, "Primeira-Dama"),
  makeSeat("s-honra-3", "Mesa de Honra Presidencial", 3, "Embaixador Decano"),
  makeSeat("s-honra-4", "Mesa de Honra Presidencial", 4, "Ministro de Estado"),
  makeSeat("s-honra-5", "Mesa de Honra Presidencial", 5, "Alto Comissário"),
  makeSeat("s-honra-6", "Mesa de Honra Presidencial", 6, "Chefe do Protocolo"),
  makeSeat("s-diplo-1", "Mesa do Corpo Diplomático", 1, "Embaixador"),
  makeSeat("s-diplo-2", "Mesa do Corpo Diplomático", 2, "Embaixador"),
  makeSeat("s-diplo-3", "Mesa do Corpo Diplomático", 3, "Embaixador"),
  makeSeat("s-diplo-4", "Mesa do Corpo Diplomático", 4, "Embaixador"),
];

const report09 = buildGuestEventReport({
  event: { ...baseEvent, name: "Banquete Oficial de Estado & Gala Diplomática", type: "state_dinner" },
  guests: protocolGuests,
  seats: protocolSeats,
});

const pdf09Path = path.join(outputDir, "09_protocol_diplomatic_seating.pdf");
await renderToFile(
  React.createElement(GuestReportPDF, {
    report: report09,
    logoUrl: logo01,
    coverLogoUrl: coverLogo01,
    signatureMarkUrl: sigMark01,
    businessName: "HAXR Signature",
  }),
  pdf09Path
);

// ─────────────────────────────────────────────────────────────
// RENDER ALL FIXTURES TO PNG FOR VISUAL INSPECTION
// ─────────────────────────────────────────────────────────────
console.log("\nRendering PDF fixtures to PNGs...");
await renderPdfPagesToPng(pdf01Path, "01_social_event_no_seating");
await renderPdfPagesToPng(pdf02Path, "02_large_guest_book_120");
await renderPdfPagesToPng(pdf03Path, "03_social_event_with_seating");
await renderPdfPagesToPng(pdf04Path, "04_dietary_manifest");
await renderPdfPagesToPng(pdf05Path, "05_empty_or_early_stage");
await renderPdfPagesToPng(pdf06Path, "06_non_haxr_guest_book");
await renderPdfPagesToPng(pdf07Path, "07_large_table_pagination_stress");
await renderPdfPagesToPng(pdf08Path, "08_long_name_registry_stress");
await renderPdfPagesToPng(pdf09Path, "09_protocol_diplomatic_seating");
console.log("\nAll 9 PDF fixtures and PNGs rendered successfully!");
