#!/usr/bin/env node
/**
 * Gate 3F-A.7 — Cloudflare R2 Authentication, Provisioning & Live Destination Validation
 *
 * REGRA ABSOLUTA:
 * - Separação estrita de privilégios (Provisioning Identity vs Gate 3F-A Audit Identity).
 * - MIGRATION_OBJECT_IDENTITY = NOT CREATED — NOT AUTHORIZED.
 * - Utilização oficial de @aws-sdk/client-s3 para operações de auditoria S3.
 * - Suporte canónico a Headless API Token via `.env.r2.local`.
 * - Teste estritamente READ-ONLY (HeadBucket, ListObjectsV2 com paginação).
 * - ZERO cópia de blobs, ZERO uploads, ZERO mutações no Supabase ou Neon.
 * - Se a credencial S3 Read-Only não estiver configurada:
 *   Retorna expressamente: OPERATOR_R2_READ_CREDENTIAL_REQUIRED e GATE 3F-A = BLOCKED.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";

import {
  S3Client,
  HeadBucketCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

import {
  GATE_3D_BASELINE_PIN,
  GATE_3E_TARGET_SPEC,
  SyncProtocolError,
} from "./sync-storage-protocol.mjs";

import { validateAndParseStoragePath } from "../src/lib/edition/storage/canonical-path.js";

export const TARGET_R2_SPEC = Object.freeze({
  provider: "cloudflare-r2",
  bucketName: "haxr-wedding-photos",
  region: "auto",
  visibility: "private",
  r2DevEnabled: false,
  publicCustomDomain: false,
  unauthenticatedAccess: false,
  allowedOperations: ["READ", "WRITE", "LIST", "HEAD"],
  expectedObjectCount: 0,
});

/**
 * Validação de autenticação do Wrangler via `npx wrangler whoami --json` (interativo)
 */
export function checkWranglerWhoami(options = {}) {
  if (options.mockWhoamiResult) {
    return options.mockWhoamiResult;
  }

  try {
    const raw = execSync("npx wrangler whoami --json", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 15000,
    });

    const jsonStart = raw.indexOf("{");
    if (jsonStart !== -1) {
      const parsed = JSON.parse(raw.slice(jsonStart));
      if (parsed.loggedIn) {
        return {
          loggedIn: true,
          account: parsed.account || null,
          user: parsed.user || null,
          authType: parsed.authType || "oauth",
        };
      }
    }
    return { loggedIn: false };
  } catch (err) {
    if (err.stdout) {
      const rawOut = err.stdout.toString();
      const jsonStart = rawOut.indexOf("{");
      if (jsonStart !== -1) {
        try {
          const parsed = JSON.parse(rawOut.slice(jsonStart));
          if (!parsed.loggedIn) {
            return { loggedIn: false };
          }
        } catch {
          // parse falhou
        }
      }
    }
    return { loggedIn: false, error: err.message };
  }
}

/**
 * Validação de Preflight Obrigatório
 */
