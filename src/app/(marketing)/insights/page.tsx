import type { Metadata } from "next";
import Link from "next/link";
import StructuredData from "@/components/seo/StructuredData";
import PageHero, { CTABand } from "@/components/marketing/PageHero";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { insightArticles } from "@/lib/marketing/insights-articles";
import { marketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = marketingMetadata("insights");

export default function InsightsPage() {
  return (
    <>
      <StructuredData page="insights" />
      <PageHero
        label="Insights"
        headline="Reflexões sobre eventos, curadoria e a arte de criar memórias."
        description="Guias editoriais para noivos e equipas que valorizam excelência operacional em Maputo."
      />

      <section className="relative py-16 md:py-24">
        <div className="site-container site-prose-medium mx-auto">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-12">
            {insightArticles.map((article, i) => (
              <RevealOnScroll key={article.slug} delay={i * 0.04}>
                <article className="h-full border-t border-grey-dark/70 pt-8">
                  <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-gold/55 mb-3">
                    {article.category} · {article.readMinutes} min
                  </p>
                  <h2 className="font-serif text-xl font-light text-white mb-3">
                    {article.title}
                  </h2>
                  <p className="font-sans text-sm text-grey leading-relaxed mb-5">
                    {article.excerpt}
                  </p>
                  <Link
                    href={`/insights/${article.slug}`}
                    className="font-mono text-[9px] tracking-[0.28em] uppercase text-gold/70 hover:text-gold"
                  >
                    Ler artigo →
                  </Link>
                </article>
              </RevealOnScroll>
            ))}
          </div>

          <RevealOnScroll className="mt-14 flex flex-wrap gap-6">
            <Link
              href="/guias"
              className="font-mono text-[9px] tracking-[0.3em] uppercase text-gold/60 hover:text-gold"
            >
              Guias gratuitos em PDF →
            </Link>
            <Link
              href="/faq"
              className="font-mono text-[9px] tracking-[0.3em] uppercase text-gold/60 hover:text-gold"
            >
              Perguntas frequentes →
            </Link>
          </RevealOnScroll>
        </div>
      </section>

      <CTABand
        headline="Quer acompanhamento completo?"
        description="Da inspiração à operação — assessoria, convites e plataforma numa só assinatura."
        primaryHref="/contacto"
        primaryLabel="Pedir proposta"
      />
    </>
  );
}
