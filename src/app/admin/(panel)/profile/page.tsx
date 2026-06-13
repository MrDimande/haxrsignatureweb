"use client";

import AdminShell from "@/components/admin/AdminShell";

export default function ProfilePage() {
  return (
    <AdminShell title="Perfil" subtitle="Conta de administrador">
      <div className="max-w-lg admin-card p-6 space-y-6">
        <div>
          <p className="font-mono text-[9px] tracking-[0.35em] uppercase text-grey/50 mb-2">
            Função
          </p>
          <p className="text-white">Administrador HAXR Signature</p>
        </div>
        <div>
          <p className="font-mono text-[9px] tracking-[0.35em] uppercase text-grey/50 mb-2">
            Acesso
          </p>
          <p className="text-grey text-sm">
            Credenciais definidas nas variáveis de ambiente{" "}
            <code className="text-admin-gold/70">ADMIN_EMAIL</code> e{" "}
            <code className="text-admin-gold/70">ADMIN_PASSWORD</code>.
          </p>
        </div>
        <div>
          <p className="font-mono text-[9px] tracking-[0.35em] uppercase text-grey/50 mb-2">
            Segurança
          </p>
          <ul className="text-sm text-grey/60 space-y-1">
            <li>· Sessão com cookie httpOnly (7 dias)</li>
            <li>· Rotas /admin protegidas por middleware</li>
            <li>· Área não indexada pelos motores de busca</li>
          </ul>
        </div>
      </div>
    </AdminShell>
  );
}
