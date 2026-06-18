import Image from "next/image";
import { brandAssets } from "@/lib/assets";

const logos = {
  hero: {
    src: brandAssets.logoHorizontal,
    width: 888,
    height: 282,
    className:
      "h-[4.25rem] w-auto max-w-[min(94vw,400px)] sm:h-[5.25rem] md:h-[6.5rem] lg:h-[7.75rem] lg:max-w-[min(88vw,580px)]",
    sizes: "(max-width: 768px) 400px, 580px",
  },
  navbar: {
    src: brandAssets.logoHorizontal,
    width: 888,
    height: 282,
    className: "h-8 w-auto max-w-[min(52vw,220px)] md:h-9 md:max-w-[260px]",
    sizes: "(max-width: 768px) 180px, 240px",
  },
  footer: {
    src: brandAssets.logoVertical,
    width: 642,
    height: 534,
    className: "h-[7.5rem] w-auto md:h-32 object-left",
    sizes: "(max-width: 768px) 160px, 200px",
  },
  admin: {
    src: brandAssets.logoHorizontal,
    width: 888,
    height: 282,
    className: "h-7 w-auto max-w-[9.5rem]",
    sizes: "152px",
  },
} as const;

type BrandLogoVariant = keyof typeof logos;

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  className?: string;
  priority?: boolean;
}

export default function BrandLogo({
  variant = "navbar",
  className = "",
  priority = false,
}: BrandLogoProps) {
  const logo = logos[variant];

  return (
    <Image
      src={logo.src}
      alt="HAXR Signature"
      width={logo.width}
      height={logo.height}
      priority={priority}
      quality={100}
      sizes={logo.sizes}
      className={`${logo.className} ${className}`.trim()}
    />
  );
}
