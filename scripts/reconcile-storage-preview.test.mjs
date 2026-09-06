import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  validateEnvironmentSafety,
  reconcile1to1,
  generateDryRunSyncPlan,
  summarizeReconciliation,
  assertIdempotency,
  calculateSourceInventoryChecksum,
  calculateNeonMetadataChecksum,
  calculateReconciliationChecksum,
  Gate3DError,
  sha256,
} from "./reconcile-storage-preview.mjs";

/**
 * Gera fixture determinística com os 147 registos exatos correspondentes à auditoria real.
 */
function createDeterministic147Fixtures() {
  const neonRows = [];
  const storageObjects = [];

  const slugs = [
    { slug: "jessicaesamueltraditionalwedding", count: 85 },
    { slug: "jessicasamuelwedding", count: 62 },
  ];

  let currentId = 1;

  for (const { slug, count } of slugs) {
    for (let i = 0; i < count; i++) {
      const hex = currentId.toString(16).padStart(12, "0");
      const uuid = `00000000-0000-4000-8000-${hex}`;

      // Distribuição de extensões proporcional:
      // 114 jpg, 15 mov, 10 mp4, 8 heic
      let ext = "jpg";
      let mime = "image/jpeg";
      let size = 1500000; // ~1.5 MB

      if (currentId <= 15) {
        ext = "mov";
        mime = "video/quicktime";
        size = 15000000; // ~15 MB
      } else if (currentId <= 25) {
        ext = "mp4";
        mime = "video/mp4";
        size = 10000000; // ~10 MB
      } else if (currentId <= 33) {
        ext = "heic";
        mime = "image/heic";
        size = 2000000; // ~2 MB
      }

      const storagePath = `${slug}/${uuid}/original.${ext}`;
      const fakeBlobHash = sha256(`fake_blob_binary_payload_${storagePath}_${size}`);

      neonRows.push({
        id: uuid,
        invitation_slug: slug,
        storage_path: storagePath,
        original_filename: `original.${ext}`,
        content_type: mime,
        file_size_bytes: size,
        guest_name: `Convidado ${currentId}`,
        caption: `Memória ${currentId}`,
        moderation_status: "pending",
        created_at: "2026-09-02T12:00:00.000000Z",
      });

      storageObjects.push({
        storage_path: storagePath,
        size_bytes: size,
        content_type: mime,
        sha256: fakeBlobHash,
        eTag: `"etag-${currentId}"`,
      });

      currentId++;
    }
  }

  return { neonRows, storageObjects };
}

