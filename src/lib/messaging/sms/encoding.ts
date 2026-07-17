/**
 * GSM-7 / Unicode detection, contagem de caracteres, estimativa de segmentos
 * e aviso de custo (informativo).
 *
 * @see https://www.twilio.com/docs/glossary/what-sms-character-limit
 */

/** Conjunto básico GSM-7 (sem extensão). */
const GSM7_BASIC =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ ÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?" +
  "¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";

/** Caracteres de extensão GSM-7 (contam como 2). */
const GSM7_EXTENDED = "^{}\\[~]|€";

export type SmsEncoding = "gsm7" | "ucs2";

export type SmsSegmentEstimate = {
  encoding: SmsEncoding;
  characterCount: number;
  /** Unidades GSM (extensão conta 2). */
  gsmSeptetCount: number;
  segmentCount: number;
  maxCharsPerSegment: number;
  /** Aviso informativo — nunca bloqueia envio sozinho. */
  costWarning: string | null;
};

function isGsm7Char(ch: string): boolean {
  return GSM7_BASIC.includes(ch) || GSM7_EXTENDED.includes(ch);
}

export function detectSmsEncoding(body: string): SmsEncoding {
  for (const ch of body) {
    if (!isGsm7Char(ch)) return "ucs2";
  }
  return "gsm7";
}

export function countGsmSeptets(body: string): number {
  let count = 0;
  for (const ch of body) {
    count += GSM7_EXTENDED.includes(ch) ? 2 : 1;
  }
  return count;
}

export function countSmsCharacters(body: string): number {
  return [...body].length;
}

/**
 * Estimativa de segmentos SMS.
 * GSM-7: 160 / 153 multipart
 * UCS-2: 70 / 67 multipart
 */
export function estimateSmsSegments(body: string): SmsSegmentEstimate {
  const encoding = detectSmsEncoding(body);
  const characterCount = countSmsCharacters(body);

  if (encoding === "gsm7") {
    const gsmSeptetCount = countGsmSeptets(body);
    const single = 160;
    const multi = 153;
    const segmentCount =
      gsmSeptetCount === 0
        ? 0
        : gsmSeptetCount <= single
          ? 1
          : Math.ceil(gsmSeptetCount / multi);
    return {
      encoding,
      characterCount,
      gsmSeptetCount,
      segmentCount,
      maxCharsPerSegment: segmentCount <= 1 ? single : multi,
      costWarning: buildCostWarning(segmentCount, encoding),
    };
  }

  const single = 70;
  const multi = 67;
  const segmentCount =
    characterCount === 0
      ? 0
      : characterCount <= single
        ? 1
        : Math.ceil(characterCount / multi);

  return {
    encoding,
    characterCount,
    gsmSeptetCount: characterCount,
    segmentCount,
    maxCharsPerSegment: segmentCount <= 1 ? single : multi,
    costWarning: buildCostWarning(segmentCount, encoding),
  };
}

function buildCostWarning(
  segmentCount: number,
  encoding: SmsEncoding
): string | null {
  if (segmentCount <= 1) return null;
  if (encoding === "ucs2") {
    return `Mensagem Unicode (~${segmentCount} segmentos). Caracteres especiais aumentam o custo por SMS.`;
  }
  return `Mensagem longa (~${segmentCount} segmentos GSM-7). Cada segmento adicional aumenta o custo.`;
}
