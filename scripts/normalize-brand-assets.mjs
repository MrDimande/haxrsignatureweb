import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const userUploadedDir =
  "C:/Users/Aldim/.gemini/antigravity-ide/brain/71e693ed-d6c3-4ac2-aa8e-cf26199ca513/.user_uploaded";
const bwSvgMaster = "C:/project-x/brainywrite/public/BW Logo.svg";
const outputDir = path.join(process.cwd(), "public/images/brand");

/**
 * Extracts visible bounding box of artwork.
 * For transparent images, checks alpha > 20.
 * For white-background images, calculates matte alpha = 255 - luminance.
 */
async function getArtworkBoundingBox(imageBuffer, isWhiteBg = false) {
  const { data, info } = await sharp(imageBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  let minX = info.width,
    maxX = 0,
    minY = info.height,
    maxY = 0;

  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = (y * info.width + x) * info.channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = info.channels === 4 ? data[idx + 3] : 255;

      let isPixel = false;
      if (isWhiteBg) {
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const calculatedAlpha = 255 - lum;
        if (calculatedAlpha > 20) {
          isPixel = true;
        }
      } else {
        if (a > 20) {
          isPixel = true;
        }
      }

      if (isPixel) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  return {
    left: Math.max(0, minX),
    top: Math.max(0, minY),
    width: Math.max(1, Math.min(info.width - minX, maxX - minX + 1)),
    height: Math.max(1, Math.min(info.height - minY, maxY - minY + 1)),
  };
}

/**
 * Matte extraction from opaque white background for horizontal dark logo.
 * Alpha = 255 - luminance.
 * RGB set to rich dark obsidian (18, 16, 14) for clean edges without white halo or anti-aliasing damage.
 */
async function extractDarkLogoWithAlpha(sourcePath) {
  const { data, info } = await sharp(sourcePath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const outData = Buffer.alloc(info.width * info.height * 4);

  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const srcIdx = (y * info.width + x) * info.channels;
      const outIdx = (y * info.width + x) * 4;

      const r = data[srcIdx];
      const g = data[srcIdx + 1];
      const b = data[srcIdx + 2];

      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      let a = 255 - lum;
      if (a < 3) a = 0;
      else if (a > 250) a = 255;

      outData[outIdx] = 18; // R (Dark obsidian)
      outData[outIdx + 1] = 16; // G
      outData[outIdx + 2] = 14; // B
      outData[outIdx + 3] = Math.round(a);
    }
  }

  return sharp(outData, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

/**
 * Creates dark variant from transparent master (mask) with identical anti-aliasing alpha
 */
async function createDarkVariantFromMask(sourceBuffer) {
  const { data, info } = await sharp(sourceBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const outData = Buffer.alloc(info.width * info.height * 4);

  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = (y * info.width + x) * 4;
      const a = data[idx + 3];

      outData[idx] = 18; // Rich dark obsidian
      outData[idx + 1] = 16;
      outData[idx + 2] = 14;
      outData[idx + 3] = a;
    }
  }

  return sharp(outData, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

/**
 * Normalizes horizontal logo artwork to standardized 1200 x 380 canvas.
 * Sets target artwork width to 900px for equivalent optical visual size,
 * ensuring consistent horizontal footprint across all horizontal variants while preserving aspect ratio.
 */
async function normalizeHorizontalLogo(croppedBuffer) {
  const canvasWidth = 1200;
  const canvasHeight = 380;
  const targetArtworkWidth = 900;

  const croppedMeta = await sharp(croppedBuffer).metadata();
  const scale = targetArtworkWidth / croppedMeta.width;
  const scaledWidth = targetArtworkWidth;
  const scaledHeight = Math.round(croppedMeta.height * scale);

  const resizedArtwork = await sharp(croppedBuffer)
    .resize(scaledWidth, scaledHeight, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  const left = Math.round((canvasWidth - scaledWidth) / 2);
  const top = Math.round((canvasHeight - scaledHeight) / 2);

  return sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resizedArtwork, left, top }])
    .png()
    .toBuffer();
}

/**
 * Normalizes vertical logo artwork to standardized 800 x 700 canvas.
 * Sets target artwork height to 560px for consistent vertical footprint and controlled safe margin.
 */
async function normalizeVerticalLogo(croppedBuffer) {
  const canvasWidth = 800;
  const canvasHeight = 700;
  const targetArtworkHeight = 560;

  const croppedMeta = await sharp(croppedBuffer).metadata();
  const scale = targetArtworkHeight / croppedMeta.height;
  const scaledWidth = Math.round(croppedMeta.width * scale);
  const scaledHeight = targetArtworkHeight;

  const resizedArtwork = await sharp(croppedBuffer)
    .resize(scaledWidth, scaledHeight, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  const left = Math.round((canvasWidth - scaledWidth) / 2);
  const top = Math.round((canvasHeight - scaledHeight) / 2);

  return sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resizedArtwork, left, top }])
    .png()
    .toBuffer();
}

