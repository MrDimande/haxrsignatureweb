const NEON_AUTH_URL_KEYS = [
  "NEON_AUTH_BASE_URL",
  "NEXT_PUBLIC_NEON_AUTH_URL",
] as const;

const DATABASE_MIGRATION_BRANCH = "migration/supabase-to-neon";

export type NeonClientEnvironmentCheck =
  | { ok: true; authUrl: string; dataApiUrl: string }
  | { ok: false; message: string };

export type NeonServerEnvironmentCheck =
  | { ok: true; databaseUrl: string }
  | { ok: false; message: string };

function firstConfiguredEnv(keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return null;
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isMigrationVercelPreview(): boolean {
  return (
    process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === DATABASE_MIGRATION_BRANCH
  );
}

export function getNeonAuthUrl(): string | null {
  return firstConfiguredEnv(NEON_AUTH_URL_KEYS);
}

export function getNeonDataApiUrl(): string | null {
  return process.env.NEXT_PUBLIC_NEON_DATA_API_URL?.trim() || null;
}

export function isNeonClientConfigured(): boolean {
  return Boolean(getNeonAuthUrl() && getNeonDataApiUrl());
}

export function validateNeonClientEnvironment(): NeonClientEnvironmentCheck {
  const authUrl = getNeonAuthUrl();
  const dataApiUrl = getNeonDataApiUrl();

  if (!authUrl || !dataApiUrl) {
    return {
      ok: false,
      message:
        "Neon Preview não configurado. Defina NEXT_PUBLIC_NEON_AUTH_URL e NEXT_PUBLIC_NEON_DATA_API_URL.",
    };
  }

  if (!isHttpsUrl(authUrl) || !isHttpsUrl(dataApiUrl)) {
    return {
      ok: false,
      message: "Os endpoints públicos do Neon devem ser URLs HTTPS válidos.",
    };
  }

  return { ok: true, authUrl, dataApiUrl };
}

export function validateNeonServerEnvironment(): NeonServerEnvironmentCheck {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    return {
      ok: false,
      message: "DATABASE_URL do Neon não configurada para o backend privado.",
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    return { ok: false, message: "DATABASE_URL do Neon é inválida." };
  }

  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    return {
      ok: false,
      message: "DATABASE_URL deve utilizar o protocolo postgres/postgresql.",
    };
  }

  return { ok: true, databaseUrl };
}

/**
 * Progressive cutover switch for privileged/server-side database access.
 *
 * Production must never move merely because DATABASE_URL exists. The migration
 * branch uses Neon automatically in Vercel Preview; every other environment
 * remains on Supabase unless HAXR_DATABASE_PROVIDER=neon is explicitly set.
 */
export function shouldUseNeonServerDatabase(): boolean {
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
  if (!hasDatabaseUrl) return false;

  if (process.env.HAXR_DATABASE_PROVIDER?.trim().toLowerCase() === "neon") {
    return true;
  }

  return isMigrationVercelPreview();
}

/**
 * Auth cutover is intentionally stricter than the database cutover.
 *
 * On Vercel, an explicit HAXR_AUTH_PROVIDER=neon request is accepted only for
 * the isolated migration Preview branch. This remains safe even if vercel.json
 * is later merged into main: Production cannot satisfy the Preview + branch lock.
 * Outside Vercel (for deliberate local testing), the explicit provider switch is
 * sufficient when both Auth and private database connectivity are configured.
 */
export function shouldUseNeonAuthForAppSession(): boolean {
  if (process.env.HAXR_AUTH_PROVIDER?.trim().toLowerCase() !== "neon") {
    return false;
  }

  if (!getNeonAuthUrl() || !process.env.DATABASE_URL?.trim()) {
    return false;
  }

  if (process.env.VERCEL_ENV || process.env.VERCEL_GIT_COMMIT_REF) {
    return isMigrationVercelPreview();
  }

  return true;
}

/**
 * The current HAXR Neon Auth integration uses a same-origin HTTP proxy and
 * native fetch. It does not use the @neondatabase/auth SDK cookie cache, so a
 * separate NEON_AUTH_COOKIE_SECRET is not required for this architecture.
 */
export function isNeonAuthServerConfigured(): boolean {
  return Boolean(getNeonAuthUrl() && process.env.DATABASE_URL?.trim());
}
