export type AyllaGiftDatabaseEnvironmentCheck =
  | { ok: true; issuerDatabaseUrl: string; runtimeDatabaseUrl: string }
  | { ok: false; message: string };

export type AyllaGiftAdminEnvironmentCheck =
  | { ok: true; adminDatabaseUrl: string }
  | { ok: false; message: string };

const AYLLA_GIFT_ISSUER_ROLE = "haxr_aylla_gift_issuer";
const AYLLA_GIFT_RUNTIME_ROLE = "haxr_aylla_gift_runtime";
const AYLLA_GIFT_ADMIN_ROLE = "haxr_aylla_gift_admin";

function isStrongTlsRequired(hostname: string): boolean {
  const vercelEnv = process.env.VERCEL_ENV?.trim().toLowerCase();
  const targetEnv = process.env.VERCEL_TARGET_ENV?.trim().toLowerCase();
  if (vercelEnv === "production" || targetEnv === "production") {
    return true;
  }
  return hostname.toLowerCase().endsWith(".neon.tech");
}

function parsePostgresUrl(rawUrl: string, expectedRole: string, envVarName: string): { ok: true; url: string; username: string } | { ok: false; message: string } {
  if (!rawUrl) {
    return { ok: false, message: `${envVarName} não configurada.` };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, message: `${envVarName} inválida.` };
  }

  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    return { ok: false, message: `${envVarName} deve usar PostgreSQL.` };
  }

  const sslMode = parsed.searchParams.get("sslmode")?.trim().toLowerCase() ?? "";
  if (sslMode === "disable" || sslMode === "allow" || sslMode === "prefer") {
    return {
      ok: false,
      message: `${envVarName} exige ligação TLS segura (sslmode=verify-full ou sslmode=require).`,
    };
  }

  if (isStrongTlsRequired(parsed.hostname) && sslMode !== "verify-full" && sslMode !== "require") {
    return {
      ok: false,
      message: `${envVarName} requer parâmetro TLS explícito (sslmode=verify-full ou sslmode=require) em Neon/Produção.`,
    };
  }

  const username = decodeURIComponent(parsed.username);
  if (username !== expectedRole) {
    return { ok: false, message: `${envVarName} requer a identidade ${expectedRole}.` };
  }

  return { ok: true, url: rawUrl, username };
}

export function validateAyllaGiftDatabaseEnvironment(): AyllaGiftDatabaseEnvironmentCheck {
  const issuerRaw = process.env.HAXR_AYLLA_GIFT_ISSUER_DATABASE_URL?.trim() ?? "";
  const runtimeRaw = process.env.HAXR_AYLLA_GIFT_DATABASE_URL?.trim() ?? "";

  const issuerCheck = parsePostgresUrl(issuerRaw, AYLLA_GIFT_ISSUER_ROLE, "HAXR_AYLLA_GIFT_ISSUER_DATABASE_URL");
  if (!issuerCheck.ok) {
    return { ok: false, message: issuerCheck.message };
  }

  const runtimeCheck = parsePostgresUrl(runtimeRaw, AYLLA_GIFT_RUNTIME_ROLE, "HAXR_AYLLA_GIFT_DATABASE_URL");
  if (!runtimeCheck.ok) {
    return { ok: false, message: runtimeCheck.message };
  }

  if (issuerCheck.username === runtimeCheck.username || issuerCheck.url === runtimeCheck.url) {
    return {
      ok: false,
      message: "Configuração rejeitada: as conexões de emissão e de runtime de convidados não podem apontar para a mesma identidade.",
    };
  }

  return {
    ok: true,
    issuerDatabaseUrl: issuerCheck.url,
    runtimeDatabaseUrl: runtimeCheck.url,
  };
}

export function validateAyllaGiftAdminEnvironment(): AyllaGiftAdminEnvironmentCheck {
  const adminRaw = process.env.HAXR_AYLLA_GIFT_ADMIN_DATABASE_URL?.trim() ?? "";
  const adminCheck = parsePostgresUrl(
    adminRaw,
    AYLLA_GIFT_ADMIN_ROLE,
    "HAXR_AYLLA_GIFT_ADMIN_DATABASE_URL"
  );
  if (!adminCheck.ok) {
    return { ok: false, message: adminCheck.message };
  }

  const runtimeRaw = process.env.HAXR_AYLLA_GIFT_DATABASE_URL?.trim() ?? "";
  const issuerRaw = process.env.HAXR_AYLLA_GIFT_ISSUER_DATABASE_URL?.trim() ?? "";
  if (adminCheck.url === runtimeRaw || adminCheck.url === issuerRaw) {
    return {
      ok: false,
      message: "Configuração rejeitada: HAXR_AYLLA_GIFT_ADMIN_DATABASE_URL deve usar conexão exclusiva para haxr_aylla_gift_admin.",
    };
  }

  return { ok: true, adminDatabaseUrl: adminCheck.url };
}

export { AYLLA_GIFT_ADMIN_ROLE, AYLLA_GIFT_ISSUER_ROLE, AYLLA_GIFT_RUNTIME_ROLE };
