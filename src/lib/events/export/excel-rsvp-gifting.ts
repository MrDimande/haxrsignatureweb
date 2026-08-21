import ExcelJS from "exceljs";
import {
  eventReportHeader,
  formatGeneratedAtTimestamp,
  formatGuestContact,
  formatTableName,
  HUMAN_RSVP_LABELS,
  resolveGuestCompanionInfo,
  type GuestEventReport,
} from "@/lib/events/export/report";
import type { EditionGiftReservation } from "@/lib/events/repositories/edition-gifts.repository";

const COLORS = {
  HAXR_BLACK: "FF1C1A17",
  HAXR_GOLD: "FFB88A2A",
  HAXR_GOLD_LIGHT: "FFE3C46B",
  HAXR_CHAMPAGNE: "FFEAD8B8",
  HAXR_IVORY: "FFF7F1E8",
  WHITE: "FFFFFFFF",
  CHARCOAL: "FF2E2A24",
  GRAY_LIGHT: "FFF4EFE6",
  GRAY_BORDER: "FFD8CEBE",
  GREEN_TEXT: "FF1B6A42",
  GREEN_BG: "FFE6F4EC",
  AMBER_TEXT: "FF92400E",
  AMBER_BG: "FFFEF3C7",
  RED_TEXT: "FF991B1B",
  RED_BG: "FFFEE2E2",
  MUTED_TEXT: "FF666159",
  MUTED_BG: "FFF5F3EF",
};

export function sanitizeRsvpGiftingWorkbookFilename(title: string, dateIso?: string | null, businessId?: string): string {
  const cleanTitle = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_\-\s]/g, "")
    .trim()
    .replace(/\s+/g, "_");

  const prefix = businessId === "brainywrite" ? "BrainyWrite" : "HAXR";
  const dateSuffix = dateIso
    ? `_${dateIso.slice(0, 10)}`
    : `_${new Date().toISOString().slice(0, 10)}`;
  return `${prefix}_RSVP_Presentes_${cleanTitle || "Evento"}${dateSuffix}.xlsx`;
}

/**
 * Constrói o Livro Oficial RSVP & Gifting Book (.xlsx via ExcelJS)
 * com estrutura adaptativa de alta costura:
 * - 01 — Resumo Executivo
 * - 02 — Lista RSVP
 * - 03 — Dimensão de Grupos
 * - 04 — Registo de Presentes
 * - 05 — Mensagens & Votos (Apenas quando existem)
 * - 06 — Distribuição de Mesas (Apenas quando configurado)
 */
