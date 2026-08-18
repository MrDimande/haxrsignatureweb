"use client";

import { useState } from "react";
import type { GuiaItem } from "@/lib/marketing/guias";

type LeadMagnetFormProps = {
  guia: GuiaItem;
};

export default function LeadMagnetForm({ guia }: LeadMagnetFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);
    try {
      const response = await fetch("/api/marketing/lead-magnet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          guiaId: guia.id,
          guiaTitle: guia.title,
          source: guia.source,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setStatus(payload.error ?? "Não foi possível registar o pedido.");
        return;
      }
      setStatus("Obrigado. A equipa HAXR enviará o guia por email em breve.");
    } catch {
      setStatus("Erro de ligação. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-3 border-t border-brand-champagne/30 pt-6">
      <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-brand-gold">
        Receber por email
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome"
          className="border border-brand-champagne/45 px-3 py-2 text-sm"
        />
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="border border-brand-champagne/45 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-brand-gold hover:text-brand-gold-light disabled:opacity-60"
      >
        {submitting ? "A registar…" : "Pedir guia gratuito"}
      </button>
      {status ? <p className="text-xs text-brand-text-dark/70">{status}</p> : null}
    </form>
  );
}
