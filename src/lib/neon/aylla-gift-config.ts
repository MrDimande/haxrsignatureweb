export type AyllaGiftDatabaseEnvironmentCheck =
  | { ok: true; databaseUrl: string }
  | { ok: false; message: string };

const AYLLA_GIFT_RUNTIME_ROLE = "haxrweb_runtime";

export function validateAyllaGiftDatabaseEnvironment(): AyllaGiftDatabaseEnvironmentCheck {
  const databaseUrl = process.env.HAXR_AYLLA_GIFT_DATABASE_URL?.trim();
  if (!databaseUrl) {
    return { ok: false, message: "HAXR_AYLLA_GIFT_DATABASE_URL não configurada." };
  }

  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    return { ok: false, message: "HAXR_AYLLA_GIFT_DATABASE_URL inválida." };
  }

  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    return { ok: false, message: "HAXR_AYLLA_GIFT_DATABASE_URL deve usar PostgreSQL." };
  }
  if (decodeURIComponent(parsed.username) !== AYLLA_GIFT_RUNTIME_ROLE) {
    return { ok: false, message: "A Gift Registry requer a identidade haxrweb_runtime." };
  }

  return { ok: true, databaseUrl };
}

export { AYLLA_GIFT_RUNTIME_ROLE };
