import type { Metadata } from "next";
import StructuredData from "@/components/seo/StructuredData";
import PageHero, { CTABand } from "@/components/marketing/PageHero";
import EditorialNarrative from "@/components/marketing/EditorialNarrative";
import BenefitStories from "@/components/marketing/BenefitStories";
import { plataformaNarrative } from "@/lib/marketing/editorial";
import { plataformaBenefits } from "@/lib/marketing/pages";
import { marketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = marketingMetadata("plataforma");

export default function PlataformaEventosPage() {
  return (
    <>
      <StructuredData page="plataforma" />
      <PageHero
        label="Plataforma HAXR"
        headline="Organização integral — a extensão natural da assessoria."
        description="Por detrás de cada evento assinado HAXR existe uma operação própria: eventos, convidados, fornecedores, contratos e documentos. Não é software para vender. É o rigor que permite curadoria de alto padrão."
      />
      <EditorialNarrative narrative={plataformaNarrative} />
      <BenefitStories
        stories={plataformaBenefits}
        label="O que isto significa na prática"
        intro="Cada capacidade existe para uma razão: que nada se perca, que cada decisão tenha contexto e que a equipa conduza com excelência operacional."
        columns={2}
      />
      <CTABand
        headline="A tecnologia trabalha nos bastidores. A experiência brilha à frente."
        description="Este ecossistema acompanha projectos com assessoria HAXR. Fale connosco sobre o seu evento."
        secondaryHref="/gestao-convidados"
        secondaryLabel="A experiência do convidado"
      />
    </>
  );
}
