"use client";

import { MessageCircle } from "lucide-react";
import {
  buildEventWhatsAppShortcuts,
  whatsAppUrlForShortcut,
} from "@/lib/admin/services/event-whatsapp-shortcuts.service";
import type { ManagedEvent } from "@/lib/events/types";

type EventWhatsAppShortcutsPanelProps = {
  event: ManagedEvent;
  clientPhone?: string | null;
  portalUrl?: string | null;
  documentNumber?: string | null;
  documentAmount?: string | null;
};

export default function EventWhatsAppShortcutsPanel({
  event,
  clientPhone,
  portalUrl,
  documentNumber,
  documentAmount,
}: EventWhatsAppShortcutsPanelProps) {
  const shortcuts = buildEventWhatsAppShortcuts({
    event,
    clientPhone,
    portalUrl,
    documentNumber: documentNumber ?? undefined,
    documentAmount: documentAmount ?? undefined,
  });

  return (
    <section className="admin-card p-6 mb-8 border-admin-gold/10 space-y-4">
      <div>
        <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-admin-gold/80 mb-2">
          WhatsApp-first
        </p>
        <h3 className="font-serif text-xl font-light text-white/90">
          Atalhos operacionais por WhatsApp
        </h3>
      </div>
      <div className="flex flex-wrap gap-3">
        {shortcuts.map((shortcut) => {
          const url = whatsAppUrlForShortcut(shortcut);
          return (
            <a
              key={shortcut.id}
              href={url ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className={`admin-btn-secondary ${url ? "" : "opacity-50 pointer-events-none"}`}
            >
              <MessageCircle className="w-4 h-4" />
              {shortcut.label}
            </a>
          );
        })}
      </div>
    </section>
  );
}
