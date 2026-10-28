import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { buildSiteMetadata } from "@/lib/seo";
import "./globals.css";

const fraunces = localFont({
  src: "./fonts/Fraunces-Variable.ttf",
  weight: "400 600",
  variable: "--font-fraunces",
  display: "swap",
});

const sourceSans = localFont({
  src: "./fonts/SourceSans3-Variable.ttf",
  weight: "400 600",
  variable: "--font-source-sans",
  display: "swap",
});

export const metadata: Metadata = buildSiteMetadata();

export const viewport: Viewport = {
  themeColor: "#080706",
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-MZ"
      className={`${fraunces.variable} ${sourceSans.variable}`}
      suppressHydrationWarning
    >
      <body
        className="bg-brand-ivory text-brand-text-dark font-sans antialiased"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
