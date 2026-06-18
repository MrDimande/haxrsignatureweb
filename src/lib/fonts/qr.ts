import { Allura, Great_Vibes, Playfair_Display } from "next/font/google";

const allura = Allura({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-allura",
  display: "swap",
});

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-great-vibes",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

/** Fontes decorativas — apenas admin (QR / PDF), não no site público */
export const qrFontClassName = `${allura.variable} ${greatVibes.variable} ${playfair.variable}`;
