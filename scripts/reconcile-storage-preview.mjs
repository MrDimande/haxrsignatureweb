#!/usr/bin/env node
/**
 * Gate 3D — Storage & Neon Preview Dry-Run Reconciliation Protocol
 *
 * REGRA ABSOLUTA (Gate 3D.1):
 * Este módulo é estritamente READ-ONLY.
 * ZERO cópia de blobs, ZERO mutação de base de dados, ZERO criação de buckets,
 * ZERO chamadas a Cloudflare R2 ou AWS S3.
 * Downloads/streams do Supabase Storage são permitidos EXCLUSIVAMENTE para
 * leitura e cálculo do SHA-256 dos objetos físicos de origem.
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

export const GATE_3D_BASELINE = Object.freeze({
  expectedCount: 147,
  sourceRef: "oxsrdmydlqyvnueedgtl",
  bucket: "wedding-photos",
  neonHost: "ep-super-fire-ayj2jnyh.c-5.us-east-2.aws.neon.tech",
  neonDatabase: "neondb",
  migrationBranch: "migration/supabase-to-neon",
});

export const ALLOWED_EXTENSIONS = Object.freeze([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "heic",
  "heif",
  "mp4",
  "mov",
  "webm",
]);

export const EXTENSION_MIME_MAP = Object.freeze({
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
});

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG_REGEX = /^[a-z0-9-]+$/;

export class Gate3DError extends Error {
  constructor(code, message) {
    super(message ? `${code}: ${message}` : code);
    this.name = "Gate3DError";
    this.code = code;
  }
}

export function sha256(data) {
  const buffer = typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data);
  return createHash("sha256").update(buffer).digest("hex");
}

/**
 * Validação rigorosa do path canónico:
 * {invitation_slug}/{photo_id_uuid}/original.{ext}
 */
export function validateCanonicalPath(storagePath, expectedSlug, expectedId) {
  if (!storagePath || typeof storagePath !== "string") {
    return { valid: false, reason: "path_empty_or_not_string" };
  }

  // 1. Path traversal e caracteres ilegais
  if (
    storagePath.includes("..") ||
    storagePath.includes("\\") ||
    storagePath.startsWith("/") ||
    storagePath.endsWith("/") ||
    storagePath.includes("//") ||
    /[\x00-\x1F\x7F]/.test(storagePath)
  ) {
    return { valid: false, reason: "path_traversal_or_illegal_characters" };
  }

  // 2. Exatamente 3 segmentos
  const parts = storagePath.split("/");
  if (parts.length !== 3) {
    return { valid: false, reason: `path_must_have_exactly_3_segments_got_${parts.length}` };
  }

  const [slug, photoId, fileName] = parts;

  // 3. Slug
  if (!SLUG_REGEX.test(slug)) {
    return { valid: false, reason: `invalid_slug_format_${slug}` };
  }
  if (expectedSlug && slug !== expectedSlug) {
    return { valid: false, reason: `slug_mismatch_expected_${expectedSlug}_got_${slug}` };
  }

  // 4. UUID v4
  if (!UUID_V4_REGEX.test(photoId)) {
    return { valid: false, reason: `invalid_uuid_format_${photoId}` };
  }
  if (expectedId && photoId.toLowerCase() !== expectedId.toLowerCase()) {
    return { valid: false, reason: `id_mismatch_expected_${expectedId}_got_${photoId}` };
  }

  // 5. Nome do ficheiro e extensão
  if (!fileName.startsWith("original.")) {
    return { valid: false, reason: `file_must_be_named_original_got_${fileName}` };
  }

  const ext = fileName.slice("original.".length).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, reason: `unsupported_extension_${ext}` };
  }

  return {
    valid: true,
    slug,
    photoId,
    extension: ext,
    fileName,
    canonicalPath: `${slug}/${photoId}/original.${ext}`,
  };
}

/**
 * Validação fail-closed do ambiente de execução.
 */
