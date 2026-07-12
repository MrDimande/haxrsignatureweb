"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getAdminBadgeCountsAction } from "@/lib/admin/actions/admin-alerts.actions";
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
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import BrandLogo from "@/components/ui/BrandLogo";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  hasSubmenu?: boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    title: "Geral",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, hasSubmenu: true },
    ],
  },
  {
    title: "Operacional",
    items: [
      { href: "/admin/events", label: "Eventos", icon: Calendar, hasSubmenu: true },
      { href: "/admin/leads", label: "Leads", icon: Inbox },
      { href: "/admin/clients", label: "Clientes", icon: Users },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { href: "/admin/cash", label: "Caixa", icon: Wallet },
      { href: "/admin/documents", label: "Documentos", icon: FileText },
    ],
  },
  {
    title: "Sistema",
    items: [
      { href: "/admin/settings", label: "Definições", icon: Settings },
      { href: "/admin/profile", label: "Perfil", icon: User },
    ],
  },
];

function MaputoSidebarClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: "Africa/Maputo",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      };
      setTime(new Date().toLocaleTimeString("pt-MZ", options));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-1 text-[8.5px] font-mono tracking-[0.25em] text-grey-medium uppercase">
      <span className="opacity-60">Sede executiva</span>
      <span className="text-[10px] text-admin-gold/90 font-medium font-mono tabular-nums tracking-widest">{time || "00:00:00"} GMT+2</span>
    </div>
  );
}

type SidebarProps = {
  open?: boolean;
  onClose?: () => void;
};

export default function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [badges, setBadges] = useState({
    newLeads: 0,
    overdueDocuments: 0,
    conciergePending: 0,
    portalApprovalsPending: 0,
    portalClientResponses: 0,
    portalPaymentProofsPending: 0,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await getAdminBadgeCountsAction();
      if (!cancelled && result.success) {
        setBadges(result.data);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  function badgeForHref(href: string): number | null {
    if (href === "/admin/leads" && badges.newLeads > 0) return badges.newLeads;
    if (href === "/admin/documents") {
      const total =
        badges.overdueDocuments +
        badges.portalApprovalsPending +
        badges.portalClientResponses +
        badges.portalPaymentProofsPending;
      if (total > 0) return total;
    }
    if (href === "/admin/events" && badges.conciergePending > 0) {
      return badges.conciergePending;
    }
    return null;
  }

  return (
    <>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/80 lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
          aria-label="Fechar menu"
        />
      ) : null}

      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-gradient-to-b from-[#0c0a09] to-[#040302] border-r border-admin-gold/15 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        data-lenis-prevent
      >
        {/* Sidebar Header - Centralized Logo for a premium/luxury feel */}
        <div className="flex flex-col items-center justify-center px-6 py-5 border-b border-white/[0.03] bg-white/[0.01] relative shrink-0">
          <Link href="/admin/dashboard" className="opacity-95 hover:opacity-100 transition-opacity flex justify-center w-full">
            <BrandLogo variant="admin" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4.5 lg:hidden text-grey hover:text-white p-1 rounded-full hover:bg-white/5 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto scrollbar-none" aria-label="Administração">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1.5">
              {/* Category Group Label */}
              <p className="px-4.5 font-mono text-[8px] font-semibold tracking-[0.3em] uppercase text-grey-medium opacity-40">
                {section.title}
              </p>

              <div className="space-y-1">
                {section.items.map(({ href, label, icon: Icon, hasSubmenu }) => {
                  const active =
                    pathname === href || (pathname?.startsWith(`${href}/`) ?? false);
                  const badge = badgeForHref(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={onClose}
                      className={`relative flex items-center justify-between gap-3.5 px-4.5 py-3 rounded-lg text-[10px] tracking-[0.2em] uppercase transition-all duration-300 group ${
                        active
                          ? "bg-admin-gold/5 text-admin-gold border border-admin-gold/15"
                          : "text-grey-medium hover:text-white hover:bg-white/[0.03] border border-transparent"
                      }`}
                    >
                      {/* Active Indicator Line */}
                      {active && (
                        <span className="absolute left-0 top-3 bottom-3 w-[2.5px] bg-gradient-to-b from-[#E3C46B] to-[#B88A2A] rounded-r-full" />
                      )}

                      <div className="flex items-center gap-3.5">
                        <Icon className={`w-4 h-4 shrink-0 transition-colors duration-300 ${active ? "text-admin-gold" : "text-grey/70 group-hover:text-white"}`} strokeWidth={active ? 1.5 : 1.25} />
                        <span className="font-mono">{label}</span>
                        {badge ? (
                          <span className="ml-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500/90 text-white text-[9px] font-mono flex items-center justify-center">
                            {badge > 99 ? "99+" : badge}
                          </span>
                        ) : null}
                      </div>

                      {/* Dropdown Indicator Chevron */}
                      {hasSubmenu && (
                        <ChevronRight className={`w-3.5 h-3.5 text-grey/40 group-hover:text-white/60 transition-transform duration-300 ${active ? "rotate-90 text-admin-gold/60" : ""}`} />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="px-6 py-5 border-t border-white/[0.03] bg-black/30 space-y-4">
          <MapClock />

          {/* System Status Node */}
          <SystemStatusNode />

          <div className="border-t border-white/[0.02] pt-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.3em] uppercase text-grey-medium hover:text-admin-gold transition-colors duration-300"
            >
              ← Voltar ao site
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}

// MapClock component mapping back to the Maputo clock for the sidebar
function MapClock() {
  return <MaputoSidebarClock />;
}

function SystemStatusNode() {
  return (
    <div className="flex flex-col gap-1.5 text-[8px] font-mono text-grey/40 uppercase tracking-[0.2em] border-t border-white/[0.02] pt-3.5">
      <div className="flex items-center justify-between">
        <span>Concierge AI</span>
        <span className="text-emerald-400 font-semibold lowercase">online</span>
      </div>
      <div className="flex items-center justify-between">
        <span>RSVP Engine</span>
        <span className="text-emerald-400 font-semibold lowercase">active</span>
      </div>
      <div className="flex items-center justify-between">
        <span>DB Latency</span>
        <span className="text-admin-gold font-semibold lowercase">12ms</span>
      </div>
    </div>
  );
}
