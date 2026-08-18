import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import StructuredData from "@/components/seo/StructuredData";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { CTABand } from "@/components/marketing/PageHero";
import {
  getInsightArticle,
  insightArticles,
} from "@/lib/marketing/insights-articles";
import { buildPageMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return insightArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getInsightArticle(slug);
  if (!article) return {};
  return buildPageMetadata({
    path: `/insights/${article.slug}`,
    title: `${article.title} | HAXR Insights`,
    description: article.excerpt,
  });
}

export default async function InsightArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getInsightArticle(slug);
  if (!article) notFound();

  return (
    <>
      <StructuredData articleSlug={slug} />
      <article className="relative pt-28 pb-16 md:pt-36 md:pb-24">
        <div className="site-container mx-auto max-w-3xl">
          <RevealOnScroll>
            <p className="section-label mb-6">{article.category}</p>
            <h1 className="font-serif text-3xl font-light text-brand-text-dark md:text-5xl">
              {article.title}
            </h1>
            <p className="mt-6 font-sans text-sm text-brand-text-dark/70">
              {article.excerpt} · {article.readMinutes} min de leitura
            </p>
          </RevealOnScroll>

          <div className="mt-12 space-y-6 border-t border-brand-champagne/35 pt-10">
            {article.body.map((paragraph) => (
              <RevealOnScroll key={paragraph.slice(0, 24)}>
                <p className="font-sans text-base leading-relaxed text-brand-text-dark/85">
                  {paragraph}
                </p>
              </RevealOnScroll>
            ))}
          </div>

          <RevealOnScroll className="mt-12">
            <Link
              href={article.relatedHref}
              className="font-mono text-[9px] uppercase tracking-[0.28em] text-brand-gold hover:text-brand-gold-light"
            >
              {article.relatedLabel} →
            </Link>
          </RevealOnScroll>
        </div>
      </article>
      <CTABand
        headline="Mais guias gratuitos"
        description="Checklists e modelos em PDF — pedidos por email."
        primaryHref="/guias"
        primaryLabel="Ver guias HAXR"
        secondaryHref="/insights"
        secondaryLabel="Todos os insights"
      />
    </>
  );
}
