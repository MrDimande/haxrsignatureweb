/**
 * PR.3 — guardas origem (produção) / destino (clone).
 * Hosts Session Pooler vêm do Dashboard (nunca inferidos por região).
 */
export const PRODUCTION_REF = "oxsrdmydlqyvnueedgtl";
export const CLONE_REF = "rkkxfrwtmsqzpnbkshnd";
export const EXPECTED_PORT = "5432";
export const EXPECTED_DATABASE = "postgres";

/** Valores recolhidos do Dashboard Connect → Session pooler (porta 5432). */
export const DASHBOARD_SESSION_POOLER = {
  production: {
    host: "aws-1-eu-central-1.pooler.supabase.com",
    user: `postgres.${PRODUCTION_REF}`,
    port: EXPECTED_PORT,
    database: EXPECTED_DATABASE,
    source: "Dashboard Connect Session pooler 5432 (oxsrdmydlqyvnueedgtl)",
  },
  clone: {
    host: "aws-0-eu-central-1.pooler.supabase.com",
    user: `postgres.${CLONE_REF}`,
    port: EXPECTED_PORT,
    database: EXPECTED_DATABASE,
    source:
      "PR4.1 dry-run clone (rkkxfrwtmsqzpnbkshnd) — confirmar no Dashboard Connect Session pooler 5432",
  },
};

export function assertNoEmbeddedPassword(url, label) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`ABORT: ${label} URL inválida.`);
  }
  if (parsed.password) {
    throw new Error(`ABORT: password embebida em ${label}. Usar PGPASSWORD.`);
  }
  if (/:[^/@]+@/.test(parsed.username)) {
    throw new Error(`ABORT: credenciais embebidas em ${label}.`);
  }
}

export function buildPoolerDatabaseUrl(host, user, database = EXPECTED_DATABASE) {
  const h = host?.trim();
  const u = user?.trim();
  const db = database?.trim() || EXPECTED_DATABASE;
  if (!h || !u) {
    throw new Error("ABORT: host ou user do pooler em falta.");
  }
  return `postgresql://${encodeURIComponent(u)}@${h}:${EXPECTED_PORT}/${db}?sslmode=require`;
}

export function validatePoolerEndpoint({ host, user, expectedRef, label }) {
  const h = host?.trim() ?? "";
  const u = user?.trim() ?? "";
  if (!h) {
    return { ok: false, reason: `missing_${label}_POOLER_HOST` };
  }
  if (!u) {
    return { ok: false, reason: `missing_${label}_POOLER_USER` };
  }
  if (!h.endsWith(".pooler.supabase.com")) {
    return { ok: false, reason: `${label}_host_not_session_pooler` };
  }
  if (!u.includes(expectedRef)) {
    return { ok: false, reason: `${label}_user_missing_project_ref` };
  }
  if (u !== `postgres.${expectedRef}`) {
    return { ok: false, reason: `${label}_user_must_be_postgres_dot_ref` };
  }
  return { ok: true, ref: expectedRef, host: h, user: u };
}

