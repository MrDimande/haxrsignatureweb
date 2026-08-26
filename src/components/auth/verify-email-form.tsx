"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { isOnboardingComplete } from "@/lib/auth/onboarding-status";
import { resolvePostLoginRedirectWithReturnPath } from "@/lib/auth/client-app-middleware";
import {
  resendNeonEmailVerificationOtp,
  verifyNeonEmailOtp,
} from "@/lib/supabase/browser";
import {
  clearPendingNeonEmailVerification,
  readPendingNeonEmailVerification,
  stashPendingNeonEmailVerification,
} from "@/lib/neon/pending-auth";

function mapOtpError(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes("expired")) return "O código expirou. Peça um novo código.";
  if (normalized.includes("invalid") || normalized.includes("otp")) {
    return "Código inválido. Confirme os dígitos recebidos e tente novamente.";
  }
  if (normalized.includes("too many")) {
    return "Foram feitas demasiadas tentativas. Peça um novo código.";
  }
  return "Não foi possível confirmar o email. Tente novamente.";
}

export default function VerifyEmailForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setEmail(readPendingNeonEmailVerification() ?? "");
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const normalizedEmail = email.trim();
    const normalizedOtp = otp.trim();
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setError("Introduza o email usado para criar a conta.");
      return;
    }
    if (!/^\d{4,10}$/.test(normalizedOtp)) {
      setError("Introduza o código numérico recebido por email.");
      return;
    }

    setLoading(true);
    const result = await verifyNeonEmailOtp(normalizedEmail, normalizedOtp);
    if (result.error) {
      setError(mapOtpError(result.error.message));
      setLoading(false);
      return;
    }

    clearPendingNeonEmailVerification();
    router.push(resolvePostLoginRedirectWithReturnPath(null, isOnboardingComplete()));
    router.refresh();
  };

  const handleResend = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setError("Introduza o email usado para criar a conta.");
      return;
    }

    setError(null);
    setMessage(null);
    setResending(true);
    const result = await resendNeonEmailVerificationOtp(normalizedEmail);
    if (result.error) {
      setError(mapOtpError(result.error.message));
    } else {
      stashPendingNeonEmailVerification(normalizedEmail);
      setMessage("Enviámos um novo código de verificação.");
    }
    setResending(false);
  };

  const inputClass =
    "w-full rounded-xl border border-brand-champagne/45 bg-brand-ivory/55 px-4 py-3.5 font-sans text-sm font-light text-brand-text-dark placeholder:text-zinc-400 transition-all focus:border-brand-gold focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold/25";

  return (
    <div className="haxr-auth-card rounded-[1.75rem] p-6 backdrop-blur-xl sm:p-9">
      <header className="mb-8 space-y-3 text-left">
        <div className="flex items-center gap-3 font-mono text-[8px] font-semibold uppercase tracking-[0.3em] text-brand-gold">
          <span className="h-px w-8 bg-brand-gold" aria-hidden />
          Confirmar identidade
        </div>
        <h1 className="font-serif text-3xl font-light tracking-[-0.02em] text-brand-text-dark">
          Verifique o vosso email
        </h1>
        <p className="font-sans text-sm font-light leading-relaxed text-brand-text-dark/70">
          Introduza o código enviado por email para activar a conta HAXR e preservar o vosso acesso ao painel.
        </p>
      </header>

      {error ? (
        <p className="mb-5 rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mb-5 rounded-xl border border-brand-gold/25 bg-brand-gold/10 px-4 py-3 text-xs text-brand-text-dark" role="status">
          {message}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="verify-email" className="pl-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-brand-text-dark/60">
            Email
          </label>
          <input id="verify-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} disabled={loading || resending} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="verify-otp" className="pl-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-brand-text-dark/60">
            Código de verificação
          </label>
          <input id="verify-otp" inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="000000" className={`${inputClass} text-center font-mono text-lg tracking-[0.35em]`} disabled={loading || resending} />
        </div>

        <button type="submit" disabled={loading || resending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-black px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white disabled:opacity-70">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          <span>{loading ? "A confirmar..." : "Confirmar email"}</span>
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between gap-4 text-xs">
        <button type="button" onClick={handleResend} disabled={loading || resending} className="font-semibold text-brand-gold hover:underline disabled:opacity-60">
          {resending ? "A reenviar..." : "Reenviar código"}
        </button>
        <Link href="/sign-in" className="font-semibold text-brand-text-dark/60 hover:text-brand-gold">
          Voltar ao início de sessão
        </Link>
      </div>
    </div>
  );
}
