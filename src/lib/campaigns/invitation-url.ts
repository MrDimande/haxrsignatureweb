import {
  buildEditionInviteUrl,
  isAuthorizedEditionInviteUrl,
  resolveEditionInviteAssociation,
} from "@/lib/edition/invite-catalog";

/**
 * Link personalizado para convite — reutiliza catálogo Edition.
 * Sem IDs internos (guest UUID / campaign UUID) na URL.
 */
export function buildPersonalizedInvitationUrl(input: {
  invitationRegistryKey: string;
  guestName?: string;
}): { ok: true; url: string } | { ok: false; reason: string } {
  const association = resolveEditionInviteAssociation(
    input.invitationRegistryKey
  );

  if (association.state === "missing") {
    return { ok: false, reason: "Convite Edition não seleccionado." };
  }
  if (association.state === "unknown_registry") {
    return {
      ok: false,
      reason: `Registry Edition desconhecido: ${association.registryKey}`,
    };
  }
  if (association.state === "invalid_config") {
    return { ok: false, reason: association.reason };
  }
  if (association.state === "unavailable") {
    return {
      ok: false,
      reason: "Convite Edition indisponível.",
    };
  }

  const base = association.inviteUrl;
  if (!base || !isAuthorizedEditionInviteUrl(base)) {
    return { ok: false, reason: "URL Edition não autorizada." };
  }

  const guestName = input.guestName?.trim();
  if (!guestName) {
    return { ok: true, url: base };
  }

  // Personalização suave por nome público — sem IDs internos.
  const url = new URL(base);
  url.searchParams.set("guest", guestName.slice(0, 80));
  return { ok: true, url: url.toString() };
}

export function resolveCampaignInvitationBaseUrl(
  invitationRegistryKey: string
): string | null {
  return buildEditionInviteUrl(invitationRegistryKey);
}
