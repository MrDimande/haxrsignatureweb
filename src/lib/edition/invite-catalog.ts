/**
 * Catálogo Core/Admin de convites digitais Edition.
 * Registry key (Admin) ≠ slug público (URL Edition).
 * Sem fallback silencioso para outros convites.
 */

export const AUTHORIZED_EDITION_HOSTS = [
  "edition.haxrsignature.com",
] as const;

export type EditionInviteStatus = "active" | "unavailable" | "draft";

export type EditionInviteRef = {
  registryKey: string;
  /** Slug público na Edition (path da URL). */
  inviteSlug: string;
  label: string;
  status: EditionInviteStatus;
  experienceType: "invitation";
};

/**
 * Associações conhecidas: edition_registry_key → slug público Edition.
 * Nunca mapear traditional-wedding para rose-elegance / outro convite.
 */
export const EDITION_INVITE_CATALOG: Readonly<
  Record<string, EditionInviteRef>
> = {
  "traditional-wedding": {
    registryKey: "traditional-wedding",
    inviteSlug: "jessicaesamueltraditionalwedding",
    label: "Edition · Casamento Tradicional · Jessica & Samuel",
    status: "active",
    experienceType: "invitation",
  },
  "rose-elegance": {
    registryKey: "rose-elegance",
    inviteSlug: "jessicachadelingerie",
    label: "Edition · Despedida de Solteira · Jessica Muege",
    status: "active",
    experienceType: "invitation",
  },
  jessicachadelingerie: {
    registryKey: "jessicachadelingerie",
    inviteSlug: "jessicachadelingerie",
    label: "Edition · Despedida de Solteira · Jessica Muege",
    status: "active",
    experienceType: "invitation",
  },
  jessicakulaya: {
    registryKey: "jessicakulaya",
    inviteSlug: "jessicakulaya",
    label: "Edition · Kulaya · Jessica Muege",
    status: "active",
    experienceType: "invitation",
  },
  "cha-de-lingerie": {
    registryKey: "cha-de-lingerie",
    inviteSlug: "cha-de-lingerie",
    label: "Edition · Chá de Lingerie · Jessica Muege",
    status: "active",
    experienceType: "invitation",
  },
  "cha-de-panela": {
    registryKey: "cha-de-panela",
    inviteSlug: "cha-de-panela",
    label: "Edition · Jessica Bride to Be Experience",
    status: "active",
    experienceType: "invitation",
  },
  "lobolo-jessica-samuel": {
    registryKey: "lobolo-jessica-samuel",
    inviteSlug: "lobolo-jessica-samuel",
    label: "Edition · Lobolo · Jessica & Samuel",
    status: "active",
    experienceType: "invitation",
  },
  "jessica-samuel-wedding": {
    registryKey: "jessica-samuel-wedding",
    inviteSlug: "jessicasamuelwedding",
    label: "Edition · Casamento · Jessica & Samuel",
    status: "active",
    experienceType: "invitation",
  },
  /** Legacy Admin key — same public invite as jessica-samuel-wedding. */
  "jessica-samuel": {
    registryKey: "jessica-samuel",
    inviteSlug: "jessicasamuelwedding",
    label: "Edition · Casamento · Jessica & Samuel",
    status: "active",
    experienceType: "invitation",
  },
};

export type EditionAssociationState =
  | "active"
  | "unavailable"
  | "unknown_registry"
  | "missing"
  | "invalid_config";

export type ResolvedEditionInvite =
  | {
      state: "active" | "unavailable";
      ref: EditionInviteRef;
      inviteUrl: string;
      inviteSlug: string;
      registryKey: string;
      label: string;
    }
  | {
      state: "unknown_registry";
      registryKey: string;
      inviteUrl: null;
      inviteSlug: null;
      label: null;
      ref: null;
    }
  | {
      state: "missing";
      registryKey: null;
      inviteUrl: null;
      inviteSlug: null;
      label: null;
      ref: null;
    }
  | {
      state: "invalid_config";
      registryKey: string;
      inviteUrl: null;
      inviteSlug: string | null;
      label: string | null;
      ref: EditionInviteRef | null;
      reason: string;
    };

