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
    <div id="pacotes" className="scroll-mt-28">
      <RevealOnScroll>
        <h2 className="section-label mb-6">Coleção</h2>
        <h3 className="font-serif text-2xl md:text-4xl font-light text-brand-text-dark mb-12 max-w-2xl leading-snug">
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
              className={`shrink-0 snap-start px-6 py-3 font-mono text-[10px] tracking-[0.25em] uppercase transition-all duration-700 relative overflow-hidden group rounded-full ${
                activeOccasion === occ.id
                  ? "text-white bg-brand-text-dark border border-brand-text-dark font-semibold"
                  : "text-brand-text-dark/60 border border-brand-champagne/80 hover:text-brand-text-dark hover:border-brand-text-dark/40 bg-white/70 backdrop-blur-sm"
              }`}
            >
              <span className="relative z-10">{occ.label}</span>
              {activeOccasion !== occ.id && (
                <div className="absolute inset-0 bg-brand-text-dark/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
              )}
            </button>
          ))}
        </div>
      </RevealOnScroll>

      <div className={`flex gap-6 overflow-x-auto pb-8 site-bleed-x md:grid md:gap-8 md:items-stretch md:overflow-visible snap-x snap-mandatory scrollbar-none mb-16 ${
        displayPackages.length === 1
          ? "md:grid-cols-1 md:max-w-md md:mx-auto"
          : displayPackages.length === 2
            ? "md:grid-cols-2 md:max-w-4xl md:mx-auto"
            : "md:grid-cols-3"
      }`}>
        <AnimatePresence mode="popLayout">
          {displayPackages.map((pkg, i) => {
            const isFeatured = pkg.featured;
            return (
              <motion.article
                key={pkg.id}
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
                className={`relative shrink-0 w-[min(88vw,380px)] md:w-auto md:h-full snap-center flex flex-col border transition-all duration-700 rounded-2xl overflow-hidden group/card shadow-xl ${
                  isFeatured
                    ? "border-brand-gold/60 bg-white shadow-[0_15px_45px_rgba(184,138,42,0.12)] hover:border-brand-gold"
                    : "border-brand-champagne/60 bg-white hover:border-brand-gold/50 hover:shadow-[0_20px_50px_rgba(184,138,42,0.06)]"
                }`}
              >
                {/* Futuristic subtle glow */}
                <div className={`absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-1000 ${
                  isFeatured ? "via-brand-gold/80" : "via-brand-gold/30"
                }`} />
                <div className={`absolute -top-32 -left-32 w-64 h-64 rounded-full blur-[80px] opacity-0 group-hover/card:opacity-100 transition-opacity duration-1000 pointer-events-none ${
                  isFeatured ? "bg-brand-gold/[0.04]" : "bg-brand-gold/[0.02]"
                }`} />

                <div className="flex flex-col flex-1 p-8 md:p-10 relative z-10 h-full justify-between">
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                      <span className={`inline-flex items-center gap-2 border px-3 py-1 font-mono text-[9px] tracking-[0.4em] uppercase ${
                        isFeatured
                          ? "border-brand-gold/30 bg-brand-gold/10 text-brand-gold font-medium"
                          : "border-brand-champagne/80 bg-brand-champagne/10 text-brand-gold/90"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isFeatured ? "bg-brand-gold animate-pulse" : "bg-brand-gold/70 animate-pulse"}`} />
                        {pkg.tier}
                      </span>
                      {isFeatured ? (
                        <span className="text-[9px] font-mono tracking-widest uppercase font-bold text-brand-gold px-2.5 py-0.5 bg-brand-gold/10 border border-brand-gold/25 rounded-full">
                          Assinatura
                        </span>
                      ) : (
                        <span className="text-brand-text-dark/30 text-[10px] font-serif italic">No. {i + 1}</span>
                      )}
                    </div>

                    <h4 className="font-serif text-3xl md:text-4xl font-extralight text-brand-text-dark mb-3 tracking-wide group-hover/card:text-brand-gold transition-colors duration-700">
                      {pkg.name}
                    </h4>

                    <div className="mb-6 flex items-baseline">
                      <span className="font-sans text-2xl md:text-3xl font-light text-brand-text-dark tracking-tight">
                        {pkg.priceLabel}
                      </span>
                    </div>

                    <p className="font-mono text-[9px] tracking-[0.15em] uppercase text-brand-gold/85 mb-5 leading-relaxed">
                      {pkg.subtitle}
                    </p>

                    <p className="font-sans text-[13px] text-brand-text-dark/70 leading-relaxed mb-8 font-light md:min-h-[72px]">
                      {pkg.desc}
                    </p>

                    {"includesNote" in pkg && pkg.includesNote && (
                      <div className="flex items-center gap-3 mb-5">
                        <div className="h-px flex-1 bg-gradient-to-r from-brand-champagne/45 to-transparent" />
                        <p className="font-serif italic text-xs text-brand-text-dark/50 shrink-0">
                          {pkg.includesNote}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between mt-4">
                    <div className="mb-8">
                      <ul className="space-y-4">
                        {pkg.features.slice(0, 3).map((feature, idx) => {
                          const isQuoteMessage = pkg.price === null && idx === 0;
                          return (
                            <li
                              key={feature}
                              className={`flex items-start gap-4 font-sans text-[13px] leading-relaxed ${
                                isQuoteMessage
                                  ? "text-brand-gold bg-brand-gold/5 border border-brand-gold/10 p-4 rounded-sm"
                                  : isFeatured
                                    ? "text-brand-text-dark group-hover/card:text-brand-text-dark transition-colors duration-300 font-normal"
                                    : "text-brand-text-dark/75 group-hover/card:text-brand-text-dark/90 transition-colors duration-300 font-light"
                              }`}
                            >
                              {isQuoteMessage ? (
                                <span className="text-brand-gold text-sm mt-0.5 shrink-0">✦</span>
                              ) : (
                                <span className="text-brand-gold mt-1 shrink-0 text-[11px]">✦</span>
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
                              <div className="absolute left-[5px] top-4 bottom-2 w-px bg-gradient-to-b from-brand-gold/20 to-transparent" />
                              {pkg.features.slice(3).map((feature) => {
                                return (
                                  <li
                                    key={feature}
                                    className={`flex items-start gap-4 font-sans text-[13px] leading-relaxed ${
                                      isFeatured
                                        ? "text-brand-text-dark/90 group-hover/card:text-brand-text-dark transition-colors duration-300 font-normal"
                                        : "text-brand-text-dark/70 group-hover/card:text-brand-text-dark/80 transition-colors duration-300 font-light"
                                    }`}
                                  >
                                    <span className="text-brand-gold/70 mt-1 shrink-0 text-[11px]">✦</span>
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
                          <span className="h-px w-6 bg-brand-text-dark/20 group-hover/btn:bg-brand-gold transition-colors duration-300" />
                          <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-brand-text-dark/45 group-hover/btn:text-brand-gold transition-colors duration-300">
                            {expandedPackages[pkg.id] ? "Recolher Experiência" : `Explorar Completo (+${pkg.features.length - 3})`}
                          </span>
                        </button>
                      )}
                    </div>

                    <a
                      href={pkg.price === null ? siteContact.whatsapp.href : siteConfig.contact.convitePackageHash(pkg.id)}
                      className={`group relative flex items-center justify-between border p-5 font-mono text-[10px] tracking-[0.3em] uppercase transition-all duration-500 overflow-hidden mt-auto rounded-xl ${
                        isFeatured
                          ? "bg-brand-text-dark border-brand-text-dark text-white font-semibold hover:bg-brand-gold hover:border-brand-gold hover:text-white"
                          : "border-brand-text-dark/20 bg-[#FAF8F5] text-brand-text-dark hover:bg-brand-text-dark hover:text-white hover:border-brand-text-dark"
                      }`}
                    >
                      <span className="relative z-10">{pkg.price === null ? "Pedir Cotação" : `Adquirir ${pkg.name}`}</span>
                      <span className="relative z-10 transition-transform duration-500 group-hover:translate-x-1 font-serif text-sm">
                        →
                      </span>
                    </a>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </div>

      <RevealOnScroll>
        <p className="font-serif text-sm font-light italic text-brand-text-dark/45 text-center max-w-lg mx-auto mb-10">
          Valores em meticais (MT). Serviços urgentes ou personalizações
          adicionais podem estar sujeitos a acréscimo, sendo sempre refletidos
          na proposta oficial HAXR.
        </p>
      </RevealOnScroll>

      <InvitationComparison />

      <RevealOnScroll>
        <h2 className="section-label mb-10 mt-16">Dúvidas Frequentes</h2>
      </RevealOnScroll>

      <div className="max-w-3xl space-y-0 border-t border-brand-champagne/45">
        {invitationFaqs.map((faq, i) => (
          <RevealOnScroll key={faq.q} delay={i * 0.05}>
            <div className="border-b border-brand-champagne/45">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-start justify-between gap-6 py-8 text-left group hover:bg-brand-champagne/5 px-4 -mx-4 transition-colors duration-500 rounded-sm"
                aria-expanded={openFaq === i ? "true" : "false"}
              >
                <span className="font-serif text-lg font-light text-brand-text-dark/80 group-hover:text-brand-gold transition-colors duration-500">
                  {faq.q}
                </span>
                <span className="shrink-0 font-mono text-brand-gold/60 text-sm mt-1 transition-transform duration-500 group-hover:text-brand-gold group-hover:rotate-90">
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
                    <p className="pb-8 font-sans text-[15px] font-light text-brand-text-dark/70 leading-relaxed pr-8">
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

