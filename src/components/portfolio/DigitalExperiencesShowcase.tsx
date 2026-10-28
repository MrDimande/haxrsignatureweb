import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { demoCatalog } from "@/lib/demos/catalog";

export default function DigitalExperiencesShowcase() {
  const editions = [
    {
      name: "Prólogo",
      tagline: "A essência cerimonial",
      desc: "Anúncio elegante, data, mapas GPS interactivos e RSVP digital intuitivo.",
      badge: "Edição Essencial",
    },
    {
      name: "Elo",
      tagline: "Narrativa e integração",
      desc: "Galeria fotográfica, música ambiente, guia de estilo de convidados e cronograma dinâmico.",
      badge: "Edição Mais Escolhida",
    },
    {
      name: "Legado",
      tagline: "A mais alta-costura digital",
      desc: "Experiência sob medida com capítulos interactivos, Plus Memories e curadoria visual personalizada.",
      badge: "Assinatura Bespoke",
    },
  ];

  const digitalTools = [
    {
      title: "Web-Convites Interactivos",
      description: "Desenhados sob medida para telemóveis com tipografia refinada e animações suaves.",
      href: "/convites-identidade-visual",
    },
    {
      title: "Save the Date Editorial",
      description: "O primeiro anúncio digital com contagem decrescente e orientações de vestuário.",
      href: "/convites-identidade-visual",
    },
    {
      title: "RSVP & Confirmações em Tempo Real",
      description: "Elimina a ansiedade de contagem de listas com confirmações automatizadas.",
      href: "/gestao-convidados",
    },
    {
      title: "Seating Plan & Find Your Seat",
      description: "Os convidados descobrem a sua mesa e lugar directamente no telemóvel à chegada.",
      href: "/gestao-convidados",
    },
    {
      title: "Acolhimento & Check-in VIP com QR Code",
      description: "Recepção rápida e serena sem filas de espera à porta da recepção.",
      href: "/gestao-convidados",
    },
    {
      title: "Plus Memories (Galeria Colaborativa)",
      description: "Registo fotográfico espontâneo recolhido sob o olhar autêntico dos convidados.",
      href: "/plus-memories",
    },
  ];

  return (
    <section className="relative py-20 md:py-32 bg-brand-black text-brand-ivory overflow-hidden">
      {/* Luz ambiente dourada de fundo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 right-0 w-[500px] h-[500px] rounded-full opacity-10"
        style={{
          background: "radial-gradient(circle, rgba(198,166,106,0.6) 0%, transparent 70%)",
        }}
      />

      <div className="site-container mx-auto relative z-10">
        {/* Cabeçalho da Secção */}
        <div className="max-w-3xl mb-14 md:mb-20 space-y-4">
          <RevealOnScroll>
            <p className="font-mono text-[9px] md:text-[10px] tracking-[0.35em] uppercase text-brand-gold">
              Secção 03 · Tecnologia & Hospitalidade
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={0.06}>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-brand-ivory leading-[1.2]">
              Digital Experiences
            </h2>
          </RevealOnScroll>
          <RevealOnScroll delay={0.12}>
            <p className="font-sans text-base md:text-lg text-brand-ivory/80 leading-relaxed font-light">
              A tecnologia como suporte discreto da hospitalidade humana. Experiências digitais que
              eliminam a fricção e encantam os convidados antes e durante a celebração.
            </p>
          </RevealOnScroll>
        </div>

        {/* Vitrina de Demonstrações Reais Interactivas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 mb-16 md:mb-24">
          {demoCatalog.map((demo, idx) => (
            <RevealOnScroll key={demo.id} delay={idx * 0.1}>
              <div className="group relative rounded-2xl md:rounded-3xl border border-brand-gold/25 bg-brand-black-soft/80 p-6 sm:p-8 md:p-10 flex flex-col justify-between hover:border-brand-gold/60 transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <div>
                  <div className="relative aspect-[16/10] rounded-xl overflow-hidden mb-6 bg-brand-black">
                    <Image
                      src={demo.mockupImage}
                      alt={demo.title}
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                    <div className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-brand-black/80 backdrop-blur-md border border-brand-gold/30 font-mono text-[8px] tracking-[0.25em] uppercase text-brand-gold">
                      Demonstração ao Vivo
                    </div>
                  </div>

                  <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-brand-gold mb-2">
                    {demo.format}
                  </p>
                  <h3 className="font-serif text-2xl md:text-3xl font-light text-brand-ivory mb-3">
                    {demo.shortTitle}
                  </h3>
                  <p className="font-sans text-sm text-brand-ivory/75 leading-relaxed font-light mb-6">
                    {demo.editorialNote}
                  </p>
                </div>

                <div className="pt-4 border-t border-brand-gold/20 flex flex-wrap items-center justify-between gap-4">
                  <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-brand-champagne/80">
                    Optimização Mobile-First
                  </span>

                  <Link
                    href={demo.publicPath}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-gold text-brand-black hover:bg-brand-gold-light transition-colors font-mono text-[9px] tracking-[0.25em] uppercase font-medium"
                  >
                    <span>{demo.ctaLabel}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>

        {/* As Três Edições de Web-Convites HAXR */}
        <div className="mb-16 md:mb-24">
          <RevealOnScroll>
            <div className="text-center max-w-xl mx-auto mb-10 md:mb-12">
              <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-brand-gold mb-2">
                Níveis de Personalização
              </p>
              <h3 className="font-serif text-2xl sm:text-3xl font-light text-brand-ivory">
                As Edições HAXR
              </h3>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {editions.map((ed, i) => (
              <RevealOnScroll key={ed.name} delay={i * 0.1}>
                <div className="rounded-2xl border border-brand-gold/20 bg-brand-black-soft/50 p-6 sm:p-8 space-y-4 hover:border-brand-gold/50 transition-colors duration-300">
                  <span className="inline-block px-3 py-1 rounded-full bg-brand-gold/15 border border-brand-gold/30 font-mono text-[8px] tracking-[0.25em] uppercase text-brand-gold">
                    {ed.badge}
                  </span>
                  <h4 className="font-serif text-2xl font-light text-brand-ivory">{ed.name}</h4>
                  <p className="font-mono text-[10px] tracking-[0.15em] text-brand-champagne">
                    {ed.tagline}
                  </p>
                  <p className="font-sans text-xs sm:text-sm text-brand-ivory/70 leading-relaxed font-light">
                    {ed.desc}
                  </p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>

        {/* Grelha de Ferramentas de Hospitalidade Digital */}
        <div>
          <RevealOnScroll>
            <div className="text-center max-w-xl mx-auto mb-10 md:mb-12">
              <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-brand-gold mb-2">
                Arquitectura de Hospitalidade
              </p>
              <h3 className="font-serif text-2xl sm:text-3xl font-light text-brand-ivory">
                Ferramentas de Gestão e Acolhimento
              </h3>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {digitalTools.map((tool, idx) => (
              <RevealOnScroll key={tool.title} delay={idx * 0.05}>
                <Link
                  href={tool.href}
                  className="group block p-6 rounded-xl border border-brand-ivory/10 bg-brand-black-soft/40 hover:border-brand-gold/40 hover:bg-brand-black-soft transition-all duration-300 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="font-serif text-base sm:text-lg font-light text-brand-ivory group-hover:text-brand-gold transition-colors">
                      {tool.title}
                    </h5>
                    <ArrowUpRight className="w-4 h-4 text-brand-gold opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                  <p className="font-sans text-xs text-brand-ivory/70 leading-relaxed font-light">
                    {tool.description}
                  </p>
                </Link>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
