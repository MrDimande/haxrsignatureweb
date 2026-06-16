export type QrCenterMark = "none" | "monogram" | "logo";

export type QrExportSize = "web" | "print";

export type QrFrameStyle =
  | "minimal"
  | "editorial"
  | "invitation"
  | "gala"
  | "wedding";

export type QrModuleStyle = "square" | "rounded" | "dots";

export type QrTitleFont =
  | "cormorant"
  | "great-vibes"
  | "allura"
  | "pinyon"
  | "playfair";

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
  moduleStyle: QrModuleStyle;
  titleFont: QrTitleFont;
  captionFont: QrTitleFont;
}

export interface QrEditorialPreset {
  label: string;
  description: string;
  foreground: string;
  background: string;
  accent: string;
  centerMark?: QrCenterMark;
  titleFont?: QrTitleFont;
  frameStyle?: QrFrameStyle;
  moduleStyle?: QrModuleStyle;
}

export const QR_STYLE_PRESETS: Record<string, QrEditorialPreset> = {
  "signature-noir": {
    label: "Signature Noir",
    description: "Ouro sobre preto profundo — gala e casamentos",
    foreground: "#C9A227",
    background: "#0a0a0a",
    accent: "#C9A227",
    centerMark: "monogram",
    titleFont: "cormorant",
    frameStyle: "invitation",
  },
  "ivory-edit": {
    label: "Ivory Editorial",
    description: "Papel marfim com tinta quente — convites clássicos",
    foreground: "#2c2824",
    background: "#faf7f0",
    accent: "#c9a96e",
    centerMark: "monogram",
    titleFont: "playfair",
    frameStyle: "editorial",
  },
  champagne: {
    label: "Champagne",
    description: "Dourado suave em fundo escuro — eventos íntimos",
    foreground: "#c9a96e",
    background: "#141210",
    accent: "#e8d5a3",
    centerMark: "logo",
    titleFont: "great-vibes",
    frameStyle: "gala",
  },
  pearl: {
    label: "Pearl Classic",
    description: "Preto sobre branco puro — leitura máxima",
    foreground: "#111111",
    background: "#ffffff",
    accent: "#C9A227",
    centerMark: "none",
    titleFont: "cormorant",
    moduleStyle: "square",
  },
  "midnight-gold": {
    label: "Midnight Gold",
    description: "Champagne invertido — noite e sofisticação",
    foreground: "#e8d5a3",
    background: "#000000",
    accent: "#C9A227",
    centerMark: "monogram",
    titleFont: "allura",
    frameStyle: "wedding",
  },
  "rose-gold": {
    label: "Rose Gold Romance",
    description: "Rosa antigo e ouro rosé — casamentos românticos",
    foreground: "#8b5e4b",
    background: "#fdf6f3",
    accent: "#d4a59a",
    centerMark: "monogram",
    titleFont: "great-vibes",
    frameStyle: "wedding",
    moduleStyle: "rounded",
  },
  "blush-ivory": {
    label: "Blush Ivory",
    description: "Marfim blush com caligrafia suave",
    foreground: "#5c4a42",
    background: "#fff9f6",
    accent: "#e8b4a8",
    centerMark: "monogram",
    titleFont: "allura",
    frameStyle: "invitation",
    moduleStyle: "dots",
  },
  "sage-garden": {
    label: "Sage Garden",
    description: "Verde sage e creme — celebrações ao ar livre",
    foreground: "#3d4f3d",
    background: "#f4f7f2",
    accent: "#8fa88f",
    centerMark: "monogram",
    titleFont: "pinyon",
    frameStyle: "editorial",
  },
  "navy-silver": {
    label: "Navy & Silver",
    description: "Azul noite com prata — eventos formais",
    foreground: "#c8d0dc",
    background: "#0f1a2e",
    accent: "#9aa8bc",
    centerMark: "logo",
    titleFont: "playfair",
    frameStyle: "gala",
    moduleStyle: "rounded",
  },
  copper: {
    label: "Copper Luxe",
    description: "Cobre quente sobre preto aveludado",
    foreground: "#c67c4e",
    background: "#120e0c",
    accent: "#e8a87c",
    centerMark: "monogram",
    titleFont: "cormorant",
    frameStyle: "gala",
    moduleStyle: "dots",
  },
};

export const QR_TITLE_FONTS: Record<
  QrTitleFont,
  { label: string; family: string; weight?: string; style?: string }
> = {
  cormorant: {
    label: "Cormorant Garamond",
    family: '"Cormorant Garamond", Georgia, serif',
    weight: "300",
  },
  "great-vibes": {
    label: "Great Vibes",
    family: '"Great Vibes", "Pinyon Script", cursive',
    weight: "400",
  },
  allura: {
    label: "Allura",
    family: '"Allura", "Great Vibes", cursive',
    weight: "400",
  },
  pinyon: {
    label: "Pinyon Script",
    family: '"Pinyon Script", cursive',
    weight: "400",
  },
  playfair: {
    label: "Playfair Display",
    family: '"Playfair Display", Georgia, serif',
    weight: "400",
    style: "italic",
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
  gala: "Gala",
  wedding: "Casamento",
};

export const QR_MODULE_LABELS: Record<QrModuleStyle, string> = {
  square: "Quadrado",
  rounded: "Arredondado",
  dots: "Pontos",
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
  moduleStyle: "rounded",
  titleFont: "cormorant",
  captionFont: "cormorant",
};

export function getQrPixelSize(size: QrExportSize): number {
  return size === "print" ? 1200 : 560;
}

export function buildFontCss(
  fontKey: QrTitleFont,
  sizePx: number
): string {
  const font = QR_TITLE_FONTS[fontKey];
  const style = font.style ? `${font.style} ` : "";
  const weight = font.weight ?? "400";
  return `${style}${weight} ${sizePx}px ${font.family}`;
}

export interface QrEditorialMeta {
  eventName: string;
  brandName?: string;
}
