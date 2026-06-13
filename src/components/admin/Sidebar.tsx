"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  FileText,
  Inbox,
  LayoutDashboard,
  Settings,
  User,
  Users,
  Wallet,
  X,
} from "lucide-react";
import BrandLogo from "@/components/ui/BrandLogo";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/events", label: "Eventos", icon: Calendar },
  { href: "/admin/cash", label: "Caixa", icon: Wallet },
  { href: "/admin/leads", label: "Leads", icon: Inbox },
  { href: "/admin/documents", label: "Documentos", icon: FileText },
  { href: "/admin/clients", label: "Clientes", icon: Users },
  { href: "/admin/settings", label: "Definições", icon: Settings },
  { href: "/admin/profile", label: "Perfil", icon: User },
];

type SidebarProps = {
  open?: boolean;
  onClose?: () => void;
};

export default function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={onClose}
          aria-label="Fechar menu"
        />
      ) : null}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-black border-r border-grey-dark/80 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        data-lenis-prevent
      >
        <div className="flex items-center justify-between px-6 h-16 border-b border-grey-dark/80">
          <Link href="/admin/dashboard" className="opacity-90 hover:opacity-100">
            <BrandLogo variant="navbar" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden text-grey hover:text-white"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1" aria-label="Administração">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || (pathname?.startsWith(`${href}/`) ?? false);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-sm text-[11px] tracking-[0.2em] uppercase transition-colors duration-300 ${
                  active
                    ? "bg-admin-gold/10 text-admin-gold border border-admin-gold/20"
                    : "text-grey hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" strokeWidth={1.25} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-6 py-4 border-t border-grey-dark/80">
          <Link
            href="/"
            className="font-mono text-[9px] tracking-[0.3em] uppercase text-grey/50 hover:text-admin-gold transition-colors"
          >
            ← Voltar ao site
          </Link>
        </div>
      </aside>
    </>
  );
}
