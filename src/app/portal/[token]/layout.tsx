import * as clientsRepo from "@/lib/admin/repositories/clients.repository";
import PortalShell from "@/components/portal/PortalShell";

type PortalLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
};

export default async function PortalLayout({
  children,
  params,
}: PortalLayoutProps) {
  const { token } = await params;
  const client = await clientsRepo.getClientByPortalToken(token);

  if (!client) {
    return <>{children}</>;
  }

  return (
    <PortalShell token={token} clientName={client.fullName}>
      {children}
    </PortalShell>
  );
}
