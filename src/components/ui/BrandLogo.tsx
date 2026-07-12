import HaxrLogo from "@/components/brand/HaxrLogo";
import type { HaxrLogoSize, HaxrLogoTone } from "@/lib/brand/brand-assets";

const variantMap = {
  hero: {
    variant: "wordmark" as const,
    size: "lg" as const,
    tone: "dark" as const,
    preferVertical: false,
  },
  navbar: {
    variant: "wordmark" as const,
    size: "md" as const,
    tone: "dark" as const,
    preferVertical: false,
  },
  footer: {
    variant: "full" as const,
    size: "lg" as const,
    tone: "dark" as const,
    preferVertical: true,
  },
  admin: {
    variant: "wordmark" as const,
    size: "sm" as const,
    tone: "dark" as const,
    preferVertical: false,
  },
} as const;

type BrandLogoVariant = keyof typeof variantMap;

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  className?: string;
  priority?: boolean;
  tone?: HaxrLogoTone;
}

/**
 * Wrapper de compatibilidade — preferir HaxrLogo directamente em código novo.
 */
export default function BrandLogo({
  variant = "navbar",
  className = "",
  priority = false,
  tone,
}: BrandLogoProps) {
  const config = variantMap[variant];
  const size: HaxrLogoSize = variant === "footer" ? "lg" : config.size;

  return (
    <HaxrLogo
      variant={config.variant}
      tone={tone ?? config.tone}
      size={size}
      className={className}
      priority={priority}
      preferVertical={config.preferVertical}
    />
  );
}
