import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import {
  loadApprovedSourceInventory,
  validateGate3FBPreflight,
  detectInventoryCollisions,
  DestinationDryRunEngine,
} from "./dry-run-r2-migration.mjs";

import {
  buildFrozenManifest,
  SyncProtocolError,
} from "./sync-storage-protocol.mjs";

describe("Gate 3F-B — Real Destination Dry-Run & Safety Suite", () => {
  let sourceRecords;
  let manifest;

  beforeEach(() => {
    sourceRecords = loadApprovedSourceInventory();
    manifest = buildFrozenManifest(sourceRecords);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1. PREFLIGHT & BASELINE INTEGRITY
  // ───────────────────────────────────────────────────────────────────────────
  describe("Preflight & Baseline Pinning", () => {
    it("valida com sucesso na branch autorizada migration/supabase-to-neon", () => {
      const result = validateGate3FBPreflight(process.env, {
        mockBranch: "migration/supabase-to-neon",
      });
      assert.strictEqual(result.status, "PREFLIGHT_VERIFIED");
      assert.strictEqual(result.storageCutoverReady, false);
      assert.strictEqual(result.supabaseStorageProvider, "ACTIVE");
      assert.strictEqual(result.s3CompatibleStorageProvider, "NOT_ACTIVE");
      assert.strictEqual(result.dualRead, "INACTIVE");
    });

    it("bloqueia estritamente na branch main ou master", () => {
      assert.throws(
        () => validateGate3FBPreflight(process.env, { mockBranch: "main" }),
        (err) => err.code === "production_branch_blocked"
      );
      assert.throws(
        () => validateGate3FBPreflight(process.env, { mockBranch: "master" }),
        (err) => err.code === "production_branch_blocked"
      );
    });

    it("bloqueia se STORAGE_CUTOVER_READY estiver prematuramente activo", () => {
      assert.throws(
        () =>
          validateGate3FBPreflight(
            { STORAGE_CUTOVER_READY: "true" },
            { mockBranch: "migration/supabase-to-neon" }
          ),
        (err) => err.code === "cutover_flag_prematurely_active"
      );
    });

    it("falha fechado se o checksum do inventário da fonte divergir", () => {
      assert.throws(
        () =>
          loadApprovedSourceInventory({
            expectedSourceInventoryChecksum: "0000000000000000000000000000000000000000000000000000000000000000",
          }),
        (err) => err.code === "source_inventory_checksum_mismatch"
      );
    });

    it("falha fechado se a contagem do inventário da fonte divergir", () => {
      assert.throws(
        () =>
          loadApprovedSourceInventory({
            expectedSourceCount: 146,
          }),
        (err) => err.code === "source_object_count_mismatch"
      );
    });

    it("valida que o manifest reconstruído tem exatamente o checksum congelado do Gate 3E", () => {
      assert.strictEqual(
        manifest.manifestChecksum,
        "4eab656cabec14a86325c9303659fe86d19d61d34a56a9fd6fc7d314e818dda9"
      );
      assert.strictEqual(manifest.itemCount, 147);
      assert.strictEqual(manifest.totalBytes, 535493700);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. COLLISION & PATH VALIDATION
  // ───────────────────────────────────────────────────────────────────────────
  describe("Collision Analysis & Canonical Paths", () => {
    it("comprova zero colisões nos 147 objetos aprovados", () => {
      const collisions = detectInventoryCollisions(manifest.items);
      assert.strictEqual(collisions.length, 0);
    });

    it("deteta duplicado exato de storage_path", () => {
      const cloned = [...manifest.items, manifest.items[0]];
      const collisions = detectInventoryCollisions(cloned);
      assert.ok(collisions.some((c) => c.type === "DUPLICATE_PATH"));
    });

    it("deteta colisão de maiúsculas/minúsculas (case collision)", () => {
      const modified = [
        ...manifest.items,
        {
          ...manifest.items[0],
          storage_path: manifest.items[0].storage_path.toUpperCase(),
        },
      ];
      const collisions = detectInventoryCollisions(modified);
      assert.ok(collisions.some((c) => c.type === "CASE_COLLISION"));
    });

    it("deteta tentativa de contaminação de caminho por staging", () => {
      const contaminated = [
        ...manifest.items.slice(1),
        {
          ...manifest.items[0],
          storage_path: `__migration/staging/${manifest.items[0].storage_path}`,
        },
      ];
      const collisions = detectInventoryCollisions(contaminated);
      assert.ok(collisions.some((c) => c.type === "STAGING_PATH_CONTAMINATION"));
    });

    it("deteta formato de caminho canónico inválido", () => {
      const invalid = [
        ...manifest.items.slice(1),
        {
          ...manifest.items[0],
          storage_path: "invalid-two-segment-path/original.jpg",
        },
      ];
      const collisions = detectInventoryCollisions(invalid);
      assert.ok(collisions.some((c) => c.type === "INVALID_CANONICAL_SHAPE"));
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. DRY-RUN CLASSIFICATION LOGIC (MOCKED S3 ADAPTER)
  // ───────────────────────────────────────────────────────────────────────────
  describe("Dry-Run Classification Logic (Simulated Adapter)", () => {
    it("classifica todos os 147 objetos como WOULD_COPY se o destino estiver vazio", async () => {
      const fakeAdapter = {
        listAllObjects: async () => ({
          objectCount: 0,
          totalBytes: 0,
          objectsMap: new Map(),
        }),
      };

      const engine = new DestinationDryRunEngine({ bucketName: "haxr-wedding-photos" }, fakeAdapter);
      const result = await engine.executeDryRun(manifest);

      assert.strictEqual(result.destinationObjectCountBefore, 0);
      assert.strictEqual(result.destinationTotalBytesBefore, 0);
      assert.strictEqual(result.destinationDriftDetected, false);
      assert.strictEqual(result.classificationCounts.WOULD_COPY, 147);
      assert.strictEqual(result.classificationCounts.WOULD_SKIP_IDENTICAL, 0);
      assert.strictEqual(result.classificationCounts.WOULD_BLOCK, 0);
      assert.strictEqual(result.collisionCount, 0);
      assert.strictEqual(result.unexpectedDestinationObjectCount, 0);
      assert.ok(result.dryRunChecksum && /^[0-9a-f]{64}$/.test(result.dryRunChecksum));
    });

    it("classifica como WOULD_SKIP_IDENTICAL quando o objeto no destino é 100% idêntico (size, mime, sha256)", async () => {
      const sample = manifest.items[0];
      const destMap = new Map();
      destMap.set(sample.storage_path, {
        key: sample.storage_path,
        size: sample.size_bytes,
      });

      const fakeAdapter = {
        listAllObjects: async () => ({
          objectCount: 1,
          totalBytes: sample.size_bytes,
          objectsMap: destMap,
        }),
        getObjectDetails: async () => ({
          size: sample.size_bytes,
          contentType: sample.content_type,
          sha256: sample.sha256,
        }),
      };

      const engine = new DestinationDryRunEngine({ bucketName: "haxr-wedding-photos" }, fakeAdapter);
      const result = await engine.executeDryRun(manifest);

      assert.strictEqual(result.classificationCounts.WOULD_COPY, 146);
      assert.strictEqual(result.classificationCounts.WOULD_SKIP_IDENTICAL, 1);
      assert.strictEqual(result.classificationCounts.WOULD_BLOCK, 0);
    });

    it("classifica como WOULD_BLOCK se o tamanho divergir no destino", async () => {
      const sample = manifest.items[0];
      const destMap = new Map();
      destMap.set(sample.storage_path, {
        key: sample.storage_path,
        size: sample.size_bytes + 10,
      });

      const fakeAdapter = {
        listAllObjects: async () => ({
          objectCount: 1,
          totalBytes: sample.size_bytes + 10,
          objectsMap: destMap,
        }),
        getObjectDetails: async () => ({
          size: sample.size_bytes + 10,
          contentType: sample.content_type,
          sha256: sample.sha256,
        }),
      };

      const engine = new DestinationDryRunEngine({ bucketName: "haxr-wedding-photos" }, fakeAdapter);
      const result = await engine.executeDryRun(manifest);

      assert.strictEqual(result.classificationCounts.WOULD_COPY, 146);
      assert.strictEqual(result.classificationCounts.WOULD_SKIP_IDENTICAL, 0);
      assert.strictEqual(result.classificationCounts.WOULD_BLOCK, 1);
      assert.ok(result.blockedReasons[0].reason.includes("SIZE_MISMATCH"));
    });

    it("classifica como WOULD_BLOCK se o Content-Type divergir no destino", async () => {
      const sample = manifest.items[0];
      const destMap = new Map();
      destMap.set(sample.storage_path, {
        key: sample.storage_path,
        size: sample.size_bytes,
      });

      const fakeAdapter = {
        listAllObjects: async () => ({
          objectCount: 1,
          totalBytes: sample.size_bytes,
          objectsMap: destMap,
        }),
        getObjectDetails: async () => ({
          size: sample.size_bytes,
          contentType: "application/octet-stream", // Mismatch
          sha256: sample.sha256,
        }),
      };

      const engine = new DestinationDryRunEngine({ bucketName: "haxr-wedding-photos" }, fakeAdapter);
      const result = await engine.executeDryRun(manifest);

      assert.strictEqual(result.classificationCounts.WOULD_BLOCK, 1);
      assert.ok(result.blockedReasons[0].reason.includes("MIME_MISMATCH"));
    });

    it("classifica como WOULD_BLOCK se o hash SHA-256 divergir no destino", async () => {
      const sample = manifest.items[0];
      const destMap = new Map();
      destMap.set(sample.storage_path, {
        key: sample.storage_path,
        size: sample.size_bytes,
      });

      const fakeAdapter = {
        listAllObjects: async () => ({
          objectCount: 1,
          totalBytes: sample.size_bytes,
          objectsMap: destMap,
        }),
        getObjectDetails: async () => ({
          size: sample.size_bytes,
          contentType: sample.content_type,
          sha256: "0000000000000000000000000000000000000000000000000000000000000000", // Mismatch
        }),
      };

      const engine = new DestinationDryRunEngine({ bucketName: "haxr-wedding-photos" }, fakeAdapter);
      const result = await engine.executeDryRun(manifest);

      assert.strictEqual(result.classificationCounts.WOULD_BLOCK, 1);
      assert.ok(result.blockedReasons[0].reason.includes("HASH_MISMATCH"));
    });

    it("deteta objetos inesperados no destino que não constam no manifest", async () => {
      const destMap = new Map();
      destMap.set("random-alien-folder/photo.jpg", {
        key: "random-alien-folder/photo.jpg",
        size: 500,
      });

      const fakeAdapter = {
        listAllObjects: async () => ({
          objectCount: 1,
          totalBytes: 500,
          objectsMap: destMap,
        }),
      };

      const engine = new DestinationDryRunEngine({ bucketName: "haxr-wedding-photos" }, fakeAdapter);
      const result = await engine.executeDryRun(manifest);

      assert.strictEqual(result.unexpectedDestinationObjectCount, 1);
      assert.strictEqual(result.destinationDriftDetected, true);
    });

    it("falha fechado se ListObjectsV2 falhar com erro de rede/permissão", async () => {
      const fakeAdapter = {
        listAllObjects: async () => {
          throw new SyncProtocolError("destination_list_failed", "Network timeout");
        },
      };

      const engine = new DestinationDryRunEngine({ bucketName: "haxr-wedding-photos" }, fakeAdapter);
      await assert.rejects(
        () => engine.executeDryRun(manifest),
        (err) => err.code === "destination_list_failed"
      );
    });

    it("classifica como WOULD_BLOCK se a leitura/stream de um objeto falhar durante a inspeção", async () => {
      const sample = manifest.items[0];
      const destMap = new Map();
      destMap.set(sample.storage_path, {
        key: sample.storage_path,
        size: sample.size_bytes,
      });

      const fakeAdapter = {
        listAllObjects: async () => ({
          objectCount: 1,
          totalBytes: sample.size_bytes,
          objectsMap: destMap,
        }),
        getObjectDetails: async () => {
          throw new Error("Stream read error");
        },
      };

      const engine = new DestinationDryRunEngine({ bucketName: "haxr-wedding-photos" }, fakeAdapter);
      const result = await engine.executeDryRun(manifest);

      assert.strictEqual(result.classificationCounts.WOULD_BLOCK, 1);
      assert.ok(result.blockedReasons[0].reason.includes("INSPECTION_FAILED"));
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. DETERMINISM & CHECKSUM REPEATABILITY
  // ───────────────────────────────────────────────────────────────────────────
  describe("Dry-Run Determinism & Two-Run Repeatability", () => {
    it("duas execuções consecutivas com a mesma entrada geram exatamente o mesmo dryRunChecksum", async () => {
      const fakeAdapter = {
        listAllObjects: async () => ({
          objectCount: 0,
          totalBytes: 0,
          objectsMap: new Map(),
        }),
      };

      const engine = new DestinationDryRunEngine({ bucketName: "haxr-wedding-photos" }, fakeAdapter);
      const run1 = await engine.executeDryRun(manifest);
      const run2 = await engine.executeDryRun(manifest);

      assert.strictEqual(run1.dryRunChecksum, run2.dryRunChecksum);
      assert.strictEqual(run1.classificationCounts.WOULD_COPY, run2.classificationCounts.WOULD_COPY);
      assert.strictEqual(run1.classificationCounts.WOULD_SKIP_IDENTICAL, run2.classificationCounts.WOULD_SKIP_IDENTICAL);
      assert.strictEqual(run1.classificationCounts.WOULD_BLOCK, run2.classificationCounts.WOULD_BLOCK);
    });
  });
});
