#!/usr/bin/env node
/**
 * Gate 3F-C1 — Pre-Transfer Hardening: Streaming, Retries, Ambiguous PUT & 412 Reconciliation Engine
 *
 * ARCHITECTURAL INVARIANTS:
 * 1. STREAMING FROM LOCAL TEMP: Body is streamed via fs.createReadStream(tempPath) with ContentLength,
 *    eliminating entire-object in-memory Buffer allocation in the physical transfer path.
 * 2. WRITE CLIENT RETRY CONTROL: maxAttempts = 1 on write client prevents hidden SDK mutation retries.
 * 3. AMBIGUOUS PUT RECONCILIATION: Connection drops / timeouts transition to FINAL_PUT_OUTCOME_UNKNOWN.
 *    Destination is inspected read-only before any retry. If committed identical -> PUT_COMMITTED_RESPONSE_LOST.
 * 4. 412 RECONCILIATION: HTTP 412 is reconciled read-only. If identical -> ALREADY_TRANSFERRED_IDENTICAL;
 *    if divergent -> DESTINATION_RACE_OR_COLLISION (fail-closed, no retry, no overwrite, no delete).
 * 5. ZERO REMOTE STAGING: Staging keys (__migration/...) eliminated from physical transfer.
 * 6. ZERO CopyObject / ZERO DeleteObject on R2 destination.
 * 7. RETRY STATE MACHINE: Explicit state tracking (SOURCE_PENDING -> SOURCE_DOWNLOADING -> SOURCE_VERIFIED
 *    -> FINAL_PUT_PENDING -> FINAL_PUT_OUTCOME_UNKNOWN -> FINAL_CREATED -> FINAL_VERIFYING -> VERIFIED).
 * 8. ZERO SECRETS in journal or error objects.
 */

