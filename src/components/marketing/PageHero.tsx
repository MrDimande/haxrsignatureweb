import Link from "next/link";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import SplitText from "@/components/ui/SplitText";

type PageHeroProps = {
  label: string;
  headline: string;
  description?: string;
  children?: React.ReactNode;
};

export default function PageHero({
  label,
  headline,
  description,
  children,
}: PageHeroProps) {
  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24">
      <div className="site-container site-prose-medium mx-auto">
        <RevealOnScroll>
          <p className="section-label mb-8">{label}</p>
        </RevealOnScroll>

        <SplitText
          as="h1"
          className="type-display text-white/92 mb-8 md:mb-10 max-w-4xl leading-[1.25]"
        >
          {headline}
        </SplitText>

        {description ? (
          <RevealOnScroll delay={0.08}>
            <p className="type-lead text-grey max-w-2xl">
              {description}
            </p>
          </RevealOnScroll>
        ) : null}

        {children ? <div className="mt-10">{children}</div> : null}
      </div>
    </section>
  );
}

type CTABandProps = {
  headline?: string;
  description?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function CTABand({
  headline = "Estamos prontos para ouvir a sua história.",
  description = "Partilhe a data, a visão e o que imagina para o seu evento. Respondemos com discrição em 2 a 5 dias úteis.",
  primaryHref = "/contacto",
  primaryLabel = "Iniciar conversa",
  secondaryHref,
  secondaryLabel,
}: CTABandProps) {
  return (
    <section className="relative py-20 md:py-28 border-t border-grey-dark/80">
      <div className="site-container site-prose-medium mx-auto text-center">
        <RevealOnScroll>
          <h2 className="type-headline text-white/90 mb-5 md:mb-6">
            {headline}
          </h2>
          <p className="type-lead text-grey max-w-xl mx-auto mb-12 md:mb-14">
            {description}
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 md:gap-5">
            <Link href={primaryHref} className="btn-editorial btn-editorial--solid">
              {primaryLabel}
            </Link>
            {secondaryHref && secondaryLabel ? (
              <Link
                href={secondaryHref}
                className="btn-editorial btn-editorial--outline"
              >
                {secondaryLabel}
              </Link>
            ) : null}
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
