import Image from "next/image";

const logos = {
  navbar: {
    src: "/images/brand/logo-horizontal-gold.png",
    width: 888,
    height: 282,
    className: "h-7 w-auto md:h-8",
  },
  footer: {
    src: "/images/brand/logo-vertical-gold.png",
    width: 642,
    height: 534,
    className: "h-24 w-auto md:h-28",
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
      alt="HAXR Signature — curadoria de eventos exclusivos em Maputo, Moçambique"
      width={logo.width}
      height={logo.height}
      priority={priority}
      className={`${logo.className} ${className}`.trim()}
    />
  );
}
