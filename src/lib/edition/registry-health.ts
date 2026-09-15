/**
 * Edition publish health gate.
 * Produces actionable checks (healthy | warning | blocked).
 * event_id is resolved server-side only and never returned to the browser.
 */

import {
  AUTHORIZED_EDITION_HOSTS,
  buildEditionInviteUrl,
  EDITION_INVITE_CATALOG,
  getAuthorizedEditionOrigin,
  getEditionInviteRef,
} from "@/lib/edition/invite-catalog";
import {
  EDITION_RSVP_SCHEMA_SLUGS,
  ensureEditionInviteBootstrap,
  getEditionInvitePublishConfig,
  isKnownEditionTheme,
  isValidBackendStrategy,
  isValidNotificationMode,
  PUBLISH_HEALTH_VERSION,
  type EditionInvitePublishConfig,
} from "@/lib/edition/publish-config";
import {
  ALIAS_INDEX,
  getEditionEventBinding,
  LEGACY_SLUG_REDIRECTS,
  resolveEditionSlug,
} from "@/lib/edition/registry";

export type HealthSeverity = "healthy" | "warning" | "blocked";

export type PublishHealthCheck = {
  id: string;
  severity: HealthSeverity;
  message: string;
  fixHint: string;
};

export type PublishHealthReport = {
  registryKey: string;
  overall: HealthSeverity;
  canPublish: boolean;
  checks: PublishHealthCheck[];
  evaluatedAt: string;
  version: string;
  publicSlug: string | null;
  inviteUrl: string | null;
  /** Present only in server-side contexts; never serialize to the browser. */
  _server?: {
    eventId: string | null;
    bindingEnvVar: string | null;
    bindingSlug: string | null;
  };
};

export type EditionRsvpHealth =
  | {
      healthy: true;
      registryKey: string;
      publicSlug: string;
      inviteUrl: string;
      eventId: string;
      bindingEnvVar: string;
    }
  | {
      healthy: false;
      registryKey: string;
      reason:
        | "unknown_registry"
        | "invite_unavailable"
        | "binding_unknown"
        | "binding_missing";
    };

