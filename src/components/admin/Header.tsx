"use client";

import { Menu, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

type HeaderProps = {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
  actions?: React.ReactNode;
};

export default function Header({
  title,
  subtitle,
  onMenuClick,
  actions,
}: HeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 bg-black/95 backdrop-blur-sm border-b border-grey-dark/80">
      <div className="flex items-center justify-between gap-4 px-4 md:px-8 h-16">
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden text-grey hover:text-white shrink-0"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="font-serif text-lg md:text-xl font-light text-white truncate">
              {title}
            </h1>
            {subtitle ? (
              <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-grey/50 truncate">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {actions}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 font-mono text-[9px] tracking-[0.25em] uppercase text-grey/60 hover:text-admin-gold transition-colors px-3 py-2"
            aria-label="Terminar sessão"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.25} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}
