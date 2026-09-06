#!/usr/bin/env node
/**
 * Gate 3F-B — Real Destination Dry-Run & Pre-Transfer Reconciliation Engine
 *
 * REGRA ABSOLUTA:
 * - ZERO object writes at destination (NO PutObject, NO CopyObject, NO DeleteObject, NO Multipart).
 * - ZERO blob transfers (Transferred blobs = 0, Transferred bytes = 0).
 * - Executa reconciliação determinística contra o estado REAL da Cloudflare R2 usando exclusivamente credenciais Read-Only.
 * - Dois runs independentes executados consecutivamente devem produzir dryRunChecksum idêntico.
 * - Zero secrets rastreados, zero segredos expostos.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";

import {
  S3Client,
  HeadBucketCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

import {
  GATE_3D_BASELINE_PIN,
  SyncProtocolError,
} from "./sync-storage-protocol.mjs";

export function sha256(data) {
  return createHash("sha256").update(data).digest("hex");
}

/**
 * Carrega a lista aprovada dos 147 objetos canónicos a partir do artifact oficial do Gate 3D.1
 */
export function loadApprovedSourceInventory(options = {}) {
  const defaultPath = resolve(process.cwd(), "docs/migrations/gate-3d-reconciliation-run-1.json");
  const filePath = options.inventoryPath || defaultPath;

  if (!existsSync(filePath)) {
    throw new SyncProtocolError(
      "source_inventory_file_missing",
      `Ficheiro de inventário da fonte ausente: ${filePath}`
    );
  }

  const raw = JSON.parse(readFileSync(filePath, "utf8"));
  if (!raw.objects || !Array.isArray(raw.objects)) {
    throw new SyncProtocolError(
      "source_inventory_invalid",
      "Estrutura do inventário da fonte inválida: campo objects ausente ou não-array"
    );
  }

  const expectedChecksum = options.expectedSourceInventoryChecksum || GATE_3D_BASELINE_PIN.sourceInventoryChecksum;
  if (raw.sourceInventoryChecksum !== expectedChecksum) {
    throw new SyncProtocolError(
      "source_inventory_checksum_mismatch",
      `Checksum do inventário divergiu: esperado ${expectedChecksum}, obtido ${raw.sourceInventoryChecksum}`
    );
  }

  const expectedCount = options.expectedSourceCount || GATE_3D_BASELINE_PIN.sourceObjectCount;
  if (raw.objects.length !== expectedCount) {
    throw new SyncProtocolError(
      "source_object_count_mismatch",
      `Contagem de objetos divergiu: esperado ${expectedCount}, obtido ${raw.objects.length}`
    );
  }

  const expectedBytes = options.expectedSourceBytes || GATE_3D_BASELINE_PIN.sourceTotalBytes;
  if (raw.totalBytes !== expectedBytes) {
    throw new SyncProtocolError(
      "source_total_bytes_mismatch",
      `Total de bytes divergiu: esperado ${expectedBytes}, obtido ${raw.totalBytes}`
    );
  }

  return raw.objects.map((obj) => {
    const parts = obj.storage_path.split("/");
    return {
      storage_path: obj.storage_path,
      size_bytes: Number(obj.size_bytes),
      content_type: obj.content_type,
      sha256: obj.sha256,
      invitation_slug: parts[0],
      photo_id: parts[1],
    };
  });
}

/**
 * Validação de Preflight Rigoroso para Gate 3F-B
 */
