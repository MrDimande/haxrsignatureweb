#!/usr/bin/env node
/**
 * Auditoria de Inventário Remoto Cloudflare R2 Estritamente Read-Only
 * Subgate 3F-E2 / Fecho Formal do Gate 3F-E
 *
 * MUTAÇÕES PROIBIDAS: Zero PutObject, Zero DeleteObject, Zero CopyObject.
 * Identidade: GATE_3F_A_AUDIT_IDENTITY (Object Read only).
 */

import {
  S3Client,
  ListObjectsV2Command,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { loadAndValidateGate3FCEnvironment } from "./run-live-gate-3f-c.mjs";
import { loadApprovedSourceInventory } from "./dry-run-r2-migration.mjs";

const CANARY_STORAGE_PATH = "cutoverreadinesscanary/00000000-4000-4000-8000-000000000001/original.jpg";

export async function auditRemoteR2InventoryReadOnly() {
  console.log("================================================================================");
  console.log("   AUDITORIA REMOTA ESTRITAMENTE READ-ONLY (GATE_3F_A_AUDIT_IDENTITY)           ");
  console.log("================================================================================");

  const envR2 = loadAndValidateGate3FCEnvironment({ operatorRevocationConfirmed: true });
  const auditClient = new S3Client({
    region: "auto",
    endpoint: envR2.endpoint,
    credentials: {
      accessKeyId: envR2.auditKeyId,
      secretAccessKey: envR2.auditSecret,
    },
    forcePathStyle: true,
  });

  // 1. Listagem completa paginada
  let allObjects = [];
  let token;
  do {
    const res = await auditClient.send(
      new ListObjectsV2Command({
        Bucket: envR2.bucketName,
        ContinuationToken: token,
      })
    );
    if (res.Contents) {
      for (const obj of res.Contents) {
        allObjects.push({ key: obj.Key, size: obj.Size });
      }
    }
    token = res.NextContinuationToken;
  } while (token);

  const objectCount = allObjects.length;
  const totalBytes = allObjects.reduce((acc, o) => acc + o.size, 0);
  const pathSet = new Set(allObjects.map((o) => o.key));

  console.log(`[R2 AUDITORIA] Objectos físicos encontrados: ${objectCount} (requerido: 147)`);
  console.log(`[R2 AUDITORIA] Volume total em bytes:       ${totalBytes} (requerido: 535493700)`);

  // 2. Verificação de canário na listagem
  const canaryInList = pathSet.has(CANARY_STORAGE_PATH);
  console.log(`[R2 AUDITORIA] Canário presente na listagem: ${canaryInList} (requerido: false)`);

  // 3. Verificação explícita do canário via HeadObject
  let canaryHeadStatus = "UNKNOWN";
  try {
    await auditClient.send(
      new HeadObjectCommand({
        Bucket: envR2.bucketName,
        Key: CANARY_STORAGE_PATH,
      })
    );
    canaryHeadStatus = "EXISTS_200";
  } catch (err) {
    if (
      err.name === "NotFound" ||
      err.name === "NoSuchKey" ||
      err.status === 404 ||
      err.$metadata?.httpStatusCode === 404
    ) {
      canaryHeadStatus = "NOT_FOUND_404";
    } else {
      canaryHeadStatus = `ERROR_${err.name}`;
    }
  }
  console.log(`[R2 AUDITORIA] HeadObject canário:          ${canaryHeadStatus} (requerido: NOT_FOUND_404)`);

  // 4. Verificação de imutabilidade histórica contra manifesto aprovado do Gate 3D
  const approvedRecords = loadApprovedSourceInventory();
  const approvedPathSet = new Set(approvedRecords.map((r) => r.storage_path));

  let missingPaths = [];
  for (const p of approvedPathSet) {
    if (!pathSet.has(p)) {
      missingPaths.push(p);
    }
  }

  let extraPaths = [];
  for (const p of pathSet) {
    if (!approvedPathSet.has(p)) {
      extraPaths.push(p);
    }
  }

  console.log(`[R2 AUDITORIA] Caminhos históricos em falta: ${missingPaths.length} (requerido: 0)`);
  console.log(`[R2 AUDITORIA] Caminhos extras / não autorizados: ${extraPaths.length} (requerido: 0)`);

  const passed =
    objectCount === 147 &&
    totalBytes === 535493700 &&
    !canaryInList &&
    canaryHeadStatus === "NOT_FOUND_404" &&
    missingPaths.length === 0 &&
    extraPaths.length === 0;

  console.log("================================================================================");
  console.log(`[R2 AUDITORIA] ESTADO REMOTO FINAL: ${passed ? "PASS (100% CONFORME)" : "FAIL"}`);
  console.log("================================================================================");

  if (!passed) {
    throw new Error(`AUDIT_FAILED: objectCount=${objectCount}, totalBytes=${totalBytes}, canaryExists=${canaryInList}`);
  }

  return {
    objectCount,
    totalBytes,
    canaryInList,
    canaryHeadStatus,
    missingPathsCount: missingPaths.length,
    extraPathsCount: extraPaths.length,
  };
}

if (process.argv[1] && process.argv[1].endsWith("verify-r2-read-only-inventory.mjs")) {
  auditRemoteR2InventoryReadOnly().catch((err) => {
    console.error("[ERRO FATAL NA AUDITORIA]:", err);
    process.exit(1);
  });
}
