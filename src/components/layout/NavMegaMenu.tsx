"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckSquare,
  ChevronDown,
  Compass,
  Crown,
  Eye,
  Feather,
  Fingerprint,
  FolderCheck,
  Gem,
  HeartHandshake,
  KeyRound,
  Layers,
  LucideIcon,
  Mail,
  MessageCircle,
  Palette,
  ShieldCheck,
} from "lucide-react";
import type { NavGroup } from "@/lib/marketing/navigation";

export type NavVariant = "hero" | "dark";

type MegaMenuColumn = {
  icon: LucideIcon;
  title: string;
  links: Array<{
    label: string;
    href: string;
    description?: string;
  }>;
  cta: {
    label: string;
    href: string;
  };
};

type FeaturedEditorialCard = {
  badge: string;
  title: string;
  subtitle: string;
  image: string;
  href: string;
  cta: string;
};

type MegaMenuGroupConfig = {
  headerLabel: string;
  headerHref: string;
  headerCta: string;
  columns: [MegaMenuColumn, MegaMenuColumn];
  featuredCard: FeaturedEditorialCard;
};

export const MEGA_MENU_CONFIGS: Record<string, MegaMenuGroupConfig> = {
  inspiracao: {
    headerLabel: "ATELIER HAXR · INSPIRAÇÃO & CURADORIA",
    headerHref: "/portfolio",
    headerCta: "VER PORTFÓLIO COMPLETO →",
    columns: [
      {
        icon: Gem,
        title: "Recém-Noivos?",
        links: [
          { label: "Style Quiz — Descubra o vosso estilo", href: "/style-quiz" },
          { label: "Submeter Casamento para Publicação", href: "/portfolio/submeter" },
          { label: "Conselhos para Casar em Moçambique", href: "/insights" },
          { label: "Dicas de Etiqueta & Convidados", href: "/insights" },
        ],
        cta: { label: "FAZER O STYLE QUIZ", href: "/style-quiz" },
      },
      {
        icon: BookOpen,
        title: "Guias & Recursos",
        links: [
          { label: "Guias Gratuitos em PDF", href: "/guias" },
          { label: "Insights & Tendências Editoriais", href: "/insights" },
          { label: "Checklists & Modelos de Orçamento", href: "/guias" },
          { label: "Direcção Criativa de Casamentos", href: "/insights" },
        ],
        cta: { label: "DESCARREGAR GUIAS", href: "/guias" },
      },
    ],
    featuredCard: {
      badge: "CASAMENTO EM DESTAQUE",
      title: "Vânia Luky & Fabião Dimande",
      subtitle: "Casamento real de alta-costura com direcção estética e convite digital HAXR no Evelyn Eventos, Maputo.",
      image: "/images/portfolio/mosaic-casal-painel-branco.webp",
      href: "/portfolio",
      cta: "VER CASAMENTO REAL",
    },
  },
  servicos: {
    headerLabel: "ATELIER HAXR · SERVIÇOS DE ALTA-COSTURA DIGITAL",
    headerHref: "/convites-identidade-visual#pacotes",
    headerCta: "VER TODOS OS PACOTES & PREÇOS →",
    columns: [
      {
        icon: Crown,
        title: "Assessoria & Atelier",
        links: [
          { label: "Planeamento & Assessoria Integral", href: "/assessoria-eventos" },
          { label: "Curadoria de Fornecedores de Elite", href: "/assessoria-eventos" },
          { label: "Coordenação Minuto a Minuto no Dia", href: "/assessoria-eventos" },
          { label: "Consultoria Privada para Noivos", href: "/contacto" },
        ],
        cta: { label: "CONHECER A ASSESSORIA", href: "/assessoria-eventos" },
      },
      {
        icon: Feather,
        title: "Convites & Identidade",
        links: [
          { label: "Convites Digitais Interactivos", href: "/convites-identidade-visual" },
          { label: "Direcção de Arte & Tipografia Exclusiva", href: "/convites-identidade-visual" },
          { label: "Pacotes Atelier, Signature e Private Suite", href: "/convites-identidade-visual#pacotes" },
          { label: "Gestão de Convidados & RSVP WhatsApp", href: "/gestao-convidados" },
        ],
        cta: { label: "EXPLORAR CONVITES", href: "/convites-identidade-visual" },
      },
    ],
    featuredCard: {
      badge: "EXPERIÊNCIA INTERACTIVA",
      title: "Style Quiz HAXR",
      subtitle: "Descubra a vossa assinatura estética e o pacote ideal em menos de 2 minutos.",
      image: "/images/portfolio/mosaic-mesa-detalhe-dourado.webp",
      href: "/style-quiz",
      cta: "INICIAR QUIZ GRATUITO",
    },
  },
  ferramentas: {
    headerLabel: "PLATAFORMA HAXR · FERRAMENTAS DE PLANEAMENTO",
    headerHref: "/ferramentas",
    headerCta: "VER HUB DE FERRAMENTAS →",
    columns: [
      {
        icon: CheckSquare,
        title: "Prazos & Convidados",
        links: [
          { label: "Checklist de Casamento por Data", href: "/tools/wedding-checklist" },
          { label: "Gestor de Lista & RSVP Online", href: "/tools/guest-list" },
          { label: "Calculadora de Orçamento & Custos", href: "/tools/budget-tracker" },
          { label: "Gestor de Fornecedores & Contratos", href: "/tools/vendor-manager" },
        ],
        cta: { label: "CRIAR CHECKLIST", href: "/tools/wedding-checklist" },
      },
      {
        icon: Layers,
        title: "Visão & Criatividade",
        links: [
          { label: "Calculadora de Bebidas & Catering", href: "/tools/calculadora-bebidas-catering" },
          { label: "Cronograma do Grande Dia (Run Sheet)", href: "/tools/cronograma-casamento" },
          { label: "Simulador de Layout & Mesas de Salão", href: "/tools/simulador-layout-salao" },
          { label: "Vision Boards & Moodboards Partilháveis", href: "/tools/vision-boards" },
        ],
        cta: { label: "SIMULAR LAYOUT", href: "/tools/simulador-layout-salao" },
      },
    ],
    featuredCard: {
      badge: "ASSISTENTE EXCLUSIVO",
      title: "HAXR Concierge",
      subtitle: "Centralize propostas, recibos e contratos de fornecedores num só cofre digital.",
      image: "/images/tools/concierge-bg.png",
      href: "/tools/haxr-concierge",
      cta: "ABRIR O CONCIERGE",
    },
  },
};

