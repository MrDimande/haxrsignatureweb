import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

export default function FourSpecialties() {
  const specialties = [
    {
      num: "01",
      title: "Assessoria, Planeamento & Coordenação de Eventos",
      subtitle: "Organização estratégica e presença invisível nos bastidores",
      desc: "Planeamento integral e parcial, curadoria e selecção rigorosa de fornecedores, cronograma minuto a minuto, logística de montagem e supervisão operacional contínua no grande dia.",
      href: "/assessoria-eventos",
      label: "Conhecer Assessoria",
    },
    {
      num: "02",
      title: "Direcção Criativa & Identidade Cerimonial",
      subtitle: "A harmonia estética entre espaço, luz e papelaria",
      desc: "Conceitos criativos, identidade visual sob medida, styling cenográfico, sinalética de acolhimento, cartões de menu, monogramas de alta joalharia e papelaria editorial impressa.",
      href: "/convites-identidade-visual",
      label: "Explorar Identidade",
    },
    {
      num: "03",
      title: "Convites & Experiências Digitais",
      subtitle: "Web-Convites interactivos concebidos para o telemóvel",
      desc: "Web-Convites de assinatura com RSVP digital, música, narrativa visual em capítulos, mapas com rota directa e contagem decrescente — concebidos com a estética de uma revista de luxo.",
      href: "/convites-identidade-visual",
      label: "Ver Web-Convites",
    },
    {
      num: "04",
      title: "Protocolo, Hospitalidade & Guest Management",
      subtitle: "A arte do acolhimento sereno e sem fricção",
      desc: "Protocolo cerimonial, gestão de listas e confirmações, organização de mesas e seating plan, Find Your Seat móvel, recepção assistida por QR Code e acompanhamento VIP dedicado.",
      href: "/gestao-convidados",
      label: "Conhecer Gestão",
    },
  ];

  return (
    <section className="relative py-20 md:py-32 bg-brand-ivory text-brand-text-dark border-t border-brand-champagne/40">
      <div className="site-container mx-auto">
        <div className="max-w-3xl mb-14 md:mb-20 space-y-3">
          <RevealOnScroll>
            <p className="font-mono text-[9px] md:text-[10px] tracking-[0.35em] uppercase text-brand-gold">
              Secção 04 · Especialidades do Atelier
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={0.06}>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-brand-text-dark leading-[1.2]">
              As Quatro Especialidades
            </h2>
          </RevealOnScroll>
          <RevealOnScroll delay={0.12}>
            <p className="font-sans text-base md:text-lg text-brand-text-dark/75 leading-relaxed font-light">
              Quatro pilares independentes que se complementam harmoniosamente para assegurar que cada detalhe da sua celebração seja vivido com leveza e serenidade.
            </p>
          </RevealOnScroll>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
          {specialties.map((item, idx) => (
            <RevealOnScroll key={item.num} delay={idx * 0.08}>
              <div className="group rounded-2xl md:rounded-3xl border border-brand-champagne/50 bg-white p-7 sm:p-10 flex flex-col justify-between h-full hover:border-brand-gold/60 hover:shadow-[0_20px_50px_rgba(8,7,6,0.06)] transition-all duration-500">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-3xl sm:text-4xl font-light text-brand-gold">
                      {item.num}
                    </span>
                    <span className="w-8 h-[1px] bg-brand-champagne/60 group-hover:w-12 group-hover:bg-brand-gold transition-all duration-500" />
                  </div>

                  <h3 className="font-serif text-xl sm:text-2xl font-light text-brand-text-dark group-hover:text-brand-gold transition-colors leading-snug">
                    {item.title}
                  </h3>

                  <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-brand-gold/90">
                    {item.subtitle}
                  </p>

                  <p className="font-sans text-sm text-brand-text-dark/75 leading-relaxed font-light">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-8">
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-2 font-mono text-[9px] tracking-[0.25em] uppercase text-brand-text-dark group-hover:text-brand-gold transition-colors"
                  >
                    <span>{item.label}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
