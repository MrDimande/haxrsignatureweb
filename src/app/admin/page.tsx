import { Suspense } from "react";
import BrandRubric from "@/components/ui/BrandRubric";
import LoginForm from "@/components/admin/LoginForm";
import { isAdminConfigured } from "@/lib/admin/auth";

export default function AdminLoginPage() {
  const configured = isAdminConfigured();

  return (
    <div
      className="min-h-screen bg-black flex flex-col items-center justify-center px-6"
      data-lenis-prevent
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <BrandRubric className="mb-6" />
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
