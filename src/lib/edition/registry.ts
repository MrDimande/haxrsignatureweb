/**
 * Edition invitation registry — mirrors projecto_haxrsignature/data/invitations.ts admin bindings.
 * Slug → Supabase event_id via environment variables.
 */

export type EditionSlugBinding = {
  slug: string;
  adminEventName: string;
  clientName: string;
  envVar: string;
  legacyEnvVar?: string;
};

export const LEGACY_SLUG_REDIRECTS: Record<string, string> = {
  jessicakhulaya: "jessicakulaya",
  "jessica-samuel-traditional": "traditional-wedding",
  "jessica-traditional-wedding": "traditional-wedding",
  /** Slug público Edition do piloto Jessica & Samuel (≠ registry key). */
  jessicaesamueltraditionalwedding: "traditional-wedding",
  chadelingerie: "cha-de-lingerie",
  "jessica-cha-de-lingerie": "cha-de-lingerie",
  chadepanela: "cha-de-panela",
  "jessicabridetobe": "cha-de-panela",
  "jessica-bride-to-be": "cha-de-panela",
  "despedida-de-solteira": "jessicachadelingerie",
  "jessica-farewell": "jessicachadelingerie",
  /** rose-elegance é registry key de Admin; canonical RSVP binding = farewell. */
  "rose-elegance": "jessicachadelingerie",
  /** Public slug → binding key aligned with Admin edition_registry_key. */
  jessicasamuelwedding: "jessica-samuel-wedding",
  "jessica-samuel": "jessica-samuel-wedding",
  /** Stan — aliases → canónico público /stanturns5 */
  stan: "stanturns5",
  "convite-stan": "stanturns5",
  "stan-5-anos": "stanturns5",
  /** Nian — alias RSVP → canónico público /nianwebnight */
  nian: "nianwebnight",
};

export const ALIAS_INDEX: Record<string, string> = {};

const SLUG_BINDINGS: Record<string, EditionSlugBinding> = {
  jessicakulaya: {
    slug: "jessicakulaya",
    adminEventName: "Edition · Kulaya · Jessica Muege",
    clientName: "Jessica Muege",
    envVar: "EDITION_EVENT_JESSICA_KULAYA_ID",
    legacyEnvVar: "KULAYA_EVENT_ID",
  },
  "cha-de-lingerie": {
    slug: "cha-de-lingerie",
    adminEventName: "Edition · Chá de Lingerie · Jessica Muege",
    clientName: "Jessica Muege",
    envVar: "EDITION_EVENT_JESSICA_LINGERIE_ID",
  },
  "cha-de-panela": {
    slug: "cha-de-panela",
    adminEventName: "Edition · Jessica Bride to Be Experience",
    clientName: "Jessica Muege",
    envVar: "EDITION_EVENT_JESSICA_PANELA_ID",
  },
  jessicachadelingerie: {
    slug: "jessicachadelingerie",
    adminEventName: "Edition · Despedida de Solteira · Jessica Muege",
    clientName: "Jessica Muege",
    envVar: "EDITION_EVENT_JESSICA_FAREWELL_ID",
    legacyEnvVar: "FAREWELL_EVENT_ID",
  },
  "lobolo-jessica-samuel": {
    slug: "lobolo-jessica-samuel",
    adminEventName: "Edition · Lobolo · Jessica & Samuel",
    clientName: "Jessica & Samuel",
    envVar: "EDITION_EVENT_JESSICA_LOBOLO_ID",
    legacyEnvVar: "LOBOLO_EVENT_ID",
  },
  "traditional-wedding": {
    slug: "traditional-wedding",
    adminEventName: "Edition · Casamento Tradicional · Jessica & Samuel",
    clientName: "Jessica & Samuel",
    envVar: "EDITION_EVENT_JESSICA_TRADITIONAL_ID",
    legacyEnvVar: "TRADITIONAL_WEDDING_EVENT_ID",
  },
  "jessica-samuel-wedding": {
    slug: "jessica-samuel-wedding",
    adminEventName: "Edition · Casamento · Jessica & Samuel",
    clientName: "Jessica & Samuel",
    envVar: "EDITION_EVENT_JESSICA_WEDDING_ID",
    legacyEnvVar: "WEDDING_EVENT_ID",
  },
  stanturns5: {
    slug: "stanturns5",
    adminEventName: "Edition · Aniversário · Stan",
    clientName: "Stan",
    envVar: "EDITION_EVENT_STAN_ID",
  },
  nianwebnight: {
    slug: "nianwebnight",
    adminEventName: "Edition · Aniversário · Nian",
    clientName: "Nian",
    envVar: "EDITION_EVENT_NIAN_ID",
  },
};

export function resolveEditionSlug(slug?: string): string | null {
  if (!slug) return null;
  const normalized = slug.trim().toLowerCase();
  if (SLUG_BINDINGS[normalized]) return normalized;
  if (LEGACY_SLUG_REDIRECTS[normalized]) return LEGACY_SLUG_REDIRECTS[normalized];
  if (ALIAS_INDEX[normalized]) return ALIAS_INDEX[normalized];
  return null;
}

function readEventId(binding: EditionSlugBinding): string | undefined {
  const primary = process.env[binding.envVar]?.trim();
  if (primary) return primary;
  if (binding.legacyEnvVar) {
    return process.env[binding.legacyEnvVar]?.trim();
  }
  return undefined;
}

export type EditionEventBinding = EditionSlugBinding & {
  eventId: string;
};

export function getEditionEventBinding(slug?: string): EditionEventBinding | null {
  const resolved = resolveEditionSlug(slug);
  if (!resolved) return null;

  const binding = SLUG_BINDINGS[resolved];
  const eventId = readEventId(binding);
  if (!eventId) return null;

  return { ...binding, eventId };
}

export function isEditionPersistenceConfigured(slug?: string): boolean {
  return Boolean(getEditionEventBinding(slug));
}

import { getAuthorizedEditionOrigin } from "@/lib/edition/invite-catalog";

/** Origem Edition autorizada (sem host arbitrário). */
export const EDITION_SITE_URL =
  getAuthorizedEditionOrigin() ?? "https://edition.haxrsignature.com";

export const FAREWELL_SLUG = "jessicachadelingerie";
