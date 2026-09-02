import sharp from "sharp";
import path from "path";

const uploadsDir = "C:/Users/Aldim/.gemini/antigravity-ide/brain/0d681d0e-baea-45bb-ba1f-9df4d500f63f/.user_uploaded";
const outputDir = "c:/project-x/haxrsignature/public/images/portfolio";
const euEspioSrc = path.join(uploadsDir, "media_1787090254159.png");

async function refineEuEspio() {
  const meta = await sharp(euEspioSrc).metadata();
  console.log("Original width:", meta.width, "height:", meta.height);
  
  // The dotted vertical line is around x = 698
  // Let's crop from x = 705 to width = meta.width - 705
  const left = 705;
  const width = meta.width - left;
  const height = meta.height;

  await sharp(euEspioSrc)
    .extract({
      left,
      top: 0,
      width,
      height,
    })
    .modulate({ brightness: 1.01, saturation: 1.02 })
    .sharpen({ sigma: 1.0, m1: 0.8, m2: 1.2 })
    .jpeg({ quality: 94, progressive: true })
    .toFile(path.join(outputDir, "mosaic-eu-espio-qr.jpg"));

  await sharp(euEspioSrc)
    .extract({
      left,
      top: 0,
      width,
      height,
    })
    .modulate({ brightness: 1.01, saturation: 1.02 })
    .sharpen({ sigma: 1.0, m1: 0.8, m2: 1.2 })
    .webp({ quality: 94, effort: 6 })
    .toFile(path.join(outputDir, "mosaic-eu-espio-qr.webp"));

  console.log("Refined euEspio crop generated from left:", left, "width:", width);
}

refineEuEspio().catch(console.error);
