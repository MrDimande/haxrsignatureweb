"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, FileText, Check,
  ChevronRight, CheckCheck
} from "lucide-react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

export default function HomeToolsGrid() {
  const tools = [
    {
      id: "concierge",
      title: "HAXR Concierge™",
      description: "Triagem inteligente de propostas, facturas e comprovativos por email ou WhatsApp, integrados directamente no vosso painel operacional.",
      image: "/images/tools/concierge-bg.png",
      cta: "Começar Agora",
      href: "/contacto",
      overlay: (
        <div className="absolute inset-x-4 bottom-4 md:bottom-6 bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-white/20 shadow-lg space-y-2.5 text-left text-[8px] md:text-[10px] text-brand-text-dark font-sans">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
            <div className="bg-red-50 text-red-600 p-1.5 rounded-sm">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate">Factura_Catering.pdf</p>
              <p className="text-[7px] text-zinc-400">PDF Document · 145 KB</p>
            </div>
          </div>
          <div className="flex gap-2 justify-between">
            <span className="bg-brand-gold/10 text-brand-gold px-2.5 py-0.5 rounded-full font-mono text-[7px] font-semibold">Concierge Activo</span>
            <span className="text-emerald-600 flex items-center gap-0.5 font-medium text-[7.5px]">✓ Importado</span>
          </div>
        </div>
      )
    },
    {
      id: "guest-list",
      title: "Gestor de Convidados",
      description: "Construção e gestão da lista de convidados, grupos familiares, restrições alimentares e acompanhamento de confirmações RSVP em tempo real.",
      image: "/images/tools/guest-list-bg.png",
      cta: "Gerir Convidados",
      href: "/tools/guest-list",
      overlay: (
        <div className="absolute inset-x-4 bottom-4 md:bottom-6 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-white/20 shadow-lg space-y-2 text-left text-[8px] md:text-[10px] text-brand-text-dark font-sans">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-1.5">
            <span className="font-medium text-brand-text-dark/70">Mesa 1 · Sofia Antunes</span>
            <span className="text-brand-gold font-mono font-bold text-[7px] bg-brand-gold/10 px-1.5 py-0.5 rounded-xs">Noiva</span>
          </div>
          <div className="flex items-center justify-between text-[7px] md:text-[9px]">
            <span className="font-light text-zinc-500">Confirmação de Presença</span>
            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-mono font-semibold flex items-center gap-0.5">
              <Check className="w-2.5 h-2.5" /> Confirmado
            </span>
          </div>
        </div>
      )
    },
    {
      id: "vendor-manager",
      title: "Gestor de Fornecedores",
      description: "Registo centralizado de contactos, propostas, contratos e acompanhamento minucioso de pagamentos efectuados a fornecedores.",
      image: "/images/tools/vendor-manager-bg.png",
      cta: "Gerir Fornecedores",
      href: "/tools/vendor-manager",
      overlay: (
        <div className="absolute inset-x-4 bottom-4 md:bottom-6 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-white/20 shadow-lg space-y-2 text-left text-[8px] md:text-[10px] text-brand-text-dark font-sans">
          <div className="space-y-0.5">
            <span className="block text-[7px] text-zinc-400 font-mono uppercase tracking-wider">Espaço Seleccionado</span>
            <h5 className="font-serif text-[9px] md:text-[11px] font-bold text-brand-text-dark">Polana Serena Hotel</h5>
            <p className="text-zinc-500 font-light text-[7px] md:text-[8px]">Av. da Marginal, Maputo</p>
          </div>
          <div className="flex justify-between items-center border-t border-zinc-100 pt-1.5 text-[7px] md:text-[9px]">
            <span className="text-zinc-500">Estado do Sinal</span>
            <span className="border border-brand-gold/45 text-brand-gold px-2 py-0.5 rounded-sm font-mono font-semibold bg-brand-gold/5 flex items-center gap-0.5">
              <Check className="w-2.5 h-2.5" /> Sinal Pago
            </span>
          </div>
        </div>
      )
    },
    {
      id: "budget-tracker",
      title: "Gestor de Orçamento",
      description: "Planeamento orçamental minucioso em meticais (MT), controlo de estimativas e pagamentos para manter cada capítulo financeiro seguro.",
      image: "/images/tools/budget-tracker-bg.png",
      cta: "Organizar Orçamento",
      href: "/tools/budget-tracker",
      overlay: (
        <div className="absolute inset-x-4 bottom-4 md:bottom-6 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-white/20 shadow-lg space-y-2 text-left text-[8px] md:text-[10px] text-brand-text-dark font-sans">
          <div className="flex justify-between items-start border-b border-zinc-100 pb-1.5">
            <div>
              <p className="font-semibold text-brand-text-dark">Vestido de Noiva</p>
              <p className="text-[7px] text-zinc-400 font-light">Categoria: Vestuário</p>
            </div>
            <span className="font-bold text-brand-text-dark">150.000 MT</span>
          </div>
          <div className="flex justify-between text-[7.5px] md:text-[9px] font-mono">
            <span className="text-zinc-400">Disponível:</span>
            <span className="text-brand-gold font-bold">296.600 MT</span>
          </div>
        </div>
      )
    }
  ];

  return (
    <section className="relative py-20 md:py-28 bg-[#FAF8F5] overflow-hidden border-b border-brand-champagne/15">

      {/* Decorative backdrop glow */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 40% at 50% 10%, rgba(184,138,42,0.1), transparent)"
        }}
      />

      <div className="site-container-wide relative z-10">

        {/* Section Header with Carousel Navigation styling */}
        <RevealOnScroll className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 md:mb-16 gap-6">
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-2.5 text-brand-gold">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 text-brand-gold shrink-0">
                <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9Z" />
              </svg>
              <span className="font-mono text-[9px] uppercase tracking-widest font-bold">Painel de Planeamento</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl font-light text-brand-text-dark leading-tight">
              As Vossas Ferramentas de Casamento
            </h2>
          </div>

          {/* Decorative Carousel Control Arrows (matching reference layout) */}
          <div className="flex gap-3 shrink-0 select-none">
            <button
              type="button"
              className="w-10 h-10 rounded-full border border-brand-text-dark/15 flex items-center justify-center text-brand-text-dark/40 hover:text-brand-text-dark hover:border-brand-text-dark/40 bg-transparent transition-all cursor-pointer"
              aria-label="Anterior"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className="w-10 h-10 rounded-full border border-brand-text-dark/15 flex items-center justify-center text-brand-text-dark hover:border-brand-text-dark/40 bg-transparent transition-all cursor-pointer"
              aria-label="Seguinte"
            >
              <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </RevealOnScroll>

        {/* 4-Card Row Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {tools.map((tool, index) => (
            <RevealOnScroll key={tool.id} delay={index * 0.05} className="flex flex-col">
              <div className="group flex flex-col h-full bg-transparent text-left">

                {/* 1. Card Image Container with overlay */}
                <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden shadow-[0_15px_35px_rgba(8,7,6,0.15)] group-hover:shadow-[0_20px_45px_rgba(8,7,6,0.22)] transform group-hover:-translate-y-1 transition-all duration-500 mb-6 bg-zinc-900 border border-brand-champagne/20">
                  <Image
                    src={tool.image}
                    alt={tool.title}
                    fill
                    className="object-cover object-center group-hover:scale-103 transition-transform duration-700"
                    quality={90}
                  />

                  {/* Subtle dark vignette over card image */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

                  {/* Glass Card Overlay Content */}
                  {tool.overlay}
                </div>

                {/* 2. Title & Description */}
                <div className="flex-1 space-y-3 px-2 flex flex-col justify-between">
                  <div className="space-y-3">
                    <h3 className="font-serif text-xl sm:text-2xl font-light italic text-brand-text-dark tracking-wide">
                      {tool.title}
                    </h3>
                    <p className="font-sans text-xs md:text-sm text-brand-text-dark/75 leading-relaxed font-light">
                      {tool.description}
                    </p>
                  </div>

                  {/* 3. Link CTA Button */}
                  <div className="pt-4">
                    <Link
                      href={tool.href}
                      className="inline-flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase font-bold text-brand-text-dark hover:text-brand-gold transition-colors pb-1 border-b border-brand-text-dark/25 hover:border-brand-gold cursor-pointer"
                    >
                      <span>{tool.cta}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

              </div>
            </RevealOnScroll>
          ))}
        </div>

      </div>
    </section>
  );
}
