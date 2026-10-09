"use client";

import { useState } from "react";
import Link from "next/link";
import ResendActivationForm from "@/components/auth/resend-activation-form";

export default function VerifyEmailForm() {
  const [showResend, setShowResend] = useState(false);

  return (
    <div className="haxr-auth-card mx-auto w-full max-w-md rounded-[1.75rem] p-6 text-center backdrop-blur-xl sm:p-9">
      <h1 className="font-serif text-2xl font-light text-brand-text-dark sm:text-3xl">
        Verifique o vosso email
      </h1>

      <p className="mt-4 font-sans text-sm font-light leading-relaxed text-brand-text-dark/80">
        Enviámos uma mensagem com o vosso link seguro de activação HAXR Signature.
      </p>

      <p className="mt-2 font-sans text-xs font-light text-brand-text-dark/65">
        Por favor, consulte a sua caixa de correio (incluindo a pasta de spam) e clique no link recebido para definir a vossa palavra-passe.
      </p>

      <div className="mt-8 border-t border-brand-champagne/40 pt-6">
        {!showResend ? (
          <div>
            <button
              type="button"
              onClick={() => setShowResend(true)}
              className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-brand-gold hover:underline"
            >
              Não recebeu o email? Pedir novo link
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-text-dark">
              Reenviar link de activação
            </h2>
            <ResendActivationForm />
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-brand-text-dark/70">
        <Link
          href="/sign-in"
          className="font-semibold text-brand-gold hover:underline"
        >
          Voltar ao início de sessão
        </Link>
      </p>
    </div>
  );
}