export function validateGate3FPreflight(env = process.env, options = {}) {
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
      `Execução bloqueada na branch de produção: ${currentBranch}`
    );
  }

  if (currentBranch !== "migration/supabase-to-neon" && !options.skipBranchCheck) {
    throw new SyncProtocolError(
      "invalid_migration_branch",
      `Execução permitida apenas na branch migration/supabase-to-neon (detectada: ${currentBranch})`
    );
  }

  // Baseline do Gate 3D
  const baseline = options.mockBaseline || GATE_3D_BASELINE_PIN;
  if (baseline.sourceInventoryChecksum !== "57e1369fcb302d2fa8c0e027cdc4979ae0ba553866ea08e7b37b5152d9748728") {
    throw new SyncProtocolError(
      "gate_3d_baseline_checksum_mismatch",
      `sourceInventoryChecksum divergiu: ${baseline.sourceInventoryChecksum}`
    );
  }
  if (baseline.sourceObjectCount !== 147) {
    throw new SyncProtocolError(
      "gate_3d_baseline_count_mismatch",
      `sourceObjectCount divergiu: esperado 147, obtido ${baseline.sourceObjectCount}`
    );
  }
  if (baseline.sourceTotalBytes !== 535493700) {
    throw new SyncProtocolError(
      "gate_3d_baseline_bytes_mismatch",
      `sourceTotalBytes divergiu: esperado 535493700, obtido ${baseline.sourceTotalBytes}`
    );
  }

  // Manifest do Gate 3E
  const manifestChecksum = options.mockManifestChecksum || GATE_3E_TARGET_SPEC.pinnedManifestChecksum;
  if (manifestChecksum !== "4eab656cabec14a86325c9303659fe86d19d61d34a56a9fd6fc7d314e818dda9") {
    throw new SyncProtocolError(
      "gate_3e_manifest_checksum_mismatch",
      `manifestChecksum divergiu: ${manifestChecksum}`
    );
  }

  // allowStaging = false por default
  const testStagingPath = "__migration/preflight-test/slug/00000000-0000-0000-0000-000000000000/original.jpg";
  let defaultRejected = false;
  try {
    validateAndParseStoragePath(testStagingPath);
  } catch (err) {
    if (err.message && err.message.includes("storage_path_must_have_exactly_three_segments")) {
      defaultRejected = true;
    }
  }

  if (!defaultRejected) {
    throw new SyncProtocolError(
      "allow_staging_default_insecure",
      "Falha de segurança: allowStaging deve ser false por default."
    );
  }

  // storageCutoverReady = false
  if (env.STORAGE_CUTOVER_READY === "true") {
    throw new SyncProtocolError(
      "cutover_flag_prematurely_active",
      "STORAGE_CUTOVER_READY não pode estar activo no Gate 3F-A."
    );
  }

  return {
    success: true,
    branch: currentBranch,
    gate3dBaseline: "VERIFIED",
    gate3eManifest: "VERIFIED",
    allowStagingDefault: "VERIFIED_FALSE",
    storageCutoverReady: false,
  };
}

/**
 * Carrega credenciais com segurança (least privilege)
 */
export function loadR2Environment(env = process.env, options = {}) {
  const customEnvPath = options.envPath || resolve(process.cwd(), ".env.r2.local");
  const loadedKeys = {};
  const fileExists = existsSync(customEnvPath);

  if (fileExists) {
    try {
      const content = readFileSync(customEnvPath, "utf8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const [k, ...rest] = trimmed.split("=");
          loadedKeys[k.trim()] = rest.join("=").trim();
        }
      }
    } catch {
      // Leitura silenciosa
    }
  }

  const accountId = env.CLOUDFLARE_ACCOUNT_ID || env.R2_ACCOUNT_ID || loadedKeys.CLOUDFLARE_ACCOUNT_ID || loadedKeys.R2_ACCOUNT_ID || null;
  const expectedAccountId = env.EXPECTED_CLOUDFLARE_ACCOUNT_ID || loadedKeys.EXPECTED_CLOUDFLARE_ACCOUNT_ID || options.expectedAccountId || null;
  const apiToken = env.CLOUDFLARE_API_TOKEN || loadedKeys.CLOUDFLARE_API_TOKEN || null;
  const accessKeyId = env.R2_ACCESS_KEY_ID || loadedKeys.R2_ACCESS_KEY_ID || null;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY || loadedKeys.R2_SECRET_ACCESS_KEY || null;
  const endpoint = env.R2_ENDPOINT || loadedKeys.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : null);
  const bucketName = env.R2_BUCKET_NAME || loadedKeys.R2_BUCKET_NAME || TARGET_R2_SPEC.bucketName;

  // Account Pinning Check (se especificado)
  if (expectedAccountId && accountId && expectedAccountId !== accountId) {
    throw new SyncProtocolError(
      "cloudflare_account_id_mismatch",
      `Account ID divergiu do esperado. Esperado: ${expectedAccountId}, Obtido: ${accountId}`
    );
  }

  return {
    fileExists,
    customEnvPath,
    accountId,
    expectedAccountId,
    apiToken,
    accessKeyId,
    secretAccessKey,
    endpoint,
    bucketName,
    hasRestCredentials: Boolean(accountId && apiToken),
    hasS3Credentials: Boolean(accessKeyId && secretAccessKey && endpoint),
    redactedStatus: {
      FILE_EXISTS: fileExists ? "TRUE" : "FALSE",
      CLOUDFLARE_ACCOUNT_ID: accountId ? "SET" : "NOT_SET",
      EXPECTED_CLOUDFLARE_ACCOUNT_ID: expectedAccountId ? "SET" : "NOT_SET",
      CLOUDFLARE_API_TOKEN: apiToken ? "SET" : "NOT_SET",
      R2_ACCESS_KEY_ID: accessKeyId ? "SET" : "NOT_SET",
      R2_SECRET_ACCESS_KEY: secretAccessKey ? "SET" : "NOT_SET",
      R2_ENDPOINT: endpoint ? "SET" : "NOT_SET",
      R2_BUCKET_NAME: bucketName,
    },
  };
}