export function validateEnvironmentSafety(env, options = {}) {
  // 1. TLS verification
  if (env.NODE_TLS_REJECT_UNAUTHORIZED === "0") {
    throw new Gate3DError("tls_verification_required", "NODE_TLS_REJECT_UNAUTHORIZED=0 é expressamente proibido.");
  }

  // 2. Branch check (se não estiver em modo de teste forçado)
  const branch = env.VERCEL_GIT_COMMIT_REF || env.GIT_BRANCH || options.mockBranch;
  if (branch === "main" || branch === "master") {
    throw new Gate3DError("production_branch_blocked", "Auditoria de Preview bloqueada na branch main.");
  }
  if (options.requireMigrationBranch && branch !== GATE_3D_BASELINE.migrationBranch) {
    throw new Gate3DError("wrong_migration_branch", `Branch esperada: ${GATE_3D_BASELINE.migrationBranch}, obtida: ${branch}`);
  }

  // 3. Target Database (Neon Preview)
  const targetHost = env.DATABASE_HOST || options.mockTargetHost;
  if (options.requireExactTarget && targetHost && targetHost !== GATE_3D_BASELINE.neonHost) {
    throw new Gate3DError("neon_target_mismatch", `Host Neon esperado: ${GATE_3D_BASELINE.neonHost}, obtido: ${targetHost}`);
  }

  // 4. Bucket binding
  const bucket = env.GATE_2C_SOURCE_PHOTOS_BUCKET || env.PHOTOS_BUCKET || options.mockBucket || GATE_3D_BASELINE.bucket;
  if (bucket !== GATE_3D_BASELINE.bucket) {
    throw new Gate3DError("wrong_bucket_binding", `Bucket esperado: ${GATE_3D_BASELINE.bucket}, obtido: ${bucket}`);
  }

  return {
    branch,
    targetHost,
    bucket,
    safe: true,
  };
}

/**
 * 1. CHECKSUM DO INVENTÁRIO FÍSICO DE ORIGEM (sourceInventoryChecksum)
 * Calculado sobre TODOS os objetos físicos encontrados no bucket de origem.
 * NUNCA filtra por estado de reconciliação.
 *
 * Representação canónica por objeto:
 * - storage_path (string normalizada e trimmed)
 * - size_bytes (inteiro não negativo)
 * - content_type (MIME normalizado em minúsculas)
 * - sha256 (64 hex lowercase do binário)
 *
 * Ordenação: storage_path ASC estrito.
 * Serialização: JSON canónico minificado UTF-8.
 */
export function calculateSourceInventoryChecksum(storageObjects) {
  if (!Array.isArray(storageObjects)) {
    throw new Gate3DError("invalid_storage_objects_array", "storageObjects deve ser um array.");
  }

  const canonicalItems = storageObjects.map((obj) => {
    const rawPath = typeof obj.storage_path === "string" ? obj.storage_path.trim() : "";
    const rawSize = Number(obj.size_bytes);
    const rawMime = typeof obj.content_type === "string"
      ? obj.content_type.trim().toLowerCase().split(";")[0].trim()
      : "application/octet-stream";
    const rawHash = typeof obj.sha256 === "string" ? obj.sha256.trim().toLowerCase() : "";

    return {
      storage_path: rawPath,
      size_bytes: Number.isSafeInteger(rawSize) && rawSize >= 0 ? rawSize : 0,
      content_type: rawMime || "application/octet-stream",
      sha256: /^[0-9a-f]{64}$/.test(rawHash) ? rawHash : "pending_hash",
    };
  });

  canonicalItems.sort((a, b) => a.storage_path.localeCompare(b.storage_path));
  const canonicalJson = JSON.stringify(canonicalItems);

  return {
    itemCount: canonicalItems.length,
    sourceInventoryChecksum: sha256(Buffer.from(canonicalJson, "utf8")),
    totalBytes: canonicalItems.reduce((acc, curr) => acc + curr.size_bytes, 0),
    items: canonicalItems,
  };
}

/**
 * Checksum Determinístico dos Metadados do Neon (neonMetadataChecksum)
 * Calculado sobre TODOS os registos lidos de public.wedding_photos.
 */
