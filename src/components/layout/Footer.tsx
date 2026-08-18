"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X, Clock } from "lucide-react";
import { IconInstagram, IconFacebook, IconWhatsApp, IconMail, IconMapPin } from "@/components/ui/FooterIcons";
import BrandLogo from "@/components/ui/BrandLogo";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import NewsletterSignupForm from "@/components/marketing/forms/NewsletterSignupForm";
import SignaturePad from "@/components/ui/SignaturePad";
import { footerLinkGroups } from "@/lib/marketing/navigation";
import { portfolioCopy, siteContact } from "@/lib/site-config";

const legalTabs = ["condicoes", "termos", "privacidade"] as const;
type LegalTab = (typeof legalTabs)[number];

const ambientQuotes = {
  casamento: {
    quote: "“A harmonia indissolúvel entre o eterno e o contemporâneo.”",
    cta: "Solicitar Proposta de Casamento",
    href: "/contacto?tipo=casamento",
    glowClass: "from-brand-gold/10 via-transparent to-transparent",
    label: "Casamentos & Lobolos",
  },
  corporativo: {
    quote: "“Prestígio institucional desenhado com rigor, segurança e precisão milimétrica.”",
    cta: "Solicitar Proposta Corporativa",
    href: "/contacto?tipo=corporativo",
    glowClass: "from-brand-champagne/10 via-transparent to-transparent",
    label: "Corporativo & Galas",
  },
  exclusivo: {
    quote: "“Experiências singulares que desafiam o convencional, desenhadas sob medida.”",
    cta: "Solicitar Proposta Personalizada",
    href: "/contacto?tipo=experiencias",
    glowClass: "from-brand-gold-light/10 via-transparent to-transparent",
    label: "Experiências Especiais",
  },
} as const;

