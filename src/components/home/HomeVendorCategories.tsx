"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

export default function HomeVendorCategories() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const categories = [
    {
      id: "venues",
      label: "Espaços de Casamento",
      englishLabel: "Wedding Venue",
      image: "/images/categories/venue.png",
      href: "/fornecedores?category=venues"
    },
    {
      id: "photographers",
      label: "Fotógrafos de Casamento",
      englishLabel: "Wedding Photographer",
      image: "/images/categories/photographer.png",
      href: "/fornecedores?category=photographers"
    },
    {
      id: "florists",
      label: "Floristas e Decoração",
      englishLabel: "Wedding Florist",
      image: "/images/categories/florist.png",
      href: "/fornecedores?category=florists"
    },
    {
      id: "planners",
      label: "Assessores de Casamento",
      englishLabel: "Wedding Planner",
      image: "/images/categories/planner.png",
      href: "/fornecedores?category=planners"
    },
    {
      id: "videographers",
      label: "Videógrafos de Casamento",
      englishLabel: "Videographer",
      image: "/images/categories/videographer.png",
      href: "/fornecedores?category=videographers"
    },
    {
      id: "caterers",
      label: "Serviço de Catering",
      englishLabel: "Caterer",
      image: "/images/categories/caterer.png",
      href: "/fornecedores?category=caterers"
    },
    {
      id: "cakes",
      label: "Bolos e Doces Finos",
      englishLabel: "Wedding Cake and Dessert",
      image: "/images/categories/cake.png",
      href: "/fornecedores?category=cakes"
    },
    {
      id: "stationery",
      label: "Estacionário e Convites",
      englishLabel: "Stationery",
      image: "/images/categories/stationery.png",
      href: "/fornecedores?category=stationery"
    }
  ];

  // Filter categories dynamically based on query
  const filteredCategories = categories.filter((cat) =>
    cat.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.englishLabel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/fornecedores?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/fornecedores");
    }
  };

  return (
    <section className="relative py-20 md:py-28 bg-[#FAF8F5]">
      <div className="site-container-wide mx-auto text-center">

        {/* Header Section */}
        <RevealOnScroll className="max-w-2xl mx-auto space-y-4 mb-10">
          <div className="inline-flex items-center gap-2.5 text-brand-gold justify-center">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 text-brand-gold shrink-0">
              <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9Z" />
            </svg>
            <span className="font-mono text-[9px] uppercase tracking-widest font-bold">Directório de Fornecedores</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl font-light text-brand-text-dark leading-tight">
            Descubra a Vossa Equipa de Sonho
          </h2>

          <p className="font-sans text-sm md:text-base text-brand-text-dark/70 leading-relaxed font-light">
            Procura os melhores profissionais de casamentos? Explore a nossa seleção com curadoria dos melhores fornecedores e empresas em Moçambique.
          </p>
        </RevealOnScroll>

        {/* Dynamic Search Bar (Matches Loverly search functionality) */}
        <RevealOnScroll delay={0.05} className="max-w-md mx-auto mb-16 px-4">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center bg-[#eae3d8]/40 border border-brand-champagne/45 rounded-full px-5 py-3 hover:border-brand-gold/45 focus-within:border-brand-gold focus-within:bg-white transition-all shadow-xs">
            <Search className="w-4 h-4 text-brand-text-dark/40 mr-3 shrink-0" />
            <input
              type="text"
              placeholder="Pesquisar fornecedores (ex: Fotógrafos, Espaços)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none w-full font-sans text-xs md:text-sm text-brand-text-dark placeholder-brand-text-dark/45"
            />
            <button type="submit" className="hidden" aria-label="Pesquisar" />
          </form>
        </RevealOnScroll>

        {/* Grid Categories Layout */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((cat, index) => (
              <RevealOnScroll key={cat.id} delay={index * 0.04}>
                <Link href={cat.href} className="group block text-left">

                  {/* Category Image Container */}
                  <div className="relative aspect-square rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-[0_12px_28px_rgba(8,7,6,0.06)] group-hover:shadow-[0_18px_40px_rgba(8,7,6,0.12)] hover:-translate-y-0.5 transition-all duration-500 bg-zinc-100 border border-brand-champagne/15">
                    <Image
                      src={cat.image}
                      alt={cat.label}
                      fill
                      className="object-cover object-center group-hover:scale-102 transition-transform duration-750"
                      quality={90}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>

                  {/* Serif Category Label */}
                  <h3 className="font-serif text-base md:text-xl font-light italic text-brand-text-dark/95 group-hover:text-brand-gold transition-colors duration-300 mt-4 pl-1">
                    {cat.label}
                  </h3>
                </Link>
              </RevealOnScroll>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-brand-text-dark/45 font-sans text-sm font-light">
              Nenhuma categoria de fornecedores encontrada para &quot;{searchQuery}&quot;.
            </div>
          )}
        </div>

        {/* See All CTA Button */}
        <RevealOnScroll delay={0.1} className="mt-16">
          <Link
            href="/fornecedores"
            className="inline-flex items-center gap-2.5 bg-brand-text-dark hover:bg-brand-gold text-white font-mono text-[9px] md:text-[10px] tracking-widest uppercase font-bold py-4 px-8 rounded-full shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
          >
            <span>Ver Todos os Fornecedores</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </RevealOnScroll>

      </div>
    </section>
  );
}
