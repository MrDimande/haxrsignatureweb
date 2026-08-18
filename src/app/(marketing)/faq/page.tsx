import type { Metadata } from "next";
import StructuredData from "@/components/seo/StructuredData";
import PageHero, { CTABand } from "@/components/marketing/PageHero";
import FaqAccordion from "@/components/marketing/FaqAccordion";
import { faqSections } from "@/lib/marketing/faqs";
import { marketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = marketingMetadata("faq");

export default function FaqPage() {
  return (
    <>
      <StructuredData page="faq" />
      <PageHero
        label="Perguntas Frequentes"
        headline="Respostas claras sobre serviços, convites, convidados e plataforma."
        description="Tudo o que precisa de saber antes de iniciar conversa com a equipa HAXR — com a mesma discrição que dedicamos aos nossos eventos."
      />
      <section className="relative pb-20 md:pb-28">
        <div className="site-container mx-auto max-w-4xl">
          <FaqAccordion sections={faqSections} />
        </div>
      </section>
      <CTABand
        headline="Ainda tem dúvidas?"
        description="Fale connosco — respondemos com atenção e sem pressão comercial."
        primaryHref="/contacto"
        primaryLabel="Iniciar conversa"
      />
    </>
  );
}
