import { enforceAdminAuth } from "@/lib/admin/guard.server";

export default async function AdminPanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await enforceAdminAuth();
  return children;
}
