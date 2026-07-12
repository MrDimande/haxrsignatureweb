import {
  getFunnelTemplate,
  type FunnelEmailKind,
  type FunnelTemplateParams,
} from "@/lib/brevo/templates";
import { sendTransactionalEmail } from "@/lib/email/brevo-client";
import type { SendEmailOutcome } from "@/lib/email/email-types";

export type SendFunnelEmailInput = {
  email: string;
  name: string;
  kind: FunnelEmailKind;
  params: FunnelTemplateParams;
};

export type SendFunnelEmailResult = SendEmailOutcome;

export async function sendFunnelEmail(
  input: SendFunnelEmailInput
): Promise<SendFunnelEmailResult> {
  const template = getFunnelTemplate(input.kind);

  return sendTransactionalEmail({
    toEmail: input.email,
    toName: input.name,
    subject: template.subject,
    htmlContent: template.html(input.params),
    preheader: template.previewText,
    tags: [`haxr-${input.kind.replace(/_/g, "-")}`],
  });
}