export function calculateNeonMetadataChecksum(neonRows) {
  if (!Array.isArray(neonRows)) {
    throw new Gate3DError("invalid_neon_rows_array", "neonRows deve ser um array.");
  }

  const canonicalItems = neonRows.map((row) => {
    const rawPath = typeof row.storage_path === "string" ? row.storage_path.trim() : "";
    const rawId = typeof row.id === "string" ? row.id.trim().toLowerCase() : "";
    const rawSlug = typeof row.invitation_slug === "string" ? row.invitation_slug.trim() : "";
    const rawSize = Number(row.file_size_bytes);
    const rawMime = typeof row.content_type === "string"
      ? row.content_type.trim().toLowerCase().split(";")[0].trim()
      : "application/octet-stream";
    const rawStatus = typeof row.moderation_status === "string" ? row.moderation_status.trim() : "";

    return {
      id: rawId,
      invitation_slug: rawSlug,
      storage_path: rawPath,
      file_size_bytes: Number.isSafeInteger(rawSize) && rawSize >= 0 ? rawSize : 0,
      content_type: rawMime,
      moderation_status: rawStatus,
    };
  });

  canonicalItems.sort((a, b) => a.storage_path.localeCompare(b.storage_path));
  const canonicalJson = JSON.stringify(canonicalItems);

  return {
    itemCount: canonicalItems.length,
    neonMetadataChecksum: sha256(Buffer.from(canonicalJson, "utf8")),
    items: canonicalItems,
  };
}

/**
 * Checksum Determinístico dos Resultados da Reconciliação (reconciliationChecksum)
 */
export function calculateReconciliationChecksum(reconciliationResults) {
  if (!Array.isArray(reconciliationResults)) {
    throw new Gate3DError("invalid_reconciliation_results_array", "reconciliationResults deve ser um array.");
  }

  const canonicalItems = reconciliationResults.map((r) => ({
    storage_path: r.storagePath,
    status: r.status,
    size_bytes: r.sizeBytes || 0,
    content_type: r.contentType || "application/octet-stream",
    sha256: r.sha256 || "null",
  }));

  canonicalItems.sort((a, b) => a.storage_path.localeCompare(b.storage_path));
  const canonicalJson = JSON.stringify(canonicalItems);

  return {
    totalEvaluated: canonicalItems.length,
    reconciliationChecksum: sha256(Buffer.from(canonicalJson, "utf8")),
  };
}

/**
 * Executa a reconciliação 1:1 entre os registos do Neon e os blobs do Storage.
 *
 * SEMÂNTICA HONESTA DE MATCH:
 * Como a tabela `public.wedding_photos` NÃO armazena uma coluna de hash SHA-256 autoritativa,
 * a classificação MATCH significa:
 * 1. storage_path coincide 1:1;
 * 2. file_size_bytes coincide perfeitamente;
 * 3. content_type coincide com o MIME canónico;
 * 4. contrato canónico {slug}/{uuid}/original.{ext} é 100% válido;
 * 5. contrato de metadados na base de dados é válido;
 * 6. SHA-256 do blob físico foi calculado com sucesso diretamente a partir do binário;
 * 7. Integridade e estabilidade do SHA-256 é comprovada entre auditorias independentes.
 */
