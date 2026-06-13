"use client";

import type { DocumentStatus } from "@/lib/admin/types";
import { DOCUMENT_STATUS_LABELS } from "@/lib/admin/constants";

const statusStyles: Record<DocumentStatus, string> = {
  draft: "bg-grey/10 text-grey border-grey/20",
  sent: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  paid: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  cancelled: "bg-red-500/10 text-red-300 border-red-500/20",
};

export default function StatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-sm border font-mono text-[8px] tracking-[0.2em] uppercase ${statusStyles[status]}`}
    >
      {DOCUMENT_STATUS_LABELS[status]}
    </span>
  );
}
