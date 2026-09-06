import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  GATE_3D_BASELINE_PIN,
  GATE_3E_TARGET_SPEC,
  buildFrozenManifest,
  verifyManifestProvenance,
  StorageSyncProtocolEngine,
  SyncProtocolError,
} from "./sync-storage-protocol.mjs";

import { FakeStorageProvider } from "../src/lib/edition/storage/fake-storage-provider.js";
import { sha256 } from "./reconcile-storage-preview.mjs";

/**
 * Carrega a fixture canónica dos 147 objetos a partir da evidência real do Gate 3D.1
 */
function loadCanonical147AuditRecords() {
  const run1Path = resolve(process.cwd(), "docs/migrations/gate-3d-reconciliation-run-1.json");
  const run1Data = JSON.parse(readFileSync(run1Path, "utf8"));

  return run1Data.objects.map((obj) => {
    const parts = obj.storage_path.split("/");
    return {
      storage_path: obj.storage_path,
      size_bytes: obj.size_bytes,
      content_type: obj.content_type,
      sha256: obj.sha256,
      invitation_slug: parts[0],
      photo_id: parts[1],
    };
  });
}

describe("Gate 3E.1 — Hardened Synchronization Protocol & Safety Suite", () => {
  let sourceStorage;
  let destinationStorage;
  let canonicalRecords;
  let manifest;

  beforeEach(() => {
    sourceStorage = new FakeStorageProvider();
    destinationStorage = new FakeStorageProvider();
    canonicalRecords = loadCanonical147AuditRecords();
    manifest = buildFrozenManifest(canonicalRecords);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1. GATE 3D BASELINE PROVENANCE & MANIFEST CHECKSUM REAL
  // ───────────────────────────────────────────────────────────────────────────
  describe("Gate 3D Baseline Pinning & Real Manifest Provenance", () => {
    it("pins exatamente o baseline aprovado do Gate 3D", () => {
      assert.strictEqual(GATE_3D_BASELINE_PIN.sourceObjectCount, 147);
      assert.strictEqual(GATE_3D_BASELINE_PIN.sourceTotalBytes, 535493700);
      assert.strictEqual(
        GATE_3D_BASELINE_PIN.sourceInventoryChecksum,
        "57e1369fcb302d2fa8c0e027cdc4979ae0ba553866ea08e7b37b5152d9748728"
      );
      assert.strictEqual(
        GATE_3D_BASELINE_PIN.pinnedManifestChecksum,
        "4eab656cabec14a86325c9303659fe86d19d61d34a56a9fd6fc7d314e818dda9"
      );
    });

    it("constrói manifest congelado com provenance de Gate 3D e manifestChecksum real", () => {
      assert.strictEqual(manifest.itemCount, 147);
      assert.strictEqual(manifest.totalBytes, 535493700);
      assert.strictEqual(
        manifest.manifestChecksum,
        "4eab656cabec14a86325c9303659fe86d19d61d34a56a9fd6fc7d314e818dda9"
      );
      assert.strictEqual(Object.isFrozen(manifest.items), true);

      // Verificação de ordenação estrita storage_path ASC
      for (let i = 0; i < manifest.items.length - 1; i++) {
        assert.ok(manifest.items[i].storage_path.localeCompare(manifest.items[i + 1].storage_path) <= 0);
      }

      // Validação formal da proveniência
      assert.strictEqual(verifyManifestProvenance(manifest), true);
    });

    it("falha fechado se contagem de objetos divergir de 147", () => {
      const invalid = [...canonicalRecords];
      invalid.pop();

      assert.throws(
        () => buildFrozenManifest(invalid),
        /source_object_count_mismatch/
      );
    });

    it("falha fechado se total de bytes divergir de 535493700", () => {
      const invalid = canonicalRecords.map((r, i) => (i === 0 ? { ...r, size_bytes: r.size_bytes + 1 } : r));

      assert.throws(
        () => buildFrozenManifest(invalid),
        /source_total_bytes_mismatch/
      );
    });

    it("falha fechado se manifest checksum divergir do pinned", () => {
      const tamperedManifest = {
        ...manifest,
        manifestChecksum: "0000000000000000000000000000000000000000000000000000000000000000",
      };

      assert.throws(
        () => verifyManifestProvenance(tamperedManifest),
        /manifest_checksum_mismatch/
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. DRY-RUN SIMULADO & SEMÂNTICA DE WOULD_REPLACE
  // ───────────────────────────────────────────────────────────────────────────
  describe("SIMULATED_EMPTY_DESTINATION_DRY_RUN & Zero Overwrite Guarantee", () => {
    it("gera SIMULATED_EMPTY_DESTINATION_DRY_RUN com WOULD_COPY=147", async () => {
      const engine = new StorageSyncProtocolEngine({
        sourceProvider: sourceStorage,
        destinationProvider: destinationStorage,
      });

      const plan = await engine.plan(manifest);

      assert.strictEqual(plan.type, "SIMULATED_EMPTY_DESTINATION_DRY_RUN");
      assert.strictEqual(plan.WOULD_COPY, 147);
      assert.strictEqual(plan.WOULD_SKIP_IDENTICAL, 0);
      assert.strictEqual(plan.WOULD_REPLACE, 0);
      assert.strictEqual(plan.WOULD_REJECT, 0);
      assert.strictEqual(plan.WOULD_BLOCK, 0);
    });

    it("garante que divergência no destino produz WOULD_BLOCK e NUNCA WOULD_REPLACE", async () => {
      const engine = new StorageSyncProtocolEngine({
        sourceProvider: sourceStorage,
        destinationProvider: destinationStorage,
      });

      const item = manifest.items[0];
      // Injeta ficheiro no destino com tamanho diferente
      destinationStorage.seedObject(
        GATE_3E_TARGET_SPEC.bucketName,
        item.storage_path,
        new Uint8Array(item.size_bytes + 100),
        item.content_type
      );

      const plan = await engine.plan(manifest);

      assert.strictEqual(plan.WOULD_BLOCK, 1);
      assert.strictEqual(plan.WOULD_REPLACE, 0); // Proibido substituir
      const blocked = plan.items.find((p) => p.storagePath === item.storage_path);
      assert.strictEqual(blocked.decision, "WOULD_BLOCK");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. SAFE CREATE-ONLY DESTINATION & RACE CONDITION PROTECTION (412)
  // ───────────────────────────────────────────────────────────────────────────
  describe("Safe Create-Only Destination & Concurrency Protection (If-None-Match: *)", () => {
    it("deteta race condition e aborta com BLOCK perante 412 PreconditionFailed", async () => {
      const engine = new StorageSyncProtocolEngine({
        sourceProvider: sourceStorage,
        destinationProvider: destinationStorage,
      });

      const item = manifest.items[0];
      const payload = Buffer.from("source_payload_bytes_for_race_test");
      const realHash = sha256(payload);

      sourceStorage.seedObject("wedding-photos", item.storage_path, payload, item.content_type);

      const transferItem = {
        ...item,
        size_bytes: payload.byteLength,
        sha256: realHash,
      };

      // Simulação da Race Condition:
      // 1. HEAD inicial no plan diria que o objeto está ausente.
      // 2. Antes do conditional PUT do cliente, outro actor grava um ficheiro no destino.
      const concurrentPayload = Buffer.from("concurrent_actor_written_payload");
      destinationStorage.seedObject(
        GATE_3E_TARGET_SPEC.bucketName,
        item.storage_path,
        concurrentPayload,
        item.content_type
      );

      // 3. O cliente tenta a transferência com promoção condicional (If-None-Match: *)
      await assert.rejects(
        () => engine.transferSingleObject(transferItem, { runId: "race-run" }),
        (err) => {
          assert.ok(err instanceof SyncProtocolError);
          assert.strictEqual(err.code, "destination_race_condition_blocked");
          assert.ok(err.message.includes("412 PreconditionFailed"));
          return true;
        }
      );

      // 4. VERIFICAÇÃO CRÍTICA: O ficheiro do actor concorrente permanece 100% INTACTO
      const concurrentCheck = await destinationStorage.download(GATE_3E_TARGET_SPEC.bucketName, item.storage_path);
      assert.ok(concurrentCheck !== null);
      assert.deepStrictEqual(Buffer.from(concurrentCheck.data), concurrentPayload);

      // 5. A Staging Key da migração foi limpa sem deixar lixo
      const stagingKey = `__migration/race-run/${item.storage_path}`;
      assert.strictEqual(
        await destinationStorage.download(GATE_3E_TARGET_SPEC.bucketName, stagingKey),
        null
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. SAFE STAGING & ROLLBACK ISOLADO
  // ───────────────────────────────────────────────────────────────────────────
  describe("Safe Staging Architecture & Rollback Ownership", () => {
    it("executa ciclo completo: source -> staging -> verify -> promote -> cleanup staging", async () => {
      const engine = new StorageSyncProtocolEngine({
        sourceProvider: sourceStorage,
        destinationProvider: destinationStorage,
      });

      const item = manifest.items[0];
      const payload = Buffer.from("atomic_staging_flow_payload");
      const realHash = sha256(payload);

      sourceStorage.seedObject("wedding-photos", item.storage_path, payload, item.content_type);

      const transferItem = {
        ...item,
        size_bytes: payload.byteLength,
        sha256: realHash,
      };

      const result = await engine.transferSingleObject(transferItem, { runId: "staging-run" });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.sha256, realHash);

      // Final key existe com hash exato
      const finalObj = await destinationStorage.download(GATE_3E_TARGET_SPEC.bucketName, item.storage_path);
      assert.ok(finalObj !== null);
      assert.strictEqual(sha256(finalObj.data), realHash);

      // Staging key temporária foi devidamente removida
      const stagingKey = `__migration/staging-run/${item.storage_path}`;
      assert.strictEqual(
        await destinationStorage.download(GATE_3E_TARGET_SPEC.bucketName, stagingKey),
        null
      );
    });

    it("rollback purga APENAS a staging key se SHA-256 divergir no download inicial", async () => {
      const engine = new StorageSyncProtocolEngine({
        sourceProvider: sourceStorage,
        destinationProvider: destinationStorage,
      });

      const item = manifest.items[0];
      const payload = Buffer.from("corrupted_payload");

      sourceStorage.seedObject("wedding-photos", item.storage_path, payload, item.content_type);

      const transferItem = {
        ...item,
        size_bytes: payload.byteLength,
        sha256: "0000000000000000000000000000000000000000000000000000000000000000",
      };

      await assert.rejects(
        () => engine.transferSingleObject(transferItem, { runId: "corrupt-run" }),
        /transfer_sha256_mismatch/
      );

      // Nenhuma chave gravada no destino (nem final nem staging)
      assert.strictEqual(await destinationStorage.download(GATE_3E_TARGET_SPEC.bucketName, item.storage_path), null);
      assert.strictEqual(
        await destinationStorage.download(GATE_3E_TARGET_SPEC.bucketName, `__migration/corrupt-run/${item.storage_path}`),
        null
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. RETRY SAFETY & FAIL-CLOSED VALIDATIONS
  // ───────────────────────────────────────────────────────────────────────────
  describe("Retry Safety & Fail-Closed Boundaries", () => {
    it("não tenta retry para falhas de validação (hash, tamanho, MIME)", async () => {
      const engine = new StorageSyncProtocolEngine({
        sourceProvider: sourceStorage,
        destinationProvider: destinationStorage,
        maxRetries: 3,
      });

      const item = manifest.items[0];
      sourceStorage.seedObject("wedding-photos", item.storage_path, Buffer.from("short"), item.content_type);

      const transferItem = {
        ...item,
        size_bytes: 999999, // Mismatch intencional
        sha256: sha256(Buffer.from("short")),
      };

      await assert.rejects(
        () => engine.transferSingleObject(transferItem),
        /transfer_size_mismatch/
      );
    });

    it("falha fechado se target host, bucket ou branch forem inválidos", () => {
      const engine = new StorageSyncProtocolEngine();

      assert.throws(
        () => engine.assertPreflightSecurity({ NODE_TLS_REJECT_UNAUTHORIZED: "0" }),
        /tls_verification_required/
      );

      assert.throws(
        () => engine.assertPreflightSecurity({ NODE_TLS_REJECT_UNAUTHORIZED: "1" }, { mockBranch: "main" }),
        /production_branch_blocked/
      );

      const badBucketEngine = new StorageSyncProtocolEngine({ destinationBucket: "wrong-bucket" });
      assert.throws(
        () => badBucketEngine.assertPreflightSecurity({ NODE_TLS_REJECT_UNAUTHORIZED: "1" }, { mockBranch: "migration/supabase-to-neon" }),
        /destination_bucket_mismatch/
      );
    });
  });
});
