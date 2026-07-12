import Image from "next/image";
import Link from "next/link";
import {
  HAXR_BRAND_ALT,
  HAXR_BRAND_ASSETS,
  isHorizontalLogoAvailable,
  isVerticalLogoAvailable,
  resolveHorizontalLogoPath,
  resolveMarkLogoPath,
  type HaxrLogoSize,
  type HaxrLogoTone,
  type HaxrLogoVariant,
} from "@/lib/brand/brand-assets";

const MARK_DIMENSIONS = { width: 512, height: 512 } as const;
const HORIZONTAL_DIMENSIONS = { width: 888, height: 282 } as const;
const VERTICAL_DIMENSIONS = { width: 642, height: 534 } as const;

const sizeClasses: Record<
  HaxrLogoSize,
  { mark: string; horizontal: string; vertical: string }
> = {
  sm: {
    mark: "h-7 w-7",
    horizontal: "h-7 w-auto max-w-[9.5rem]",
    vertical: "h-20 w-auto",
  },
  md: {
    mark: "h-9 w-9",
    horizontal: "h-8 w-auto max-w-[min(52vw,220px)] md:h-9 md:max-w-[260px]",
    vertical: "h-28 w-auto md:h-32",
  },
  lg: {
    mark: "h-12 w-12",
    horizontal:
      "h-[4.25rem] w-auto max-w-[min(94vw,400px)] sm:h-[5.25rem] md:h-[6.5rem] lg:h-[7.75rem] lg:max-w-[min(88vw,580px)]",
    vertical: "h-[7.5rem] w-auto md:h-32",
  },
  email: {
    mark: "h-10 w-10",
    horizontal: "h-10 w-auto max-w-[160px]",
    vertical: "h-16 w-auto",
  },
};

type LogoLayout = "mark" | "horizontal" | "vertical";

type HaxrLogoProps = {
  variant?: HaxrLogoVariant;
  tone?: HaxrLogoTone;
  size?: HaxrLogoSize;
  className?: string;
  priority?: boolean;
  /** Rótulo secundário — ex. Wedding Dashboard */
  subtitle?: string;
  href?: string;
  link?: boolean;
  /** Footer empilhado — vertical gold quando disponível */
  preferVertical?: boolean;
};

function subtitleClass(): string {
  return "font-mono text-[8px] font-bold uppercase tracking-[0.38em] text-brand-gold";
}

function wordmarkClass(tone: HaxrLogoTone): string {
  if (tone === "light") {
    return "font-serif text-lg font-light tracking-[0.12em] text-brand-text-dark";
  }
  if (tone === "gold") {
    return "font-serif text-lg font-light tracking-[0.12em] text-brand-gold";
  }
  return "font-serif text-lg font-light tracking-[0.12em] text-white";
}

function resolveLogoLayout(
  variant: HaxrLogoVariant,
  tone: HaxrLogoTone,
  preferVertical: boolean
): LogoLayout {
  if (variant === "mark") {
    return "mark";
  }

  if (
    preferVertical &&
    isVerticalLogoAvailable() &&
    (variant === "full" || variant === "wordmark")
  ) {
    return "vertical";
  }

  if (
    (variant === "full" || variant === "wordmark") &&
    isHorizontalLogoAvailable()
  ) {
    return "horizontal";
  }

  return "mark";
}

export default function HaxrLogo({
  variant = "full",
  tone = "dark",
  size = "md",
  className = "",
  priority = false,
  subtitle,
  href = "/",
  link = false,
  preferVertical = false,
}: HaxrLogoProps) {
  const sizes = sizeClasses[size];
  const layout = resolveLogoLayout(variant, tone, preferVertical);
  const effectiveTone = tone === "gold" ? "dark" : tone;

  let imageSrc: string;
  let imageWidth: number;
  let imageHeight: number;
  let imageClass: string;

  if (layout === "vertical") {
    imageSrc = HAXR_BRAND_ASSETS.logoVerticalGold;
    imageWidth = VERTICAL_DIMENSIONS.width;
    imageHeight = VERTICAL_DIMENSIONS.height;
    imageClass = `${sizes.vertical} object-left object-contain`;
  } else if (layout === "horizontal") {
    imageSrc = resolveHorizontalLogoPath(effectiveTone);
    imageWidth = HORIZONTAL_DIMENSIONS.width;
    imageHeight = HORIZONTAL_DIMENSIONS.height;
    imageClass = `${sizes.horizontal} object-contain`;
  } else {
    imageSrc = resolveMarkLogoPath(effectiveTone);
    imageWidth = MARK_DIMENSIONS.width;
    imageHeight = MARK_DIMENSIONS.height;
    imageClass = `${sizes.mark} shrink-0 object-contain`;
  }

  const showTextWordmark =
    variant === "full" && layout === "mark" && !subtitle;

  const content = (
    <span className={`inline-flex items-center gap-2.5 ${className}`.trim()}>
      <Image
        src={imageSrc}
        alt={HAXR_BRAND_ALT}
        width={imageWidth}
        height={imageHeight}
        priority={priority}
        className={imageClass}
      />

      {showTextWordmark ? (
        <span className={wordmarkClass(tone)}>
          <span className="sr-only">{HAXR_BRAND_ALT}</span>
          <span aria-hidden className="not-sr-only">
            HAXR
          </span>
        </span>
      ) : null}

      {subtitle ? (
        <span className="flex flex-col items-start gap-0.5">
          {variant === "full" && layout === "mark" ? (
            <span className={wordmarkClass(tone)} aria-hidden>
              HAXR
            </span>
          ) : null}
          <span className={subtitleClass()}>{subtitle}</span>
        </span>
      ) : null}
    </span>
  );

  if (link) {
    return (
      <Link
        href={href}
        className="inline-block transition-opacity hover:opacity-90"
        aria-label={`${HAXR_BRAND_ALT} — início`}
      >
        {content}
      </Link>
    );
  }

  return content;
}
