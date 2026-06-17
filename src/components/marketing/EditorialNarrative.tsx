import RevealOnScroll from "@/components/ui/RevealOnScroll";
import type { PageNarrative } from "@/lib/marketing/editorial";

type EditorialNarrativeProps = {
  narrative: PageNarrative;
  label?: string;
};

export default function EditorialNarrative({
  narrative,
  label = "A nossa perspectiva",
}: EditorialNarrativeProps) {
  const blocks = [
    { key: "problem", title: "O desafio", text: narrative.problem },
    { key: "impact", title: "O que sente", text: narrative.emotionalImpact },
    { key: "solution", title: "Como a HAXR conduz", text: narrative.solution },
    { key: "after", title: "Depois", text: narrative.feelingAfter },
  ] as const;

  return (
    <section className="relative py-16 md:py-24 border-b border-grey-dark/40">
      <div className="site-container site-prose-medium mx-auto">
        <RevealOnScroll>
          <h2 className="section-label mb-14">{label}</h2>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
          {blocks.map((block, i) => (
            <RevealOnScroll key={block.key} delay={i * 0.05}>
              <article>
                <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-gold/50 mb-4">
                  {block.title}
                </p>
                <p className="font-serif text-lg md:text-xl font-light text-white/85 leading-relaxed">
                  {block.text}
                </p>
              </article>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
