import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/auth-shell";
import SignUpForm from "@/components/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Criar Conta HAXR — Painel de Casamento | HAXR Signature",
  description:
    "Crie a sua conta HAXR para organizar o vosso evento num espaço privado: convidados, RSVP, orçamento, fornecedores e decisões importantes.",
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
