import React, { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BrandLogo from "@/components/ui/BrandLogo";
import LoginForm from "@/components/admin/LoginForm";
import { isAdminConfigured } from "@/lib/admin/auth";

export default function AdminLoginPage() {
  const configured = isAdminConfigured();

  return (
    <div
      className="min-h-screen bg-black flex flex-col items-center justify-center px-6 relative"
      data-lenis-prevent
    >
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-mono text-[9px] tracking-[0.25em] uppercase text-grey/60 hover:text-brand-gold transition-colors duration-300"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Atelier HAXR</span>
          </Link>
        </div>

        <div className="text-center mb-10">
          <BrandLogo variant="footer" className="mx-auto mb-6 h-28 md:h-32" />
          <p className="font-mono text-[9px] tracking-[0.45em] uppercase text-grey/50">
            Área de Administração
          </p>
        </div>
        <div className="admin-card p-8">
          {!configured ? (
            <p className="text-red-400 text-sm text-center" role="alert">
              Acesso indisponível. Configure ADMIN_EMAIL e ADMIN_PASSWORD no
              servidor.
            </p>
          ) : (
            <Suspense fallback={<p className="text-grey text-sm">A carregar...</p>}>
              <LoginForm />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}