export async function buildOfficialRsvpGiftingWorkbook(
  report: GuestEventReport,
  gifts: EditionGiftReservation[] = [],
  businessName?: string
): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  const resolvedBrand = businessName || (report.event.businessId === "brainywrite" ? "BrainyWrite" : "HAXR Signature");

  wb.creator = `${resolvedBrand} · RSVP & Luxury Gifting Atelier`;
  wb.lastModifiedBy = `${resolvedBrand} Concierge`;
  wb.created = new Date(report.generatedAt || new Date());
  wb.modified = new Date();

  const { event, guests, stats, readiness, messageGuests, tableGroups } = report;

  // ─────────────────────────────────────────────────────────────
  // 1. ABA: 01 — Resumo Executivo
  // ─────────────────────────────────────────────────────────────
  const wsDash = wb.addWorksheet("01 — Resumo Executivo", {
    views: [{ showGridLines: true }],
    properties: { tabColor: { argb: COLORS.HAXR_GOLD } },
    pageSetup: {
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 },
    },
  });

  wsDash.columns = [
    { width: 4 },  // A (margin)
    { width: 34 }, // B
    { width: 22 }, // C
    { width: 22 }, // D
    { width: 22 }, // E
    { width: 28 }, // F
  ];

  // Header banner
  wsDash.mergeCells("B2:F2");
  const titleCell = wsDash.getCell("B2");
  titleCell.value = `${resolvedBrand.toUpperCase()} · RSVP & GIFT REGISTRY MASTER BOOK`;
  titleCell.font = { name: "Georgia", size: 13, bold: true, color: { argb: COLORS.HAXR_GOLD } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HAXR_BLACK } };
  titleCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  wsDash.getRow(2).height = 34;

  // Metadata subtitle
  wsDash.mergeCells("B3:F3");
  const subCell = wsDash.getCell("B3");
  subCell.value = `${event.name} · ${eventReportHeader(event)} · Gerado em: ${formatGeneratedAtTimestamp(report.generatedAt)}`;
  subCell.font = { name: "Arial", size: 9, italic: true, color: { argb: COLORS.CHARCOAL } };
  subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HAXR_IVORY } };
  subCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  wsDash.getRow(3).height = 22;

  // Section Header: RSVP & Banquete
  wsDash.mergeCells("B5:F5");
  const sec1Cell = wsDash.getCell("B5");
  sec1Cell.value = "METRICAS DE RSVP & HEADCOUNT DE BANQUETE";
  sec1Cell.font = { name: "Georgia", size: 10, bold: true, color: { argb: COLORS.HAXR_GOLD } };
  sec1Cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HAXR_BLACK } };
  sec1Cell.alignment = { vertical: "middle", indent: 1 };
  wsDash.getRow(5).height = 24;

  const rsvpKpis: [string, string | number, string][] = [
    ["Convidados Principais (Convites)", stats.primaryGuests, "Total de convites emitidos"],
    ["Confirmados (RSVP Sim)", stats.confirmed, "Presenças confirmadas"],
    ["Headcount Total de Banquete", stats.expectedAttendance, "Total de pessoas previstas (Principais + Acompanhantes)"],
    ["Acompanhantes Totais", stats.plusOnesTotal, "Total de acompanhantes declarados"],
    ["Pendentes de Resposta", stats.invited, "A aguardar resposta"],
    ["Convites Recusados", stats.declined, "Declinaram comparência"],
    ["Taxa de Confirmação / Resposta", `${stats.responseRate}%`, "Percentagem de convites respondidos"],
  ];

  let curRow = 6;
  for (const [label, val, desc] of rsvpKpis) {
    wsDash.getCell(`B${curRow}`).value = label;
    wsDash.getCell(`B${curRow}`).font = { name: "Arial", size: 9, bold: true, color: { argb: COLORS.CHARCOAL } };
    wsDash.getCell(`B${curRow}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: curRow % 2 === 0 ? COLORS.WHITE : COLORS.GRAY_LIGHT } };

    wsDash.getCell(`C${curRow}`).value = val;
    wsDash.getCell(`C${curRow}`).font = { name: "Arial", size: 10, bold: true, color: { argb: COLORS.HAXR_BLACK } };
    wsDash.getCell(`C${curRow}`).alignment = { horizontal: "center" };
    wsDash.getCell(`C${curRow}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: curRow % 2 === 0 ? COLORS.WHITE : COLORS.GRAY_LIGHT } };

    wsDash.mergeCells(`D${curRow}:F${curRow}`);
    const descCell = wsDash.getCell(`D${curRow}`);
    descCell.value = desc;
    descCell.font = { name: "Arial", size: 8.5, italic: true, color: { argb: COLORS.MUTED_TEXT } };
    descCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: curRow % 2 === 0 ? COLORS.WHITE : COLORS.GRAY_LIGHT } };

    wsDash.getRow(curRow).height = 20;
    curRow++;
  }

  // Section Header: Registo de Presentes
  curRow++;
  wsDash.mergeCells(`B${curRow}:F${curRow}`);
  const sec2Cell = wsDash.getCell(`B${curRow}`);
  sec2Cell.value = "INDICADORES DO REGISTO DE PRESENTES (GIFT REGISTRY)";
  sec2Cell.font = { name: "Georgia", size: 10, bold: true, color: { argb: COLORS.HAXR_GOLD } };
  sec2Cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HAXR_BLACK } };
  sec2Cell.alignment = { vertical: "middle", indent: 1 };
  wsDash.getRow(curRow).height = 24;
  curRow++;

  const giftCategories = new Set(gifts.map((g) => g.category).filter(Boolean));
  const giftKpis: [string, string | number, string][] = [
    ["Total de Presentes Reservados", gifts.length, "Itens reservados por convidados no convite digital"],
    ["Categorias com Reservas", giftCategories.size, Array.from(giftCategories).join(", ") || "Nenhuma"],
  ];

  for (const [label, val, desc] of giftKpis) {
    wsDash.getCell(`B${curRow}`).value = label;
    wsDash.getCell(`B${curRow}`).font = { name: "Arial", size: 9, bold: true, color: { argb: COLORS.CHARCOAL } };
    wsDash.getCell(`B${curRow}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: curRow % 2 === 0 ? COLORS.WHITE : COLORS.GRAY_LIGHT } };

    wsDash.getCell(`C${curRow}`).value = val;
    wsDash.getCell(`C${curRow}`).font = { name: "Arial", size: 10, bold: true, color: { argb: COLORS.HAXR_BLACK } };
    wsDash.getCell(`C${curRow}`).alignment = { horizontal: "center" };
    wsDash.getCell(`C${curRow}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: curRow % 2 === 0 ? COLORS.WHITE : COLORS.GRAY_LIGHT } };

    wsDash.mergeCells(`D${curRow}:F${curRow}`);
    const descCell = wsDash.getCell(`D${curRow}`);
    descCell.value = desc;
    descCell.font = { name: "Arial", size: 8.5, italic: true, color: { argb: COLORS.MUTED_TEXT } };
    descCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: curRow % 2 === 0 ? COLORS.WHITE : COLORS.GRAY_LIGHT } };

    wsDash.getRow(curRow).height = 20;
    curRow++;
  }

  // ─────────────────────────────────────────────────────────────
  // 2. ABA: 02 — Lista RSVP
  // ─────────────────────────────────────────────────────────────
  const wsRsvpList = wb.addWorksheet("02 — Lista RSVP", {
    views: [{ state: "frozen", ySplit: 4, showGridLines: true }],
    properties: { tabColor: { argb: COLORS.CHARCOAL } },
    pageSetup: {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });

  wsRsvpList.columns = [
    { width: 6 },  // Nº
    { width: 32 }, // Convidado
    { width: 22 }, // Estado RSVP
    { width: 22 }, // Acompanhantes
    { width: 14 }, // Total Pessoas
    { width: 26 }, // Contacto
    { width: 28 }, // Restrição Alimentar
  ];

  wsRsvpList.mergeCells("A1:G1");
  const rTitle = wsRsvpList.getCell("A1");
  rTitle.value = `LISTA DE CONFIRMAÇÕES (RSVP MASTER) — ${event.name.toUpperCase()}`;
  rTitle.font = { name: "Georgia", size: 12, bold: true, color: { argb: COLORS.HAXR_GOLD } };
  rTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HAXR_BLACK } };
  rTitle.alignment = { vertical: "middle", indent: 1 };
  wsRsvpList.getRow(1).height = 28;

  wsRsvpList.mergeCells("A2:G2");
  const rSub = wsRsvpList.getCell("A2");
  rSub.value = `Total Convidados: ${stats.primaryGuests} · Presença Prevista: ${stats.expectedAttendance} pessoas · Gerado em: ${formatGeneratedAtTimestamp(report.generatedAt)}`;
  rSub.font = { name: "Arial", size: 9, italic: true, color: { argb: COLORS.CHARCOAL } };
  rSub.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HAXR_IVORY } };
  rSub.alignment = { vertical: "middle", indent: 1 };
  wsRsvpList.getRow(2).height = 20;

  const rsvpHeaders = [
    "Nº",
    "Convidado Principal",
    "Estado RSVP",
    "Acompanhantes",
    "Total Grupo",
    "Contacto",
    "Restrições Alimentares",
  ];

  const rHeadRow = wsRsvpList.getRow(4);
  rHeadRow.values = rsvpHeaders;
  rHeadRow.height = 24;
  rHeadRow.eachCell((cell) => {
    cell.font = { name: "Arial", size: 9, bold: true, color: { argb: COLORS.WHITE } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.CHARCOAL } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = { bottom: { style: "medium", color: { argb: COLORS.HAXR_GOLD } } };
  });

  let rIdx = 5;
  for (let i = 0; i < guests.length; i++) {
    const guest = guests[i];
    const companion = resolveGuestCompanionInfo(guest);
    const row = wsRsvpList.getRow(rIdx);

    row.values = [
      i + 1,
      guest.name,
      HUMAN_RSVP_LABELS[guest.status] || guest.status,
      companion.formattedLabel,
      companion.totalPartySize,
      formatGuestContact(guest),
      guest.dietaryNotes || "—",
    ];

    row.eachCell((cell, colNum) => {
      cell.font = { name: "Arial", size: 8.5, color: { argb: COLORS.CHARCOAL } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rIdx % 2 === 0 ? COLORS.GRAY_LIGHT : COLORS.WHITE } };
      cell.border = { bottom: { style: "thin", color: { argb: COLORS.GRAY_BORDER } } };
      if (colNum === 1 || colNum === 3 || colNum === 5) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else {
        cell.alignment = { vertical: "middle" };
      }
    });

    row.height = 20;
    rIdx++;
  }

  wsRsvpList.autoFilter = `A4:G${Math.max(5, rIdx - 1)}`;

  // ─────────────────────────────────────────────────────────────
  // 3. ABA: 03 — Dimensão de Grupos (Party Size & Banqueting)
  // ─────────────────────────────────────────────────────────────
  const wsParty = wb.addWorksheet("03 — Dimensão de Grupos", {
    views: [{ state: "frozen", ySplit: 4, showGridLines: true }],
    properties: { tabColor: { argb: COLORS.HAXR_CHAMPAGNE } },
    pageSetup: {
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });

  wsParty.columns = [
    { width: 6 },  // Nº
    { width: 32 }, // Convidado
    { width: 20 }, // Estado RSVP
    { width: 18 }, // Acompanhantes
    { width: 16 }, // Total Couverts
    { width: 24 }, // Contacto
  ];

  wsParty.mergeCells("A1:F1");
  const pTitle = wsParty.getCell("A1");
  pTitle.value = `DIMENSÃO DE GRUPOS & COUVERTS DE BANQUETE — ${event.name.toUpperCase()}`;
  pTitle.font = { name: "Georgia", size: 12, bold: true, color: { argb: COLORS.HAXR_GOLD } };
  pTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HAXR_BLACK } };
  pTitle.alignment = { vertical: "middle", indent: 1 };
  wsParty.getRow(1).height = 28;

  wsParty.mergeCells("A2:F2");
  const pSub = wsParty.getCell("A2");
  pSub.value = `Headcount Total de Banquete: ${stats.expectedAttendance} pessoas (${stats.confirmed} confirmados + ${stats.plusOnesTotal} acompanhantes)`;
  pSub.font = { name: "Arial", size: 9, italic: true, color: { argb: COLORS.CHARCOAL } };
  pSub.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HAXR_IVORY } };
  pSub.alignment = { vertical: "middle", indent: 1 };
  wsParty.getRow(2).height = 20;

  const partyHeaders = ["Nº", "Convidado Principal", "Estado RSVP", "Acompanhantes", "Total Couverts", "Contacto"];
  const pHeadRow = wsParty.getRow(4);
  pHeadRow.values = partyHeaders;
  pHeadRow.height = 24;
  pHeadRow.eachCell((cell) => {
    cell.font = { name: "Arial", size: 9, bold: true, color: { argb: COLORS.WHITE } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.CHARCOAL } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = { bottom: { style: "medium", color: { argb: COLORS.HAXR_GOLD } } };
  });

  let pIdx = 5;
  for (let i = 0; i < guests.length; i++) {
    const guest = guests[i];
    const companion = resolveGuestCompanionInfo(guest);
    const row = wsParty.getRow(pIdx);

    row.values = [
      i + 1,
      guest.name,
      HUMAN_RSVP_LABELS[guest.status] || guest.status,
      companion.formattedLabel,
      companion.totalPartySize,
      formatGuestContact(guest),
    ];

    row.eachCell((cell, colNum) => {
      cell.font = { name: "Arial", size: 8.5, color: { argb: COLORS.CHARCOAL } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: pIdx % 2 === 0 ? COLORS.GRAY_LIGHT : COLORS.WHITE } };
      cell.border = { bottom: { style: "thin", color: { argb: COLORS.GRAY_BORDER } } };
      if (colNum === 1 || colNum === 3 || colNum === 5) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else {
        cell.alignment = { vertical: "middle" };
      }
    });

    row.height = 20;
    pIdx++;
  }

  // Row Totals
  const pTotRow = wsParty.getRow(pIdx);
  pTotRow.values = [
    "TOTAL",
    `${stats.primaryGuests} Convites`,
    `${stats.responseRate}% Confirmado`,
    `+${stats.plusOnesTotal} Acomp.`,
    stats.expectedAttendance,
    "Presença Prevista Total",
  ];
  pTotRow.eachCell((cell) => {
    cell.font = { name: "Arial", size: 9, bold: true, color: { argb: COLORS.HAXR_BLACK } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HAXR_IVORY } };
    cell.border = {
      top: { style: "medium", color: { argb: COLORS.HAXR_GOLD } },
      bottom: { style: "medium", color: { argb: COLORS.HAXR_GOLD } },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });
  pTotRow.height = 22;

  wsParty.autoFilter = `A4:F${Math.max(5, pIdx - 1)}`;

  // ─────────────────────────────────────────────────────────────
  // 4. ABA: 04 — Registo de Presentes
  // ─────────────────────────────────────────────────────────────
  const wsGifts = wb.addWorksheet("04 — Registo de Presentes", {
    views: [{ state: "frozen", ySplit: 4, showGridLines: true }],
    properties: { tabColor: { argb: COLORS.GREEN_TEXT } },
    pageSetup: {
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });

  wsGifts.columns = [
    { width: 6 },  // Nº
    { width: 34 }, // Presente
    { width: 20 }, // Categoria
    { width: 30 }, // Reservado Por
    { width: 22 }, // Data da Reserva
  ];

  wsGifts.mergeCells("A1:E1");
  const gTitle = wsGifts.getCell("A1");
  gTitle.value = `REGISTO DE PRESENTES & MIMOS (EDITION) — ${event.name.toUpperCase()}`;
  gTitle.font = { name: "Georgia", size: 12, bold: true, color: { argb: COLORS.HAXR_GOLD } };
  gTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HAXR_BLACK } };
  gTitle.alignment = { vertical: "middle", indent: 1 };
  wsGifts.getRow(1).height = 28;

  wsGifts.mergeCells("A2:E2");
  const gSub = wsGifts.getCell("A2");
  gSub.value = `Total de Presentes Reservados: ${gifts.length} itens · Gerado em: ${formatGeneratedAtTimestamp(report.generatedAt)}`;
  gSub.font = { name: "Arial", size: 9, italic: true, color: { argb: COLORS.CHARCOAL } };
  gSub.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HAXR_IVORY } };
  gSub.alignment = { vertical: "middle", indent: 1 };
  wsGifts.getRow(2).height = 20;

  const giftHeaders = ["Nº", "Presente", "Categoria", "Reservado Por", "Data da Reserva"];

  const gHeadRow = wsGifts.getRow(4);
  gHeadRow.values = giftHeaders;
  gHeadRow.height = 24;
  gHeadRow.eachCell((cell) => {
    cell.font = { name: "Arial", size: 9, bold: true, color: { argb: COLORS.WHITE } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.CHARCOAL } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = { bottom: { style: "medium", color: { argb: COLORS.HAXR_GOLD } } };
  });

  let gIdx = 5;
  if (gifts.length === 0) {
    const emptyRow = wsGifts.getRow(5);
    wsGifts.mergeCells("A5:E5");
    const emptyCell = wsGifts.getCell("A5");
    emptyCell.value = "Nenhum presente reservado até ao momento.";
    emptyCell.font = { name: "Arial", size: 9, italic: true, color: { argb: COLORS.MUTED_TEXT } };
    emptyCell.alignment = { horizontal: "center", vertical: "middle" };
    emptyRow.height = 28;
  } else {
    for (let i = 0; i < gifts.length; i++) {
      const gift = gifts[i];
      const row = wsGifts.getRow(gIdx);

      row.values = [
        i + 1,
        gift.giftName,
        gift.category,
        gift.reservedBy || "Anónimo",
        new Date(gift.createdAt).toLocaleString("pt-MZ", {
          dateStyle: "short",
          timeStyle: "short",
          timeZone: "Africa/Maputo",
        }),
      ];

      row.eachCell((cell, colNum) => {
        cell.font = { name: "Arial", size: 8.5, color: { argb: COLORS.CHARCOAL } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: gIdx % 2 === 0 ? COLORS.GRAY_LIGHT : COLORS.WHITE } };
        cell.border = { bottom: { style: "thin", color: { argb: COLORS.GRAY_BORDER } } };
        if (colNum === 1 || colNum === 5) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
        } else {
          cell.alignment = { vertical: "middle" };
        }
      });

      row.height = 20;
      gIdx++;
    }

    wsGifts.autoFilter = `A4:E${Math.max(5, gIdx - 1)}`;
  }

  // ─────────────────────────────────────────────────────────────
  // 5. ABA: 05 — Mensagens & Votos (Apenas quando existem)
  // ─────────────────────────────────────────────────────────────
  if (readiness.hasGuestMessages) {
    const wsMsg = wb.addWorksheet("05 — Mensagens & Votos", {
      views: [{ state: "frozen", ySplit: 3, showGridLines: true }],
      properties: { tabColor: { argb: COLORS.HAXR_GOLD } },
      pageSetup: {
        orientation: "portrait",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
      },
    });

    wsMsg.columns = [
      { width: 6 },  // Nº
      { width: 32 }, // Convidado
      { width: 22 }, // Acompanhante(s)
      { width: 60 }, // Mensagem / Votos
    ];

    wsMsg.mergeCells("A1:D1");
    const mTitle = wsMsg.getCell("A1");
    mTitle.value = `MENSAGENS & VOTOS DOS CONVIDADOS — ${event.name.toUpperCase()}`;
    mTitle.font = { name: "Georgia", size: 12, bold: true, color: { argb: COLORS.HAXR_GOLD } };
    mTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HAXR_BLACK } };
    mTitle.alignment = { vertical: "middle", indent: 1 };
    wsMsg.getRow(1).height = 28;

    const msgHeaders = ["Nº", "Convidado", "Acompanhante(s)", "Mensagem / Votos"];

    const msgHeadRow = wsMsg.getRow(3);
    msgHeadRow.values = msgHeaders;
    msgHeadRow.height = 22;
    msgHeadRow.eachCell((cell) => {
      cell.font = { name: "Arial", size: 9, bold: true, color: { argb: COLORS.WHITE } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.CHARCOAL } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    let msgRowIdx = 4;
    for (let i = 0; i < messageGuests.length; i++) {
      const { guest, message } = messageGuests[i];
      const companion = resolveGuestCompanionInfo(guest);
      const row = wsMsg.getRow(msgRowIdx);

      row.values = [i + 1, guest.name, companion.formattedLabel, message];

      row.eachCell((cell, colNum) => {
        cell.font = { name: "Arial", size: 8.5, color: { argb: COLORS.CHARCOAL } };
        cell.border = { bottom: { style: "thin", color: { argb: COLORS.GRAY_BORDER } } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: msgRowIdx % 2 === 0 ? COLORS.GRAY_LIGHT : COLORS.WHITE } };
        if (colNum === 1) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
        } else if (colNum === 4) {
          cell.font = { name: "Georgia", size: 9, italic: true, color: { argb: COLORS.CHARCOAL } };
          cell.alignment = { vertical: "middle", wrapText: true };
        } else {
          cell.alignment = { vertical: "middle" };
        }
      });

      row.height = 24;
      msgRowIdx++;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 6. ABA: 06 — Distribuição de Mesas (Apenas quando configurado)
  // ─────────────────────────────────────────────────────────────
  if (readiness.hasSeating) {
    const wsSeats = wb.addWorksheet("06 — Distribuição de Mesas", {
      views: [{ state: "frozen", ySplit: 3, showGridLines: true }],
      properties: { tabColor: { argb: COLORS.HAXR_CHAMPAGNE } },
      pageSetup: {
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
      },
    });

    wsSeats.columns = [
      { width: 22 }, // Mesa
      { width: 12 }, // Nº Lugar
      { width: 16 }, // Etiqueta
      { width: 32 }, // Convidado
      { width: 24 }, // Acompanhante(s)
      { width: 20 }, // Estado RSVP
      { width: 28 }, // Restrições Alimentares
    ];

    wsSeats.mergeCells("A1:G1");
    const sTitle = wsSeats.getCell("A1");
    sTitle.value = `DISTRIBUIÇÃO DE LUGARES & MESAS — ${event.name.toUpperCase()}`;
    sTitle.font = { name: "Georgia", size: 12, bold: true, color: { argb: COLORS.HAXR_GOLD } };
    sTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HAXR_BLACK } };
    sTitle.alignment = { vertical: "middle", indent: 1 };
    wsSeats.getRow(1).height = 28;

    const seatHeaders = [
      "Mesa",
      "Nº Lugar",
      "Etiqueta",
      "Convidado Alocado",
      "Acompanhante(s)",
      "Estado RSVP",
      "Restrições Alimentares",
    ];

    const seatHeadRow = wsSeats.getRow(3);
    seatHeadRow.values = seatHeaders;
    seatHeadRow.height = 22;
    seatHeadRow.eachCell((cell) => {
      cell.font = { name: "Arial", size: 9, bold: true, color: { argb: COLORS.WHITE } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.CHARCOAL } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    let seatRowIdx = 4;
    for (const group of tableGroups) {
      for (const seat of group.seats) {
        const row = wsSeats.getRow(seatRowIdx);
        const guest = seat.guest;
        const companion = guest ? resolveGuestCompanionInfo(guest) : null;

        row.values = [
          formatTableName(group.tableName),
          `Lugar ${seat.seatNumber}`,
          seat.label || "—",
          guest ? guest.name : "Disponível",
          companion ? companion.formattedLabel : "—",
          guest ? (HUMAN_RSVP_LABELS[guest.status] || guest.status) : "Disponível",
          guest?.dietaryNotes || "—",
        ];

        row.eachCell((cell) => {
          cell.font = { name: "Arial", size: 8.5, color: { argb: guest ? COLORS.CHARCOAL : COLORS.MUTED_TEXT } };
          cell.border = { bottom: { style: "thin", color: { argb: COLORS.GRAY_BORDER } } };
          cell.alignment = { vertical: "middle" };
        });

        row.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
        row.getCell(6).alignment = { horizontal: "center", vertical: "middle" };

        row.height = 19;
        seatRowIdx++;
      }
    }
  }

  return wb;
}

/**
 * Gera o buffer binário (.xlsx) do livro de RSVP & Presentes.
 */
export async function buildRsvpGiftingExcelBuffer(
  report: GuestEventReport,
  gifts: EditionGiftReservation[] = [],
  businessName?: string
): Promise<Buffer> {
  const wb = await buildOfficialRsvpGiftingWorkbook(report, gifts, businessName);
  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Download directo no browser do livro de RSVP & Presentes.
 */
export async function downloadRsvpGiftingExcel(
  report: GuestEventReport,
  gifts: EditionGiftReservation[] = [],
  filename?: string
): Promise<void> {
  const wb = await buildOfficialRsvpGiftingWorkbook(report, gifts);
  const arrayBuffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([arrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename || sanitizeRsvpGiftingWorkbookFilename(report.event.name, report.event.date, report.event.businessId);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
