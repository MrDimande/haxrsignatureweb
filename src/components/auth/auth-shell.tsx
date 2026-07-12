import type { ReactNode } from "react";
import AuthBrandPanel from "@/components/auth/auth-brand-panel";

type AuthShellProps = {
  children: ReactNode;
};

export default function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-brand-ivory font-sans text-brand-text-dark">
      <div className="grid min-h-screen lg:grid-cols-2">
        <aside className="relative hidden overflow-hidden bg-brand-black lg:block">
          <AuthBrandPanel />
        </aside>

        <div className="flex flex-col">
          <div className="p-4 lg:hidden">
            <AuthBrandPanel />
          </div>

          <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 md:px-12 lg:px-16 lg:py-16">
            <div className="w-full max-w-md">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
