import RevealOnScroll from "@/components/ui/RevealOnScroll";
import SplitText from "@/components/ui/SplitText";
import { portfolioCopy } from "@/lib/site-config";

const categories = [
  {
    num: "01",
    title: "Privado",
    desc: "Encontros reservados, com curadoria absoluta e discrição como princípio.",
  },
  {
    num: "02",
    title: "Social de alto perfil",
    desc: "Presença pública com controlo editorial — estética, narrativa e execução alinhadas à identidade de quem convida.",
  },
  {
    num: "03",
    title: "Corporativo estratégico",
    desc: "Experiências que comunicam posicionamento com precisão institucional e linguagem contemporânea.",
  },
];

export default function Experiences() {
  const { experiencias } = portfolioCopy;

  return (
    <section id="experiencias" className="relative pt-10 pb-12 md:pt-14 md:pb-16">
      <div className="site-container site-prose-medium mx-auto">
        <RevealOnScroll>
          <h2 className="section-label mb-8">{experiencias.label}</h2>
        </RevealOnScroll>

        <SplitText
          as="h3"
          className="font-serif text-2xl md:text-3xl font-light leading-relaxed text-white/90 mb-8 max-w-2xl"
        >
          {experiencias.headline}
        </SplitText>

        <div className="space-y-6 mb-20 max-w-2xl">
          {experiencias.paragraphs.map((paragraph, i) => (
            <RevealOnScroll key={paragraph} delay={i * 0.05}>
              <p className="font-sans text-sm text-grey leading-relaxed">
                {paragraph}
              </p>
            </RevealOnScroll>
          ))}
        </div>

        <RevealOnScroll>
          <p className="font-mono text-[9px] tracking-[0.5em] uppercase text-grey mb-12">
            Perfis de experiência
          </p>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {categories.map((cat, i) => (
            <RevealOnScroll key={cat.num} delay={i * 0.1}>
              <div
                className={`relative py-10 md:py-0 md:px-10 ${
                  i < categories.length - 1
                    ? "border-b md:border-b-0 md:border-r border-grey-dark"
                    : ""
                } ${i === 0 ? "md:pl-0" : ""} ${i === categories.length - 1 ? "md:pr-0" : ""}`}
              >
                <p className="font-mono text-gold text-xs tracking-[0.3em] mb-6">
                  {cat.num}
                </p>
                <h3 className="font-serif text-xl md:text-2xl font-light tracking-wide text-white mb-5">
                  {cat.title}
                </h3>
                <p className="font-sans text-sm text-grey leading-relaxed">
                  {cat.desc}
                </p>
              </div>
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
