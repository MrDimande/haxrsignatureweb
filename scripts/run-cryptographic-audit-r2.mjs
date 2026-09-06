#!/usr/bin/env node
/**
 * Auditoria Criptográfica Read-Only Profunda do Cloudflare R2 (Gate 3F-C3)
 *
 * Executa duas passagens completas e independentes (Run 1 e Run 2)
 * lendo os 147 objectos físicos via GetObject em streaming, calculando o SHA-256
 * real de cada binário e confrontando contra o manifest congelado do Gate 3D.
 *
 * MUTAÇÕES PROIBIDAS: Zero PutObject, Zero CopyObject, Zero DeleteObject.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import https from "node:https";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import {
  S3Client,
  HeadBucketCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

import { loadAndValidateGate3FCEnvironment } from "./run-live-gate-3f-c.mjs";
import { buildFrozenManifest } from "./sync-storage-protocol.mjs";
import { loadApprovedSourceInventory } from "./dry-run-r2-migration.mjs";
import { calculateSourceInventoryChecksum } from "./reconcile-storage-preview.mjs";

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

async function readObjectStreamSha256(auditClient, bucketName, key, totalSize, runName) {
  const chunkSize = 2 * 1024 * 1024; // 2 MB: taxa de transferência rápida e estável
  let downloaded = 0;
  const hash = createHash("sha256");

  if (totalSize === 0) {
    return { sha256: hash.digest("hex"), totalBytes: 0 };
  }

  while (downloaded < totalSize) {
    const end = Math.min(downloaded + chunkSize - 1, totalSize - 1);
    const expectedChunkLen = end - downloaded + 1;
    let chunkOk = false;
    let lastErr = null;
    const maxRetries = 25;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const getRes = await auditClient.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: key,
            Range: `bytes=${downloaded}-${end}`,
          })
        );

        const parts = [];
        for await (const chunk of getRes.Body) {
          parts.push(chunk);
        }
        const fullBuf = Buffer.concat(parts);

        if (fullBuf.length !== expectedChunkLen) {
          throw new Error(`Inconsistência de chunk: esperado ${expectedChunkLen}, obtido ${fullBuf.length}`);
        }

        // Acumula no hasher SHA-256 somente após confirmação atómica do bloco íntegro
        hash.update(fullBuf);
        downloaded += fullBuf.length;
        chunkOk = true;
        break;
      } catch (err) {
        lastErr = err;
        if (attempt < maxRetries) {
          const isDnsError = err.code === "ENOTFOUND" || err.message?.includes("ENOTFOUND");
          const delay = isDnsError ? 8000 : Math.min(attempt * 1500, 10000);
          console.warn(`[${runName}] Queda transitória no chunk ${downloaded}-${end} de '${key}' (tentativa ${attempt}/${maxRetries}): ${err.message}. Retentando em ${delay}ms...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
      }
    }

    if (!chunkOk) {
      throw lastErr || new Error(`Falha irrecuperável no chunk ${downloaded}-${end} de '${key}'`);
    }
  }

  return {
    sha256: hash.digest("hex"),
    totalBytes: downloaded,
  };
}

export async function runSingleCryptographicAuditPass(runName, auditClient, bucketName, manifest) {
  console.log(`\n=== INICIANDO AUDITORIA CRIPTOGRÁFICA READ-ONLY: ${runName} ===`);

  // 1. HeadBucket
  await auditClient.send(new HeadBucketCommand({ Bucket: bucketName }));

  // 2. ListObjectsV2 completa
  const listedKeys = [];
  let contToken;
  do {
    const res = await auditClient.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        ContinuationToken: contToken,
      })
    );
    if (res.Contents) {
      for (const c of res.Contents) {
        listedKeys.push({ key: c.Key, size: c.Size });
      }
    }
    contToken = res.NextContinuationToken;
  } while (contToken);

  console.log(`[${runName}] Objectos listados: ${listedKeys.length} | Bytes listados: ${listedKeys.reduce((a, b) => a + (b.size || 0), 0)}`);

  const checkpointSlug = runName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const scratchDir = resolve(process.cwd(), "scratch");
  mkdirSync(scratchDir, { recursive: true });
  const checkpointPath = resolve(scratchDir, `audit-cache-${checkpointSlug}.json`);
  const checkpointMap = new Map();

  if (existsSync(checkpointPath)) {
    try {
      const saved = JSON.parse(readFileSync(checkpointPath, "utf8"));
      if (Array.isArray(saved)) {
        for (const t of saved) {
          if (t.storage_path) checkpointMap.set(t.storage_path, t);
        }
        console.log(`[${runName}] Checkpoint recuperado do disco: ${checkpointMap.size}/${manifest.items.length} objectos previamente auditados.`);
      }
    } catch {
      // Se o ficheiro estiver corrompido ou incompleto, ignora e audita de raiz
    }
  }

  let pathMatchCount = 0;
  let sizeMatchCount = 0;
  let contentTypeMatchCount = 0;
  let sha256MatchCount = 0;
  let sha256MismatchCount = 0;
  let totalBytes = 0;
  const auditedTuples = [];

  for (let i = 0; i < manifest.items.length; i++) {
    const item = manifest.items[i];
    const key = item.storage_path;

    if (checkpointMap.has(key)) {
      const cached = checkpointMap.get(key);
      pathMatchCount++;
      if (cached.size_bytes === item.size_bytes) sizeMatchCount++;
      if (cached.content_type?.toLowerCase() === item.content_type.toLowerCase()) contentTypeMatchCount++;
      if (cached.sha256 === item.sha256) sha256MatchCount++;
      else sha256MismatchCount++;
      totalBytes += cached.size_bytes;
      auditedTuples.push(cached);

      if ((i + 1) % 5 === 0 || i + 1 === manifest.items.length) {
        console.log(`[${runName}] Progresso: ${i + 1}/${manifest.items.length} objectos auditados (recuperados do checkpoint, acumulado: ${totalBytes} bytes)`);
      }
      continue;
    }

    let actualSize = 0;
    let actualMime = "";
    const maxHeadRetries = 25;

    for (let attempt = 1; attempt <= maxHeadRetries; attempt++) {
      try {
        const head = await auditClient.send(
          new HeadObjectCommand({
            Bucket: bucketName,
            Key: key,
          })
        );
        actualSize = Number(head.ContentLength || 0);
        actualMime = head.ContentType?.toLowerCase().split(";")[0].trim() || "application/octet-stream";
        break;
      } catch (err) {
        if (attempt < maxHeadRetries) {
          const isDnsError = err.code === "ENOTFOUND" || err.message?.includes("ENOTFOUND");
          const delay = isDnsError ? 8000 : Math.min(attempt * 1500, 10000);
          console.warn(`[${runName}] Oscilação no HeadObject de '${key}' (tentativa ${attempt}/${maxHeadRetries}): ${err.message}. Retentando em ${delay}ms...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        throw err;
      }
    }

    pathMatchCount++;
    if (actualSize === item.size_bytes) {
      sizeMatchCount++;
    }
    if (actualMime === item.content_type.toLowerCase()) {
      contentTypeMatchCount++;
    }

    // Leitura física particionada por HTTP Range com streaming SHA-256
    const { sha256: actualHash, totalBytes: streamedBytes } = await readObjectStreamSha256(
      auditClient,
      bucketName,
      key,
      actualSize,
      runName
    );

    totalBytes += streamedBytes;

    if (actualHash === item.sha256) {
      sha256MatchCount++;
    } else {
      sha256MismatchCount++;
      console.error(`[${runName}] DIVERGÊNCIA no objecto ${key}: esperado ${item.sha256}, obtido ${actualHash}`);
    }

    const tuple = {
      storage_path: key,
      size_bytes: streamedBytes,
      content_type: actualMime,
      sha256: actualHash,
    };
    auditedTuples.push(tuple);

    // Salva progresso no checkpoint
    writeFileSync(checkpointPath, JSON.stringify(auditedTuples, null, 2), "utf8");

    if ((i + 1) % 5 === 0 || i + 1 === manifest.items.length) {
      console.log(`[${runName}] Progresso: ${i + 1}/${manifest.items.length} objectos auditados com GetObject SHA-256 (acumulado: ${totalBytes} bytes)`);
    }
  }

  // Ordenação determinística ASC e serialização canónica
  auditedTuples.sort((a, b) => a.storage_path.localeCompare(b.storage_path));
  const canonicalJson = JSON.stringify(auditedTuples);
  const destinationInventoryChecksum = sha256(Buffer.from(canonicalJson, "utf8"));

  return {
    runName,
    objectCount: auditedTuples.length,
    totalBytes,
    pathMatchCount,
    sizeMatchCount,
    contentTypeMatchCount,
    sha256MatchCount,
    sha256MismatchCount,
    destinationInventoryChecksum,
    tuples: auditedTuples,
  };
}

async function main() {
  const env = loadAndValidateGate3FCEnvironment({ operatorRevocationConfirmed: true });
  const manifest = buildFrozenManifest(loadApprovedSourceInventory());
  const sourceChecksumBaseline = calculateSourceInventoryChecksum(manifest.items).sourceInventoryChecksum;

  console.log(`[MANIFEST] Checksum da fonte de referência: ${sourceChecksumBaseline}`);

  const auditClient = new S3Client({
    region: "auto",
    endpoint: env.endpoint,
    credentials: {
      accessKeyId: env.auditKeyId,
      secretAccessKey: env.auditSecret,
    },
    forcePathStyle: true,
    maxAttempts: 1,
    requestHandler: new NodeHttpHandler({
      httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 5, timeout: 60000 }),
      connectionTimeout: 30000,
      requestTimeout: 120000,
    }),
  });

  const run1 = await runSingleCryptographicAuditPass("Run 1", auditClient, env.bucketName, manifest);
  const run2 = await runSingleCryptographicAuditPass("Run 2", auditClient, env.bucketName, manifest);

  console.log("\n================ RESULTADOS FINAIS DA AUDITORIA CRIPTOGRÁFICA ================");
  console.log("RUN 1:");
  console.log(`  objectCount:            ${run1.objectCount}`);
  console.log(`  totalBytes:             ${run1.totalBytes}`);
  console.log(`  pathMatchCount:         ${run1.pathMatchCount}`);
  console.log(`  sizeMatchCount:         ${run1.sizeMatchCount}`);
  console.log(`  contentTypeMatchCount:  ${run1.contentTypeMatchCount}`);
  console.log(`  sha256MatchCount:       ${run1.sha256MatchCount}`);
  console.log(`  sha256MismatchCount:    ${run1.sha256MismatchCount}`);
  console.log(`  checksum:               ${run1.destinationInventoryChecksum}`);

  console.log("\nRUN 2:");
  console.log(`  objectCount:            ${run2.objectCount}`);
  console.log(`  totalBytes:             ${run2.totalBytes}`);
  console.log(`  pathMatchCount:         ${run2.pathMatchCount}`);
  console.log(`  sizeMatchCount:         ${run2.sizeMatchCount}`);
  console.log(`  contentTypeMatchCount:  ${run2.contentTypeMatchCount}`);
  console.log(`  sha256MatchCount:       ${run2.sha256MatchCount}`);
  console.log(`  sha256MismatchCount:    ${run2.sha256MismatchCount}`);
  console.log(`  checksum:               ${run2.destinationInventoryChecksum}`);

  console.log("\nPARIDADE DETERMINÍSTICA:");
  console.log(`  sourceInventoryChecksum:            ${sourceChecksumBaseline}`);
  console.log(`  destinationInventoryChecksumRun1:   ${run1.destinationInventoryChecksum}`);
  console.log(`  destinationInventoryChecksumRun2:   ${run2.destinationInventoryChecksum}`);
  console.log(`  Run1 === Run2:                      ${run1.destinationInventoryChecksum === run2.destinationInventoryChecksum}`);
  console.log(`  Run1 === sourceInventoryChecksum:   ${run1.destinationInventoryChecksum === sourceChecksumBaseline}`);
}

if (process.argv[1] && process.argv[1].endsWith("run-cryptographic-audit-r2.mjs")) {
  main().catch((err) => {
    console.error("ERRO NA AUDITORIA CRIPTOGRÁFICA:", err);
    process.exit(1);
  });
}
