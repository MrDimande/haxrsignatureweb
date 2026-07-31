import QRCode from "qrcode";
import { buildFindSeatUrl } from "@/lib/events/tokens";
import type { QrStyleOptions } from "@/lib/events/qr-styles";

export async function generateEventFindSeatQrDataUrl(
  eventId: string,
  accessCode: string,
  options?: Partial<QrStyleOptions>
): Promise<string> {
  const url = buildFindSeatUrl(eventId, accessCode);
  const useCenter = options?.centerMark && options.centerMark !== "none";
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: useCenter ? "H" : "M",
    margin: options?.margin ?? 2,
    width: options?.size === "print" ? 1200 : 520,
    color: {
      dark: options?.foreground ?? "#0a0a0a",
      light: options?.background ?? "#ffffff",
    },
  });
}

export async function generateEventFindSeatQrBuffer(
  eventId: string,
  accessCode: string
): Promise<Buffer> {
  const url = buildFindSeatUrl(eventId, accessCode);
  return QRCode.toBuffer(url, {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 2,
    width: 1024,
    color: {
      dark: "#0a0a0a",
      light: "#ffffff",
    },
  });
}
