import {
  haxrMailboxes,
  PRIMARY_INBOX,
  type EmailChannel,
} from "@/lib/email/addresses";
import { getEditionEventBinding } from "@/lib/edition/registry";

export type EditionRsvpEmailConfig = {
  eventName: string;
  slug: string;
  channel: EmailChannel;
  notifyTo: string[];
  cc: string[];
  replyTo: string;
};

const BRIDE_CC = "jessicamuege@gmail.com";

function bindingName(slug: string, fallback: string): string {
  return getEditionEventBinding(slug)?.adminEventName ?? fallback;
}

export const KULAYA_RSVP_EMAIL: EditionRsvpEmailConfig = {
  eventName: bindingName("jessicakulaya", "Edition · Kulaya · Jessica Muege"),
  slug: "jessicakulaya",
  channel: "rsvp",
  notifyTo: [haxrMailboxes.rsvp],
  cc: [BRIDE_CC],
  replyTo: PRIMARY_INBOX,
};

export const LINGERIE_RSVP_EMAIL: EditionRsvpEmailConfig = {
  eventName: bindingName(
    "cha-de-lingerie",
    "Edition · Chá de Lingerie · Jessica Muege"
  ),
  slug: "cha-de-lingerie",
  channel: "rsvp",
  notifyTo: [haxrMailboxes.rsvp],
  cc: [BRIDE_CC],
  replyTo: PRIMARY_INBOX,
};

export const PANELA_RSVP_EMAIL: EditionRsvpEmailConfig = {
  eventName: "Edition · Jessica Bride to Be Experience",
  slug: "cha-de-panela",
  channel: "rsvp",
  notifyTo: [haxrMailboxes.rsvp],
  cc: [],
  replyTo: PRIMARY_INBOX,
};

export const FAREWELL_RSVP_EMAIL: EditionRsvpEmailConfig = {
  eventName: bindingName(
    "jessicachadelingerie",
    "Edition · Despedida de Solteira · Jessica Muege"
  ),
  slug: "jessicachadelingerie",
  channel: "rsvp",
  notifyTo: [haxrMailboxes.rsvp],
  cc: [BRIDE_CC],
  replyTo: PRIMARY_INBOX,
};

export function getEditionRsvpEmailConfig(
  slug: string
): EditionRsvpEmailConfig | null {
  switch (slug) {
    case "jessicakulaya":
      return KULAYA_RSVP_EMAIL;
    case "cha-de-lingerie":
      return LINGERIE_RSVP_EMAIL;
    case "cha-de-panela":
      return PANELA_RSVP_EMAIL;
    case "jessicachadelingerie":
      return FAREWELL_RSVP_EMAIL;
    default:
      return null;
  }
}