const DEFAULT_EDITION_ORIGIN = "https://edition.haxrsignature.com";

function readConfiguredEditionOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_EDITION_SITE_URL?.trim() || DEFAULT_EDITION_ORIGIN
  );
}

/** Origem Edition autorizada; rejeita hosts arbitrários. */
export function getAuthorizedEditionOrigin(): string | null {
  const raw = readConfiguredEditionOrigin().replace(/\/$/, "");
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  const allowed =
    (AUTHORIZED_EDITION_HOSTS as readonly string[]).includes(host) ||
    host === "localhost" ||
    host === "127.0.0.1";

  if (!allowed) {
    return null;
  }

  return `${parsed.protocol}//${parsed.host}`;
}

export function getEditionInviteRef(
  registryKey: string | null | undefined
): EditionInviteRef | null {
  if (!registryKey) return null;
  const key = registryKey.trim();
  if (!key) return null;
  return EDITION_INVITE_CATALOG[key] ?? null;
}

export function resolveEditionInviteSlug(
  registryKey: string | null | undefined
): string | null {
  const ref = getEditionInviteRef(registryKey);
  if (!ref) return null;
  if (ref.status === "draft") return null;
  return ref.inviteSlug;
}

export function buildEditionInviteUrl(
  registryKey: string | null | undefined
): string | null {
  const slug = resolveEditionInviteSlug(registryKey);
  if (!slug) return null;
  const origin = getAuthorizedEditionOrigin();
  if (!origin) return null;
  return `${origin}/${slug}`;
}

export function resolveEditionInviteAssociation(
  registryKey: string | null | undefined
): ResolvedEditionInvite {
  const trimmed = registryKey?.trim() ?? "";
  if (!trimmed) {
    return {
      state: "missing",
      registryKey: null,
      inviteUrl: null,
      inviteSlug: null,
      label: null,
      ref: null,
    };
  }

  const ref = EDITION_INVITE_CATALOG[trimmed];
  if (!ref) {
    return {
      state: "unknown_registry",
      registryKey: trimmed,
      inviteUrl: null,
      inviteSlug: null,
      label: null,
      ref: null,
    };
  }

  if (ref.status === "draft") {
    return {
      state: "invalid_config",
      registryKey: trimmed,
      inviteUrl: null,
      inviteSlug: ref.inviteSlug,
      label: ref.label,
      ref,
      reason: "draft_not_active",
    };
  }

  const origin = getAuthorizedEditionOrigin();
  if (!origin) {
    return {
      state: "invalid_config",
      registryKey: trimmed,
      inviteUrl: null,
      inviteSlug: ref.inviteSlug,
      label: ref.label,
      ref,
      reason: "unauthorized_edition_origin",
    };
  }

  if (ref.status === "unavailable") {
    return {
      state: "unavailable",
      ref,
      inviteUrl: `${origin}/${ref.inviteSlug}`,
      inviteSlug: ref.inviteSlug,
      registryKey: ref.registryKey,
      label: ref.label,
    };
  }

  return {
    state: "active",
    ref,
    inviteUrl: `${origin}/${ref.inviteSlug}`,
    inviteSlug: ref.inviteSlug,
    registryKey: ref.registryKey,
    label: ref.label,
  };
}

/** Validação defensiva de URL de preview/abertura no Admin. */
export function isAuthorizedEditionInviteUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const origin = getAuthorizedEditionOrigin();
    if (!origin) return false;
    const allowed = new URL(origin);
    return (
      parsed.protocol === allowed.protocol &&
      parsed.hostname.toLowerCase() === allowed.hostname.toLowerCase() &&
      parsed.pathname.length > 1 &&
      !parsed.pathname.includes("..")
    );
  } catch {
    return false;
  }
}
