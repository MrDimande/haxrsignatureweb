"use client";

import { Bell, KeyRound, LogOut, Menu, ShieldCheck, UserRound, Users, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAdminIdentity } from "@/components/admin/AdminIdentityProvider";
import { getAdminAlertsAction } from "@/lib/admin/actions/admin-alerts.actions";
import {
  canManageAdminUsers,
  getAdminInitials,
  getAdminRoleLabel,
} from "@/lib/admin/admin-user";

type HeaderProps = {
  onMenuClick?: () => void;
};

type NotificationItem = {
  id: string;
  text: string;
  time: string;
  read: boolean;
  href?: string;
};

export default function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const identity = useAdminIdentity();

  // Dialog and panel states
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Data states
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  // Load operational notifications from server
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const result = await getAdminAlertsAction();
      if (cancelled || !result.success) return;

      const readRaw = localStorage.getItem("haxr_admin_notifications_read");
      let readIds = new Set<string>();
      try {
        if (readRaw) readIds = new Set(JSON.parse(readRaw) as string[]);
      } catch {
        readIds = new Set();
      }

      setNotifications(
        result.data.map((alert) => ({
          id: alert.id,
          text: alert.text,
          time: alert.time,
          read: readIds.has(alert.id),
          href: alert.href,
        }))
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [notificationsOpen]);

  const saveNotifications = (newNotifs: NotificationItem[]) => {
    setNotifications(newNotifs);
    const readIds = newNotifs.filter((n) => n.read).map((n) => n.id);
    localStorage.setItem("haxr_admin_notifications_read", JSON.stringify(readIds));
  };

  const markNotificationRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    saveNotifications(updated);
  };

  const markAllNotificationsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  // Logout trigger
  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
    router.refresh();
  }

  // Active badge counts
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;
  const initials = getAdminInitials(identity);
  const displayName = identity?.name || "Administração HAXR";
  const roleLabel = getAdminRoleLabel(identity?.role ?? null);
  const mayManageUsers = canManageAdminUsers(identity);

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#0c0a09]/95 backdrop-blur-md border-b border-white/[0.03] px-4 md:px-8 h-16 flex items-center justify-between">
        {/* Left Side: Sidebar Toggle Menu button */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onMenuClick}
            className="text-grey hover:text-white shrink-0 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Right Side: Quick Action shortcuts, Bell Badge notification, Flag, User profile avatar */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Mozambique Flag Selector */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.04] text-[10px] font-mono tracking-wider uppercase text-grey-medium">
            <span>🇲🇿</span>
            <span className="text-[9px] text-grey/60 font-semibold font-mono">MZ</span>
          </div>

          {/* Notification Bell with Reactive Badge */}
          <button
            onClick={() => setNotificationsOpen(true)}
            className="w-8 h-8 rounded-full bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] flex items-center justify-center text-grey-medium hover:text-white transition-colors relative"
            title="Notificações"
          >
            <Bell className="w-4 h-4" strokeWidth={1.25} />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[8.5px] font-mono font-bold text-white flex items-center justify-center shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Divider */}
          <span className="h-6 w-px bg-white/[0.06] hidden sm:block" />

          <details className="relative">
            <summary
              className="list-none relative group cursor-pointer [&::-webkit-details-marker]:hidden"
              aria-label="Abrir menu do perfil"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border border-admin-gold/30 group-hover:border-admin-gold transition-colors duration-300 shadow-[0_0_10px_rgba(184,138,42,0.1)]">
                <div className="w-full h-full bg-gradient-to-br from-[#12100e] to-[#0c0a09] flex items-center justify-center">
                  <span className="text-[10px] font-mono text-admin-gold/80 font-bold">{initials}</span>
                </div>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#25d366] border-2 border-black" />
            </summary>

            <div
              className="absolute right-0 mt-3 w-64 rounded-xl border border-white/[0.08] bg-[#100e0c] p-2 shadow-[0_18px_50px_rgba(0,0,0,0.65)]"
              role="menu"
            >
              <div className="px-3 py-2.5 border-b border-white/[0.05]">
                <p className="truncate text-sm text-white">{displayName}</p>
                <p className="mt-1 text-[8px] font-mono uppercase tracking-[0.2em] text-admin-gold">
                  {roleLabel}
                </p>
              </div>
              <div className="py-1">
                <Link
                  href="/admin/profile"
                  role="menuitem"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs text-grey-medium hover:bg-white/[0.05] hover:text-white"
                >
                  <UserRound className="h-4 w-4" strokeWidth={1.25} />
                  Meu perfil
                </Link>
                <Link
                  href="/admin/security"
                  role="menuitem"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs text-grey-medium hover:bg-white/[0.05] hover:text-white"
                >
                  <KeyRound className="h-4 w-4" strokeWidth={1.25} />
                  Segurança da conta
                </Link>
                {mayManageUsers ? (
                  <Link
                    href="/admin/users"
                    role="menuitem"
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs text-grey-medium hover:bg-white/[0.05] hover:text-white"
                  >
                    <Users className="h-4 w-4" strokeWidth={1.25} />
                    Gestão de utilizadores
                  </Link>
                ) : null}
              </div>
              <div className="border-t border-white/[0.05] pt-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  role="menuitem"
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs text-grey-medium hover:bg-white/[0.05] hover:text-admin-gold"
                >
                  <LogOut className="h-4 w-4" strokeWidth={1.25} />
                  Terminar sessão
                </button>
              </div>
            </div>
          </details>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* notifications DRAWER (Slide-over panel)                       */}
      {/* ------------------------------------------------------------- */}
      {notificationsOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 overflow-hidden">
            {/* Overlay background */}
            <div
              onClick={() => setNotificationsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
            />

            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <div className="pointer-events-auto w-screen max-w-md transform border-l border-white/[0.04] bg-[#0c0a09] shadow-[0_0_50px_rgba(0,0,0,0.9)] duration-300">
                <div className="flex h-full flex-col overflow-y-scroll py-6 scrollbar-none">
                  <div className="px-6 flex items-center justify-between border-b border-white/[0.03] pb-4">
                    <div>
                      <span className="font-mono text-[8px] tracking-[0.4em] uppercase text-admin-gold">
                        Alertas do Sistema
                      </span>
                      <h2 className="font-serif text-xl font-light text-white mt-1">Notificações</h2>
                    </div>
                    <button
                      onClick={() => setNotificationsOpen(false)}
                      className="rounded-full p-1 text-grey hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Notifications List */}
                  <div className="relative mt-6 flex-1 px-6 space-y-3.5">
                    {notifications.map((notif) => {
                      const content = (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-[11px] font-mono tracking-wide leading-relaxed">
                              {notif.text}
                            </p>
                            {!notif.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1 shadow-[0_0_6px_rgba(239,68,68,0.7)]" />
                            )}
                          </div>
                          <span className="text-[8px] font-mono text-grey/40 mt-3 uppercase tracking-wider">
                            {notif.time}
                          </span>
                        </>
                      );

                      return notif.href ? (
                        <Link
                          key={notif.id}
                          href={notif.href}
                          onClick={() => {
                            markNotificationRead(notif.id);
                            setNotificationsOpen(false);
                          }}
                          className={`p-4 rounded-xl border flex flex-col justify-between transition-all duration-300 ${
                            notif.read
                              ? "bg-white/[0.01] border-white/[0.02] text-grey/40"
                              : "bg-white/[0.02] border-white/[0.04] text-white/95 hover:border-admin-gold/25"
                          }`}
                        >
                          {content}
                        </Link>
                      ) : (
                        <div
                          key={notif.id}
                          onClick={() => markNotificationRead(notif.id)}
                          className={`p-4 rounded-xl border flex flex-col justify-between transition-all duration-300 cursor-pointer ${
                            notif.read
                              ? "bg-white/[0.01] border-white/[0.02] text-grey/40"
                              : "bg-white/[0.02] border-white/[0.04] text-white/95 hover:border-admin-gold/25"
                          }`}
                        >
                          {content}
                        </div>
                      );
                    })}
                    {notifications.length === 0 && (
                      <div className="text-center p-8 border border-dashed border-white/5 rounded-xl">
                        <p className="text-xs text-grey/45 italic font-mono flex items-center justify-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" /> Sem alertas pendentes.
                        </p>
                      </div>
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="border-t border-white/[0.03] px-6 pt-5 flex items-center justify-between">
                      <button
                        onClick={markAllNotificationsRead}
                        className="font-mono text-[9.5px] tracking-wider uppercase text-grey-medium hover:text-white transition-colors"
                      >
                        Lidas todas
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
