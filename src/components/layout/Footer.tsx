"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import BrandLogo from "@/components/ui/BrandLogo";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { footerLinkGroups } from "@/lib/marketing/navigation";
import { portfolioCopy, siteContact } from "@/lib/site-config";

const legalTabs = ["condicoes", "termos", "privacidade"] as const;
type LegalTab = (typeof legalTabs)[number];

export default function Footer() {
  const year = new Date().getFullYear();
  const [activeTab, setActiveTab] = useState<LegalTab | null>(null);
  const { footer } = portfolioCopy;

  const legalLabel = (tab: LegalTab) =>
    tab === "condicoes"
      ? portfolioCopy.condicoesGerais.label
      : tab === "termos"
        ? portfolioCopy.termosDeServico.label
        : portfolioCopy.politicaPrivacidade.label;

  return (
    <footer className="relative border-t border-grey-dark/70 bg-black">
      <div className="site-container py-24 md:py-32 lg:py-36">
        <RevealOnScroll>
          <div className="line-gold mb-20 md:mb-24 opacity-70" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-12 xl:gap-16">
            {/* Assinatura da marca */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-10 md:gap-12">
              <Link href="/" aria-label="HAXR Signature — início" className="inline-block w-fit">
                <BrandLogo variant="footer" className="h-28 md:h-36" />
              </Link>

              <div className="space-y-6 max-w-md">
                <p className="type-manifesto">{footer.manifesto}</p>
                <p className="font-sans text-sm text-grey/70 leading-relaxed">
                  {footer.commitment}
                </p>
              </div>

              <p className="font-mono text-[9px] tracking-[0.5em] uppercase text-gold/40">
                Elegância · Precisão · Exclusividade
              </p>
            </div>

            {/* Contacto em destaque */}
            <div className="lg:col-span-4 xl:col-span-3 lg:border-l lg:border-grey-dark/50 lg:pl-12 xl:pl-14">
              <p className="section-label mb-8 md:mb-10">Contacto</p>

              <div className="space-y-8 md:space-y-10">
                <div>
                  <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-grey/45 mb-3">
                    Email
                  </p>
                  <a
                    href={`mailto:${siteContact.email}`}
                    className="font-serif text-xl md:text-2xl font-light text-white/90 hover:text-gold transition-colors duration-500 break-all"
                  >
                    {siteContact.email}
                  </a>
                </div>

                <div>
                  <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-grey/45 mb-3">
                    WhatsApp
                  </p>
                  <a
                    href={siteContact.whatsapp.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-serif text-xl md:text-2xl font-light text-white/90 hover:text-gold transition-colors duration-500"
                  >
                    {siteContact.whatsapp.display}
                  </a>
                </div>

                <div>
                  <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-grey/45 mb-3">
                    Cidade
                  </p>
                  <a
                    href={siteContact.mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-sans text-sm md:text-base text-grey/80 hover:text-gold/80 transition-colors duration-500 leading-relaxed"
                  >
                    {siteContact.shortLocation}
                  </a>
                </div>

                <Link
                  href="/contacto"
                  className="btn-editorial btn-editorial--outline !min-w-0 !px-6 !py-3 inline-flex"
                >
                  Iniciar conversa
                </Link>
              </div>
            </div>

            {/* Links por categoria */}
            <div className="lg:col-span-3 xl:col-span-5 lg:border-l lg:border-grey-dark/50 lg:pl-12 xl:pl-14">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-8">
                {footerLinkGroups.map((group) => (
                  <nav key={group.title} aria-label={group.title}>
                    <p className="section-label mb-6 md:mb-8">{group.title}</p>
                    <ul className="space-y-4">
                      {group.links.map((link) => (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            className="font-sans text-[11px] tracking-[0.22em] uppercase text-grey/60 hover:text-gold/85 transition-colors duration-500"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                ))}
              </div>
            </div>
          </div>

          <div className="line-gold mt-20 md:mt-28 mb-10 opacity-35" />

          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              {legalTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className="font-mono text-[9px] tracking-[0.28em] uppercase text-grey/40 hover:text-gold/70 transition-colors duration-500 cursor-pointer"
                >
                  {legalLabel(tab)}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 text-left sm:text-right">
              <p className="font-mono text-[9px] tracking-[0.32em] text-grey/45">
                © {year} HAXR Signature
              </p>
              <p className="font-mono text-[8px] tracking-[0.38em] uppercase text-grey/35">
                Curadoria de eventos exclusivos
              </p>
            </div>
          </div>
        </RevealOnScroll>
      </div>

      <AnimatePresence>
        {activeTab && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/85 backdrop-blur-md"
            onClick={() => setActiveTab(null)}
            data-lenis-prevent
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.45, ease: [0.25, 0, 0.1, 1] }}
              className="relative w-full sm:max-w-2xl bg-black border-t sm:border border-grey-dark sm:rounded-sm shadow-[0_0_80px_rgba(0,0,0,0.8)] p-8 md:p-10 max-h-[88vh] sm:max-h-[85vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

              <button
                type="button"
                onClick={() => setActiveTab(null)}
                className="absolute top-6 right-6 text-grey/50 hover:text-gold transition-colors duration-500 cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-5 h-5 stroke-[1.25]" />
              </button>

              <div className="flex gap-6 border-b border-grey-dark pb-6 mb-8 overflow-x-auto scrollbar-none shrink-0 pr-12">
                {legalTabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`font-mono text-[9px] tracking-[0.3em] uppercase transition-all duration-500 pb-2 border-b shrink-0 cursor-pointer ${
                      activeTab === tab
                        ? "text-gold border-gold/60"
                        : "text-grey/45 border-transparent hover:text-white/60"
                    }`}
                  >
                    {legalLabel(tab)}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto pr-1 scrollbar-none">
                {activeTab === "condicoes" && (
                  <div className="space-y-8">
                    <div>
                      <h3 className="type-headline text-white/90 mb-4">
                        {portfolioCopy.condicoesGerais.headline}
                      </h3>
                      <div className="space-y-4">
                        {portfolioCopy.condicoesGerais.intro.map((para) => (
                          <p
                            key={para}
                            className="font-sans text-sm text-grey leading-relaxed"
                          >
                            {para}
                          </p>
                        ))}
                      </div>
                    </div>
                    <ol className="border-t border-grey-dark">
                      {portfolioCopy.condicoesGerais.items.map((item, i) => (
                        <li key={item.title} className="border-b border-grey-dark py-6">
                          <div className="flex gap-4">
                            <p className="font-mono text-[9px] tracking-[0.35em] text-gold/45 shrink-0 pt-1">
                              {String(i + 1).padStart(2, "0")}
                            </p>
                            <div>
                              <h4 className="font-serif text-base font-light text-white/80 mb-2">
                                {item.title}
                              </h4>
                              <p className="font-sans text-xs text-grey leading-relaxed">
                                {item.body}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {activeTab === "termos" && (
                  <div className="space-y-5">
                    <h3 className="type-headline text-white/90">
                      {portfolioCopy.termosDeServico.headline}
                    </h3>
                    {portfolioCopy.termosDeServico.paragraphs.map((para) => (
                      <p key={para} className="font-sans text-sm text-grey leading-relaxed">
                        {para}
                      </p>
                    ))}
                  </div>
                )}

                {activeTab === "privacidade" && (
                  <div className="space-y-5">
                    <h3 className="type-headline text-white/90">
                      {portfolioCopy.politicaPrivacidade.headline}
                    </h3>
                    {portfolioCopy.politicaPrivacidade.paragraphs.map((para) => (
                      <p key={para} className="font-sans text-sm text-grey leading-relaxed">
                        {para}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  );
}