export function validateGate3FBPreflight(env = process.env, options = {}) {
  let currentBranch = options.mockBranch;
  if (!currentBranch) {
    try {
      currentBranch = execSync("git branch --show-current", {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
    } catch {
      currentBranch = "unknown";
    }
  }

  if (currentBranch === "main" || currentBranch === "master") {
    throw new SyncProtocolError(
      "production_branch_blocked",
      `Gate 3F-B bloqueado na branch de produção: ${currentBranch}`
    );
  }

  if (currentBranch !== "migration/supabase-to-neon" && !options.skipBranchCheck) {
    throw new SyncProtocolError(
      "invalid_migration_branch",
      `Gate 3F-B permitido exclusivamente na branch migration/supabase-to-neon (detectada: ${currentBranch})`
    );
  }

  if (env.STORAGE_CUTOVER_READY === "true") {
    throw new SyncProtocolError(
      "cutover_flag_prematurely_active",
      "STORAGE_CUTOVER_READY não pode estar activo no Gate 3F-B."
    );
  }

  return {
    branch: currentBranch,
    storageCutoverReady: false,
    supabaseStorageProvider: "ACTIVE",
    s3CompatibleStorageProvider: "NOT_ACTIVE",
    dualRead: "INACTIVE",
    status: "PREFLIGHT_VERIFIED",
  };
}

/**
 * Validador de Colisões e Caminhos Canónicos
 */
export function detectInventoryCollisions(manifestItems) {
  const seenPaths = new Set();
  const seenLowerPaths = new Map();
  const seenPhotoIds = new Map();
  const collisions = [];

  for (const item of manifestItems) {
    const p = item.storage_path;

    // Duplicado exato
    if (seenPaths.has(p)) {
      collisions.push({ type: "DUPLICATE_PATH", path: p });
    }
    seenPaths.add(p);

    // Colisão de caixa (Case collision)
    const lowerP = p.toLowerCase();
    if (seenLowerPaths.has(lowerP) && seenLowerPaths.get(lowerP) !== p) {
      collisions.push({
        type: "CASE_COLLISION",
        path1: seenLowerPaths.get(lowerP),
        path2: p,
      });
    }
    seenLowerPaths.set(lowerP, p);

    // Duplicado de photo_id entre slugs diferentes
    if (seenPhotoIds.has(item.photo_id) && seenPhotoIds.get(item.photo_id) !== item.invitation_slug) {
      collisions.push({
        type: "CROSS_SLUG_PHOTO_COLLISION",
        photo_id: item.photo_id,
        slug1: seenPhotoIds.get(item.photo_id),
        slug2: item.invitation_slug,
      });
    }
    seenPhotoIds.set(item.photo_id, item.invitation_slug);

    // Não pode conter prefixo de staging
    if (p.startsWith("__migration/") || p.includes("/__staging/")) {
      collisions.push({ type: "STAGING_PATH_CONTAMINATION", path: p });
    }

    // Formato canónico estrito {slug}/{photo_id}/original.{ext}
    const parts = p.split("/");
    if (parts.length !== 3 || !parts[2].startsWith("original.")) {
      collisions.push({ type: "INVALID_CANONICAL_SHAPE", path: p });
    }
  }

  return collisions;
}

/**
 * Motor de Dry-Run contra Destino Real R2 usando AWS SDK v3
 */
export class DestinationDryRunEngine {
  constructor(config = {}, customAdapter = null) {
    this.config = config;
    this.adapter = customAdapter;
    this.s3Client = null;

    if (config.hasS3Credentials && !customAdapter) {
      this.s3Client = new S3Client({
        region: config.region || "auto",
        endpoint: config.endpoint,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
      });
    }
  }

  /**
   * Consulta todo o inventário atual do bucket de destino via paginação completa
   */
  async fetchLiveDestinationInventory(bucketName = TARGET_R2_SPEC.bucketName) {
    if (this.adapter) {
      return await this.adapter.listAllObjects(bucketName);
    }

    if (!this.s3Client) {
      throw new SyncProtocolError(
        "s3_client_unconfigured",
        "S3Client não configurado. Credenciais de leitura necessárias."
      );
    }

    // Valida existência do bucket com HeadBucket
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    } catch (err) {
      if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
        throw new SyncProtocolError("destination_bucket_not_found", `Bucket ${bucketName} não encontrado.`);
      }
      if (err.name === "AccessDenied" || err.$metadata?.httpStatusCode === 403 || err.$metadata?.httpStatusCode === 401) {
        throw new SyncProtocolError("destination_access_denied", `Acesso negado ao bucket ${bucketName}: ${err.message}`);
      }
      throw err;
    }

    const objectsMap = new Map();
    let continuationToken;
    let totalBytes = 0;

    try {
      do {
        const cmd = new ListObjectsV2Command({
          Bucket: bucketName,
          ContinuationToken: continuationToken,
        });
        const res = await this.s3Client.send(cmd);

        if (res.Contents && res.Contents.length > 0) {
          for (const item of res.Contents) {
            const size = Number(item.Size || 0);
            totalBytes += size;
            objectsMap.set(item.Key, {
              key: item.Key,
              size,
              etag: item.ETag ? item.ETag.replace(/^"|"$/g, "") : null,
              lastModified: item.LastModified,
            });
          }
        }
        continuationToken = res.NextContinuationToken;
      } while (continuationToken);
    } catch (err) {
      throw new SyncProtocolError(
        "destination_list_failed",
        `Falha ao listar objetos no destino: ${err.message}`
      );
    }

    return {
      objectCount: objectsMap.size,
      totalBytes,
      objectsMap,
    };
  }

  /**
   * Obtém os metadados de cabeçalho e calcula SHA-256 via streaming read-only se o objeto já existir
   */
  async inspectExistingDestinationObject(bucketName, key) {
    if (this.adapter) {
      return await this.adapter.getObjectDetails(bucketName, key);
    }

    // 1. HeadObject para contentType e size
    let headRes;
    try {
      headRes = await this.s3Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }));
    } catch (err) {
      throw new SyncProtocolError(
        "destination_head_failed",
        `Falha no HeadObject para ${key}: ${err.message}`
      );
    }

    const size = Number(headRes.ContentLength || 0);
    const contentType = headRes.ContentType ? headRes.ContentType.toLowerCase().split(";")[0].trim() : null;

    // 2. GetObject stream para cálculo de SHA-256 local (sem confiar em ETag multipart)
    let getRes;
    try {
      getRes = await this.s3Client.send(new GetObjectCommand({ Bucket: bucketName, Key: key }));
    } catch (err) {
      throw new SyncProtocolError(
        "destination_get_failed",
        `Falha no GetObject para cálculo de SHA-256 de ${key}: ${err.message}`
      );
    }

    const chunks = [];
    for await (const chunk of getRes.Body) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    const calculatedHash = sha256(buffer);

    return {
      size,
      contentType,
      sha256: calculatedHash,
    };
  }

  /**
   * Executa a classificação de Dry-Run dos 147 objetos
   */
  async executeDryRun(manifest) {
    const bucketName = this.config.bucketName || "haxr-wedding-photos";
    const destInventory = await this.fetchLiveDestinationInventory(bucketName);

    // Detecção de colisão interna do manifest
    const collisions = detectInventoryCollisions(manifest.items);
    if (collisions.length > 0) {
      throw new SyncProtocolError(
        "manifest_collisions_detected",
        `Colisões detectadas no manifest: ${JSON.stringify(collisions)}`
      );
    }

    // Deteção de objetos inesperados no bucket de destino (fora do manifest)
    const manifestPathSet = new Set(manifest.items.map((i) => i.storage_path));
    const unexpectedDestinationKeys = [];
    for (const [key] of destInventory.objectsMap) {
      if (!manifestPathSet.has(key)) {
        unexpectedDestinationKeys.push(key);
      }
    }

    let countWouldCopy = 0;
    let countWouldSkipIdentical = 0;
    let countWouldBlock = 0;

    const classifiedObjects = [];
    const blockedReasons = [];

    for (const item of manifest.items) {
      const destObj = destInventory.objectsMap.get(item.storage_path);

      if (!destObj) {
        // Objeto não existe no destino -> WOULD_COPY
        countWouldCopy += 1;
        classifiedObjects.push({
          storage_path: item.storage_path,
          size_bytes: item.size_bytes,
          content_type: item.content_type,
          sha256: item.sha256,
          classification: "WOULD_COPY",
        });
      } else {
        // Objeto existe no destino -> comparar deterministamente
        let destinationDetails;
        try {
          destinationDetails = await this.inspectExistingDestinationObject(bucketName, item.storage_path);
        } catch (err) {
          countWouldBlock += 1;
          blockedReasons.push({
            path: item.storage_path,
            reason: `INSPECTION_FAILED: ${err.message}`,
          });
          classifiedObjects.push({
            storage_path: item.storage_path,
            size_bytes: item.size_bytes,
            content_type: item.content_type,
            sha256: item.sha256,
            classification: "WOULD_BLOCK",
          });
          continue;
        }

        const sizeMatches = destinationDetails.size === item.size_bytes;
        const mimeMatches = destinationDetails.contentType === item.content_type;
        const hashMatches = destinationDetails.sha256 === item.sha256;

        if (sizeMatches && mimeMatches && hashMatches) {
          countWouldSkipIdentical += 1;
          classifiedObjects.push({
            storage_path: item.storage_path,
            size_bytes: item.size_bytes,
            content_type: item.content_type,
            sha256: item.sha256,
            classification: "WOULD_SKIP_IDENTICAL",
          });
        } else {
          countWouldBlock += 1;
          const diffs = [];
          if (!sizeMatches) diffs.push(`SIZE_MISMATCH: expected ${item.size_bytes}, got ${destinationDetails.size}`);
          if (!mimeMatches) diffs.push(`MIME_MISMATCH: expected ${item.content_type}, got ${destinationDetails.contentType}`);
          if (!hashMatches) diffs.push(`HASH_MISMATCH: expected ${item.sha256}, got ${destinationDetails.sha256}`);

          blockedReasons.push({
            path: item.storage_path,
            reason: diffs.join("; "),
          });
          classifiedObjects.push({
            storage_path: item.storage_path,
            size_bytes: item.size_bytes,
            content_type: item.content_type,
            sha256: item.sha256,
            classification: "WOULD_BLOCK",
          });
        }
      }
    }

    // Ordenação determinística estrita por storage_path ASC
    classifiedObjects.sort((a, b) => a.storage_path.localeCompare(b.storage_path));

    // Cálculo do dryRunChecksum canónico
    const canonicalJson = JSON.stringify(classifiedObjects);
    const dryRunChecksum = sha256(canonicalJson);

    return {
      gate: "GATE_3F-B",
      runTimestamp: new Date().toISOString(),
      sourceObjectCount: manifest.itemCount,
      sourceTotalBytes: manifest.totalBytes,
      sourceInventoryChecksum: GATE_3D_BASELINE_PIN.sourceInventoryChecksum,
      manifestChecksum: manifest.manifestChecksum,
      destinationBucket: bucketName,
      destinationObjectCountBefore: destInventory.objectCount,
      destinationTotalBytesBefore: destInventory.totalBytes,
      destinationDriftDetected: destInventory.objectCount !== 0 || destInventory.totalBytes !== 0,
      classificationCounts: {
        WOULD_COPY: countWouldCopy,
        WOULD_SKIP_IDENTICAL: countWouldSkipIdentical,
        WOULD_BLOCK: countWouldBlock,
      },
      collisionCount: collisions.length,
      unexpectedDestinationObjectCount: unexpectedDestinationKeys.length,
      unexpectedDestinationKeys,
      blockedReasons,
      dryRunChecksum,
      classifiedObjects,
    };
  }
}
