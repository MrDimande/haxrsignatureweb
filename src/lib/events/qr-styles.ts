export type QrCenterMark = "none" | "monogram" | "logo";

export type QrExportSize = "web" | "print";

export type QrFrameStyle = "minimal" | "editorial" | "invitation";

export interface QrStyleOptions {
  foreground: string;
  background: string;
  accent: string;
  centerMark: QrCenterMark;
  monogramText: string;
  logoSrc: string;
  size: QrExportSize;
  margin: number;
  frameStyle: QrFrameStyle;
}

export interface QrEditorialPreset {
  label: string;
  description: string;
  foreground: string;
  background: string;
  accent: string;
  centerMark?: QrCenterMark;
}

export const QR_STYLE_PRESETS: Record<string, QrEditorialPreset> = {
  "signature-noir": {
    label: "Signature Noir",
    description: "Ouro sobre preto profundo — gala e casamentos",
    foreground: "#C9A227",
    background: "#0a0a0a",
    accent: "#C9A227",
    centerMark: "monogram",
  },
  "ivory-edit": {
    label: "Ivory Editorial",
    description: "Papel marfim com tinta quente — convites clássicos",
    foreground: "#2c2824",
    background: "#faf7f0",
    accent: "#c9a96e",
    centerMark: "monogram",
  },
  champagne: {
    label: "Champagne",
    description: "Dourado suave em fundo escuro — eventos íntimos",
    foreground: "#c9a96e",
    background: "#141210",
    accent: "#e8d5a3",
    centerMark: "logo",
  },
  pearl: {
    label: "Pearl Classic",
    description: "Preto sobre branco puro — leitura máxima",
    foreground: "#111111",
    background: "#ffffff",
    accent: "#C9A227",
    centerMark: "none",
  },
  "midnight-gold": {
    label: "Midnight Gold",
    description: "Champagne invertido — noite e sofisticação",
    foreground: "#e8d5a3",
    background: "#000000",
    accent: "#C9A227",
    centerMark: "monogram",
  },
};

export const QR_LOGO_OPTIONS = [
  {
    id: "mark",
    label: "Monograma",
    src: "/apple-touch-icon.png",
  },
  {
    id: "horizontal",
    label: "Horizontal",
    src: "/images/brand/logo-horizontal-gold.png",
  },
  {
    id: "vertical",
    label: "Vertical",
    src: "/images/brand/logo-vertical-gold.png",
  },
] as const;

export const QR_FRAME_LABELS: Record<QrFrameStyle, string> = {
  minimal: "Só QR",
  editorial: "Editorial",
  invitation: "Convite",
};

export const DEFAULT_QR_STYLE: QrStyleOptions = {
  foreground: QR_STYLE_PRESETS["signature-noir"].foreground,
  background: QR_STYLE_PRESETS["signature-noir"].background,
  accent: QR_STYLE_PRESETS["signature-noir"].accent,
  centerMark: "monogram",
  monogramText: "HXR",
  logoSrc: QR_LOGO_OPTIONS[0].src,
  size: "print",
  margin: 4,
  frameStyle: "invitation",
};

export function getQrPixelSize(size: QrExportSize): number {
  return size === "print" ? 1200 : 560;
}

export interface QrEditorialMeta {
  eventName: string;
  brandName?: string;
}