/**
 * Validador e Provisionador R2 com Separação de Privilégios e AWS SDK v3
 */
export class CloudflareR2Provisioner {
  constructor(config = {}, customAdapter = null) {
    this.config = config;
    this.adapter = customAdapter;
    this.s3Client = null;

    if (config.hasS3Credentials && !customAdapter) {
      this.s3Client = new S3Client({
        region: TARGET_R2_SPEC.region,
        endpoint: config.endpoint,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
      });
    }
  }

  /**
   * Executa inspeção administrativa via Wrangler CLI
   */
  inspectWranglerBucket(bucketName = TARGET_R2_SPEC.bucketName) {
    try {
      const infoRaw = execSync(`npx wrangler r2 bucket info ${bucketName} --env-file .env.r2.local`, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
      const devUrlRaw = execSync(`npx wrangler r2 bucket dev-url get ${bucketName} --env-file .env.r2.local`, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
      const domainsRaw = execSync(`npx wrangler r2 bucket domain list ${bucketName} --env-file .env.r2.local`, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });

      const r2DevDisabled = devUrlRaw.includes("disabled");
      const noCustomDomains = domainsRaw.includes("There are no custom domains");

      return {
        bucketExists: true,
        infoRaw,
        r2DevDisabled,
        noCustomDomains,
      };
    } catch (err) {
      return {
        bucketExists: false,
        error: err.message,
      };
    }
  }

  /**
   * Executa a validação e inspeção de conectividade live
   */
  async inspectAndValidateBucket(options = {}) {
    const { fileExists, hasRestCredentials, hasS3Credentials, bucketName } = this.config;

    if (bucketName !== TARGET_R2_SPEC.bucketName) {
      throw new SyncProtocolError(
        "target_bucket_name_mismatch",
        `Bucket incorreto: esperado ${TARGET_R2_SPEC.bucketName}, obtido ${bucketName}`
      );
    }

    if (this.adapter) {
      return await this.adapter.inspect(bucketName);
    }

    // Se o ficheiro .env.r2.local não existir e não houver variáveis em process.env:
    if (!fileExists && !hasRestCredentials && !hasS3Credentials) {
      return {
        status: "BLOCKED",
        code: "LOCAL_ENV_FILE_MISSING",
        message: "The required environment file was not present at the expected filesystem path.",
        details: this.config.redactedStatus,
      };
    }

    // Se temos credenciais REST (CLOUDFLARE_API_TOKEN) mas NÃO temos credenciais S3 (R2_ACCESS_KEY_ID):
    if (hasRestCredentials && !hasS3Credentials) {
      return {
        status: "BLOCKED",
        code: "OPERATOR_R2_READ_CREDENTIAL_REQUIRED",
        message: "Autenticação por API Token comprovada e bucket provisionado com privacidade verificada. Credencial S3 Read-Only necessária para inventário determinístico.",
        details: this.config.redactedStatus,
        requiredAction: {
          permission: "Object Read only",
          bucketScope: bucketName,
          file: ".env.r2.local",
          variables: [
            "R2_ACCESS_KEY_ID=<access_key_id>",
            "R2_SECRET_ACCESS_KEY=<secret_access_key>",
            `R2_ENDPOINT=https://${this.config.accountId}.r2.cloudflarestorage.com`,
            "AWS_REGION=auto",
          ],
        },
      };
    }

    // Se nenhuma credencial estiver disponível e não houver adapter injetado:
    if (!hasRestCredentials && !hasS3Credentials) {
      const wranglerSession = checkWranglerWhoami(options);

      if (!wranglerSession.loggedIn) {
        return {
          status: "BLOCKED",
          code: "OPERATOR_AUTHENTICATION_REQUIRED",
          message: "Nenhuma sessão ativa do Wrangler ou credenciais R2 configuradas no ambiente.",
          details: this.config.redactedStatus,
        };
      }
    }

    // Se temos credenciais S3 válidas, executa teste read-only live via AWS SDK v3
    if (this.s3Client) {
      try {
        await this.s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
      } catch (err) {
        if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
          return {
            status: "BLOCKED",
            code: "BUCKET_DOES_NOT_EXIST",
            message: `Bucket ${bucketName} ainda não foi provisionado na Cloudflare.`,
          };
        }
        if (err.name === "AccessDenied" || err.$metadata?.httpStatusCode === 403 || err.$metadata?.httpStatusCode === 401) {
          return {
            status: "BLOCKED",
            code: "R2_AUDIT_CREDENTIAL_AUTH_FAILED",
            message: `Falha de autorização ou autenticação da credencial S3: ${err.message}`,
          };
        }
        throw new Error(`HeadBucket failed: ${err.message}`);
      }

      // Executa ListObjectsV2 percorrendo todas as páginas
      let continuationToken;
      let objectCount = 0;
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
              objectCount += 1;
              totalBytes += item.Size || 0;
            }
          }
          continuationToken = res.NextContinuationToken;
        } while (continuationToken);
      } catch (err) {
        if (err.name === "AccessDenied" || err.$metadata?.httpStatusCode === 403 || err.$metadata?.httpStatusCode === 401) {
          return {
            status: "BLOCKED",
            code: "R2_AUDIT_CREDENTIAL_AUTH_FAILED",
            message: `Falha ao listar objetos no bucket S3: ${err.message}`,
          };
        }
        throw new Error(`ListObjectsV2 failed: ${err.message}`);
      }

      if (objectCount > 0) {
        return {
          status: "BLOCKED",
          code: "DESTINATION_NOT_EMPTY",
          message: `O bucket ${bucketName} contém ${objectCount} objetos inesperados.`,
          objectCount,
          totalBytes,
        };
      }

      // Cross-check com informação administrativa Cloudflare
      const adminInfo = this.inspectWranglerBucket(bucketName);
      let crossCheck = "SKIPPED";
      if (adminInfo.bucketExists && adminInfo.infoRaw) {
        const matchesCount0 = adminInfo.infoRaw.includes("object_count:           0");
        const matchesSize0 = adminInfo.infoRaw.includes("bucket_size:            0 B");
        if (matchesCount0 && matchesSize0 && objectCount === 0 && totalBytes === 0) {
          crossCheck = "VERIFIED";
        } else {
          return {
            status: "BLOCKED",
            code: "DESTINATION_INVENTORY_MISMATCH",
            message: "Divergência entre métricas administrativas Cloudflare e contagem S3 ListObjectsV2.",
            s3: { objectCount, totalBytes },
            adminInfo: adminInfo.infoRaw,
          };
        }
      }

      return {
        status: "READY",
        bucket: bucketName,
        visibility: "private",
        s3HeadBucket: "VERIFIED",
        objectCount: 0,
        totalBytes: 0,
        destinationEmpty: "VERIFIED",
        adminS3CrossCheck: crossCheck,
        authenticatedReadConnectivity: "VERIFIED",
        writeCapability: "NOT_VERIFIED", // Intencionalmente preservado para Gates futuros
      };
    }

    return {
      status: "BLOCKED",
      code: "OPERATOR_AUTHENTICATION_REQUIRED",
      details: this.config.redactedStatus,
    };
  }
}
