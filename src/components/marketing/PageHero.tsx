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
      <div className="site-container mx-auto">
        <RevealOnScroll>
          <p className="section-label mb-8">{label}</p>
        </RevealOnScroll>

        <SplitText
          as="h1"
          className="font-serif text-3xl md:text-5xl font-light text-brand-text-dark mb-8 md:mb-10 max-w-4xl leading-[1.25]"
        >
          {headline}
        </SplitText>

        {description ? (
          <RevealOnScroll delay={0.08}>
            <p className="font-sans text-sm md:text-base text-brand-text-dark/80 max-w-2xl leading-relaxed font-light">
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
    <section className="relative py-20 md:py-32 bg-brand-black border-t border-gold-dim">
      <div className="site-container-wide mx-auto text-center">
        <RevealOnScroll>
          <h2 className="font-serif text-[clamp(1.75rem,3vw,2.5rem)] font-medium text-brand-ivory mb-6 max-w-2xl mx-auto leading-relaxed">
            {headline}
          </h2>
          <p className="font-sans text-base md:text-lg text-brand-ivory/85 max-w-xl mx-auto mb-12 md:mb-14 leading-relaxed">
            {description}
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 md:gap-5 w-full sm:w-auto">
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
