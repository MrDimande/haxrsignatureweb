import ExcelJS from "exceljs";
import {
  eventReportHeader,
  formatGeneratedAtTimestamp,
  formatGuestCheckIn,
  formatGuestContact,
  formatTableName,
  HUMAN_RSVP_LABELS,
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

export function sanitizeGuestWorkbookFilename(title: string, dateIso?: string | null, businessId?: string): string {
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
  return `${prefix}_Convidados_${cleanTitle || "Evento"}${dateSuffix}.xlsx`;
}

/**
 * Constrói o Livro Oficial de Operações de Convidados HAXR (.xlsx via ExcelJS)
 * com abas adaptativas baseadas na prontidão factual do evento:
 * - 01 — Resumo Executivo
 * - 02 — Lista de Convidados
 * - 03 — RSVP & Banquete
 * - 04 — Mapa de Mesas (Apenas quando mesas/lugares estão configurados)
 * - 05 — Cozinha & Alergias (Apenas quando existem restrições alimentares)
 * - 06 — Mensagens dos Convidados (Apenas quando existem votos/mensagens)
 */
export async function buildOfficialGuestOperationsWorkbook(
  report: GuestEventReport,
  businessName?: string
): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  const resolvedBrand = businessName || (report.event.businessId === "brainywrite" ? "BrainyWrite" : "HAXR Signature");

  wb.creator = `${resolvedBrand} · Event Operations & Luxury Banqueting Atelier`;
  wb.lastModifiedBy = `${resolvedBrand} Concierge`;
  wb.created = new Date(report.generatedAt || new Date());
  wb.modified = new Date();

  const {
    event,
    guests,
    stats,
    readiness,
    dietaryGuests,
    messageGuests,
    tableGroups,
    unassignedGuests,
  } = report;

  const isSocial = readiness.isSocialEvent;
  const hasSeating = readiness.hasSeating;
  const hasDietary = readiness.hasDietaryRequirements;
  const hasMessages = readiness.hasGuestMessages;
  const hasCheckIns = readiness.hasCheckIns;
  const isZeroGuests = guests.length === 0;

  // Apenas exibe coluna de Entidade em corporativo se houver dados reais
  const hasEntityData = !isSocial && guests.some((g) => Boolean(g.groupName && g.groupName.trim().length > 0));

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
  titleCell.value = `${resolvedBrand.toUpperCase()} · GUEST OPERATIONS & BANQUETING MASTER`;
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

  let curRow = 5;

  if (isZeroGuests) {
    wsDash.mergeCells(`B${curRow}:F${curRow}`);
    const emptySec = wsDash.getCell(`B${curRow}`);
    emptySec.value = "LISTA DE CONVIDADOS AINDA NÃO INICIADA";
    emptySec.font = { name: "Georgia", size: 10, bold: true, color: { argb: COLORS.HAXR_GOLD } };
    emptySec.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HAXR_BLACK } };
    emptySec.alignment = { vertical: "middle", indent: 1 };
    wsDash.getRow(curRow).height = 24;
    curRow++;

    wsDash.mergeCells(`B${curRow}:F${curRow}`);
    const emptyDesc = wsDash.getCell(`B${curRow}`);
    emptyDesc.value = "Nenhum convidado registado até ao momento para este evento.";
    emptyDesc.font = { name: "Arial", size: 9, italic: true, color: { argb: COLORS.MUTED_TEXT } };
    emptyDesc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.GRAY_LIGHT } };
    emptyDesc.alignment = { vertical: "middle", indent: 1 };
    wsDash.getRow(curRow).height = 24;
  } else {
    // Section Header: Headcount & Banquete
    wsDash.mergeCells(`B${curRow}:F${curRow}`);
    const sec1Cell = wsDash.getCell(`B${curRow}`);
    sec1Cell.value = "INDICADORES OPERACIONAIS DE BANQUETE & RECEPÇÃO";
    sec1Cell.font = { name: "Georgia", size: 10, bold: true, color: { argb: COLORS.HAXR_GOLD } };
    sec1Cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HAXR_BLACK } };
    sec1Cell.alignment = { vertical: "middle", indent: 1 };
    wsDash.getRow(curRow).height = 24;
    curRow++;

    const kpis: [string, string | number, string][] = [
      ["Convidados Principais (Convites)", stats.primaryGuests, "Total de convites elegíveis emitidos"],
      ["Confirmados (RSVP Sim)", stats.confirmed, "Convidados principais com presença confirmada"],
      ["Presença no Check-in", stats.checkedIn, "Convidados com entrada registada na recepção"],
      ["Headcount Total de Banquete (Presença Prevista)", stats.expectedAttendance, "Total de pessoas previstas (Principais confirmados/check-in + Acompanhantes)"],
      ["Acompanhantes Totais (+1/+2)", stats.plusOnesTotal, "Total de acompanhantes de todos os convidados elegíveis"],
      ["Pendentes de Resposta", stats.invited, "Convites a aguardar confirmação"],
      ["Convites Recusados", stats.declined, "Convites que declinaram comparência"],
      ["Taxa de Confirmação / Resposta", `${stats.responseRate}%`, "Percentagem de convites respondidos"],
    ];

    if (hasSeating) {
      kpis.push([
        "Distribuição de Mesas",
        stats.unassignedGuests === 0
          ? `${stats.assignedGuests} / ${stats.assignedGuests} (${stats.uniqueTables} Mesas)`
          : `${stats.assignedGuests} / ${stats.primaryGuests} distribuídos (${stats.unassignedGuests} por distribuir)`,
        stats.unassignedGuests === 0
          ? "Todos os convidados têm mesa atribuída"
          : `${stats.unassignedGuests} convidados aguardam alocação de mesa`,
      ]);
    }

    if (hasDietary) {
      kpis.push([
        "Restrições Alimentares / Alergias",
        stats.dietaryCount,
        "Convidados com restrições comunicadas para a cozinha",
      ]);
    }

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

    // Section Header: Estado Operacional do Evento
    curRow++;
    wsDash.mergeCells(`B${curRow}:F${curRow}`);
    const sec2Cell = wsDash.getCell(`B${curRow}`);
    sec2Cell.value = "ESTADO OPERACIONAL DO EVENTO (READINESS SUMMARY)";
    sec2Cell.font = { name: "Georgia", size: 10, bold: true, color: { argb: COLORS.HAXR_GOLD } };
    sec2Cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HAXR_BLACK } };
    sec2Cell.alignment = { vertical: "middle", indent: 1 };
    wsDash.getRow(curRow).height = 24;
    curRow++;

    const statusItems = [
      ["RSVP & Respostas", readiness.operationalStatus.rsvp],
      ["Distribuição de Mesas", readiness.operationalStatus.seating],
      ["Cozinha & Banquete", readiness.operationalStatus.kitchen],
      ["Recepção & Check-in", readiness.operationalStatus.checkIn],
    ];

    for (const [mod, stat] of statusItems) {
      wsDash.getCell(`B${curRow}`).value = mod;
      wsDash.getCell(`B${curRow}`).font = { name: "Arial", size: 9, bold: true, color: { argb: COLORS.CHARCOAL } };
      wsDash.getCell(`B${curRow}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: curRow % 2 === 0 ? COLORS.WHITE : COLORS.GRAY_LIGHT } };

      wsDash.mergeCells(`C${curRow}:F${curRow}`);
      const statCell = wsDash.getCell(`C${curRow}`);
      statCell.value = stat;
      statCell.font = { name: "Arial", size: 9.5, bold: true, color: { argb: COLORS.HAXR_BLACK } };
      statCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: curRow % 2 === 0 ? COLORS.WHITE : COLORS.GRAY_LIGHT } };
      statCell.alignment = { vertical: "middle", indent: 1 };

      wsDash.getRow(curRow).height = 20;
      curRow++;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. ABA: 02 — Lista de Convidados (Guest Master)
  // ─────────────────────────────────────────────────────────────
  const wsGuests = wb.addWorksheet("02 — Lista de Convidados", {
    views: [{ state: "frozen", ySplit: 4, showGridLines: true }],
    properties: { tabColor: { argb: COLORS.CHARCOAL } },
    pageSetup: {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 },
    },
  });

  const guestHeaders: string[] = ["Nº", "Convidado Principal"];
  const guestColWidths: { width: number }[] = [{ width: 6 }, { width: 32 }];

  if (hasEntityData) {
    guestHeaders.push("Entidade");
    guestColWidths.push({ width: 20 });
  }

  guestHeaders.push("Estado RSVP", "Acompanhantes", "Acomp. Qtd", "Total Couverts");
  guestColWidths.push({ width: 20 }, { width: 22 }, { width: 14 }, { width: 14 });

  if (hasSeating) {
    guestHeaders.push("Mesa");
    guestColWidths.push({ width: 18 });
    if (readiness.shouldReportExactSeat) {
      guestHeaders.push("Lugar");
      guestColWidths.push({ width: 14 });
    }
  }

  guestHeaders.push("Contacto");
  guestColWidths.push({ width: 26 });

  if (hasDietary) {
    guestHeaders.push("Restrições Alimentares");
    guestColWidths.push({ width: 30 });
  }

  if (hasCheckIns) {
    guestHeaders.push("Check-in Registado");
    guestColWidths.push({ width: 20 });
  }

  wsGuests.columns = guestColWidths;

  const totalCols = guestHeaders.length;
  const lastColLetter = String.fromCharCode(64 + totalCols);

  // Header Title
  wsGuests.mergeCells(`A1:${lastColLetter}1`);
  const gTitle = wsGuests.getCell("A1");
  gTitle.value = `${resolvedBrand.toUpperCase()} · LISTA MESTRE DE CONVIDADOS — ${event.name.toUpperCase()}`;
  gTitle.font = { name: "Georgia", size: 12, bold: true, color: { argb: COLORS.HAXR_GOLD } };
  gTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HAXR_BLACK } };
  gTitle.alignment = { vertical: "middle", indent: 1 };
  wsGuests.getRow(1).height = 28;

  wsGuests.mergeCells(`A2:${lastColLetter}2`);
  const gSub = wsGuests.getCell("A2");
  gSub.value = `Total Convidados Principais: ${stats.primaryGuests} · Presença Prevista: ${stats.expectedAttendance} pessoas · Gerado em: ${formatGeneratedAtTimestamp(report.generatedAt)}`;
  gSub.font = { name: "Arial", size: 9, italic: true, color: { argb: COLORS.CHARCOAL } };
  gSub.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HAXR_IVORY } };
  gSub.alignment = { vertical: "middle", indent: 1 };
  wsGuests.getRow(2).height = 20;

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

  let guestRowIndex = 5;

  if (isZeroGuests) {
    const emptyRow = wsGuests.getRow(5);
    wsGuests.mergeCells(`A5:${lastColLetter}5`);
    const emptyCell = wsGuests.getCell("A5");
    emptyCell.value = "Nenhum convidado registado para este evento.";
    emptyCell.font = { name: "Arial", size: 9, italic: true, color: { argb: COLORS.MUTED_TEXT } };
    emptyCell.alignment = { horizontal: "center", vertical: "middle" };
    emptyRow.height = 28;
  } else {
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

      const rowValues: (string | number)[] = [i + 1, guest.name];

      if (hasEntityData) {
        rowValues.push(guest.groupName || "—");
      }

      rowValues.push(
        HUMAN_RSVP_LABELS[guest.status] || guest.status,
        companion.formattedLabel,
        guest.plusOnes > 0 ? `+${guest.plusOnes}` : 0,
        companion.totalPartySize
      );

      if (hasSeating) {
        rowValues.push(guest.seat?.tableName ? formatTableName(guest.seat.tableName) : "Por distribuir");
        if (readiness.shouldReportExactSeat) {
          rowValues.push(
            guest.seat
              ? `Lugar ${guest.seat.seatNumber}${guest.seat.label ? ` (${guest.seat.label})` : ""}`
              : "—"
          );
        }
      }

      rowValues.push(formatGuestContact(guest));

      if (hasDietary) {
        rowValues.push(guest.dietaryNotes || "—");
      }

      if (hasCheckIns) {
        rowValues.push(formatGuestCheckIn(guest.checkedInAt));
      }

      row.values = rowValues;

      const isEven = guestRowIndex % 2 === 0;
      const defaultBg = isEven ? COLORS.GRAY_LIGHT : COLORS.WHITE;

      row.eachCell((cell) => {
        cell.font = { name: "Arial", size: 8.5, color: { argb: COLORS.CHARCOAL } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: defaultBg } };
        cell.border = {
          bottom: { style: "thin", color: { argb: COLORS.GRAY_BORDER } },
        };
        cell.alignment = { vertical: "middle" };
      });

      row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };

      // Status cell
      const statusColIndex = hasEntityData ? 4 : 3;
      const statusCell = row.getCell(statusColIndex);
      statusCell.font = { name: "Arial", size: 8.5, bold: true, color: { argb: statusFg } };
      statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: statusBg } };
      statusCell.alignment = { horizontal: "center", vertical: "middle" };

      row.height = 20;
      guestRowIndex++;
    }

    wsGuests.autoFilter = `A4:${lastColLetter}${Math.max(5, guestRowIndex - 1)}`;
  }

  // ─────────────────────────────────────────────────────────────
  // 3. ABA: 03 — RSVP & Banquete (Apenas quando existem convidados)
  // ─────────────────────────────────────────────────────────────
  if (!isZeroGuests) {
    const wsRsvp = wb.addWorksheet("03 — RSVP & Banquete", {
      views: [{ state: "frozen", ySplit: 4, showGridLines: true }],
      properties: { tabColor: { argb: COLORS.HAXR_CHAMPAGNE } },
      pageSetup: {
        orientation: "portrait",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 },
      },
    });

    wsRsvp.columns = [
      { width: 6 },  // Nº
      { width: 32 }, // Convidado
      { width: 22 }, // Estado RSVP
      { width: 22 }, // Acompanhantes
      { width: 16 }, // Total Pessoas
      { width: 26 }, // Contacto
    ];

    wsRsvp.mergeCells("A1:F1");
    const rsvpTitle = wsRsvp.getCell("A1");
    rsvpTitle.value = `MAPA OPERACIONAL DE RSVP & BANQUETE — ${event.name.toUpperCase()}`;
    rsvpTitle.font = { name: "Georgia", size: 12, bold: true, color: { argb: COLORS.HAXR_GOLD } };
    rsvpTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HAXR_BLACK } };
    rsvpTitle.alignment = { vertical: "middle", indent: 1 };
    wsRsvp.getRow(1).height = 28;

    wsRsvp.mergeCells("A2:F2");
    const rsvpSub = wsRsvp.getCell("A2");
    rsvpSub.value = `Headcount Total de Banquete: ${stats.expectedAttendance} pessoas (${stats.confirmed} principais + ${stats.plusOnesTotal} acompanhantes)`;
    rsvpSub.font = { name: "Arial", size: 9, italic: true, color: { argb: COLORS.CHARCOAL } };
    rsvpSub.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HAXR_IVORY } };
    rsvpSub.alignment = { vertical: "middle", indent: 1 };
    wsRsvp.getRow(2).height = 20;

    const rsvpHeaders = [
      "Nº",
      "Convidado Principal",
      "Estado RSVP",
      "Acompanhantes",
      "Total Grupo / Couverts",
      "Contacto",
    ];

    const rHeadRow = wsRsvp.getRow(4);
    rHeadRow.values = rsvpHeaders;
    rHeadRow.height = 24;
    rHeadRow.eachCell((cell) => {
      cell.font = { name: "Arial", size: 9, bold: true, color: { argb: COLORS.WHITE } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.CHARCOAL } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = { bottom: { style: "medium", color: { argb: COLORS.HAXR_GOLD } } };
    });

    let rRowIdx = 5;
    for (let i = 0; i < guests.length; i++) {
      const guest = guests[i];
      const companion = resolveGuestCompanionInfo(guest);
      const row = wsRsvp.getRow(rRowIdx);

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
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rRowIdx % 2 === 0 ? COLORS.GRAY_LIGHT : COLORS.WHITE } };
        cell.border = { bottom: { style: "thin", color: { argb: COLORS.GRAY_BORDER } } };
        if (colNum === 1 || colNum === 3 || colNum === 5) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
        } else {
          cell.alignment = { vertical: "middle" };
        }
      });

      row.height = 20;
      rRowIdx++;
    }

    // Totals summary row
    const totRow = wsRsvp.getRow(rRowIdx);
    totRow.values = [
      "TOTAL",
      `${stats.primaryGuests} Convidados Principais`,
      `${stats.responseRate}% Respondido`,
      `+${stats.plusOnesTotal} Acompanhantes`,
      stats.expectedAttendance,
      "Presença Prevista Total",
    ];
    totRow.eachCell((cell) => {
      cell.font = { name: "Arial", size: 9, bold: true, color: { argb: COLORS.HAXR_BLACK } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HAXR_IVORY } };
      cell.border = {
        top: { style: "medium", color: { argb: COLORS.HAXR_GOLD } },
        bottom: { style: "medium", color: { argb: COLORS.HAXR_GOLD } },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });
    totRow.height = 22;

    wsRsvp.autoFilter = `A4:F${Math.max(5, rRowIdx - 1)}`;
  }

  // ─────────────────────────────────────────────────────────────
  // 4. ABA: 04 — Mapa de Mesas (Apenas quando configurado)
  // ─────────────────────────────────────────────────────────────
  if (hasSeating) {
    const wsSeats = wb.addWorksheet("04 — Mapa de Mesas", {
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
      unRow.values = [`POR DISTRIBUIR (${unassignedGuests.length})`, "", "", "", "", "", ""];
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
          "Por distribuir",
          "—",
          "—",
          uGuest.name,
          companion.formattedLabel,
          HUMAN_RSVP_LABELS[uGuest.status] || uGuest.status,
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
  }

  // ─────────────────────────────────────────────────────────────
  // 5. ABA: 05 — Cozinha & Alergias (Apenas quando existem restrições)
  // ─────────────────────────────────────────────────────────────
  if (hasDietary) {
    const wsDiet = wb.addWorksheet("05 — Cozinha & Alergias", {
      views: [{ state: "frozen", ySplit: 3, showGridLines: true }],
      properties: { tabColor: { argb: COLORS.RED_TEXT } },
      pageSetup: {
        orientation: "portrait",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
      },
    });

    wsDiet.columns = [
      { width: 6 },  // Nº
      { width: 32 }, // Convidado
      { width: 22 }, // Mesa
      { width: 36 }, // Restrição Alimentar / Alergia
      { width: 24 }, // Acompanhante(s)
      { width: 20 }, // Estado RSVP
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
      "Mesa",
      "Restrição Alimentar / Alergia",
      "Acompanhante(s)",
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

    let dietRowIdx = 4;
    for (let i = 0; i < dietaryGuests.length; i++) {
      const g = dietaryGuests[i];
      const companion = resolveGuestCompanionInfo(g);
      const row = wsDiet.getRow(dietRowIdx);

      row.values = [
        i + 1,
        g.name,
        g.seat?.tableName ? formatTableName(g.seat.tableName) : (hasSeating ? "Por distribuir" : "—"),
        g.dietaryNotes || "—",
        companion.formattedLabel,
        HUMAN_RSVP_LABELS[g.status] || g.status,
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

      const dietCell = row.getCell(4);
      dietCell.font = { name: "Arial", size: 8.5, bold: true, color: { argb: COLORS.RED_TEXT } };

      row.height = 20;
      dietRowIdx++;
    }

    wsDiet.autoFilter = `A3:F${Math.max(4, dietRowIdx - 1)}`;
  }

  // ─────────────────────────────────────────────────────────────
  // 6. ABA: 06 — Mensagens dos Convidados (Apenas quando existem)
  // ─────────────────────────────────────────────────────────────
  if (hasMessages) {
    const wsMsg = wb.addWorksheet("06 — Mensagens dos Convidados", {
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

  return wb;
}

/**
 * Gera o buffer binário (.xlsx) do livro de convidados para uso em servidor / testes.
 */
export async function buildGuestReportExcelBuffer(
  report: GuestEventReport,
  businessName?: string
): Promise<Buffer> {
  const wb = await buildOfficialGuestOperationsWorkbook(report, businessName);
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
  link.download = filename || sanitizeGuestWorkbookFilename(report.event.name, report.event.date, report.event.businessId);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
