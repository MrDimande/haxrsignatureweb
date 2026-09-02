"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Building2,
  Camera,
  Coins,
  Compass,
  Crown,
  Feather,
  Gem,
  LayoutDashboard,
  Search,
  Utensils,
  Wine,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { searchCatalog, SITE_SEARCH_INDEX, type SearchItem } from "@/lib/search/search-index";

type NavSearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const POPULAR_SEARCH_TAGS = [
  { label: "Convites Digitais", query: "convites" },
  { label: "Assessoria Completa", query: "assessoria" },
  { label: "Calculadora de Bebidas", query: "bebidas" },
  { label: "Calculadora de Orçamento", query: "orcamento" },
  { label: "Fotógrafos em Maputo", query: "fotografia" },
  { label: "Style Quiz", query: "style quiz" },
  { label: "Espaços & Quintas", query: "espacos" },
  { label: "Checklist de Casamento", query: "checklist" },
];

const TOP_CATEGORIES = [
  { label: "Espaços & Quintas", href: "/fornecedores?category=espacos", icon: Building2 },
  { label: "Fotografia & Vídeo", href: "/fornecedores?category=fotografia", icon: Camera },
  { label: "Decoração & Flores", href: "/fornecedores?category=decoracao", icon: Feather },
  { label: "Catering & Bebidas", href: "/fornecedores?category=catering", icon: Utensils },
];

