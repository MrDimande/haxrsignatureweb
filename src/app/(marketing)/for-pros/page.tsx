import type { Metadata } from "next";
import StructuredData from "@/components/seo/StructuredData";
import PageHero, { CTABand } from "@/components/marketing/PageHero";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import Link from "next/link";
import { marketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = marketingMetadata("forPros");

const benefits = [
  "Perfil na rede curada HAXR em Maputo",
  "Referência em propostas e eventos assinados",
  "Acesso a clientes premium qualificados",
  "Sem marketplace aberto — curadoria humana",
];

export default function ForProsPage() {
  return (
    <>
      <StructuredData page="forPros" />
      <PageHero
        label="Para Profissionais"
        headline="Rede de confiança HAXR — não um marketplace genérico."
        description="Floristas, fotógrafos, espaços e fornecedores seleccionados trabalham connosco em eventos premium. Qualidade acima de volume."
      />
      <section className="relative py-16 md:py-24">
        <div className="site-container mx-auto max-w-3xl">
          <ul className="space-y-4">
            {benefits.map((benefit, index) => (
              <RevealOnScroll key={benefit} delay={index * 0.04}>
                <li className="border-t border-brand-champagne/35 pt-4 font-serif text-lg font-light text-brand-text-dark">
                  {benefit}
                </li>
              </RevealOnScroll>
            ))}
          </ul>
          <RevealOnScroll className="mt-10">
            <Link
              href="/contacto?intent=fornecedor"
              className="btn-editorial btn-editorial--solid inline-flex px-8 py-3.5"
            >
              Candidatar fornecedor
            </Link>
          </RevealOnScroll>
        </div>
      </section>
      <CTABand
        headline="Já trabalha connosco?"
        description="Actualize o vosso perfil ou partilhe novo portfólio com a equipa."
        primaryHref="/contacto?intent=fornecedor"
        primaryLabel="Falar com a equipa"
      />
    </>
  );
}
