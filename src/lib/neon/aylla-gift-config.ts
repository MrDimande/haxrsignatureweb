export type AyllaGiftDatabaseEnvironmentCheck =
  | { ok: true; issuerDatabaseUrl: string; runtimeDatabaseUrl: string }
  | { ok: false; message: string };

const AYLLA_GIFT_ISSUER_ROLE = "haxr_aylla_gift_issuer";
const AYLLA_GIFT_RUNTIME_ROLE = "haxr_aylla_gift_runtime";

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

export { AYLLA_GIFT_ISSUER_ROLE, AYLLA_GIFT_RUNTIME_ROLE };
