import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  TARGET_R2_SPEC,
  validateGate3FPreflight,
  loadR2Environment,
  checkWranglerWhoami,
  CloudflareR2Provisioner,
} from "./provision-r2-infrastructure.mjs";

describe("Gate 3F-A.2 — Wrangler Auth, S3 SDK Hardening & Live Destination Validation Suite", () => {
  // ───────────────────────────────────────────────────────────────────────────
  // 1. PREFLIGHT & BASELINE INTEGRITY
  // ───────────────────────────────────────────────────────────────────────────
  describe("Preflight & Baseline Validations", () => {
    it("aprova preflight com branch correta e baseline intacto", () => {
      const result = validateGate3FPreflight(process.env, {
        mockBranch: "migration/supabase-to-neon",
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.branch, "migration/supabase-to-neon");
      assert.strictEqual(result.gate3dBaseline, "VERIFIED");
      assert.strictEqual(result.gate3eManifest, "VERIFIED");
      assert.strictEqual(result.allowStagingDefault, "VERIFIED_FALSE");
      assert.strictEqual(result.storageCutoverReady, false);
    });

    it("bloqueia imediatamente execução na branch main ou master", () => {
      assert.throws(
        () => validateGate3FPreflight(process.env, { mockBranch: "main" }),
        /production_branch_blocked/
      );
    });

    it("bloqueia se o baseline do Gate 3D divergir (checksum, contagem ou bytes)", () => {
      assert.throws(
        () =>
          validateGate3FPreflight(process.env, {
            mockBranch: "migration/supabase-to-neon",
            mockBaseline: {
              sourceInventoryChecksum: "0000000000000000000000000000000000000000000000000000000000000000",
              sourceObjectCount: 147,
              sourceTotalBytes: 535493700,
            },
          }),
        /gate_3d_baseline_checksum_mismatch/
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. WRANGLER WHOAMI & OPERATOR_AUTHENTICATION_REQUIRED
  // ───────────────────────────────────────────────────────────────────────────
  describe("Wrangler Canonical Authentication Detection", () => {
    it("executa detecção canónica via wrangler whoami e detecta loggedIn: false", () => {
      const whoami = checkWranglerWhoami();
      assert.strictEqual(whoami.loggedIn, false);
    });

    it("reporta LOCAL_ENV_FILE_MISSING quando ficheiro de ambiente está ausente", async () => {
      const envInfo = loadR2Environment({}, { envPath: "non-existent-test.env" });
      const provisioner = new CloudflareR2Provisioner(envInfo);

      const inspectResult = await provisioner.inspectAndValidateBucket({
        mockWhoamiResult: { loggedIn: false },
      });

      assert.strictEqual(inspectResult.status, "BLOCKED");
      assert.strictEqual(inspectResult.code, "LOCAL_ENV_FILE_MISSING");
    });

    it("reporta OPERATOR_R2_READ_CREDENTIAL_REQUIRED quando possui API Token mas faltam credenciais S3", async () => {
      const envInfo = loadR2Environment({
        CLOUDFLARE_ACCOUNT_ID: "account-test",
        CLOUDFLARE_API_TOKEN: "token-test",
      }, { envPath: "non-existent-test.env" });
      const provisioner = new CloudflareR2Provisioner(envInfo);

      const inspectResult = await provisioner.inspectAndValidateBucket();
      assert.strictEqual(inspectResult.status, "BLOCKED");
      assert.strictEqual(inspectResult.code, "OPERATOR_R2_READ_CREDENTIAL_REQUIRED");
      assert.ok(inspectResult.requiredAction !== undefined);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. ACCOUNT PINNING & CREDENTIAL SECURITY
  // ───────────────────────────────────────────────────────────────────────────
  describe("Account Pinning & Separation of Privileges", () => {
    it("valida com sucesso Account ID quando coincide com o pinned", () => {
      const result = loadR2Environment({
        CLOUDFLARE_ACCOUNT_ID: "account-12345",
        EXPECTED_CLOUDFLARE_ACCOUNT_ID: "account-12345",
        R2_ACCESS_KEY_ID: "key-123",
        R2_SECRET_ACCESS_KEY: "secret-456",
      });

      assert.strictEqual(result.accountId, "account-12345");
      assert.strictEqual(result.expectedAccountId, "account-12345");
    });

    it("bloqueia fail-closed se o Cloudflare Account ID divergir do pinned", () => {
      assert.throws(
        () =>
          loadR2Environment({
            CLOUDFLARE_ACCOUNT_ID: "account-real-wrong",
            EXPECTED_CLOUDFLARE_ACCOUNT_ID: "account-pinned-expected",
          }),
        /cloudflare_account_id_mismatch/
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. AWS SDK V3 READ-ONLY LIVE SIMULATION
  // ───────────────────────────────────────────────────────────────────────────
  describe("AWS SDK v3 S3 Client Validation", () => {
    it("valida com sucesso bucket vazio (objectCount = 0) através de adapter simulado", async () => {
      const mockAdapter = {
        inspect: async (bucketName) => ({
          status: "READY",
          bucket: bucketName,
          visibility: "private",
          objectCount: 0,
          totalBytes: 0,
          authenticatedReadConnectivity: "VERIFIED",
          writeCapability: "NOT_VERIFIED",
        }),
      };

      const provisioner = new CloudflareR2Provisioner(
        { bucketName: TARGET_R2_SPEC.bucketName },
        mockAdapter
      );

      const result = await provisioner.inspectAndValidateBucket();
      assert.strictEqual(result.status, "READY");
      assert.strictEqual(result.objectCount, 0);
      assert.strictEqual(result.totalBytes, 0);
      assert.strictEqual(result.authenticatedReadConnectivity, "VERIFIED");
      assert.strictEqual(result.writeCapability, "NOT_VERIFIED");
    });

    it("bloqueia com DESTINATION_NOT_EMPTY se o bucket contiver objetos (objectCount > 0)", async () => {
      const mockAdapter = {
        inspect: async () => ({
          status: "BLOCKED",
          code: "DESTINATION_NOT_EMPTY",
          message: "O bucket contém 3 objetos inesperados.",
          objectCount: 3,
          totalBytes: 15000,
        }),
      };

      const provisioner = new CloudflareR2Provisioner(
        { bucketName: TARGET_R2_SPEC.bucketName },
        mockAdapter
      );

      const result = await provisioner.inspectAndValidateBucket();
      assert.strictEqual(result.status, "BLOCKED");
      assert.strictEqual(result.code, "DESTINATION_NOT_EMPTY");
      assert.strictEqual(result.objectCount, 3);
    });
  });
});
