"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function validatePassword(value: string): string | null {
  if (value.length < 12) return "Use pelo menos 12 caracteres.";
  if (value.length > 1024) return "A palavra-passe excede o limite permitido.";
  return null;
}

export default function ActivateAccountForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = searchParams?.get("token") ?? "";
    const passwordError = validatePassword(password);
    if (passwordError) return setError(passwordError);
    if (password !== confirmation) return setError("As palavras-passe não coincidem.");
    if (!token) return setError("O link de activação é inválido ou está incompleto.");

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/portal-auth/activate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ token, password }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) return setError(body.error ?? "Não foi possível activar a conta.");
      setComplete(true);
      window.setTimeout(() => router.replace("/sign-in?activated=1"), 900);
    } catch {
      setError("Não foi possível ligar ao servidor. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (complete) {
    return <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center text-sm text-emerald-800">Conta activada. A redireccionar para o início de sessão…</div>;
  }

  return (
    <div className="haxr-auth-card rounded-[1.75rem] p-6 backdrop-blur-xl sm:p-9">
      <h1 className="font-serif text-3xl font-light text-brand-text-dark">Definir palavra-passe</h1>
      <p className="mt-3 font-sans text-sm font-light leading-relaxed text-brand-text-dark/65">Escolha uma nova palavra-passe para activar o vosso acesso HAXR. O link é de utilização única.</p>
      <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
        {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700" role="alert">{error}</p> : null}
        <label className="block space-y-1.5"><span className="pl-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-brand-text-dark/60">Nova palavra-passe</span><input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={loading} className="w-full rounded-xl border border-brand-champagne/45 bg-brand-ivory/55 px-4 py-3.5 text-sm text-brand-text-dark focus:outline-none focus:ring-2 focus:ring-brand-gold/25" /></label>
        <label className="block space-y-1.5"><span className="pl-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-brand-text-dark/60">Confirmar palavra-passe</span><input type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={loading} className="w-full rounded-xl border border-brand-champagne/45 bg-brand-ivory/55 px-4 py-3.5 text-sm text-brand-text-dark focus:outline-none focus:ring-2 focus:ring-brand-gold/25" /></label>
        <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-black px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white disabled:opacity-70">{loading ? <><Loader2 className="h-4 w-4 animate-spin" />A activar…</> : "Activar conta"}</button>
      </form>
      <p className="mt-6 text-center text-xs text-brand-text-dark/65"><Link href="/sign-in" className="font-semibold text-brand-gold hover:underline">Voltar ao início de sessão</Link></p>
    </div>
  );
}
