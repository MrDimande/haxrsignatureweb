import RevealOnScroll from "@/components/ui/RevealOnScroll";

export default function IntegralExperienceTimeline() {
  const steps = [
    {
      num: "01",
      name: "Concepção",
      desc: "Escuta atenta das prioridades, estilo e visão do casal.",
    },
    {
      num: "02",
      name: "Planeamento",
      desc: "Curadoria de fornecedores, orçamento e cronograma director.",
    },
    {
      num: "03",
      name: "Identidade",
      desc: "Direcção de arte, monogramas e linguagem visual exclusiva.",
    },
    {
      num: "04",
      name: "Convites",
      desc: "Web-Convite de alta-costura partilhado no telemóvel.",
    },
    {
      num: "05",
      name: "Confirmações",
      desc: "RSVP automatizado e gestão transparente de listas.",
    },
    {
      num: "06",
      name: "Protocolo",
      desc: "Organização de mesas, lugares e recepção cerimonial.",
    },
    {
      num: "07",
      name: "Coordenação",
      desc: "Presença invisível e controlo minucioso nos bastidores.",
    },
    {
      num: "08",
      name: "Experiência Final",
      desc: "Uma celebração vivida com serenidade e memórias eternas.",
    },
  ];

  return (
    <section className="relative py-20 md:py-32 bg-brand-black text-brand-ivory overflow-hidden">
      <div className="site-container mx-auto">
        {/* Cabeçalho */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24 space-y-4">
          <RevealOnScroll>
            <p className="font-mono text-[9px] md:text-[10px] tracking-[0.35em] uppercase text-brand-gold">
              Secção 05 · A Jornada Cerimonial
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={0.06}>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-brand-ivory leading-[1.2]">
              Uma visão. Uma equipa coordenada.{" "}
              <span className="italic text-brand-gold">Uma assinatura.</span>
            </h2>
          </RevealOnScroll>
          <RevealOnScroll delay={0.12}>
            <p className="font-sans text-base text-brand-ivory/80 leading-relaxed font-light">
              Do primeiro rascunho conceptual ao brinde final, a harmonia dos nossos serviços assegura
              uma narrativa contínua sem quebras de estilo nem sobreposição de equipas.
            </p>
          </RevealOnScroll>
        </div>

        {/* Linha Temporal Editorial */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {steps.map((st, idx) => (
            <RevealOnScroll key={st.num} delay={idx * 0.05}>
              <div className="relative rounded-2xl border border-brand-gold/15 bg-brand-black-soft/50 p-6 space-y-3 hover:border-brand-gold/40 transition-colors duration-300">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-brand-gold text-[11px] font-semibold tracking-wider">
                    {st.num}
                  </span>
                  <span className="text-brand-ivory/20 text-[9px] tracking-widest uppercase">
                    Etapa
                  </span>
                </div>
                <h3 className="font-serif text-xl font-light text-brand-ivory">{st.name}</h3>
                <p className="font-sans text-xs sm:text-sm text-brand-ivory/70 leading-relaxed font-light">
                  {st.desc}
                </p>
              </div>
            </RevealOnScroll>
          ))}
        </div>

        {/* Nota de Flexibilidade Contratual */}
        <div className="mt-12 text-center">
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-brand-champagne/60 max-w-xl mx-auto">
            Cada cliente selecciona a amplitude exacta dos serviços necessários — desde a criação
            exclusiva de Web-Convites até à assessoria e coordenação global.
          </p>
        </div>
      </div>
    </section>
  );
}
