/**
 * Sanitização de payloads Twilio / audit — sem secrets nem PII completa.
 */

const SENSITIVE_KEYS = new Set([
  "authtoken",
  "auth_token",
  "token",
  "secret",
  "password",
  "api_key",
  "apikey",
  "authorization",
  "x-twilio-signature",
]);

export function sanitizeTwilioWebhookParams(
  params: Record<string, string>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    const normalized = key.trim().toLowerCase();
    if (SENSITIVE_KEYS.has(normalized)) {
      out[key] = "[redacted]";
      continue;
    }
    if (
      normalized === "body" ||
      normalized === "message" ||
      normalized === "smsbody"
    ) {
      out[key] = truncateForAudit(value, 80);
      continue;
    }
    if (normalized === "to" || normalized === "from" || normalized === "waid") {
      out[key] = maskPhoneLike(value);
      continue;
    }
    out[key] = truncateForAudit(value, 120);
  }
  return out;
}

export function sanitizeAuditDetail(detail: string): string {
  return truncateForAudit(detail.replace(/Bearer\s+\S+/gi, "Bearer [redacted]"), 240);
}

function maskPhoneLike(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 6) return "[masked]";
  return `${digits.slice(0, 3)}*****${digits.slice(-2)}`;
}

function truncateForAudit(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}…`;
}
