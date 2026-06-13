"use client";

import InvitationComparison from "@/components/sections/InvitationComparison";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import {
  invitationFaqs,
  invitationOccasions,
  invitationPackages,
  portfolioCopy,
  siteConfig,
  siteContact,
  type InvitationOccasionId,
} from "@/lib/site-config";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

export default function InvitationPackages() {
  const [activeOccasion, setActiveOccasion] =
    useState<InvitationOccasionId>("casamento");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [expandedPackages, setExpandedPackages] = useState<Record<string, boolean>>({});

  const togglePkg = (id: string) => {
    setExpandedPackages((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredPackages = invitationPackages.filter((pkg) =>
    (pkg.occasions as readonly InvitationOccasionId[]).includes(activeOccasion)
  );

  const displayPackages =
    filteredPackages.length > 0 ? filteredPackages : invitationPackages;

  return (
    <div className="mb-16 md:mb-20">
      <RevealOnScroll>
        <h2 className="section-label mb-6">Coleção</h2>
        <h3 className="font-serif text-2xl md:text-4xl font-light text-white/90 mb-12 max-w-2xl leading-snug">
          {portfolioCopy.convites.packagesIntro}
        </h3>
      </RevealOnScroll>

      <RevealOnScroll delay={0.05}>
        <div className="flex gap-4 overflow-x-auto pb-4 mb-16 -mx-1 px-1 scrollbar-none snap-x snap-mandatory">
          {invitationOccasions.map((occ) => (
            <button
              key={occ.id}
              type="button"
              onClick={() => setActiveOccasion(occ.id)}
              className={`shrink-0 snap-start px-6 py-3 font-mono text-[10px] tracking-[0.25em] uppercase transition-all duration-700 relative overflow-hidden group ${
                activeOccasion === occ.id
                  ? "text-black bg-gold border border-gold"
                  : "text-white/60 border border-white/10 hover:text-white hover:border-white/30 backdrop-blur-sm"
              }`}
            >
              <span className="relative z-10">{occ.label}</span>
              {activeOccasion !== occ.id && (
                <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
              )}
            </button>
          ))}
        </div>
      </RevealOnScroll>

      <div className={`flex gap-6 overflow-x-auto pb-8 site-bleed-x md:grid md:gap-8 md:overflow-visible snap-x snap-mandatory scrollbar-none mb-16 ${
        displayPackages.length === 1 
          ? "md:grid-cols-1 md:max-w-md md:mx-auto" 
          : displayPackages.length === 2 
            ? "md:grid-cols-2 md:max-w-4xl md:mx-auto" 
            : "md:grid-cols-3"
      }`}>
        <AnimatePresence mode="popLayout">
          {displayPackages.map((pkg, i) => (
            <motion.article
              key={pkg.id}
              layout
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="relative shrink-0 w-[min(88vw,380px)] md:w-auto snap-center flex flex-col border border-white/10 bg-black/40 backdrop-blur-xl hover:border-gold/40 shadow-2xl hover:shadow-[0_0_50px_rgba(201,169,110,0.15)] transition-all duration-700 rounded-sm overflow-hidden group/card"
            >
              {/* Futuristic subtle glow */}
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-gold/50 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-1000" />
              <div className="absolute -top-32 -left-32 w-64 h-64 bg-gold/5 rounded-full blur-[80px] opacity-0 group-hover/card:opacity-100 transition-opacity duration-1000 pointer-events-none" />

              <div className="flex flex-col flex-1 p-8 md:p-10 relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <span className="inline-flex items-center gap-2 border border-white/10 px-3 py-1 bg-white/5 font-mono text-gold/80 text-[9px] tracking-[0.4em] uppercase">
                    <span className="w-1 h-1 bg-gold rounded-full animate-pulse" />
                    {pkg.tier}
                  </span>
                  <span className="text-white/20 text-[10px] font-serif italic">No. {i + 1}</span>
                </div>

                <h4 className="font-serif text-3xl md:text-4xl font-extralight text-white mb-3 tracking-wide group-hover/card:text-gold transition-colors duration-700">
                  {pkg.name}
                </h4>

                <div className="mb-6 flex items-baseline">
                  <span className="font-sans text-2xl md:text-3xl font-light text-white/90 tracking-tight">
                    {pkg.priceLabel}
                  </span>
                </div>

                <p className="font-mono text-[9px] tracking-[0.15em] uppercase text-gold/60 mb-5 leading-relaxed">
                  {pkg.subtitle}
                </p>

                <p className="font-sans text-[13px] text-white/50 leading-relaxed mb-8 font-light">
                  {pkg.desc}
                </p>

                {"includesNote" in pkg && pkg.includesNote && (
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                    <p className="font-serif italic text-xs text-white/40 shrink-0">
                      {pkg.includesNote}
                    </p>
                  </div>
                )}

                <div className="flex-1 flex flex-col mb-8">
                  <ul className="space-y-4">
                    {pkg.features.slice(0, 3).map((feature, idx) => {
                      const isQuoteMessage = pkg.price === null && idx === 0;
                      return (
                        <li
                          key={feature}
                          className={`flex items-start gap-4 font-sans text-[13px] leading-relaxed font-light ${
                            isQuoteMessage 
                              ? "text-gold bg-gold/5 border border-gold/10 p-4 rounded-sm" 
                              : "text-white/70 group-hover/card:text-white/90 transition-colors duration-300"
                          }`}
                        >
                          {isQuoteMessage ? (
                            <span className="text-gold text-sm mt-0.5 shrink-0">✦</span>
                          ) : (
                            <span className="text-gold/50 text-[10px] mt-[5px] shrink-0 font-mono">—</span>
                          )}
                          <span>{feature}</span>
                        </li>
                      );
                    })}
                  </ul>

                  <AnimatePresence initial={false}>
                    {expandedPackages[pkg.id] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.5, ease: [0.25, 0, 0.1, 1] }}
                        className="overflow-hidden"
                      >
                        <ul className="space-y-4 pt-4 relative">
                          <div className="absolute left-[5px] top-4 bottom-2 w-px bg-gradient-to-b from-gold/20 to-transparent" />
                          {pkg.features.slice(3).map((feature, idx) => {
                            const actualIdx = idx + 3;
                            const isQuoteMessage = pkg.price === null && actualIdx === 0;
                            return (
                              <li
                                key={feature}
                                className={`flex items-start gap-4 font-sans text-[13px] leading-relaxed font-light ${
                                  isQuoteMessage 
                                    ? "text-gold bg-gold/5 border border-gold/10 p-4 rounded-sm" 
                                    : "text-white/60 group-hover/card:text-white/80 transition-colors duration-300"
                                }`}
                              >
                                {isQuoteMessage ? (
                                  <span className="text-gold text-sm mt-0.5 shrink-0">✦</span>
                                ) : (
                                  <span className="text-gold/30 text-[10px] mt-[5px] shrink-0 font-mono">—</span>
                                )}
                                <span>{feature}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {pkg.features.length > 3 && (
                    <button
                      type="button"
                      onClick={() => togglePkg(pkg.id)}
                      className="mt-6 self-start flex items-center gap-2 group/btn focus:outline-none cursor-pointer"
                    >
                      <span className="h-px w-6 bg-white/20 group-hover/btn:bg-gold transition-colors duration-300" />
                      <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-white/40 group-hover/btn:text-gold transition-colors duration-300">
                        {expandedPackages[pkg.id] ? "Recolher Experiência" : `Explorar Completo (+${pkg.features.length - 3})`}
                      </span>
                    </button>
                  )}
                </div>

                <a
                  href={pkg.price === null ? siteContact.whatsapp.href : siteConfig.contact.convitePackageHash(pkg.id)}
                  className="group relative flex items-center justify-between border border-white/10 bg-white/5 p-5 font-mono text-[10px] tracking-[0.3em] uppercase text-white transition-all duration-500 hover:border-gold hover:bg-gold hover:text-black overflow-hidden mt-auto"
                >
                  <span className="relative z-10">{pkg.price === null ? "Pedir Cotação" : `Adquirir ${pkg.name}`}</span>
                  <span className="relative z-10 transition-transform duration-500 group-hover:translate-x-1 font-serif text-sm">
                    →
                  </span>
                </a>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>

      <RevealOnScroll>
        <p className="font-serif text-sm font-light italic text-white/35 text-center max-w-lg mx-auto mb-10">
          Valores em meticais (MT). Serviços urgentes ou personalizações
          adicionais podem estar sujeitos a acréscimo, sendo sempre refletidos
          na proposta oficial HAXR.
        </p>
      </RevealOnScroll>

      <InvitationComparison />

      <RevealOnScroll>
        <h2 className="section-label mb-10 mt-16">Dúvidas Frequentes</h2>
      </RevealOnScroll>

      <div className="max-w-3xl space-y-0 border-t border-white/10">
        {invitationFaqs.map((faq, i) => (
          <RevealOnScroll key={faq.q} delay={i * 0.05}>
            <div className="border-b border-white/10">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-start justify-between gap-6 py-8 text-left group hover:bg-white/[0.02] px-4 -mx-4 transition-colors duration-500 rounded-sm"
                aria-expanded={openFaq === i ? "true" : "false"}
              >
                <span className="font-serif text-lg font-light text-white/80 group-hover:text-gold transition-colors duration-500">
                  {faq.q}
                </span>
                <span className="shrink-0 font-mono text-gold/40 text-sm mt-1 transition-transform duration-500 group-hover:text-gold group-hover:rotate-90">
                  {openFaq === i ? "—" : "+"}
                </span>
              </button>

              <AnimatePresence>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.25, 0, 0.1, 1] }}
                    className="overflow-hidden px-4 -mx-4"
                  >
                    <p className="pb-8 font-sans text-[15px] font-light text-white/50 leading-relaxed pr-8">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </RevealOnScroll>
        ))}
      </div>
    </div>
  );
}

