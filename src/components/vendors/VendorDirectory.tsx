"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  ChevronDown,
  Clock,
  Coins,
  Crown,
  GitCompareArrows,
  Heart,
  MapPin,
  Search,
  SlidersHorizontal,
  Star,
  UsersRound,
  X,
} from "lucide-react";
import { buildSignInPath } from "@/lib/auth/client-app-middleware";
import {
  buildSupplierInitials,
  filterSupplierProfiles,
  SUPPLIER_CATEGORIES,
  type PublicSupplierProfile,
  type SupplierCategoryId,
} from "@/lib/vendors/marketplace";
import { searchLocations } from "@/lib/vendors/mozambique-locations";
import {
  VENDOR_STYLES,
  getStyleMatchScore,
  type SavedStyleQuizResult,
} from "@/lib/vendors/vendor-styles";
import type { StyleQuizStyleKey } from "@/lib/marketing/style-quiz-packages";
import { getCategoryBudgetInsight } from "@/lib/vendors/vendor-budget-guide";
import VendorCompareDrawer from "@/components/vendors/VendorCompareDrawer";
import VendorCompareModal from "@/components/vendors/VendorCompareModal";
import VendorQuoteModal from "@/components/vendors/VendorQuoteModal";

/* ── Localizações populares (tags rápidas sempre visíveis) ── */
const POPULAR_LOCATIONS = [
  "Maputo Centro",
  "Matola",
  "Marracuene",
  "Beira",
  "Nampula",
  "Inhambane",
] as const;

type FavoritesResponse = {
  ok: boolean;
  supplierIds?: string[];
  message?: string;
};

