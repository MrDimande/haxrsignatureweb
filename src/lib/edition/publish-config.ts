/**
 * Edition invite publish configuration (Core Admin gate).
 * Persisted in-process for draft → published transitions without Production migrations.
 * event_id is never accepted from the browser — only resolved via server binding.
 */

import {
  EDITION_INVITE_CATALOG,
  type EditionInviteRef,
  type EditionInviteStatus,
} from "@/lib/edition/invite-catalog";

export const PUBLISH_HEALTH_VERSION = "1.0.0";

export type EditionBackendStrategy = "local" | "proxy";

export type EditionNotificationMode = "disabled" | "enabled";

/** Themes known to be compatible with Edition true-theme profiles. */
export const EDITION_KNOWN_THEMES = [
  "jessica-samuel-wedding",
  "rose-elegance",
  "primavera-lobolo",
  "illustration-ceremony",
  "jessicakulaya",
  "cha-de-lingerie",
  "cha-de-panela",
  "traditional-wedding",
  "lobolo-jessica-samuel",
] as const;

export type EditionKnownTheme = (typeof EDITION_KNOWN_THEMES)[number];

/** Slugs with a Core RSVP validation / persistence contract. */
export const EDITION_RSVP_SCHEMA_SLUGS = new Set([
  "jessicakulaya",
  "cha-de-lingerie",
  "cha-de-panela",
  "jessicachadelingerie",
  "jessica-samuel-wedding",
  "traditional-wedding",
  "lobolo-jessica-samuel",
]);

export type EditionInvitePublishConfig = {
  registryKey: string;
  canonicalSlug: string;
  themeId: string;
  backendStrategy: EditionBackendStrategy | null;
  notificationMode: EditionNotificationMode | null;
  status: EditionInviteStatus;
  /** When true, schedule/date is required before publish. */
  scheduleRequired: boolean;
  /** ISO date or label present on the invite calendar. */
  scheduleValue: string | null;
  /** When true, at least one guest is required. */
  guestListRequired: boolean;
  aliases: string[];
  createdAt: string;
  updatedAt: string;
};

const DEFAULT_THEME_BY_REGISTRY: Record<string, EditionKnownTheme> = {
  "jessica-samuel-wedding": "jessica-samuel-wedding",
  "jessica-samuel": "jessica-samuel-wedding",
  "rose-elegance": "rose-elegance",
  jessicachadelingerie: "rose-elegance",
  jessicakulaya: "jessicakulaya",
  "cha-de-lingerie": "cha-de-lingerie",
  "cha-de-panela": "cha-de-panela",
  "traditional-wedding": "traditional-wedding",
  "lobolo-jessica-samuel": "primavera-lobolo",
};

/** Runtime config overrides (tests / auto-bootstrap). */
const configStore = new Map<string, EditionInvitePublishConfig>();

export function isKnownEditionTheme(themeId: string): boolean {
  return (EDITION_KNOWN_THEMES as readonly string[]).includes(themeId);
}

export function isValidBackendStrategy(
  value: string | null | undefined
): value is EditionBackendStrategy {
  return value === "local" || value === "proxy";
}

export function isValidNotificationMode(
  value: string | null | undefined
): value is EditionNotificationMode {
  return value === "disabled" || value === "enabled";
}

export function resetEditionPublishConfigStore(): void {
  configStore.clear();
}

export function getEditionInvitePublishConfig(
  registryKey: string
): EditionInvitePublishConfig | null {
  const stored = configStore.get(registryKey);
  if (stored) return stored;

  const ref = EDITION_INVITE_CATALOG[registryKey];
  if (!ref) return null;

  return buildDefaultConfigFromCatalog(ref);
}

export function upsertEditionInvitePublishConfig(
  config: EditionInvitePublishConfig
): EditionInvitePublishConfig {
  const next = { ...config, updatedAt: new Date().toISOString() };
  configStore.set(config.registryKey, next);
  return next;
}

/**
 * Auto-creates initial publish config for a catalogued invite when missing.
 * Does not invent registry keys outside the catalog.
 */
export function ensureEditionInviteBootstrap(
  registryKey: string,
  overrides?: Partial<EditionInvitePublishConfig>
): EditionInvitePublishConfig | null {
  const existing = configStore.get(registryKey);
  if (existing) {
    if (!overrides) return existing;
    return upsertEditionInvitePublishConfig({ ...existing, ...overrides });
  }

  const ref = EDITION_INVITE_CATALOG[registryKey];
  if (!ref) return null;

  const base = buildDefaultConfigFromCatalog(ref);
  return upsertEditionInvitePublishConfig({ ...base, ...overrides });
}

function buildDefaultConfigFromCatalog(
  ref: EditionInviteRef
): EditionInvitePublishConfig {
  const now = new Date().toISOString();
  const themeId =
    DEFAULT_THEME_BY_REGISTRY[ref.registryKey] ?? ref.registryKey;

  return {
    registryKey: ref.registryKey,
    canonicalSlug: ref.inviteSlug,
    themeId,
    backendStrategy: "proxy",
    notificationMode: "disabled",
    status: ref.status,
    scheduleRequired: true,
    scheduleValue: null,
    guestListRequired: false,
    aliases: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function listEditionInvitePublishConfigs(): EditionInvitePublishConfig[] {
  const keys = new Set([
    ...Object.keys(EDITION_INVITE_CATALOG),
    ...configStore.keys(),
  ]);
  return [...keys]
    .map((key) => getEditionInvitePublishConfig(key))
    .filter((c): c is EditionInvitePublishConfig => Boolean(c));
}
