import type { Metadata } from "next";
import AuthShell from "@/components/auth/auth-shell";
import ResetPasswordOtpForm from "@/components/auth/reset-password-otp-form";

export const metadata: Metadata = {
  title: "Recuperar Palavra-passe | HAXR Signature",
  robots: { index: false, follow: false },
};

export default function ResetPasswordOtpPage() {
  return (
    <AuthShell>
      <ResetPasswordOtpForm />
    </AuthShell>
  );
}
