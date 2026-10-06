import AdminShell from "@/components/admin/AdminShell";
import PortalAccountsManager from "@/components/admin/portal-accounts/PortalAccountsManager";
import { enforceAdminOwner } from "@/lib/admin/guard.server";
import { listPortalAccountsForAdmin } from "@/lib/admin/portal-accounts.repository";

export default async function PortalAccountsPage() {
  await enforceAdminOwner();
  const accounts = await listPortalAccountsForAdmin();

  return (
    <AdminShell
      title="Contas do Portal"
      subtitle="Activações de clientes reconciliadas e protegidas por controlo administrativo"
    >
      <PortalAccountsManager accounts={accounts} />
    </AdminShell>
  );
}
