const NEON_AUTH_URL_KEYS = [
  "NEXT_PUBLIC_NEON_AUTH_URL",
  "NEON_AUTH_BASE_URL",
] as const;

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

export function isNeonAuthServerConfigured(): boolean {
  return Boolean(
    process.env.NEON_AUTH_BASE_URL?.trim() &&
      process.env.NEON_AUTH_COOKIE_SECRET?.trim(),
  );
}
