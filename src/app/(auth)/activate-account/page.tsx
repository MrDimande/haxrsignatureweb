import AuthShell from "@/components/auth/auth-shell";
import ActivateAccountForm from "@/components/auth/activate-account-form";
import InvalidActivationLink from "@/components/auth/invalid-activation-link";
import { inspectPortalAccountToken } from "@/lib/portal-auth/portal-auth.server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Activar acesso | HAXR Signature",
  robots: { index: false, follow: false },
};

type ActivateAccountPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ActivateAccountPage({
  searchParams,
}: ActivateAccountPageProps) {
  const resolvedParams = await searchParams;
  const rawToken = resolvedParams?.token;
  const token = typeof rawToken === "string" ? rawToken.trim() : "";

  if (!token) {
    console.warn("[portal-auth:activate-page-token-missing]");
    return (
      <AuthShell>
        <InvalidActivationLink reason="missing_token" />
      </AuthShell>
    );
  }

  const inspection = await inspectPortalAccountToken(token, "activation");

  if (!inspection.valid) {
    const masked = token.length >= 8 ? `${token.slice(0, 4)}…${token.slice(-4)}` : "malformed";
    console.warn("[portal-auth:activate-page-token-invalid]", {
      reason: inspection.reason,
      tokenMasked: masked,
    });

    return (
      <AuthShell>
        <InvalidActivationLink reason={inspection.reason} />
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <ActivateAccountForm token={token} emailHint={inspection.email} />
    </AuthShell>
  );
}
