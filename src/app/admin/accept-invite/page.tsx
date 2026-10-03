"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BrandLogo from "@/components/ui/BrandLogo";
import { AlertCircle, ShieldCheck } from "lucide-react";
import { getAdminRoleLabel, type AdminUserRole } from "@/lib/admin/admin-user";
import {
  validateInviteTokenAction,
  acceptInviteAction,
} from "@/lib/admin/actions/admin-users.actions";

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [loadingInvite, setLoadingInvite] = useState(true);
  const [inviteData, setInviteData] = useState<{ email: string; role: string } | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setInviteError("Ligação de convite inválida ou sem parâmetro de acesso.");
      setLoadingInvite(false);
      return;
    }

    validateInviteTokenAction(token).then((res) => {
      setLoadingInvite(false);
      if (res.success) {
        setInviteData(res.data);
      } else {
        setInviteError(res.error);
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
      setSubmitError("A palavra-passe deve conter pelo menos 10 caracteres.");
      return;
    }

    setSubmitting(true);
    const result = await acceptInviteAction({
      rawToken: token,
      name,
      password,
    });
    setSubmitting(false);

    if (result.success) {
      router.push("/admin/dashboard");
      router.refresh();
    } else {
      setSubmitError(result.error);
    }
  }

  if (loadingInvite) {
    return (
      <div className="text-center py-8">
        <p className="text-xs font-mono text-grey-medium">A verificar convite...</p>
      </div>
    );
  }

  if (inviteError) {
    return (
      <div className="space-y-4 text-center">
        <div className="w-12 h-12 rounded-full border border-red-500/20 bg-red-500/10 flex items-center justify-center mx-auto text-red-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="font-serif text-lg text-white">Convite Indisponível</h2>
        <p className="text-xs text-grey-medium leading-relaxed max-w-sm mx-auto">
          {inviteError}
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
      <div className="p-3.5 rounded-sm border border-admin-gold/20 bg-admin-gold/5 mb-4">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-admin-gold">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Convite Verificado</span>
        </div>
        <p className="text-xs text-white font-serif mt-1">{inviteData?.email}</p>
        <p className="text-[11px] font-mono text-grey-medium mt-0.5">
          Função atribuída: {getAdminRoleLabel((inviteData?.role as AdminUserRole) ?? null)}
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
          O Seu Nome Completo
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Ex: Ana Silva"
          className="w-full px-3 py-2 text-sm bg-black/60 border border-grey-dark focus:border-admin-gold/60 focus:outline-none rounded-sm text-white"
        />
      </div>

      <div>
        <label className="block text-[10px] font-mono uppercase tracking-wider text-grey-medium mb-1.5">
          Definir Palavra-passe
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
          Confirmar Palavra-passe
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={10}
          placeholder="Confirme a palavra-passe"
          className="w-full px-3 py-2 text-sm bg-black/60 border border-grey-dark focus:border-admin-gold/60 focus:outline-none rounded-sm text-white"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full mt-2 px-4 py-2.5 text-xs font-mono uppercase tracking-wider bg-admin-gold text-black hover:bg-admin-gold/90 transition-colors rounded-sm disabled:opacity-50"
      >
        {submitting ? "A criar conta..." : "Activar Conta Administrativa"}
      </button>
    </form>
  );
}

export default function AcceptInvitePage() {
  return (
    <div
      className="min-h-screen bg-black flex flex-col items-center justify-center px-6"
      data-lenis-prevent
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <BrandLogo variant="footer" className="mx-auto mb-6 h-24 md:h-28" />
          <p className="font-mono text-[9px] tracking-[0.45em] uppercase text-grey/50">
            Convite Administrativo
          </p>
        </div>
        <div className="admin-card p-8">
          <Suspense fallback={<p className="text-grey text-sm">A carregar...</p>}>
            <AcceptInviteContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
