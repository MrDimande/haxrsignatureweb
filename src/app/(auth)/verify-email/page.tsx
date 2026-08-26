import type { Metadata } from "next";
import AuthShell from "@/components/auth/auth-shell";
import VerifyEmailForm from "@/components/auth/verify-email-form";

export const metadata: Metadata = {
  title: "Confirmar Email | HAXR Signature",
  robots: { index: false, follow: false },
};

export default function VerifyEmailPage() {
  return (
    <AuthShell>
      <VerifyEmailForm />
    </AuthShell>
  );
}
