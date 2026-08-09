import type { ReactNode } from "react";
import AuthBrandPanel from "@/components/auth/auth-brand-panel";

type AuthShellProps = {
  children: ReactNode;
};

export default function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="haxr-auth-shell min-h-screen font-sans text-brand-text-dark">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.12fr)_minmax(30rem,0.88fr)]">
        <aside className="relative hidden overflow-hidden bg-brand-black lg:block">
          <AuthBrandPanel />
        </aside>

        <section className="haxr-auth-form-stage flex min-h-screen flex-col">
          <div className="p-4 lg:hidden">
            <AuthBrandPanel />
          </div>

          <div className="hidden items-center justify-between border-b border-brand-gold/15 px-10 py-6 font-mono text-[8px] uppercase tracking-[0.28em] text-brand-text-dark/50 lg:flex">
            <span>HAXR Private Client</span>
            <span>Maputo · Mozambique</span>
          </div>

          <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 md:px-12 lg:px-14 lg:py-14 xl:px-20">
            <div className="w-full max-w-[34rem]">{children}</div>
          </div>

          <div className="hidden items-center justify-between border-t border-brand-gold/15 px-10 py-5 font-mono text-[8px] uppercase tracking-[0.26em] text-brand-text-dark/40 lg:flex">
            <span>Discrição · Curadoria · Precisão</span>
            <span>© 2026 HAXR</span>
          </div>
        </section>
      </div>
    </div>
  );
}
