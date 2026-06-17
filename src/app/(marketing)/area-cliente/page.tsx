import type { Metadata } from "next";
import Link from "next/link";
import PageHero, { CTABand } from "@/components/marketing/PageHero";
import EditorialNarrative from "@/components/marketing/EditorialNarrative";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { areaClienteNarrative } from "@/lib/marketing/editorial";
import { areaClienteFuture } from "@/lib/marketing/pages";
import { marketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = marketingMetadata("areaCliente");

export default function AreaClientePage() {
  return (
    <>
      <PageHero
        label="Área do Cliente"
        headline="O seu evento, acompanhado com a mesma atenção — hoje e amanhã."
        description="A HAXR está a construir um ecossistema onde clientes acompanham cronograma, documentos e decisões com a clareza que cada projecto merece. A tecnologia existe para servir a relação — não para substituí-la."
      />
      <EditorialNarrative narrative={areaClienteNarrative} />

      <section className="relative py-16 md:py-24 bg-black-soft">
        <div className="site-container site-prose-medium mx-auto text-center">
          <RevealOnScroll>
            <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-gold/50 mb-8">
              O que virá
            </p>
          </RevealOnScroll>

          <ul className="space-y-5 mb-12 max-w-md mx-auto">
            {areaClienteFuture.map((item, i) => (
              <RevealOnScroll key={item} delay={i * 0.05}>
                <li className="font-serif text-lg font-light text-white/80 border-b border-grey-dark/40 pb-5">
                  {item}
                </li>
              </RevealOnScroll>
            ))}
          </ul>

          <RevealOnScroll>
            <p className="font-sans text-sm text-grey leading-relaxed max-w-md mx-auto mb-8">
              Clientes activos continuam a ser acompanhados pela equipa HAXR —
              com proximidade, discrição e excelência. O portal será a extensão
              natural dessa relação.
            </p>
            <Link
              href="/contacto"
              className="inline-flex items-center justify-center px-8 py-3 font-mono text-[10px] tracking-[0.3em] uppercase text-gold/70 border border-gold-dim hover:text-gold hover:border-gold/40 transition-colors duration-500"
            >
              Falar com a equipa
            </Link>
          </RevealOnScroll>
        </div>
      </section>

      <CTABand
        headline="Já é cliente HAXR?"
        description="O acompanhamento continua próximo e personalizado — enquanto preparamos o próximo capítulo."
        primaryLabel="Iniciar conversa"
      />
    </>
  );
}
