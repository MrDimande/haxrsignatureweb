import RevealOnScroll from "@/components/ui/RevealOnScroll";
import SplitText from "@/components/ui/SplitText";
import { portfolioCopy, universePillars } from "@/lib/site-config";

export default function Universe() {
  return (
    <section
      id="universo"
      className="relative pt-20 pb-12 md:pt-28 md:pb-16 bg-black-soft"
    >
      <div className="site-container site-prose-medium mx-auto relative">
        <div className="art-deco-corner art-deco-corner--tl" />
        <div className="art-deco-corner art-deco-corner--br" />

        <RevealOnScroll>
          <h2 className="section-label mb-16">Universo</h2>
        </RevealOnScroll>

        <SplitText
          as="h3"
          className="font-serif text-2xl md:text-3xl font-light leading-relaxed text-white/90 mb-6 max-w-2xl"
        >
          Áreas de actuação.
        </SplitText>

        <RevealOnScroll delay={0.1}>
          <p className="font-sans text-sm text-grey leading-loose mb-12 md:mb-16 max-w-lg">
            {portfolioCopy.universo.areas}
          </p>
        </RevealOnScroll>

        <div className="space-y-0">
          {universePillars.map((pillar, i) => (
            <RevealOnScroll key={pillar.num} delay={i * 0.06}>
              <article
                className={`group relative py-12 md:py-14 ${
                  i < universePillars.length - 1 ? "border-b border-grey-dark" : ""
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-start">
                  <p className="font-mono text-gold text-[10px] tracking-[0.4em] md:col-span-1">
                    {pillar.num}
                  </p>

                  <h3 className="font-serif text-xl md:text-2xl font-light tracking-wide text-white md:col-span-4 group-hover:text-gold/80 transition-colors duration-700">
                    {pillar.title}
                  </h3>

                  <p className="font-sans text-sm text-grey leading-relaxed md:col-span-7">
                    {pillar.desc}
                  </p>
                </div>
              </article>
            </RevealOnScroll>
          ))}
        </div>

        <RevealOnScroll className="mt-16 md:mt-20">
          <div className="line-gold" />
        </RevealOnScroll>
      </div>
    </section>
  );
}
