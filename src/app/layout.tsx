import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, JetBrains_Mono, Jost, Pinyon_Script } from "next/font/google";
import { buildSiteMetadata } from "@/lib/seo";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-jost",
  display: "swap",
});

const pinyonScript = Pinyon_Script({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-signature",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = buildSiteMetadata();

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-MZ"
      className={`${cormorant.variable} ${jost.variable} ${pinyonScript.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-black text-white font-sans font-light min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
