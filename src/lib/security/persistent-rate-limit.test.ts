import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { persistentRateLimit } from "./persistent-rate-limit";
import {
  pruneExpiredPersistentRateLimits,
  queryPersistentRateLimitState,
} from "./persistent-rate-limit.neon";

describe("persistentRateLimit", () => {
  const config = { max: 5, windowMs: 60 * 1000 };

  it("retorna o resultado da RPC persistente com sucesso quando permitido", async () => {
    let calledWith: unknown[] = [];

    const result = await persistentRateLimit("test-key-allowed", config, {
      dependencies: {
        invokeNeon: async (k, m, w) => {
          calledWith = [k, m, w];
          return { allowed: true, remaining: 4, retry_after_seconds: 0 };
        },
      },
    });

    assert.deepEqual(calledWith, ["test-key-allowed", 5, 60]);
    assert.deepEqual(result, {
      allowed: true,
      remaining: 4,
      retryAfterSeconds: 0,
    });
  });

  it("retorna o bloqueio quando a RPC persistente indica limite excedido", async () => {
    const result = await persistentRateLimit("test-key-blocked", config, {
      dependencies: {
        invokeNeon: async () => ({
          allowed: false,
          remaining: 0,
          retry_after_seconds: 45,
        }),
      },
    });

    assert.deepEqual(result, {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 45,
    });
  });

  it("utiliza queryPersistentRateLimitState quando increment: false", async () => {
    let queryCalledWith: unknown[] = [];
    let invokeCalled = false;

    const result = await persistentRateLimit("test-key-no-inc", config, {
      increment: false,
      dependencies: {
        queryNeonState: async (k, m, w) => {
          queryCalledWith = [k, m, w];
          return { allowed: true, remaining: 5, retry_after_seconds: 0 };
        },
        invokeNeon: async () => {
          invokeCalled = true;
          return null;
        },
      },
    });

    assert.deepEqual(queryCalledWith, ["test-key-no-inc", 5, 60]);
    assert.equal(invokeCalled, false);
    assert.deepEqual(result, {
      allowed: true,
      remaining: 5,
      retryAfterSeconds: 0,
    });
  });

  it("executa fallback seguro para limitador em memória se o banco falhar", async () => {
    const originalWarn = console.warn;
    let warned = false;
    let fallbackCalledWith: unknown[] = [];

    try {
      console.warn = (msg: unknown) => {
        if (msg === "[rate-limit:persistent-fallback-to-memory]") warned = true;
      };

      const result = await persistentRateLimit("fallback-key-mem-1", config, {
        dependencies: {
          invokeNeon: async () => {
            throw new Error("connection timeout to neon database");
          },
          memoryFallback: (k, cfg, opt) => {
            fallbackCalledWith = [k, cfg, opt];
            return { allowed: true, remaining: 4, retryAfterSeconds: 0 };
          },
        },
      });

      assert.equal(warned, true);
      assert.deepEqual(fallbackCalledWith, [
        "fallback-key-mem-1",
        config,
        { increment: true },
      ]);
      assert.equal(result.allowed, true);
      assert.equal(result.remaining, 4);
    } finally {
      console.warn = originalWarn;
    }
  });

  it("bloqueia preventivamente com 503 e Retry-After curto quando failClosed: true em caso de falha de banco", async () => {
    const originalWarn = console.warn;
    let warnedPrefix: unknown = null;
    try {
      console.warn = (_msg: unknown, meta?: unknown) => {
        if (typeof meta === "object" && meta !== null && "bucket" in meta) {
          warnedPrefix = (meta as { bucket: unknown }).bucket;
        }
      };

      const result = await persistentRateLimit("portal-login:192.168.1.1", config, {
        failClosed: true,
        dependencies: {
          invokeNeon: async () => {
            throw new Error("neon database unreachable");
          },
        },
      });

      assert.equal(result.allowed, false);
      assert.equal(result.remaining, 0);
      assert.equal(result.retryAfterSeconds, 30);
      assert.equal(result.serviceUnavailable, true);
      assert.equal(warnedPrefix, "portal-login");
    } finally {
      console.warn = originalWarn;
    }
  });

  it("nega preventivamente quando a RPC de rate limit devolve resultado nulo com failClosed: true", async () => {
    const originalWarn = console.warn;
    let loggedBucket: unknown = null;
    try {
      console.warn = (_msg: unknown, meta?: unknown) => {
        if (typeof meta === "object" && meta !== null && "bucket" in meta) {
          loggedBucket = (meta as { bucket: unknown }).bucket;
        }
      };

      const result = await persistentRateLimit("portal-login:10.0.0.5", config, {
        failClosed: true,
        dependencies: {
          invokeNeon: async () => null,
        },
      });

      assert.equal(result.allowed, false);
      assert.equal(result.remaining, 0);
      assert.equal(result.retryAfterSeconds, 30);
      assert.equal(result.serviceUnavailable, true);
      assert.equal(loggedBucket, "portal-login");
    } finally {
      console.warn = originalWarn;
    }
  });

  it("nega preventivamente quando a RPC de rate limit devolve resultado malformado com failClosed: true", async () => {
    const originalWarn = console.warn;
    try {
      console.warn = () => {};

      const result = await persistentRateLimit("portal-register:172.16.0.1", config, {
        failClosed: true,
        dependencies: {
          invokeNeon: async () => ({ invalid_structure: 123 }),
        },
      });

      assert.equal(result.allowed, false);
      assert.equal(result.remaining, 0);
      assert.equal(result.retryAfterSeconds, 30);
      assert.equal(result.serviceUnavailable, true);
    } finally {
      console.warn = originalWarn;
    }
  });

  it("reembolsa tentativa atómica persistente chamando neon e memória graciosamente", async () => {
    let neonRefundCalledWith: string | null = null;
    let memoryRefundCalledWith: string | null = null;

    const { refundPersistentRateLimit } = await import("./persistent-rate-limit");
    await refundPersistentRateLimit("portal-login:192.168.1.1", {
      dependencies: {
        refundNeon: async (key: string) => {
          neonRefundCalledWith = key;
        },
        memoryRefund: (key: string) => {
          memoryRefundCalledWith = key;
        },
      },
    });

    assert.equal(neonRefundCalledWith, "portal-login:192.168.1.1");
    assert.equal(memoryRefundCalledWith, "portal-login:192.168.1.1");
  });

  it("bloqueia a próxima tentativa quando o contador de falhas já atingiu o limite", async () => {
    const result = await queryPersistentRateLimitState(
      "portal-login-email:test",
      5,
      60,
      (async () => ({
        rows: [{ request_count: 5, window_start: new Date().toISOString() }],
        rowCount: 1,
        fields: [],
        command: "SELECT",
      })) as never,
    );

    assert.deepEqual(result, {
      allowed: false,
      remaining: 0,
      retry_after_seconds: 60,
    });
  });

  it("limpa buckets expirados com TTL explícito no trabalho agendado", async () => {
    let executedQuery = "";
    let calledWith: unknown[] = [];
    const deleted = await pruneExpiredPersistentRateLimits(
      86_400,
      (async (queryText: unknown, values?: readonly unknown[]) => {
        executedQuery = String(queryText);
        calledWith = (values ?? []) as unknown[];
        return {
          rows: [{ count: "3" }],
          rowCount: 1,
          fields: [],
          command: "SELECT",
        };
      }) as never,
    );

    assert.deepEqual(calledWith, [86_400]);
    assert.match(executedQuery, /bucket_key LIKE 'portal-%'/);
    assert.equal(deleted, 3);
  });
});
