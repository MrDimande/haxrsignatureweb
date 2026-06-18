import type { Metadata } from "next";
import StructuredData from "@/components/seo/StructuredData";
import PageHero, { CTABand } from "@/components/marketing/PageHero";
import EditorialNarrative from "@/components/marketing/EditorialNarrative";
import PhaseTimeline from "@/components/marketing/PhaseTimeline";
import { assessoriaNarrative } from "@/lib/marketing/editorial";
import { assessoriaPhases } from "@/lib/marketing/pages";
import { marketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = marketingMetadata("assessoria");

export default function AssessoriaEventosPage() {
  return (
    <>
      <StructuredData page="assessoria" />
      <PageHero
        label="Assessoria de Eventos"
        headline="Direcção estratégica e operacional — para que alguém cuide de tudo por si."
        description="A assessoria HAXR não é organização genérica. É presença, método e discrição — para que entre na experiência do seu evento, não na logística que a sustenta."
      />
      <EditorialNarrative narrative={assessoriaNarrative} />
      <PhaseTimeline phases={assessoriaPhases} label="Como conduzimos" />
      <CTABand
        headline="Existe alguém a cuidar de tudo por si?"
        description="Conte-nos a história do seu evento. Avaliamos juntos o nível de acompanhamento que procura."
        secondaryHref="/portfolio"
        secondaryLabel="Ver histórias reais"
      />
    </>
  );
}