export type EditionPublishHealthContext = {
  registryKey: string;
  /** Optional overrides for tests / partial configs. */
  config?: EditionInvitePublishConfig | null;
  /** Guest count for the Admin event (server-resolved). */
  guestCount?: number;
  /** Alias maps under test; defaults to live registry maps. */
  aliasMaps?: Array<Record<string, string>>;
  /** All catalog invite slugs claimed by other keys (uniqueness). */
  claimedSlugs?: Map<string, string[]>;
  /** Override RSVP schema allowlist (tests). */
  rsvpSchemaSlugs?: Set<string>;
  now?: Date;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function rankSeverity(s: HealthSeverity): number {
  switch (s) {
    case "healthy":
      return 0;
    case "warning":
      return 1;
    case "blocked":
      return 2;
    default: {
      const _exhaustive: never = s;
      return _exhaustive;
    }
  }
}

function worstSeverity(checks: PublishHealthCheck[]): HealthSeverity {
  let worst: HealthSeverity = "healthy";
  for (const check of checks) {
    if (rankSeverity(check.severity) > rankSeverity(worst)) {
      worst = check.severity;
    }
  }
  return worst;
}

export function detectCircularAliases(
  maps: Array<Record<string, string>>
): string[] {
  const graph = new Map<string, string>();
  for (const map of maps) {
    for (const [from, to] of Object.entries(map)) {
      graph.set(from.trim().toLowerCase(), to.trim().toLowerCase());
    }
  }

  const cycles: string[] = [];
  for (const start of graph.keys()) {
    const seen = new Set<string>();
    let current: string | undefined = start;
    while (current) {
      if (seen.has(current)) {
        cycles.push([...seen, current].join(" → "));
        break;
      }
      seen.add(current);
      current = graph.get(current);
      if (current && !graph.has(current) && !seen.has(current)) {
        // Terminal points at a canonical with no further redirect — OK.
        break;
      }
      if (seen.size > 50) {
        cycles.push(`${start} → … (depth overflow)`);
        break;
      }
    }
  }
  return [...new Set(cycles)];
}

function buildClaimedSlugIndex(): Map<string, string[]> {
  const claimed = new Map<string, string[]>();
  for (const ref of Object.values(EDITION_INVITE_CATALOG)) {
    const slug = ref.inviteSlug.toLowerCase();
    const list = claimed.get(slug) ?? [];
    list.push(ref.registryKey);
    claimed.set(slug, list);
  }
  return claimed;
}

/**
 * Full publish health report. Safe to expose to Admin UI (no event_id).
 * Strip `_server` before sending to the client.
 */
export function getEditionPublishHealthReport(
  context: EditionPublishHealthContext
): PublishHealthReport {
  const registryKey = context.registryKey.trim();
  const evaluatedAt = (context.now ?? new Date()).toISOString();
  const checks: PublishHealthCheck[] = [];

  ensureEditionInviteBootstrap(registryKey);
  const config =
    context.config === undefined
      ? getEditionInvitePublishConfig(registryKey)
      : context.config;

  const ref = getEditionInviteRef(registryKey);

  // 1. Registry exists
  if (!ref) {
    checks.push({
      id: "registry",
      severity: "blocked",
      message: "Registry key desconhecida no catálogo Edition.",
      fixHint:
        "Associe o evento a uma registry key válida em EDITION_INVITE_CATALOG.",
    });
  } else {
    checks.push({
      id: "registry",
      severity: "healthy",
      message: `Registry «${registryKey}» encontrada no catálogo.`,
      fixHint: "Nenhuma acção necessária.",
    });
  }

  // 2. Canonical slug
  const publicSlug = ref?.inviteSlug ?? config?.canonicalSlug ?? null;
  if (!publicSlug) {
    checks.push({
      id: "canonical_slug",
      severity: "blocked",
      message: "Slug canónico em falta.",
      fixHint: "Defina inviteSlug no catálogo ou na config de publish.",
    });
  } else {
    checks.push({
      id: "canonical_slug",
      severity: "healthy",
      message: `Slug canónico «${publicSlug}» definido.`,
      fixHint: "Nenhuma acção necessária.",
    });
  }

  // 3. Registry / slug uniqueness (legacy aliases sharing one slug are OK)
  const claimed = context.claimedSlugs ?? buildClaimedSlugIndex();
  if (publicSlug) {
    const owners = claimed.get(publicSlug.toLowerCase()) ?? [];
    const distinctBindings = new Set(
      owners
        .map((key) => resolveEditionSlug(EDITION_INVITE_CATALOG[key]?.inviteSlug ?? key))
        .filter(Boolean)
    );
    if (distinctBindings.size > 1) {
      checks.push({
        id: "registry_uniqueness",
        severity: "blocked",
        message: `Slug «${publicSlug}» mapeia para bindings distintos: ${[...distinctBindings].join(", ")}.`,
        fixHint:
          "Unifique aliases para um único binding canónico antes de publicar.",
      });
    } else {
      checks.push({
        id: "registry_uniqueness",
        severity: "healthy",
        message: "Slug sem conflito de binding entre registry keys.",
        fixHint: "Nenhuma acção necessária.",
      });
    }
  } else {
    checks.push({
      id: "registry_uniqueness",
      severity: "blocked",
      message: "Não foi possível validar unicidade sem slug.",
      fixHint: "Corrija o slug canónico primeiro.",
    });
  }

  // 4. Aliases — no circular redirects
  const aliasMaps =
    context.aliasMaps ?? [LEGACY_SLUG_REDIRECTS, ALIAS_INDEX];
  const cycles = detectCircularAliases(aliasMaps);
  if (cycles.length > 0) {
    checks.push({
      id: "aliases",
      severity: "blocked",
      message: `Aliases circulares detectados: ${cycles[0]}`,
      fixHint: "Remova ciclos em LEGACY_SLUG_REDIRECTS / ALIAS_INDEX.",
    });
  } else {
    checks.push({
      id: "aliases",
      severity: "healthy",
      message: "Árvore de aliases sem ciclos.",
      fixHint: "Nenhuma acção necessária.",
    });
  }

  // 5. Event binding + event_id (server-side)
  let eventId: string | null = null;
  let bindingEnvVar: string | null = null;
  let bindingSlug: string | null = null;

  if (ref) {
    bindingSlug = resolveEditionSlug(ref.inviteSlug);
    if (!bindingSlug) {
      checks.push({
        id: "event_binding",
        severity: "blocked",
        message: "Slug público não resolve para um binding Edition.",
        fixHint:
          "Adicione o slug a SLUG_BINDINGS ou LEGACY_SLUG_REDIRECTS.",
      });
      checks.push({
        id: "event_id",
        severity: "blocked",
        message: "event_id indisponível — binding desconhecido.",
        fixHint: "Corrija o binding antes de publicar.",
      });
    } else {
      const binding = getEditionEventBinding(bindingSlug);
      if (!binding) {
        checks.push({
          id: "event_binding",
          severity: "blocked",
          message: `Binding «${bindingSlug}» sem event_id no servidor.`,
          fixHint:
            "Configure a variável de ambiente do binding (ex.: EDITION_EVENT_*_ID).",
        });
        checks.push({
          id: "event_id",
          severity: "blocked",
          message: "event_id em falta no binding do servidor.",
          fixHint: "Defina o UUID do evento Admin na env do binding.",
        });
      } else {
        bindingEnvVar = binding.envVar;
        eventId = binding.eventId;
        checks.push({
          id: "event_binding",
          severity: "healthy",
          message: `Binding «${bindingSlug}» resolvido via ${binding.envVar}.`,
          fixHint: "Nenhuma acção necessária.",
        });
        if (!UUID_RE.test(binding.eventId)) {
          checks.push({
            id: "event_id",
            severity: "blocked",
            message: "event_id do servidor não é um UUID válido.",
            fixHint: "Corrija o valor da variável de ambiente do binding.",
          });
        } else {
          checks.push({
            id: "event_id",
            severity: "healthy",
            message: "event_id válido resolvido no servidor.",
            fixHint: "Nenhuma acção necessária.",
          });
        }
      }
    }
  } else {
    checks.push({
      id: "event_binding",
      severity: "blocked",
      message: "Sem registry — binding impossível.",
      fixHint: "Corrija a registry key.",
    });
    checks.push({
      id: "event_id",
      severity: "blocked",
      message: "Sem registry — event_id impossível.",
      fixHint: "Corrija a registry key.",
    });
  }

  // 6. Theme
  const themeId = config?.themeId;
  if (!themeId) {
    checks.push({
      id: "theme",
      severity: "blocked",
      message: "Tema Edition em falta.",
      fixHint: "Defina themeId na config de publish do convite.",
    });
  } else if (!isKnownEditionTheme(themeId)) {
    checks.push({
      id: "theme",
      severity: "blocked",
      message: `Tema «${themeId}» desconhecido ou incompatível.`,
      fixHint:
        "Use um tema da lista EDITION_KNOWN_THEMES (ex.: jessica-samuel-wedding).",
    });
  } else {
    checks.push({
      id: "theme",
      severity: "healthy",
      message: `Tema «${themeId}» compatível.`,
      fixHint: "Nenhuma acção necessária.",
    });
  }

  // 7. RSVP schema
  const schemaAllowlist = context.rsvpSchemaSlugs ?? EDITION_RSVP_SCHEMA_SLUGS;
  const schemaSlug = bindingSlug ?? resolveEditionSlug(publicSlug ?? undefined);
  if (!schemaSlug || !schemaAllowlist.has(schemaSlug)) {
    checks.push({
      id: "rsvp_schema",
      severity: "blocked",
      message: "Contrato RSVP (schema) em falta para este slug.",
      fixHint:
        "Adicione o slug a EDITION_RSVP_SCHEMA_SLUGS e ao validador RSVP.",
    });
  } else {
    checks.push({
      id: "rsvp_schema",
      severity: "healthy",
      message: `Schema RSVP disponível para «${schemaSlug}».`,
      fixHint: "Nenhuma acção necessária.",
    });
  }

  // 8. Backend strategy
  const backend = config?.backendStrategy ?? null;
  if (!isValidBackendStrategy(backend)) {
    checks.push({
      id: "backend_strategy",
      severity: "blocked",
      message: "Estratégia de backend RSVP em falta ou inválida.",
      fixHint: "Defina backendStrategy como «local» ou «proxy».",
    });
  } else {
    checks.push({
      id: "backend_strategy",
      severity: "healthy",
      message: `Backend «${backend}» configurado.`,
      fixHint: "Nenhuma acção necessária.",
    });
  }

  // 9. Notification mode
  const notification = config?.notificationMode ?? null;
  if (!isValidNotificationMode(notification)) {
    checks.push({
      id: "notification_mode",
      severity: "blocked",
      message: "Modo de notificação RSVP inválido.",
      fixHint: "Use «disabled» (seguro) ou «enabled».",
    });
  } else {
    checks.push({
      id: "notification_mode",
      severity:
        notification === "enabled" ? "warning" : "healthy",
      message:
        notification === "enabled"
          ? "Notificações RSVP activas."
          : "Notificações RSVP desactivadas (seguro).",
      fixHint:
        notification === "enabled"
          ? "Confirme que o envio de email está intencional antes de publicar."
          : "Nenhuma acção necessária.",
    });
  }

  // 10. Invitation URL + allowed domain
  const inviteUrl = ref ? buildEditionInviteUrl(registryKey) : null;
  const origin = getAuthorizedEditionOrigin();
  if (!inviteUrl || !origin) {
    checks.push({
      id: "invitation_url",
      severity: "blocked",
      message: "URL pública do convite indisponível.",
      fixHint:
        "Verifique NEXT_PUBLIC_EDITION_SITE_URL e o estado (não-draft) no catálogo.",
    });
    checks.push({
      id: "allowed_domain",
      severity: "blocked",
      message: "Domínio Edition não autorizado ou em falta.",
      fixHint: `Use um host em: ${AUTHORIZED_EDITION_HOSTS.join(", ")} (ou localhost).`,
    });
  } else {
    checks.push({
      id: "invitation_url",
      severity: "healthy",
      message: "URL pública do convite resolvida.",
      fixHint: "Nenhuma acção necessária.",
    });
    let hostOk = false;
    try {
      const host = new URL(inviteUrl).hostname.toLowerCase();
      hostOk =
        (AUTHORIZED_EDITION_HOSTS as readonly string[]).includes(host) ||
        host === "localhost" ||
        host === "127.0.0.1";
    } catch {
      hostOk = false;
    }
    checks.push({
      id: "allowed_domain",
      severity: hostOk ? "healthy" : "blocked",
      message: hostOk
        ? "Domínio Edition autorizado."
        : "Domínio da URL fora da allowlist.",
      fixHint: hostOk
        ? "Nenhuma acção necessária."
        : `Corrija NEXT_PUBLIC_EDITION_SITE_URL para ${AUTHORIZED_EDITION_HOSTS[0]}.`,
    });
  }

  // 11. Active / draft state
  const status = config?.status ?? ref?.status;
  if (status === "draft") {
    checks.push({
      id: "active_state",
      severity: "blocked",
      message: "Convite ainda em draft — não pode ficar público.",
      fixHint: "Altere status para «active» na config antes de Publicar.",
    });
  } else if (status === "unavailable") {
    checks.push({
      id: "active_state",
      severity: "warning",
      message: "Convite marcado como unavailable.",
      fixHint: "Confirme se deve publicar neste estado.",
    });
  } else if (status === "active") {
    checks.push({
      id: "active_state",
      severity: "healthy",
      message: "Estado activo — elegível para publicação.",
      fixHint: "Nenhuma acção necessária.",
    });
  } else {
    checks.push({
      id: "active_state",
      severity: "blocked",
      message: "Estado do convite desconhecido.",
      fixHint: "Defina status active | draft | unavailable.",
    });
  }

  // 12. Calendar / schedule
  const scheduleRequired = config?.scheduleRequired ?? false;
  const scheduleValue = config?.scheduleValue?.trim() || null;
  if (scheduleRequired && !scheduleValue) {
    checks.push({
      id: "schedule",
      severity: "blocked",
      message: "Calendário/horário obrigatório em falta.",
      fixHint: "Defina a data/hora do evento na config de publish.",
    });
  } else if (scheduleRequired) {
    checks.push({
      id: "schedule",
      severity: "healthy",
      message: `Horário definido («${scheduleValue}»).`,
      fixHint: "Nenhuma acção necessária.",
    });
  } else {
    checks.push({
      id: "schedule",
      severity: scheduleValue ? "healthy" : "warning",
      message: scheduleValue
        ? `Horário opcional definido («${scheduleValue}»).`
        : "Horário não obrigatório e ainda não definido.",
      fixHint: scheduleValue
        ? "Nenhuma acção necessária."
        : "Considere definir a data do evento antes do go-live.",
    });
  }

  // 13. Guest list
  const guestCount = context.guestCount ?? 0;
  const guestRequired = config?.guestListRequired ?? false;
  if (guestRequired && guestCount < 1) {
    checks.push({
      id: "guest_list",
      severity: "blocked",
      message: "Lista de convidados obrigatória está vazia.",
      fixHint: "Importe ou adicione convidados no Admin antes de publicar.",
    });
  } else if (guestCount < 1) {
    checks.push({
      id: "guest_list",
      severity: "warning",
      message: "Lista de convidados vazia.",
      fixHint: "Pode publicar, mas RSVP/ops ficam limitados sem convidados.",
    });
  } else {
    checks.push({
      id: "guest_list",
      severity: "healthy",
      message: `${guestCount} convidado(s) na lista.`,
      fixHint: "Nenhuma acção necessária.",
    });
  }

  const overall = worstSeverity(checks);
  return {
    registryKey,
    overall,
    canPublish: overall !== "blocked",
    checks,
    evaluatedAt,
    version: PUBLISH_HEALTH_VERSION,
    publicSlug,
    inviteUrl,
    _server: {
      eventId,
      bindingEnvVar,
      bindingSlug,
    },
  };
}

/** Client-safe report (strips server-only event_id). */
export function toClientPublishHealthReport(
  report: PublishHealthReport
): Omit<PublishHealthReport, "_server"> {
  const { _server: _omit, ...rest } = report;
  void _omit;
  return rest;
}

/**
 * Publish gate contract (legacy): catalog + public URL + server-side event binding.
 * event_id never comes from the browser.
 */
export function getEditionRsvpHealth(registryKey: string): EditionRsvpHealth {
  const ref = getEditionInviteRef(registryKey);
  if (!ref) {
    return { healthy: false, registryKey, reason: "unknown_registry" };
  }

  const inviteUrl = buildEditionInviteUrl(registryKey);
  if (!inviteUrl) {
    return { healthy: false, registryKey, reason: "invite_unavailable" };
  }

  const bindingSlug = resolveEditionSlug(ref.inviteSlug);
  if (!bindingSlug) {
    return { healthy: false, registryKey, reason: "binding_unknown" };
  }

  const binding = getEditionEventBinding(bindingSlug);
  if (!binding) {
    return { healthy: false, registryKey, reason: "binding_missing" };
  }

  return {
    healthy: true,
    registryKey,
    publicSlug: ref.inviteSlug,
    inviteUrl,
    eventId: binding.eventId,
    bindingEnvVar: binding.envVar,
  };
}
