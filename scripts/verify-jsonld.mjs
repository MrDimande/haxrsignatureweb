/**
 * Valida JSON-LD de todas as páginas de marketing.
 */
import { marketingPagesSeo } from "../src/lib/marketing/seo.ts";
import { demoCatalog } from "../src/lib/demos/catalog.ts";
import {
  buildPageStructuredData,
  buildDemoStructuredData,
} from "../src/lib/seo/jsonld.ts";

const keys = Object.keys(marketingPagesSeo);
let failed = 0;

for (const key of keys) {
  try {
    const schemas = buildPageStructuredData(key);
    if (!schemas.length) throw new Error("sem schemas");
    for (const schema of schemas) {
      JSON.stringify(schema);
      if (!schema["@type"] && !schema["@context"]) {
        throw new Error("schema sem @type");
      }
    }
    console.log(`OK  ${key} (${schemas.length} blocos)`);
  } catch (error) {
    failed++;
    console.log(`FAIL ${key}: ${error instanceof Error ? error.message : error}`);
  }
}

if (failed) process.exit(1);
console.log(`\n${keys.length} páginas com JSON-LD válido`);

for (const demo of demoCatalog) {
  const schemas = buildDemoStructuredData(demo.slug);
  if (!schemas.length) {
    console.log(`FAIL demo ${demo.slug}: sem schemas`);
    process.exit(1);
  }
  console.log(`OK  demo ${demo.slug} (${schemas.length} blocos)`);
}
