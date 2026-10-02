import { Suspense } from "react";
import AuthShell from "@/components/auth/auth-shell";
import ActivateAccountForm from "@/components/auth/activate-account-form";

export const metadata = {
  title: "Activar acesso | HAXR Signature",
  robots: { index: false, follow: false },
};

export default function ActivateAccountPage() {
  return <AuthShell><Suspense fallback={null}><ActivateAccountForm /></Suspense></AuthShell>;
}
