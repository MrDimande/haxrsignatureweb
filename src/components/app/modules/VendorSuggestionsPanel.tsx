"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Heart, Sparkles } from "lucide-react";
import { buildSupplierInitials, type PublicSupplierProfile } from "@/lib/vendors/marketplace";
import { ModulePanel } from "@/components/app/modules/ModuleShell";

type DirectoryResponse = {
  ok: boolean;
  suppliers?: PublicSupplierProfile[];
};

type FavoritesResponse = {
  ok: boolean;
  supplierIds?: string[];
};

export default function VendorSuggestionsPanel() {
  const [suppliers, setSuppliers] = useState<PublicSupplierProfile[] | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [directoryResponse, favoritesResponse] = await Promise.all([
          fetch("/api/vendors/directory", {
            headers: { Accept: "application/json" },
            cache: "no-store",
          }),
          fetch("/api/vendors/favorites", {
            headers: { Accept: "application/json" },
            cache: "no-store",
          }),
        ]);

        const directory = (await directoryResponse.json()) as DirectoryResponse;
        const favorites = favoritesResponse.ok
          ? ((await favoritesResponse.json()) as FavoritesResponse)
          : null;

        if (active) {
          setSuppliers(directory.ok ? (directory.suppliers ?? []).slice(0, 3) : []);
          setSavedIds(new Set(favorites?.supplierIds ?? []));
        }
      } catch {
        if (active) setSuppliers([]);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const toggleSaved = async (supplierId: string) => {
    const saved = savedIds.has(supplierId);
    setSavingId(supplierId);
    try {
      const response = await fetch("/api/vendors/favorites", {
        method: saved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ supplierId }),
      });
      if (!response.ok) return;
      setSavedIds((current) => {
        const next = new Set(current);
        if (saved) next.delete(supplierId);
        else next.add(supplierId);
        return next;
      });
    } finally {
      setSavingId(null);
    }
  };

  if (suppliers === null) {
    return (
      <ModulePanel title="Descobrir fornecedores">
        <div className="h-28 animate-pulse rounded-xl bg-white/5" />
      </ModulePanel>
    );
  }

  return (
    <ModulePanel title="Descobrir fornecedores aprovados">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-xs leading-5 text-zinc-400">
          Perfis publicados após revisão HAXR. Guarde os que quer comparar; categorias
          sem profissionais aprovados não recebem sugestões artificiais.
        </p>
        <Link
          href="/fornecedores"
          className="inline-flex items-center gap-2 font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-brand-gold"
        >
          Ver directório
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {suppliers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 px-5 py-8 text-center">
          <Sparkles className="mx-auto h-5 w-5 text-brand-gold/55" />
          <p className="mt-3 text-xs text-zinc-500">
            Ainda não existem fornecedores aprovados para sugerir.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {suppliers.map((supplier) => {
            const saved = savedIds.has(supplier.id);
            return (
              <article
                key={supplier.id}
                className="rounded-xl border border-white/10 bg-[#120e0d] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gold/10 font-serif text-sm text-brand-gold">
                    {buildSupplierInitials(supplier.name)}
                  </div>
                  <button
                    type="button"
                    onClick={() => void toggleSaved(supplier.id)}
                    disabled={savingId === supplier.id}
                    aria-label={saved ? "Remover dos guardados" : "Guardar fornecedor"}
                    aria-pressed={saved}
                    className="rounded-full border border-white/10 p-2 text-zinc-400 transition hover:border-brand-gold/40 hover:text-brand-gold disabled:opacity-50"
                  >
                    <Heart className={`h-3.5 w-3.5 ${saved ? "fill-brand-gold text-brand-gold" : ""}`} />
                  </button>
                </div>
                <div className="mt-4 flex items-center gap-1.5">
                  <h3 className="font-serif text-base font-light text-white">{supplier.name}</h3>
                  {supplier.verified ? <BadgeCheck className="h-3.5 w-3.5 text-brand-gold" /> : null}
                </div>
                <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em] text-brand-gold/75">
                  {supplier.categoryLabel}
                </p>
                <p className="mt-2 text-[10px] text-zinc-500">{supplier.city}</p>
              </article>
            );
          })}
        </div>
      )}
    </ModulePanel>
  );
}
