import sharp from "sharp";
import fs from "fs";
import path from "path";

const inputPath = "C:/Users/Aldim/.gemini/antigravity-ide/brain/0d681d0e-baea-45bb-ba1f-9df4d500f63f/.user_uploaded/media_1787088223109.jpg";
const outputWebp = "c:/project-x/haxrsignature/public/images/casamento-vania-fabiao-evelyn-eventos.webp";
const outputJpg = "c:/project-x/haxrsignature/public/images/casamento-vania-fabiao-evelyn-eventos.jpg";

async function processImage() {
  const metadata = await sharp(inputPath).metadata();
  console.log("Original metadata:", metadata);

  // Process with professional color grading, contrast, gentle clarity and crispness:
  // - Modulate: slight brightness boost (1.02), saturation enhancement (1.04)
  // - Normalize / linear tone curve
  // - Gentle sharpen (sigma: 1.0, flat: 1.0, jagged: 1.5)
  // - Premium WebP encoding (quality 92, lossless: false, effort 6)
  
  await sharp(inputPath)
    .modulate({
      brightness: 1.02,
      saturation: 1.05,
    })
    .sharpen({
      sigma: 1.1,
      m1: 1.0,
      m2: 1.5,
    })
    .webp({ quality: 92, effort: 6 })
    .toFile(outputWebp);

  await sharp(inputPath)
    .modulate({
      brightness: 1.02,
      saturation: 1.05,
    })
    .sharpen({
      sigma: 1.1,
      m1: 1.0,
      m2: 1.5,
    })
    .jpeg({ quality: 92, progressive: true })
    .toFile(outputJpg);

  console.log("Successfully generated:", outputWebp, outputJpg);
}

processImage().catch(console.error);
