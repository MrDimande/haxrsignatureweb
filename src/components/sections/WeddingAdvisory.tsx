"use client";

import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { ShieldCheck, Calendar, Users, HelpCircle, Crown, Clock } from "lucide-react";

const advisoryPillars = [
  {
    icon: Crown,
    title: "Assessoria Completa",
    desc: "Acompanhamento integral desde o primeiro dia: da definição do conceito criativo à contratação de fornecedores e coordenação final.",
  },
  {
    icon: Calendar,
    title: "Assessoria Parcial",
    desc: "Apoio direcionado para casais que já iniciaram o planeamento, mas pretendem suporte especializado para consolidar e validar as etapas seguintes.",
  },
  {
    icon: Clock,
    title: "Planeamento",
    desc: "Gestão estratégica de orçamentos, mapeamento rigoroso de prazos, reuniões periódicas e elaboração de cronogramas minuciosos.",
  },
  {
    icon: Users,
    title: "Coordenação no grande dia",
    desc: "Supervisão operacional completa de montagem, alinhamento de fornecedores, recepção dos convidados e gestão do protocolo cerimonial.",
  },
  {
    icon: ShieldCheck,
    title: "Gestão de fornecedores",
    desc: "Criação de ligações e gestão de contratos com os melhores parceiros do mercado (catering, decoração, som, luz e foto) com total isenção.",
  },
  {
    icon: HelpCircle,
    title: "Segurança operacional",
    desc: "Resolução discreta de imprevistos em tempo real nos bastidores, garantindo que o casal vive a experiência sem qualquer preocupação.",
  },
];

export default function WeddingAdvisory() {
  return (
    <section id="assessoria" className="relative py-24 md:py-32 bg-brand-champagne/15 border-y border-brand-champagne/30">
      <div className="site-container-wide mx-auto">
        <div className="max-w-3xl mb-16 md:mb-20">
          <RevealOnScroll>
            <h2 className="section-label mb-6">Assessoria</h2>
          </RevealOnScroll>
          <RevealOnScroll delay={0.05}>
            <p className="font-serif text-2xl md:text-3xl lg:text-4xl font-light text-brand-text-dark leading-relaxed mb-6">
              Planeamos, organizamos e coordenamos para que vocês vivam o que realmente importa.
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={0.1}>
            <p className="font-sans text-sm text-brand-text-dark/75 leading-relaxed font-light">
              Oferecemos uma estrutura de suporte completa e profissional em Maputo, pensada para assegurar que cada detalhe operacional e estético decorra com absoluta tranquilidade, rigor e elegância.
            </p>
          </RevealOnScroll>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {advisoryPillars.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <RevealOnScroll key={pillar.title} delay={i * 0.05}>
                <article className="h-full bg-white/60 backdrop-blur-sm border border-brand-champagne/45 p-8 rounded-2xl hover:border-brand-gold/60 hover:shadow-[0_12px_40px_rgba(184,138,42,0.04)] transition-all duration-500 flex flex-col gap-6 text-left">
                  <div className="w-10 h-10 rounded-full border border-brand-gold/25 flex items-center justify-center bg-brand-champagne/10 shrink-0">
                    <Icon className="w-5 h-5 text-brand-gold stroke-[1.25]" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg md:text-xl font-light text-brand-text-dark mb-3">
                      {pillar.title}
                    </h3>
                    <p className="font-sans text-xs md:text-sm text-brand-text-dark/70 leading-relaxed font-light">
                      {pillar.desc}
                    </p>
                  </div>
                </article>
              </RevealOnScroll>
            );
          })}
        </div>

        <RevealOnScroll className="text-center" delay={0.1}>
          <a
            href="/contacto?tipo=assessoria"
            className="btn-editorial btn-editorial--solid inline-flex"
          >
            Agendar conversa
          </a>
        </RevealOnScroll>
      </div>
    </section>
  );
}
