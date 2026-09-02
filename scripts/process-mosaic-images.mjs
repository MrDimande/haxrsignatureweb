import sharp from "sharp";
import fs from "fs";
import path from "path";

const uploadsDir = "C:/Users/Aldim/.gemini/antigravity-ide/brain/0d681d0e-baea-45bb-ba1f-9df4d500f63f/.user_uploaded";
const outputDir = "c:/project-x/haxrsignature/public/images/portfolio";

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function inspectAndProcess() {
  const images = {
    heroCasal: path.join(uploadsDir, "media_1787089884158.jpg"),
    salaoBranco: path.join(uploadsDir, "media_1787089924177.png"),
    conviteDark: path.join(uploadsDir, "media_1787089962455.png"),
    mesaDourada: path.join(uploadsDir, "media_1787090272370.jpg"),
    euEspio: path.join(uploadsDir, "media_1787090254159.png"),
  };

  for (const [key, filePath] of Object.entries(images)) {
    const meta = await sharp(filePath).metadata();
    console.log(`${key}: ${meta.width}x${meta.height}, format: ${meta.format}`);
  }

  // 1. HERO CASAL PAINEL BRANCO
  // Prioritize couple's framing, dress tail, floral backdrop with gentle contrast & sharpness
  await sharp(images.heroCasal)
    .modulate({ brightness: 1.02, saturation: 1.04 })
    .sharpen({ sigma: 1.0, m1: 0.8, m2: 1.2 })
    .jpeg({ quality: 92, progressive: true })
    .toFile(path.join(outputDir, "mosaic-casal-painel-branco.jpg"));

  await sharp(images.heroCasal)
    .modulate({ brightness: 1.02, saturation: 1.04 })
    .sharpen({ sigma: 1.0, m1: 0.8, m2: 1.2 })
    .webp({ quality: 92, effort: 6 })
    .toFile(path.join(outputDir, "mosaic-casal-painel-branco.webp"));

  // 2. SALAO BRANCO PREPARADO
  // Retouched wide ballroom with chandelier, stage and monogram floor
  await sharp(images.salaoBranco)
    .modulate({ brightness: 1.01, saturation: 1.03 })
    .sharpen({ sigma: 1.0, m1: 0.8, m2: 1.2 })
    .png({ compressionLevel: 8 })
    .toFile(path.join(outputDir, "mosaic-salao-branco-preparado.png"));

  await sharp(images.salaoBranco)
    .modulate({ brightness: 1.01, saturation: 1.03 })
    .sharpen({ sigma: 1.0, m1: 0.8, m2: 1.2 })
    .webp({ quality: 92, effort: 6 })
    .toFile(path.join(outputDir, "mosaic-salao-branco-preparado.webp"));

  // 3. CONVITE JESSICA & SAMUEL DARK
  // Dark digital invitation cover with names and button
  await sharp(images.conviteDark)
    .modulate({ brightness: 1.02, saturation: 1.04 })
    .sharpen({ sigma: 1.0, m1: 0.8, m2: 1.2 })
    .png({ compressionLevel: 8 })
    .toFile(path.join(outputDir, "mosaic-convite-jessica-samuel-dark.png"));

  await sharp(images.conviteDark)
    .modulate({ brightness: 1.02, saturation: 1.04 })
    .sharpen({ sigma: 1.0, m1: 0.8, m2: 1.2 })
    .webp({ quality: 92, effort: 6 })
    .toFile(path.join(outputDir, "mosaic-convite-jessica-samuel-dark.webp"));

  // 4. MESA DETALHE DOURADO
  // Reception table with gold chairs and orange napkins
  await sharp(images.mesaDourada)
    .modulate({ brightness: 1.02, saturation: 1.04 })
    .sharpen({ sigma: 1.0, m1: 0.8, m2: 1.2 })
    .png({ compressionLevel: 8 })
    .toFile(path.join(outputDir, "mosaic-mesa-detalhe-dourado.png"));

  await sharp(images.mesaDourada)
    .modulate({ brightness: 1.02, saturation: 1.04 })
    .sharpen({ sigma: 1.0, m1: 0.8, m2: 1.2 })
    .webp({ quality: 92, effort: 6 })
    .toFile(path.join(outputDir, "mosaic-mesa-detalhe-dourado.webp"));

  // 5. EU ESPIO QR CODE
  // Let's crop the right panel of the stationery so "Eu espio...", checklist, and QR Code are crystal clear
  const euEspioMeta = await sharp(images.euEspio).metadata();
  const width = euEspioMeta.width;
  const height = euEspioMeta.height;
  
  // The right panel is approx the rightmost 36% of the 3-fold card
  const panelWidth = Math.round(width * 0.36);
  const leftOffset = width - panelWidth;

  await sharp(images.euEspio)
    .extract({
      left: leftOffset,
      top: 0,
      width: panelWidth,
      height: height,
    })
    .modulate({ brightness: 1.01, saturation: 1.02 })
    .sharpen({ sigma: 1.0, m1: 0.8, m2: 1.2 })
    .jpeg({ quality: 94, progressive: true })
    .toFile(path.join(outputDir, "mosaic-eu-espio-qr.jpg"));

  await sharp(images.euEspio)
    .extract({
      left: leftOffset,
      top: 0,
      width: panelWidth,
      height: height,
    })
    .modulate({ brightness: 1.01, saturation: 1.02 })
    .sharpen({ sigma: 1.0, m1: 0.8, m2: 1.2 })
    .webp({ quality: 94, effort: 6 })
    .toFile(path.join(outputDir, "mosaic-eu-espio-qr.webp"));

  console.log("All 5 mosaic images successfully processed and exported!");
}

inspectAndProcess().catch(console.error);
