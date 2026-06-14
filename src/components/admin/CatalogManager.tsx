"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AdminInput, AdminSelect, AdminTextarea } from "@/components/admin/AdminField";
import {
  deleteCatalogItemAction,
  saveCatalogItemAction,
} from "@/lib/admin/actions/catalog.actions";
import { formatCurrency } from "@/lib/calculations";
import {
  SERVICE_CATEGORIES,
  SERVICE_CATEGORY_LABELS,
} from "@/lib/admin/constants";
import type {
  Business,
  BusinessId,
  CatalogFormData,
  ServiceCatalogItem,
  ServiceCategory,
} from "@/lib/admin/types";

type CatalogManagerProps = {
  businesses: Business[];
  initialCatalog: ServiceCatalogItem[];
};

const emptyForm = (businessId: BusinessId): CatalogFormData => ({
  businessId,
  name: "",
  description: "",
  price: 0,
  category: "invitations",
  sortOrder: 100,
  isActive: true,
});

export default function CatalogManager({
  businesses,
  initialCatalog,
}: CatalogManagerProps) {
  const defaultBusiness = businesses[0]?.id ?? "haxr-signature";
  const [catalog, setCatalog] = useState(initialCatalog);
  const [editing, setEditing] = useState<CatalogFormData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<ServiceCategory | "all">("all");

  const filtered = useMemo(() => {
    if (filter === "all") return catalog;
    return catalog.filter((item) => item.category === filter);
  }, [catalog, filter]);

  async function handleSave() {
    if (!editing) return;
    setBusy(true);
    setError("");

    const result = await saveCatalogItemAction(editing);
    setBusy(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setCatalog((prev) => {
      const others = prev.filter((item) => item.id !== result.data.id);
      return [...others, result.data].sort(
        (a, b) =>
          SERVICE_CATEGORIES.indexOf(a.category) -
            SERVICE_CATEGORIES.indexOf(b.category) || a.name.localeCompare(b.name)
      );
    });
    setEditing(null);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Desactivar «${name}» do catálogo?`)) return;
    setBusy(true);
    const result = await deleteCatalogItemAction(id);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setCatalog((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <section className="admin-card p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold mb-2">
            Catálogo Comercial
          </h2>
          <p className="text-sm text-grey/55 max-w-xl">
            Gerir serviços com preços fixos por pacote. Os itens activos ficam
            disponíveis em proformas, facturas e recibos.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(emptyForm(defaultBusiness))}
          disabled={busy}
          className="admin-btn-primary"
        >
          <Plus className="w-4 h-4" />
          Novo serviço
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 font-mono text-[9px] tracking-[0.2em] uppercase border rounded-sm ${
            filter === "all"
              ? "bg-admin-gold/10 text-admin-gold border-admin-gold/25"
              : "text-grey/50 border-grey-dark/60"
          }`}
        >
          Todos
        </button>
        {SERVICE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 font-mono text-[9px] tracking-[0.2em] uppercase border rounded-sm ${
              filter === cat
                ? "bg-admin-gold/10 text-admin-gold border-admin-gold/25"
                : "text-grey/50 border-grey-dark/60"
            }`}
          >
            {SERVICE_CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {editing ? (
        <div className="border border-grey-dark/80 p-5 space-y-4 bg-black-soft/40">
          <p className="font-mono text-[8px] tracking-[0.35em] uppercase text-grey/50">
            {editing.id ? "Editar serviço" : "Novo serviço"}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminInput
              label="Nome"
              value={editing.name}
              onChange={(e) =>
                setEditing({ ...editing, name: e.target.value })
              }
            />
            <AdminSelect
              label="Categoria"
              value={editing.category}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  category: e.target.value as ServiceCategory,
                })
              }
            >
              {SERVICE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {SERVICE_CATEGORY_LABELS[cat]}
                </option>
              ))}
            </AdminSelect>
            <AdminSelect
              label="Negócio"
              value={editing.businessId ?? ""}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  businessId: (e.target.value || null) as BusinessId | null,
                })
              }
            >
              <option value="">Todos</option>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </AdminSelect>
            <AdminInput
              label="Preço (MZN)"
              type="number"
              min={0}
              step="0.01"
              value={editing.price}
              onChange={(e) =>
                setEditing({ ...editing, price: Number(e.target.value) })
              }
            />
            <AdminInput
              label="Ordem"
              type="number"
              value={editing.sortOrder}
              onChange={(e) =>
                setEditing({ ...editing, sortOrder: Number(e.target.value) })
              }
            />
          </div>
          <AdminTextarea
            label="Descrição"
            rows={3}
            value={editing.description}
            onChange={(e) =>
              setEditing({ ...editing, description: e.target.value })
            }
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={busy || !editing.name.trim()}
              className="admin-btn-primary"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="admin-btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-400/80">{error}</p> : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((service) => (
          <div
            key={service.id}
            className="p-4 border border-grey-dark/60 rounded-sm flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-white text-sm">{service.name}</p>
                <p className="text-[10px] font-mono text-admin-gold/60 mt-1 uppercase tracking-wider">
                  {SERVICE_CATEGORY_LABELS[service.category]}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label={`Editar ${service.name}`}
                  onClick={() =>
                    setEditing({
                      id: service.id,
                      businessId: service.businessIds?.[0] ?? defaultBusiness,
                      name: service.name,
                      description: service.description ?? "",
                      price: service.basePrice,
                      category: service.category,
                      sortOrder: 100,
                      isActive: true,
                    })
                  }
                  className="text-grey/50 hover:text-admin-gold"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label={`Remover ${service.name}`}
                  onClick={() => handleDelete(service.id, service.name)}
                  className="text-grey/50 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {service.description ? (
              <p className="text-xs text-grey/50 line-clamp-2">
                {service.description}
              </p>
            ) : null}
            <p className="text-admin-gold font-mono text-sm">
              {formatCurrency(service.basePrice)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
