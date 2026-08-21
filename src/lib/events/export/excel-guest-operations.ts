import ExcelJS from "exceljs";
import { CLIENT_TYPE_LABELS } from "@/lib/admin/constants";
import { GUEST_STATUS_LABELS } from "@/lib/events/constants";
import {
  eventReportHeader,
  formatGeneratedAtTimestamp,
  formatGuestCheckIn,
  formatGuestSeat,
  resolveGuestCompanionInfo,
  type GuestEventReport,
} from "@/lib/events/export/report";

// Luxury Brand Palette (Parity with HAXR Wedding Financial Book)
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

export function sanitizeGuestWorkbookFilename(title: string, dateIso?: string | null): string {
  const cleanTitle = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_\-\s]/g, "")
    .trim()
    .replace(/\s+/g, "_");

  const dateSuffix = dateIso
    ? `_${dateIso.slice(0, 10)}`
    : `_${new Date().toISOString().slice(0, 10)}`;
  return `HAXR_Convidados_${cleanTitle || "Evento"}${dateSuffix}.xlsx`;
}

/**
 * Constrói o Livro Oficial de Operações de Convidados HAXR (.xlsx via ExcelJS)
 * com 4 abas profissionais:
 * 1. Resumo Executivo & Banquete
 * 2. Lista Mestre de Convidados
 * 3. Distribuição de Mesas (Seating)
 * 4. Cozinha & Restrições (Dietary Manifest)
 */
