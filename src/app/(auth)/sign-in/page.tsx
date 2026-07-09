import type { Metadata } from "next";
import { Suspense } from "react";
import AuthShell from "@/components/auth/auth-shell";
import SignInForm from "@/components/auth/sign-in-form";
import { marketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = {
  ...marketingMetadata("areaCliente"),
  title: "Iniciar Sessão — Wedding Dashboard | HAXR Signature",
  description:
    "Aceda ao Painel de Casamento HAXR: convidados, RSVP, orçamento, fornecedores e próximos passos do evento.",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <SignInForm />
      </Suspense>
    </AuthShell>
  );
}
