"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

export type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  titleId?: string;
  descriptionId?: string;
  isSubmitting?: boolean;
  children: React.ReactNode;
  maxWidthClass?: string;
};

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  titleId = "accessible-modal-title",
  descriptionId = "accessible-modal-description",
  isSubmitting = false,
  children,
  maxWidthClass = "max-w-md",
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
      const timer = setTimeout(() => {
        if (dialogRef.current) {
          const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length > 0) {
            focusable[0].focus();
          } else {
            dialogRef.current.focus();
          }
        }
      }, 50);

      return () => clearTimeout(timer);
    } else if (previousActiveElementRef.current) {
      previousActiveElementRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (!isSubmitting) {
          onClose();
        }
        return;
      }

      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        aria-busy={isSubmitting}
        tabIndex={-1}
        className={`relative w-full ${maxWidthClass} rounded-lg border border-brand-champagne/20 bg-black-soft/95 p-6 shadow-2xl transition-all focus:outline-none`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h3 id={titleId} className="font-mono text-sm font-semibold uppercase tracking-wider text-brand-ivory">
              {title}
            </h3>
            {description ? (
              <p id={descriptionId} className="mt-1 text-xs text-grey-medium/80 leading-relaxed">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded p-1 text-grey-medium/60 hover:bg-white/10 hover:text-brand-ivory disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-gold/80"
            aria-label="Fechar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
