import RevealOnScroll from "@/components/ui/RevealOnScroll";
import SplitText from "@/components/ui/SplitText";
import { portfolioCopy } from "@/lib/site-config";

const steps = [
  {
    num: "01",
    title: "Escuta",
    desc: "Compreendemos a essência antes de qualquer decisão. O ponto de partida é sempre a intenção — nunca o formato.",
  },
  {
    num: "02",
    title: "Curadoria",
    desc: "Seleccionamos fornecedores, espaços e referências com critério absoluto. Nada entra por conveniência.",
  },
  {
    num: "03",
    title: "Direcção",
    desc: "Assumimos a visão estética e narrativa. Cada elemento responde a uma decisão consciente de identidade.",
  },
  {
    num: "04",
    title: "Gestão integral",
    desc: "Negociação, orçamento, logística e coordenação — tudo sob um único controlo. Sem fragmentação.",
  },
  {
    num: "05",
    title: "Execução",
    desc: "Operação cirúrgica. Cada variável monitorizada. Cada detalhe no lugar exacto, no momento exacto.",
  },
  {
    num: "06",
    title: "Presença invisível",
    desc: "O cliente entra na experiência. A complexidade permanece fora do seu campo de visão.",
  },
];

export default function Method() {
  const { metodo } = portfolioCopy;

  return (
    <section id="metodo" className="relative pt-20 pb-12 md:pt-28 md:pb-16">
      <div className="site-container site-prose-wide mx-auto">
        <RevealOnScroll>
          <h2 className="section-label mb-12">Método</h2>
        </RevealOnScroll>

        <SplitText
          as="h3"
          className="font-serif text-2xl md:text-3xl font-light leading-relaxed text-white/90 mb-8"
        >
          {metodo.headline}
        </SplitText>

        <RevealOnScroll delay={0.08}>
          <p className="font-sans text-sm text-grey leading-relaxed mb-6">
            {metodo.intro}
          </p>
        </RevealOnScroll>

        <RevealOnScroll delay={0.12}>
          <p className="font-sans text-sm text-grey leading-relaxed mb-16">
            {metodo.body}
          </p>
        </RevealOnScroll>

        <div className="relative">
          <div className="absolute left-[7px] top-4 bottom-4 w-px bg-gold-dim" />

          <div className="space-y-14">
            {steps.map((step, i) => (
              <RevealOnScroll key={step.num} delay={i * 0.06}>
                <div className="relative pl-12">
                  <div className="absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full border border-gold-dim bg-black flex items-center justify-center">
                    <div className="w-[5px] h-[5px] rounded-full bg-gold/40" />
                  </div>
                  <p className="font-mono text-gold text-[10px] tracking-[0.4em] mb-2">
                    {step.num}
                  </p>
                  <h3 className="font-serif text-lg md:text-xl font-light tracking-wide text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="font-sans text-xs text-grey leading-relaxed max-w-md">
                    {step.desc}
                  </p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>

        <RevealOnScroll className="mt-16 md:mt-20">
          <div className="line-gold" />
        </RevealOnScroll>
      </div>
    </section>
  );
}
