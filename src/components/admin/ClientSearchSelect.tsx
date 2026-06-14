"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Client } from "@/lib/admin/types";

type ClientSearchSelectProps = {
  clients: Client[];
  value: string;
  onChange: (clientId: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
};

export default function ClientSearchSelect({
  clients,
  value,
  onChange,
  label = "Cliente",
  required = false,
  disabled = false,
}: ClientSearchSelectProps) {
  const [query, setQuery] = useState("");

  const selected = clients.find((client) => client.id === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (client) =>
        client.fullName.toLowerCase().includes(q) ||
        client.companyName.toLowerCase().includes(q) ||
        client.email.toLowerCase().includes(q) ||
        client.phone.toLowerCase().includes(q)
    );
  }, [clients, query]);

  return (
    <div className="space-y-2">
      <label className="block font-mono text-[9px] tracking-[0.35em] uppercase text-grey/60">
        {label}
        {required ? " *" : ""}
      </label>

      {selected ? (
        <div className="flex items-center justify-between gap-3 border border-grey-dark/80 px-3 py-2.5">
          <div>
            <p className="text-sm text-white/85">{selected.fullName}</p>
            {selected.companyName ? (
              <p className="text-xs text-grey/50 mt-0.5">{selected.companyName}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            disabled={disabled}
            className="text-[10px] font-mono tracking-[0.15em] uppercase text-grey/50 hover:text-admin-gold"
          >
            Alterar
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-grey/40" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar cliente…"
              disabled={disabled}
              className="admin-input w-full pl-10"
            />
          </div>
          <div className="max-h-40 overflow-y-auto border border-grey-dark/80 divide-y divide-grey-dark/60">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-sm text-grey/50 text-center">
                Nenhum cliente encontrado.
              </p>
            ) : (
              filtered.slice(0, 12).map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => {
                    onChange(client.id);
                    setQuery("");
                  }}
                  disabled={disabled}
                  className="w-full text-left px-3 py-2.5 hover:bg-white/5 transition-colors"
                >
                  <p className="text-sm text-white/85">{client.fullName}</p>
                  <p className="text-xs text-grey/50 mt-0.5">
                    {client.phone || client.email || "—"}
                  </p>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
