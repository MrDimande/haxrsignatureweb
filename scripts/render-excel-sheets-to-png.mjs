import fs from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";
import { createCanvas } from "@napi-rs/canvas";

const outputDir = path.join(process.cwd(), ".qa-pdf-output", "guest-report", "excel-pngs");
await fs.mkdir(outputDir, { recursive: true });

function parseArgbColor(colorObj) {
  if (!colorObj) return null;
  if (typeof colorObj === "string") {
    if (colorObj.startsWith("#")) return colorObj;
    if (colorObj.length === 8) return `#${colorObj.slice(2)}`;
    return `#${colorObj}`;
  }
  if (colorObj.argb) {
    const argb = colorObj.argb;
    if (argb.length === 8) {
      return `#${argb.slice(2)}`;
    }
    return `#${argb}`;
  }
  return null;
}

function renderSheetToCanvas(worksheet, sheetTitle) {
  const colWidths = [];
  const defaultColWidth = 12;
  const colCount = Math.max(worksheet.columnCount || 10, 8);
  const rowCount = Math.max(worksheet.rowCount || 20, 15);

  for (let c = 1; c <= colCount; c++) {
    const col = worksheet.getColumn(c);
    colWidths[c] = (col.width || defaultColWidth) * 9.0;
  }

  const rowHeights = [];
  const defaultRowHeight = 20;
  for (let r = 1; r <= rowCount; r++) {
    const row = worksheet.getRow(r);
    rowHeights[r] = (row.height || defaultRowHeight) * 1.5;
  }

  let totalWidth = 0;
  for (let c = 1; c <= colCount; c++) {
    totalWidth += colWidths[c];
  }
  totalWidth = Math.max(totalWidth + 40, 850);

  let totalHeight = 0;
  for (let r = 1; r <= rowCount; r++) {
    totalHeight += rowHeights[r];
  }
  totalHeight = Math.max(totalHeight + 80, 500);

  const canvas = createCanvas(totalWidth, totalHeight);
  const ctx = canvas.getContext("2d");

  // Fundo geral do Canvas (estilo Excel moderno/Dark-Ivory)
  ctx.fillStyle = "#F8FAFC";
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  // Tab Header Banner
  ctx.fillStyle = "#1E293B";
  ctx.fillRect(0, 0, totalWidth, 36);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText(`EXCEL WORKSHEET · ${worksheet.name.toUpperCase()}`, 16, 23);

  ctx.fillStyle = "#94A3B8";
  ctx.font = "11px sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`${colCount} Colunas · ${rowCount} Linhas`, totalWidth - 16, 23);
  ctx.textAlign = "left";

  const startY = 46;
  const startX = 20;

  // Renderiza Células
  let currentY = startY;
  for (let r = 1; r <= rowCount; r++) {
    const row = worksheet.getRow(r);
    const rh = rowHeights[r];
    let currentX = startX;

    for (let c = 1; c <= colCount; c++) {
      const cell = row.getCell(c);
      const cw = colWidths[c];

      // Se for célula escrava de merge, ignora para não duplicar renderização
      if (cell.isMerged && cell.master && cell.master !== cell) {
        currentX += cw;
        continue;
      }

      // Calcula dimensões reais se for master de um merge
      let renderWidth = cw;
      let renderHeight = rh;

      if (cell.isMerged && cell.master === cell) {
        // Encontra extensão do merge
        const masterRow = cell.row;
        const masterCol = cell.col;
        let endCol = masterCol;
        let endRow = masterRow;

        // Varre colunas à direita na mesma linha
        for (let nextC = masterCol + 1; nextC <= colCount; nextC++) {
          const nextCell = row.getCell(nextC);
          if (nextCell.isMerged && nextCell.master === cell) {
            endCol = nextC;
          } else {
            break;
          }
        }

        renderWidth = 0;
        for (let sc = masterCol; sc <= endCol; sc++) {
          renderWidth += colWidths[sc];
        }
      }

      // Fundo da célula
      let bg = "#FFFFFF";
      if (cell.fill && cell.fill.type === "pattern" && cell.fill.fgColor) {
        const parsedBg = parseArgbColor(cell.fill.fgColor);
        if (parsedBg) bg = parsedBg;
      }
      ctx.fillStyle = bg;
      ctx.fillRect(currentX, currentY, renderWidth, renderHeight);

      // Bordas
      if (cell.border) {
        ctx.lineWidth = 1;
        if (cell.border.top) {
          ctx.strokeStyle = parseArgbColor(cell.border.top.color) || "#E2E8F0";
          ctx.beginPath();
          ctx.moveTo(currentX, currentY);
          ctx.lineTo(currentX + renderWidth, currentY);
          ctx.stroke();
        }
        if (cell.border.bottom) {
          ctx.strokeStyle = parseArgbColor(cell.border.bottom.color) || "#E2E8F0";
          ctx.beginPath();
          ctx.moveTo(currentX, currentY + renderHeight);
          ctx.lineTo(currentX + renderWidth, currentY + renderHeight);
          ctx.stroke();
        }
        if (cell.border.left) {
          ctx.strokeStyle = parseArgbColor(cell.border.left.color) || "#E2E8F0";
          ctx.beginPath();
          ctx.moveTo(currentX, currentY);
          ctx.lineTo(currentX, currentY + renderHeight);
          ctx.stroke();
        }
        if (cell.border.right) {
          ctx.strokeStyle = parseArgbColor(cell.border.right.color) || "#E2E8F0";
          ctx.beginPath();
          ctx.moveTo(currentX + renderWidth, currentY);
          ctx.lineTo(currentX + renderWidth, currentY + renderHeight);
          ctx.stroke();
        }
      } else {
        // Gridline suave padrão
        ctx.strokeStyle = "#F1F5F9";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(currentX, currentY, renderWidth, renderHeight);
      }

      // Conteúdo / Texto da célula
      let text = "";
      if (cell.value !== null && cell.value !== undefined) {
        if (typeof cell.value === "object") {
          if (cell.value.richText) {
            text = cell.value.richText.map((t) => t.text).join("");
          } else if (cell.value.result !== undefined) {
            text = String(cell.value.result);
          } else if (cell.value.text) {
            text = cell.value.text;
          } else {
            text = String(cell.value);
          }
        } else {
          text = String(cell.value);
        }
      }

      if (text.trim().length > 0) {
        let textColor = "#0F172A";
        let fontSize = 10;
        let isBold = false;
        let isItalic = false;
        let fontFamily = "sans-serif";

        if (cell.font) {
          if (cell.font.color) {
            textColor = parseArgbColor(cell.font.color) || textColor;
          }
          if (cell.font.size) {
            fontSize = Math.max(Math.round(cell.font.size * 0.95), 8);
          }
          if (cell.font.bold) isBold = true;
          if (cell.font.italic) isItalic = true;
          if (cell.font.name) {
            fontFamily = cell.font.name.includes("Times") || cell.font.name.includes("Georgia") ? "serif" : "sans-serif";
          }
        }

        ctx.fillStyle = textColor;
        ctx.font = `${isItalic ? "italic " : ""}${isBold ? "bold " : ""}${fontSize}px ${fontFamily}`;

        let align = "left";
        let textX = currentX + 6;
        if (cell.alignment && cell.alignment.horizontal) {
          align = cell.alignment.horizontal;
          if (align === "center") {
            textX = currentX + renderWidth / 2;
          } else if (align === "right") {
            textX = currentX + renderWidth - 6;
          }
        }
        ctx.textAlign = align;

        // Vertical Alignment
        const textY = currentY + renderHeight / 2 + fontSize / 3;

        // Clip text inside cell
        ctx.save();
        ctx.beginPath();
        ctx.rect(currentX + 2, currentY + 1, renderWidth - 4, renderHeight - 2);
        ctx.clip();
        ctx.fillText(text, textX, textY);
        ctx.restore();
      }

      currentX += cw;
    }
    currentY += rh;
  }

  return canvas.toBuffer("image/png");
}

