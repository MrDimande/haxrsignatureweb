"use client";

import { useState, useTransition } from "react";
import { Copy, ExternalLink, Link2 } from "lucide-react";
import { ensureClientPortalLinkAction } from "@/lib/portal/actions/portal.actions";

type ClientPortalPanelProps = {
  clientId: string;
  initialUrl?: string | null;
};

export default function ClientPortalPanel({
  clientId,
  initialUrl,
}: ClientPortalPanelProps) {
  const [portalUrl, setPortalUrl] = useState(initialUrl ?? "");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    setError("");
    startTransition(async () => {
      const result = await ensureClientPortalLinkAction(clientId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setPortalUrl(result.data);
    });
  }

  async function handleCopy() {
    if (!portalUrl) return;
    await navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="admin-card p-6 mb-8 border-admin-gold/15 space-y-4">
      <div>
        <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-admin-gold/80 mb-2">
          Portal do cliente
        </p>
        <h3 className="font-serif text-xl font-light text-white/90">
          Partilhar documentos com o cliente
        </h3>
        <p className="text-sm text-grey/55 mt-2">
          Link privado para o cliente ver facturas e recibos com estado Enviado ou
          Pago.
        </p>
      </div>

      {portalUrl ? (
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            readOnly
            value={portalUrl}
            className="flex-1 bg-black-soft border border-grey-dark/80 rounded-sm px-4 py-3 text-sm text-grey font-mono"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="admin-btn-secondary"
            >
              <Copy className="w-4 h-4" />
              {copied ? "Copiado" : "Copiar"}
            </button>
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn-secondary"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir
            </a>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isPending}
          className="admin-btn-primary"
        >
          <Link2 className="w-4 h-4" />
          {isPending ? "A gerar link…" : "Gerar link do portal"}
        </button>
      )}

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </section>
  );
}