export async function buildOfficialGuestOperationsWorkbook(
  report: GuestEventReport
): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "HAXR Signature · Event Operations & Luxury Banqueting Atelier";
  wb.lastModifiedBy = "HAXR Signature Concierge";
  wb.created = new Date(report.generatedAt || new Date());
  wb.modified = new Date();

  const { event, guests, stats, tableGroups, unassignedGuests } = report;

  // ─────────────────────────────────────────────────────────────
  // 1. ABA: 01 — Resumo Executivo & Banquete
  // ─────────────────────────────────────────────────────────────
  const wsDash = wb.addWorksheet("01 — Resumo Executivo", {
    views: [{ showGridLines: true }],
    properties: { tabColor: { argb: COLORS.HAXR_GOLD } },
  });

  wsDash.columns = [
    { width: 4 },  // A (margin)
    { width: 32 }, // B
    { width: 20 }, // C
    { width: 20 }, // D
    { width: 20 }, // E
    { width: 28 }, // F
  ];

  // Header banner
  wsDash.mergeCells("B2:F2");
  const titleCell = wsDash.getCell("B2");
  titleCell.value = "HAXR SIGNATURE · GUEST OPERATIONS & BANQUETING MASTER";
  titleCell.font = { name: "Georgia", size: 14, bold: true, color: { argb: COLORS.HAXR_GOLD } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HAXR_BLACK } };
  titleCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  wsDash.getRow(2).height = 36;

  // Metadata subtitle
  wsDash.mergeCells("B3:F3");
  const subCell = wsDash.getCell("B3");
  subCell.value = `${event.name} · ${eventReportHeader(event)} · Gerado em: ${formatGeneratedAtTimestamp(report.generatedAt)}`;
  subCell.font = { name: "Arial", size: 9, italic: true, color: { argb: COLORS.CHARCOAL } };
  subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HAXR_IVORY } };
  subCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  wsDash.getRow(3).height = 24;

  // Section Header: Headcount & Banquete
  wsDash.mergeCells("B5:F5");
  const sec1Cell = wsDash.getCell("B5");
  sec1Cell.value = "INDICADORES OPERACIONAIS DE BANQUETE & RECEPÇÃO";
  sec1Cell.font = { name: "Georgia", size: 10, bold: true, color: { argb: COLORS.HAXR_GOLD } };
  sec1Cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HAXR_BLACK } };
  sec1Cell.alignment = { vertical: "middle", indent: 1 };
  wsDash.getRow(5).height = 24;

  const kpis = [
    ["Convidados Principais (Convites)", stats.primaryGuests, "Total de convites elegíveis emitidos"],
    ["Confirmados (RSVP Sim)", stats.confirmed, "Convidados principais com presença confirmada"],
    ["Presença no Check-in", stats.checkedIn, "Convidados com entrada registada na recepção"],
    ["Headcount Total de Banquete (Catering Covers)", stats.expectedAttendance, "Total de pessoas previstas (Principais confirmados/check-in + Acompanhantes)"],
    ["Acompanhantes Totais (+1/+2)", stats.plusOnesTotal, "Total de acompanhantes de todos os convidados elegíveis"],
    ["Pendentes de Resposta", stats.invited, "Convites a aguardar confirmação"],
    ["Convites Recusados", stats.declined, "Convites que declinaram comparência"],
    ["Taxa de Confirmação / Resposta", `${stats.responseRate}%`, "Percentagem de convites respondidos"],
    ["Lugares Atribuídos", `${stats.assignedGuests} / ${stats.totalSeats || "—"}`, stats.totalSeats > 0 ? `${stats.capacityUsed}% de ocupação` : "Lugares ainda não configurados"],
    ["Sem Lugar Atribuído", stats.unassignedGuests, "Convidados a aguardar alocação de mesa"],
    ["Restrições Alimentares / Alergias", stats.dietaryCount, "Convidados com restrições comunicadas para a cozinha"],
  ];

  let curRow = 6;
  for (const [label, val, desc] of kpis) {
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
  // 2. ABA: 02 — Lista Mestre de Convidados
  // ─────────────────────────────────────────────────────────────
  const wsGuests = wb.addWorksheet("02 — Lista de Convidados", {
    views: [{ state: "frozen", ySplit: 4, showGridLines: true }],
    properties: { tabColor: { argb: COLORS.CHARCOAL } },
  });

  wsGuests.columns = [
    { width: 6 },  // Nº
    { width: 32 }, // Convidado Principal
    { width: 16 }, // Tipo
    { width: 16 }, // Estado RSVP
    { width: 28 }, // Acompanhante(s) Nomeado(s)
    { width: 14 }, // Acomp. Qtd
    { width: 14 }, // Total Pessoas
    { width: 20 }, // Mesa
    { width: 12 }, // Lugar
    { width: 28 }, // Email
    { width: 20 }, // Telefone
    { width: 30 }, // Restrições Alimentares
    { width: 32 }, // Notas Operacionais
    { width: 20 }, // Check-in
  ];

  // Header Title
  wsGuests.mergeCells("A1:N1");
  const gTitle = wsGuests.getCell("A1");
  gTitle.value = `HAXR SIGNATURE · LISTA MESTRE DE CONVIDADOS — ${event.name.toUpperCase()}`;
  gTitle.font = { name: "Georgia", size: 12, bold: true, color: { argb: COLORS.HAXR_GOLD } };
  gTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HAXR_BLACK } };
  gTitle.alignment = { vertical: "middle", indent: 1 };
  wsGuests.getRow(1).height = 28;

  wsGuests.mergeCells("A2:N2");
  const gSub = wsGuests.getCell("A2");
  gSub.value = `Total Convidados Principais: ${stats.primaryGuests} · Presença Prevista: ${stats.expectedAttendance} pessoas · Gerado em: ${formatGeneratedAtTimestamp(report.generatedAt)}`;
  gSub.font = { name: "Arial", size: 9, italic: true, color: { argb: COLORS.CHARCOAL } };
  gSub.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HAXR_IVORY } };
  gSub.alignment = { vertical: "middle", indent: 1 };
  wsGuests.getRow(2).height = 20;

  // Table Column Headers
  const guestHeaders = [
    "Nº",
    "Convidado Principal",
    "Tipo",
    "Estado RSVP",
    "Acompanhantes",
    "Acomp. Qtd",
    "Total Couverts",
    "Mesa",
    "Lugar",
    "Email",
    "Telefone",
    "Restrições Alimentares / Alergias",
    "Notas Operacionais",
    "Check-in Registado",
  ];

  const headerRow = wsGuests.getRow(4);
  headerRow.values = guestHeaders;
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.font = { name: "Arial", size: 9, bold: true, color: { argb: COLORS.WHITE } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.CHARCOAL } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      bottom: { style: "medium", color: { argb: COLORS.HAXR_GOLD } },
    };
  });

  // Align specific headers
  wsGuests.getCell("B4").alignment = { vertical: "middle", horizontal: "left" };
  wsGuests.getCell("E4").alignment = { vertical: "middle", horizontal: "left" };
  wsGuests.getCell("J4").alignment = { vertical: "middle", horizontal: "left" };
  wsGuests.getCell("L4").alignment = { vertical: "middle", horizontal: "left" };
  wsGuests.getCell("M4").alignment = { vertical: "middle", horizontal: "left" };

  let guestRowIndex = 5;
  for (let i = 0; i < guests.length; i++) {
    const guest = guests[i];
    const companion = resolveGuestCompanionInfo(guest);
    const row = wsGuests.getRow(guestRowIndex);

    let statusFg = COLORS.CHARCOAL;
    let statusBg = COLORS.WHITE;
    if (guest.status === "confirmed") {
      statusFg = COLORS.GREEN_TEXT;
      statusBg = COLORS.GREEN_BG;
    } else if (guest.status === "checked_in") {
      statusFg = COLORS.AMBER_TEXT;
      statusBg = COLORS.AMBER_BG;
    } else if (guest.status === "declined") {
      statusFg = COLORS.RED_TEXT;
      statusBg = COLORS.RED_BG;
    } else if (guest.status === "invited") {
      statusFg = COLORS.MUTED_TEXT;
      statusBg = COLORS.MUTED_BG;
    }

    row.values = [
      i + 1,
      guest.name,
      CLIENT_TYPE_LABELS[guest.clientType] || guest.clientType,
      GUEST_STATUS_LABELS[guest.status] || guest.status,
      companion.formattedLabel,
      guest.plusOnes > 0 ? `+${guest.plusOnes}` : 0,
      companion.totalPartySize,
      guest.seat?.tableName ?? "Sem mesa",
      guest.seat ? `Lugar ${guest.seat.seatNumber}${guest.seat.label ? ` (${guest.seat.label})` : ""}` : "Sem lugar",
      guest.email || "—",
      guest.phone || "—",
      guest.dietaryNotes || "—",
      guest.guestNotes || "—",
      formatGuestCheckIn(guest.checkedInAt),
    ];

    const isEven = guestRowIndex % 2 === 0;
    const defaultBg = isEven ? COLORS.GRAY_LIGHT : COLORS.WHITE;

    row.eachCell((cell, colNumber) => {
      cell.font = { name: "Arial", size: 8.5, color: { argb: COLORS.CHARCOAL } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: defaultBg } };
      cell.border = {
        bottom: { style: "thin", color: { argb: COLORS.GRAY_BORDER } },
      };

      if (colNumber === 1 || colNumber === 6 || colNumber === 7 || colNumber === 14) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else {
        cell.alignment = { vertical: "middle" };
      }
    });

    // Special status cell styling
    const statusCell = row.getCell(4);
    statusCell.font = { name: "Arial", size: 8.5, bold: true, color: { argb: statusFg } };
    statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: statusBg } };
    statusCell.alignment = { horizontal: "center", vertical: "middle" };

    // Highlight dietary restrictions if present
    if (guest.dietaryNotes && guest.dietaryNotes.trim()) {
      const dietaryCell = row.getCell(12);
      dietaryCell.font = { name: "Arial", size: 8.5, bold: true, color: { argb: COLORS.RED_TEXT } };
      dietaryCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.RED_BG } };
    }

    row.height = 20;
    guestRowIndex++;
  }

  // Auto-filter on main table
  wsGuests.autoFilter = `A4:N${Math.max(5, guestRowIndex - 1)}`;

  // ─────────────────────────────────────────────────────────────
  // 3. ABA: 03 — Distribuição de Mesas (Seating Chart)
  // ─────────────────────────────────────────────────────────────
  const wsSeats = wb.addWorksheet("03 — Mapa de Mesas", {
    views: [{ state: "frozen", ySplit: 3, showGridLines: true }],
    properties: { tabColor: { argb: COLORS.HAXR_CHAMPAGNE } },
  });

  wsSeats.columns = [
    { width: 20 }, // Mesa
    { width: 12 }, // Nº Lugar
    { width: 16 }, // Etiqueta
    { width: 32 }, // Convidado
    { width: 24 }, // Acompanhante(s)
    { width: 16 }, // Estado RSVP
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
        `Mesa ${group.tableName}`,
        `Lugar ${seat.seatNumber}`,
        seat.label || "—",
        guest ? guest.name : "Vazio",
        companion ? companion.formattedLabel : "—",
        guest ? (GUEST_STATUS_LABELS[guest.status] || guest.status) : "Disponível",
        guest?.dietaryNotes || "—",
      ];

      row.eachCell((cell) => {
        cell.font = { name: "Arial", size: 8.5, color: { argb: guest ? COLORS.CHARCOAL : COLORS.MUTED_TEXT } };
        cell.border = { bottom: { style: "thin", color: { argb: COLORS.GRAY_BORDER } } };
        cell.alignment = { vertical: "middle" };
      });

      row.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(6).alignment = { horizontal: "center", vertical: "middle" };

      if (!guest) {
        row.getCell(4).font = { name: "Arial", size: 8.5, italic: true, color: { argb: COLORS.MUTED_TEXT } };
      }

      row.height = 19;
      seatRowIdx++;
    }
  }

  if (unassignedGuests.length > 0) {
    seatRowIdx++;
    const unRow = wsSeats.getRow(seatRowIdx);
    unRow.values = [`SEM LUGAR ATRIBUÍDO (${unassignedGuests.length})`, "", "", "", "", "", ""];
    wsSeats.mergeCells(`A${seatRowIdx}:G${seatRowIdx}`);
    unRow.getCell(1).font = { name: "Arial", size: 9, bold: true, color: { argb: COLORS.WHITE } };
    unRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.AMBER_TEXT } };
    unRow.getCell(1).alignment = { vertical: "middle", indent: 1 };
    unRow.height = 22;
    seatRowIdx++;

    for (const uGuest of unassignedGuests) {
      const row = wsSeats.getRow(seatRowIdx);
      const companion = resolveGuestCompanionInfo(uGuest);
      row.values = [
        "Sem mesa",
        "—",
        "—",
        uGuest.name,
        companion.formattedLabel,
        GUEST_STATUS_LABELS[uGuest.status] || uGuest.status,
        uGuest.dietaryNotes || "—",
      ];
      row.eachCell((cell) => {
        cell.font = { name: "Arial", size: 8.5, color: { argb: COLORS.CHARCOAL } };
        cell.border = { bottom: { style: "thin", color: { argb: COLORS.GRAY_BORDER } } };
        cell.alignment = { vertical: "middle" };
      });
      row.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(6).alignment = { horizontal: "center", vertical: "middle" };
      row.height = 19;
      seatRowIdx++;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 4. ABA: 04 — Cozinha & Restrições (Dietary Manifest)
  // ─────────────────────────────────────────────────────────────
  const wsDiet = wb.addWorksheet("04 — Cozinha & Alergias", {
    views: [{ state: "frozen", ySplit: 3, showGridLines: true }],
    properties: { tabColor: { argb: COLORS.RED_TEXT } },
  });

  wsDiet.columns = [
    { width: 6 },  // Nº
    { width: 32 }, // Convidado
    { width: 16 }, // Mesa / Lugar
    { width: 36 }, // Restrição Alimentar / Alergia
    { width: 36 }, // Notas de Banquete
    { width: 16 }, // Estado RSVP
  ];

  wsDiet.mergeCells("A1:F1");
  const dTitle = wsDiet.getCell("A1");
  dTitle.value = `MANIFESTO DE COZINHA & RESTRIÇÕES ALIMENTARES — ${event.name.toUpperCase()}`;
  dTitle.font = { name: "Georgia", size: 12, bold: true, color: { argb: COLORS.WHITE } };
  dTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.RED_TEXT } };
  dTitle.alignment = { vertical: "middle", indent: 1 };
  wsDiet.getRow(1).height = 28;

  const dietHeaders = [
    "Nº",
    "Convidado",
    "Mesa / Lugar",
    "Restrição Alimentar / Alergia",
    "Notas Operacionais / Banquete",
    "Estado RSVP",
  ];

  const dietHeadRow = wsDiet.getRow(3);
  dietHeadRow.values = dietHeaders;
  dietHeadRow.height = 22;
  dietHeadRow.eachCell((cell) => {
    cell.font = { name: "Arial", size: 9, bold: true, color: { argb: COLORS.WHITE } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.CHARCOAL } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  const dietaryGuests = guests.filter(
    (g) => (g.dietaryNotes && g.dietaryNotes.trim()) || (g.guestNotes && g.guestNotes.trim())
  );

  let dietRowIdx = 4;
  if (dietaryGuests.length === 0) {
    const emptyRow = wsDiet.getRow(4);
    wsDiet.mergeCells("A4:F4");
    const emptyCell = wsDiet.getCell("A4");
    emptyCell.value = "Nenhuma restrição alimentar ou nota especial registada para este evento.";
    emptyCell.font = { name: "Arial", size: 9, italic: true, color: { argb: COLORS.MUTED_TEXT } };
    emptyCell.alignment = { horizontal: "center", vertical: "middle" };
    emptyRow.height = 30;
  } else {
    for (let i = 0; i < dietaryGuests.length; i++) {
      const g = dietaryGuests[i];
      const row = wsDiet.getRow(dietRowIdx);

      row.values = [
        i + 1,
        g.name,
        formatGuestSeat(g),
        g.dietaryNotes || "Sem restrição alimentar",
        g.guestNotes || "—",
        GUEST_STATUS_LABELS[g.status] || g.status,
      ];

      row.eachCell((cell, colNum) => {
        cell.font = { name: "Arial", size: 8.5, color: { argb: COLORS.CHARCOAL } };
        cell.border = { bottom: { style: "thin", color: { argb: COLORS.GRAY_BORDER } } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: dietRowIdx % 2 === 0 ? COLORS.GRAY_LIGHT : COLORS.WHITE } };
        if (colNum === 1 || colNum === 6) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
        } else {
          cell.alignment = { vertical: "middle" };
        }
      });

      if (g.dietaryNotes && g.dietaryNotes.trim()) {
        const dietCell = row.getCell(4);
        dietCell.font = { name: "Arial", size: 8.5, bold: true, color: { argb: COLORS.RED_TEXT } };
      }

      row.height = 20;
      dietRowIdx++;
    }
  }

  return wb;
}

/**
 * Gera o buffer binário (.xlsx) do livro de convidados para uso em servidor / testes.
 */
export async function buildGuestReportExcelBuffer(
  report: GuestEventReport
): Promise<Buffer> {
  const wb = await buildOfficialGuestOperationsWorkbook(report);
  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Realiza o download directo no browser no cliente.
 */
export async function downloadGuestReportExcel(
  report: GuestEventReport,
  filename?: string
): Promise<void> {
  const wb = await buildOfficialGuestOperationsWorkbook(report);
  const arrayBuffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([arrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename || sanitizeGuestWorkbookFilename(report.event.name, report.event.date);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
