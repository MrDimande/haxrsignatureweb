#!/usr/bin/env node
/**
 * Gate 3E.1 — Storage Synchronization Protocol & Protocol Hardening Engine
 *
 * REGRA ABSOLUTA (Gate 3E.1):
 * Este módulo define e endurece a especificação, manifest, staging seguro e motor de transferência.
 * ZERO chamadas a Cloudflare R2 real, ZERO credenciais reais de destino configuradas,
 * ZERO cópia física de blobs reais em produção, ZERO cutover e ZERO merge para main.
 */

import {
  validateCanonicalPath,
  validateEnvironmentSafety,
  sha256,
} from "./reconcile-storage-preview.mjs";

/**
 * Baseline Criptograficamente Pinned do Gate 3D
 */
export const GATE_3D_BASELINE_PIN = Object.freeze({
  sourceInventoryChecksum: "57e1369fcb302d2fa8c0e027cdc4979ae0ba553866ea08e7b37b5152d9748728",
  sourceObjectCount: 147,
  sourceTotalBytes: 535493700,
  pinnedManifestChecksum: "4eab656cabec14a86325c9303659fe86d19d61d34a56a9fd6fc7d314e818dda9",
});

/**
 * Especificação do Destino (Cloudflare R2 - Terminologia Exata)
 */
export const GATE_3E_TARGET_SPEC = Object.freeze({
  provider: "cloudflare-r2",
  s3Compatibility: true,
  bucketName: "haxr-wedding-photos",
  region: "auto",
  accessPolicy: "private",
  r2DevSubdomainEnabled: false,
  publicCustomDomain: false,
  unauthenticatedAccess: false,
  allowedMethods: ["GET", "PUT", "HEAD"],
  expectedObjectCount: 147,
  expectedTotalBytes: 535493700,
  sourceInventoryChecksum: GATE_3D_BASELINE_PIN.sourceInventoryChecksum,
  pinnedManifestChecksum: GATE_3D_BASELINE_PIN.pinnedManifestChecksum,
});

export class SyncProtocolError extends Error {
  constructor(code, message) {
    super(message ? `${code}: ${message}` : code);
    this.name = "SyncProtocolError";
    this.code = code;
  }
}

/**
 * Constrói e congela o Manifest Canónico dos 147 objetos com provenance do Gate 3D.
 * Algoritmo do manifestChecksum:
 * 1. Filtra e normaliza cada um dos 147 objetos:
 *    { storage_path, size_bytes, content_type, sha256, invitation_slug, photo_id }
 * 2. Ordena estritamente por storage_path ASC.
 * 3. Serializa para JSON canónico minificado UTF-8.
 * 4. Calcula SHA-256 da string resultante.
 */
