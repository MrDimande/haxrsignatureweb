import AppShell from "@/components/app/AppShell";
import { getCurrentAppSession } from "@/lib/auth/app-session";
import type { ReactNode } from "react";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getCurrentAppSession();

  return <AppShell userDisplay={session.display}>{children}</AppShell>;
}
