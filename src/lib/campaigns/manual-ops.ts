import { buildWhatsAppUrl } from "@/lib/admin/whatsapp";
import type {
  CampaignRecipient,
  ManualRecipientOps,
  RecipientStatus,
} from "@/lib/campaigns/types";
import { isManualOpsAllowed, getWhatsappSendMode } from "@/lib/campaigns/send-mode";

export function buildManualWaMeUrl(
  phone: string | null | undefined,
  message: string
): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 8) return null;
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
  | "mark_sent";

export function nextStatusAfterManualAction(
  current: RecipientStatus,
  action: ManualAction
): RecipientStatus {
  switch (action) {
    case "copy":
      return current === "marked_sent" ? current : "copied";
    case "open":
      return current === "marked_sent" ? current : "opened";
    case "mark_sent":
      return "marked_sent";
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
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
