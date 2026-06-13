"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { formatCurrency } from "@/lib/calculations";
import {
  SERVICE_CATEGORIES,
  SERVICE_CATEGORY_LABELS,
} from "@/lib/admin/constants";
import type { Currency, ServiceCatalogItem, ServiceCategory } from "@/lib/admin/types";

type ServiceCatalogPanelProps = {
  catalog: ServiceCatalogItem[];
  currency: Currency;
  onSelect: (serviceId: string) => void;
};

export default function ServiceCatalogPanel({
  catalog,
  currency,
  onSelect,
}: ServiceCatalogPanelProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ServiceCategory | "all">("all");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return catalog.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (!query) return true;
      return (
        item.name.toLowerCase().includes(query) ||
        (item.description?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [catalog, category, search]);

  const grouped = useMemo(() => {
    const map = new Map<ServiceCategory, ServiceCatalogItem[]>();
    for (const item of filtered) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, [filtered]);

  return (
    <div className="p-4 bg-black-soft border border-grey-dark/80 rounded-sm space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-grey/40" />
        <input
          type="search"
          placeholder="Pesquisar serviço…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-input w-full pl-10"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory("all")}
          className={`px-3 py-1.5 rounded-sm font-mono text-[9px] tracking-[0.2em] uppercase transition-colors ${
            category === "all"
              ? "bg-admin-gold/20 text-admin-gold border border-admin-gold/40"
              : "text-grey/50 border border-grey-dark/60 hover:text-white"
          }`}
        >
          Todos
        </button>
        {SERVICE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-sm font-mono text-[9px] tracking-[0.2em] uppercase transition-colors ${
              category === cat
                ? "bg-admin-gold/20 text-admin-gold border border-admin-gold/40"
                : "text-grey/50 border border-grey-dark/60 hover:text-white"
            }`}
          >
            {SERVICE_CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      <div className="max-h-64 overflow-y-auto space-y-4">
        {filtered.length === 0 ? (
          <p className="text-sm text-grey/50 text-center py-4">
            Nenhum serviço encontrado.
          </p>
        ) : category === "all" ? (
          SERVICE_CATEGORIES.map((cat) => {
            const items = grouped.get(cat);
            if (!items?.length) return null;
            return (
              <div key={cat}>
                <p className="font-mono text-[8px] tracking-[0.35em] uppercase text-admin-gold/70 mb-2">
                  {SERVICE_CATEGORY_LABELS[cat]}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {items.map((service) => (
                    <CatalogButton
                      key={service.id}
                      service={service}
                      currency={currency}
                      onSelect={onSelect}
                    />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filtered.map((service) => (
              <CatalogButton
                key={service.id}
                service={service}
                currency={currency}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CatalogButton({
  service,
  currency,
  onSelect,
}: {
  service: ServiceCatalogItem;
  currency: Currency;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(service.id)}
      className="text-left px-3 py-2.5 rounded-sm border border-grey-dark/40 hover:border-admin-gold/30 hover:bg-white/5 transition-colors"
    >
      <p className="text-sm text-white">{service.name}</p>
      {service.description ? (
        <p className="text-xs text-grey/50 mt-0.5 line-clamp-1">
          {service.description}
        </p>
      ) : null}
      <p className="text-xs text-admin-gold font-mono mt-1.5">
        {formatCurrency(service.basePrice, currency)}
      </p>
    </button>
  );
}
