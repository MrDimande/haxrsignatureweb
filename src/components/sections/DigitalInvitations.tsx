import RevealOnScroll from "@/components/ui/RevealOnScroll";
import SplitText from "@/components/ui/SplitText";
import InvitationMockup from "@/components/ui/InvitationMockup";
import InvitationPackages from "@/components/sections/InvitationPackages";
import {
  invitationResources,
  portfolioCopy,
  siteConfig,
} from "@/lib/site-config";

const occasions = [
  "Casamentos",
  "Lobolos",
  "Noivados",
  "Aniversários",
  "Baptizados",
  "Graduações",
  "Corporativo",
  "Galas",
];

export default function DigitalInvitations() {
  const { convites } = portfolioCopy;

  return (
    <section id="convites" className="relative pt-20 pb-12 md:pt-28 md:pb-16">
      <div className="site-container site-prose-medium mx-auto">
        <div className="max-w-3xl mb-12 md:mb-16">
          <RevealOnScroll>
            <p className="section-label mb-6">
              <a
                href="#universo"
                className="transition-colors duration-500 hover:text-gold/60"
              >
                01 · Universo HAXR
              </a>
            </p>
            <h2 className="section-label mb-16">Convites Digitais</h2>
          </RevealOnScroll>

          <SplitText
            as="h3"
            className="font-serif text-2xl md:text-4xl font-light leading-relaxed text-white/90 mb-8"
          >
            {convites.headline}
          </SplitText>

          <div className="space-y-6">
            {convites.paragraphs.map((paragraph, i) => (
              <RevealOnScroll key={paragraph} delay={0.08 + i * 0.05}>
                <p className="font-sans text-sm text-grey leading-loose max-w-xl">
                  {paragraph}
                </p>
              </RevealOnScroll>
            ))}
          </div>
        </div>

        <div className="mb-16 md:mb-24">
          <InvitationMockup />
        </div>

        <RevealOnScroll>
          <p className="font-mono text-[9px] tracking-[0.5em] uppercase text-grey mb-10">
            {convites.resourcesLabel}
          </p>
        </RevealOnScroll>

        <RevealOnScroll delay={0.05}>
          <div className="flex flex-wrap gap-x-8 gap-y-4 mb-12 md:mb-16 max-w-3xl">
            {invitationResources.map((resource) => (
              <span
                key={resource}
                className="font-sans text-xs text-white/50 tracking-wide"
              >
                {resource}
              </span>
            ))}
          </div>
        </RevealOnScroll>

        <RevealOnScroll className="mb-12 md:mb-16">
          <p className="font-mono text-[9px] tracking-[0.5em] uppercase text-grey mb-6">
            Ideal para
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {occasions.map((occasion) => (
              <span
                key={occasion}
                className="font-sans text-[11px] tracking-[0.25em] uppercase text-grey/70"
              >
                {occasion}
              </span>
            ))}
          </div>
        </RevealOnScroll>

        <InvitationPackages />

        <RevealOnScroll className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8">
          <p className="font-serif text-lg font-light italic text-white/50 max-w-md">
            Não encontrou o pacote ideal? Descreva o evento — ajustamos a
            proposta ao prazo e ao nível de personalização.
          </p>

          <a
            href={siteConfig.contact.conviteProposalHash}
            className="group inline-flex items-center gap-3 border border-gold-dim text-gold text-[11px] tracking-[0.3em] uppercase px-8 py-3.5 hover:border-gold hover:bg-gold/5 transition-all duration-700 shrink-0"
          >
            <span>Solicitar proposta de convite</span>
            <span className="inline-block transition-transform duration-500 group-hover:translate-x-1">
              →
            </span>
          </a>
        </RevealOnScroll>

        <RevealOnScroll className="mt-16 md:mt-20">
          <div className="line-gold" />
        </RevealOnScroll>
      </div>
    </section>
  );
}
