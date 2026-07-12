"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { portfolioAssets } from "@/lib/assets";
import { CategoryId } from "./CategoryTabs";

interface FavoriteItem {
  id: string;
  title: string;
  category: string;
  image: string;
}

interface ShowcaseItem {
  id: string;
  category: CategoryId;
  categoryLabel: string;
  title: string;
  subtitle: string;
  images: string[];
  rating: string;
  price: string;
  href: string;
}

const showcaseItems: ShowcaseItem[] = [
  {
    id: "assessoria-completa",
    category: "assessoria",
    categoryLabel: "Assessoria",
    title: "Assessoria Completa Signature",
    subtitle: "Organização total de ponta a ponta",
    images: [portfolioAssets.casamentoSignature, portfolioAssets.celebracaoPrivada, portfolioAssets.saveTheDate],
    rating: "5.0 (24 noivas)",
    price: "Sob consulta",
    href: "/assessoria-eventos",
  },
  {
    id: "assessoria-parcial",
    category: "assessoria",
    categoryLabel: "Assessoria",
    title: "Assessoria Parcial & Coordenação",
    subtitle: "Rigor operacional para a fase final",
    images: [portfolioAssets.celebracaoPrivada, portfolioAssets.saveTheDate, portfolioAssets.casamentoSignature],
    rating: "4.9 (12 noivas)",
    price: "Desde 1.800 €",
    href: "/assessoria-eventos",
  },
  {
    id: "convites-premium",
    category: "convites",
    categoryLabel: "Convites",
    title: "Convites Digitais Premium",
    subtitle: "Design editorial e experiência imersiva",
    images: [portfolioAssets.convitePreviewPortrait, portfolioAssets.saveTheDate, portfolioAssets.casamentoSignature],
    rating: "5.0 (42 reviews)",
    price: "Desde 450 €",
    href: "/convites-identidade-visual",
  },
  {
    id: "save-the-date",
    category: "convites",
    categoryLabel: "Convites",
    title: "Save the Date Editorial",
    subtitle: "A primeira reserva de data digital",
    images: [portfolioAssets.saveTheDate, portfolioAssets.convitePreviewPortrait, portfolioAssets.celebracaoPrivada],
    rating: "5.0 (8 reviews)",
    price: "Desde 250 €",
    href: "/convites-identidade-visual",
  },
  {
    id: "websites-custom",
    category: "websites",
    categoryLabel: "Websites",
    title: "Website de Casamento Custom",
    subtitle: "Plataforma digital integrada elegante",
    images: [portfolioAssets.casamentoSignature, portfolioAssets.convitePreviewPortrait, portfolioAssets.saveTheDate],
    rating: "4.9 (18 casais)",
    price: "Desde 650 €",
    href: "/plataforma-eventos",
  },
  {
    id: "rsvp-digital",
    category: "rsvp",
    categoryLabel: "RSVP",
    title: "RSVP Inteligente & Controlo",
    subtitle: "Gestão inteligente de presenças",
    images: [portfolioAssets.celebracaoPrivada, portfolioAssets.casamentoSignature, portfolioAssets.saveTheDate],
    rating: "5.0 (32 eventos)",
    price: "Desde 300 €",
    href: "/gestao-convidados",
  },
  {
    id: "identidade-visual",
    category: "identidade",
    categoryLabel: "Identidade Visual",
    title: "Identidade Visual de Assinatura",
    subtitle: "Monogramas, paletas e direção artística",
    images: [portfolioAssets.saveTheDate, portfolioAssets.convitePreviewPortrait, portfolioAssets.casamentoSignature],
    rating: "5.0 (15 reviews)",
    price: "Desde 800 €",
    href: "/convites-identidade-visual",
  },
  {
    id: "case-vania-fabiao",
    category: "portfolio",
    categoryLabel: "Casamentos Reais",
    title: "Casamento Vânia & Fabião",
    subtitle: "Celebração exclusiva em Maputo",
    images: [portfolioAssets.casamentoSignature, portfolioAssets.celebracaoPrivada, portfolioAssets.saveTheDate],
    rating: "5.0 HAXR Classic",
    price: "Caso Real",
    href: "/portfolio",
  },
];

interface ShowcaseGridProps {
  activeCategory: CategoryId;
}

