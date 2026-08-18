import type { Metadata } from "next";
import StructuredData from "@/components/seo/StructuredData";
import PageHero, { CTABand } from "@/components/marketing/PageHero";
import FerramentasHubGrid from "@/components/marketing/FerramentasHubGrid";
import { ferramentasCatalog, ferramentasHubCopy } from "@/lib/marketing/ferramentas";
import { marketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = marketingMetadata("ferramentas");

export default function FerramentasPage() {
  return (
    <>
      <StructuredData page="ferramentas" />
      <PageHero
        label={ferramentasHubCopy.label}
        headline={ferramentasHubCopy.headline}
        description={ferramentasHubCopy.description}
      />
      <section className="relative pb-20 md:pb-28">
        <div className="site-container-wide mx-auto">
          <FerramentasHubGrid items={ferramentasCatalog} />
        </div>
      </section>
      <CTABand
        headline="Não sabe por onde começar?"
        description="O Style Quiz recomenda estilo e pacote. O onboarding cria o vosso evento em minutos."
        primaryHref="/style-quiz"
        primaryLabel="Fazer Style Quiz"
        secondaryHref="/onboarding"
        secondaryLabel="Começar onboarding"
      />
    </>
  );
}
