import { buildWhatsAppUrl } from "@/lib/admin/whatsapp";
import { HAXR_MANUAL_WHATSAPP_SENDER } from "@/lib/campaigns/haxr-manual-sender";
import type {
  CampaignRecipient,
  ManualCampaignCounters,
  ManualRecipientOps,
  RecipientStatus,
} from "@/lib/campaigns/types";
import { isManualOpsAllowed, getWhatsappSendMode } from "@/lib/campaigns/send-mode";

export const HAXR_MANUAL_ACCOUNT_WARNING =
  "Confirme que o WhatsApp Web ou WhatsApp Business está ligado à conta HAXR Signature · +258 87 088 3428.";

export function buildManualWaMeUrl(
  phone: string | null | undefined,
  message: string
): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 8) return null;
  // Destinatário = telefone do convidado — nunca o número HAXR por omissão.
  const haxrDigits = HAXR_MANUAL_WHATSAPP_SENDER.phoneE164.replace(/\D/g, "");
  if (digits === haxrDigits) return null;
  return buildWhatsAppUrl(digits, message);
}

export function toManualRecipientOps(
  recipient: CampaignRecipient
): ManualRecipientOps {
  return {
    recipientId: recipient.id,
    guestName: recipient.guestName,
    phoneMasked: recipient.phoneMasked,
    renderedMessage: recipient.renderedMessage,
    waMeUrl: buildManualWaMeUrl(recipient.phoneE164, recipient.renderedMessage),
    status: recipient.status,
    invitationUrl: recipient.invitationUrl,
  };
}

export type ManualAction =
  | "copy"
  | "open"
  | "mark_sent"
  | "undo"
  | "skip"
  | "invalid_phone";

/** opened_whatsapp ≠ sent; marked_sent ≠ delivered. */
export function isManualSentClaim(status: RecipientStatus): boolean {
  return status === "marked_sent";
}

export function isProviderDeliveredClaim(status: RecipientStatus): boolean {
  return status === "delivered" || status === "read";
}

export function countManualCampaignStats(
  recipients: Array<{ status: RecipientStatus }>
): ManualCampaignCounters {
  const counters: ManualCampaignCounters = {
    pending: 0,
    openedWhatsapp: 0,
    markedSent: 0,
    skipped: 0,
    invalidPhone: 0,
    rsvpReceived: 0,
    deliveredClaimed: false,
  };
  for (const row of recipients) {
    switch (row.status) {
      case "pending":
      case "previewed":
      case "copied":
        counters.pending += 1;
        break;
      case "opened":
      case "opened_whatsapp":
        counters.openedWhatsapp += 1;
        break;
      case "marked_sent":
        counters.markedSent += 1;
        break;
      case "skipped":
        counters.skipped += 1;
        break;
      case "invalid_phone":
        counters.invalidPhone += 1;
        break;
      case "rsvp_received":
        counters.rsvpReceived += 1;
        break;
      default:
        break;
    }
  }
  return counters;
}

export function nextStatusAfterManualAction(
  current: RecipientStatus,
  action: ManualAction
): RecipientStatus {
  switch (action) {
    case "copy":
      if (current === "marked_sent" || current === "rsvp_received") {
        return current;
      }
      if (current === "opened_whatsapp" || current === "opened") {
        return "opened_whatsapp";
      }
      return current === "skipped" || current === "invalid_phone"
        ? current
        : "copied";
    case "open":
      if (current === "marked_sent" || current === "rsvp_received") {
        return current;
      }
      if (current === "skipped" || current === "invalid_phone") {
        return current;
      }
      // Abrir wa.me ≠ sent / ≠ delivered
      return "opened_whatsapp";
    case "mark_sent":
      if (current === "rsvp_received") return current;
      if (current === "invalid_phone") {
        throw new Error(
          "Não é possível marcar enviado com telefone inválido."
        );
      }
      // marked_sent ≠ delivered (provider)
      return "marked_sent";
    case "skip":
      if (current === "rsvp_received" || current === "marked_sent") {
        return current;
      }
      return "skipped";
    case "invalid_phone":
      if (current === "rsvp_received" || current === "marked_sent") {
        return current;
      }
      return "invalid_phone";
    case "undo":
      return undoManualStatus(current);
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

function undoManualStatus(current: RecipientStatus): RecipientStatus {
  switch (current) {
    case "marked_sent":
      return "opened_whatsapp";
    case "opened_whatsapp":
    case "opened":
    case "copied":
    case "previewed":
    case "skipped":
    case "invalid_phone":
      return "pending";
    case "rsvp_received":
      throw new Error("Não é possível desfazer rsvp_received.");
    case "pending":
      return "pending";
    default:
      throw new Error(
        `Undo não suportado para estado provider/manual: ${current}.`
      );
  }
}

export function assertManualModeEnabled(
  mode = getWhatsappSendMode()
): void {
  if (!isManualOpsAllowed(mode)) {
    throw new Error(
      mode === "disabled"
        ? "Envio desactivado (HAXR_WHATSAPP_SEND_MODE=disabled)."
        : `Modo ${mode} não permite operações manuais wa.me. Use HAXR_WHATSAPP_SEND_MODE=manual.`
    );
  }
}

export type ManualFilter =
  | "all"
  | "pending"
  | "opened_whatsapp"
  | "marked_sent"
  | "skipped"
  | "invalid_phone"
  | "rsvp_received";

export function filterManualRecipients<T extends { status: RecipientStatus }>(
  recipients: T[],
  filter: ManualFilter
): T[] {
  if (filter === "all") return recipients;
  if (filter === "pending") {
    return recipients.filter((r) =>
      ["pending", "previewed", "copied"].includes(r.status)
    );
  }
  if (filter === "opened_whatsapp") {
    return recipients.filter(
      (r) => r.status === "opened_whatsapp" || r.status === "opened"
    );
  }
  return recipients.filter((r) => r.status === filter);
}

export function navigateManualIndex(
  currentIndex: number,
  direction: "next" | "back",
  length: number
): number {
  if (length <= 0) return 0;
  if (direction === "next") return Math.min(currentIndex + 1, length - 1);
  return Math.max(currentIndex - 1, 0);
}

export type CampaignExportRow = {
  guestName: string;
  phoneMasked: string;
  invitationUrl: string;
  message: string;
  waMeUrl: string;
  status: RecipientStatus;
};

export function buildCampaignExportRows(
  recipients: CampaignRecipient[]
): CampaignExportRow[] {
  return recipients.map((recipient) => ({
    guestName: recipient.guestName,
    phoneMasked: recipient.phoneMasked,
    invitationUrl: recipient.invitationUrl,
    message: recipient.renderedMessage,
    waMeUrl:
      buildManualWaMeUrl(recipient.phoneE164, recipient.renderedMessage) ?? "",
    status: recipient.status,
  }));
}

export function exportCampaignCsv(rows: CampaignExportRow[]): string {
  const header = [
    "guest_name",
    "phone_masked",
    "invitation_url",
    "message",
    "wa_me_url",
    "status",
  ];
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const lines = [
    header.join(","),
    ...rows.map((row) =>
      [
        row.guestName,
        row.phoneMasked,
        row.invitationUrl,
        row.message,
        row.waMeUrl,
        row.status,
      ]
        .map(escape)
        .join(",")
    ),
  ];
  return lines.join("\n");
}