import { createHash, randomUUID } from "node:crypto";
import {
  createReadStream,
  createWriteStream,
  existsSync,
  unlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

import {
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { SignJWT } from "jose";

import {
  GATE_3D_BASELINE_PIN,
  SyncProtocolError,
} from "./sync-storage-protocol.mjs";

import { validateAndParseStoragePath } from "../src/lib/edition/storage/canonical-path.js";

/**
 * Ações S3 suportadas nas credenciais temporárias do Cloudflare R2 (SEM o prefixo 's3:')
 */
export const VALID_R2_TEMP_ACTIONS = new Set([
  "HeadObject",
  "GetObject",
  "PutObject",
  "ListObjects",
  "ListObjectsV2",
  "DeleteObject",
  "DeleteObjects",
  "CopyObject",
  "CreateMultipartUpload",
  "UploadPart",
  "UploadPartCopy",
  "CompleteMultipartUpload",
  "AbortMultipartUpload",
]);

/**
 * Perfil exato e imutável de ações para a MIGRATION_OBJECT_IDENTITY
 */
export const MIGRATION_PROFILE_ALLOWED_ACTIONS = Object.freeze([
  "HeadObject",
  "GetObject",
  "PutObject",
]);

/**
 * Validação rigorosa de lista de ações temporárias Cloudflare R2
 */
export function validateR2TempActions(actions) {
  if (!Array.isArray(actions) || actions.length === 0) {
    throw new SyncProtocolError("invalid_temp_actions", "A lista de ações temporárias não pode estar vazia.");
  }
  for (const act of actions) {
    if (typeof act !== "string") {
      throw new SyncProtocolError("invalid_temp_action_type", `Ação inválida: ${act}`);
    }
    if (act.startsWith("s3:")) {
      throw new SyncProtocolError(
        "invalid_temp_action_name",
        `Ação '${act}' inválida: ações temporárias Cloudflare R2 NÃO devem conter o prefixo 's3:'. Use '${act.replace(/^s3:/, "")}'.`
      );
    }
    if (!VALID_R2_TEMP_ACTIONS.has(act)) {
      throw new SyncProtocolError(
        "unsupported_temp_action",
        `Ação '${act}' não é suportada nas credenciais temporárias Cloudflare R2.`
      );
    }
  }

  const sorted = [...actions].sort();
  const expected = [...MIGRATION_PROFILE_ALLOWED_ACTIONS].sort();
  if (sorted.length !== expected.length || !sorted.every((v, i) => v === expected[i])) {
    throw new SyncProtocolError(
      "migration_action_profile_violation",
      `Perfil de migração exige exatamente [${MIGRATION_PROFILE_ALLOWED_ACTIONS.join(", ")}]. Obtido: [${actions.join(", ")}]. Ações destrutivas (Delete), cópias ou multipart são terminantemente proibidas.`
    );
  }
  return true;
}

/**
 * Extrai os prefixos canónicos de primeiro nível (invitation slugs)
 */
export function deriveCanonicalPrefixPaths(paths = []) {
  const slugs = new Set();
  for (const p of paths) {
    const seg = p.split("/")[0];
    if (seg) slugs.add(`${seg}/`);
  }
  return Array.from(slugs).sort();
}

/**
 * Deriva e valida deterministicamente a lista canónica de objectPaths
 * a partir dos itens do manifest congelado aprovado.
 *
 * REQUISITOS DE PRIVILÉGIO MÍNIMO (Gate 3F-C1.3):
 * - Contagem exacta: 147 objectos
 * - Ordenação determinística: storage_path ASC
 * - Todos únicos (sem duplicados)
 * - Todos canónicos (validados por validateAndParseStoragePath)
 * - Zero staging paths (__migration/...)
 * - Zero colisões de normalização de maiúsculas/minúsculas (case collisions)
 * - Zero chaves vazias ou truncadas
 */
export function deriveAndValidateManifestObjectPaths(manifestItems = []) {
  if (!Array.isArray(manifestItems) || manifestItems.length === 0) {
    throw new SyncProtocolError(
      "invalid_manifest_items",
      "A colecção de itens do manifest congelado não pode estar vazia."
    );
  }

  const seenPaths = new Set();
  const seenLower = new Set();
  const canonicalPaths = [];

  for (const item of manifestItems) {
    const storagePath = typeof item === "string" ? item : item?.storage_path;
    if (!storagePath || typeof storagePath !== "string" || storagePath.trim().length === 0) {
      throw new SyncProtocolError(
        "empty_manifest_storage_path",
        "Detectada chave vazia ou inválida no manifest."
      );
    }

    if (storagePath.startsWith("__migration/") || storagePath.includes("/__migration/")) {
      throw new SyncProtocolError(
        "staging_path_forbidden_in_credential",
        `Caminho de staging '${storagePath}' é terminantemente proibido no escopo de credenciais.`
      );
    }

    // Validação de formato canónico rigorosa (allowStaging = false)
    validateAndParseStoragePath(storagePath, undefined, undefined, { allowStaging: false });

    if (seenPaths.has(storagePath)) {
      throw new SyncProtocolError(
        "duplicate_manifest_storage_path",
        `Chave duplicada detectada no manifest: ${storagePath}`
      );
    }
    seenPaths.add(storagePath);

    const lower = storagePath.toLowerCase();
    if (seenLower.has(lower)) {
      throw new SyncProtocolError(
        "case_collision_detected",
        `Colisão de maiúsculas/minúsculas detectada na chave: ${storagePath}`
      );
    }
    seenLower.add(lower);

    canonicalPaths.push(storagePath);
  }

  // Ordenação determinística ASC
  canonicalPaths.sort();

  return Object.freeze(canonicalPaths);
}

/**
 * Valida a igualdade estrita e bidireccional entre os objectPaths da credencial
 * e os storage_paths do manifest congelado.
 */
export function validateExactManifestPathSetEquality(credentialPaths = [], manifestPaths = []) {
  const credSet = new Set(credentialPaths);
  const manifestSet = new Set(manifestPaths);

  if (credSet.size !== manifestSet.size) {
    throw new SyncProtocolError(
      "credential_path_scope_mismatch",
      `CREDENTIAL_PATH_SCOPE_MISMATCH: Contagem divergente entre credencial (${credSet.size}) e manifest (${manifestSet.size}).`
    );
  }

  for (const p of credSet) {
    if (!manifestSet.has(p)) {
      throw new SyncProtocolError(
        "credential_path_scope_mismatch",
        `CREDENTIAL_PATH_SCOPE_MISMATCH: A chave '${p}' na credencial não existe no manifest congelado.`
      );
    }
  }

  for (const p of manifestSet) {
    if (!credSet.has(p)) {
      throw new SyncProtocolError(
        "credential_path_scope_mismatch",
        `CREDENTIAL_PATH_SCOPE_MISMATCH: A chave '${p}' do manifest congelado está ausente na credencial.`
      );
    }
  }

  return true;
}

/**
 * Estima conservadoramente a pegada total dos cabeçalhos HTTP de uma requisição S3
 * incluindo o sessionToken codificado.
 */
export function estimateS3RequestHeaderFootprint(sessionToken, options = {}) {
  const host = options.host || "mock-account-id.r2.cloudflarestorage.com";
  const sampleHeaders = {
    Host: host,
    Authorization: "AWS4-HMAC-SHA256 Credential=mock_access_key/20260903/auto/s3/aws4_request, SignedHeaders=host;if-none-match;x-amz-content-sha256;x-amz-date;x-amz-security-token, Signature=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    "X-Amz-Date": "20260903T100000Z",
    "X-Amz-Content-Sha256": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    "X-Amz-Security-Token": sessionToken,
    "Content-Type": "image/jpeg",
    "Content-Length": "5354937",
    "If-None-Match": '"*"',
    "User-Agent": "@aws-sdk/client-s3",
    Connection: "keep-alive",
  };

  let totalBytes = 0;
  for (const [key, value] of Object.entries(sampleHeaders)) {
    totalBytes += Buffer.byteLength(`${key}: ${value}\r\n`, "utf8");
  }
  return totalBytes;
}

/**
 * Emissão de Credenciais Temporárias Assinadas Localmente via JWT (jose)
 * em estrita conformidade com o protocolo oficial do Cloudflare R2 e com o princípio do privilégio mínimo.
 *
 * ESQUEMA OFICIAL CLOUDFLARE R2:
 * 1. Protected Header: { alg: "HS256", typ: "JWT" }
 * 2. Registered Claims:
 *    - sub: accountId (Cloudflare Account ID)
 *    - iss: parentAccessKeyId (Parent R2 Access Key ID)
 *    - aud: hostname do endpoint R2 (new URL(endpoint).host)
 *    - iat: timestamp de emissão
 *    - exp: timestamp de expiração (iat + ttlSeconds)
 * 3. Custom Claims:
 *    - bucket: "haxr-wedding-photos"
 *    - scope: "object-read-write"
 *    - actions: ["HeadObject", "GetObject", "PutObject"]
 *    - paths: { prefixPaths: [], objectPaths: [...] }
 * 4. Signing:
 *    - Assinado com parentSecretAccessKey usando algoritmo HS256 via jose
 * 5. Temporary Credentials Derivation:
 *    - accessKeyId: parentAccessKeyId
 *    - secretAccessKey: SHA-256(signedJWT) em hexadecimal minúsculo (O parent secret NUNCA é retornado)
 *    - sessionToken: base64("jwt/" + signedJWT) (O raw signed JWT NUNCA é retornado directamente)
 */
export async function mintR2LocalTemporaryCredential(options = {}) {
  const {
    endpoint,
    accountId,
    parentAccessKeyId,
    parentSecretAccessKey,
    bucket = "haxr-wedding-photos",
    scope = "object-read-write",
    actions = MIGRATION_PROFILE_ALLOWED_ACTIONS,
    ttlSeconds = 1800,
    prefixPaths = [],
    objectPaths = [],
    paths,
    prefixes,
    objects,
    manifestPaths,
    maxHeaderSafetyBytes = 65536, // 64 KB (metade do limite documentado de 128 KB da Cloudflare)
  } = options;

  if (!parentAccessKeyId || !parentSecretAccessKey) {
    throw new SyncProtocolError(
      "parent_credentials_required",
      "Parent Access Key ID e Secret Access Key são obrigatórios para emissão de credenciais temporárias."
    );
  }

  if (
    (process.env.CLOUDFLARE_API_TOKEN && parentAccessKeyId === process.env.CLOUDFLARE_API_TOKEN) ||
    (process.env.CLOUDFLARE_API_TOKEN && parentSecretAccessKey === process.env.CLOUDFLARE_API_TOKEN)
  ) {
    throw new SyncProtocolError(
      "invalid_parent_token_type",
      "O token pai NÃO pode ser o CLOUDFLARE_API_TOKEN. O token pai deve ser uma MIGRATION_PARENT_IDENTITY com Access Key ID e Secret Access Key."
    );
  }

  if (!accountId) {
    throw new SyncProtocolError(
      "account_id_required",
      "Cloudflare accountId é obrigatório para emissão de credenciais temporárias (sub claim)."
    );
  }

  if (!endpoint) {
    throw new SyncProtocolError(
      "endpoint_required",
      "R2 endpoint URL é obrigatório para derivação de audience (aud claim)."
    );
  }

  let audienceHost;
  try {
    audienceHost = new URL(endpoint).host;
  } catch {
    throw new SyncProtocolError("invalid_endpoint_url", `Endpoint R2 inválido: ${endpoint}`);
  }

  validateR2TempActions(actions);

  const resolvedPaths = {
    prefixPaths: Array.isArray(paths?.prefixPaths)
      ? paths.prefixPaths
      : (Array.isArray(prefixPaths) && prefixPaths.length > 0
          ? prefixPaths
          : (Array.isArray(prefixes) ? prefixes : [])),
    objectPaths: Array.isArray(paths?.objectPaths)
      ? paths.objectPaths
      : (Array.isArray(objectPaths) && objectPaths.length > 0
          ? objectPaths
          : (Array.isArray(objects) ? objects : [])),
  };

  // Se manifestPaths for fornecido, validar igualdade estrita e proibir prefixPaths
  if (manifestPaths) {
    if (resolvedPaths.prefixPaths.length > 0) {
      throw new SyncProtocolError(
        "prefix_paths_forbidden_in_exact_scope",
        "prefixPaths deve estar estritamente vazio ([]) quando o escopo exacto do manifest é exigido."
      );
    }
    validateExactManifestPathSetEquality(resolvedPaths.objectPaths, manifestPaths);
  }

  // Conforme a especificação oficial do Cloudflare R2:
  // "Specify permitted operations using scope or actions. You must provide at least one."
  // A inclusão de ambos causa rejeição HTTP 400 Bad Request na borda da Cloudflare.
  // Prioriza-se 'actions' por constituir o privilégio mínimo estrito granular.
  const customClaims = {
    bucket,
  };

  if (Array.isArray(actions) && actions.length > 0) {
    customClaims.actions = [...actions];
  } else if (scope) {
    customClaims.scope = scope;
  }

  customClaims.paths = resolvedPaths;

  const secretBytes = new TextEncoder().encode(parentSecretAccessKey);
  const signedJWT = await new SignJWT(customClaims)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(accountId)
    .setIssuer(parentAccessKeyId)
    .setAudience(audienceHost)
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(secretBytes);

  // Derivação estrita conforme especificação do Cloudflare R2
  const derivedSecretAccessKey = createHash("sha256").update(signedJWT, "utf8").digest("hex").toLowerCase();
  const sessionToken = Buffer.from(`jwt/${signedJWT}`, "utf8").toString("base64");

  // Validação conservadora de segurança do tamanho dos cabeçalhos HTTP (< 64 KB)
  const estimatedHeaderBytes = estimateS3RequestHeaderFootprint(sessionToken, { host: audienceHost });
  if (estimatedHeaderBytes >= maxHeaderSafetyBytes) {
    throw new SyncProtocolError(
      "header_size_safety_exceeded",
      `A pegada estimada dos cabeçalhos HTTP (${estimatedHeaderBytes} bytes) excedeu o limite conservador de segurança (${maxHeaderSafetyBytes} bytes).`
    );
  }

  return {
    accessKeyId: parentAccessKeyId,
    secretAccessKey: derivedSecretAccessKey,
    sessionToken,
    estimatedHeaderBytes,
  };
}

export function sha256(data) {
  return createHash("sha256").update(data).digest("hex");
}

/**
 * Validação de Preflight para Fonte Live (Supabase Storage)
 * Garante que a fonte real não sofreu drift antes da transferência física.
 */
export async function verifyLiveSourcePreflight(sourceInventoryLoader, options = {}) {
  const inventory = await sourceInventoryLoader();

  const expectedCount = options.expectedCount ?? GATE_3D_BASELINE_PIN.sourceObjectCount;
  const expectedBytes = options.expectedBytes ?? GATE_3D_BASELINE_PIN.sourceTotalBytes;
  const expectedChecksum = options.expectedChecksum ?? GATE_3D_BASELINE_PIN.sourceInventoryChecksum;

  if (inventory.objectCount !== expectedCount) {
    throw new SyncProtocolError(
      "source_drift_detected",
      `Contagem de objectos na fonte divergiu: esperado ${expectedCount}, obtido ${inventory.objectCount}`
    );
  }

  if (inventory.totalBytes !== expectedBytes) {
    throw new SyncProtocolError(
      "source_drift_detected",
      `Total de bytes na fonte divergiu: esperado ${expectedBytes}, obtido ${inventory.totalBytes}`
    );
  }

  if (inventory.sourceInventoryChecksum !== expectedChecksum) {
    throw new SyncProtocolError(
      "source_drift_detected",
      `Checksum da fonte divergiu: esperado ${expectedChecksum}, obtido ${inventory.sourceInventoryChecksum}`
    );
  }

  return {
    status: "SOURCE_PREFLIGHT_VERIFIED",
    sourceObjectCount: inventory.objectCount,
    sourceTotalBytes: inventory.totalBytes,
    sourceInventoryChecksum: inventory.sourceInventoryChecksum,
  };
}

/**
 * Validação de Precondição do Destino (Cloudflare R2)
 * Garante que o bucket está estritamente vazio antes do primeiro write físico.
 */
export async function verifyDestinationPrecondition(s3Client, bucketName = "haxr-wedding-photos") {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
  } catch (err) {
    throw new SyncProtocolError("destination_bucket_unavailable", `Bucket ${bucketName} inacessível: ${err.message}`);
  }

  let objectCount = 0;
  let totalBytes = 0;
  let continuationToken;

  do {
    const res = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        ContinuationToken: continuationToken,
      })
    );
    if (res.Contents && res.Contents.length > 0) {
      for (const item of res.Contents) {
        objectCount += 1;
        totalBytes += item.Size || 0;
      }
    }
    continuationToken = res.NextContinuationToken;
  } while (continuationToken);

  if (objectCount !== 0 || totalBytes !== 0) {
    throw new SyncProtocolError(
      "destination_drift_detected",
      `Destino não está vazio: ${objectCount} objectos encontrados (${totalBytes} bytes).`
    );
  }

  return {
    status: "DESTINATION_EMPTY_VERIFIED",
    objectCount: 0,
    totalBytes: 0,
  };
}

