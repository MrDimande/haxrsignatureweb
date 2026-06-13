"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AtSign,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  X,
  type LucideIcon,
} from "lucide-react";
import BrandRubric from "@/components/ui/BrandRubric";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { portfolioCopy, siteContact } from "@/lib/site-config";

const footerNav = [
  { href: "#filosofia", label: "Filosofia" },
  { href: "#universo", label: "Universo" },
  { href: "#convites", label: "Convites" },
  { href: "#contacto", label: "Contacto" },
] as const;

const legalTabs = ["condicoes", "termos", "privacidade"] as const;
type LegalTab = (typeof legalTabs)[number];

const iconStroke = "w-[15px] h-[15px] text-gold/70 stroke-[1.25]";

type FooterLink = {
  icon: LucideIcon;
  label: string;
  value: string;
  href: string;
  external?: boolean;
};

const contactLinks: FooterLink[] = [
  {
    icon: AtSign,
    label: "Instagram",
    value: siteContact.instagram.handle,
    href: siteContact.instagram.href,
    external: true,
  },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: siteContact.whatsapp.display,
    href: siteContact.whatsapp.href,
    external: true,
  },
  {
    icon: Mail,
    label: "Email",
    value: siteContact.email,
    href: `mailto:${siteContact.email}`,
  },
  ...siteContact.phones.map((phone) => ({
    icon: Phone,
    label: "Telefone",
    value: phone.display,
    href: `tel:${phone.tel}`,
  })),
  {
    icon: MapPin,
    label: "Escritório",
    value: siteContact.shortLocation,
    href: siteContact.mapsHref,
    external: true,
  },
];

function FooterContactLink({ item }: { item: FooterLink }) {
  const Icon = item.icon;

  return (
    <a
      href={item.href}
      target={item.external ? "_blank" : undefined}
      rel={item.external ? "noopener noreferrer" : undefined}
      className="group flex items-center gap-3 py-2 transition-colors duration-500"
    >
      <Icon className={`${iconStroke} group-hover:text-gold transition-colors duration-500`} />
      <span className="font-sans text-[10px] tracking-[0.18em] uppercase text-grey/55 group-hover:text-gold/80 transition-colors duration-500">
        {item.value}
      </span>
    </a>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();
  const [activeTab, setActiveTab] = useState<LegalTab | null>(null);

  const legalLabel = (tab: LegalTab) =>
    tab === "condicoes"
      ? portfolioCopy.condicoesGerais.label
      : tab === "termos"
        ? portfolioCopy.termosDeServico.label
        : portfolioCopy.politicaPrivacidade.label;

  return (
    <footer className="relative border-t border-grey-dark/80 bg-gradient-to-b from-black via-black-soft/30 to-black">
      <div className="site-container py-20 md:py-28">
        <RevealOnScroll>
          <div className="line-gold mb-16 md:mb-20" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-14 md:gap-10 lg:gap-16">
            <div className="md:col-span-5 lg:col-span-5 flex flex-col justify-between gap-10">
              <div>
                <a href="#hero" aria-label="HAXR Signature — início">
                  <BrandRubric align="left" className="mb-8" />
                </a>
                <p className="font-mono text-[9px] tracking-[0.45em] uppercase text-grey/50 mb-8">
                  {siteContact.shortLocation}
                </p>
                <p className="font-serif text-base md:text-lg font-light italic text-white/35 leading-relaxed max-w-sm">
                  {portfolioCopy.footer.commitment}
                </p>
              </div>
              <p className="font-mono text-[8px] tracking-[0.5em] uppercase text-gold/35 hidden md:block">
                Elegância · Precisão · Exclusividade
              </p>
            </div>

            <div className="md:col-span-3 lg:col-span-3 md:border-l md:border-grey-dark/60 md:pl-10">
              <p className="font-mono text-[9px] tracking-[0.5em] uppercase text-grey mb-6">
                Contacto
              </p>
              <nav aria-label="Canais de contacto" className="flex flex-col">
                {contactLinks.map((item) => (
                  <FooterContactLink key={`${item.label}-${item.href}`} item={item} />
                ))}
              </nav>
            </div>

            <div className="md:col-span-4 lg:col-span-4 md:border-l md:border-grey-dark/60 md:pl-10 flex flex-col justify-between gap-10">
              <div>
                <p className="font-mono text-[9px] tracking-[0.5em] uppercase text-grey mb-6">
                  Navegação
                </p>
                <nav aria-label="Secções do site" className="flex flex-col gap-3">
                  {footerNav.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className="font-sans text-[10px] tracking-[0.28em] uppercase text-grey/55 hover:text-gold/80 transition-colors duration-500 w-fit"
                    >
                      {link.label}
                    </a>
                  ))}
                </nav>
              </div>

              <div>
                <p className="font-mono text-[9px] tracking-[0.5em] uppercase text-grey mb-5">
                  Informação legal
                </p>
                <div className="flex flex-col gap-3">
                  {legalTabs.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className="font-sans text-[10px] tracking-[0.22em] uppercase text-grey/45 hover:text-gold/75 transition-colors duration-500 text-left w-fit cursor-pointer"
                    >
                      {legalLabel(tab)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="line-gold mt-16 md:mt-20 mb-8 opacity-40" />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="font-mono text-[8px] tracking-[0.35em] uppercase text-grey/40 md:hidden">
              Elegância · Precisão · Exclusividade
            </p>
            <p className="font-mono text-[9px] tracking-[0.3em] text-grey/45">
              © {year} HAXR Signature
            </p>
            <p className="font-mono text-[8px] tracking-[0.35em] uppercase text-grey/35">
              Curadoria de eventos exclusivos
            </p>
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
                      <h3 className="font-serif text-xl md:text-2xl font-light text-white/90 mb-4 leading-relaxed">
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
                    <h3 className="font-serif text-xl md:text-2xl font-light text-white/90 leading-relaxed">
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
                    <h3 className="font-serif text-xl md:text-2xl font-light text-white/90 leading-relaxed">
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
