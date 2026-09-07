"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, Building2 } from "lucide-react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import {
  SUPPLIER_CATEGORIES,
  type PublicSupplierProfile,
  type SupplierCategoryId,
} from "@/lib/vendors/marketplace";

type DirectoryResponse = {
  ok: boolean;
  suppliers?: PublicSupplierProfile[];
};

export default function HomeVendorCategories() {
  const [searchQuery, setSearchQuery] = useState("");
  const [suppliers, setSuppliers] = useState<PublicSupplierProfile[]>([]);
  const [directoryState, setDirectoryState] = useState<"loading" | "ready" | "unavailable">("loading");
  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function loadPublishedSuppliers() {
      try {
        const response = await fetch("/api/vendors/directory", {
          headers: { Accept: "application/json" },
        });
        const body = (await response.json()) as DirectoryResponse;
        if (!active) return;
        if (!response.ok || !body.ok) {
          setDirectoryState("unavailable");
          return;
        }
        setSuppliers(body.suppliers ?? []);
        setDirectoryState("ready");
      } catch {
        if (active) setDirectoryState("unavailable");
      }
    }

    void loadPublishedSuppliers();
    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(() => {
    const counts = new Map<SupplierCategoryId, number>();
    for (const supplier of suppliers) {
      counts.set(supplier.category, (counts.get(supplier.category) ?? 0) + 1);
    }

    return SUPPLIER_CATEGORIES.flatMap((category) => {
      const count = counts.get(category.id) ?? 0;
      return count > 0 ? [{ ...category, count }] : [];
    });
  }, [suppliers]);

  const normalizedSearch = searchQuery.trim().toLocaleLowerCase("pt-PT");
  const filteredCategories = categories.filter((category) =>
    category.label.toLocaleLowerCase("pt-PT").includes(normalizedSearch),
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
            Consulte apenas profissionais com candidatura revista e perfil publicado pela equipa HAXR.
          </p>
        </RevealOnScroll>

        {/* Dynamic Search Bar (Matches Loverly search functionality) */}
        <RevealOnScroll delay={0.05} className="max-w-md mx-auto mb-16 px-4">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center bg-[#eae3d8]/40 border border-brand-champagne/45 rounded-full px-5 py-3 hover:border-brand-gold/45 focus-within:border-brand-gold focus-within:bg-white transition-all shadow-xs">
            <Search className="w-4 h-4 text-brand-text-dark/40 mr-3 shrink-0" />
            <input
              type="text"
              aria-label="Pesquisar fornecedores"
              placeholder="Pesquisar fornecedores (ex: Fotógrafos, Espaços)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none w-full font-sans text-xs md:text-sm text-brand-text-dark placeholder-brand-text-dark/45"
            />
            <button type="submit" className="hidden" aria-label="Pesquisar" />
          </form>
        </RevealOnScroll>

        {directoryState === "loading" ? (
          <div className="rounded-3xl border border-brand-champagne/35 bg-white/60 px-6 py-14 text-sm text-brand-text-dark/55" role="status">
            A validar os fornecedores publicados…
          </div>
        ) : directoryState === "unavailable" ? (
          <div className="rounded-3xl border border-amber-200/70 bg-amber-50/70 px-6 py-14 text-sm text-brand-text-dark/65">
            O directório está temporariamente indisponível. Não mostramos perfis ou categorias sem validação.
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-3xl border border-brand-champagne/45 bg-white px-6 py-14 shadow-[0_18px_60px_rgba(28,26,23,0.05)]">
            <Building2 className="mx-auto h-7 w-7 text-brand-gold/70" aria-hidden />
            <h3 className="mt-5 font-serif text-2xl font-light text-brand-text-dark">
              Ainda não existem fornecedores publicados
            </h3>
            <p className="mx-auto mt-3 max-w-xl text-sm font-light leading-7 text-brand-text-dark/65">
              As categorias permanecem vazias até existir pelo menos um profissional aprovado. Não apresentamos fornecedores de exemplo.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((cat, index) => (
              <RevealOnScroll key={cat.id} delay={index * 0.04}>
                <Link href={`/fornecedores?category=${cat.id}`} className="group block text-left">

                  <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[1.5rem] border border-brand-champagne/20 bg-[radial-gradient(circle_at_top_left,rgba(191,155,82,0.28),transparent_58%),linear-gradient(145deg,#191512,#0d0b0a)] shadow-[0_12px_28px_rgba(8,7,6,0.08)] transition-all duration-500 group-hover:-translate-y-0.5 group-hover:shadow-[0_18px_40px_rgba(8,7,6,0.14)] md:rounded-[2rem]">
                    <Building2 className="h-9 w-9 text-brand-champagne/80" aria-hidden />
                    <span className="absolute bottom-4 right-4 rounded-full bg-white/95 px-3 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-brand-text-dark">
                      {cat.count}
                    </span>
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
        )}

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
