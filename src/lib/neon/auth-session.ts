import { createHash } from "crypto";
import { cookies } from "next/headers";
import type { ClientAppProfile } from "@/lib/auth/app-user-display";
import { getNeonAuthUrl } from "@/lib/neon/config";
import { neonQuery } from "@/lib/neon/server-db";

export type NeonSessionUser = {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
};

export type NeonSessionEnvelope = {
  user: NeonSessionUser;
  session: Record<string, unknown> | null;
};

type NeonProfileRow = ClientAppProfile;
type ClaimResult = {
  claimed?: boolean;
  alreadyClaimed?: boolean;
  reason?: string;
};

type ClaimRow = {
  result: ClaimResult;
};

type RawNeonSessionPayload = {
  user?: {
    id?: unknown;
    email?: unknown;
    name?: unknown;
    emailVerified?: unknown;
  } | null;
  session?: Record<string, unknown> | null;
};

const SESSION_FETCH_TIMEOUT_MS = 8_000;

export function buildLegacyEmailSha256(email: string): string {
  return createHash("sha256")
    .update(email.trim().toLowerCase(), "utf8")
    .digest("hex");
}

export function parseNeonSessionPayload(
  payload: unknown,
): NeonSessionEnvelope | null {
  if (!payload || typeof payload !== "object") return null;

  const raw = payload as RawNeonSessionPayload;
  if (!raw.user || typeof raw.user !== "object") return null;
  if (typeof raw.user.id !== "string" || typeof raw.user.email !== "string") {
    return null;
  }

  return {
    user: {
      id: raw.user.id,
      email: raw.user.email,
      name: typeof raw.user.name === "string" ? raw.user.name : null,
      emailVerified: raw.user.emailVerified === true,
    },
    session:
      raw.session && typeof raw.session === "object" ? raw.session : null,
  };
}

function serializeCookieHeader(
  values: Array<{ name: string; value: string }>,
): string {
  return values.map(({ name, value }) => `${name}=${value}`).join("; ");
}

export async function fetchNeonSession(
  cookieHeader: string,
): Promise<NeonSessionEnvelope | null> {
  const authUrl = getNeonAuthUrl();
  if (!authUrl) {
    throw new Error(
      "Neon Auth não configurado. Defina NEON_AUTH_BASE_URL ou NEXT_PUBLIC_NEON_AUTH_URL.",
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SESSION_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${authUrl.replace(/\/$/, "")}/get-session`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (response.status === 401 || response.status === 403) return null;
    if (!response.ok) {
      throw new Error(`Neon Auth get-session falhou com HTTP ${response.status}.`);
    }

    return parseNeonSessionPayload(await response.json());
  } finally {
    clearTimeout(timeout);
  }
}

async function readNeonProfile(userId: string): Promise<ClientAppProfile | null> {
  const result = await neonQuery<NeonProfileRow>(
    `
      SELECT
        id,
        full_name,
        app_role::text AS app_role,
        active_client_event_id
      FROM public.profiles
      WHERE id = $1::uuid
      LIMIT 1
    `,
    [userId],
  );

  return result.rows[0] ?? null;
}

async function ensureNewNeonProfile(user: NeonSessionUser): Promise<void> {
  await neonQuery(
    `
      INSERT INTO public.profiles (id, full_name)
      VALUES ($1::uuid, NULLIF($2, ''))
      ON CONFLICT (id) DO NOTHING
    `,
    [user.id, user.name?.trim() ?? ""],
  );
}

/**
 * Reconciles a verified Neon identity with the legacy Supabase UUID map.
 *
 * Existing users are claimed atomically by app_private.claim_legacy_identity.
 * Brand-new users receive the minimum public.profiles row required by the app.
 */
export async function reconcileVerifiedNeonIdentity(
  user: NeonSessionUser,
): Promise<ClientAppProfile | null> {
  if (!user.emailVerified) return null;

  const emailHash = buildLegacyEmailSha256(user.email);
  const claim = await neonQuery<ClaimRow>(
    `SELECT app_private.claim_legacy_identity($1::uuid, $2::text) AS result`,
    [user.id, emailHash],
  );
  const result = claim.rows[0]?.result;

  if (result?.claimed !== true) {
    if (result?.reason !== "no_legacy_identity") {
      throw new Error(
        `Não foi possível reconciliar identidade Neon: ${result?.reason ?? "resultado inválido"}.`,
      );
    }
    await ensureNewNeonProfile(user);
  }

  return readNeonProfile(user.id);
}

export async function getCurrentNeonAppIdentity(): Promise<{
  user: NeonSessionUser | null;
  profile: ClientAppProfile | null;
}> {
  const cookieStore = await cookies();
  const session = await fetchNeonSession(
    serializeCookieHeader(cookieStore.getAll()),
  );

  if (!session) return { user: null, profile: null };

  const profile = session.user.emailVerified
    ? await reconcileVerifiedNeonIdentity(session.user)
    : null;

  return { user: session.user, profile };
}
