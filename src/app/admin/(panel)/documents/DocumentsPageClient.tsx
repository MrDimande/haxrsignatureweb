"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import DataTable from "@/components/admin/DataTable";
import DocumentDeletePanel from "@/components/admin/DocumentDeletePanel";
import StatusBadge from "@/components/admin/StatusBadge";
import { formatCurrency } from "@/lib/calculations";
import { DOCUMENT_TYPE_LABELS } from "@/lib/admin/constants";
import { getBusiness } from "@/lib/admin/businesses";
import type { DocumentType, InvoiceDocument } from "@/lib/admin/types";

type DocumentsPageClientProps = {
  documents: InvoiceDocument[];
};

type Filter = "all" | DocumentType;

export default function DocumentsPageClient({
  documents: initialDocuments,
}: DocumentsPageClientProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState(initialDocuments);
  const [filter, setFilter] = useState<Filter>("all");
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] =
    useState<InvoiceDocument | null>(null);

  const filtered = useMemo(() => {
    if (filter === "all") return documents;
    return documents.filter((d) => d.documentType === filter);
  }, [documents, filter]);

  const tabs: { id: Filter; label: string }[] = [
    { id: "all", label: "Todos" },
    { id: "proforma", label: "Proformas" },
    { id: "invoice", label: "Facturas" },
    { id: "receipt", label: "Recibos" },
  ];

  const newDocumentLinks = useMemo(
    () =>
      (["proforma", "invoice", "receipt"] as DocumentType[]).map((type) => ({
        type,
        label: DOCUMENT_TYPE_LABELS[type],
        href: `/admin/documents/new?type=${type}`,
      })),
    []
  );

  const columns = [
    {
      key: "number",
      header: "N.º",
      render: (row: InvoiceDocument) => (
        <span className="font-mono text-xs text-admin-gold">
          {row.documentNumber}
        </span>
      ),
    },
    {
      key: "type",
      header: "Tipo",
      render: (row: InvoiceDocument) => DOCUMENT_TYPE_LABELS[row.documentType],
    },
    {
      key: "client",
      header: "Cliente",
      render: (row: InvoiceDocument) => row.clientName || "—",
    },
    {
      key: "business",
      header: "Empresa",
      render: (row: InvoiceDocument) => getBusiness(row.businessId).name,
    },
    {
      key: "total",
      header: "Total",
      className: "text-right",
      render: (row: InvoiceDocument) =>
        formatCurrency(row.totals.grandTotal, row.totals.currency),
    },
    {
      key: "status",
      header: "Estado",
      render: (row: InvoiceDocument) => <StatusBadge status={row.status} />,
    },
    {
      key: "pdf",
      header: "PDF",
      render: (row: InvoiceDocument) =>
        row.pdfGeneratedAt ? (
          <span className="text-emerald-400 text-xs">Gerado</span>
        ) : (
          <span className="text-grey/40 text-xs">—</span>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right w-12",
      render: (row: InvoiceDocument) => (
        <button
          type="button"
          onClick={() => setDocumentToDelete(row)}
          className="p-2 text-grey/40 hover:text-red-300/90 transition-colors"
          aria-label={`Remover ${row.documentNumber}`}
          title="Remover documento"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <AdminShell
      title="Documentos"
      subtitle="Proformas, facturas e recibos"
      actions={
        <div className="relative">
          <button
            type="button"
            onClick={() => setNewMenuOpen((open) => !open)}
            className="admin-btn-primary"
          >
            <Plus className="w-4 h-4" />
            Novo Documento
            <ChevronDown className="w-4 h-4" />
          </button>
          {newMenuOpen ? (
            <>
              <button
                type="button"
                className="fixed inset-0 z-10 cursor-default"
                aria-label="Fechar menu"
                onClick={() => setNewMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 z-20 min-w-[220px] admin-card py-2 shadow-xl">
                {newDocumentLinks.map((item) => (
                  <Link
                    key={item.type}
                    href={item.href}
                    onClick={() => setNewMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm text-grey hover:text-white hover:bg-white/5 transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </>
          ) : null}
        </div>
      }
    >
      <div className="flex gap-1 border-b border-grey-dark/80 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`admin-tab shrink-0 ${
              filter === tab.id ? "admin-tab--active" : ""
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(row) => row.id}
        rowHref={(row) => `/admin/documents/${row.id}`}
        linkedColumnKeys={["number", "type", "client", "business", "total", "status", "pdf"]}
        emptyMessage="Nenhum documento encontrado."
      />

      {documentToDelete ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6">
          <button
            type="button"
            className="absolute inset-0 bg-black/75"
            aria-label="Fechar"
            onClick={() => setDocumentToDelete(null)}
          />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <DocumentDeletePanel
              document={documentToDelete}
              compact
              onCancel={() => setDocumentToDelete(null)}
              onDeleted={() => {
                setDocuments((prev) =>
                  prev.filter((d) => d.id !== documentToDelete.id)
                );
                setDocumentToDelete(null);
                router.refresh();
              }}
            />
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