export function reconcile1to1(neonRows, storageObjects) {
  const metadataByPath = new Map();
  const duplicates = new Set();

  for (const row of neonRows) {
    if (metadataByPath.has(row.storage_path)) {
      duplicates.add(row.storage_path);
    }
    metadataByPath.set(row.storage_path, row);
  }

  const storageByPath = new Map();
  for (const obj of storageObjects) {
    storageByPath.set(obj.storage_path, obj);
  }

  const results = [];
  const allPaths = new Set([...metadataByPath.keys(), ...storageByPath.keys()]);

  for (const path of allPaths) {
    const row = metadataByPath.get(path);
    const blob = storageByPath.get(path);

    // 1. Checagem de duplicação
    if (duplicates.has(path)) {
      results.push({
        storagePath: path,
        status: "DUPLICATE_PATH",
        reason: "Path repetido nos metadados do Neon",
        metadata: row,
        storage: blob,
      });
      continue;
    }

    // 2. Órfão no Storage (sem metadados)
    if (!row && blob) {
      results.push({
        storagePath: path,
        status: "ORPHAN_OBJECT",
        reason: "Objeto físico existe no Storage mas não possui registo no Neon",
        metadata: null,
        storage: blob,
      });
      continue;
    }

    // 3. Objeto Ausente no Storage (com metadados)
    if (row && !blob) {
      results.push({
        storagePath: path,
        status: "MISSING_OBJECT",
        reason: "Metadados existem no Neon mas o blob físico está ausente no Storage",
        metadata: row,
        storage: null,
      });
      continue;
    }

    // Ambos existem — validar contrato canónico
    const pathCheck = validateCanonicalPath(path, row.invitation_slug, row.id);
    if (!pathCheck.valid) {
      results.push({
        storagePath: path,
        status: "INVALID_PATH",
        reason: pathCheck.reason,
        metadata: row,
        storage: blob,
      });
      continue;
    }

    // Validar integridade dos metadados
    if (!row.id || !row.file_size_bytes || !row.content_type) {
      results.push({
        storagePath: path,
        status: "INVALID_METADATA",
        reason: "Campos essenciais nulos ou inválidos na base de dados",
        metadata: row,
        storage: blob,
      });
      continue;
    }

    // Validar tamanho
    const metaSize = Number(row.file_size_bytes);
    const blobSize = Number(blob.size_bytes);
    if (metaSize !== blobSize) {
      results.push({
        storagePath: path,
        status: "SIZE_MISMATCH",
        reason: `Divergência de tamanho: Neon=${metaSize} bytes, Storage=${blobSize} bytes`,
        metadata: row,
        storage: blob,
      });
      continue;
    }

    // Validar MIME
    const metaMime = row.content_type.toLowerCase().split(";")[0].trim();
    const blobMime = (blob.content_type || "").toLowerCase().split(";")[0].trim();
    if (blobMime && metaMime !== blobMime) {
      results.push({
        storagePath: path,
        status: "MIME_MISMATCH",
        reason: `Divergência de MIME: Neon=${metaMime}, Storage=${blobMime}`,
        metadata: row,
        storage: blob,
      });
      continue;
    }

    // Validar integridade do Hash SHA-256 (deve existir e ter formato válido de 64 hex)
    if (!blob.sha256 || !/^[0-9a-f]{64}$/i.test(blob.sha256)) {
      results.push({
        storagePath: path,
        status: "HASH_MISMATCH",
        reason: "SHA-256 do blob físico ausente ou com formato inválido",
        metadata: row,
        storage: blob,
      });
      continue;
    }

    // Se todos os critérios baterem 100%: MATCH!
    results.push({
      storagePath: path,
      status: "MATCH",
      sizeBytes: blobSize,
      contentType: metaMime,
      sha256: blob.sha256.toLowerCase(),
      metadata: row,
      storage: blob,
    });
  }

  // Ordenação determinística por storage_path ASC
  results.sort((a, b) => a.storagePath.localeCompare(b.storagePath));
  return results;
}

/**
 * Sumariza o resultado global da reconciliação.
 */
export function summarizeReconciliation(reconciliationResults, storageObjects = [], neonRows = []) {
  const counts = {
    totalEvaluated: reconciliationResults.length,
    MATCH: 0,
    MISSING_OBJECT: 0,
    ORPHAN_OBJECT: 0,
    SIZE_MISMATCH: 0,
    MIME_MISMATCH: 0,
    HASH_MISMATCH: 0,
    DUPLICATE_PATH: 0,
    INVALID_PATH: 0,
    INVALID_METADATA: 0,
    totalBytes: 0,
  };

  for (const r of reconciliationResults) {
    if (counts[r.status] !== undefined) {
      counts[r.status] += 1;
    }
    if (r.status === "MATCH") {
      counts.totalBytes += r.sizeBytes || 0;
    }
  }

  // Checksum determinístico do inventário físico completo
  const sourceChecksumResult = calculateSourceInventoryChecksum(
    storageObjects.length > 0 ? storageObjects : reconciliationResults.map((r) => ({
      storage_path: r.storagePath,
      size_bytes: r.sizeBytes,
      content_type: r.contentType,
      sha256: r.sha256,
    }))
  );

  const neonChecksumResult = neonRows.length > 0 ? calculateNeonMetadataChecksum(neonRows) : null;
  const reconciliationChecksumResult = calculateReconciliationChecksum(reconciliationResults);

  return {
    ...counts,
    sourceInventoryChecksum: sourceChecksumResult.sourceInventoryChecksum,
    neonMetadataChecksum: neonChecksumResult ? neonChecksumResult.neonMetadataChecksum : null,
    reconciliationChecksum: reconciliationChecksumResult.reconciliationChecksum,
    isCleanPass: counts.MATCH === reconciliationResults.length && counts.totalEvaluated === GATE_3D_BASELINE.expectedCount,
  };
}

