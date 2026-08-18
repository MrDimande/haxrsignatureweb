"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { FaqSection } from "@/lib/marketing/faqs";

type FaqAccordionProps = {
  sections: FaqSection[];
};

export default function FaqAccordion({ sections }: FaqAccordionProps) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <div className="space-y-16">
      {sections.map((section) => (
        <section key={section.id} aria-labelledby={`faq-${section.id}`}>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-brand-champagne/40 pb-4">
            <h2
              id={`faq-${section.id}`}
              className="font-serif text-2xl font-light text-brand-text-dark"
            >
              {section.title}
            </h2>
            <div className="flex flex-wrap gap-3">
              {section.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="font-mono text-[9px] uppercase tracking-[0.25em] text-brand-gold/80 hover:text-brand-gold"
                >
                  {link.label} →
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {section.items.map((faq) => {
              const key = `${section.id}-${faq.q}`;
              const open = openKey === key;
              return (
                <div
                  key={key}
                  className="overflow-hidden rounded-sm border border-brand-champagne/35 bg-white/70"
                >
                  <button
                    type="button"
                    onClick={() => setOpenKey(open ? null : key)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer"
                    aria-expanded={open}
                  >
                    <span className="font-serif text-base font-light text-brand-text-dark">
                      {faq.q}
                    </span>
                    <span className="font-mono text-sm text-brand-gold">{open ? "—" : "+"}</span>
                  </button>
                  <AnimatePresence initial={false}>
                    {open ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-5 font-sans text-sm leading-relaxed text-brand-text-dark/75">
                          {faq.a}
                        </p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
