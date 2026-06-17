import type { Metadata } from "next";
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
      <PageHero
        label="Ecossistema Operacional"
        headline="Tecnologia invisível que sustenta a excelência HAXR."
        description="Por detrás de cada evento assinado HAXR existe um ecossistema próprio — rigor nos bastidores, elegância à frente. Não é software para vender. É a memória e a precisão que permitem curadoria de alto padrão."
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