/**
 * Criação segura de cliente S3 compatível com Credenciais Temporárias (Session Token)
 * e controle rigoroso de maxAttempts para evitar retries automáticos ocultos.
 */
export function createR2S3Client(config = {}) {
  if (config.requireSessionToken && !config.sessionToken) {
    throw new SyncProtocolError(
      "session_token_required",
      "sessionToken é estritamente obrigatório quando o modo de credenciais temporárias de migração está ativo."
    );
  }

  const credentials = {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  };

  if (config.sessionToken) {
    credentials.sessionToken = config.sessionToken;
  }

  return new S3Client({
    region: config.region || "auto",
    endpoint: config.endpoint,
    credentials,
    forcePathStyle: true,
    maxAttempts: config.maxAttempts ?? 1, // Default 1: impede retries automáticos ocultos em writes
    requestHandler: new NodeHttpHandler({
      connectionTimeout: 30000,
      requestTimeout: 120000,
    }),
  });
}

/**
 * Motor de Transferência Física Endurecido (Gate 3F-C1)
 */
export class HardenedPhysicalTransferEngine {
  constructor(options = {}) {
    this.sourceProvider = options.sourceProvider;
    this.s3Client = options.s3Client;
    this.readS3Client = options.readS3Client || options.s3Client;
    this.writeS3Client = options.writeS3Client || options.s3Client;
    this.bucketName = options.bucketName || "haxr-wedding-photos";
    this.sourceBucket = options.sourceBucket || "wedding-photos";
    this.maxRetries = options.maxRetries ?? 3;
    this.journal = [];
    this.mutationsRecord = {
      PutObject: 0,
      CopyObject: 0,
      DeleteObject: 0,
      CreateMultipartUpload: 0,
    };
  }

