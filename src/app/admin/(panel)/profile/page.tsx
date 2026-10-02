"use client";

import { Clock3, Mail, ShieldCheck, UserRound } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminIdentity } from "@/components/admin/AdminIdentityProvider";
import {
  getAdminInitials,
  getAdminRoleLabel,
  getAdminStatusLabel,
} from "@/lib/admin/admin-user";

function formatDate(value: string | null | undefined): string {
  if (!value) return "Ainda sem registo";

  return new Intl.DateTimeFormat("pt-MZ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Maputo",
  }).format(new Date(value));
}

export default function ProfilePage() {
  const identity = useAdminIdentity();
  const name = identity?.name || "Identidade administrativa configurada";
  const email = identity?.email || "E-mail não configurado";
  const initials = getAdminInitials(identity);
  const role = getAdminRoleLabel(identity?.role ?? null);
  const status = identity ? getAdminStatusLabel(identity.status) : "Indisponível";

  return (
    <AdminShell title="Perfil" subtitle="Identidade e permissões da sessão actual">
      <div className="max-w-2xl space-y-6">
        <section className="admin-card p-6 md:p-8 flex flex-col sm:flex-row items-center gap-7">
          <div className="w-24 h-24 rounded-full border-2 border-admin-gold/30 shadow-[0_0_20px_rgba(184,138,42,0.1)] bg-gradient-to-br from-[#12100e] to-[#0c0a09] flex items-center justify-center shrink-0">
            <span className="font-mono text-2xl font-semibold tracking-wider text-admin-gold">{initials}</span>
          </div>
          <div className="min-w-0 text-center sm:text-left">
            <p className="font-serif text-2xl font-light text-white">{name}</p>
            <p className="mt-1 truncate text-xs font-mono tracking-wide text-grey-medium">{email}</p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-admin-gold/20 bg-admin-gold/5 px-3 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-admin-gold" strokeWidth={1.25} />
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-admin-gold">{role}</span>
            </div>
          </div>
        </section>

        <section className="admin-card p-6 md:p-8">
          <span className="font-mono text-[8px] tracking-[0.4em] uppercase text-admin-gold">Conta administrativa</span>
          <h2 className="mt-1 font-serif text-xl font-light text-white">Dados verificados da sessão</h2>

          <dl className="mt-6 divide-y divide-white/[0.04]">
            <div className="flex items-center justify-between gap-5 py-3">
              <dt className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-grey-medium">
                <UserRound className="h-3.5 w-3.5 text-admin-gold/70" /> Função
              </dt>
              <dd className="text-right text-xs text-white">{role}</dd>
            </div>
            <div className="flex items-center justify-between gap-5 py-3">
              <dt className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-grey-medium">
                <Mail className="h-3.5 w-3.5 text-admin-gold/70" /> E-mail
              </dt>
              <dd className="max-w-[60%] truncate text-right text-xs text-grey/80">{email}</dd>
            </div>
            <div className="flex items-center justify-between gap-5 py-3">
              <dt className="text-[10px] font-mono uppercase tracking-wider text-grey-medium">Estado</dt>
              <dd className={identity?.status === "active" ? "text-xs text-emerald-400" : "text-xs text-grey-medium"}>{status}</dd>
            </div>
            <div className="flex items-center justify-between gap-5 py-3">
              <dt className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-grey-medium">
                <Clock3 className="h-3.5 w-3.5 text-admin-gold/70" /> Último acesso
              </dt>
              <dd className="text-right text-xs text-grey/80">{formatDate(identity?.lastLoginAt)}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-5">
          <p className="text-xs leading-relaxed text-grey-medium">
            Esta página apresenta a identidade autenticada; não guarda nome, e-mail ou fotografia no navegador. Alterações de identidade e permissões são feitas através do directório administrativo autorizado.
          </p>
        </section>
      </div>
    </AdminShell>
  );
}
