import RevealOnScroll from "@/components/ui/RevealOnScroll";

type Feature = { title: string; body: string; highlights?: readonly string[] };

type FeatureGridProps = {
  features: readonly Feature[];
  label?: string;
  columns?: 2 | 3;
};

export default function FeatureGrid({
  features,
  label,
  columns = 2,
}: FeatureGridProps) {
  const gridClass =
    columns === 3
      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-grey-dark"
      : "grid grid-cols-1 md:grid-cols-2 gap-px bg-grey-dark";

  return (
    <section className="relative py-16 md:py-24">
      <div className="site-container site-prose-wide mx-auto">
        {label ? (
          <RevealOnScroll>
            <h2 className="section-label mb-12">{label}</h2>
          </RevealOnScroll>
        ) : null}

        <div className={gridClass}>
          {features.map((feature, i) => (
            <RevealOnScroll key={feature.title} delay={i * 0.04}>
              <article className="bg-black-soft p-8 md:p-10 h-full">
                <h3 className="font-serif text-lg md:text-xl font-light text-white mb-4">
                  {feature.title}
                </h3>
                <p className="font-sans text-sm text-grey leading-relaxed mb-4">
                  {feature.body}
                </p>
                {feature.highlights?.length ? (
                  <ul className="space-y-2">
                    {feature.highlights.map((h) => (
                      <li
                        key={h}
                        className="font-mono text-[9px] tracking-[0.2em] uppercase text-gold/50"
                      >
                        — {h}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
