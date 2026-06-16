import QRCode from "qrcode";
import {
  buildFontCss,
  getQrPixelSize,
  QR_TITLE_FONTS,
  type QrEditorialMeta,
  type QrFrameStyle,
  type QrModuleStyle,
  type QrStyleOptions,
  type QrTitleFont,
} from "@/lib/events/qr-styles";

const LOADED_FONTS = new Set<string>();

async function ensureFontLoaded(fontKey: QrTitleFont): Promise<void> {
  if (LOADED_FONTS.has(fontKey)) return;
  const font = QR_TITLE_FONTS[fontKey];
  const style = font.style ?? "normal";
  const weight = font.weight ?? "400";
  const family = font.family.split(",")[0]?.replace(/"/g, "").trim() ?? fontKey;
  try {
    await document.fonts.load(`${style} ${weight} 48px ${family}`);
    LOADED_FONTS.add(fontKey);
  } catch {
    await document.fonts.ready;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Não foi possível carregar: ${src}`));
    img.src = src;
  });
}

function drawModule(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  style: QrModuleStyle,
  color: string
) {
  ctx.fillStyle = color;
  if (style === "dots") {
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size * 0.42, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (style === "rounded") {
    const radius = size * 0.28;
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, radius);
    ctx.fill();
    return;
  }
  ctx.fillRect(x, y, size, size);
}

function drawQrMatrix(
  ctx: CanvasRenderingContext2D,
  url: string,
  options: QrStyleOptions,
  area: number,
  offsetX: number,
  offsetY: number
): void {
  const useCenter = options.centerMark !== "none";
  const errorCorrectionLevel = useCenter ? "H" : "M";
  const qr = QRCode.create(url, { errorCorrectionLevel });
  const modules = qr.modules;
  const count = modules.size;
  const margin = options.margin;
  const cell = area / (count + margin * 2);

  ctx.fillStyle = options.background;
  ctx.fillRect(offsetX, offsetY, area, area);

  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (!modules.get(row, col)) continue;
      const x = offsetX + (col + margin) * cell;
      const y = offsetY + (row + margin) * cell;
      drawModule(ctx, x, y, cell * 0.92, options.moduleStyle, options.foreground);
    }
  }
}

async function drawQrCore(
  ctx: CanvasRenderingContext2D,
  url: string,
  options: QrStyleOptions,
  area: number,
  offsetX: number,
  offsetY: number
): Promise<void> {
  if (options.moduleStyle === "square") {
    const useCenter = options.centerMark !== "none";
    const offscreen = document.createElement("canvas");
    await QRCode.toCanvas(offscreen, url, {
      width: area,
      margin: options.margin,
      errorCorrectionLevel: useCenter ? "H" : "M",
      color: {
        dark: options.foreground,
        light: options.background,
      },
    });
    ctx.drawImage(offscreen, offsetX, offsetY, area, area);
  } else {
    drawQrMatrix(ctx, url, options, area, offsetX, offsetY);
  }

  const useCenter = options.centerMark !== "none";
  if (!useCenter) return;

  const markSize = Math.round(area * 0.19);
  const pad = Math.round(markSize * 0.14);
  const centerX = offsetX + area / 2;
  const centerY = offsetY + area / 2;
  const box = markSize + pad * 2;
  const x = centerX - box / 2;
  const y = centerY - box / 2;

  ctx.fillStyle = options.background;
  ctx.beginPath();
  ctx.roundRect(x, y, box, box, Math.round(box * 0.1));
  ctx.fill();

  ctx.strokeStyle = options.accent;
  ctx.lineWidth = Math.max(1, Math.round(area * 0.003));
  ctx.stroke();

  ctx.strokeStyle = `${options.foreground}18`;
  ctx.lineWidth = Math.max(1, Math.round(area * 0.0015));
  ctx.beginPath();
  ctx.roundRect(x + 3, y + 3, box - 6, box - 6, Math.round(box * 0.08));
  ctx.stroke();

  if (options.centerMark === "monogram") {
    const text = options.monogramText.trim() || "HXR";
    ctx.fillStyle = options.foreground;
    ctx.font = buildFontCss("great-vibes", Math.round(markSize * 0.42));
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, centerX, centerY + 1);
  } else {
    try {
      const img = await loadImage(options.logoSrc);
      const inset = pad + Math.round(markSize * 0.08);
      const drawSize = box - inset * 2;
      ctx.drawImage(img, x + inset, y + inset, drawSize, drawSize);
    } catch {
      ctx.fillStyle = options.foreground;
      ctx.font = buildFontCss("cormorant", Math.round(markSize * 0.34));
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("HXR", centerX, centerY);
    }
  }
}

function drawGoldRule(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  accent: string
) {
  const grad = ctx.createLinearGradient(x, y, x + width, y);
  grad.addColorStop(0, "transparent");
  grad.addColorStop(0.2, accent);
  grad.addColorStop(0.5, accent);
  grad.addColorStop(0.8, accent);
  grad.addColorStop(1, "transparent");
  ctx.strokeStyle = grad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y);
  ctx.stroke();
}

function drawCornerOrnament(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  flipX: boolean,
  flipY: boolean,
  color: string
) {
  const sx = flipX ? -1 : 1;
  const sy = flipY ? -1 : 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sx, sy);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, size);
  ctx.lineTo(0, 0);
  ctx.lineTo(size, 0);
  ctx.stroke();
  ctx.restore();
}

function drawEditorialFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: QrStyleOptions,
  frameStyle: QrFrameStyle
) {
  ctx.fillStyle = options.background;
  ctx.fillRect(0, 0, width, height);

  const inset = Math.round(width * 0.06);
  ctx.strokeStyle = `${options.accent}55`;
  ctx.lineWidth = 1;
  ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2);

  if (frameStyle === "invitation" || frameStyle === "wedding") {
    const inner = inset + Math.round(width * 0.025);
    ctx.strokeStyle = `${options.foreground}12`;
    ctx.strokeRect(inner, inner, width - inner * 2, height - inner * 2);
  }

  if (frameStyle === "gala" || frameStyle === "wedding") {
    const corner = Math.round(width * 0.05);
    const corners = [
      [inset, inset, false, false],
      [width - inset, inset, true, false],
      [inset, height - inset, false, true],
      [width - inset, height - inset, true, true],
    ] as const;
    for (const [x, y, flipX, flipY] of corners) {
      drawCornerOrnament(
        ctx,
        x,
        y,
        corner,
        flipX,
        flipY,
        `${options.accent}88`
      );
    }
  }
}

export async function generateStyledQrDataUrl(
  url: string,
  options: QrStyleOptions,
  meta?: QrEditorialMeta
): Promise<string> {
  await Promise.all([
    ensureFontLoaded(options.titleFont),
    ensureFontLoaded(options.captionFont),
    ensureFontLoaded("great-vibes"),
  ]);

  const baseSize = getQrPixelSize(options.size);
  const framed = options.frameStyle !== "minimal" && meta?.eventName;

  if (!framed) {
    const canvas = document.createElement("canvas");
    canvas.width = baseSize;
    canvas.height = baseSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas não suportado.");
    await drawQrCore(ctx, url, options, baseSize, 0, 0);
    return canvas.toDataURL("image/png");
  }

  const canvasW = baseSize;
  const canvasH = Math.round(baseSize * 1.38);
  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas não suportado.");

  drawEditorialFrame(ctx, canvasW, canvasH, options, options.frameStyle);

  const brand = meta.brandName ?? "HAXR Signature";
  const topPad = Math.round(canvasH * 0.09);

  ctx.fillStyle = `${options.foreground}88`;
  ctx.font = `500 ${Math.round(canvasW * 0.022)}px ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(brand.toUpperCase(), canvasW / 2, topPad);

  const ruleY = topPad + Math.round(canvasH * 0.055);
  drawGoldRule(ctx, canvasW * 0.22, ruleY, canvasW * 0.56, options.accent);

  ctx.fillStyle = options.foreground;
  ctx.font = buildFontCss(options.titleFont, Math.round(canvasW * 0.052));
  ctx.textAlign = "center";
  const eventLines = wrapText(ctx, meta.eventName, canvasW * 0.78);
  let titleY = ruleY + Math.round(canvasH * 0.05);
  for (const line of eventLines) {
    ctx.fillText(line, canvasW / 2, titleY);
    titleY += Math.round(canvasW * 0.058);
  }

  const qrArea = Math.round(canvasW * 0.58);
  const qrX = (canvasW - qrArea) / 2;
  const qrY = titleY + Math.round(canvasH * 0.04);
  await drawQrCore(ctx, url, options, qrArea, qrX, qrY);

  const captionY = qrY + qrArea + Math.round(canvasH * 0.045);
  drawGoldRule(ctx, canvasW * 0.3, captionY, canvasW * 0.4, options.accent);

  ctx.fillStyle = options.foreground;
  ctx.font = buildFontCss(options.captionFont, Math.round(canvasW * 0.036));
  ctx.fillText("Find Your Seat", canvasW / 2, captionY + Math.round(canvasH * 0.035));

  ctx.fillStyle = `${options.foreground}55`;
  ctx.font = `400 ${Math.round(canvasW * 0.018)}px ui-monospace, monospace`;
  ctx.fillText(
    "DIGITALIZE · PESQUISE O SEU NOME",
    canvasW / 2,
    captionY + Math.round(canvasH * 0.09)
  );

  return canvas.toDataURL("image/png");
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}
