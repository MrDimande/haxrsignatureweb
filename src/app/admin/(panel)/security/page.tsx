import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { enforceAdminAuth } from "@/lib/admin/guard.server";
import { getCurrentAdminIdentity } from "@/lib/admin/admin-identity.server";
import { getAdminCredentialsByUserId } from "@/lib/admin/admin-credentials.repository";
import {
  listActiveAdminSessionsForUser,
  parseSessionCookieValue,
  isV2DatabaseSession,
} from "@/lib/admin/admin-sessions.repository";
import { listRecentAdminAuditLogs } from "@/lib/admin/admin-audit.repository";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin/auth";
import AdminSecurityManager from "@/components/admin/security/AdminSecurityManager";

export default async function AdminSecurityPage() {
  await enforceAdminAuth();

  const identity = await getCurrentAdminIdentity();
  if (!identity || !identity.id) {
    redirect("/admin");
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  let currentSessionId: string | null = null;

  if (isV2DatabaseSession(sessionCookie)) {
    const parts = parseSessionCookieValue(sessionCookie);
    if (parts) {
      currentSessionId = parts.sessionId;
    }
  }

  const [credentials, activeSessions, auditLogs] = await Promise.all([
    getAdminCredentialsByUserId(identity.id),
    listActiveAdminSessionsForUser(identity.id),
    listRecentAdminAuditLogs({ targetUserId: identity.id, limit: 25 }),
  ]);

  return (
    <AdminShell
      title="Segurança"
      subtitle="Palavra-passe individual, sessões activas e protecção da conta"
    >
      <AdminSecurityManager
        identity={identity}
        credentials={credentials}
        activeSessions={activeSessions}
        auditLogs={auditLogs}
        currentSessionId={currentSessionId}
      />
    </AdminShell>
  );
}
