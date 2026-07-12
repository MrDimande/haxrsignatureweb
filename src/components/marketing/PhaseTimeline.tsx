import RevealOnScroll from "@/components/ui/RevealOnScroll";

type PhaseItem = { title: string; body: string };
type Phase = { phase: string; headline: string; items: readonly PhaseItem[] };

type PhaseTimelineProps = {
  phases: readonly Phase[];
  label?: string;
};

export default function PhaseTimeline({
  phases,
  label = "Como trabalhamos",
}: PhaseTimelineProps) {
  return (
    <section className="relative py-24 md:py-32">
      <div className="site-container mx-auto">
        <RevealOnScroll>
          <h2 className="section-label mb-14">{label}</h2>
        </RevealOnScroll>

        <div className="space-y-20">
          {phases.map((block, blockIndex) => (
            <RevealOnScroll key={block.phase} delay={blockIndex * 0.05}>
              <div className="border-t border-brand-champagne/40 pt-12">
                <p className="font-mono text-[9px] tracking-[0.45em] uppercase text-brand-gold font-semibold mb-3">
                  {block.phase}
                </p>
                <h3 className="font-serif text-xl md:text-2xl font-light text-brand-text-dark mb-10">
                  {block.headline}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {block.items.map((item) => (
                    <article key={item.title}>
                      <h4 className="font-serif text-lg font-light text-brand-text-dark mb-3">
                        {item.title}
                      </h4>
                      <p className="font-sans text-sm text-brand-text-dark/75 leading-relaxed font-light">
                        {item.body}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
