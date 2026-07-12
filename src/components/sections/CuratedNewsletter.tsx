"use client";

import RevealOnScroll from "@/components/ui/RevealOnScroll";
import NewsletterSignupForm from "@/components/marketing/forms/NewsletterSignupForm";

export default function CuratedNewsletter() {
  return (
    <section className="relative py-24 bg-brand-champagne/10 border-t border-brand-champagne/45 pointer-events-auto">
      <div className="site-container mx-auto">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <RevealOnScroll>
            <h2 className="section-label justify-center mb-6">Newsletter</h2>
          </RevealOnScroll>
          <RevealOnScroll delay={0.05}>
            <p className="font-serif text-2xl md:text-3xl font-light text-brand-text-dark leading-relaxed">
              Ideias, tendências & curadoria exclusiva.
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={0.1}>
            <p className="font-sans text-xs md:text-sm text-brand-text-dark/70 leading-relaxed font-light max-w-lg mx-auto">
              Subscreva para receber inspiração editorial, planeamento inteligente
              e novidades da HAXR Signature — com discrição e rigor visual.
            </p>
          </RevealOnScroll>

          <RevealOnScroll delay={0.15}>
            <div className="max-w-md mx-auto mt-8 text-left">
              <NewsletterSignupForm />
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
