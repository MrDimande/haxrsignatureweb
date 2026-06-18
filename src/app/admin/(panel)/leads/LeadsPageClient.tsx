"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Mail, MessageCircle } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import DataTable from "@/components/admin/DataTable";
import { updateInquiryStatusAction } from "@/lib/admin/actions/inquiries.actions";
import {
  INQUIRY_STATUS_LABELS,
  INQUIRY_STATUS_STYLES,
} from "@/lib/contact/constants";
import { projectTypeLabels } from "@/lib/site-config";
import type { ContactInquiry, InquiryStatus } from "@/lib/contact/types";

const STATUS_OPTIONS: InquiryStatus[] = [
  "new",
  "contacted",
  "converted",
  "archived",
];

type LeadsPageClientProps = {
  initialInquiries: ContactInquiry[];
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-MZ", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Africa/Maputo",
  });
}

export default function LeadsPageClient({
  initialInquiries,
}: LeadsPageClientProps) {
  const router = useRouter();
  const [inquiries, setInquiries] = useState(initialInquiries);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function handleStatusChange(id: string, status: InquiryStatus) {
    setUpdatingId(id);
    const result = await updateInquiryStatusAction(id, status);
    setUpdatingId(null);

    if (result.success) {
      setInquiries((prev) =>
        prev.map((item) => (item.id === id ? result.data : item))
      );
      router.refresh();
    }
  }

  const columns = [
    {
      key: "contact",
      header: "Contacto",
      render: (row: ContactInquiry) => (
        <div>
          <p className="text-white/90">{row.name}</p>
          <p className="text-grey/50 text-xs mt-1">{row.email}</p>
        </div>
      ),
    },
    {
      key: "project",
      header: "Projecto",
      render: (row: ContactInquiry) => (
        <div>
          <p>{projectTypeLabels[row.projectType] ?? row.projectType}</p>
          {row.packageLabel ? (
            <p className="text-grey/40 text-[10px] font-mono mt-0.5">
              {row.packageLabel}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: "intent",
      header: "O que pretende",
      className: "max-w-sm",
      render: (row: ContactInquiry) => (
        <p className="text-sm text-grey line-clamp-3" title={row.intent}>
          {row.intent}
        </p>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: (row: ContactInquiry) => (
        <select
          value={row.status}
          disabled={updatingId === row.id}
          onChange={(e) =>
            handleStatusChange(row.id, e.target.value as InquiryStatus)
          }
          onClick={(e) => e.stopPropagation()}
          className={`text-[10px] font-mono tracking-[0.15em] uppercase px-2 py-1 border rounded-sm bg-transparent cursor-pointer disabled:opacity-50 ${INQUIRY_STATUS_STYLES[row.status]}`}
          aria-label={`Estado de ${row.name}`}
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status} className="bg-black text-white">
              {INQUIRY_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: "date",
      header: "Data",
      render: (row: ContactInquiry) => (
        <span className="text-xs text-grey/60 font-mono">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right w-24",
      render: (row: ContactInquiry) => (
        <div className="flex justify-end gap-2">
          <a
            href={`mailto:${row.email}`}
            onClick={(e) => e.stopPropagation()}
            className="p-2 text-grey hover:text-admin-gold"
            aria-label="Enviar email"
          >
            <Mail className="w-4 h-4" />
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `Olá ${row.name}, obrigado pelo seu contacto à HAXR Signature.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-2 text-grey hover:text-admin-gold"
            aria-label="WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
          </a>
        </div>
      ),
    },
  ];

  const newCount = inquiries.filter((i) => i.status === "new").length;

  return (
    <AdminShell
      title="Leads"
      subtitle={
        newCount > 0
          ? `${newCount} pedido${newCount === 1 ? "" : "s"} novo${newCount === 1 ? "" : "s"}`
          : "Pedidos de contacto do website"
      }
      actions={
        <a
          href="/#contacto"
          target="_blank"
          rel="noopener noreferrer"
          className="admin-btn-secondary inline-flex items-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          Ver formulário
        </a>
      }
    >
      <DataTable
        columns={columns}
        data={inquiries}
        keyExtractor={(row) => row.id}
        emptyMessage="Ainda não há pedidos de contacto."
      />
    </AdminShell>
  );
}
