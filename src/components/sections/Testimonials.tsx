"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { portfolioCopy, testimonials } from "@/lib/site-config";

export default function Testimonials() {
  return (
    <section
      id="testemunhos"
      className="relative pt-20 pb-12 md:pt-28 md:pb-16 bg-black-soft"
    >
      <div className="site-container site-prose-medium mx-auto">
        <RevealOnScroll>
          <h2 className="section-label mb-6">
            {portfolioCopy.testemunhos.label}
          </h2>
          <p className="font-sans text-sm text-grey leading-relaxed max-w-xl mb-16">
            {portfolioCopy.testemunhos.intro}
          </p>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-grey-dark/80 max-w-5xl">
          {testimonials.map((item, index) => (
            <RevealOnScroll key={item.id} delay={index * 0.08}>
              <article className="bg-black-soft p-8 md:p-12 h-full flex flex-col">
                <p className="font-mono text-[8px] tracking-[0.35em] uppercase text-gold/50 mb-8">
                  {item.service}
                </p>
                <blockquote className="font-serif text-xl md:text-2xl font-light italic text-white/88 leading-relaxed flex-1">
                  «{item.quote}»
                </blockquote>
                <div className="mt-10 pt-8 border-t border-grey-dark/80">
                  {item.author ? (
                    <p className="font-serif text-lg font-light text-white/90 tracking-wide">
                      {item.author}
                    </p>
                  ) : null}
                  <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-grey/55 mt-2">
                    {item.role}
                  </p>
                  {item.href ? (
                    <Link
                      href={item.href}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noopener noreferrer" : undefined}
                      className="inline-flex items-center gap-2 mt-5 font-mono text-[9px] tracking-[0.25em] uppercase text-gold/70 hover:text-gold transition-colors duration-500"
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

        <RevealOnScroll className="mt-12">
          <p className="font-serif text-sm font-light italic text-grey/55 max-w-xl">
            {portfolioCopy.footer.commitment}
          </p>
        </RevealOnScroll>
      </div>
    </section>
  );
}
