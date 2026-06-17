import type { Metadata } from "next";
import PageHero, { CTABand } from "@/components/marketing/PageHero";
import EditorialNarrative from "@/components/marketing/EditorialNarrative";
import BenefitStories from "@/components/marketing/BenefitStories";
import FlowSteps from "@/components/marketing/FlowSteps";
import { convidadosNarrative } from "@/lib/marketing/editorial";
import { convidadosBenefits, convidadosFlow } from "@/lib/marketing/pages";
import { marketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = marketingMetadata("convidados");

export default function GestaoConvidadosPage() {
  return (
    <>
      <PageHero
        label="Gestão de Convidados"
        headline="Controlo e clareza — para saber quem vem, quem falta e como cada pessoa será recebida."
        description="Não vendemos listas. Vendemos a tranquilidade de uma operação de convidados conduzida com a mesma precisão da assessoria HAXR."
      />
      <EditorialNarrative narrative={convidadosNarrative} />
      <FlowSteps steps={convidadosFlow} label="O percurso do convidado" />
      <BenefitStories
        stories={convidadosBenefits}
        label="O que ganha"
        intro="Cada etapa foi pensada para que a equipa e os convidados vivam o evento com fluidez — não com incerteza."
        columns={3}
      />
      <CTABand
        headline="Quer esta clareza no seu evento?"
        description="Integramos a gestão de convidados na assessoria ou como dimensão dedicada — conforme a dimensão da celebração."
        secondaryHref="/portfolio"
        secondaryLabel="Ver casos reais"
      />
    </>
  );
}
