"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Search, MapPin, Star, Heart, SlidersHorizontal, X } from "lucide-react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { VENDORS, VENDOR_CATEGORIES, type Vendor } from "@/lib/marketing/vendors-data";

type StoredFavorite = {
  id: string;
  title: string;
  category: string;
  image: string;
};

function FornecedoresContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Search and filter states initialized from query params
  const [searchQuery, setSearchQuery] = useState(searchParams ? (searchParams.get("q") || "") : "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams ? (searchParams.get("category") || "all") : "all");
  const [selectedPrice, setSelectedPrice] = useState("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Keep state in sync with URL changes
  useEffect(() => {
    if (searchParams) {
      setSearchQuery(searchParams.get("q") || "");
      setSelectedCategory(searchParams.get("category") || "all");
    }
  }, [searchParams]);

  // Load favorites from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("haxr-favorites");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setFavorites(parsed.map((item: StoredFavorite) => item.id));
      } catch {
        setFavorites([]);
      }
    }
  }, []);

  // Update favorites logic (toggle)
  const toggleFavorite = (e: React.MouseEvent, vendor: Vendor) => {
    e.preventDefault();
    e.stopPropagation();

    const stored = localStorage.getItem("haxr-favorites");
    let currentFavorites: StoredFavorite[] = [];
    try {
      currentFavorites = stored ? JSON.parse(stored) : [];
    } catch {
      currentFavorites = [];
    }

    const isFav = currentFavorites.some((item) => item.id === vendor.id);
    let updatedFavorites;

    if (isFav) {
      updatedFavorites = currentFavorites.filter((item) => item.id !== vendor.id);
      setFavorites(favorites.filter((id) => id !== vendor.id));
    } else {
      const newItem = {
        id: vendor.id,
        title: vendor.name,
        category: VENDOR_CATEGORIES.find((c) => c.id === vendor.category)?.label || vendor.category,
        image: vendor.imageCover,
      };
      updatedFavorites = [...currentFavorites, newItem];
      setFavorites([...favorites, vendor.id]);
    }

    localStorage.setItem("haxr-favorites", JSON.stringify(updatedFavorites));
    window.dispatchEvent(new Event("haxr-favorites-updated"));
  };

  // Filter vendors based on active criteria
  const filteredVendors = VENDORS.filter((vendor) => {
    const matchesSearch =
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.services.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "all" || vendor.category === selectedCategory;

    const matchesPrice =
      selectedPrice === "all" ||
      (selectedPrice === "luxury" && (vendor.priceRange === "Luxo" || vendor.priceRange === "Premium")) ||
      (selectedPrice === "premium" && vendor.priceRange === "Premium") ||
      (selectedPrice === "mid" && vendor.priceRange === "Médio-Alto");

    return matchesSearch && matchesCategory && matchesPrice;
  });

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedPrice("all");
    router.push("/fornecedores");
  };

  const updateCategory = (category: string) => {
    setSelectedCategory(category);
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    if (category === "all") {
      params.delete("category");
    } else {
      params.set("category", category);
    }
    router.push(`/fornecedores?${params.toString()}`);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    if (!val) {
      params.delete("q");
    } else {
      params.set("q", val);
    }
    router.push(`/fornecedores?${params.toString()}`);
  };

  return (
    <div className="bg-[#FAF8F5] min-h-screen pt-28 pb-20 font-sans">
      <div className="site-container-wide">

        {/* Editorial Header */}
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-brand-gold mb-3">
            <span className="font-mono text-[9px] uppercase tracking-widest font-bold">Curadoria Exclusiva</span>
            <div className="w-8 h-[1px] bg-brand-gold/30"></div>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-light text-brand-text-dark leading-tight mb-4">
            Guia de Fornecedores HAXR
          </h1>
          <p className="text-sm md:text-base text-brand-text-dark/70 font-light leading-relaxed">
            Uma seleção refinada dos melhores parceiros e profissionais de casamentos em Moçambique.
            Do cenário perfeito ao olhar intemporal dos fotógrafos, tudo com a garantia de qualidade HAXR Signature.
          </p>
        </div>

        {/* Toolbar & Filters */}
        <div className="flex flex-col md:flex-row gap-6 items-stretch md:items-center justify-between mb-8 border-b border-brand-champagne/30 pb-6">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-brand-text-dark/45" />
            <input
              type="text"
              placeholder="Pesquhar por nome, serviço ou local..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-[#eae3d8]/30 border border-brand-champagne/45 rounded-full pl-11 pr-5 py-3 text-xs md:text-sm text-brand-text-dark placeholder-brand-text-dark/45 outline-none focus:border-brand-gold focus:bg-white transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-4 top-3.5 text-brand-text-dark/45 hover:text-brand-text-dark"
                aria-label="Limpar pesquisa"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Desktop Filters Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="md:hidden flex items-center justify-center gap-2 border border-brand-champagne/60 bg-white px-4 py-2.5 text-xs text-brand-text-dark font-semibold tracking-wider uppercase"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filtros
            </button>

            <div className="hidden md:flex items-center gap-6">
              {/* Category selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-text-dark/50">Categoria:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => updateCategory(e.target.value)}
                  className="bg-white border border-brand-champagne/60 px-3 py-1.5 text-xs text-brand-text-dark focus:border-brand-gold outline-none"
                >
                  <option value="all">Todas as Categorias</option>
                  {VENDOR_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-text-dark/50">Nível:</span>
                <select
                  value={selectedPrice}
                  onChange={(e) => setSelectedPrice(e.target.value)}
                  className="bg-white border border-brand-champagne/60 px-3 py-1.5 text-xs text-brand-text-dark focus:border-brand-gold outline-none"
                >
                  <option value="all">Todos os Níveis</option>
                  <option value="luxury">Luxo & Premium</option>
                  <option value="premium">Premium</option>
                  <option value="mid">Médio-Alto</option>
                </select>
              </div>

              {(searchQuery || selectedCategory !== "all" || selectedPrice !== "all") && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-brand-gold font-mono uppercase tracking-widest hover:text-brand-text-dark transition-colors"
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Section layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Sidebar categories filter for desktop */}
          <div className="hidden lg:block space-y-6">
            <div>
              <h3 className="font-serif text-lg font-light text-brand-text-dark mb-4">Filtrar por Categoria</h3>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => updateCategory("all")}
                    className={`text-left w-full text-xs transition-colors py-1 ${
                      selectedCategory === "all"
                        ? "text-brand-gold font-semibold pl-2 border-l-2 border-brand-gold"
                        : "text-brand-text-dark/70 hover:text-brand-gold pl-2 border-l-2 border-transparent"
                    }`}
                  >
                    Todos os Fornecedores
                  </button>
                </li>
                {VENDOR_CATEGORIES.map((cat) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => updateCategory(cat.id)}
                      className={`text-left w-full text-xs transition-colors py-1 ${
                        selectedCategory === cat.id
                          ? "text-brand-gold font-semibold pl-2 border-l-2 border-brand-gold"
                          : "text-brand-text-dark/70 hover:text-brand-gold pl-2 border-l-2 border-transparent"
                      }`}
                    >
                      {cat.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-brand-champagne/30 pt-6">
              <h3 className="font-serif text-lg font-light text-brand-text-dark mb-4">Nível de Serviço</h3>
              <div className="space-y-2">
                {[
                  { id: "all", label: "Qualquer nível" },
                  { id: "luxury", label: "Luxo & Premium" },
                  { id: "premium", label: "Apenas Premium" },
                  { id: "mid", label: "Médio-Alto" }
                ].map((item) => (
                  <label key={item.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="priceRadio"
                      checked={selectedPrice === item.id}
                      onChange={() => setSelectedPrice(item.id)}
                      className="accent-brand-gold"
                    />
                    <span className="text-xs text-brand-text-dark/80">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="lg:col-span-3">
            {filteredVendors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredVendors.map((vendor, index) => {
                  const categoryObj = VENDOR_CATEGORIES.find((c) => c.id === vendor.category);
                  const isFav = favorites.includes(vendor.id);

                  return (
                    <RevealOnScroll key={vendor.id} delay={index * 0.05} className="group">
                      <Link
                        href={`/fornecedores/${vendor.slug}`}
                        className="block bg-white border border-brand-champagne/40 rounded-2xl overflow-hidden hover:shadow-[0_16px_36px_rgba(8,7,6,0.06)] hover:border-brand-gold/30 transition-all duration-500 hover:-translate-y-1"
                      >
                        {/* Image wrapper */}
                        <div className="relative aspect-[3/2] overflow-hidden bg-zinc-100">
                          <Image
                            src={vendor.imageCover}
                            alt={vendor.name}
                            fill
                            className="object-cover object-center group-hover:scale-103 transition-transform duration-700"
                            quality={85}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

                          {/* Favorite button */}
                          <button
                            type="button"
                            onClick={(e) => toggleFavorite(e, vendor)}
                            className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center bg-white/90 backdrop-blur-xs text-brand-text-dark hover:text-red-500 shadow-xs hover:scale-105 transition-all duration-300"
                            aria-label={isFav ? "Remover dos favoritos" : "Guardar nos favoritos"}
                          >
                            <Heart
                              className={`w-4 h-4 transition-colors ${
                                isFav ? "fill-red-500 text-red-500" : "text-brand-text-dark/50"
                              }`}
                              strokeWidth={1.5}
                            />
                          </button>

                          {/* Category badge */}
                          <span className="absolute bottom-4 left-4 font-mono text-[9px] uppercase tracking-wider text-brand-black bg-brand-champagne/90 backdrop-blur-xs px-2.5 py-1 rounded-sm">
                            {categoryObj?.label || vendor.category}
                          </span>
                        </div>

                        {/* Text and details */}
                        <div className="p-6">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <h2 className="font-serif text-xl font-light text-brand-text-dark group-hover:text-brand-gold transition-colors duration-300">
                              {vendor.name}
                            </h2>
                            <div className="flex items-center gap-1 shrink-0">
                              <Star className="w-3.5 h-3.5 text-brand-gold fill-brand-gold" />
                              <span className="text-xs font-semibold text-brand-text-dark">{vendor.rating.toFixed(1)}</span>
                            </div>
                          </div>

                          <p className="flex items-center gap-1.5 text-xs text-brand-text-dark/55 mb-4">
                            <MapPin className="w-3.5 h-3.5" />
                            {vendor.location}
                          </p>

                          <p className="text-xs text-brand-text-dark/70 font-light line-clamp-2 leading-relaxed mb-5">
                            {vendor.description}
                          </p>

                          <div className="flex items-center justify-between pt-4 border-t border-brand-champagne/20">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-brand-text-dark/45">
                              Nível: <strong className="text-brand-gold">{vendor.priceRange}</strong>
                            </span>
                            <span className="text-[10px] font-semibold text-brand-gold group-hover:underline flex items-center gap-1">
                              Ver Perfil
                              <svg className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </span>
                          </div>
                        </div>
                      </Link>
                    </RevealOnScroll>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white border border-brand-champagne/40 rounded-2xl p-12 text-center max-w-lg mx-auto">
                <SlidersHorizontal className="w-8 h-8 text-brand-gold/40 mx-auto mb-4" />
                <h3 className="font-serif text-lg font-light text-brand-text-dark mb-2">Nenhum fornecedor encontrado</h3>
                <p className="text-xs text-brand-text-dark/60 font-light mb-6">
                  Não encontrámos nenhum fornecedor que corresponda aos filtros selecionados. Tente ajustar os filtros ou redefinir a sua pesquisa.
                </p>
                <button
                  onClick={clearFilters}
                  className="bg-brand-text-dark hover:bg-brand-gold text-white font-mono text-[9px] tracking-widest uppercase font-bold py-3 px-6 rounded-full transition-colors"
                >
                  Limpar Filtros
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Mobile Filters Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-55 flex md:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowMobileFilters(false)} />
          <div className="relative ml-auto flex h-full w-full max-w-xs flex-col bg-white py-6 shadow-xl animate-slide-in">
            <div className="flex items-center justify-between px-6 pb-4 border-b border-brand-champagne/30">
              <h2 className="font-serif text-lg text-brand-text-dark font-light">Filtros</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="text-brand-text-dark/65 hover:text-brand-text-dark"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
              {/* Category */}
              <div>
                <h3 className="font-serif text-sm text-brand-text-dark mb-3">Categoria</h3>
                <select
                  value={selectedCategory}
                  onChange={(e) => updateCategory(e.target.value)}
                  className="w-full bg-[#faf8f5] border border-brand-champagne/60 px-3 py-2.5 text-xs text-brand-text-dark outline-none focus:border-brand-gold"
                >
                  <option value="all">Todas as Categorias</option>
                  {VENDOR_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div>
                <h3 className="font-serif text-sm text-brand-text-dark mb-3">Nível de Preço</h3>
                <select
                  value={selectedPrice}
                  onChange={(e) => setSelectedPrice(e.target.value)}
                  className="w-full bg-[#faf8f5] border border-brand-champagne/60 px-3 py-2.5 text-xs text-brand-text-dark outline-none focus:border-brand-gold"
                >
                  <option value="all">Todos os Níveis</option>
                  <option value="luxury">Luxo & Premium</option>
                  <option value="premium">Premium</option>
                  <option value="mid">Médio-Alto</option>
                </select>
              </div>
            </div>

            <div className="border-t border-brand-champagne/30 p-6 flex gap-3">
              <button
                onClick={() => {
                  clearFilters();
                  setShowMobileFilters(false);
                }}
                className="flex-1 border border-brand-champagne/60 text-brand-text-dark font-mono text-[9px] uppercase py-3 text-center tracking-wider font-semibold"
              >
                Limpar
              </button>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="flex-1 bg-brand-text-dark text-white font-mono text-[9px] uppercase py-3 text-center tracking-wider font-semibold hover:bg-brand-gold"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FornecedoresPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold"></div>
      </div>
    }>
      <FornecedoresContent />
    </Suspense>
  );
}