describe("Gate 3D — Storage Reconciliation & Sync Dry-Run Test Suite", () => {
  // ───────────────────────────────────────────────────────────────────────────
  // 1. HAPPY PATH: 147/147 MATCH
  // ───────────────────────────────────────────────────────────────────────────
  describe("147/147 Baseline Clean Reconciliation", () => {
    it("deve classificar 147/147 objetos como MATCH perfeito", () => {
      const { neonRows, storageObjects } = createDeterministic147Fixtures();

      const results = reconcile1to1(neonRows, storageObjects);
      const summary = summarizeReconciliation(results, storageObjects, neonRows);

      assert.strictEqual(summary.totalEvaluated, 147);
      assert.strictEqual(summary.MATCH, 147);
      assert.strictEqual(summary.MISSING_OBJECT, 0);
      assert.strictEqual(summary.ORPHAN_OBJECT, 0);
      assert.strictEqual(summary.SIZE_MISMATCH, 0);
      assert.strictEqual(summary.MIME_MISMATCH, 0);
      assert.strictEqual(summary.HASH_MISMATCH, 0);
      assert.strictEqual(summary.DUPLICATE_PATH, 0);
      assert.strictEqual(summary.INVALID_PATH, 0);
      assert.strictEqual(summary.INVALID_METADATA, 0);
      assert.strictEqual(summary.isCleanPass, true);
      assert.ok(summary.sourceInventoryChecksum.length === 64);
      assert.ok(summary.neonMetadataChecksum.length === 64);
      assert.ok(summary.reconciliationChecksum.length === 64);
    });

    it("gera plano de dry-run com 147 WOULD_COPY para destino vazio", () => {
      const { neonRows, storageObjects } = createDeterministic147Fixtures();
      const results = reconcile1to1(neonRows, storageObjects);
      const plan = generateDryRunSyncPlan(results);

      assert.strictEqual(plan.length, 147);
      assert.ok(plan.every((item) => item.decision === "WOULD_COPY"));
      assert.ok(plan.every((item) => item.destinationPath.startsWith("destination://haxr-wedding-photos/")));
    });

    it("gera plano de dry-run com WOULD_SKIP_IDENTICAL para itens já presentes com mesmo hash", () => {
      const { neonRows, storageObjects } = createDeterministic147Fixtures();
      const results = reconcile1to1(neonRows, storageObjects);

      // Simular que o destino já possui os primeiros 50 ficheiros com mesmo hash
      const simulatedDest = new Map();
      for (let i = 0; i < 50; i++) {
        simulatedDest.set(results[i].storagePath, results[i].sha256);
      }

      const plan = generateDryRunSyncPlan(results, simulatedDest);
      const skipped = plan.filter((p) => p.decision === "WOULD_SKIP_IDENTICAL");
      const copied = plan.filter((p) => p.decision === "WOULD_COPY");

      assert.strictEqual(skipped.length, 50);
      assert.strictEqual(copied.length, 97);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. CHECKSUM AGREGADO DETERMINÍSTICO (GATE 3D.1)
  // ───────────────────────────────────────────────────────────────────────────
  describe("Source Inventory & Aggregate Checksums", () => {
    it("sourceInventoryChecksum é calculado sobre TODOS os objetos sem filtrar por MATCH", () => {
      const { storageObjects } = createDeterministic147Fixtures();
      const res = calculateSourceInventoryChecksum(storageObjects);

      assert.strictEqual(res.itemCount, 147);
      assert.strictEqual(res.items.length, 147);
      assert.ok(/^[0-9a-f]{64}$/.test(res.sourceInventoryChecksum));
    });

    it("sourceInventoryChecksum altera se um objeto for adicionado ou removido", () => {
      const { storageObjects } = createDeterministic147Fixtures();
      const baseline = calculateSourceInventoryChecksum(storageObjects).sourceInventoryChecksum;

      // Removendo 1 objeto
      const copy = [...storageObjects];
      copy.pop();
      const modified = calculateSourceInventoryChecksum(copy).sourceInventoryChecksum;

      assert.notStrictEqual(baseline, modified);
    });

    it("sourceInventoryChecksum altera se tamanho, MIME ou hash mudarem", () => {
      const { storageObjects } = createDeterministic147Fixtures();
      const baseline = calculateSourceInventoryChecksum(storageObjects).sourceInventoryChecksum;

      // Alterar tamanho
      const copy1 = storageObjects.map((o, idx) => (idx === 0 ? { ...o, size_bytes: o.size_bytes + 1 } : o));
      assert.notStrictEqual(baseline, calculateSourceInventoryChecksum(copy1).sourceInventoryChecksum);

      // Alterar MIME
      const copy2 = storageObjects.map((o, idx) => (idx === 0 ? { ...o, content_type: "image/png" } : o));
      assert.notStrictEqual(baseline, calculateSourceInventoryChecksum(copy2).sourceInventoryChecksum);

      // Alterar Hash
      const copy3 = storageObjects.map((o, idx) => (idx === 0 ? { ...o, sha256: "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff" } : o));
      assert.notStrictEqual(baseline, calculateSourceInventoryChecksum(copy3).sourceInventoryChecksum);
    });

    it("neonMetadataChecksum e reconciliationChecksum são calculados deterministicamente", () => {
      const { neonRows, storageObjects } = createDeterministic147Fixtures();
      const neonRes = calculateNeonMetadataChecksum(neonRows);
      const reconResults = reconcile1to1(neonRows, storageObjects);
      const reconRes = calculateReconciliationChecksum(reconResults);

      assert.strictEqual(neonRes.itemCount, 147);
      assert.strictEqual(reconRes.totalEvaluated, 147);
      assert.ok(/^[0-9a-f]{64}$/.test(neonRes.neonMetadataChecksum));
      assert.ok(/^[0-9a-f]{64}$/.test(reconRes.reconciliationChecksum));
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. NEGATIVE TESTS: DIVERGÊNCIAS DETETADAS
  // ───────────────────────────────────────────────────────────────────────────
  describe("Divergence Classifications (Negative Scenarios)", () => {
    it("MISSING_OBJECT: deteta quando existe metadata mas blob físico ausente", () => {
      const { neonRows, storageObjects } = createDeterministic147Fixtures();

      // Remove o último objeto do storage
      const removedPath = storageObjects.pop().storage_path;

      const results = reconcile1to1(neonRows, storageObjects);
      const missing = results.find((r) => r.storagePath === removedPath);

      assert.ok(missing);
      assert.strictEqual(missing.status, "MISSING_OBJECT");

      const plan = generateDryRunSyncPlan(results);
      const planItem = plan.find((p) => p.sourcePath === removedPath);
      assert.strictEqual(planItem.decision, "WOULD_BLOCK");
    });

    it("ORPHAN_OBJECT: deteta quando existe blob físico mas não há metadata", () => {
      const { neonRows, storageObjects } = createDeterministic147Fixtures();

      // Adiciona um blob órfão no storage
      const orphanPath = "jessicasamuelwedding/ffffffff-ffff-4fff-8fff-ffffffffffff/original.jpg";
      storageObjects.push({
        storage_path: orphanPath,
        size_bytes: 12345,
        content_type: "image/jpeg",
        sha256: sha256("orphan"),
      });

      const results = reconcile1to1(neonRows, storageObjects);
      const orphan = results.find((r) => r.storagePath === orphanPath);

      assert.ok(orphan);
      assert.strictEqual(orphan.status, "ORPHAN_OBJECT");

      const plan = generateDryRunSyncPlan(results);
      const planItem = plan.find((p) => p.sourcePath === orphanPath);
      assert.strictEqual(planItem.decision, "WOULD_BLOCK");
    });

    it("SIZE_MISMATCH: deteta divergência de tamanho entre metadata e storage", () => {
      const { neonRows, storageObjects } = createDeterministic147Fixtures();

      // Adulterar tamanho do primeiro blob
      storageObjects[0].size_bytes = neonRows[0].file_size_bytes + 999;

      const results = reconcile1to1(neonRows, storageObjects);
      const mismatch = results.find((r) => r.storagePath === neonRows[0].storage_path);

      assert.ok(mismatch);
      assert.strictEqual(mismatch.status, "SIZE_MISMATCH");

      const plan = generateDryRunSyncPlan(results);
      assert.strictEqual(plan.find((p) => p.sourcePath === mismatch.storagePath).decision, "WOULD_REJECT");
    });

    it("MIME_MISMATCH: deteta divergência de Content-Type", () => {
      const { neonRows, storageObjects } = createDeterministic147Fixtures();

      // Adulterar MIME do primeiro blob no storage
      storageObjects[0].content_type = "application/pdf";

      const results = reconcile1to1(neonRows, storageObjects);
      const mismatch = results.find((r) => r.storagePath === neonRows[0].storage_path);

      assert.ok(mismatch);
      assert.strictEqual(mismatch.status, "MIME_MISMATCH");
    });

    it("HASH_MISMATCH: deteta formato de hash SHA-256 ausente ou adulterado", () => {
      const { neonRows, storageObjects } = createDeterministic147Fixtures();

      // Adulterar hash
      storageObjects[0].sha256 = "invalid_hash_string";

      const results = reconcile1to1(neonRows, storageObjects);
      const mismatch = results.find((r) => r.storagePath === neonRows[0].storage_path);

      assert.ok(mismatch);
      assert.strictEqual(mismatch.status, "HASH_MISMATCH");
    });

    it("DUPLICATE_PATH: deteta repetição de path nos metadados", () => {
      const { neonRows, storageObjects } = createDeterministic147Fixtures();

      // Duplicar a primeira linha do Neon
      neonRows.push({ ...neonRows[0] });

      const results = reconcile1to1(neonRows, storageObjects);
      const dup = results.find((r) => r.storagePath === neonRows[0].storage_path);

      assert.ok(dup);
      assert.strictEqual(dup.status, "DUPLICATE_PATH");
    });

    it("INVALID_PATH: rejeita path traversal e caminhos fora do padrão", () => {
      const { neonRows, storageObjects } = createDeterministic147Fixtures();

      // Injeta um path com path traversal nos metadados e storage
      const badPath = "jessicasamuelwedding/../escape/original.jpg";
      neonRows[0].storage_path = badPath;
      storageObjects[0].storage_path = badPath;

      const results = reconcile1to1(neonRows, storageObjects);
      const invalid = results.find((r) => r.storagePath === badPath);

      assert.ok(invalid);
      assert.strictEqual(invalid.status, "INVALID_PATH");
    });

    it("INVALID_METADATA: deteta campos essenciais em falta na DB", () => {
      const { neonRows, storageObjects } = createDeterministic147Fixtures();

      neonRows[0].file_size_bytes = null;

      const results = reconcile1to1(neonRows, storageObjects);
      const invalid = results.find((r) => r.storagePath === neonRows[0].storage_path);

      assert.ok(invalid);
      assert.strictEqual(invalid.status, "INVALID_METADATA");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. FAIL-CLOSED SAFETY GATES
  // ───────────────────────────────────────────────────────────────────────────
  describe("Fail-Closed Security Gates", () => {
    it("falha fechado se TLS verification estiver desativada (NODE_TLS_REJECT_UNAUTHORIZED=0)", () => {
      assert.throws(
        () => validateEnvironmentSafety({ NODE_TLS_REJECT_UNAUTHORIZED: "0" }),
        (err) => {
          assert.ok(err instanceof Gate3DError);
          assert.strictEqual(err.code, "tls_verification_required");
          return true;
        }
      );
    });

    it("bloqueia execução na branch main / master", () => {
      assert.throws(
        () => validateEnvironmentSafety({ NODE_TLS_REJECT_UNAUTHORIZED: "1" }, { mockBranch: "main" }),
        (err) => {
          assert.ok(err instanceof Gate3DError);
          assert.strictEqual(err.code, "production_branch_blocked");
          return true;
        }
      );
    });

    it("falha fechado se a branch não for migration/supabase-to-neon", () => {
      assert.throws(
        () =>
          validateEnvironmentSafety(
            { NODE_TLS_REJECT_UNAUTHORIZED: "1" },
            { mockBranch: "feature/unrelated", requireMigrationBranch: true }
          ),
        (err) => {
          assert.ok(err instanceof Gate3DError);
          assert.strictEqual(err.code, "wrong_migration_branch");
          return true;
        }
      );
    });

    it("falha fechado se o target host do Neon for diferente do esperado", () => {
      assert.throws(
        () =>
          validateEnvironmentSafety(
            { NODE_TLS_REJECT_UNAUTHORIZED: "1" },
            { mockTargetHost: "wrong.neon.tech", requireExactTarget: true }
          ),
        (err) => {
          assert.ok(err instanceof Gate3DError);
          assert.strictEqual(err.code, "neon_target_mismatch");
          return true;
        }
      );
    });

    it("falha fechado se o bucket binding não for wedding-photos", () => {
      assert.throws(
        () =>
          validateEnvironmentSafety(
            { NODE_TLS_REJECT_UNAUTHORIZED: "1" },
            { mockBucket: "public-bucket" }
          ),
        (err) => {
          assert.ok(err instanceof Gate3DError);
          assert.strictEqual(err.code, "wrong_bucket_binding");
          return true;
        }
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. IDEMPOTÊNCIA E ZERO-WRITE GUARANTEE
  // ───────────────────────────────────────────────────────────────────────────
  describe("Idempotency & Zero-Write Verification", () => {
    it("duas execuções consecutivas produzem exatamente o mesmo checksum agregado", () => {
      const { neonRows: rows1, storageObjects: objs1 } = createDeterministic147Fixtures();
      const { neonRows: rows2, storageObjects: objs2 } = createDeterministic147Fixtures();

      const run1 = summarizeReconciliation(reconcile1to1(rows1, objs1), objs1, rows1);
      const run2 = summarizeReconciliation(reconcile1to1(rows2, objs2), objs2, rows2);

      assert.strictEqual(run1.sourceInventoryChecksum, run2.sourceInventoryChecksum);
      assert.strictEqual(run1.neonMetadataChecksum, run2.neonMetadataChecksum);
      assert.strictEqual(run1.reconciliationChecksum, run2.reconciliationChecksum);
      assert.strictEqual(run1.MATCH, run2.MATCH);
      assert.strictEqual(run1.totalBytes, run2.totalBytes);

      // Verificação formal de idempotência
      assert.doesNotThrow(() => assertIdempotency(run1, run2));
    });

    it("falha na idempotência se qualquer contagem ou checksum divergir", () => {
      const { neonRows: rows1, storageObjects: objs1 } = createDeterministic147Fixtures();
      const { neonRows: rows2, storageObjects: objs2 } = createDeterministic147Fixtures();

      const run1 = summarizeReconciliation(reconcile1to1(rows1, objs1), objs1, rows1);

      // Alterar levemente o blob na run 2
      objs2[0].size_bytes += 1;
      const run2 = summarizeReconciliation(reconcile1to1(rows2, objs2), objs2, rows2);

      assert.throws(
        () => assertIdempotency(run1, run2),
        /idempotency_failure/
      );
    });
  });
});
