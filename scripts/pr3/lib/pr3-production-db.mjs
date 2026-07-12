/**
 * PR.3 — ligação Postgres APENAS para produção (oxsrd).
 * Mutations exigem PR3_APPLY_AUTHORIZED=PR3_HUMAN_GO_CONFIRMED.
 */
import pg from "pg";
import {
  PRODUCTION_REF,
  CLONE_REF,
  assertNoEmbeddedPassword,
  buildPoolerDatabaseUrl,
  DASHBOARD_SESSION_POOLER,
} from "./pr3-guards.mjs";

export const APPLY_AUTH_TOKEN = "PR3_HUMAN_GO_CONFIRMED";

export function assertProductionApplyAuthorized() {
  if (process.env.PR3_APPLY_AUTHORIZED?.trim() !== APPLY_AUTH_TOKEN) {
    throw new Error(
      "ABORT: apply em produção bloqueado. Defina PR3_APPLY_AUTHORIZED=PR3_HUMAN_GO_CONFIRMED após GO escrito do proprietário.",
    );
  }
}

export function resolveProductionLibpqUrl() {
  const url =
    process.env.PR3_SOURCE_DATABASE_URL?.trim() ||
    buildPoolerDatabaseUrl(
      process.env.PR3_SOURCE_POOLER_HOST?.trim() ||
        DASHBOARD_SESSION_POOLER.production.host,
      process.env.PR3_SOURCE_POOLER_USER?.trim() ||
        DASHBOARD_SESSION_POOLER.production.user,
    );

  if (!url.includes(PRODUCTION_REF)) {
    throw new Error("ABORT: URL não aponta para produção.");
  }
  if (url.includes(CLONE_REF)) {
    throw new Error("ABORT: URL de produção contém ref do clone.");
  }
  assertNoEmbeddedPassword(url, "PR3_SOURCE_DATABASE_URL");
  return url;
}

export function buildProductionNodeConfig() {
  const password =
    process.env.PR3_SOURCE_PGPASSWORD?.trim() || process.env.PGPASSWORD?.trim();
  if (!password) {
    throw new Error("ABORT: PR3_SOURCE_PGPASSWORD em falta.");
  }

  const parsed = new URL(resolveProductionLibpqUrl());
  parsed.searchParams.set("uselibpqcompat", "true");

  return {
    connectionString: parsed.toString(),
    password,
  };
}

export async function withProductionClient(fn, { requireApplyAuth = false } = {}) {
  if (requireApplyAuth) {
    assertProductionApplyAuthorized();
  }

  const client = new pg.Client(buildProductionNodeConfig());
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export async function queryOne(client, sql, params = []) {
  const result = await client.query(sql, params);
  return result.rows[0] ?? null;
}
