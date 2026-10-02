import { AdminIdentityProvider } from "@/components/admin/AdminIdentityProvider";
import { getCurrentAdminIdentity } from "@/lib/admin/admin-identity.server";
import { enforceAdminAuth } from "@/lib/admin/guard.server";
import { qrFontClassName } from "@/lib/fonts/qr";

export default async function AdminPanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await enforceAdminAuth();
  const identity = await getCurrentAdminIdentity();

  return (
    <AdminIdentityProvider identity={identity}>
      <div className={qrFontClassName}>{children}</div>
    </AdminIdentityProvider>
  );
}
