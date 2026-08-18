"use client";

import { useState } from "react";
import Link from "next/link";

export default function SubmitWeddingForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [coupleNames, setCoupleNames] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [instagram, setInstagram] = useState("");
  const [story, setStory] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);
    try {
      const response = await fetch("/api/marketing/submit-wedding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          coupleNames,
          eventDate,
          location,
          instagram,
          story,
          marketingOptIn,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setStatus(payload.error ?? "Não foi possível enviar. Tente novamente.");
        return;
      }
      setStatus("Obrigado. A equipa editorial irá analisar a vossa história.");
      setStory("");
    } catch {
      setStatus("Erro de ligação. Tente novamente ou use /contacto.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full border border-brand-champagne/45 bg-white px-4 py-3 font-sans text-sm text-brand-text-dark outline-none focus:border-brand-gold";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="block text-xs text-brand-text-dark/70">
          O vosso nome
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`mt-2 ${inputClass}`}
          />
        </label>
        <label className="block text-xs text-brand-text-dark/70">
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`mt-2 ${inputClass}`}
          />
        </label>
        <label className="block text-xs text-brand-text-dark/70">
          Nomes do casal
          <input
            required
            value={coupleNames}
            onChange={(e) => setCoupleNames(e.target.value)}
            className={`mt-2 ${inputClass}`}
          />
        </label>
        <label className="block text-xs text-brand-text-dark/70">
          Telefone / WhatsApp
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={`mt-2 ${inputClass}`}
          />
        </label>
        <label className="block text-xs text-brand-text-dark/70">
          Data do evento
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className={`mt-2 ${inputClass}`}
          />
        </label>
        <label className="block text-xs text-brand-text-dark/70">
          Local
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Maputo, Moçambique"
            className={`mt-2 ${inputClass}`}
          />
        </label>
      </div>

      <label className="block text-xs text-brand-text-dark/70">
        Instagram (opcional)
        <input
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
          placeholder="@casal"
          className={`mt-2 ${inputClass}`}
        />
      </label>

      <label className="block text-xs text-brand-text-dark/70">
        Conte a história do vosso casamento
        <textarea
          required
          minLength={20}
          rows={6}
          value={story}
          onChange={(e) => setStory(e.target.value)}
          placeholder="Porque gostariam de ver o vosso casamento no portfólio HAXR?"
          className={`mt-2 ${inputClass}`}
        />
      </label>

      <label className="flex items-center gap-2 text-xs text-brand-text-dark/70">
        <input
          type="checkbox"
          checked={marketingOptIn}
          onChange={(e) => setMarketingOptIn(e.target.checked)}
        />
        Aceito receber comunicação editorial da HAXR Signature
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={submitting}
          className="btn-editorial btn-editorial--solid px-8 py-3.5 disabled:opacity-60"
        >
          {submitting ? "A enviar…" : "Submeter história"}
        </button>
        <Link
          href="/portfolio"
          className="font-mono text-[9px] uppercase tracking-[0.25em] text-brand-text-dark/55 hover:text-brand-gold"
        >
          Voltar ao portfólio
        </Link>
      </div>

      {status ? <p className="text-sm text-brand-gold">{status}</p> : null}
    </form>
  );
}
