/**
 * Extrai apenas o token de uma URL de passe HAXR ou devolve o token cru.
 *
 * A URL do QR de Edition tem o formato:
 * /event/:eventId/checkin/:token
 * Nunca registar nem mostrar o conteúdo do token em logs.
 */
export function extractQrToken(rawInput: string): string {
  const trimmed = rawInput.trim();
  if (!trimmed) return "";

  const decodeToken = (value: string): string => {
    try {
      return decodeURIComponent(value).trim();
    } catch {
      return value.trim();
    }
  };

  try {
    const url = new URL(trimmed);
    const segments = url.pathname.split("/").filter(Boolean);
    const checkinIndex = segments.findIndex(
      (segment) => segment.toLowerCase() === "checkin"
    );
    const tokenSegment = checkinIndex >= 0 ? segments[checkinIndex + 1] : undefined;
    if (tokenSegment) return decodeToken(tokenSegment);
  } catch {
    // Também aceita paths relativos e tokens crus, comuns no fallback manual.
  }

  const pathMatch = trimmed.match(/(?:^|\/)checkin\/([^/?#]+)/i);
  if (pathMatch?.[1]) return decodeToken(pathMatch[1]);

  return trimmed;
}