async function runNormalization() {
  console.log("Starting canonical brand asset normalization...");
  await fs.mkdir(outputDir, { recursive: true });

  // 1. Horizontal Gold Logo (media_1787256518714.png)
  const hGoldRaw = await fs.readFile(path.join(userUploadedDir, "media_1787256518714.png"));
  const hGoldBbox = await getArtworkBoundingBox(hGoldRaw, false);
  const hGoldCropped = await sharp(hGoldRaw).extract(hGoldBbox).toBuffer();
  const hGoldNormalized = await normalizeHorizontalLogo(hGoldCropped);
  await fs.writeFile(path.join(outputDir, "haxr-horizontal-gold.png"), hGoldNormalized);
  console.log("✓ Created public/images/brand/haxr-horizontal-gold.png");

  // 2. Horizontal Dark Logo (media_1787256518494.png - matte extraction from opaque white background)
  const hDarkAlphaRaw = await extractDarkLogoWithAlpha(
    path.join(userUploadedDir, "media_1787256518494.png")
  );
  const hDarkBbox = await getArtworkBoundingBox(hDarkAlphaRaw, false);
  const hDarkCropped = await sharp(hDarkAlphaRaw).extract(hDarkBbox).toBuffer();
  const hDarkNormalized = await normalizeHorizontalLogo(hDarkCropped);
  await fs.writeFile(path.join(outputDir, "haxr-horizontal-dark.png"), hDarkNormalized);
  console.log("✓ Created public/images/brand/haxr-horizontal-dark.png");

  // 3. Horizontal White Logo (media_1787256518656.png)
  const hWhiteRaw = await fs.readFile(path.join(userUploadedDir, "media_1787256518656.png"));
  const hWhiteBbox = await getArtworkBoundingBox(hWhiteRaw, false);
  const hWhiteCropped = await sharp(hWhiteRaw).extract(hWhiteBbox).toBuffer();
  const hWhiteNormalized = await normalizeHorizontalLogo(hWhiteCropped);
  await fs.writeFile(path.join(outputDir, "haxr-horizontal-white.png"), hWhiteNormalized);
  console.log("✓ Created public/images/brand/haxr-horizontal-white.png");

  // 4. Vertical Gold Logo (media_1787256518793.png)
  const vGoldRaw = await fs.readFile(path.join(userUploadedDir, "media_1787256518793.png"));
  const vGoldBbox = await getArtworkBoundingBox(vGoldRaw, false);
  const vGoldCropped = await sharp(vGoldRaw).extract(vGoldBbox).toBuffer();
  const vGoldNormalized = await normalizeVerticalLogo(vGoldCropped);
  await fs.writeFile(path.join(outputDir, "haxr-vertical-gold.png"), vGoldNormalized);
  console.log("✓ Created public/images/brand/haxr-vertical-gold.png");

  // 5. Vertical Dark Logo (derived from vertical master with exact dark obsidian tone)
  const vDarkRaw = await createDarkVariantFromMask(vGoldCropped);
  const vDarkNormalized = await normalizeVerticalLogo(vDarkRaw);
  await fs.writeFile(path.join(outputDir, "haxr-vertical-dark.png"), vDarkNormalized);
  console.log("✓ Created public/images/brand/haxr-vertical-dark.png");

  // 6. Vertical White Logo (media_1787256518841.png)
  const vWhiteRaw = await fs.readFile(path.join(userUploadedDir, "media_1787256518841.png"));
  const vWhiteBbox = await getArtworkBoundingBox(vWhiteRaw, false);
  const vWhiteCropped = await sharp(vWhiteRaw).extract(vWhiteBbox).toBuffer();
  const vWhiteNormalized = await normalizeVerticalLogo(vWhiteCropped);
  await fs.writeFile(path.join(outputDir, "haxr-vertical-white.png"), vWhiteNormalized);
  console.log("✓ Created public/images/brand/haxr-vertical-white.png");

  // 7. BrainyWrite: Vector master SVG to transparent normalized PNG (1000 x 550)
  const bwBuf = await fs.readFile(bwSvgMaster);
  const bwPngHighRes = await sharp(bwBuf).png().toBuffer();
  const bwBbox = await getArtworkBoundingBox(bwPngHighRes, false);
  const bwCropped = await sharp(bwPngHighRes).extract(bwBbox).toBuffer();

  const bwMeta = await sharp(bwCropped).metadata();
  const bTargetW = 750;
  const bScale = bTargetW / bwMeta.width;
  const bScaledW = bTargetW;
  const bScaledH = Math.round(bwMeta.height * bScale);

  const bResized = await sharp(bwCropped)
    .resize(bScaledW, bScaledH, { fit: "contain" })
    .toBuffer();

  const bCanvasW = 1000;
  const bCanvasH = 550;
  const bLeft = Math.round((bCanvasW - bScaledW) / 2);
  const bTop = Math.round((bCanvasH - bScaledH) / 2);

  const brainyNormalized = await sharp({
    create: {
      width: bCanvasW,
      height: bCanvasH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: bResized, left: bLeft, top: bTop }])
    .png()
    .toBuffer();

  await fs.writeFile(path.join(outputDir, "brainywrite-logo.png"), brainyNormalized);
  console.log("✓ Created public/images/brand/brainywrite-logo.png (transparent normalized)");

  console.log("Brand asset normalization completed successfully!");
}

runNormalization().catch(console.error);
