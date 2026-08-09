"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import {
  AUTH_LEGAL_DOCUMENT_IDS,
  getAuthLegalDocument,
  type AuthLegalDocumentId,
} from "@/lib/auth/legal-documents";

type AuthLegalDialogProps = {
  documentId: AuthLegalDocumentId | null;
  onSelect: (documentId: AuthLegalDocumentId) => void;
  onClose: () => void;
};

export default function AuthLegalDialog({
  documentId,
  onSelect,
  onClose,
}: AuthLegalDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const legalDocument = documentId ? getAuthLegalDocument(documentId) : null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (documentId && !dialog.open) {
      dialog.showModal();
      return;
    }

    if (!documentId && dialog.open) {
      dialog.close();
    }
  }, [documentId]);

  useEffect(() => {
    if (!documentId) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      event.preventDefault();
      onClose();
    };

    document.addEventListener("keydown", handleEscape, true);
    return () => document.removeEventListener("keydown", handleEscape, true);
  }, [documentId, onClose]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="auth-legal-dialog-title"
      className="m-auto w-[calc(100%-2rem)] max-w-2xl rounded-2xl border border-brand-champagne/45 bg-brand-ivory p-0 text-brand-text-dark shadow-[0_28px_100px_rgba(0,0,0,0.35)] backdrop:bg-black/75 backdrop:backdrop-blur-sm"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {legalDocument ? (
        <div className="max-h-[min(82vh,760px)] overflow-y-auto p-6 sm:p-8">
          <div className="flex items-start justify-between gap-6 border-b border-brand-champagne/40 pb-5">
            <div>
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.24em] text-brand-gold">
                Informação legal HAXR
              </p>
              <h2
                id="auth-legal-dialog-title"
                className="mt-2 font-serif text-2xl font-light text-brand-text-dark sm:text-3xl"
              >
                {legalDocument.label}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand-champagne/50 bg-white text-brand-text-dark/65 transition-colors hover:border-brand-gold hover:text-brand-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
              aria-label="Fechar informação legal"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2" aria-label="Documentos legais">
            {AUTH_LEGAL_DOCUMENT_IDS.map((id) => {
              const item = getAuthLegalDocument(id);
              const active = id === documentId;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelect(id)}
                  aria-pressed={active}
                  className={`rounded-full border px-4 py-2 font-mono text-[9px] font-semibold uppercase tracking-wider transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 ${
                    active
                      ? "border-brand-gold bg-brand-gold text-white"
                      : "border-brand-champagne/50 bg-white text-brand-text-dark/70 hover:border-brand-gold hover:text-brand-gold"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <article className="mt-7">
            <h3 className="font-serif text-xl font-light leading-snug text-brand-text-dark">
              {legalDocument.headline}
            </h3>
            <div className="mt-5 space-y-4">
              {legalDocument.paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="font-sans text-sm font-light leading-7 text-brand-text-dark/75"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </article>

          <div className="mt-8 border-t border-brand-champagne/40 pt-5 text-right">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-brand-black px-6 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
            >
              Voltar ao registo
            </button>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
