"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  Building2,
  Heart,
  MapPin,
  Search,
  SlidersHorizontal,
  UsersRound,
  X,
} from "lucide-react";
import { buildSignInPath } from "@/lib/auth/client-app-middleware";
import {
  buildSupplierInitials,
  filterSupplierProfiles,
  SUPPLIER_CATEGORIES,
  type PublicSupplierProfile,
} from "@/lib/vendors/marketplace";

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
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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
    return () => {
      active = false;
    };
  }, []);

  const filteredSuppliers = useMemo(
    () => filterSupplierProfiles(suppliers, { query, category, city }),
    [category, city, query, suppliers],
  );

  const hasActiveFilters = Boolean(query.trim() || city.trim() || category !== "all");

  const clearFilters = () => {
    setQuery("");
    setCategory("all");
    setCity("");
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
    <div>
      <div className="rounded-2xl border border-brand-champagne/40 bg-white p-4 shadow-sm md:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
          <label className="relative block">
            <span className="sr-only">Pesquisar fornecedores</span>
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-dark/40" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Pesquisar por nome, serviço ou local"
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

          <label className="relative block">
            <span className="sr-only">Cidade</span>
            <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-dark/40" />
            <input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="Cidade"
              className="w-full rounded-xl border border-brand-champagne/45 bg-brand-ivory/35 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/15"
            />
          </label>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="font-sans text-sm font-light text-brand-text-dark/60" aria-live="polite">
          {filteredSuppliers.length}{" "}
          {filteredSuppliers.length === 1 ? "fornecedor aprovado" : "fornecedores aprovados"}
        </p>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-brand-gold hover:text-brand-text-dark"
          >
            <X className="h-3.5 w-3.5" />
            Limpar filtros
          </button>
        ) : null}
      </div>

      {notice ? (
        <p
          className="mt-4 rounded-xl border border-brand-champagne/45 bg-white px-4 py-3 text-sm text-brand-text-dark/70"
          role="status"
        >
          {notice}
        </p>
      ) : null}

      {filteredSuppliers.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-brand-champagne/60 bg-white/70 px-6 py-12 text-center">
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
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredSuppliers.map((supplier) => {
            const isSaved = savedIds.has(supplier.id);
            return (
              <article
                key={supplier.id}
                className="group overflow-hidden rounded-2xl border border-brand-champagne/40 bg-white shadow-[0_12px_40px_rgba(28,26,23,0.04)] transition hover:-translate-y-1 hover:border-brand-gold/35 hover:shadow-[0_18px_55px_rgba(28,26,23,0.08)]"
              >
                <div className="relative flex aspect-[16/9] items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(191,155,82,0.24),transparent_55%),linear-gradient(145deg,#191512,#0d0b0a)]">
                  <span className="font-serif text-5xl font-light tracking-[0.08em] text-brand-champagne/80">
                    {buildSupplierInitials(supplier.name)}
                  </span>
                  <button
                    type="button"
                    onClick={() => void toggleFavorite(supplier.id)}
                    disabled={savingId === supplier.id}
                    aria-label={isSaved ? "Remover dos guardados" : "Guardar fornecedor"}
                    aria-pressed={isSaved}
                    className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-brand-text-dark shadow-sm transition hover:scale-105 hover:text-brand-gold disabled:cursor-wait disabled:opacity-60"
                  >
                    <Heart className={`h-4 w-4 ${isSaved ? "fill-brand-gold text-brand-gold" : ""}`} />
                  </button>
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-brand-gold">
                        {supplier.categoryLabel}
                      </p>
                      <h2 className="mt-2 font-serif text-xl font-light text-brand-text-dark">
                        {supplier.name}
                      </h2>
                    </div>
                    {supplier.verified ? (
                      <BadgeCheck
                        className="mt-1 h-5 w-5 shrink-0 text-brand-gold"
                        aria-label="Perfil verificado"
                      />
                    ) : null}
                  </div>

                  <p className="mt-3 flex items-center gap-1.5 text-xs text-brand-text-dark/55">
                    <MapPin className="h-3.5 w-3.5" />
                    {supplier.city}
                  </p>

                  {supplier.description ? (
                    <p className="mt-4 line-clamp-3 text-sm font-light leading-6 text-brand-text-dark/65">
                      {supplier.description}
                    </p>
                  ) : null}

                  <Link
                    href={`/fornecedores/${supplier.slug}`}
                    className="mt-6 inline-flex font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-brand-gold transition hover:text-brand-text-dark"
                  >
                    Ver perfil
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
