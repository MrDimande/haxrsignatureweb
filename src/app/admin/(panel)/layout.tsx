import { enforceAdminAuth } from "@/lib/admin/guard.server";
import { qrFontClassName } from "@/lib/fonts/qr";

export default async function AdminPanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await enforceAdminAuth();
  return <div className={qrFontClassName}>{children}</div>;
}
