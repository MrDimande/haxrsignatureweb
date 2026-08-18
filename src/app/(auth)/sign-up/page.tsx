import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/auth-shell";
import SignUpForm from "@/components/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Criar Conta | HAXR Signature",
  description:
    "Crie uma conta HAXR para organizar o casamento, guardar fornecedores e aceder às ferramentas de planeamento.",
  robots: { index: false, follow: false },
};

type SignUpPageProps = {
  searchParams?: Promise<{ vendor?: string; from?: string }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = searchParams ? await searchParams : undefined;

  if (params?.vendor === "true") {
    redirect("/for-pros");
  }

  return (
    <AuthShell>
      <Suspense fallback={null}>
        <SignUpForm />
      </Suspense>
    </AuthShell>
  );
}