const workbooksToRender = [
  {
    file: ".qa-pdf-output/guest-report/01_guest_operations_no_seating.xlsx",
    prefix: "excel_01_no_seating",
    sheets: [
      { name: "01 — Resumo Executivo", key: "01_executive_summary" },
      { name: "02 — Lista de Convidados", key: "02_guest_master" },
      { name: "03 — RSVP & Banquete", key: "03_rsvp_banquet" },
    ],
  },
  {
    file: ".qa-pdf-output/guest-report/02_guest_operations_with_seating.xlsx",
    prefix: "excel_02_seating",
    sheets: [
      { name: "04 — Mapa de Mesas", key: "04_seating_architecture" },
    ],
  },
  {
    file: ".qa-pdf-output/guest-report/03_guest_operations_dietary.xlsx",
    prefix: "excel_03_dietary",
    sheets: [
      { name: "05 — Cozinha & Alergias", key: "05_kitchen_dietary" },
      { name: "06 — Mensagens dos Convidados", key: "06_guest_messages" },
    ],
  },
  {
    file: ".qa-pdf-output/guest-report/04_rsvp_gifting_book.xlsx",
    prefix: "excel_04_gifting",
    sheets: [
      { name: "01 — Resumo Executivo", key: "01_gifting_executive_summary" },
      { name: "02 — Lista RSVP", key: "02_rsvp_master" },
      { name: "03 — Dimensão de Grupos", key: "03_party_size" },
      { name: "04 — Registo de Presentes", key: "04_gift_registry" },
      { name: "05 — Mensagens & Votos", key: "05_gift_messages" },
    ],
  },
  {
    file: ".qa-pdf-output/guest-report/05_non_haxr_operations.xlsx",
    prefix: "excel_05_brainywrite",
    sheets: [
      { name: "01 — Resumo Executivo", key: "01_brainywrite_executive_summary" },
    ],
  },
];

console.log("Rendering Excel worksheets to high-res PNG images...");

for (const wbInfo of workbooksToRender) {
  const wbPath = path.join(process.cwd(), wbInfo.file);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(wbPath);

  for (const sheetTarget of wbInfo.sheets) {
    const ws = wb.getWorksheet(sheetTarget.name);
    if (!ws) {
      console.warn(`Worksheet ${sheetTarget.name} not found in ${wbInfo.file}`);
      continue;
    }

    const pngBuffer = renderSheetToCanvas(ws, sheetTarget.name);
    const outFilename = `${wbInfo.prefix}_${sheetTarget.key}.png`;
    const outPath = path.join(outputDir, outFilename);
    await fs.writeFile(outPath, pngBuffer);

    console.log(`  -> Saved ${outFilename} (${pngBuffer.length} bytes)`);
  }
}

console.log("\nAll requested Excel worksheet PNGs rendered successfully!");
