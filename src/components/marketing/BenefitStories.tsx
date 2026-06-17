import RevealOnScroll from "@/components/ui/RevealOnScroll";
import type { BenefitStory } from "@/lib/marketing/editorial";

type BenefitStoriesProps = {
  stories: readonly BenefitStory[];
  label?: string;
  intro?: string;
  columns?: 2 | 3;
};

export default function BenefitStories({
  stories,
  label,
  intro,
  columns = 2,
}: BenefitStoriesProps) {
  const gridClass =
    columns === 3
      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-10"
      : "grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-14";

  return (
    <section className="relative py-16 md:py-24">
      <div className="site-container site-prose-wide mx-auto">
        {label ? (
          <RevealOnScroll>
            <h2 className="section-label mb-6">{label}</h2>
          </RevealOnScroll>
        ) : null}
        {intro ? (
          <RevealOnScroll delay={0.04}>
            <p className="font-serif text-xl font-light text-white/80 max-w-2xl mb-14 leading-relaxed">
              {intro}
            </p>
          </RevealOnScroll>
        ) : null}

        <div className={gridClass}>
          {stories.map((story, i) => (
            <RevealOnScroll key={story.title} delay={i * 0.04}>
              <article className="border-t border-grey-dark/70 pt-8 h-full">
                <h3 className="font-serif text-lg md:text-xl font-light text-white mb-4">
                  {story.title}
                </h3>
                <p className="font-sans text-sm text-grey leading-relaxed mb-5">
                  {story.body}
                </p>
                {story.feeling ? (
                  <p className="font-serif text-sm italic text-gold/55 leading-relaxed">
                    {story.feeling}
                  </p>
                ) : null}
              </article>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
