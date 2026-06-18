import { brevoFetch } from "@/lib/brevo/client";
import { getBrevoSender } from "@/lib/brevo/config";
import {
  getFunnelTemplate,
  type FunnelEmailKind,
  type FunnelTemplateParams,
} from "@/lib/brevo/templates";

export type SendFunnelEmailInput = {
  email: string;
  name: string;
  kind: FunnelEmailKind;
  params: FunnelTemplateParams;
};

export async function sendFunnelEmail(
  input: SendFunnelEmailInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const template = getFunnelTemplate(input.kind);
  const sender = getBrevoSender();

  const result = await brevoFetch<{ messageId?: string }>("/smtp/email", {
    method: "POST",
    body: JSON.stringify({
      sender,
      to: [{ email: input.email.toLowerCase(), name: input.name }],
      replyTo: { email: sender.email, name: sender.name },
      subject: template.subject,
      htmlContent: template.html(input.params),
      headers: {
        "X-Mailin-Preview": template.previewText,
      },
      tags: [`haxr-${input.kind.replace(/_/g, "-")}`],
    }),
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return { ok: true };
}