export default function VendorDirectory({
  suppliers,
  unavailable = false,
}: {
  suppliers: PublicSupplierProfile[];
  unavailable?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams?.get("q") ?? "");
  const [category, setCategory] = useState(searchParams?.get("category") ?? "all");
  const [city, setCity] = useState(searchParams?.get("city") ?? "");
  const [activeZone, setActiveZone] = useState("all");
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const locationRef = useRef<HTMLDivElement>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  /* ── Style Quiz Match State ── */
  const [activeStyle, setActiveStyle] = useState<StyleQuizStyleKey | null>(
    (searchParams?.get("style") as StyleQuizStyleKey) ?? null,
  );
  const [userSavedStyle, setUserSavedStyle] = useState<SavedStyleQuizResult | null>(null);

  /* ── Comparador State ── */
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [showCompareModal, setShowCompareModal] = useState(false);

  /* ── Quote Modal State ── */
  const [quoteSupplier, setQuoteSupplier] = useState<PublicSupplierProfile | null>(null);

  useEffect(() => {
    let active = true;

    async function loadFavorites() {
      try {
        const response = await fetch("/api/vendors/favorites", {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        if (response.status === 401) return;
        const body = (await response.json()) as FavoritesResponse;
        if (active && response.ok && body.ok) {
          setSavedIds(new Set(body.supplierIds ?? []));
        }
      } catch {
        // The directory remains useful if the optional saved list is unavailable.
      }
    }

    void loadFavorites();

    /* ── Carregar estilo salvo do Style Quiz ── */
    try {
      const stored = localStorage.getItem("haxr_style_quiz_result");
      if (stored) {
        const parsed = JSON.parse(stored) as SavedStyleQuizResult;
        if (active && parsed?.key) {
          setUserSavedStyle(parsed);
          // Se não houver estilo na URL, activar por defeito o estilo do utilizador
          if (!searchParams?.get("style")) {
            setActiveStyle(parsed.key);
          }
        }
      }
    } catch {
      // Ignorar se storage inacessível
    }

    return () => {
      active = false;
    };
  }, [searchParams]);

  /* ── Fechar dropdown ao clicar fora ── */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setLocationDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredLocations = useMemo(
    () => searchLocations(locationSearch),
    [locationSearch],
  );

  const filteredSuppliers = useMemo(() => {
    const base = filterSupplierProfiles(suppliers, {
      query,
      category,
      city: activeZone !== "all" ? activeZone : city,
    });

    if (!activeStyle) return base;

    // Se o filtro de estilo estiver ativo, filtrar apenas os que têm afinidade com o estilo
    return base.filter((s) => s.styles?.includes(activeStyle));
  }, [activeStyle, activeZone, category, city, query, suppliers]);

  const hasActiveFilters = Boolean(
    query.trim() ||
      city.trim() ||
      category !== "all" ||
      activeZone !== "all" ||
      activeStyle !== null,
  );

  const clearFilters = () => {
    setQuery("");
    setCategory("all");
    setCity("");
    setActiveZone("all");
    setActiveStyle(null);
    router.replace("/fornecedores", { scroll: false });
  };

  const toggleFavorite = async (supplierId: string) => {
    setSavingId(supplierId);
    setNotice(null);
    const isSaved = savedIds.has(supplierId);

    try {
      const response = await fetch("/api/vendors/favorites", {
        method: isSaved ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ supplierId }),
      });

      if (response.status === 401) {
        router.push(buildSignInPath("/fornecedores"));
        return;
      }

      const body = (await response.json()) as FavoritesResponse;
      if (!response.ok || !body.ok) {
        setNotice(body.message ?? "Não foi possível guardar o fornecedor.");
        return;
      }

      setSavedIds((current) => {
        const next = new Set(current);
        if (isSaved) next.delete(supplierId);
        else next.add(supplierId);
        return next;
      });
      setNotice(isSaved ? "Fornecedor removido dos guardados." : "Fornecedor guardado.");
    } catch {
      setNotice("Não foi possível guardar o fornecedor. Tente novamente.");
    } finally {
      setSavingId(null);
    }
  };

  /* ── Comparador Handlers ── */
  const toggleCompare = useCallback((supplierId: string) => {
    setCompareIds((current) => {
      const next = new Set(current);
      if (next.has(supplierId)) {
        next.delete(supplierId);
      } else if (next.size < 3) {
        next.add(supplierId);
      }
      return next;
    });
  }, []);

  const compareSuppliers = useMemo(
    () => suppliers.filter((s) => compareIds.has(s.id)),
    [compareIds, suppliers],
  );

  const handleCompareQuote = useCallback((supplier: PublicSupplierProfile) => {
    setShowCompareModal(false);
    setQuoteSupplier(supplier);
  }, []);

  /* ── Category Budget Insights Data ── */
  const selectedCategoryBudget = useMemo(() => {
    if (category && category !== "all") {
      return getCategoryBudgetInsight(category as SupplierCategoryId);
    }
    return null;
  }, [category]);

  if (unavailable) {
    return (
      <section className="mx-auto max-w-3xl rounded-3xl border border-amber-200/70 bg-amber-50/70 px-6 py-12 text-center md:px-12">
        <Building2 className="mx-auto h-7 w-7 text-amber-700/70" aria-hidden />
        <h2 className="mt-5 font-serif text-2xl font-light text-brand-text-dark">
          Directório temporariamente indisponível
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm font-light leading-7 text-brand-text-dark/65">
          Não conseguimos validar os fornecedores publicados neste momento. Por segurança,
          não mostramos dados em cache nem perfis de exemplo.
        </p>
      </section>
    );
  }

  if (suppliers.length === 0) {
    return (
      <section className="mx-auto max-w-3xl rounded-3xl border border-brand-champagne/45 bg-white px-6 py-14 text-center shadow-[0_18px_60px_rgba(28,26,23,0.05)] md:px-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-champagne/30 text-brand-gold">
          <Building2 className="h-6 w-6" aria-hidden />
        </div>
        <h2 className="mt-6 font-serif text-2xl font-light text-brand-text-dark">
          Ainda não existem fornecedores publicados
        </h2>
        <p className="mx-auto mt-3 max-w-xl font-sans text-sm font-light leading-7 text-brand-text-dark/65">
          O directório mostra apenas profissionais que concluíram a candidatura e foram
          aprovados pela equipa HAXR. Não apresentamos perfis, avaliações ou exemplos
          fictícios enquanto uma categoria estiver vazia.
        </p>
        <Link
          href="/for-pros"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-brand-black px-7 py-3 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-brand-gold"
        >
          Candidatar o meu negócio
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Barra de Pesquisa & Filtros ── */}
      <div className="rounded-2xl border border-brand-champagne/40 bg-white p-4 shadow-sm md:p-5 space-y-4">
        {/* Linha 1: Input de Pesquisa + Select de Categoria */}
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
          <label className="relative block">
            <span className="sr-only">Pesquisar fornecedores</span>
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-dark/40" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Pesquisar por nome de atelier, serviço, fotógrafo ou quinta..."
              className="w-full rounded-xl border border-brand-champagne/45 bg-brand-ivory/35 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/15"
            />
          </label>

          <label className="relative block">
            <span className="sr-only">Categoria</span>
            <SlidersHorizontal className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-dark/40" />
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full appearance-none rounded-xl border border-brand-champagne/45 bg-brand-ivory/35 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/15"
            >
              <option value="all">Todas as categorias</option>
              {SUPPLIER_CATEGORIES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Linha 2: Filtro de Match Inteligente com o Style Quiz */}
        <div className="flex flex-wrap items-center gap-2 border-t border-brand-champagne/25 pt-3">
          <Crown className="h-3.5 w-3.5 text-brand-gold shrink-0" />
          <span className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-brand-text-dark/50 mr-1">
            Estilo / Match:
          </span>

          <button
            type="button"
            onClick={() => setActiveStyle(null)}
            className={`rounded-full px-3 py-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.15em] transition-all cursor-pointer ${
              activeStyle === null
                ? "bg-brand-black text-white shadow-sm"
                : "border border-brand-champagne/40 bg-[#faf8f5] text-brand-text-dark/60 hover:border-brand-gold/40 hover:text-brand-gold"
            }`}
          >
            Todos os Estilos
          </button>

          {(Object.keys(VENDOR_STYLES) as StyleQuizStyleKey[]).map((styleKey) => {
            const style = VENDOR_STYLES[styleKey];
            const isActive = activeStyle === styleKey;
            const isUserStyle = userSavedStyle?.key === styleKey;

            return (
              <button
                key={styleKey}
                type="button"
                onClick={() => setActiveStyle(isActive ? null : styleKey)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.15em] transition-all cursor-pointer ${
                  isActive
                    ? "bg-brand-gold text-brand-black font-bold shadow-sm"
                    : isUserStyle
                      ? "border border-brand-gold/60 bg-brand-gold/10 text-brand-gold hover:bg-brand-gold hover:text-brand-black"
                      : "border border-brand-champagne/40 bg-[#faf8f5] text-brand-text-dark/60 hover:border-brand-gold/40 hover:text-brand-gold"
                }`}
              >
                {isUserStyle && <Crown className="h-2.5 w-2.5" />}
                <span>{style.label}</span>
                {isUserStyle && <span className="text-[7px] opacity-75">(Vosso Match)</span>}
              </button>
            );
          })}

          {!userSavedStyle && (
            <Link
              href="/style-quiz"
              className="ml-auto inline-flex items-center gap-1 font-mono text-[8px] font-bold uppercase tracking-wider text-brand-gold hover:text-brand-gold-light transition"
            >
              <span>Fazer Style Quiz</span>
              <ArrowRight className="h-2.5 w-2.5" />
            </Link>
          )}
        </div>

        {/* Linha 3: Filtros de Localização — Moçambique Completo */}
        <div className="flex flex-wrap items-center gap-2 border-t border-brand-champagne/25 pt-3">
          <MapPin className="h-3.5 w-3.5 text-brand-gold shrink-0" />
          <span className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-brand-text-dark/50 mr-1">
            Localização:
          </span>

          <button
            type="button"
            onClick={() => {
              setActiveZone("all");
              setCity("");
            }}
            className={`rounded-full px-3 py-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.15em] transition-all cursor-pointer ${
              activeZone === "all"
                ? "bg-brand-black text-white shadow-sm"
                : "border border-brand-champagne/40 bg-[#faf8f5] text-brand-text-dark/60 hover:border-brand-gold/40 hover:text-brand-gold"
            }`}
          >
            Todo Moçambique
          </button>

          {POPULAR_LOCATIONS.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => {
                setActiveZone(loc.toLocaleLowerCase("pt-PT"));
                setCity("");
              }}
              className={`rounded-full px-3 py-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.15em] transition-all cursor-pointer ${
                activeZone === loc.toLocaleLowerCase("pt-PT")
                  ? "bg-brand-black text-white shadow-sm"
                  : "border border-brand-champagne/40 bg-[#faf8f5] text-brand-text-dark/60 hover:border-brand-gold/40 hover:text-brand-gold"
              }`}
            >
              {loc}
            </button>
          ))}

          {/* Botão para abrir dropdown completo */}
          <div className="relative" ref={locationRef}>
            <button
              type="button"
              onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.15em] transition-all cursor-pointer ${
                activeZone !== "all" &&
                !POPULAR_LOCATIONS.some(
                  (l) => l.toLocaleLowerCase("pt-PT") === activeZone,
                )
                  ? "bg-brand-gold text-brand-black shadow-sm"
                  : "border border-brand-gold/40 bg-brand-gold/5 text-brand-gold hover:bg-brand-gold/10"
              }`}
            >
              <span>
                {activeZone !== "all" &&
                !POPULAR_LOCATIONS.some(
                  (l) => l.toLocaleLowerCase("pt-PT") === activeZone,
                )
                  ? activeZone.charAt(0).toUpperCase() + activeZone.slice(1)
                  : "Mais Localizações"}
              </span>
              <ChevronDown
                className={`h-3 w-3 transition-transform ${locationDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown com todas as províncias e distritos de Moçambique */}
            {locationDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 z-50 w-[320px] sm:w-[380px] rounded-2xl border border-brand-champagne/50 bg-white shadow-[0_20px_60px_rgba(28,26,23,0.12)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-3 border-b border-brand-champagne/25">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-text-dark/40" />
                    <input
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      placeholder="Pesquisar província, cidade ou distrito..."
                      className="w-full rounded-lg border border-brand-champagne/40 bg-[#faf8f5] py-2 pl-9 pr-3 text-xs outline-none transition focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/15"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="max-h-[320px] overflow-y-auto overscroll-contain py-2">
                  {filteredLocations.length === 0 ? (
                    <p className="px-4 py-6 text-center text-xs font-light text-brand-text-dark/50">
                      Nenhuma localização encontrada.
                    </p>
                  ) : (
                    filteredLocations.map((group) => (
                      <div key={group.province} className="mb-1">
                        <p className="sticky top-0 bg-[#faf8f5] px-4 py-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-brand-gold">
                          {group.province}
                        </p>
                        {group.locations.map((loc) => {
                          const locKey = loc.toLocaleLowerCase("pt-PT");
                          const isActive = activeZone === locKey;
                          return (
                            <button
                              key={loc}
                              type="button"
                              onClick={() => {
                                setActiveZone(locKey);
                                setCity("");
                                setLocationDropdownOpen(false);
                                setLocationSearch("");
                              }}
                              className={`w-full text-left px-4 py-2 text-xs transition-colors cursor-pointer ${
                                isActive
                                  ? "bg-brand-gold/10 text-brand-gold font-medium"
                                  : "text-brand-text-dark/75 hover:bg-[#faf8f5] font-light"
                              }`}
                            >
                              {loc}
                            </button>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 💡 GUIA DE REPARTIÇÃO DE ORÇAMENTO (Market Insights por Categoria) ── */}
      {selectedCategoryBudget && (
        <div className="rounded-2xl border border-brand-gold/30 bg-gradient-to-br from-white via-[#faf8f5] to-brand-gold/5 p-5 shadow-xs animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-brand-gold/15 p-2.5 text-brand-gold shrink-0">
                <Coins className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[8px] font-bold uppercase tracking-[0.25em] text-brand-gold">
                    Market Insights Moçambique
                  </span>
                  <span className="rounded-full bg-brand-black text-white px-2 py-0.5 font-mono text-[7px] uppercase font-bold tracking-wider">
                    {selectedCategoryBudget.percentageShare} do Orçamento
                  </span>
                </div>
                <h3 className="font-serif text-lg font-medium text-brand-text-dark">
                  Investimento Médio em {selectedCategoryBudget.label}:{" "}
                  <span className="text-brand-gold">{selectedCategoryBudget.averageRangeMZN}</span>
                </h3>
                <p className="font-sans text-xs font-light text-brand-text-dark/70 leading-relaxed max-w-3xl">
                  {selectedCategoryBudget.recommendation}
                </p>
              </div>
            </div>

            <Link
              href="/tools/orcamento"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-black hover:bg-brand-gold px-4 py-2.5 font-mono text-[9px] font-bold uppercase tracking-wider text-white transition-colors shadow-xs"
            >
              <span>Simular no Gestor de Orçamento</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}

      {/* ── Contagem & Filtros Activos ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-sans text-sm font-light text-brand-text-dark/60" aria-live="polite">
          {filteredSuppliers.length}{" "}
          {filteredSuppliers.length === 1 ? "fornecedor aprovado" : "fornecedores aprovados"}
          {activeStyle && (
            <span className="font-mono text-xs text-brand-gold font-bold ml-1.5">
              (com match {VENDOR_STYLES[activeStyle]?.label})
            </span>
          )}
        </p>
        <div className="flex items-center gap-4">
          {compareIds.size > 0 && (
            <span className="font-mono text-[9px] text-brand-gold font-bold uppercase tracking-wider">
              <GitCompareArrows className="h-3.5 w-3.5 inline mr-1" />
              {compareIds.size} selecionado{compareIds.size > 1 ? "s" : ""}
            </span>
          )}
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-brand-gold hover:text-brand-text-dark cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              Limpar filtros
            </button>
          ) : null}
        </div>
      </div>

      {notice ? (
        <p
          className="rounded-xl border border-brand-champagne/45 bg-white px-4 py-3 text-sm text-brand-text-dark/70"
          role="status"
        >
          {notice}
        </p>
      ) : null}

      {/* ── Grid de Fornecedores ── */}
      {filteredSuppliers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-champagne/60 bg-white/70 px-6 py-12 text-center">
          <UsersRound className="mx-auto h-7 w-7 text-brand-gold/60" />
          <h2 className="mt-4 font-serif text-xl font-light text-brand-text-dark">
            Sem fornecedores nesta pesquisa
          </h2>
          <p className="mt-2 text-sm font-light text-brand-text-dark/60">
            Esta categoria fica vazia até existir um fornecedor aprovado que corresponda
            aos critérios.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredSuppliers.map((supplier) => {
            const isSaved = savedIds.has(supplier.id);
            const isComparing = compareIds.has(supplier.id);
            const styleMatch = getStyleMatchScore(
              supplier.styles,
              activeStyle ?? userSavedStyle?.key ?? null,
            );

            return (
              <article
                key={supplier.id}
                className={`group overflow-hidden rounded-2xl border bg-white shadow-[0_12px_40px_rgba(28,26,23,0.04)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_60px_rgba(28,26,23,0.1)] flex flex-col justify-between ${
                  isComparing
                    ? "border-brand-gold/60 ring-2 ring-brand-gold/20"
                    : "border-brand-champagne/40 hover:border-brand-gold/40"
                }`}
              >
                <div>
                  {/* Foto de Capa em Alta Resolução com Zoom no Hover */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-brand-black">
                    <Image
                      src={supplier.coverImageUrl}
                      alt={supplier.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover brightness-[0.9] transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Badge de Categoria e Style Match */}
                    <div className="absolute left-3.5 top-3.5 flex flex-col items-start gap-1.5">
                      <span className="rounded-full bg-white/95 backdrop-blur-md px-3 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-brand-black shadow-xs">
                        {supplier.categoryLabel}
                      </span>

                      {/* Badge de Style Match se houver afinidade */}
                      {styleMatch.isMatch && (
                        <span className="rounded-full bg-brand-gold/90 backdrop-blur-md px-2.5 py-0.5 font-mono text-[7px] font-bold uppercase tracking-wider text-brand-black shadow-xs flex items-center gap-1">
                          <Crown className="h-2.5 w-2.5" />
                          <span>{styleMatch.matchPercentage}% Match</span>
                        </span>
                      )}
                    </div>

                    {/* Botões: Favorito + Comparar */}
                    <div className="absolute right-3.5 top-3.5 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleCompare(supplier.id)}
                        aria-label={isComparing ? "Remover da comparação" : "Adicionar à comparação"}
                        className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md shadow-sm transition cursor-pointer ${
                          isComparing
                            ? "bg-brand-gold text-brand-black"
                            : "bg-white/90 text-brand-text-dark hover:scale-110 hover:text-brand-gold"
                        }`}
                      >
                        <GitCompareArrows className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => void toggleFavorite(supplier.id)}
                        disabled={savingId === supplier.id}
                        aria-label={isSaved ? "Remover dos guardados" : "Guardar fornecedor"}
                        aria-pressed={isSaved}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-brand-text-dark shadow-sm transition hover:scale-110 hover:text-brand-gold disabled:cursor-wait disabled:opacity-60 cursor-pointer"
                      >
                        <Heart className={`h-3.5 w-3.5 ${isSaved ? "fill-brand-gold text-brand-gold" : ""}`} />
                      </button>
                    </div>

                    {/* Avatar Flutuante sobre o Banner */}
                    <div className="absolute bottom-3 left-4 flex items-center gap-3">
                      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-white bg-gradient-to-br from-[#1c1917] to-[#0c0a09] shadow-md overflow-hidden">
                        {supplier.avatarUrl ? (
                          <Image
                            src={supplier.avatarUrl}
                            alt={supplier.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <span className="font-serif text-base font-light text-brand-champagne/90 tracking-wider">
                            {buildSupplierInitials(supplier.name)}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[8px] text-brand-gold font-bold uppercase tracking-wider">
                        {supplier.city}
                      </span>
                    </div>
                  </div>

                  {/* Informações do Fornecedor */}
                  <div className="p-5 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-serif text-lg font-medium text-brand-text-dark group-hover:text-brand-gold transition-colors">
                        {supplier.name}
                      </h2>
                      {supplier.verified ? (
                        <BadgeCheck
                          className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold"
                          aria-label="Perfil verificado"
                        />
                      ) : null}
                    </div>

                    <p className="font-mono text-[10px] text-brand-gold font-bold">
                      {supplier.priceRange}
                    </p>

                    {supplier.description ? (
                      <p className="line-clamp-2 text-xs font-light leading-relaxed text-brand-text-dark/70">
                        {supplier.description}
                      </p>
                    ) : null}

                    {/* Mini-Badges de Métricas & Status de Temporada */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-mono text-[7px] font-bold uppercase tracking-wider">
                          Agenda Aberta
                        </span>
                      </span>

                      <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-stone-700">
                        <Clock className="h-2.5 w-2.5" />
                        <span className="font-mono text-[7px] font-bold uppercase tracking-wider">
                          {supplier.responseTime}
                        </span>
                      </span>

                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">
                        <Star className="h-2.5 w-2.5" />
                        <span className="font-mono text-[7px] font-bold uppercase tracking-wider">
                          {supplier.satisfactionRate}%
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rodapé do Card com Link */}
                <div className="px-5 pb-5 pt-2 border-t border-brand-champagne/25 flex items-center justify-between">
                  <span className="font-mono text-[8px] text-brand-text-dark/40 uppercase tracking-wider">
                    Desde {supplier.memberSince} · {supplier.portfolioImages.length} fotos
                  </span>

                  <Link
                    href={`/fornecedores/${supplier.slug}`}
                    className="inline-flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-brand-gold hover:text-brand-gold-light group-hover:translate-x-0.5 transition-all"
                  >
                    <span>Ver Perfil</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ── Comparador: Drawer Fixo no Fundo ── */}
      <VendorCompareDrawer
        selectedSuppliers={compareSuppliers}
        onRemove={(id) =>
          setCompareIds((current) => {
            const next = new Set(current);
            next.delete(id);
            return next;
          })
        }
        onCompare={() => setShowCompareModal(true)}
        onClear={() => setCompareIds(new Set())}
      />

      {/* ── Modal de Comparação Side-by-Side ── */}
      <VendorCompareModal
        suppliers={compareSuppliers}
        open={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        onRequestQuote={handleCompareQuote}
      />

      {/* ── Modal de Cotação VIP ── */}
      {quoteSupplier && (
        <VendorQuoteModal
          supplier={quoteSupplier}
          open={!!quoteSupplier}
          onClose={() => setQuoteSupplier(null)}
        />
      )}
    </div>
  );
}