export function validateSourceUrl(url) {
  const u = url?.trim() ?? "";
  if (!u) {
    return { ok: false, reason: "missing_PR3_SOURCE_DATABASE_URL" };
  }
  if (!u.includes(PRODUCTION_REF)) {
    return { ok: false, reason: "source_missing_production_ref" };
  }
  if (u.includes(CLONE_REF)) {
    return { ok: false, reason: "source_contains_clone_ref" };
  }
  if (/uselibpqcompat/i.test(u)) {
    return { ok: false, reason: "uselibpqcompat_not_allowed_on_libpq_url" };
  }
  try {
    assertNoEmbeddedPassword(u, "PR3_SOURCE_DATABASE_URL");
    const parsed = new URL(u);
    const port = parsed.port || EXPECTED_PORT;
    if (port !== EXPECTED_PORT) {
      return { ok: false, reason: "source_port_mismatch" };
    }
    if ((parsed.pathname || "").replace(/^\//, "") !== EXPECTED_DATABASE) {
      return { ok: false, reason: "source_database_mismatch" };
    }
    const endpoint = validatePoolerEndpoint({
      host: parsed.hostname,
      user: decodeURIComponent(parsed.username),
      expectedRef: PRODUCTION_REF,
      label: "source",
    });
    if (!endpoint.ok) {
      return endpoint;
    }
  } catch (error) {
    return { ok: false, reason: error.message };
  }
  return { ok: true, ref: PRODUCTION_REF };
}

export function validateDestUrl(url) {
  const u = url?.trim() ?? "";
  if (!u) {
    return { ok: false, reason: "missing_PR3_DEST_DATABASE_URL" };
  }
  if (!u.includes(CLONE_REF)) {
    return { ok: false, reason: "dest_missing_clone_ref" };
  }
  if (u.includes(PRODUCTION_REF)) {
    return { ok: false, reason: "dest_contains_production_ref" };
  }
  if (/uselibpqcompat/i.test(u)) {
    return { ok: false, reason: "uselibpqcompat_not_allowed_on_libpq_url" };
  }
  try {
    assertNoEmbeddedPassword(u, "PR3_DEST_DATABASE_URL");
    const parsed = new URL(u);
    const port = parsed.port || EXPECTED_PORT;
    if (port !== EXPECTED_PORT) {
      return { ok: false, reason: "dest_port_mismatch" };
    }
    if ((parsed.pathname || "").replace(/^\//, "") !== EXPECTED_DATABASE) {
      return { ok: false, reason: "dest_database_mismatch" };
    }
    const endpoint = validatePoolerEndpoint({
      host: parsed.hostname,
      user: decodeURIComponent(parsed.username),
      expectedRef: CLONE_REF,
      label: "dest",
    });
    if (!endpoint.ok) {
      return endpoint;
    }
  } catch (error) {
    return { ok: false, reason: error.message };
  }
  return { ok: true, ref: CLONE_REF };
}

export function resolvePr3PoolerEnv() {
  const sourceHost =
    process.env.PR3_SOURCE_POOLER_HOST?.trim() ||
    DASHBOARD_SESSION_POOLER.production.host;
  const sourceUser =
    process.env.PR3_SOURCE_POOLER_USER?.trim() ||
    DASHBOARD_SESSION_POOLER.production.user;
  const destHost =
    process.env.PR3_DEST_POOLER_HOST?.trim() ||
    DASHBOARD_SESSION_POOLER.clone.host;
  const destUser =
    process.env.PR3_DEST_POOLER_USER?.trim() ||
    DASHBOARD_SESSION_POOLER.clone.user;

  process.env.PR3_SOURCE_POOLER_HOST = sourceHost;
  process.env.PR3_SOURCE_POOLER_USER = sourceUser;
  process.env.PR3_DEST_POOLER_HOST = destHost;
  process.env.PR3_DEST_POOLER_USER = destUser;

  if (!process.env.PR3_SOURCE_DATABASE_URL?.trim()) {
    process.env.PR3_SOURCE_DATABASE_URL = buildPoolerDatabaseUrl(
      sourceHost,
      sourceUser,
    );
  }
  if (!process.env.PR3_DEST_DATABASE_URL?.trim()) {
    process.env.PR3_DEST_DATABASE_URL = buildPoolerDatabaseUrl(destHost, destUser);
  }

  if (
    sourceHost === destHost &&
    sourceUser === destUser &&
    process.env.PR3_SOURCE_DATABASE_URL === process.env.PR3_DEST_DATABASE_URL
  ) {
    return { abort: true, reason: "source_and_dest_identical" };
  }

  return {
    sourceHost,
    sourceUser,
    destHost,
    destUser,
    sourceUrl: process.env.PR3_SOURCE_DATABASE_URL,
    destUrl: process.env.PR3_DEST_DATABASE_URL,
  };
}

export function validatePr3Env() {
  resolvePr3PoolerEnv();

  const source = process.env.PR3_SOURCE_DATABASE_URL?.trim() ?? "";
  const dest = process.env.PR3_DEST_DATABASE_URL?.trim() ?? "";
  const sourcePw = process.env.PR3_SOURCE_PGPASSWORD?.trim() ?? "";
  const destPw = process.env.PR3_DEST_PGPASSWORD?.trim() ?? "";

  const sourceCheck = validateSourceUrl(source);
  const destCheck = validateDestUrl(dest);

  const result = {
    sourceCheck,
    destCheck,
    sourcePasswordSet: Boolean(sourcePw),
    destPasswordSet: Boolean(destPw),
    sourcePoolerHost: process.env.PR3_SOURCE_POOLER_HOST,
    destPoolerHost: process.env.PR3_DEST_POOLER_HOST,
    sameRef:
      source.includes(PRODUCTION_REF) &&
      dest.includes(CLONE_REF) &&
      source === dest,
    abort: false,
    reason: null,
  };

  if (!sourceCheck.ok) {
    result.abort = true;
    result.reason = sourceCheck.reason;
    return result;
  }
  if (!destCheck.ok) {
    result.abort = true;
    result.reason = destCheck.reason;
    return result;
  }
  if (source === dest) {
    result.abort = true;
    result.reason = "source_and_dest_identical";
    return result;
  }
  if (!sourcePw) {
    result.abort = true;
    result.reason = "missing_PR3_SOURCE_PGPASSWORD";
    return result;
  }
  if (!destPw) {
    result.abort = true;
    result.reason = "missing_PR3_DEST_PGPASSWORD";
  }
  return result;
}

/** Bloqueia comandos cujo target URL aponta para produção em fase mutável. */
export function assertMutableTargetIsClone(targetUrl, phase) {
  if (targetUrl.includes(PRODUCTION_REF)) {
    throw new Error(`ABORT: fase mutável "${phase}" bloqueada contra produção.`);
  }
  if (!targetUrl.includes(CLONE_REF)) {
    throw new Error(`ABORT: fase mutável "${phase}" requer clone ${CLONE_REF}.`);
  }
}

export function maskProjectRef(ref) {
  if (!ref || ref.length < 8) return "***";
  return `${ref.slice(0, 4)}…${ref.slice(-4)}`;
}

export function sanitizePoolerEndpoint(host, user) {
  const maskedUser = user.replace(
    /postgres\.([a-z0-9]+)/,
    (_, r) => `postgres.${maskProjectRef(r)}`,
  );
  return { host, user: maskedUser, port: EXPECTED_PORT, database: EXPECTED_DATABASE };
}