export default function ShowcaseGrid({ activeCategory }: ShowcaseGridProps) {
  const [favorites, setFavorites] = useState<string[]>([]);

  // Carregar favoritos iniciais do localStorage
  useEffect(() => {
    const stored = localStorage.getItem("haxr-favorites");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { id: string }[];
        setFavorites(parsed.map((item) => item.id));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const toggleFavorite = (item: ShowcaseItem) => {
    let updatedIds: string[];
    let updatedItems: FavoriteItem[];

    const stored = localStorage.getItem("haxr-favorites");
    let currentFavorites: FavoriteItem[] = [];
    if (stored) {
      try {
        currentFavorites = JSON.parse(stored) as FavoriteItem[];
      } catch {
        currentFavorites = [];
      }
    }

    if (favorites.includes(item.id)) {
      updatedIds = favorites.filter((id) => id !== item.id);
      updatedItems = currentFavorites.filter((fav) => fav.id !== item.id);
    } else {
      updatedIds = [...favorites, item.id];
      updatedItems = [
        ...currentFavorites,
        {
          id: item.id,
          title: item.title,
          category: item.categoryLabel,
          image: item.images[0],
        },
      ];
    }

    localStorage.setItem("haxr-favorites", JSON.stringify(updatedItems));
    setFavorites(updatedIds);
    window.dispatchEvent(new Event("haxr-favorites-updated"));
  };

  const filteredItems = activeCategory === "todas"
    ? showcaseItems
    : showcaseItems.filter((item) => item.category === activeCategory);

  return (
    <section className="relative py-12 md:py-16 bg-brand-ivory">
      <div className="site-container mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.45 }}
                className="group flex flex-col relative"
              >
                {/* Card Top: Carrossel de Imagens */}
                <CardCarousel images={item.images} title={item.title} toggleFavorite={() => toggleFavorite(item)} isFavorite={favorites.includes(item.id)} />

                {/* Card Bottom: Informações (Estilo Airbnb) */}
                <Link href={item.href} className="mt-3 block">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-serif text-sm font-light text-brand-text-dark group-hover:text-brand-gold transition-colors duration-300 truncate">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-1 shrink-0 text-xs text-brand-text-dark/90">
                      <Star className="w-3 h-3 text-brand-gold fill-brand-gold" />
                      <span className="font-mono text-[10px]">{item.rating.split(" ")[0]}</span>
                    </div>
                  </div>

                  <p className="font-sans text-xs text-brand-text-dark/50 leading-relaxed font-light truncate mt-1">
                    {item.subtitle}
                  </p>

                  <p className="font-sans text-xs text-brand-text-dark/80 font-medium mt-2">
                    {item.price}
                  </p>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* Sub-componente Carrossel Interno de cada Cartão */
interface CardCarouselProps {
  images: string[];
  title: string;
  isFavorite: boolean;
  toggleFavorite: () => void;
}

function CardCarousel({ images, title, isFavorite, toggleFavorite }: CardCarouselProps) {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);

  const prevStep = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextStep = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div
      className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-brand-champagne/10 border border-brand-champagne/25 shadow-sm"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Imagem Atual */}
      <div className="relative w-full h-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[index]}
          alt={`${title} - foto ${index + 1}`}
          className="object-cover w-full h-full group-hover:scale-[1.02] transition-transform duration-700"
        />
      </div>

      {/* Botões de Direção (Chevron) */}
      <AnimatePresence>
        {hovered && (
          <>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={prevStep}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-white/95 border border-brand-champagne/50 p-1.5 rounded-full shadow-md hover:scale-105 active:scale-95 transition-all z-10 cursor-pointer flex items-center justify-center"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-brand-text-dark/85" />
            </motion.button>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={nextStep}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-white/95 border border-brand-champagne/50 p-1.5 rounded-full shadow-md hover:scale-105 active:scale-95 transition-all z-10 cursor-pointer flex items-center justify-center"
              aria-label="Próxima foto"
            >
              <ChevronRight className="w-3.5 h-3.5 text-brand-text-dark/85" />
            </motion.button>
          </>
        )}
      </AnimatePresence>

      {/* Coração de Favorito */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleFavorite();
        }}
        className="absolute right-3 top-3 z-10 p-2 rounded-full cursor-pointer transition-transform active:scale-90"
        aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      >
        <Heart
          className={`w-5 h-5 transition-colors duration-300 drop-shadow-md ${
            isFavorite ? "fill-brand-gold text-brand-gold scale-110" : "text-white fill-black/25 hover:scale-105"
          }`}
        />
      </button>

      {/* Pontos Indicadores do Carrossel */}
      <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 z-10">
        {images.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index ? "w-3 bg-white" : "w-1.5 bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