export default function NavSearchModal({ isOpen, onClose }: NavSearchModalProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Reset query and focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 60);
    }
  }, [isOpen]);

  // Global keyboard shortcuts (Cmd+K / Ctrl+K and Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          window.dispatchEvent(new CustomEvent("open-haxr-search"));
        }
      } else if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return searchCatalog(query);
  }, [query]);

  // Handle keyboard navigation in list
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = results[selectedIndex];
      if (selected) {
        router.push(selected.href);
        onClose();
      } else if (query.trim()) {
        router.push(`/fornecedores?q=${encodeURIComponent(query.trim())}`);
        onClose();
      }
    }
  };

  const handleSelect = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pesquisa Global HAXR Signature"
          className="fixed inset-0 z-100 flex flex-col justify-start"
        >
          {/* ── Backdrop com Blur Cinematográfico ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-brand-black/75 backdrop-blur-md cursor-pointer"
          />

          {/* ── Full-Width Integrated Header Search Panel (Padrão Loverly / Apple / Cartier) ── */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            className="relative w-full bg-[#fbf9f6] border-b border-brand-champagne/45 shadow-[0_30px_70px_rgba(0,0,0,0.3)] z-50 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Top Bar with Search Input ── */}
            <div className="border-b border-brand-champagne/35 bg-white/90">
              <div className="site-container-wide flex items-center h-20 md:h-24 gap-4">
                <Search
                  className="h-6 w-6 md:h-7 md:w-7 text-brand-gold shrink-0"
                  strokeWidth={1.5}
                />

                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Pesquisar por serviços, convites, fornecedores, guias, ferramentas..."
                  className="w-full bg-transparent font-serif text-lg sm:text-2xl md:text-3xl font-light text-brand-text-dark placeholder:text-brand-text-dark/30 focus:outline-none tracking-wide"
                />

                {query ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      inputRef.current?.focus();
                    }}
                    className="p-2 rounded-full text-brand-text-dark/40 hover:text-brand-text-dark transition-colors cursor-pointer"
                    aria-label="Limpar pesquisa"
                  >
                    <X className="h-5 w-5" />
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 rounded-full border border-brand-champagne/60 bg-brand-ivory/80 px-4 py-2 font-mono text-[10px] md:text-xs font-bold uppercase tracking-widest text-brand-text-dark hover:border-brand-gold hover:text-brand-gold transition-colors cursor-pointer shrink-0"
                >
                  <span>Fechar</span>
                  <kbd className="hidden sm:inline-block font-mono text-[9px] text-brand-text-dark/45">
                    ESC
                  </kbd>
                </button>
              </div>
            </div>

            {/* ── Search Body & Results ── */}
            <div className="site-container-wide py-8 md:py-10 max-h-[70vh] overflow-y-auto">
              {!query.trim() ? (
                /* ── Estado Inicial: Descoberta & Acessos Rápidos (Loverly Style) ── */
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
                  {/* Coluna 1: Pesquisas Populares */}
                  <div className="md:col-span-5 space-y-3">
                    <span className="font-mono text-[9px] md:text-[10px] font-bold uppercase tracking-[0.25em] text-brand-text-dark/50 block">
                      Pesquisas Populares
                    </span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {POPULAR_SEARCH_TAGS.map((tag) => (
                        <button
                          key={tag.label}
                          type="button"
                          onClick={() => {
                            setQuery(tag.query);
                            inputRef.current?.focus();
                          }}
                          className="rounded-full border border-brand-champagne/45 bg-white px-4 py-2 font-sans text-xs font-light text-brand-text-dark/80 hover:border-brand-gold hover:text-brand-gold hover:bg-brand-gold/5 transition-all cursor-pointer shadow-2xs"
                        >
                          {tag.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Coluna 2: Categorias de Fornecedores */}
                  <div className="md:col-span-4 space-y-3">
                    <span className="font-mono text-[9px] md:text-[10px] font-bold uppercase tracking-[0.25em] text-brand-text-dark/50 block">
                      Directório de Fornecedores
                    </span>
                    <div className="space-y-1.5 pt-1">
                      {TOP_CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        return (
                          <button
                            key={cat.label}
                            type="button"
                            onClick={() => handleSelect(cat.href)}
                            className="w-full flex items-center justify-between p-3 rounded-xl border border-brand-champagne/25 bg-white/70 hover:bg-white hover:border-brand-gold/50 transition-all cursor-pointer group text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-champagne/20 text-brand-gold">
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              <span className="font-serif text-sm font-medium text-brand-text-dark group-hover:text-brand-gold transition-colors">
                                {cat.label}
                              </span>
                            </div>
                            <ArrowRight className="h-3.5 w-3.5 text-brand-text-dark/30 group-hover:text-brand-gold group-hover:translate-x-1 transition-transform" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Coluna 3: Ferramentas & Atelier */}
                  <div className="md:col-span-3 space-y-3">
                    <span className="font-mono text-[9px] md:text-[10px] font-bold uppercase tracking-[0.25em] text-brand-text-dark/50 block">
                      Ferramentas HAXR
                    </span>
                    <div className="space-y-1.5 pt-1">
                      {[
                        { title: "Calculadora de Bebidas", href: "/tools/calculadora-bebidas-catering" },
                        { title: "Calculadora de Orçamento", href: "/tools/budget-tracker" },
                        { title: "Checklist por Data", href: "/tools/wedding-checklist" },
                        { title: "Style Quiz Interactvo", href: "/style-quiz" },
                      ].map((tool) => (
                        <button
                          key={tool.title}
                          type="button"
                          onClick={() => handleSelect(tool.href)}
                          className="w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-light text-brand-text-dark/75 hover:text-brand-gold hover:bg-white transition-colors text-left"
                        >
                          <span>{tool.title}</span>
                          <ArrowRight className="h-3 w-3 text-brand-gold opacity-0 hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : results.length > 0 ? (
                /* ── Estado com Resultados: Lista Dinâmica Organizada ── */
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-brand-champagne/30 pb-3">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-dark/60">
                      {results.length} {results.length === 1 ? "resultado encontrado" : "resultados encontrados"} para &ldquo;{query}&rdquo;
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1.5 font-mono text-[9px] text-brand-text-dark/45">
                      Navegue com <kbd className="px-1.5 py-0.5 rounded bg-zinc-200/80">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-zinc-200/80">↓</kbd> e pressione <kbd className="px-1.5 py-0.5 rounded bg-zinc-200/80">Enter</kbd>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3" role="listbox">
                    {results.map((item, idx) => {
                      const isSelected = idx === selectedIndex;
                      return (
                        <div
                          key={item.id}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleSelect(item.href)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`group flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? "border-brand-gold bg-white shadow-sm -translate-y-0.5"
                              : "border-brand-champagne/30 bg-white/70 hover:bg-white hover:border-brand-gold/40"
                          }`}
                        >
                          <div className="space-y-1.5 pr-3">
                            <div className="flex items-center gap-2">
                              <span className="font-serif text-base md:text-lg font-medium text-brand-text-dark group-hover:text-brand-gold transition-colors">
                                {item.title}
                              </span>
                              <span className="rounded-full border border-brand-champagne/50 bg-brand-ivory px-2.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider text-brand-gold">
                                {item.categoryLabel}
                              </span>
                            </div>
                            <p className="font-sans text-xs font-light text-brand-text-dark/70 line-clamp-1 leading-relaxed">
                              {item.description}
                            </p>
                          </div>

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-champagne/20 text-brand-gold group-hover:bg-brand-gold group-hover:text-brand-black transition-colors">
                            <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* ── Estado Vazio: Nenhum Resultado ── */
                <div className="py-12 text-center space-y-4 max-w-xl mx-auto">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-champagne/25 text-brand-gold">
                    <Search className="h-6 w-6" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-serif text-xl md:text-2xl font-light text-brand-text-dark">
                    Nenhum resultado direto para &ldquo;{query}&rdquo;
                  </h3>
                  <p className="font-sans text-xs sm:text-sm font-light text-brand-text-dark/65 leading-relaxed">
                    Não encontramos uma página com este termo exato. Gostaria de pesquisar diretamente no nosso directório de fornecedores de casamento em Maputo?
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleSelect(`/fornecedores?q=${encodeURIComponent(query.trim())}`)}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand-black px-6 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-white hover:bg-zinc-800 transition-colors cursor-pointer shadow-sm"
                    >
                      <span>Pesquisar Fornecedores por &ldquo;{query}&rdquo;</span>
                      <ArrowRight className="h-3.5 w-3.5 text-brand-gold" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
