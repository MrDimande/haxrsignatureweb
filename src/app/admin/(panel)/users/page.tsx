import { ShieldCheck, Users } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { getAdminStatusLabel, getAdminRoleLabel } from "@/lib/admin/admin-user";
import { enforceAdminOwner } from "@/lib/admin/guard.server";
import { listAdminUsers } from "@/lib/admin/admin-users.repository";

function formatLastLogin(value: string | null): string {
  if (!value) return "Ainda sem acesso registado";

  return new Intl.DateTimeFormat("pt-MZ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Maputo",
  }).format(new Date(value));
}

export default async function AdminUsersPage() {
  await enforceAdminOwner();
  const users = await listAdminUsers();

  return (
    <AdminShell
      title="Utilizadores"
      subtitle="Directório administrativo protegido por função e permissão"
    >
      <div className="space-y-6">
        <section className="admin-card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-white/[0.05] p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="font-mono text-[8px] uppercase tracking-[0.4em] text-admin-gold">Administração</span>
              <h2 className="mt-1 font-serif text-xl font-light text-white">Identidades autorizadas</h2>
            </div>
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-admin-gold/20 bg-admin-gold/5 px-3 py-1.5 text-[9px] font-mono uppercase tracking-[0.16em] text-admin-gold">
              <Users className="h-3.5 w-3.5" strokeWidth={1.25} />
              {users.length} {users.length === 1 ? "utilizador" : "utilizadores"}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-left">
              <thead className="border-b border-white/[0.04] bg-white/[0.015]">
                <tr className="text-[8px] font-mono uppercase tracking-[0.2em] text-grey-medium">
                  <th className="px-6 py-3 font-medium">Utilizador</th>
                  <th className="px-6 py-3 font-medium">Função</th>
                  <th className="px-6 py-3 font-medium">Permissão</th>
                  <th className="px-6 py-3 font-medium">Estado</th>
                  <th className="px-6 py-3 font-medium">Último acesso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {users.map((user) => (
                  <tr key={user.id} className="text-xs text-grey-medium">
                    <td className="px-6 py-4">
                      <p className="text-sm text-white">{user.name}</p>
                      <p className="mt-1 font-mono text-[10px] text-grey/60">{user.email}</p>
                    </td>
                    <td className="px-6 py-4 text-white/90">{getAdminRoleLabel(user.role)}</td>
                    <td className="px-6 py-4">
                      {user.permissions.includes("SUPER_ADMIN") ? (
                        <span className="inline-flex items-center gap-1.5 text-admin-gold">
                          <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.25} /> SUPER_ADMIN
                        </span>
                      ) : (
                        <span className="text-grey/55">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={user.status === "active" ? "text-emerald-400" : "text-grey-medium"}>
                        {getAdminStatusLabel(user.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-grey/75">{formatLastLogin(user.lastLoginAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-5">
          <p className="text-xs leading-relaxed text-grey-medium">
            Só o proprietário com <span className="font-mono text-admin-gold">SUPER_ADMIN</span> pode abrir este directório. A criação, alteração de função e suspensão serão expostas quando o fornecedor de credenciais suportar esse ciclo de vida; a fundação não apresenta acções sem efeito nem credenciais no navegador.
          </p>
        </section>
      </div>
    </AdminShell>
  );
}