export function buildFrozenManifest(records, options = {}) {
  if (!Array.isArray(records) || records.length === 0) {
    throw new SyncProtocolError("manifest_records_empty_or_invalid", "Array de registos vazio ou inválido.");
  }

  const expectedCount = options.expectedCount ?? GATE_3D_BASELINE_PIN.sourceObjectCount;
  if (records.length !== expectedCount) {
    throw new SyncProtocolError(
      "source_object_count_mismatch",
      `Contagem de objetos divergiu do baseline: esperado ${expectedCount}, obtido ${records.length}`
    );
  }

  let totalBytes = 0;

  const normalizedItems = records.map((record) => {
    const pathCheck = validateCanonicalPath(
      record.storage_path,
      record.invitation_slug,
      record.photo_id || record.id
    );

    if (!pathCheck.valid) {
      throw new SyncProtocolError(
        "manifest_path_invalid",
        `Path inválido no manifest: ${record.storage_path} (${pathCheck.reason})`
      );
    }

    const size = Number(record.size_bytes || record.file_size_bytes);
    if (!Number.isSafeInteger(size) || size <= 0) {
      throw new SyncProtocolError(
        "manifest_size_invalid",
        `Tamanho inválido no manifest para ${record.storage_path}: ${size}`
      );
    }

    totalBytes += size;

    if (!record.content_type || typeof record.content_type !== "string") {
      throw new SyncProtocolError("manifest_content_type_missing", record.storage_path);
    }

    const cleanMime = record.content_type.toLowerCase().split(";")[0].trim();
    const hash = record.sha256 ? record.sha256.toLowerCase().trim() : null;

    if (!hash || !/^[0-9a-f]{64}$/.test(hash)) {
      throw new SyncProtocolError("manifest_sha256_format_invalid", `Hash SHA-256 inválido para ${record.storage_path}`);
    }

    return {
      storage_path: record.storage_path,
      size_bytes: size,
      content_type: cleanMime,
      sha256: hash,
      invitation_slug: record.invitation_slug,
      photo_id: record.photo_id || record.id,
    };
  });

  const expectedTotalBytes = options.expectedTotalBytes ?? GATE_3D_BASELINE_PIN.sourceTotalBytes;
  if (totalBytes !== expectedTotalBytes) {
    throw new SyncProtocolError(
      "source_total_bytes_mismatch",
      `Total de bytes divergiu do baseline: esperado ${expectedTotalBytes}, obtido ${totalBytes}`
    );
  }

  // Ordenação determinística por storage_path ASC
  normalizedItems.sort((a, b) => a.storage_path.localeCompare(b.storage_path));

  // Cálculo do checksum global do manifest
  const canonicalJson = JSON.stringify(normalizedItems);
  const manifestChecksum = sha256(canonicalJson);

  const expectedChecksum = options.expectedManifestChecksum ?? GATE_3D_BASELINE_PIN.pinnedManifestChecksum;
  if (expectedChecksum && manifestChecksum !== expectedChecksum) {
    throw new SyncProtocolError(
      "manifest_checksum_mismatch",
      `Checksum do manifest divergiu do baseline pinned. Esperado: ${expectedChecksum}, Calculado: ${manifestChecksum}`
    );
  }

  return {
    version: "1.0",
    provenance: {
      gate: "GATE_3D.1",
      sourceInventoryChecksum: GATE_3D_BASELINE_PIN.sourceInventoryChecksum,
      sourceObjectCount: GATE_3D_BASELINE_PIN.sourceObjectCount,
      sourceTotalBytes: GATE_3D_BASELINE_PIN.sourceTotalBytes,
    },
    itemCount: normalizedItems.length,
    totalBytes,
    manifestChecksum,
    items: Object.freeze(normalizedItems),
  };
}

/**
 * Valida a proveniência e integridade matemática do manifest.
 */
export function verifyManifestProvenance(manifest) {
  if (!manifest || !manifest.provenance || !Array.isArray(manifest.items)) {
    throw new SyncProtocolError("invalid_manifest_structure", "Estrutura do manifest inválida.");
  }

  if (manifest.provenance.sourceInventoryChecksum !== GATE_3D_BASELINE_PIN.sourceInventoryChecksum) {
    throw new SyncProtocolError(
      "source_inventory_checksum_mismatch",
      `sourceInventoryChecksum incompatível: ${manifest.provenance.sourceInventoryChecksum}`
    );
  }

  if (manifest.itemCount !== GATE_3D_BASELINE_PIN.sourceObjectCount) {
    throw new SyncProtocolError("source_object_count_mismatch", `Count incompatível: ${manifest.itemCount}`);
  }

  if (manifest.totalBytes !== GATE_3D_BASELINE_PIN.sourceTotalBytes) {
    throw new SyncProtocolError("source_total_bytes_mismatch", `TotalBytes incompatível: ${manifest.totalBytes}`);
  }

  const canonicalJson = JSON.stringify(manifest.items);
  const calculated = sha256(canonicalJson);

  if (calculated !== manifest.manifestChecksum || calculated !== GATE_3D_BASELINE_PIN.pinnedManifestChecksum) {
    throw new SyncProtocolError(
      "manifest_checksum_mismatch",
      `Checksum do manifest diverge. Calculado: ${calculated}`
    );
  }

  return true;
}

/**
 * Motor do Protocolo de Sincronização e Transferência Segura (Sync Engine)
 */
