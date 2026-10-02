import AppShell from "@/components/app/AppShell";
import { getCurrentAppSession } from "@/lib/auth/app-session";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

// The client area is session-bound and must never be statically prerendered.
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getCurrentAppSession();
  if (!session.user || !session.profile) redirect("/sign-in?from=/app/dashboard");

  return (
    <AppShell
      userDisplay={session.display}
      initialEventId={session.profile?.active_client_event_id ?? null}
    >
      {children}
    </AppShell>
  );
}
