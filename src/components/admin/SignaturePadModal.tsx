"use client";

import { useRef, useState } from "react";
import { PenLine, X } from "lucide-react";
import SignaturePad, { type SignaturePadHandle } from "@/components/admin/SignaturePad";

type SignaturePadModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (dataUrl: string) => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
};

export default function SignaturePadModal({
  open,
  onClose,
  onConfirm,
  title = "Assinar online",
  description = "Desenhe a sua assinatura com o rato ou o dedo no ecrã táctil.",
  confirmLabel = "Aplicar assinatura",
}: SignaturePadModalProps) {
  const padRef = useRef<SignaturePadHandle>(null);
  const [error, setError] = useState("");

  if (!open) return null;

  function handleConfirm() {
    const dataUrl = padRef.current?.toDataUrl();
    if (!dataUrl) {
      setError("Desenhe a assinatura antes de confirmar.");
      return;
    }
    setError("");
    onConfirm(dataUrl);
    padRef.current?.clear();
  }

  function handleClose() {
    setError("");
    padRef.current?.clear();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signature-pad-title"
    >
      <div className="admin-card w-full max-w-xl p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3
              id="signature-pad-title"
              className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold"
            >
              {title}
            </h3>
            <p className="text-sm text-grey/60 mt-2">{description}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-grey/50 hover:text-white p-1"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2 text-[10px] font-mono uppercase tracking-wider text-grey/50">
            <PenLine className="w-3.5 h-3.5" />
            Área de assinatura
          </div>
          <SignaturePad ref={padRef} />
        </div>

        {error ? <p className="text-sm text-red-400 mb-4">{error}</p> : null}

        <div className="flex flex-wrap gap-3 justify-end">
          <button type="button" onClick={handleClose} className="admin-btn-secondary">
            Cancelar
          </button>
          <button type="button" onClick={handleConfirm} className="admin-btn-primary">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
