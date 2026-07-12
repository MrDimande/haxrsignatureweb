"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { portfolioCopy, testimonials } from "@/lib/site-config";

export default function Testimonials() {
  return (
    <section
      id="testemunhos"
      className="relative py-24 md:py-32 bg-brand-champagne/15 border-y border-brand-champagne/30"
    >
      <div className="site-container mx-auto">
        <RevealOnScroll>
          <h2 className="section-label mb-6">
            {portfolioCopy.testemunhos.label}
          </h2>
          <p className="font-sans text-sm text-brand-text-dark/75 leading-relaxed max-w-xl mb-16 font-light">
            {portfolioCopy.testemunhos.intro}
          </p>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
          {testimonials.map((item, index) => (
            <RevealOnScroll key={item.id} delay={index * 0.08}>
              <article className="bg-brand-ivory/50 border border-brand-champagne/40 rounded-sm p-8 md:p-12 h-full flex flex-col justify-between hover:border-brand-gold/50 transition-all duration-500">
                <div>
                  <p className="font-mono text-[8px] tracking-[0.35em] uppercase text-brand-gold font-semibold mb-8">
                    {item.service}
                  </p>
                  <blockquote className="font-serif text-xl md:text-2xl font-light italic text-brand-text-dark/95 leading-relaxed flex-1">
                    «{item.quote}»
                  </blockquote>
                </div>
                <div className="mt-10 pt-8 border-t border-brand-champagne/45">
                  {item.author ? (
                    <p className="font-serif text-lg font-light text-brand-text-dark/90 tracking-wide">
                      {item.author}
                    </p>
                  ) : null}
                  <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-brand-text-dark/60 mt-2">
                    {item.role}
                  </p>
                  {item.href ? (
                    <Link
                      href={item.href}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noopener noreferrer" : undefined}
                      className="inline-flex items-center gap-2 mt-5 font-mono text-[9px] tracking-[0.25em] uppercase text-brand-gold/70 hover:text-brand-gold transition-colors duration-500"
                    >
                      {item.linkLabel ?? "Ver projecto"}
                      <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.25} />
                    </Link>
                  ) : null}
                </div>
              </article>
            </RevealOnScroll>
          ))}
        </div>

        <RevealOnScroll className="mt-14">
          <p className="font-serif text-sm font-light italic text-brand-text-dark/60 max-w-xl">
            {portfolioCopy.footer.commitment}
          </p>
        </RevealOnScroll>
      </div>
    </section>
  );
}
