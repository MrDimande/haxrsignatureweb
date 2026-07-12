"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PORTAL_NAV_ITEMS,
  portalPath,
  type PortalRouteId,
} from "@/lib/portal/portal-routes";

type PortalShellProps = {
  token: string;
  clientName: string;
  children: React.ReactNode;
};

function resolveActiveNav(pathname: string, token: string): PortalRouteId {
  const base = portalPath(token);
  if (pathname === base) return "dashboard";

  for (const item of PORTAL_NAV_ITEMS) {
    if (!item.segment) continue;
    if (pathname === portalPath(token, item.segment)) {
      return item.id;
    }
  }

  return "dashboard";
}

export default function PortalShell({
  token,
  clientName,
  children,
}: PortalShellProps) {
  const pathname = usePathname() ?? "";
  const active = resolveActiveNav(pathname, token);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-white/10 bg-black-soft sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
          <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold mb-2">
            Portal HAXR Signature
          </p>
          <h1 className="font-serif text-2xl md:text-3xl font-light">
            Olá, {clientName}
          </h1>
        </div>
        <nav
          className="max-w-5xl mx-auto px-4 md:px-6 flex gap-1 overflow-x-auto pb-3 scrollbar-hide"
          aria-label="Secções do portal"
        >
          {PORTAL_NAV_ITEMS.map((item) => {
            const href = portalPath(token, item.segment || undefined);
            const isActive = item.id === active;
            return (
              <Link
                key={item.id}
                href={href}
                className={`shrink-0 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.2em] border rounded-sm transition-colors ${
                  isActive
                    ? "border-admin-gold/40 text-admin-gold bg-admin-gold/10"
                    : "border-white/10 text-grey/55 hover:text-white/80 hover:border-white/20"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">{children}</div>
    </div>
  );
}
