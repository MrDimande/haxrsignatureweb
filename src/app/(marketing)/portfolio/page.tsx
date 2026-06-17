import type { Metadata } from "next";
import PageHero, { CTABand } from "@/components/marketing/PageHero";
import EditorialNarrative from "@/components/marketing/EditorialNarrative";
import CaseStudyList from "@/components/marketing/CaseStudyList";
import { caseStudies, portfolioNarrative } from "@/lib/marketing/editorial";
import { marketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = marketingMetadata("portfolio");

export default function PortfolioPage() {
  return (
    <>
      <PageHero
        label="Portfólio"
        headline="Histórias reais — com contexto, desafio, curadoria e memória."
        description="Cada projecto HAXR é contado como merece: não apenas o que se viu, mas o que se sentiu e o que ficou."
      />
      <EditorialNarrative narrative={portfolioNarrative} label="Porque contamos histórias" />
      <section className="relative pb-20 md:pb-28">
        <div className="site-container site-prose-wide mx-auto">
          <CaseStudyList studies={caseStudies} />
        </div>
      </section>
      <CTABand
        headline="A sua história pode ser a próxima."
        secondaryHref="/convites-identidade-visual"
        secondaryLabel="A primeira impressão"
      />
    </>
  );
}
