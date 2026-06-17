import RevealOnScroll from "@/components/ui/RevealOnScroll";

type FlowStepsProps = {
  steps: readonly string[];
  label?: string;
};

export default function FlowSteps({
  steps,
  label = "O percurso",
}: FlowStepsProps) {
  return (
    <section className="relative py-16 md:py-20 bg-black-soft">
      <div className="site-container site-prose-medium mx-auto">
        <RevealOnScroll>
          <h2 className="section-label mb-12 text-center">{label}</h2>
        </RevealOnScroll>

        <div className="flex flex-col md:flex-row md:flex-wrap md:justify-center items-center gap-4 md:gap-2">
          {steps.map((step, i) => (
            <RevealOnScroll key={step} delay={i * 0.05}>
              <div className="flex items-center gap-2 md:gap-3">
                <span className="inline-flex items-center justify-center min-w-[140px] px-5 py-3 border border-grey-dark font-mono text-[9px] tracking-[0.25em] uppercase text-white/75">
                  {step}
                </span>
                {i < steps.length - 1 ? (
                  <span
                    className="hidden md:inline font-mono text-gold/40 text-lg"
                    aria-hidden
                  >
                    ↓
                  </span>
                ) : null}
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
