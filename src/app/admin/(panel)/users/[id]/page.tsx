import { notFound } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { enforceAdminOwner } from "@/lib/admin/guard.server";
import { getCurrentAdminIdentity } from "@/lib/admin/admin-identity.server";
import { findAdminUserById } from "@/lib/admin/admin-users.repository";
import { getAdminCredentialsByUserId } from "@/lib/admin/admin-credentials.repository";
import { listActiveAdminSessionsForUser } from "@/lib/admin/admin-sessions.repository";
import { listRecentAdminAuditLogs } from "@/lib/admin/admin-audit.repository";
import AdminUserDetailManager from "@/components/admin/users/AdminUserDetailManager";

type AdminUserDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminUserDetailPage({ params }: AdminUserDetailPageProps) {
  await enforceAdminOwner();
  const { id } = await params;

  const [user, currentAdmin] = await Promise.all([
    findAdminUserById(id),
    getCurrentAdminIdentity(),
  ]);

  if (!user) {
    notFound();
  }

  const [credentials, activeSessions, auditLogs] = await Promise.all([
    getAdminCredentialsByUserId(user.id),
    listActiveAdminSessionsForUser(user.id),
    listRecentAdminAuditLogs({ targetUserId: user.id, limit: 30 }),
  ]);

  const isCurrentOwner = currentAdmin?.role === "OWNER";

  return (
    <AdminShell
      title={user.name}
      subtitle="Detalhes do utilizador, credenciais e auditoria de segurança"
    >
      <AdminUserDetailManager
        user={user}
        passwordUpdatedAt={credentials?.passwordUpdatedAt ?? null}
        activeSessions={activeSessions}
        auditLogs={auditLogs}
        isCurrentOwner={isCurrentOwner}
      />
    </AdminShell>
  );
}
