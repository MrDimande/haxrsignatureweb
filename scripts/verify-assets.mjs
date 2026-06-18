/**
 * Verifica assets estáticos referenciados no código.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "public");
const SRC = join(ROOT, "src");

const files = [
  join(SRC, "lib", "assets.ts"),
  join(SRC, "lib", "site-config.ts"),
  join(SRC, "lib", "marketing", "editorial.ts"),
  join(SRC, "lib", "seo.ts"),
  join(SRC, "lib", "admin", "businesses.ts"),
  join(SRC, "lib", "events", "qr-styles.ts"),
  join(SRC, "components", "ui", "BrandLogo.tsx"),
  join(ROOT, "public", "site.webmanifest"),
];

const paths = new Set();
const pattern = /["'](\/(?:images|fonts|favicon|apple-touch-icon)[^"']+)["']/g;

for (const file of files) {
  const text = readFileSync(file, "utf8");
  for (const match of text.matchAll(pattern)) {
    paths.add(match[1]);
  }
}

const missing = [];
for (const assetPath of [...paths].sort()) {
  const disk = join(PUBLIC, assetPath.replace(/^\//, "").replace(/\//g, "\\"));
  const alt = join(PUBLIC, assetPath.slice(1));
  if (!existsSync(disk) && !existsSync(alt)) {
    missing.push(assetPath);
  }
}

console.log(`Assets referenciados: ${paths.size}`);
if (missing.length) {
  console.log("\nEM FALTA:");
  for (const p of missing) console.log(`  • ${p}`);
  process.exit(1);
}

console.log("OK — todos os assets existem em public/");