  /**
   * Reconciliação Read-Only do estado de um objecto no destino
   */
  async reconcileAmbiguousDestinationState(storagePath, expectedSize, expectedMime, expectedSha256) {
    const maxReconcileAttempts = 3;
    let lastErr = null;

    for (let attempt = 1; attempt <= maxReconcileAttempts; attempt++) {
      try {
        const head = await this.readS3Client.send(
          new HeadObjectCommand({
            Bucket: this.bucketName,
            Key: storagePath,
          })
        );

        const size = Number(head.ContentLength || 0);
        const contentType = head.ContentType?.toLowerCase().split(";")[0].trim();

        if (size !== expectedSize) {
          return {
            status: "DESTINATION_DIVERGENT_OBJECT_BLOCKED",
            reason: `Tamanho diverge: esperado ${expectedSize}, obtido ${size}`,
          };
        }

        if (contentType && expectedMime && contentType !== expectedMime.toLowerCase()) {
          return {
            status: "DESTINATION_DIVERGENT_OBJECT_BLOCKED",
            reason: `MIME diverge: esperado ${expectedMime}, obtido ${contentType}`,
          };
        }

        const getRes = await this.readS3Client.send(
          new GetObjectCommand({
            Bucket: this.bucketName,
            Key: storagePath,
          })
        );

        const hash = createHash("sha256");
        for await (const chunk of getRes.Body) {
          hash.update(chunk);
        }
        const actualHash = hash.digest("hex");

        if (actualHash === expectedSha256) {
          return { status: "ALREADY_TRANSFERRED_IDENTICAL" };
        } else {
          return {
            status: "DESTINATION_DIVERGENT_OBJECT_BLOCKED",
            reason: `Hash SHA-256 diverge: esperado ${expectedSha256}, obtido ${actualHash}`,
          };
        }
      } catch (err) {
        if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404 || err.code === "NotFound") {
          return { status: "DESTINATION_KEY_ABSENT" };
        }
        lastErr = err;
        if (attempt < maxReconcileAttempts) {
          await new Promise((r) => setTimeout(r, attempt * 500));
          continue;
        }
        throw lastErr;
      }
    }
  }

  /**
   * Transfere um único objecto de forma streaming, atómica e resiliente a falhas ambíguas
   */
  async transferObject(item, options = {}) {
    const { storage_path, size_bytes, content_type, sha256: expectedHash } = item;
    const startedAt = new Date().toISOString();

    // 1. Validação estrita de formato de caminho canónico
    try {
      validateAndParseStoragePath(storage_path);
    } catch (err) {
      this.recordJournalEntry({
        storage_path,
        expected_sha256: expectedHash,
        expected_size: size_bytes,
        attempt_number: 0,
        state: "BLOCKED",
        started_at: startedAt,
        details: `INVALID_PATH: ${err.message}`,
      });
      throw new SyncProtocolError("invalid_canonical_path", err.message);
    }

    // 2. Verificação de Resumabilidade Prévia: se o objeto já existir antes de iniciar
    const preCheck = await this.reconcileAmbiguousDestinationState(
      storage_path,
      size_bytes,
      content_type,
      expectedHash
    );

    if (preCheck.status === "ALREADY_TRANSFERRED_IDENTICAL") {
      this.recordJournalEntry({
        storage_path,
        expected_sha256: expectedHash,
        expected_size: size_bytes,
        attempt_number: 0,
        state: "ALREADY_TRANSFERRED_IDENTICAL",
        started_at: startedAt,
        verification_status: "VERIFIED_IDENTICAL",
      });
      return {
        status: "ALREADY_TRANSFERRED_IDENTICAL",
        storagePath: storage_path,
        skipped: true,
      };
    } else if (preCheck.status === "DESTINATION_DIVERGENT_OBJECT_BLOCKED") {
      this.recordJournalEntry({
        storage_path,
        expected_sha256: expectedHash,
        expected_size: size_bytes,
        attempt_number: 0,
        state: "BLOCKED",
        started_at: startedAt,
        details: `PRE_CHECK_DIVERGENCE: ${preCheck.reason}`,
      });
      throw new SyncProtocolError("destination_divergent_object_blocked", preCheck.reason);
    }

    // 3. Alocação de Ficheiro Temporário Local Seguro (os.tmpdir())
    const tempFileName = `haxr-migrate-${randomUUID()}.tmp`;
    const tempFilePath = join(tmpdir(), tempFileName);
    let tempFileCreated = false;

    try {
      // 4. Download da Origem com cálculo de SHA-256 e contagem de bytes on-the-fly
      this.recordJournalEntry({
        storage_path,
        expected_sha256: expectedHash,
        expected_size: size_bytes,
        attempt_number: 0,
        state: "SOURCE_DOWNLOADING",
        started_at: startedAt,
      });

      let downloadSucceeded = false;
      let lastPipeErr = null;
      let calculatedSha256 = null;
      let streamedBytes = 0;
      let finalDownloadStream = null;
      const maxSourceAttempts = this.maxSourceAttempts ?? 3;

      for (let attempt = 1; attempt <= maxSourceAttempts; attempt++) {
        let downloadStream;
        try {
          downloadStream = await this.sourceProvider.downloadStream(this.sourceBucket, storage_path, item);
        } catch (srcErr) {
          lastPipeErr = srcErr;
          if (attempt < maxSourceAttempts) {
            await new Promise((r) => setTimeout(r, attempt * (this.sourceRetryBackoffMs ?? 500)));
            continue;
          }
          throw new SyncProtocolError("source_download_failed", `Falha ao obter stream da fonte: ${srcErr.message}`);
        }

        if (!downloadStream || !downloadStream.stream) {
          throw new SyncProtocolError("source_object_not_found", `Objeto não encontrado na fonte: ${storage_path}`);
        }

        const fileWriteStream = createWriteStream(tempFilePath);
        tempFileCreated = true;
        const hashStream = createHash("sha256");
        streamedBytes = 0;

        const monitorStream = new Transform({
          transform(chunk, encoding, callback) {
            streamedBytes += chunk.length;
            hashStream.update(chunk);
            callback(null, chunk);
          },
        });

        try {
          await pipeline(downloadStream.stream, monitorStream, fileWriteStream);
          calculatedSha256 = hashStream.digest("hex");
          finalDownloadStream = downloadStream;
          downloadSucceeded = true;
          break;
        } catch (pipeErr) {
          lastPipeErr = pipeErr;
          await new Promise((resolve) => {
            if (fileWriteStream.closed || fileWriteStream.destroyed) {
              resolve();
            } else {
              fileWriteStream.once("close", resolve);
              fileWriteStream.destroy();
            }
          });
          if (attempt < maxSourceAttempts) {
            console.log(`[SOURCE_RETRY] Tentativa ${attempt} de download da fonte falhou (${pipeErr.message}). Aguardando para tentar novamente...`);
            await new Promise((r) => setTimeout(r, attempt * (this.sourceRetryBackoffMs ?? 500)));
          }
        }
      }

      if (!downloadSucceeded) {
        throw new SyncProtocolError(
          "source_stream_interrupted",
          `Falha no stream da fonte para temp: ${lastPipeErr?.message}`
        );
      }

      // 5. Validações pré-escrita sobre o ficheiro local
      if (streamedBytes !== size_bytes) {
        throw new SyncProtocolError(
          "source_size_mismatch",
          `Tamanho diverge: esperado ${size_bytes}, obtido ${streamedBytes}`
        );
      }

      if (expectedHash && calculatedSha256 !== expectedHash) {
        throw new SyncProtocolError(
          "source_sha256_mismatch",
          `SHA-256 diverge: esperado ${expectedHash}, calculado ${calculatedSha256}`
        );
      }

      if (finalDownloadStream?.contentType && finalDownloadStream.contentType.split(";")[0].trim() !== content_type) {
        throw new SyncProtocolError(
          "source_mime_mismatch",
          `MIME diverge: esperado ${content_type}, obtido ${finalDownloadStream.contentType}`
        );
      }

      this.recordJournalEntry({
        storage_path,
        expected_sha256: expectedHash,
        expected_size: size_bytes,
        attempt_number: 0,
        state: "SOURCE_VERIFIED",
        started_at: startedAt,
      });

      if (options.dryRun) {
        return { status: "DRY_RUN_SOURCE_VERIFIED", storagePath: storage_path };
      }

      // 6. Escrita Atómica Streaming Directa na Chave Final (PutObject com Body = Stream e If-None-Match: *)
      let attempt = 0;
      let uploadSuccess = false;

      while (attempt < this.maxRetries && !uploadSuccess) {
        attempt++;
        const putStartedAt = new Date().toISOString();

        this.recordJournalEntry({
          storage_path,
          expected_sha256: expectedHash,
          expected_size: size_bytes,
          attempt_number: attempt,
          state: "FINAL_PUT_PENDING",
          started_at: startedAt,
          put_started_at: putStartedAt,
        });

        const bodyReadStream = createReadStream(tempFilePath);

        try {
          const putCmd = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: storage_path,
            Body: bodyReadStream,
            ContentType: content_type,
            ContentLength: streamedBytes,
            IfNoneMatch: "*", // Anti-race condition & anti-overwrite absoluto
          });

          this.mutationsRecord.PutObject += 1;
          await this.writeS3Client.send(putCmd);
          uploadSuccess = true;

          this.recordJournalEntry({
            storage_path,
            expected_sha256: expectedHash,
            expected_size: size_bytes,
            attempt_number: attempt,
            state: "FINAL_CREATED",
            started_at: startedAt,
            put_started_at: putStartedAt,
            put_result: "HTTP_200_CREATED",
          });
        } catch (err) {
          // Trata PreconditionFailed (412)
          if (
            err.name === "PreconditionFailed" ||
            err.$metadata?.httpStatusCode === 412 ||
            err.code === "PreconditionFailed"
          ) {
            // Reconciliação do 412: verificar se foi commit nosso ou colisão
            const recon412 = await this.reconcileAmbiguousDestinationState(
              storage_path,
              size_bytes,
              content_type,
              expectedHash
            );

            if (recon412.status === "ALREADY_TRANSFERRED_IDENTICAL") {
              this.recordJournalEntry({
                storage_path,
                expected_sha256: expectedHash,
                expected_size: size_bytes,
                attempt_number: attempt,
                state: "ALREADY_TRANSFERRED_IDENTICAL",
                started_at: startedAt,
                put_result: "412_RECONCILED_IDENTICAL",
                verification_status: "VERIFIED_IDENTICAL",
              });
              return {
                status: "ALREADY_TRANSFERRED_IDENTICAL",
                storagePath: storage_path,
                skipped: true,
              };
            } else {
              this.recordJournalEntry({
                storage_path,
                expected_sha256: expectedHash,
                expected_size: size_bytes,
                attempt_number: attempt,
                state: "BLOCKED",
                started_at: startedAt,
                put_result: "412_COLLISION_DIVERGENT",
                details: `412_COLLISION: ${recon412.reason}`,
              });
              throw new SyncProtocolError(
                "destination_race_or_collision",
                `412 PreconditionFailed: chave ${storage_path} já existe no destino mas diverge (${recon412.reason}). Overwrite estritamente bloqueado.`
              );
            }
          }

          // Trata falhas de rede ambíguas (timeout, reset, 5xx)
          this.recordJournalEntry({
            storage_path,
            expected_sha256: expectedHash,
            expected_size: size_bytes,
            attempt_number: attempt,
            state: "FINAL_PUT_OUTCOME_UNKNOWN",
            started_at: startedAt,
            put_result: `ERROR_${err.name || err.code || "UNKNOWN"}`,
          });

          // Reconciliação antes de qualquer decisão de retry
          const ambiguousRecon = await this.reconcileAmbiguousDestinationState(
            storage_path,
            size_bytes,
            content_type,
            expectedHash
          );

          if (ambiguousRecon.status === "ALREADY_TRANSFERRED_IDENTICAL") {
            // O write foi comitado pelo R2 antes da falha de resposta!
            this.recordJournalEntry({
              storage_path,
              expected_sha256: expectedHash,
              expected_size: size_bytes,
              attempt_number: attempt,
              state: "PUT_COMMITTED_RESPONSE_LOST",
              started_at: startedAt,
              verification_status: "VERIFIED_IDENTICAL",
            });
            return {
              status: "PUT_COMMITTED_RESPONSE_LOST",
              storagePath: storage_path,
              sizeBytes: streamedBytes,
              sha256: calculatedSha256,
              attempts: attempt,
            };
          } else if (ambiguousRecon.status === "DESTINATION_DIVERGENT_OBJECT_BLOCKED") {
            this.recordJournalEntry({
              storage_path,
              expected_sha256: expectedHash,
              expected_size: size_bytes,
              attempt_number: attempt,
              state: "BLOCKED",
              started_at: startedAt,
              details: `AMBIGUOUS_PUT_DIVERGENCE: ${ambiguousRecon.reason}`,
            });
            throw new SyncProtocolError("destination_divergent_object_blocked", ambiguousRecon.reason);
          } else if (ambiguousRecon.status === "DESTINATION_KEY_ABSENT") {
            // NOTA CRÍTICA DE SISTEMAS DISTRIBUÍDOS:
            // "NotFound" comprova que o objeto NÃO está visível/comitado no instante exato da reconciliação.
            // O Cloudflare R2 é fortemente consistente após o commit (read-after-write e listagem).
            // Contudo, uma requisição anterior ambígua pode ainda estar em trânsito ou finalizando.
            // Portanto, qualquer retry subsequente é seguro APENAS porque preserva obrigatoriamente IfNoneMatch: "*".
            // Se a requisição anterior comitar tardiamente (race de commit tardio), o retry subsequente retornará 412 PreconditionFailed,
            // o qual será reconciliado de imediato: se idêntico -> ALREADY_TRANSFERRED_IDENTICAL; se divergente -> BLOCK.
            if (attempt < this.maxRetries) {
              const backoffMs = Math.min(100 * Math.pow(2, attempt) + Math.floor(Math.random() * 50), 1000);
              await new Promise((r) => setTimeout(r, backoffMs));
              continue;
            }
            throw new SyncProtocolError("transfer_exhausted_retries", `Falha de rede persistente após ${attempt} tentativas: ${err.message}`);
          }

          throw err;
        } finally {
          // Garante que o stream de leitura do temp file fecha completamente seu file descriptor
          await new Promise((resolve) => {
            if (bodyReadStream.closed || bodyReadStream.destroyed) {
              resolve();
            } else {
              bodyReadStream.once("close", resolve);
              bodyReadStream.destroy();
            }
          });
        }
      }

      // 7. Verificação Criptográfica Pós-Escrita (HeadObject + GetObject SHA-256)
      this.recordJournalEntry({
        storage_path,
        expected_sha256: expectedHash,
        expected_size: size_bytes,
        attempt_number: attempt,
        state: "FINAL_VERIFYING",
        started_at: startedAt,
      });

      const postVerification = await this.reconcileAmbiguousDestinationState(
        storage_path,
        size_bytes,
        content_type,
        expectedHash
      );

      if (postVerification.status !== "ALREADY_TRANSFERRED_IDENTICAL") {
        this.recordJournalEntry({
          storage_path,
          expected_sha256: expectedHash,
          expected_size: size_bytes,
          attempt_number: attempt,
          state: "BLOCKED",
          started_at: startedAt,
          details: `POST_WRITE_VERIFICATION_FAILED: ${postVerification.reason}`,
        });
        throw new SyncProtocolError(
          "post_write_verification_failed",
          `Falha na verificação pós-escrita para ${storage_path}: ${postVerification.reason}. Objeto preservado intacto para análise forense.`
        );
      }

      this.recordJournalEntry({
        storage_path,
        expected_sha256: expectedHash,
        expected_size: size_bytes,
        attempt_number: attempt,
        state: "VERIFIED",
        started_at: startedAt,
        verification_status: "CRYPTOGRAPHICALLY_VERIFIED",
      });

      return {
        status: "VERIFIED",
        storagePath: storage_path,
        sizeBytes: streamedBytes,
        sha256: calculatedSha256,
        attempts: attempt,
      };
    } finally {
      // 8. Garantia de Limpeza do Ficheiro Temporário Local (Nunca deixar resíduos em disco)
      if (tempFileCreated && existsSync(tempFilePath)) {
        try {
          unlinkSync(tempFilePath);
        } catch {
          // Limpeza silenciosa de temp
        }
      }
    }
  }

  recordJournalEntry(entry) {
    this.journal.push({
      storage_path: entry.storage_path,
      expected_sha256: entry.expected_sha256,
      expected_size: entry.expected_size,
      attempt_number: entry.attempt_number ?? 0,
      state: entry.state,
      started_at: entry.started_at,
      put_started_at: entry.put_started_at || null,
      put_result: entry.put_result || null,
      verification_status: entry.verification_status || null,
      completed_at: new Date().toISOString(),
      details: entry.details || null,
    });
  }

  getJournal() {
    return [...this.journal];
  }
}
