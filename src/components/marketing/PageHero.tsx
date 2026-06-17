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
          className="font-serif text-3xl md:text-5xl font-light leading-relaxed text-white/92 mb-8 max-w-3xl"
        >
          {headline}
        </SplitText>

        {description ? (
          <RevealOnScroll delay={0.08}>
            <p className="font-sans text-sm md:text-base text-grey leading-relaxed max-w-2xl">
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
          <h2 className="font-serif text-2xl md:text-3xl font-light text-white/90 mb-4">
            {headline}
          </h2>
          <p className="font-sans text-sm text-grey max-w-xl mx-auto mb-10">
            {description}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={primaryHref}
              className="inline-flex items-center justify-center px-8 py-3 font-mono text-[10px] tracking-[0.3em] uppercase text-black bg-gold hover:bg-gold/90 transition-colors duration-500"
            >
              {primaryLabel}
            </Link>
            {secondaryHref && secondaryLabel ? (
              <Link
                href={secondaryHref}
                className="inline-flex items-center justify-center px-8 py-3 font-mono text-[10px] tracking-[0.3em] uppercase text-gold/70 border border-gold-dim hover:text-gold hover:border-gold/40 transition-colors duration-500"
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
