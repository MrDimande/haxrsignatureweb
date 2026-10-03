import AdminShell from "@/components/admin/AdminShell";
import { enforceAdminOwner } from "@/lib/admin/guard.server";
import { listAdminUsers } from "@/lib/admin/admin-users.repository";
import { listPendingAdminInvites } from "@/lib/admin/admin-invites.repository";
import { isEmailDeliveryAvailable } from "@/lib/admin/admin-email.service";
import AdminUsersManager from "@/components/admin/users/AdminUsersManager";

export default async function AdminUsersPage() {
  await enforceAdminOwner();

  const [users, pendingInvites] = await Promise.all([
    listAdminUsers(),
    listPendingAdminInvites(),
  ]);

  const emailDeliveryAvailable = isEmailDeliveryAvailable();

  return (
    <AdminShell
      title="Utilizadores"
      subtitle="Directório administrativo protegido por função, permissões e sessões individuais"
    >
      <AdminUsersManager
        users={users}
        pendingInvites={pendingInvites}
        emailDeliveryAvailable={emailDeliveryAvailable}
      />
    </AdminShell>
  );
}
