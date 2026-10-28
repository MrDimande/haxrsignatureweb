import Link from "next/link";
import { MessageCircle, ArrowUpRight, Calendar } from "lucide-react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

export default function PortfolioCTA() {
  const whatsappUrl = `https://wa.me/258849000000?text=${encodeURIComponent(
    "Olá HAXR Signature. Gostaria de conversar sobre a curadoria e assessoria para o meu evento."
  )}`;

  return (
    <section className="relative py-20 md:py-32 bg-brand-ivory text-brand-text-dark border-t border-brand-champagne/40">
      <div className="site-container mx-auto">
        <div className="rounded-2xl md:rounded-3xl border border-brand-gold/30 bg-gradient-to-b from-white to-brand-champagne/15 p-8 sm:p-14 md:p-20 text-center max-w-4xl mx-auto shadow-[0_24px_70px_rgba(8,7,6,0.06)] space-y-8">
          <RevealOnScroll>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-gold/30 bg-white/80 font-mono text-[9px] tracking-[0.3em] uppercase text-brand-gold">
              Inicie o Seu Projecto
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={0.06}>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-brand-text-dark leading-[1.18]">
              A sua história merece uma{" "}
              <span className="italic text-brand-gold">assinatura própria.</span>
            </h2>
          </RevealOnScroll>

          <RevealOnScroll delay={0.12}>
            <p className="font-sans text-base sm:text-lg text-brand-text-dark/80 max-w-2xl mx-auto leading-relaxed font-light">
              Partilhe connosco a visão da sua celebração. A HAXR Signature transforma cada conversa
              num ponto de partida para uma experiência concebida à sua medida.
            </p>
          </RevealOnScroll>

          <RevealOnScroll delay={0.18}>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/contacto"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-brand-black text-brand-ivory hover:bg-brand-gold hover:text-brand-black transition-all duration-300 font-mono text-[10px] tracking-[0.25em] uppercase font-medium shadow-md"
              >
                <Calendar className="w-4 h-4" />
                <span>Agendar uma conversa</span>
              </Link>

              <Link
                href="/contacto?tipo=casamento"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full border border-brand-gold/50 bg-white hover:bg-brand-gold/10 transition-colors font-mono text-[10px] tracking-[0.25em] uppercase text-brand-text-dark font-medium"
              >
                <span>Solicitar Proposta</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full border border-brand-champagne/80 hover:border-brand-gold transition-colors font-mono text-[10px] tracking-[0.25em] uppercase text-brand-text-dark/80 hover:text-brand-gold font-medium"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Conversar no WhatsApp</span>
              </a>
            </div>
          </RevealOnScroll>

          <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-brand-text-dark/50 pt-2">
            Atendimento com discrição e resposta cuidada em 24 a 48 horas úteis
          </p>
        </div>
      </div>
    </section>
  );
}
