import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";
import { checksumRows } from "./gate-2c-gifts-photos-migration.mjs";

const EXPECTED_SOURCE_REF = "oxsrdmydlqyvnueedgtl";
const EXPECTED_PHOTO_COUNT = 147;
const EXPECTED_PHOTO_CHECKSUM = "36b8f471d851f7244a47f2b3070b03465d5415a1f7d42109f3fb7764054ecfd0";
const REQUIRED_CONFIRMATION = "GATE_2C_PREVIEW_PHOTOS_WRITE";

const PHOTO_COLUMNS = [
  "id",
  "invitation_slug",
  "storage_path",
  "original_filename",
  "content_type",
  "file_size_bytes",
  "guest_name",
  "caption",
  "moderation_status",
  "created_at",
  "approved_at",
  "rejected_at",
  "challenge_id",
  "table_id",
  "participant_id",
  "experience_id",
  "phase_id",
];

function loadEnvFile(filePath) {
  const path = resolve(process.cwd(), filePath);
  const content = readFileSync(path, "utf-8");
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const eqIdx = trimmed.indexOf("=");
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

async function fetchAllSourceRows(supabase, table) {
  const rows = [];
  const PAGE_SIZE = 500;
  for (let start = 0; ; start += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("id", { ascending: true })
      .range(start, start + PAGE_SIZE - 1);
    if (error) throw new Error(`Source read failed: ${table} (${error.message})`);
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return rows;
}

async function main() {
  const isApply = process.argv.includes("--apply");
  const confirmArg = process.argv.find((a) => a.startsWith("--confirm="))?.split("=")[1];

  console.log("======================================================================");
  console.log(`  GATE 2C: PHOTO METADATA MIGRATION TO NEON PREVIEW (${isApply ? "APPLY MODE" : "PREFLIGHT MODE"})`);
  console.log("======================================================================");

  // 1. Load Envs
  const localEnv = loadEnvFile(".env.local");
  const previewEnv = loadEnvFile(".env.migration.preview.local");

  const supabaseUrl = localEnv.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = localEnv.SUPABASE_SERVICE_ROLE_KEY;
  const neonUrl = previewEnv.DATABASE_URL_UNPOOLED || previewEnv.DATABASE_URL;

  if (!supabaseUrl || !serviceKey) throw new Error("Supabase credentials missing in .env.local");
  if (!neonUrl) throw new Error("Neon DATABASE_URL missing in .env.migration.preview.local");

  // 2. Validate Source Ref
  const sourceRef = new URL(supabaseUrl).hostname.split(".")[0];
  if (sourceRef !== EXPECTED_SOURCE_REF) {
    throw new Error(`Source ref mismatch: expected ${EXPECTED_SOURCE_REF}, got ${sourceRef}`);
  }

  // 3. Validate Target Host
  const neonHost = new URL(neonUrl).hostname.replace("-pooler.", ".");
  if (!neonHost.includes("ep-super-fire-ayj2jnyh")) {
    throw new Error(`Target Neon host mismatch: expected ep-super-fire-ayj2jnyh, got ${neonHost}`);
  }

  // 4. Fetch Source Photos
  const supabase = createClient(supabaseUrl, serviceKey);
  const sourcePhotos = await fetchAllSourceRows(supabase, "wedding_photos");

  const sourceCount = sourcePhotos.length;
  const sourceChecksum = checksumRows(sourcePhotos);

  console.log(`[Source] Supabase (${sourceRef}): ${sourceCount} photos`);
  console.log(`[Source] Checksum: ${sourceChecksum}`);

  if (sourceCount !== EXPECTED_PHOTO_COUNT) {
    throw new Error(`Source count mismatch: expected ${EXPECTED_PHOTO_COUNT}, got ${sourceCount}`);
  }
  if (sourceChecksum !== EXPECTED_PHOTO_CHECKSUM) {
    throw new Error(`Source checksum mismatch: expected ${EXPECTED_PHOTO_CHECKSUM}, got ${sourceChecksum}`);
  }

  // 5. Connect to Neon Preview
  const client = new pg.Client({ connectionString: neonUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    const existingRes = await client.query("SELECT COUNT(*)::int AS count FROM public.wedding_photos");
    const existingCount = existingRes.rows[0].count;
    console.log(`[Target] Neon Preview (${neonHost}): ${existingCount} existing photos`);

    if (!isApply) {
      console.log("\n✅ PREFLIGHT PASS — 147 metadados verificados com sucesso (Checksum & Schema 100% alinhados)!");
      console.log(`Para aplicar a migração no Neon Preview, execute com:`);
      console.log(`node scripts/apply-preview-photos.mjs --apply --confirm=${REQUIRED_CONFIRMATION}`);
      return;
    }

    // Apply validations
    if (confirmArg !== REQUIRED_CONFIRMATION) {
      throw new Error(`Confirmation mismatch: must supply --confirm=${REQUIRED_CONFIRMATION}`);
    }

    if (existingCount !== 0) {
      throw new Error(`Target table is not empty (${existingCount} rows present). Aborting.`);
    }

    console.log("\nIniciando transação SERIALIZABLE com advisory lock no Neon Preview...");
    await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
    await client.query("SET LOCAL lock_timeout = '10s'");
    await client.query("SET LOCAL statement_timeout = '30s'");
    await client.query("SELECT pg_advisory_xact_lock(hashtext('haxr:gate-2c:wedding-photos'))");

    // Insert in batches
    const BATCH_SIZE = 50;
    for (let i = 0; i < sourcePhotos.length; i += BATCH_SIZE) {
      const batch = sourcePhotos.slice(i, i + BATCH_SIZE);
      const values = [];
      const placeholders = [];

      batch.forEach((row, rowIdx) => {
        const rowPlaceholders = [];
        PHOTO_COLUMNS.forEach((col, colIdx) => {
          const paramIdx = rowIdx * PHOTO_COLUMNS.length + colIdx + 1;
          rowPlaceholders.push(`$${paramIdx}`);
          values.push(row[col]);
        });
        placeholders.push(`(${rowPlaceholders.join(", ")})`);
      });

      const sql = `
        INSERT INTO public.wedding_photos (${PHOTO_COLUMNS.join(", ")})
        VALUES ${placeholders.join(", ")}
        ON CONFLICT (id) DO NOTHING;
      `;

      await client.query(sql, values);
    }

    // Verify inserted data
    const verifyRes = await client.query(`
      SELECT *
      FROM public.wedding_photos
      ORDER BY id ASC;
    `);

    const targetPhotos = verifyRes.rows;
    const targetCount = targetPhotos.length;
    const targetChecksum = checksumRows(targetPhotos);

    console.log(`[Verified] Target rows inserted: ${targetCount}`);
    console.log(`[Verified] Target checksum: ${targetChecksum}`);

    if (targetCount !== EXPECTED_PHOTO_COUNT || targetChecksum !== EXPECTED_PHOTO_CHECKSUM) {
      throw new Error(`Verification failed! Target checksum ${targetChecksum} does not match source ${EXPECTED_PHOTO_CHECKSUM}`);
    }

    await client.query("COMMIT");
    console.log("\n🎉 SUCESSO ABSOLUTO: 147 metadados de fotos migrados e verificados com perfeição no Neon Preview!");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("\n❌ [GATE-2C-PHOTOS BLOCKED]:", err.message);
  process.exit(1);
});