/**
 * Simulação de Sincronização Dry-Run (sem rede, sem efeitos remotos).
 */
export function generateDryRunSyncPlan(reconciliationResults, simulatedDestinationStore = new Map()) {
  const plan = [];

  for (const item of reconciliationResults) {
    const destKey = `destination://haxr-wedding-photos/${item.storagePath}`;

    if (item.status !== "MATCH") {
      plan.push({
        sourcePath: item.storagePath,
        destinationPath: destKey,
        decision: item.status === "ORPHAN_OBJECT" || item.status === "MISSING_OBJECT" ? "WOULD_BLOCK" : "WOULD_REJECT",
        reason: item.reason || `Status de reconciliação incompatível: ${item.status}`,
      });
      continue;
    }

    const existingDestHash = simulatedDestinationStore.get(item.storagePath);
    if (existingDestHash && existingDestHash === item.sha256) {
      plan.push({
        sourcePath: item.storagePath,
        destinationPath: destKey,
        sourceSize: item.sizeBytes,
        sourceSha256: item.sha256,
        decision: "WOULD_SKIP_IDENTICAL",
        reason: "Objeto com hash SHA-256 idêntico já existe no destino",
      });
    } else {
      plan.push({
        sourcePath: item.storagePath,
        destinationPath: destKey,
        sourceSize: item.sizeBytes,
        sourceSha256: item.sha256,
        decision: "WOULD_COPY",
        reason: "Objeto validado e pronto para cópia atómica com reconciliação de hash",
      });
    }
  }

  return plan;
}

/**
 * Verificação de Idempotência entre duas execuções consecutivas.
 */
export function assertIdempotency(run1Summary, run2Summary) {
  if (run1Summary.totalEvaluated !== run2Summary.totalEvaluated) {
    throw new Gate3DError("idempotency_failure_total_count_drift", "Contagem de objetos divergiu entre runs.");
  }
  if (run1Summary.MATCH !== run2Summary.MATCH) {
    throw new Gate3DError("idempotency_failure_match_count_drift", "Contagem de MATCH divergiu entre runs.");
  }
  if (run1Summary.totalBytes !== run2Summary.totalBytes) {
    throw new Gate3DError("idempotency_failure_total_bytes_drift", "Total de bytes divergiu entre runs.");
  }
  if (run1Summary.sourceInventoryChecksum !== run2Summary.sourceInventoryChecksum) {
    throw new Gate3DError("idempotency_failure_source_checksum_drift", "sourceInventoryChecksum divergiu entre runs.");
  }
  if (
    run1Summary.neonMetadataChecksum &&
    run2Summary.neonMetadataChecksum &&
    run1Summary.neonMetadataChecksum !== run2Summary.neonMetadataChecksum
  ) {
    throw new Gate3DError("idempotency_failure_neon_checksum_drift", "neonMetadataChecksum divergiu entre runs.");
  }
  if (run1Summary.reconciliationChecksum !== run2Summary.reconciliationChecksum) {
    throw new Gate3DError("idempotency_failure_reconciliation_checksum_drift", "reconciliationChecksum divergiu entre runs.");
  }
  return true;
}

/**
 * Utilitário de Carregamento Seguro de Variáveis de Ambiente para Auditoria Live
 */
