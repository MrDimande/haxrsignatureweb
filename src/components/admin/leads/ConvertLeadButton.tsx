"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightCircle, Loader2 } from "lucide-react";
import { convertLeadAction } from "@/lib/admin/actions/inquiries.actions";
import type { ContactInquiry } from "@/lib/contact/types";

type ConvertLeadButtonProps = {
  inquiry: ContactInquiry;
};

export default function ConvertLeadButton({ inquiry }: ConvertLeadButtonProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  if (inquiry.status === "converted") {
    return (
      <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400/80">
        Convertido
      </span>
    );
  }

  function handleConvert(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setError("");

    startTransition(async () => {
      const result = await convertLeadAction(inquiry.id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(`/admin/events/${result.data.event.id}`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleConvert}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-admin-gold hover:text-white transition-colors disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <ArrowRightCircle className="w-3.5 h-3.5" />
        )}
        Criar cliente + evento
      </button>
      {error ? (
        <span className="text-[10px] text-red-300 max-w-[160px] text-right">
          {error}
        </span>
      ) : null}
    </div>
  );
}
