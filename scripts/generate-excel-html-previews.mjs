import fs from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";

const excelDir = path.join(process.cwd(), ".qa-pdf-output", "guest-report");
const previewDir = path.join(excelDir, "excel-previews");
await fs.mkdir(previewDir, { recursive: true });

const files = [
  "01_guest_operations_no_seating.xlsx",
  "02_guest_operations_with_seating.xlsx",
  "03_guest_operations_dietary.xlsx",
  "04_rsvp_gifting_book.xlsx",
  "05_non_haxr_operations.xlsx",
];

function argbToHex(argb) {
  if (!argb) return null;
  if (argb.length === 8) {
    return `#${argb.slice(2)}`;
  }
  return `#${argb}`;
}

async function renderWorkbookToHtml(filename) {
  const filePath = path.join(excelDir, filename);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);

  const baseName = path.basename(filename, ".xlsx");
  const sheetSummaries = [];

  let html = `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <title>Excel Visual Inspection: ${filename}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; background: #EAE6DF; margin: 0; padding: 24px; }
    .sheet-card { background: white; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin-bottom: 32px; padding: 24px; overflow-x: auto; }
    h2 { font-family: Georgia, serif; color: #1C1A17; border-bottom: 2px solid #C9A227; padding-bottom: 8px; margin-top: 0; }
    .sheet-badge { display: inline-block; background: #C9A227; color: white; font-size: 11px; font-weight: bold; padding: 2px 8px; border-radius: 2px; margin-left: 8px; }
    table { border-collapse: collapse; width: 100%; font-size: 12px; margin-top: 12px; background: white; }
    th, td { border: 1px solid #D8CEBE; padding: 6px 10px; font-family: Arial, sans-serif; }
    .cell-bold { font-weight: bold; }
    .cell-italic { font-style: italic; }
  </style>
</head>
<body>
  <h1>Excel Visual Inspection: ${filename}</h1>
  <p>Workbook Creator: <strong>${wb.creator || "HAXR"}</strong> · Sheets: <strong>${wb.worksheets.length}</strong></p>
`;

  for (const ws of wb.worksheets) {
    sheetSummaries.push(ws.name);
    html += `  <div class="sheet-card" id="sheet-${ws.id}">\n`;
    html += `    <h2>Worksheet: ${ws.name} <span class="sheet-badge">Orientation: ${ws.pageSetup?.orientation || "portrait"}</span></h2>\n`;
    html += `    <table>\n`;

    ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      html += `      <tr style="height: ${row.height ? row.height * 1.3 : 24}px;">\n`;
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        let style = "";
        let classes = [];

        if (cell.fill?.type === "pattern" && cell.fill.fgColor?.argb) {
          const bg = argbToHex(cell.fill.fgColor.argb);
          if (bg) style += `background-color: ${bg}; `;
        }
        if (cell.font?.color?.argb) {
          const fg = argbToHex(cell.font.color.argb);
          if (fg) style += `color: ${fg}; `;
        }
        if (cell.font?.bold) classes.push("cell-bold");
        if (cell.font?.italic) classes.push("cell-italic");
        if (cell.font?.size) style += `font-size: ${Math.max(10, cell.font.size * 1.1)}px; `;
        if (cell.alignment?.horizontal) style += `text-align: ${cell.alignment.horizontal}; `;
        if (cell.alignment?.vertical) style += `vertical-align: ${cell.alignment.vertical}; `;

        const value = cell.value !== null && cell.value !== undefined ? String(cell.value) : "";
        html += `        <td class="${classes.join(" ")}" style="${style}">${value}</td>\n`;
      });
      html += `      </tr>\n`;
    });

    html += `    </table>\n  </div>\n`;
  }

  html += `</body>\n</html>`;

  const outHtmlPath = path.join(previewDir, `${baseName}.html`);
  await fs.writeFile(outHtmlPath, html, "utf-8");
  console.log(`Generated HTML Preview for ${filename} (${sheetSummaries.length} sheets: ${sheetSummaries.join(", ")})`);
}

for (const f of files) {
  await renderWorkbookToHtml(f);
}

console.log("\nAll Excel workbook HTML previews generated in " + previewDir);