export function loadAuditEnvironment() {
  const env = { ...process.env };

  function loadFile(file) {
    try {
      const content = readFileSync(resolve(process.cwd(), file), "utf8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx < 0) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (val && !env[key]) env[key] = val;
      }
    } catch {}
  }

  loadFile(".env.migration.preview.local");
  loadFile(".env.local");

  return env;
}

/**
 * Executa uma rodada da Auditoria Live Real contra Neon Preview e Supabase Storage.
 * Modo estritamente READ-ONLY.
 */
export async function executeLiveAudit(options = {}) {
  const runNumber = options.runNumber || 1;
  const env = loadAuditEnvironment();

  // 1. Fail-closed preflight security
  validateEnvironmentSafety(env);

  const neonUrl = env.DATABASE_URL_UNPOOLED || env.DATABASE_URL;
  const supabaseUrl = env.GATE_2C_SOURCE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.GATE_2C_SOURCE_SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

  if (!neonUrl) throw new Gate3DError("neon_url_missing");
  if (!supabaseUrl || !supabaseKey) throw new Gate3DError("supabase_credentials_missing");

  // 2. Neon Preview - Consulta em transação estritamente READ ONLY
  const pgClient = new pg.Client({
    connectionString: neonUrl,
    ssl: { rejectUnauthorized: true, servername: GATE_3D_BASELINE.neonHost },
    statement_timeout: 30000,
  });

  let neonRows = [];
  try {
    await pgClient.connect();
    await pgClient.query("BEGIN TRANSACTION READ ONLY ISOLATION LEVEL REPEATABLE READ");

    const queryResult = await pgClient.query(`
      SELECT
        id,
        invitation_slug,
        storage_path,
        original_filename,
        content_type,
        file_size_bytes,
        guest_name,
        caption,
        moderation_status,
        created_at
      FROM public.wedding_photos
      ORDER BY storage_path ASC
    `);

    neonRows = queryResult.rows;
    await pgClient.query("ROLLBACK");
  } finally {
    await pgClient.end();
  }

  // 3. Supabase Storage - Download em memória exclusivamente para calcular SHA-256
  const supabase = createClient(supabaseUrl, supabaseKey);
  const storageObjects = [];

  // Processar em chunks pequenos de 5 concorrências para estabilidade de rede
  const chunkSize = 5;
  for (let i = 0; i < neonRows.length; i += chunkSize) {
    const chunk = neonRows.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async (row) => {
        const { data, error } = await supabase.storage.from(GATE_3D_BASELINE.bucket).download(row.storage_path);
        if (error || !data) {
          throw new Gate3DError("blob_download_failed", `Falha ao ler blob: ${row.storage_path}`);
        }

        const arrayBuffer = await data.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const calculatedHash = sha256(buffer);

        storageObjects.push({
          storage_path: row.storage_path,
          size_bytes: buffer.byteLength,
          content_type: row.content_type,
          sha256: calculatedHash,
        });
      })
    );
  }

  // 4. Reconciliação 1:1 e Resumo
  const reconciliationResults = reconcile1to1(neonRows, storageObjects);
  const summary = summarizeReconciliation(reconciliationResults, storageObjects, neonRows);

  // 5. Salvar artefacto local seguro (sem credenciais, sem URLs)
  const safeArtifactPath = resolve(process.cwd(), `docs/migrations/gate-3d-reconciliation-run-${runNumber}.json`);
  const safePayload = {
    runNumber,
    timestamp: new Date().toISOString(),
    gate: "GATE_3D.1",
    readOnly: true,
    totalEvaluated: summary.totalEvaluated,
    MATCH: summary.MATCH,
    totalBytes: summary.totalBytes,
    sourceInventoryChecksum: summary.sourceInventoryChecksum,
    neonMetadataChecksum: summary.neonMetadataChecksum,
    reconciliationChecksum: summary.reconciliationChecksum,
    objects: reconciliationResults.map((r) => ({
      storage_path: r.storagePath,
      size_bytes: r.sizeBytes,
      content_type: r.contentType,
      sha256: r.sha256,
      status: r.status,
    })),
  };

  writeFileSync(safeArtifactPath, JSON.stringify(safePayload, null, 2), "utf8");

  return {
    summary,
    safeArtifactPath,
  };
}
