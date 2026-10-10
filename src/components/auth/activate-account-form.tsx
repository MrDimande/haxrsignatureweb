"use client";

import { useState, useId, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Check, X, Loader2 } from "lucide-react";

type ActivateAccountFormProps = {
  token: string;
  emailHint?: string;
};

export default function ActivateAccountForm({
  token,
  emailHint,
}: ActivateAccountFormProps) {
  const router = useRouter();
  const passwordErrorId = useId();
  const passwordHelpId = useId();

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  // Real-time password validation indicators
  const hasMinLength = password.length >= 12;
  const isMaxLengthOk = password.length <= 1024;
  const passwordsMatch = confirmation.length > 0 && password === confirmation;
  const confirmationStarted = confirmation.length > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError("O link de activação é inválido ou está incompleto.");
      return;
    }

    if (!hasMinLength) {
      setError("A palavra-passe deve conter pelo menos 12 caracteres.");
      return;
    }

    if (!isMaxLengthOk) {
      setError("A palavra-passe excede o limite permitido.");
      return;
    }

    if (password !== confirmation) {
      setError("As palavras-passe introduzidas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/portal-auth/activate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ token, password }),
      });

      const body = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(body.error ?? "Não foi possível activar a conta.");
        return;
      }

      setComplete(true);
      window.setTimeout(() => {
        router.replace("/sign-in?activated=1");
      }, 900);
    } catch {
      setError("Não foi possível ligar ao servidor. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (complete) {
    return (
      <div
        role="status"
        className="mx-auto w-full max-w-md rounded-[1.75rem] border border-emerald-200 bg-emerald-50/90 p-8 text-center text-sm font-medium text-emerald-900 shadow-sm"
      >
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Check className="h-5 w-5" />
        </div>
        <h2 className="font-serif text-xl text-emerald-950">Conta activada com sucesso</h2>
        <p className="mt-2 text-xs font-light text-emerald-800">
          A redireccionar para o início de sessão…
        </p>
      </div>
    );
  }

  return (
    <div className="haxr-auth-card mx-auto w-full max-w-md rounded-[1.75rem] p-6 backdrop-blur-xl sm:p-9">
      <h1 className="font-serif text-2xl font-light text-brand-text-dark sm:text-3xl">
        Definir palavra-passe
      </h1>

      <p className="mt-2.5 font-sans text-sm font-light leading-relaxed text-brand-text-dark/80">
        {emailHint ? (
          <>
            A activar o acesso para{" "}
            <span className="font-medium text-brand-text-dark">{emailHint}</span>. Escolha uma nova palavra-passe. O link é de utilização única.
          </>
        ) : (
          "Escolha uma nova palavra-passe para activar o vosso acesso HAXR. O link é de utilização única."
        )}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        {error ? (
          <p
            id={passwordErrorId}
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-xs font-medium text-red-800"
          >
            {error}
          </p>
        ) : null}

        {/* Campo: Nova Palavra-passe */}
        <div className="space-y-1.5 text-left">
          <label
            htmlFor="new-password-input"
            className="block pl-1 font-mono text-[9px] font-bold uppercase tracking-wider text-brand-text-dark"
          >
            Nova palavra-passe
          </label>
          <div className="relative">
            <input
              id="new-password-input"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={loading}
              aria-describedby={`${passwordHelpId} ${error ? passwordErrorId : ""}`.trim()}
              aria-invalid={error ? "true" : "false"}
              className="w-full rounded-xl border border-brand-champagne/60 bg-brand-ivory/70 px-4 py-3.5 pr-11 text-sm text-brand-text-dark placeholder:text-brand-text-dark/40 focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/30 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
              disabled={loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-brand-text-dark/60 hover:text-brand-text-dark focus:outline-none focus:ring-2 focus:ring-brand-gold/40 disabled:opacity-50"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Indicadores de requisitos em tempo real */}
        <div
          id={passwordHelpId}
          className="rounded-xl border border-brand-champagne/30 bg-brand-ivory/40 p-3 text-xs"
        >
          <div className="space-y-1.5 text-left font-sans">
            <div
              className={`flex items-center gap-2 text-[11px] ${
                hasMinLength
                  ? "font-medium text-emerald-800"
                  : "text-brand-text-dark/80"
              }`}
            >
              {hasMinLength ? (
                <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-brand-text-dark/40" aria-hidden="true" />
              )}
              <span>Pelo menos 12 caracteres</span>
            </div>

            {confirmationStarted ? (
              <div
                className={`flex items-center gap-2 text-[11px] ${
                  passwordsMatch
                    ? "font-medium text-emerald-800"
                    : "text-red-700 font-medium"
                }`}
              >
                {passwordsMatch ? (
                  <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                ) : (
                  <X className="h-3.5 w-3.5 text-red-600" aria-hidden="true" />
                )}
                <span>
                  {passwordsMatch
                    ? "As palavras-passe coincidem"
                    : "As palavras-passe não coincidem"}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Campo: Confirmar Palavra-passe */}
        <div className="space-y-1.5 text-left">
          <label
            htmlFor="confirm-password-input"
            className="block pl-1 font-mono text-[9px] font-bold uppercase tracking-wider text-brand-text-dark"
          >
            Confirmar palavra-passe
          </label>
          <div className="relative">
            <input
              id="confirm-password-input"
              type={showConfirmation ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              disabled={loading}
              aria-invalid={error ? "true" : "false"}
              className="w-full rounded-xl border border-brand-champagne/60 bg-brand-ivory/70 px-4 py-3.5 pr-11 text-sm text-brand-text-dark placeholder:text-brand-text-dark/40 focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/30 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowConfirmation((prev) => !prev)}
              aria-label={showConfirmation ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
              disabled={loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-brand-text-dark/60 hover:text-brand-text-dark focus:outline-none focus:ring-2 focus:ring-brand-gold/40 disabled:opacity-50"
            >
              {showConfirmation ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !hasMinLength}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-black px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white hover:bg-black/90 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              A activar…
            </>
          ) : (
            "Activar conta"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-brand-text-dark/70">
        <Link
          href="/sign-in"
          className="font-semibold text-brand-gold-accessible hover:underline"
        >
          Voltar ao início de sessão
        </Link>
      </p>
    </div>
  );
}
