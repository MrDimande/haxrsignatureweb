"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type CategoryId = "todas" | "assessoria" | "convites" | "websites" | "rsvp" | "identidade" | "portfolio";

interface Category {
  id: CategoryId;
  label: string;
  icon: string;
}

const categories: Category[] = [
  { id: "todas", label: "Ver Tudo", icon: "✨" },
  { id: "assessoria", label: "Assessoria", icon: "🏰" },
  { id: "convites", label: "Convites", icon: "✉️" },
  { id: "websites", label: "Websites", icon: "💻" },
  { id: "rsvp", label: "RSVP", icon: "📋" },
  { id: "identidade", label: "Identidade Visual", icon: "🎨" },
  { id: "portfolio", label: "Casamentos Reais", icon: "📸" },
];

interface CategoryTabsProps {
  activeCategory: CategoryId;
  onSelectCategory: (id: CategoryId) => void;
}

export default function CategoryTabs({ activeCategory, onSelectCategory }: CategoryTabsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollAmount = 200;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative w-full border-b border-brand-champagne/45 bg-brand-ivory/80 backdrop-blur-md sticky top-[4.25rem] md:top-[4.5rem] z-40 pointer-events-auto">
      <div className="site-container mx-auto flex items-center relative py-3">

        {/* Seta Esquerda */}
        <button
          type="button"
          onClick={() => scroll("left")}
          className="absolute left-2 bg-white/90 border border-brand-champagne/50 p-1.5 rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all z-10 cursor-pointer hidden md:flex items-center justify-center"
          aria-label="Deslizar para a esquerda"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-brand-text-dark/80" />
        </button>

        {/* Scroll Container */}
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-8 md:gap-12 overflow-x-auto no-scrollbar w-full px-2 md:px-10 scroll-smooth snap-x"
        >
          {categories.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className="flex flex-col items-center gap-1.5 py-1 px-1.5 shrink-0 select-none cursor-pointer group snap-start relative"
              >
                <span className={`text-base md:text-lg transition-transform duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-105 opacity-70'}`}>
                  {cat.icon}
                </span>
                <span className={`font-mono text-[9px] tracking-wider uppercase transition-colors duration-300 ${
                  isSelected ? "text-brand-gold font-semibold" : "text-brand-text-dark/60 group-hover:text-brand-text-dark/95"
                }`}>
                  {cat.label}
                </span>

                {/* Linha Ativa */}
                {isSelected && (
                  <div className="absolute bottom-[-13px] left-0 right-0 h-[2px] bg-brand-gold rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Seta Direita */}
        <button
          type="button"
          onClick={() => scroll("right")}
          className="absolute right-2 bg-white/90 border border-brand-champagne/50 p-1.5 rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all z-10 cursor-pointer hidden md:flex items-center justify-center"
          aria-label="Deslizar para a direita"
        >
          <ChevronRight className="w-3.5 h-3.5 text-brand-text-dark/80" />
        </button>
      </div>
    </div>
  );
}
