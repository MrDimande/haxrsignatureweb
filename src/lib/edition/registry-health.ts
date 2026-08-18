import {
  buildEditionInviteUrl,
  getEditionInviteRef,
} from "@/lib/edition/invite-catalog";
import {
  getEditionEventBinding,
  resolveEditionSlug,
} from "@/lib/edition/registry";

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

/**
 * Publish gate contract: catalog + public URL + server-side event binding
 * must all resolve. event_id never comes from the browser.
 */
export function getEditionRsvpHealth(
  registryKey: string
): EditionRsvpHealth {
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
