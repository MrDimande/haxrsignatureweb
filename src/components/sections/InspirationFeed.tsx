"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { magazineAssets } from "@/lib/assets";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

type CategoryId = "todas" | "assessoria" | "design" | "tendencias" | "casamentos";

interface InspirationItem {
  id: string;
  category: CategoryId;
  tag: string;
  title: string;
  excerpt: string;
  image: string;
  href: string;
  actionLabel: string;
}

const inspirationItems: InspirationItem[] = [
  {
    id: "feed-1",
    category: "assessoria",
    tag: "O PAPEL DO ASSESSOR",
    title: "O que faz um Assessor de Casamentos e por que é a alma da celebração?",
    excerpt: "Muito além da escolha de flores e fornecedores. Como o assessor HAXR actua na gestão de riscos, blindagem do orçamento e na garantia de serenidade para o casal.",
    image: magazineAssets.capaAssessor,
    href: "/assessoria-eventos",
    actionLabel: "Ler Artigo de Assessoria",
  },
  {
    id: "feed-2",
    category: "casamentos",
    tag: "SELEÇÃO HAXR TOPS",
    title: "Os Casamentos mais Icónicos e Exclusivos com a Assinatura HAXR",
    excerpt: "Conheça os projectos de referência que redefiniram o luxo e a excelência em Moçambique, das praias de Vilankulos aos salões nobres de Maputo.",
    image: magazineAssets.capaCasamentosTops,
    href: "/portfolio",
    actionLabel: "Ver Casamentos Tops",
  },
  {
    id: "feed-3",
    category: "tendencias",
    tag: "CURIOSIDADES DO PLANEAMENTO",
    title: "Segredos de Bastidores: O que não se conta sobre organizar celebrações de luxo",
    excerpt: "As horas invisíveis de coordenação técnica, a gestão minuciosa de timings e as soluções rápidas que mantêm a harmonia perfeita longe dos olhos dos convidados.",
    image: magazineAssets.capaSegredosPlaneamento,
    href: "/sobre",
    actionLabel: "Descobrir Segredos",
  },
  {
    id: "feed-4",
    category: "design",
    tag: "BASTIDORES & MONTAGEM",
    title: "Dos Esboços à Realidade: Como a visão ganha vida no dia do evento",
    excerpt: "Acompanhe a complexa logística de coordenação com mais de 30 fornecedores locais para construir cenografias e decorações de alto impacto técnico.",
    image: magazineAssets.capaBastidoresMontagem,
    href: "/plataforma-eventos",
    actionLabel: "Ver Bastidores",
  },
];

export default function InspirationFeed() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("todas");

  const categories = [
    { id: "todas", label: "Tudo" },
    { id: "assessoria", label: "Assessoria & Planeamento" },
    { id: "design", label: "Convites & Identidade" },
    { id: "tendencias", label: "Tendências & Estética" },
    { id: "casamentos", label: "Casamentos Reais" },
  ] as const;

  const filteredItems = activeCategory === "todas"
    ? inspirationItems
    : inspirationItems.filter((item) => item.category === activeCategory);

  return (
    <section
      id="inspiracao-servicos"
      className="relative py-28 md:py-36 bg-[#FCFBF9] overflow-hidden border-b border-brand-champagne/15"
    >
      <div className="site-container-wide mx-auto">

        {/* Cabeçalho Editorial */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10 mb-20 border-b border-brand-champagne/20 pb-8">
          <div className="max-w-2xl text-left">
            <RevealOnScroll className="space-y-3">
              <div className="flex items-center gap-2.5 text-brand-gold">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 text-brand-gold shrink-0">
                  <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9Z" />
                </svg>
                <span className="font-mono text-[9px] uppercase tracking-[0.38em] font-bold text-brand-gold">O Editorial</span>
              </div>

              <div className="relative pt-2">
                <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-brand-text-dark leading-tight">
                  Inspiração & Serviços Curados
                </h2>
                <p className="font-signature text-3xl text-brand-gold/55 absolute -top-5 left-48 pointer-events-none select-none">
                  A Revista
                </p>
              </div>
            </RevealOnScroll>
          </div>

          {/* Abas de Categorias Minimalistas (Estilo Revista de Alta Moda) */}
          <div className="flex flex-wrap gap-x-8 gap-y-4 shrink-0 select-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`font-mono text-[10px] tracking-[0.25em] uppercase pb-2 border-b-2 transition-all duration-500 cursor-pointer ${
                  activeCategory === cat.id
                    ? "text-brand-gold border-brand-gold font-medium"
                    : "text-brand-text-dark/45 border-transparent hover:text-brand-text-dark/80"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grelha de Artigos e Serviços */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-20 lg:gap-x-16 lg:gap-y-24">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.article
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
                className="group flex flex-col justify-between bg-transparent text-left relative"
              >
                {/* Capa do Artigo */}
                <div className="aspect-[16/10] relative overflow-hidden bg-zinc-100 rounded-sm shadow-xs mb-8">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover group-hover:scale-102 transition-transform duration-[1.2s] ease-out"
                  />
                  <div className="absolute top-4 left-4 bg-brand-text-dark/95 backdrop-blur-xs text-brand-gold font-mono text-[8px] tracking-[0.25em] uppercase font-bold py-1.5 px-3.5 rounded-xs z-10">
                    {item.tag}
                  </div>
                </div>

                {/* Conteúdo Editorial */}
                <div className="flex-1 flex flex-col justify-between">
                  <div className="space-y-3.5">
                    <h3 className="font-serif text-xl sm:text-2xl font-light text-brand-text-dark leading-snug group-hover:text-brand-gold transition-colors duration-500">
                      {item.title}
                    </h3>
                    <p className="font-sans text-xs md:text-sm text-brand-text-dark/65 leading-relaxed font-light">
                      {item.excerpt}
                    </p>
                  </div>

                  <div className="mt-8 pt-5 border-t border-brand-champagne/30">
                    <Link
                      href={item.href}
                      className="inline-flex items-center gap-2 font-mono text-[9px] tracking-[0.3em] uppercase text-brand-gold/90 hover:text-brand-gold font-semibold transition-colors duration-300 w-full"
                    >
                      <span>{item.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.5} />
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
