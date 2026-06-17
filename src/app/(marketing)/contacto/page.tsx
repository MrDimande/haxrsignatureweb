import type { Metadata } from "next";
import Contact from "@/components/sections/Contact";
import PageHero from "@/components/marketing/PageHero";
import EditorialNarrative from "@/components/marketing/EditorialNarrative";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { contactoNarrative } from "@/lib/marketing/editorial";
import { marketingMetadata } from "@/lib/marketing/seo";
import { siteContact, siteConfig } from "@/lib/site-config";

export const metadata: Metadata = marketingMetadata("contacto");

export default function ContactoPage() {
  return (
    <>
      <PageHero
        label="Contacto"
        headline="Estamos prontos para ouvir a sua história."
        description="Cada evento começa com uma conversa. Partilhe a sua visão — por WhatsApp, email ou presencialmente no nosso escritório em Maputo."
      />
      <EditorialNarrative narrative={contactoNarrative} label="O primeiro passo" />

      <section className="relative py-12 md:py-16 border-b border-grey-dark/60">
        <div className="site-container site-prose-medium mx-auto">
          <RevealOnScroll>
            <p className="font-serif text-lg font-light text-white/75 text-center mb-12 max-w-xl mx-auto">
              Escolha o canal que lhe for mais natural. Cada pedido é lido com
              atenção e respondido com discrição.
            </p>
          </RevealOnScroll>
          <RevealOnScroll>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <a
                href={siteContact.whatsapp.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block border border-grey-dark p-8 hover:border-gold/30 transition-colors duration-500"
              >
                <p className="font-mono text-[9px] tracking-[0.35em] uppercase text-gold/55 mb-3">
                  WhatsApp
                </p>
                <p className="font-sans text-sm text-white/80">
                  {siteContact.whatsapp.display}
                </p>
                <p className="font-sans text-xs text-grey/60 mt-2">
                  Para conversas mais directas e pessoais.
                </p>
              </a>
              <a
                href={`mailto:${siteContact.email}`}
                className="block border border-grey-dark p-8 hover:border-gold/30 transition-colors duration-500"
              >
                <p className="font-mono text-[9px] tracking-[0.35em] uppercase text-gold/55 mb-3">
                  Email
                </p>
                <p className="font-sans text-sm text-white/80">{siteContact.email}</p>
                <p className="font-sans text-xs text-grey/60 mt-2">
                  Para partilhar referências, datas e visão com calma.
                </p>
              </a>
              <a
                href={siteContact.mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="block border border-grey-dark p-8 hover:border-gold/30 transition-colors duration-500"
              >
                <p className="font-mono text-[9px] tracking-[0.35em] uppercase text-gold/55 mb-3">
                  Escritório
                </p>
                <p className="font-sans text-sm text-white/80">
                  {siteContact.shortLocation}
                </p>
                <p className="font-sans text-xs text-grey/60 mt-2 line-clamp-2">
                  {siteContact.location}
                </p>
              </a>
            </div>
          </RevealOnScroll>

          <RevealOnScroll className="mt-12 text-center">
            <a
              href={siteConfig.contact.whatsappProposalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-3 font-mono text-[10px] tracking-[0.3em] uppercase text-black bg-gold hover:bg-gold/90 transition-colors duration-500"
            >
              Iniciar conversa por WhatsApp
            </a>
          </RevealOnScroll>
        </div>
      </section>

      <Contact />
    </>
  );
}
