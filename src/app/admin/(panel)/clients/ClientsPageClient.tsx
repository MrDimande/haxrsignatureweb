"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import ClientForm from "@/components/admin/ClientForm";
import DataTable from "@/components/admin/DataTable";
import { deleteClientAction } from "@/lib/admin/actions/clients.actions";
import { CLIENT_TYPE_LABELS } from "@/lib/admin/constants";
import type { Client } from "@/lib/admin/types";

type ClientsPageClientProps = {
  initialClients: Client[];
};

export default function ClientsPageClient({
  initialClients,
}: ClientsPageClientProps) {
  const router = useRouter();
  const [clients, setClients] = useState(initialClients);
  const [editing, setEditing] = useState<Client | null>(null);
  const [creating, setCreating] = useState(false);

  async function handleDelete(id: string) {
    if (!confirm("Eliminar este cliente?")) return;
    const result = await deleteClientAction(id);
    if (result.success) {
      setClients((prev) => prev.filter((c) => c.id !== id));
      router.refresh();
    }
  }

  const columns = [
    {
      key: "name",
      header: "Cliente",
      render: (row: Client) => (
        <div>
          <p>{row.fullName}</p>
          <p className="text-grey/40 text-[10px] font-mono mt-0.5">
            {CLIENT_TYPE_LABELS[row.clientType]}
          </p>
          {row.companyName ? (
            <p className="text-grey/50 text-xs mt-1">{row.companyName}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contacto",
      render: (row: Client) => (
        <div className="text-sm text-grey">{row.phone || row.email || "—"}</div>
      ),
    },
    {
      key: "nuit",
      header: "NUIT",
      render: (row: Client) => row.nuit || "—",
    },
    {
      key: "actions",
      header: "",
      className: "text-right w-28",
      render: (row: Client) => (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setEditing(row);
              setCreating(false);
            }}
            className="p-2 text-grey hover:text-admin-gold"
            aria-label="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.id);
            }}
            className="p-2 text-grey hover:text-red-400"
            aria-label="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminShell
      title="Clientes"
      subtitle="Base de clientes recorrentes"
      actions={
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setEditing(null);
          }}
          className="admin-btn-primary"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </button>
      }
    >
      {(creating || editing) ? (
        <div className="admin-card p-6 mb-8">
          <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold mb-6">
            {editing ? "Editar Cliente" : "Novo Cliente"}
          </h2>
          <ClientForm
            client={editing ?? undefined}
            onSaved={(client) => {
              setClients((prev) => {
                const exists = prev.find((c) => c.id === client.id);
                if (exists) {
                  return prev.map((c) => (c.id === client.id ? client : c));
                }
                return [...prev, client];
              });
              setCreating(false);
              setEditing(null);
              router.refresh();
            }}
            onCancel={() => {
              setCreating(false);
              setEditing(null);
            }}
          />
        </div>
      ) : null}

      <DataTable
        columns={columns}
        data={clients}
        keyExtractor={(row) => row.id}
        rowHref={(row) => `/admin/clients/${row.id}`}
        emptyMessage="Nenhum cliente registado. Adicione o primeiro."
      />
    </AdminShell>
  );
}
