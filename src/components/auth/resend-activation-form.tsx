"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

type ResendActivationFormProps = {
  initialEmail?: string;
  onSuccess?: () => void;
};

export default function ResendActivationForm({
  initialEmail = "",
  onSuccess,
}: ResendActivationFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Introduza um endereço de email válido.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/portal-auth/resend-activation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email: trimmed }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Não foi possível reenviar o link de activação.");
        return;
      }

      setSuccessMessage(
        data.message ??
          "Se este endereço estiver associado a uma conta pendente de activação, enviámos um novo link por email.",
      );
      if (onSuccess) {
        onSuccess();
      }
    } catch {
      setError("Não foi possível ligar ao servidor. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (successMessage) {
    return (
      <div className="space-y-4 text-center">
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-3.5 text-xs font-medium text-emerald-900"
        >
          {successMessage}
        </div>
        <p className="text-xs text-brand-text-dark/70">
          Consulte a sua caixa de entrada e siga as instruções no email recebido.
        </p>
        <div className="pt-2">
          <Link
            href="/sign-in"
            className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-brand-gold hover:underline"
          >
            Voltar ao início de sessão
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-xs font-medium text-red-800"
        >
          {error}
        </p>
      ) : null}

      <label className="block space-y-1.5 text-left">
        <span className="pl-1 font-mono text-[9px] font-bold uppercase tracking-wider text-brand-text-dark">
          Endereço de email
        </span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={loading}
          placeholder="o.vosso.email@exemplo.com"
          className="w-full rounded-xl border border-brand-champagne/60 bg-brand-ivory/70 px-4 py-3 text-sm text-brand-text-dark placeholder:text-brand-text-dark/40 focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/30 disabled:opacity-60"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-black px-6 py-3.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white hover:bg-black/90 disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            A enviar…
          </>
        ) : (
          "Pedir novo link de activação"
        )}
      </button>
    </form>
  );
}
