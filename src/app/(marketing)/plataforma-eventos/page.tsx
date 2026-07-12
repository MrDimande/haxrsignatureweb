import type { Metadata } from "next";
import StructuredData from "@/components/seo/StructuredData";
import PageHero from "@/components/marketing/PageHero";
import HomeConciergeSection from "@/components/home/HomeConciergeSection";
import { marketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = marketingMetadata("plataforma");

export default function PlataformaEventosPage() {
  return (
    <>
      <StructuredData page="plataforma" />

      {/* Dedicated Page Hero */}
      <PageHero
        label="HAXR Concierge & Tecnologia"
        headline="O vosso assistente inteligente de casamentos."
        description="Encaminhe propostas de fornecedores, comprovativos de pagamento ou listas de convidados por email ou WhatsApp. O HAXR Concierge lê, classifica e atualiza tudo automaticamente nas vossas ferramentas."
      />

      {/* Complete HAXR Concierge Showcase & Flow */}
      <HomeConciergeSection />
    </>
  );
}
