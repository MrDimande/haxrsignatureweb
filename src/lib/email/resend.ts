import { Resend } from "resend";
import {
  formatFrom,
  type EmailChannel,
} from "@/lib/email/addresses";

const BRAND = "HAXR Signature";
const SANDBOX_FROM = `${BRAND} <onboarding@resend.dev>`;

export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  return new Resend(apiKey);
}

/** Activar após verificação do domínio no painel Resend. */
export function isBrandDomainEnabled(): boolean {
  return process.env.RESEND_BRAND_DOMAIN?.trim() === "true";
}

function getSandboxFrom(): string {
  const override = process.env.RESEND_FROM_EMAIL?.trim();
  if (override) return override;
  return SANDBOX_FROM;
}

/** Remetente contextual — sandbox até RESEND_BRAND_DOMAIN=true. */
export function resolveFrom(channel: EmailChannel): string {
  if (!isBrandDomainEnabled()) {
    return getSandboxFrom();
  }
  return formatFrom(channel);
}

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export type SendHaxrEmailInput = {
  channel: EmailChannel;
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string | string[];
};

export async function sendHaxrEmail(
  input: SendHaxrEmailInput
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResendClient();
  if (!resend) {
    return { ok: false, error: "RESEND_API_KEY não configurada" };
  }

  const to = Array.isArray(input.to) ? input.to : [input.to];

  const result = await resend.emails.send({
    from: resolveFrom(input.channel),
    to,
    subject: input.subject,
    html: input.html,
    replyTo: input.replyTo,
  });

  if (result.error) {
    return { ok: false, error: result.error.message };
  }

  return { ok: true };
}