export class StorageSyncProtocolEngine {
  constructor(options = {}) {
    this.sourceProvider = options.sourceProvider;
    this.destinationProvider = options.destinationProvider;
    this.sourceBucket = options.sourceBucket || "wedding-photos";
    this.destinationBucket = options.destinationBucket || GATE_3E_TARGET_SPEC.bucketName;
    this.maxRetries = options.maxRetries ?? 3;
    this.timeoutMs = options.timeoutMs ?? 15000;
  }

  /**
   * Validação de segurança fail-closed pré-execução.
   */
  assertPreflightSecurity(env = process.env, options = {}) {
    validateEnvironmentSafety(env, {
      mockBranch: options.mockBranch,
      mockTargetHost: options.mockTargetHost,
      mockBucket: this.sourceBucket,
      requireMigrationBranch: options.requireMigrationBranch ?? true,
      requireExactTarget: options.requireExactTarget ?? false,
    });

    if (this.destinationBucket !== GATE_3E_TARGET_SPEC.bucketName && !options.allowCustomDestinationBucket) {
      throw new SyncProtocolError(
        "destination_bucket_mismatch",
        `Bucket de destino incorreto: esperado ${GATE_3E_TARGET_SPEC.bucketName}, obtido ${this.destinationBucket}`
      );
    }
  }

