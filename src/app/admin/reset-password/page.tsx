"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BrandLogo from "@/components/ui/BrandLogo";
import { AlertCircle, KeyRound } from "lucide-react";
import {
  validatePasswordResetTokenAction,
  completePasswordResetAction,
} from "@/lib/admin/actions/admin-users.actions";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setValidationError("Ligação de recuperação inválida ou sem parâmetro de acesso.");
      setValidating(false);
      return;
    }

    validatePasswordResetTokenAction(token).then((res) => {
      setValidating(false);
      if (res.success) {
        setTokenValid(true);
      } else {
        setValidationError(res.error);
      }
    });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (password !== confirmPassword) {
      setSubmitError("A confirmação da palavra-passe não coincide.");
      return;
    }

    if (password.length < 10) {
      setSubmitError("A nova palavra-passe deve conter pelo menos 10 caracteres.");
      return;
    }

    setSubmitting(true);
    const result = await completePasswordResetAction({
      rawToken: token,
      newPassword: password,
    });
    setSubmitting(false);

    if (result.success) {
      router.push("/admin/dashboard");
      router.refresh();
    } else {
      setSubmitError(result.error);
    }
  }

  if (validating) {
    return (
      <div className="text-center py-8">
        <p className="text-xs font-mono text-grey-medium">A verificar ligação...</p>
      </div>
    );
  }

  if (validationError || !tokenValid) {
    return (
      <div className="space-y-4 text-center">
        <div className="w-12 h-12 rounded-full border border-red-500/20 bg-red-500/10 flex items-center justify-center mx-auto text-red-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="font-serif text-lg text-white">Ligação Expirada ou Inválida</h2>
        <p className="text-xs text-grey-medium leading-relaxed max-w-sm mx-auto">
          {validationError || "Esta ligação de recuperação já não é válida."}
        </p>
        <div className="pt-4">
          <a
            href="/admin"
            className="text-xs font-mono text-admin-gold hover:underline"
          >
            Regressar ao início de sessão
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center mb-6">
        <div className="w-10 h-10 rounded-full border border-admin-gold/30 bg-admin-gold/5 flex items-center justify-center mx-auto mb-2 text-admin-gold">
          <KeyRound className="h-5 w-5" />
        </div>
        <h2 className="font-serif text-lg text-white">Redefinir Palavra-passe</h2>
        <p className="text-xs text-grey-medium mt-1">
          Defina uma nova palavra-passe segura para a sua conta
        </p>
      </div>

      {submitError && (
        <div className="p-3 rounded-sm bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>{submitError}</p>
        </div>
      )}

      <div>
        <label className="block text-[10px] font-mono uppercase tracking-wider text-grey-medium mb-1.5">
          Nova Palavra-passe
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={10}
          placeholder="Mínimo 10 caracteres"
          className="w-full px-3 py-2 text-sm bg-black/60 border border-grey-dark focus:border-admin-gold/60 focus:outline-none rounded-sm text-white"
        />
      </div>

      <div>
        <label className="block text-[10px] font-mono uppercase tracking-wider text-grey-medium mb-1.5">
          Confirmar Nova Palavra-passe
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={10}
          placeholder="Confirme a nova palavra-passe"
          className="w-full px-3 py-2 text-sm bg-black/60 border border-grey-dark focus:border-admin-gold/60 focus:outline-none rounded-sm text-white"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full mt-2 px-4 py-2.5 text-xs font-mono uppercase tracking-wider bg-admin-gold text-black hover:bg-admin-gold/90 transition-colors rounded-sm disabled:opacity-50"
      >
        {submitting ? "A guardar..." : "Actualizar Palavra-passe"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div
      className="min-h-screen bg-black flex flex-col items-center justify-center px-6"
      data-lenis-prevent
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <BrandLogo variant="footer" className="mx-auto mb-6 h-24 md:h-28" />
          <p className="font-mono text-[9px] tracking-[0.45em] uppercase text-grey/50">
            Recuperação de Acesso
          </p>
        </div>
        <div className="admin-card p-8">
          <Suspense fallback={<p className="text-grey text-sm">A carregar...</p>}>
            <ResetPasswordContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
