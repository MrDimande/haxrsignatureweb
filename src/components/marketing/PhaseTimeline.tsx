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
    <section className="relative py-16 md:py-24">
      <div className="site-container site-prose-medium mx-auto">
        <RevealOnScroll>
          <h2 className="section-label mb-14">{label}</h2>
        </RevealOnScroll>

        <div className="space-y-20">
          {phases.map((block, blockIndex) => (
            <RevealOnScroll key={block.phase} delay={blockIndex * 0.05}>
              <div className="border-t border-grey-dark pt-12">
                <p className="font-mono text-[9px] tracking-[0.45em] uppercase text-gold/55 mb-3">
                  {block.phase}
                </p>
                <h3 className="font-serif text-xl md:text-2xl font-light text-white/90 mb-10">
                  {block.headline}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {block.items.map((item) => (
                    <article key={item.title}>
                      <h4 className="font-serif text-lg font-light text-white mb-3">
                        {item.title}
                      </h4>
                      <p className="font-sans text-sm text-grey leading-relaxed">
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