export default function Footer() {
  const year = new Date().getFullYear();
  const [activeTab, setActiveTab] = useState<LegalTab | null>(null);
  const [ambientTheme, setAmbientTheme] = useState<keyof typeof ambientQuotes>("casamento");
  const [time, setTime] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  const { footer } = portfolioCopy;
  const letters = "HAXR SIGNATURE".split("");

  useEffect(() => {
    setMounted(true);
    const updateClock = () => {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: "Africa/Maputo",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      };
      setTime(new Date().toLocaleTimeString("pt-PT", options));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const legalLabel = (tab: LegalTab) =>
    tab === "condicoes"
      ? portfolioCopy.condicoesGerais.label
      : tab === "termos"
        ? portfolioCopy.termosDeServico.label
        : portfolioCopy.politicaPrivacidade.label;

  return (
    <footer className="relative border-t border-grey-dark/15 bg-black text-white overflow-hidden z-20">
      {/* Glow de fundo dinâmico */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-black via-black-soft/50 to-black pointer-events-none z-0"
        style={{ transition: "background 1.5s ease" }}
      />
      <div
        className={`absolute -top-44 left-1/2 -translate-x-1/2 w-full h-96 rounded-full blur-[140px] transition-all duration-1000 pointer-events-none opacity-40 bg-gradient-to-b ${ambientQuotes[ambientTheme].glowClass}`}
      />

      <div className="site-container-wide relative py-20 md:py-28 lg:py-32 z-10">
        <RevealOnScroll>
          {/* TOPO: Sintonizador de Ambiente e Citações Editoriais */}
          <div className="border-b border-white/10 pb-12 mb-16 md:mb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div>
                <p className="font-mono text-[9px] tracking-[0.35em] uppercase text-white/40 mb-3">
                  Sintonizar Inspiração
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                  {(Object.keys(ambientQuotes) as Array<keyof typeof ambientQuotes>).map((key) => (
                    <button
                      key={key}
                      onClick={() => setAmbientTheme(key)}
                      className={`font-mono text-[10px] tracking-[0.25em] uppercase pb-1.5 transition-all duration-500 border-b cursor-pointer ${
                        ambientTheme === key
                          ? "text-gold border-gold"
                          : "text-white/40 border-transparent hover:text-white/80"
                      }`}
                    >
                      {ambientQuotes[key].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="max-w-xl md:text-right">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={ambientTheme}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    className="font-serif text-lg md:text-xl font-light italic text-white/85 leading-relaxed"
                  >
                    {ambientQuotes[ambientTheme].quote}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* MEIO: Grelha Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-12 xl:gap-20">

            {/* Coluna 1: Logo & Signature Canvas (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-8">
              <Link href="/" aria-label="HAXR Signature — início" className="inline-block w-fit">
                <BrandLogo variant="footer" className="h-20 md:h-24" />
              </Link>

              <div className="space-y-4">
                <p className="type-manifesto text-white/70">{footer.manifesto}</p>
                <p className="font-sans text-xs text-white/50 leading-relaxed max-w-sm">
                  {footer.commitment}
                </p>
              </div>

              {/* Signature Canvas Box */}
              <div className="space-y-3">
                <p className="font-mono text-[9px] tracking-[0.28em] uppercase text-white/40">
                  Assinatura do Visitante
                </p>
                <SignaturePad />
                <p className="font-sans text-[10px] text-white/30 italic">
                  Deixe a sua assinatura digital como testemunho da sua passagem.
                </p>
              </div>
            </div>

            {/* Coluna 2: Contacto & Concierge (3 cols) */}
            <div className="lg:col-span-3 flex flex-col gap-10">
              <div>
                <div className="relative mb-6">
                  <p className="font-serif text-lg font-light tracking-wide text-white/95 uppercase">Contacto & Concierge</p>
                  <p className="font-signature text-2xl text-gold/60 -mt-2.5 ml-8 pointer-events-none select-none">Signature Experience</p>
                </div>

                <div className="space-y-6">
                  {/* EMAIL */}
                  <div className="group py-0.5">
                    <p className="font-serif text-[11px] italic text-gold/60 mb-1">
                      Conversar por email
                    </p>
                    <a
                      href={`mailto:${siteContact.email}`}
                      className="font-serif text-md text-white/85 group-hover:text-gold transition-colors duration-500 break-all flex items-center gap-2"
                    >
                      <IconMail className="w-4 h-4 text-white/40 group-hover:text-gold transition-colors shrink-0" />
                      <span>{siteContact.email}</span>
                    </a>
                  </div>

                  {/* WHATSAPP & PHONE */}
                  <div className="group py-0.5">
                    <p className="font-serif text-[11px] italic text-gold/60 mb-1">
                      Linhas directas de contacto
                    </p>
                    <div className="flex flex-col gap-2">
                      <a
                        href={siteContact.whatsapp.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-serif text-md text-white/85 group-hover:text-gold transition-colors duration-500 flex items-center gap-2"
                      >
                        <IconWhatsApp className="w-4 h-4 text-white/40 group-hover:text-gold transition-colors shrink-0" />
                        <span>{siteContact.whatsapp.display} (WhatsApp)</span>
                      </a>
                      <a
                        href="tel:+258820883428"
                        className="font-serif text-md text-white/85 group-hover:text-gold transition-colors duration-500 flex items-center gap-2"
                      >
                        <IconWhatsApp className="w-4 h-4 text-white/40 group-hover:text-gold transition-colors shrink-0 opacity-0 pointer-events-none" />
                        <span>+258 82 088 3428 (Chamadas)</span>
                      </a>
                    </div>
                  </div>

                  {/* REDES SOCIAIS */}
                  <div className="group py-0.5">
                    <p className="font-serif text-[11px] italic text-gold/60 mb-1">
                      Universo digital
                    </p>
                    <div className="flex flex-row flex-wrap gap-x-5 gap-y-2 mt-1">
                      <a
                        href="https://www.instagram.com/haxrsignature/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-serif text-sm text-white/80 hover:text-gold transition-colors duration-500 flex items-center gap-1.5 group"
                      >
                        <IconInstagram className="w-4 h-4 text-white/40 group-hover:text-gold transition-colors shrink-0" />
                        <span>Instagram</span>
                      </a>
                      <a
                        href="https://www.facebook.com/profile.php?id=61591714832967"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-serif text-sm text-white/80 hover:text-gold transition-colors duration-500 flex items-center gap-1.5 group"
                      >
                        <IconFacebook className="w-4 h-4 text-white/40 group-hover:text-gold transition-colors shrink-0" />
                        <span>Facebook</span>
                      </a>
                    </div>
                  </div>

                  {/* Sede & Relógio */}
                  <div className="group py-0.5">
                    <p className="font-serif text-[11px] italic text-gold/60 mb-1">
                      Sede física em Maputo
                    </p>
                    <div className="flex flex-col gap-2">
                      <a
                        href={siteContact.mapsHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-sans text-xs text-white/60 group-hover:text-gold/80 transition-colors duration-500 leading-relaxed flex items-start gap-2"
                      >
                        <IconMapPin className="w-4 h-4 text-white/40 group-hover:text-gold transition-colors shrink-0 mt-0.5" />
                        <span>{siteContact.shortLocation}</span>
                      </a>

                      <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xs p-2 max-w-fit mt-1">
                        <Clock className="w-3.5 h-3.5 stroke-[1.25] text-gold animate-pulse shrink-0" />
                        <span className="font-mono text-[9px] text-gold/85 font-medium tracking-wider">
                          {mounted ? time : "--:--:--"} GMT+2
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Coluna 3: Links & Newsletter (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-12">
              <div>
                <p className="section-label section-label--light mb-6">Newsletter</p>
                <p className="font-sans text-xs text-white/55 leading-relaxed mb-6 max-w-sm">
                  Subscreva a nossa newsletter editorial para inspiração, eventos e novidades exclusivas da HAXR Signature.
                </p>
                <NewsletterSignupForm variant="footer" className="max-w-md" />
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/5 md:grid-cols-4">
                {footerLinkGroups.map((group) => (
                  <nav key={group.title} aria-label={group.title} className="space-y-4">
                    <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-white/60 font-semibold">{group.title}</p>
                    <ul className="space-y-2.5">
                      {group.links.map((link) => (
                        <li key={`${group.title}-${link.href}-${link.label}`}>
                          <Link
                            href={link.href}
                            className="font-sans text-[10px] tracking-[0.15em] uppercase text-white/40 hover:text-gold transition-colors duration-300 block"
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

          {/* Destaque Artístico HAXR Signature — Efeito Assinatura Própria */}
          <div className="mt-20 md:mt-28 relative group select-none flex flex-col items-center justify-center py-8 text-center cursor-default">
            {/* Texto de Fundo Editorial */}
            <span className="font-serif text-4xl sm:text-6xl md:text-8xl lg:text-[7rem] xl:text-[8.5rem] font-bold tracking-[0.38em] text-white/5 uppercase select-none leading-none transition-all duration-1000 group-hover:text-white/10">
              HAXR
            </span>
            {/* Assinatura por Cima com Rotação */}
            <span className="font-signature text-5xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[7.5rem] text-gold/90 capitalize select-none leading-none -mt-4 sm:-mt-8 md:-mt-12 lg:-mt-16 xl:-mt-20 -rotate-3 transition-all duration-700 ease-luxury group-hover:text-brand-gold-light group-hover:scale-105 filter drop-shadow-[0_2px_10px_rgba(184,138,42,0.15)]">
              Signature
            </span>
          </div>

          {/* BASE: Rodapé Inferior */}
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between mt-12">
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              {legalTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className="font-mono text-[9px] tracking-[0.28em] uppercase text-white/45 hover:text-gold/80 transition-colors duration-500 cursor-pointer"
                >
                  {legalLabel(tab)}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 text-left sm:text-right">
              <p className="font-mono text-[9px] tracking-[0.32em] text-white/45">
                © {year} HAXR Signature
              </p>
              <p className="font-mono text-[8px] tracking-[0.38em] uppercase text-white/35">
                Curadoria de Eventos & Identidades Exclusivas
              </p>
            </div>
          </div>
        </RevealOnScroll>
      </div>

      {/* MODAL DAS TABS LEGAIS */}
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
