/**
 * Verifica catálogo de demos — URLs canónicas vs legadas.
 */
import { demoCatalog } from "../src/lib/demos/catalog.ts";

let failed = 0;

for (const demo of demoCatalog) {
  const issues = [];

  if (!demo.publicPath.startsWith("/experiencias/")) {
    issues.push("publicPath deve começar por /experiencias/");
  }
  if (!demo.embedUrl.startsWith("https://")) {
    issues.push("embedUrl inválida");
  }
  if (demo.legacyUrls.some((url) => url === demo.embedUrl)) {
    /* ok — legado documentado */
  }
  if (!demo.slug || demo.slug !== demo.id) {
    issues.push("slug deve coincidir com id");
  }

  if (issues.length) {
    failed++;
    console.log(`FAIL ${demo.id}: ${issues.join("; ")}`);
  } else {
    console.log(`OK  ${demo.id} → ${demo.publicPath}`);
  }
}

if (failed) process.exit(1);
console.log(`\n${demoCatalog.length} demos com URLs canónicas`);
