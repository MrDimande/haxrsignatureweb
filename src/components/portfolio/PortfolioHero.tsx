import Image from "next/image";
import Link from "next/link";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import HaxrLogo from "@/components/brand/HaxrLogo";
import { ArrowDown } from "lucide-react";

export default function PortfolioHero() {
  return (
    <section className="relative overflow-hidden bg-brand-black text-brand-ivory pt-28 pb-20 md:pt-40 md:pb-32">
      {/* Texture de iluminação muito suave em ouro champanhe */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 50% 20%, rgba(198, 166, 106, 0.15), transparent 75%)",
        }}
      />

      <div className="site-container mx-auto relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
          {/* Badge Editorial */}
          <RevealOnScroll>
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-brand-gold/30 bg-brand-black/60 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse" />
              <span className="font-mono text-[9px] md:text-[10px] tracking-[0.35em] uppercase text-brand-gold">
                The Signature Collection
              </span>
            </div>
          </RevealOnScroll>

          {/* Título Principal de Alta-Costura */}
          <RevealOnScroll delay={0.06}>
            <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-tight text-brand-ivory leading-[1.12]">
              Uma colecção de experiências{" "}
              <span className="italic font-normal text-brand-gold">com assinatura.</span>
            </h1>
          </RevealOnScroll>

          {/* Texto de Apoio Editorial */}
          <RevealOnScroll delay={0.12}>
            <p className="font-sans text-base sm:text-lg md:text-xl text-brand-ivory/80 max-w-2xl mx-auto leading-relaxed font-light">
              Cada celebração conta uma história. Cada detalhe traduz uma intenção.
              Descubra experiências concebidas com sensibilidade, rigor e a assinatura HAXR.
            </p>
          </RevealOnScroll>

          {/* Acção Discreta: Explorar a Colecção */}
          <RevealOnScroll delay={0.18}>
            <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#historias-de-assinatura"
                className="group inline-flex items-center gap-3 px-8 py-3.5 rounded-full border border-brand-gold/50 bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-black transition-all duration-500 font-mono text-[10px] tracking-[0.25em] uppercase text-brand-champagne shadow-[0_4px_24px_rgba(184,138,42,0.15)]"
              >
                <span>Explorar a Colecção</span>
                <ArrowDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform duration-300" />
              </a>

              <Link
                href="/portfolio/submeter"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-brand-ivory/15 hover:border-brand-ivory/40 transition-colors duration-300 font-mono text-[10px] tracking-[0.25em] uppercase text-brand-ivory/70 hover:text-brand-ivory"
              >
                <span>Submeter Casamento</span>
              </Link>
            </div>
          </RevealOnScroll>
        </div>

        {/* Quadro Fotográfico Cinematográfico de Entrada */}
        <RevealOnScroll delay={0.24}>
          <div className="mt-14 md:mt-20 relative rounded-2xl md:rounded-3xl overflow-hidden border border-brand-gold/25 shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
            <div className="relative aspect-[16/9] md:aspect-[21/9] w-full bg-brand-black-soft">
              <Image
                src="/images/casamento-vania-fabiao-evelyn-eventos.webp"
                alt="HAXR Signature The Signature Collection — Capa Editorial"
                fill
                priority
                className="object-cover object-center brightness-[0.88] contrast-[1.04]"
                sizes="(max-width: 1200px) 100vw, 1200px"
              />

              {/* Degradê subtil nos cantos */}
              <div className="absolute inset-0 bg-gradient-to-t from-brand-black/80 via-transparent to-brand-black/30 pointer-events-none" />

              {/* Monograma Oficial HAXR Dark Gold Seal */}
              <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 flex items-center gap-3.5 px-4 py-2.5 rounded-full bg-brand-black/75 backdrop-blur-md border border-brand-gold/30">
                <HaxrLogo variant="mark" tone="gold" size="sm" link={false} />
                <div className="text-left font-mono">
                  <p className="text-[8px] tracking-[0.3em] uppercase text-brand-gold">HAXR Signature</p>
                  <p className="text-[9px] tracking-[0.15em] text-brand-ivory/90">Atelier Cerimonial</p>
                </div>
              </div>

              {/* Etiqueta de Localização */}
              <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 hidden sm:flex items-center gap-2 text-brand-ivory/80 font-mono text-[9px] tracking-[0.25em] uppercase">
                <span className="w-2 h-0.5 bg-brand-gold" />
                <span>Maputo · Moçambique</span>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
