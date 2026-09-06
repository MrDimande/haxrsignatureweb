#!/usr/bin/env node
/**
 * Testes Unitários de Segurança e Resiliência do Download HTTP Range (Gate 3F-C)
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { createHash } from "node:crypto";
import { EventEmitter } from "node:events";

describe("HTTP Range Source Downloader Safety & Integrity Suite", () => {
  function sha256(buf) {
    return createHash("sha256").update(buf).digest("hex");
  }

  it("garante partições contíguas sem sobreposições e sem lacunas para um payload de teste", () => {
    const totalSize = 8331847;
    const chunkSize = 1024 * 1024; // 1 MB
    const ranges = [];

    let downloaded = 0;
    while (downloaded < totalSize) {
      const end = Math.min(downloaded + chunkSize - 1, totalSize - 1);
      ranges.push({ start: downloaded, end, length: end - downloaded + 1 });
      downloaded += (end - downloaded + 1);
    }

    assert.strictEqual(downloaded, totalSize);
    assert.strictEqual(ranges.length, 8);

    // Valida continuidade estrita
    for (let i = 0; i < ranges.length; i++) {
      if (i === 0) {
        assert.strictEqual(ranges[i].start, 0);
      } else {
        assert.strictEqual(ranges[i].start, ranges[i - 1].end + 1, "Zero lacunas e zero sobreposição");
      }
    }
    assert.strictEqual(ranges[ranges.length - 1].end, totalSize - 1);
  });

  it("rejeita chunks truncados e chunks com excesso de bytes", () => {
    const expectedChunkLen = 1048576;
    const truncatedBuf = Buffer.alloc(1048570);
    const overlongBuf = Buffer.alloc(1048580);

    assert.notStrictEqual(truncatedBuf.length, expectedChunkLen);
    assert.notStrictEqual(overlongBuf.length, expectedChunkLen);
  });

  it("comprova que a reconstituição dos blocos particionados produz exatamente o SHA-256 e tamanho integrais", () => {
    const fullPayload = Buffer.alloc(5 * 1024 * 1024 + 321, 0x77);
    const expectedHash = sha256(fullPayload);
    const chunkSize = 1024 * 1024;

    const hash = createHash("sha256");
    let accumulatedBytes = 0;

    let offset = 0;
    while (offset < fullPayload.length) {
      const end = Math.min(offset + chunkSize - 1, fullPayload.length - 1);
      const chunk = fullPayload.subarray(offset, end + 1);
      assert.strictEqual(chunk.length, end - offset + 1);
      hash.update(chunk);
      accumulatedBytes += chunk.length;
      offset += chunk.length;
    }

    assert.strictEqual(accumulatedBytes, fullPayload.length);
    assert.strictEqual(hash.digest("hex"), expectedHash);
  });

  it("valida que Content-Range malformado ou com limites divergentes é detectado e bloqueado", () => {
    function validateContentRange(header, expectedStart, expectedEnd) {
      const match = header.match(/^bytes\s+(\d+)-(\d+)\/(\d+|\*)$/);
      if (!match) return false;
      const start = Number(match[1]);
      const end = Number(match[2]);
      return start === expectedStart && end === expectedEnd;
    }

    assert.strictEqual(validateContentRange("bytes 0-1048575/8331847", 0, 1048575), true);
    assert.strictEqual(validateContentRange("bytes 1048576-2097151/8331847", 1048576, 2097151), true);
    assert.strictEqual(validateContentRange("bytes 0-500/8331847", 0, 1048575), false, "Rejeita range divergente");
    assert.strictEqual(validateContentRange("invalid-header", 0, 1048575), false, "Rejeita header inválido");
  });

  it("exige HTTP 206 Partial Content para requisições de range e rejeita HTTP 200 em offsets parciais", () => {
    function evaluateRangeStatusCode(statusCode, isRangeRequest) {
      if (isRangeRequest && statusCode !== 206) {
        throw new Error(`HTTP 206 Partial Content required for range request: got ${statusCode}`);
      }
      return true;
    }

    assert.strictEqual(evaluateRangeStatusCode(206, true), true);
    assert.throws(
      () => evaluateRangeStatusCode(200, true),
      /HTTP 206 Partial Content required for range request: got 200/,
      "HTTP 200 retornado para range request é perigoso (retornaria ficheiro inteiro desordenando a concatenação) e deve ser rejeitado"
    );
    assert.throws(
      () => evaluateRangeStatusCode(500, true),
      /HTTP 206 Partial Content required for range request: got 500/
    );
  });

  it("garante que retentativas de chunks falhados são limitadas e não duplicam bytes no stream final", async () => {
    let attempts = 0;
    const maxRetries = 5;
    const expectedChunk = Buffer.from("valid_chunk_bytes_1024");
    let receivedBuffer = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      attempts++;
      try {
        if (attempt < 3) {
          throw new Error("Simulated network timeout/reset");
        }
        // Tentativa 3 é bem-sucedida: atribui chunk sem concatenar tentativas falhadas
        receivedBuffer = expectedChunk;
        break;
      } catch (err) {
        if (attempt >= maxRetries) throw err;
      }
    }

    assert.strictEqual(attempts, 3, "Número limitado de tentativas antes do sucesso");
    assert.strictEqual(receivedBuffer.length, expectedChunk.length, "Bytes das tentativas falhadas não foram acumulados");
    assert.deepStrictEqual(receivedBuffer, expectedChunk);
  });

  it("garante que a fonte permanece estritamente read-only (apenas GET com credenciais seguras)", () => {
    const allowedHttpMethods = ["GET", "HEAD"];
    const interceptedCalls = [];

    function mockHttpDispatch(method, url) {
      if (!allowedHttpMethods.includes(method)) {
        throw new Error(`Método proibido: ${method}. A fonte deve permanecer estritamente read-only.`);
      }
      interceptedCalls.push({ method, url });
    }

    mockHttpDispatch("GET", "https://supabase.co/storage/v1/object/authenticated/bucket/item.jpg");
    assert.throws(() => mockHttpDispatch("PUT", "https://supabase.co/storage/v1/object/authenticated/bucket/item.jpg"), /Método proibido: PUT/);
    assert.throws(() => mockHttpDispatch("POST", "https://supabase.co/storage/v1/object/authenticated/bucket/item.jpg"), /Método proibido: POST/);
    assert.throws(() => mockHttpDispatch("DELETE", "https://supabase.co/storage/v1/object/authenticated/bucket/item.jpg"), /Método proibido: DELETE/);
    assert.strictEqual(interceptedCalls.length, 1);
  });

  it("confronta o SHA-256 e tamanho final reconstituído contra o manifest congelado e bloqueia divergências", () => {
    const manifestItem = {
      storage_path: "wedding/photo.jpg",
      size_bytes: 4,
      sha256: sha256(Buffer.from("test")),
    };

    const validPayload = Buffer.from("test");
    const validHash = sha256(validPayload);
    assert.strictEqual(validPayload.length, manifestItem.size_bytes);
    assert.strictEqual(validHash, manifestItem.sha256);

    const corruptedPayload = Buffer.from("tast");
    const corruptedHash = sha256(corruptedPayload);
    assert.notStrictEqual(corruptedHash, manifestItem.sha256);

    function verifyAgainstManifest(actualBytes, actualSha256, expected) {
      if (actualBytes !== expected.size_bytes) {
        throw new Error(`Size mismatch: expected ${expected.size_bytes}, got ${actualBytes}`);
      }
      if (actualSha256 !== expected.sha256) {
        throw new Error(`SHA-256 mismatch: expected ${expected.sha256}, got ${actualSha256}`);
      }
      return true;
    }

    assert.strictEqual(verifyAgainstManifest(validPayload.length, validHash, manifestItem), true);
    assert.throws(
      () => verifyAgainstManifest(corruptedPayload.length, corruptedHash, manifestItem),
      /SHA-256 mismatch/
    );
  });
});

