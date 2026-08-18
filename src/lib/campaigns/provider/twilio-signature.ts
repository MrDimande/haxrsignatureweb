import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Validação obrigatória da assinatura Twilio (X-Twilio-Signature).
 * @see https://www.twilio.com/docs/usage/webhooks/webhooks-security
 */

export function buildTwilioSignaturePayload(
  url: string,
  params: Record<string, string>
): string {
  const sortedKeys = Object.keys(params).sort();
  let data = url;
  for (const key of sortedKeys) {
    data += key + params[key];
  }
  return data;
}

export function computeTwilioSignature(
  authToken: string,
  url: string,
  params: Record<string, string>
): string {
  const payload = buildTwilioSignaturePayload(url, params);
  return createHmac("sha1", authToken).update(payload, "utf8").digest("base64");
}

export function validateTwilioRequestSignature(input: {
  authToken: string;
  signatureHeader: string | null | undefined;
  url: string;
  params: Record<string, string>;
}): { ok: true } | { ok: false; reason: string } {
  const provided = input.signatureHeader?.trim();
  if (!provided) {
    return { ok: false, reason: "Cabeçalho X-Twilio-Signature ausente." };
  }
  if (!input.authToken.trim()) {
    return { ok: false, reason: "TWILIO_AUTH_TOKEN ausente — fail-closed." };
  }

  const expected = computeTwilioSignature(
    input.authToken,
    input.url,
    input.params
  );

  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);
  if (
    providedBuf.length !== expectedBuf.length ||
    !timingSafeEqual(providedBuf, expectedBuf)
  ) {
    return { ok: false, reason: "Assinatura Twilio inválida." };
  }

  return { ok: true };
}
