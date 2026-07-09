/** Preview/staging — client app auth validation (Fase B). */
export const SUPABASE_PREVIEW_PROJECT_REF = "uxleigndoomoezwsxlan";

/** Production — Core + Edition RSVP. Never use for client app auth dev. */
export const SUPABASE_PRODUCTION_PROJECT_REF = "oxsrdmydlqyvnueedgtl";

export const SUPABASE_PREVIEW_URL = `https://${SUPABASE_PREVIEW_PROJECT_REF}.supabase.co`;

export function getSupabaseProjectRef(url?: string): string | null {
  const value = url ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) return null;

  const match = value.match(/https?:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] ?? null;
}

/** Reads the Supabase project ref embedded in a JWT without logging the token. */
export function getSupabaseJwtProjectRef(token?: string): string | null {
  const value = token?.trim();
  if (!value) return null;

  const payload = value.split(".")[1];
  if (!payload) return null;

  try {
    const json = JSON.parse(
      Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(
        "utf8",
      ),
    ) as { ref?: unknown };

    return typeof json.ref === "string" ? json.ref : null;
  } catch {
    return null;
  }
}

export function isSupabaseAnonConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function isClientAppAuthPreviewTarget(url?: string): boolean {
  return getSupabaseProjectRef(url) === SUPABASE_PREVIEW_PROJECT_REF;
}

export type ClientAppAuthEnvCheck =
  | { ok: true; projectRef: string }
  | { ok: false; message: string };

/**
 * Guards client sign-in against accidental production use during local dev.
 * In development, only the preview project ref is allowed for /sign-in.
 */
export function validateClientAppAuthEnvironment(): ClientAppAuthEnvCheck {
  if (!isSupabaseAnonConfigured()) {
    return {
      ok: false,
      message:
        "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const projectRef = getSupabaseProjectRef();
  if (!projectRef) {
    return {
      ok: false,
      message: "NEXT_PUBLIC_SUPABASE_URL inválido.",
    };
  }

  if (
    process.env.NODE_ENV === "development" &&
    projectRef === SUPABASE_PRODUCTION_PROJECT_REF
  ) {
    return {
      ok: false,
      message:
        "Ambiente local aponta para produção. Crie .env.development.local com o preview uxleigndoomoezwsxlan antes de testar o sign-in.",
    };
  }

  return { ok: true, projectRef };
}

/**
 * Ensures service-role operations (snapshots) only run against the preview
 * project during local development — never production.
 */
export function validateClientAppServiceRoleEnvironment(): ClientAppAuthEnvCheck {
  const envCheck = validateClientAppAuthEnvironment();
  if (!envCheck.ok) {
    return envCheck;
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return {
      ok: false,
      message:
        "SUPABASE_SERVICE_ROLE_KEY não definida. Adicione a chave do preview em .env.development.local para criar snapshots.",
    };
  }

  const urlRef = envCheck.projectRef;
  const serviceRoleRef = getSupabaseJwtProjectRef(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  if (!serviceRoleRef) {
    return {
      ok: false,
      message:
        "SUPABASE_SERVICE_ROLE_KEY inválida. Use a service role do preview uxleigndoomoezwsxlan em .env.development.local.",
    };
  }

  if (serviceRoleRef !== urlRef) {
    return {
      ok: false,
      message:
        "SUPABASE_SERVICE_ROLE_KEY não corresponde ao projecto configurado. Defina a service role do preview em .env.development.local (não use a de produção).",
    };
  }

  if (
    process.env.NODE_ENV === "development" &&
    serviceRoleRef === SUPABASE_PRODUCTION_PROJECT_REF
  ) {
    return {
      ok: false,
      message:
        "Service role de produção detectada em desenvolvimento. Use apenas a chave do preview uxleigndoomoezwsxlan em .env.development.local.",
    };
  }

  return envCheck;
}
