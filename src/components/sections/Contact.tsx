"use client";

import { Suspense } from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import SplitText from "@/components/ui/SplitText";
import QuoteRequestForm from "@/components/marketing/forms/QuoteRequestForm";
import SupplierJoinForm from "@/components/marketing/forms/SupplierJoinForm";
import { portfolioCopy } from "@/lib/site-config";
import ContactDirectChannels from "@/components/sections/ContactDirectChannels";
import { useSearchParams } from "next/navigation";

function ContactFormRouter() {
  const searchParams = useSearchParams();
  const intent = searchParams?.get("intent");
  if (intent === "fornecedor") {
    return <SupplierJoinForm />;
  }
  return <QuoteRequestForm />;
}

export default function Contact() {
  return (
    <section id="contacto" className="relative py-32 md:py-44">
      <div className="site-container">
        <div className="max-w-3xl mb-16 md:mb-20">
          <RevealOnScroll>
            <h2 className="section-label mb-10">Contacto</h2>
          </RevealOnScroll>

          <SplitText
            as="h3"
            className="font-serif text-2xl md:text-4xl font-light leading-relaxed text-brand-text-dark mb-8"
          >
            {portfolioCopy.contacto.headline}
          </SplitText>

          <div className="space-y-4">
            {portfolioCopy.contacto.paragraphs.map((paragraph, i) => (
              <RevealOnScroll key={paragraph} delay={0.08 + i * 0.05}>
                <p
                  className={`font-sans text-sm leading-relaxed ${
                    i === portfolioCopy.contacto.paragraphs.length - 1
                      ? "font-serif text-lg font-light italic text-brand-text-dark/65"
                      : "text-brand-text-dark/75 font-light"
                  }`}
                >
                  {paragraph}
                </p>
              </RevealOnScroll>
            ))}
          </div>
        </div>

        <RevealOnScroll delay={0.1}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20 items-start border-t border-brand-champagne/45 pt-16 md:pt-20">
            <div className="lg:col-span-7 lg:pr-8 lg:border-r lg:border-brand-champagne/40">
              <Suspense fallback={null}>
                <ContactFormRouter />
              </Suspense>
            </div>
            <div className="lg:col-span-5 lg:pl-4">
              <ContactDirectChannels />
            </div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll className="mt-24">
          <div className="line-gold" />
        </RevealOnScroll>
      </div>
    </section>
  );
}
