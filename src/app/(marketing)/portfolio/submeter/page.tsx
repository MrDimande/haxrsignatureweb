import type { Metadata } from "next";
import StructuredData from "@/components/seo/StructuredData";
import PageHero, { CTABand } from "@/components/marketing/PageHero";
import SubmitWeddingForm from "@/components/marketing/SubmitWeddingForm";
import { marketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = marketingMetadata("submitWedding");

export default function SubmitWeddingPage() {
  return (
    <>
      <StructuredData page="submitWedding" />
      <PageHero
        label="Submeter Casamento"
        headline="A vossa história pode inspirar o próximo casal."
        description="Clientes e casais podem candidatar-se à curadoria editorial HAXR. Cada submissão é analisada pela equipa antes de publicação."
      />
      <section className="relative pb-20 md:pb-28">
        <div className="site-container mx-auto max-w-3xl rounded-2xl border border-brand-champagne/35 bg-white/80 p-6 md:p-10 shadow-[0_24px_60px_rgba(8,7,6,0.06)]">
          <SubmitWeddingForm />
        </div>
      </section>
      <CTABand
        headline="Ainda não é cliente?"
        description="Comece por uma conversa — assessoria, convites e plataforma numa só assinatura."
        primaryHref="/contacto?tipo=casamento"
        primaryLabel="Pedir proposta"
      />
    </>
  );
}