type NavMegaMenuProps = {
  groups: readonly NavGroup[];
  variant: NavVariant;
};

export default function NavMegaMenu({ groups, variant }: NavMegaMenuProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isHero = variant === "hero";

  const handleMouseEnter = (id: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpenId(id);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setOpenId(null);
    }, 140);
  };

  const handlePanelMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handlePanelMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setOpenId(null);
    }, 120);
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const triggerClass = (id: string) => {
    const open = openId === id;
    if (isHero) {
      return `relative inline-flex items-center gap-1.5 py-4 font-sans text-[11px] font-semibold tracking-[0.22em] uppercase transition-colors duration-300 cursor-pointer ${
        open ? "text-white" : "text-white/85 hover:text-white"
      }`;
    }
    return `relative inline-flex items-center gap-1.5 py-4 font-sans text-[11px] font-semibold tracking-[0.22em] uppercase transition-colors duration-300 cursor-pointer ${
      open ? "text-white" : "text-white/80 hover:text-white"
    }`;
  };

  const activeConfig = openId ? MEGA_MENU_CONFIGS[openId] : null;

  return (
    <div className="hidden lg:flex items-center gap-5 xl:gap-6">
      {groups.map((group) => {
        const isOpen = openId === group.id;
        return (
          <div
            key={group.id}
            className="relative"
            onMouseEnter={() => handleMouseEnter(group.id)}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              className={triggerClass(group.id)}
              aria-expanded={isOpen}
              aria-haspopup="true"
              onClick={() => setOpenId(isOpen ? null : group.id)}
            >
              <span>{group.label}</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-300 ${
                  isOpen ? "rotate-180 text-brand-gold" : "text-white/60"
                }`}
                strokeWidth={1.5}
              />

              {/* ── Underline Indicator (Padrão Loverly) ── */}
              {isOpen && (
                <motion.div
                  layoutId="nav-hover-line"
                  className="absolute bottom-2 left-0 right-0 h-[2px] bg-white rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          </div>
        );
      })}

      {/* ── Full-Width Mega Menu Panel (Padrão Vogue / Cartier) ── */}
      <AnimatePresence>
        {activeConfig && openId && (
          <motion.div
            key={openId}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onMouseEnter={handlePanelMouseEnter}
            onMouseLeave={handlePanelMouseLeave}
            className="fixed top-[4.25rem] md:top-[4.5rem] left-0 w-full z-40 bg-[#fbf9f6] border-b border-brand-champagne/45 shadow-[0_25px_60px_rgba(0,0,0,0.16)] backdrop-blur-md"
          >
            <div className="site-container-wide py-8 md:py-9">
              {/* ── Header Top Bar ── */}
              <div className="flex items-center justify-between pb-6 mb-7 border-b border-brand-champagne/35">
                <span className="font-mono text-[9px] md:text-[10px] font-bold uppercase tracking-[0.25em] text-brand-text-dark/60">
                  {activeConfig.headerLabel}
                </span>
                <Link
                  href={activeConfig.headerHref}
                  onClick={() => setOpenId(null)}
                  className="font-mono text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold hover:text-brand-gold-light hover:underline transition-colors"
                >
                  {activeConfig.headerCta}
                </Link>
              </div>

              {/* ── 3-Column Luxury Layout: 2 Link Columns + 1 Editorial Photo Card ── */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 xl:gap-10 items-stretch">
                {/* ── Colunas 1 e 2: Links Editoriais ── */}
                {activeConfig.columns.map((col) => {
                  const Icon = col.icon;
                  return (
                    <div
                      key={col.title}
                      className="md:col-span-4 space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3.5">
                        {/* Icon & Title */}
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-champagne/20 border border-brand-champagne/40 text-brand-gold">
                            <Icon className="h-4 w-4" strokeWidth={1.5} />
                          </div>
                          <h3 className="font-serif text-xl md:text-2xl font-light text-brand-text-dark">
                            {col.title}
                          </h3>
                        </div>

                        {/* List of sub-links */}
                        <ul className="space-y-2.5 pt-1">
                          {col.links.map((link) => (
                            <li key={link.href + link.label}>
                              <Link
                                href={link.href}
                                onClick={() => setOpenId(null)}
                                className="group inline-flex items-center text-xs md:text-[13px] font-light text-brand-text-dark/75 hover:text-brand-gold transition-colors leading-relaxed"
                              >
                                <span className="group-hover:translate-x-1 transition-transform duration-200">
                                  {link.label}
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Footer CTA Link with Arrow */}
                      <div className="pt-3 border-t border-brand-champagne/20">
                        <Link
                          href={col.cta.href}
                          onClick={() => setOpenId(null)}
                          className="group inline-flex items-center gap-1.5 font-mono text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-brand-text-dark hover:text-brand-gold transition-colors"
                        >
                          <span>{col.cta.label}</span>
                          <ArrowRight
                            className="h-3 w-3 transition-transform group-hover:translate-x-1 text-brand-gold"
                            strokeWidth={2}
                          />
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {/* ── Coluna 3: Card Editorial com Imagem (Padrão Vogue / Cartier) ── */}
                <div className="md:col-span-4 flex flex-col">
                  <Link
                    href={activeConfig.featuredCard.href}
                    onClick={() => setOpenId(null)}
                    className="group relative flex-1 min-h-[220px] rounded-2xl overflow-hidden border border-brand-champagne/45 shadow-sm hover:shadow-md transition-all duration-500 flex flex-col justify-end p-5 cursor-pointer"
                  >
                    {/* Background Photo */}
                    <div className="absolute inset-0 z-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeConfig.featuredCard.image}
                        alt={activeConfig.featuredCard.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/15 group-hover:via-black/50 transition-colors" />
                    </div>

                    {/* Card Content Overlay */}
                    <div className="relative z-10 space-y-2">
                      <span className="inline-block rounded-full border border-brand-gold/60 bg-brand-gold/20 px-2.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest text-brand-gold-light backdrop-blur-xs">
                        {activeConfig.featuredCard.badge}
                      </span>
                      <h4 className="font-serif text-lg md:text-xl font-medium text-white group-hover:text-brand-gold-light transition-colors">
                        {activeConfig.featuredCard.title}
                      </h4>
                      <p className="font-sans text-xs font-light text-white/80 line-clamp-2 leading-relaxed">
                        {activeConfig.featuredCard.subtitle}
                      </p>
                      <div className="pt-2">
                        <span className="inline-flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-widest text-brand-gold group-hover:text-white transition-colors">
                          <span>{activeConfig.featuredCard.cta}</span>
                          <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
