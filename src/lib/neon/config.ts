export type NeonServerEnvironmentCheck =
  | { ok: true; databaseUrl: string }
  | { ok: false; message: string };

export type NeonClientEnvironmentCheck =
  | { ok: true; authUrl: string; dataApiUrl: string }
  | { ok: false; message: string };

/** Compatibility exports for archived managed-auth modules; never configured at runtime. */
export function getNeonAuthUrl(): string | null { return null; }
export function getNeonDataApiUrl(): string | null { return null; }
export function isNeonClientConfigured(): boolean { return false; }
export function validateNeonClientEnvironment(): NeonClientEnvironmentCheck {
  return { ok: false, message: "Managed authentication is not enabled." };
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
 * The canonical server-side data provider is Neon PostgreSQL.
 */
export function shouldUseNeonServerDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

/**
 * Compatibility-only export for archived modules. New runtime code must use
 * HAXR portal sessions and never this managed-auth path.
 */
export function shouldUseNeonAuthForAppSession(): boolean {
  return false;
}

/**
 * The current HAXR Neon Auth integration uses a same-origin HTTP proxy and
 * native fetch. It does not use the @neondatabase/auth SDK cookie cache, so a
 * separate NEON_AUTH_COOKIE_SECRET is not required for this architecture.
 */
export function isNeonAuthServerConfigured(): boolean {
  return false;
}
