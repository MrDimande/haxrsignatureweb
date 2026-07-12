"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { ManagedEvent } from "@/lib/events/types";

type EventPortalPanelProps = {
  event: ManagedEvent;
  portalUrl?: string | null;
};

export default function EventPortalPanel({
  event,
  portalUrl,
}: EventPortalPanelProps) {
  return (
    <section className="admin-card p-6 space-y-4">
      <div>
        <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-admin-gold/80 mb-2">
          Portal do cliente
        </p>
        <h3 className="font-serif text-xl font-light text-white/90">
          Visibilidade para {event.clientName || "o cliente"}
        </h3>
        <p className="text-sm text-grey/55 mt-2">
          O cliente vê documentos com estado Enviado ou Pago através do link
          privado do portal.
        </p>
      </div>

      {event.clientId ? (
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/admin/clients/${event.clientId}`}
            className="admin-btn-secondary"
          >
            Gerir portal do cliente
          </Link>
          {portalUrl ? (
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn-secondary"
            >
              <ExternalLink className="w-4 h-4" />
              Pré-visualizar portal
            </a>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-grey/50">
          Associe um cliente a este evento para activar o portal.
        </p>
      )}
    </section>
  );
}