  /**
   * 1. DRY-RUN DE SINCRONIZAÇÃO (SIMULATED_EMPTY_DESTINATION_DRY_RUN)
   * Gera a matriz de decisões. NÃO possui nenhum caminho de execução para overwrite ou replace.
   */
  async plan(manifest) {
    if (!manifest || !Array.isArray(manifest.items)) {
      throw new SyncProtocolError("invalid_manifest_provided", "Manifest ausente ou inválido.");
    }

    verifyManifestProvenance(manifest);

    const summary = {
      type: "SIMULATED_EMPTY_DESTINATION_DRY_RUN",
      WOULD_COPY: 0,
      WOULD_SKIP_IDENTICAL: 0,
      WOULD_REPLACE: 0,
      WOULD_REJECT: 0,
      WOULD_BLOCK: 0,
      items: [],
    };

    for (const item of manifest.items) {
      const destKey = `destination://${this.destinationBucket}/${item.storage_path}`;

      // Validação do path canónico
      const pathCheck = validateCanonicalPath(item.storage_path, item.invitation_slug, item.photo_id);
      if (!pathCheck.valid) {
        summary.WOULD_REJECT += 1;
        summary.items.push({
          storagePath: item.storage_path,
          destinationPath: destKey,
          decision: "WOULD_REJECT",
          reason: `Path inválido: ${pathCheck.reason}`,
        });
        continue;
      }

      // Inspecionar se o destino já possui o objeto
      let destInfo = null;
      if (this.destinationProvider && typeof this.destinationProvider.getObjectInfo === "function") {
        try {
          destInfo = await this.destinationProvider.getObjectInfo(this.destinationBucket, item.storage_path);
        } catch {
          destInfo = null;
        }
      }

      if (destInfo) {
        // Objeto já existe no destino: verificar se é idêntico
        const sameSize = destInfo.sizeBytes === item.size_bytes;
        const sameHash = destInfo.eTag?.replace(/"/g, "") === item.sha256;

        if (sameSize && sameHash) {
          summary.WOULD_SKIP_IDENTICAL += 1;
          summary.items.push({
            storagePath: item.storage_path,
            destinationPath: destKey,
            decision: "WOULD_SKIP_IDENTICAL",
            reason: "Objeto idêntico (tamanho e SHA-256 coincidentes) já presente no destino",
          });
          continue;
        } else {
          // Divergência no destino: NUNCA sobrescrever silenciosamente -> BLOCK
          summary.WOULD_BLOCK += 1;
          summary.items.push({
            storagePath: item.storage_path,
            destinationPath: destKey,
            decision: "WOULD_BLOCK",
            reason: `Objeto já existe no destino mas diverge (Dest: ${destInfo.sizeBytes}b, Manifest: ${item.size_bytes}b)`,
          });
          continue;
        }
      }

      // Objeto não existe no destino: pronto para cópia atómica create-only
      summary.WOULD_COPY += 1;
      summary.items.push({
        storagePath: item.storage_path,
        destinationPath: destKey,
        sourceSize: item.size_bytes,
        sourceSha256: item.sha256,
        decision: "WOULD_COPY",
        reason: "Validado no manifest e pronto para transferência segura",
      });
    }

    return summary;
  }

  /**
   * 2. ARQUITETURA DE STAGING SEGURO, CONDITIONAL CREATE-ONLY & ROLLBACK ISOLADO
   *
   * Fluxo Atómico:
   * Source -> Stream/Hash -> Unique Staging Key (__migration/<run-id>/<path>)
   *        -> Verify Staging -> Conditional Promote to Final Key (If-None-Match: *)
   *        -> Verify Final -> Delete Staging Key.
   *
   * Garantia de Rollback:
   * Em qualquer falha, o rollback purga APENAS a staging key própria da migração.
   * NUNCA executa blind DELETE na chave final, protegendo objetos contra remoções acidentais.
   */
  async transferSingleObject(item, options = {}) {
    if (!this.sourceProvider || !this.destinationProvider) {
      throw new SyncProtocolError("source_and_destination_providers_required", "Provedores de origem e destino obrigatórios.");
    }

    const { storage_path, size_bytes, content_type, sha256: expectedHash } = item;
    const runId = options.runId || `run-${Date.now()}`;
    const stagingKey = `__migration/${runId}/${storage_path}`;

    let attempt = 0;
    let lastError = null;

    while (attempt <= this.maxRetries) {
      attempt++;
      let stagingUploaded = false;

      try {
        // Passo 1: Download da Origem com validação de stream
        const downloadResult = await this.sourceProvider.download(this.sourceBucket, storage_path);
        if (!downloadResult || !downloadResult.data) {
          throw new SyncProtocolError("source_object_not_found", `Objeto não encontrado na fonte: ${storage_path}`);
        }

        const sourceBytes = downloadResult.data;

        // Validação de tamanho no stream
        if (sourceBytes.byteLength !== size_bytes) {
          throw new SyncProtocolError(
            "transfer_size_mismatch",
            `Esperado: ${size_bytes} bytes, obtido no download: ${sourceBytes.byteLength} bytes`
          );
        }

        // Validação de SHA-256 on-the-fly durante a transferência
        const calculatedSha256 = sha256(sourceBytes);
        if (expectedHash && calculatedSha256 !== expectedHash) {
          throw new SyncProtocolError(
            "transfer_sha256_mismatch",
            `SHA-256 diverge on-the-fly. Esperado: ${expectedHash}, Calculado: ${calculatedSha256}`
          );
        }

        // Validação de MIME
        if (downloadResult.contentType && downloadResult.contentType.split(";")[0].trim() !== content_type) {
          throw new SyncProtocolError("transfer_mime_mismatch", "MIME type diverge do manifest.");
        }

        // Em modo dry-run, paramos aqui
        if (options.dryRun) {
          return { success: true, dryRun: true, storagePath: storage_path };
        }

        // Passo 2: Upload atómico para a Staging Key exclusiva do run
        if (typeof this.destinationProvider.putObjectConditional === "function") {
          this.destinationProvider.putObjectConditional(
            this.destinationBucket,
            stagingKey,
            sourceBytes,
            content_type,
            { ifNoneMatch: "*" }
          );
          stagingUploaded = true;
        } else if (typeof this.destinationProvider.seedObject === "function") {
          this.destinationProvider.seedObject(this.destinationBucket, stagingKey, sourceBytes, content_type);
          stagingUploaded = true;
        } else {
          throw new SyncProtocolError("destination_provider_lacks_conditional_write");
        }

        // Passo 3: Verificação pós-upload da Staging Key (re-read de validação de hash)
        const stagingCheck = await this.destinationProvider.download(this.destinationBucket, stagingKey);
        if (!stagingCheck || sha256(stagingCheck.data) !== calculatedSha256) {
          throw new SyncProtocolError("staging_verification_failed", "Hash na staging key divergiu após escrita.");
        }

        // Passo 4: Promoção Condicional Create-Only (If-None-Match: *) de Staging para Final
        try {
          if (typeof this.destinationProvider.promoteObjectConditional === "function") {
            this.destinationProvider.promoteObjectConditional(
              this.destinationBucket,
              stagingKey,
              storage_path,
              { ifNoneMatch: "*" }
            );
          } else if (typeof this.destinationProvider.putObjectConditional === "function") {
            this.destinationProvider.putObjectConditional(
              this.destinationBucket,
              storage_path,
              sourceBytes,
              content_type,
              { ifNoneMatch: "*" }
            );
          } else {
            throw new SyncProtocolError("destination_provider_lacks_conditional_promote");
          }
        } catch (promoteError) {
          // Se falhou com 412 PreconditionFailed (race condition): BLOQUEIA IMEDIATAMENTE
          if (promoteError.status === 412 || promoteError.code === "PreconditionFailed") {
            throw new SyncProtocolError(
              "destination_race_condition_blocked",
              `412 PreconditionFailed: destino já possui objeto em ${storage_path}. Overwrite bloqueado.`
            );
          }
          throw promoteError;
        }

        // Passo 5: Verificação final na chave de destino
        const finalCheck = await this.destinationProvider.download(this.destinationBucket, storage_path);
        if (!finalCheck || sha256(finalCheck.data) !== calculatedSha256) {
          throw new SyncProtocolError("final_destination_verification_failed", "Verificação pós-promoção falhou.");
        }

        // Passo 6: Limpeza atómica da Staging Key própria da migração
        await this.destinationProvider.remove(this.destinationBucket, [stagingKey]);
        stagingUploaded = false;

        return {
          success: true,
          storagePath: storage_path,
          sizeBytes: sourceBytes.byteLength,
          sha256: calculatedSha256,
          attempts: attempt,
        };
      } catch (err) {
        lastError = err;

        // Rollback Atómico Seguro: Limpa APENAS a Staging Key migration-owned, NUNCA a chave final
        if (stagingUploaded) {
          try {
            await this.destinationProvider.remove(this.destinationBucket, [stagingKey]);
          } catch {
            // Falha silenciosa de cleanup de staging
          }
        }

        // Erros determinísticos de validação e race condition NUNCA devem ter retry
        if (
          err.code === "transfer_sha256_mismatch" ||
          err.code === "transfer_size_mismatch" ||
          err.code === "transfer_mime_mismatch" ||
          err.code === "source_object_not_found" ||
          err.code === "destination_race_condition_blocked" ||
          err.code === "staging_verification_failed" ||
          err.code === "final_destination_verification_failed"
        ) {
          throw err;
        }

        if (attempt > this.maxRetries) {
          break;
        }

        // Backoff exponencial estrito para falhas transitórias
        await new Promise((resolve) => setTimeout(resolve, Math.min(50 * Math.pow(2, attempt), 500)));
      }
    }

    throw new SyncProtocolError("transfer_exhausted_retries", `Excedido limite de retries: ${lastError?.message}`);
  }

  /**
   * 3. DUAL-READ COM FALLBACK CONTROLADO
   * Capacidade isolada de leitura: NÃO está ativa no runtime de produção.
   * SupabaseStorageProvider continua sendo o provider ativo em produção.
   */
  async dualRead(storagePath) {
    validateCanonicalPath(storagePath);

    // 1. Tentar ler do Destino (Cloudflare R2)
    if (this.destinationProvider) {
      try {
        const destObj = await this.destinationProvider.download(this.destinationBucket, storagePath);
        if (destObj && destObj.data && destObj.data.length > 0) {
          return {
            source: "destination",
            data: destObj.data,
            contentType: destObj.contentType,
            sizeBytes: destObj.sizeBytes,
          };
        }
      } catch {
        // Fallback silencioso para a fonte
      }
    }

    // 2. Recorrer à Fonte (Supabase Storage)
    if (this.sourceProvider) {
      const sourceObj = await this.sourceProvider.download(this.sourceBucket, storagePath);
      if (sourceObj && sourceObj.data && sourceObj.data.length > 0) {
        return {
          source: "source_fallback",
          data: sourceObj.data,
          contentType: sourceObj.contentType,
          sizeBytes: sourceObj.sizeBytes,
        };
      }
    }

    return null;
  }
}
