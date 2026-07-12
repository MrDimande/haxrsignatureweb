"use client";

import { useState, useTransition } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { getConciergeFileUrlAction } from "@/lib/concierge/actions/concierge.actions";
import type { EventMoodboardItem } from "@/lib/concierge/types";

const IMAGE_MIME_PREFIX = "image/";

type ConciergeAppliedMoodboardProps = {
  eventId: string;
  items: EventMoodboardItem[];
};

export default function ConciergeAppliedMoodboard({
  eventId,
  items,
}: ConciergeAppliedMoodboardProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const openFile = (item: EventMoodboardItem) => {
    if (!item.storagePath) {
      setError("Ficheiro original não disponível para este item.");
      return;
    }

    setError(null);
    setLoadingId(item.id);
    startTransition(async () => {
      const result = await getConciergeFileUrlAction({
        eventId,
        storagePath: item.storagePath,
      });
      setLoadingId(null);
      if (!result.success) {
        setError(result.error);
        return;
      }
      window.open(result.data.url, "_blank", "noopener,noreferrer");
    });
  };

  if (!items.length) {
    return (
      <p className="p-6 text-sm text-stone-500 border border-stone-800">
        Nenhuma referência visual aplicada via Concierge. Aprove uma imagem ou
        inspiração na fila para ver o moodboard aqui.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm text-red-400 border border-red-400/30 bg-red-400/10 px-4 py-3">
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="border border-stone-800 p-4 flex flex-col gap-3"
          >
            <div>
              <p className="text-sm font-medium text-stone-100">
                {item.title || "Referência visual"}
              </p>
              <p className="text-xs text-stone-500 mt-1">
                {item.category || "Geral"}
                {item.tags.length > 0 ? ` · ${item.tags.join(", ")}` : ""}
              </p>
              {item.notes && (
                <p className="text-xs text-stone-400 mt-2 line-clamp-3">
                  {item.notes}
                </p>
              )}
            </div>
            {item.storagePath ? (
              <button
                type="button"
                onClick={() => openFile(item)}
                disabled={loadingId === item.id}
                className="inline-flex items-center gap-2 text-xs text-admin-gold border border-admin-gold/40 px-3 py-2 hover:bg-admin-gold/10 disabled:opacity-50 w-fit"
              >
                {loadingId === item.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ExternalLink className="w-3.5 h-3.5" />
                )}
                Ver ficheiro original
              </button>
            ) : (
              <p className="text-xs text-stone-600">Sem ficheiro associado</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function isPreviewableMime(mimeType: string): boolean {
  return (
    mimeType.startsWith(IMAGE_MIME_PREFIX) || mimeType === "application/pdf"
  );
}
