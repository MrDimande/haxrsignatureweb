import { Suspense } from "react";
import AuthShell from "@/components/auth/auth-shell";
import ForgotPasswordForm from "@/components/auth/forgot-password-form";

export const metadata = {
  title: "Recuperar Palavra-passe | HAXR Signature",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <ForgotPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
