import type { Metadata } from "next";
import Link from "next/link";
import PageHero, { CTABand } from "@/components/marketing/PageHero";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { insightsCategories } from "@/lib/marketing/pages";
import { marketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = marketingMetadata("insights");

export default function InsightsPage() {
  return (
    <>
      <PageHero
        label="Insights"
        headline="Reflexões sobre eventos, curadoria e a arte de criar memórias."
        description="Uma biblioteca editorial em construção — para quem acredita que organização e emoção devem caminhar juntas."
      />

      <section className="relative py-16 md:py-24">
        <div className="site-container site-prose-medium mx-auto">
          <RevealOnScroll>
            <p className="font-serif text-xl font-light text-white/75 max-w-2xl mb-14 leading-relaxed">
              Cada artigo nascerá de experiência real — não de fórmulas genéricas.
              Guias para noivos, equipas corporativas e quem valoriza excelência
              operacional.
            </p>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-14">
            {insightsCategories.map((cat, i) => (
              <RevealOnScroll key={cat.title} delay={i * 0.04}>
                <article className="border-t border-grey-dark/70 pt-8 h-full">
                  <h2 className="font-serif text-lg font-light text-white mb-3">
                    {cat.title}
                  </h2>
                  <p className="font-sans text-sm text-grey leading-relaxed mb-4">
                    {cat.desc}
                  </p>
                  <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-grey/40">
                    Em breve
                  </span>
                </article>
              </RevealOnScroll>
            ))}
          </div>

          <RevealOnScroll className="mt-14">
            <Link
              href="/contacto"
              className="font-mono text-[9px] tracking-[0.3em] uppercase text-gold/60 hover:text-gold transition-colors duration-500"
            >
              Tem um tema para sugerir? Inicie uma conversa →
            </Link>
          </RevealOnScroll>
        </div>
      </section>

      <CTABand
        headline="Enquanto a biblioteca cresce, estamos aqui."
        description="Respondemos com discrição a dúvidas sobre assessoria, convites e gestão de convidados."
      />
    </>
  );
}
