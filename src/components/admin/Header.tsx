"use client";

import { Bell, CheckSquare, ExternalLink, Grid, LogOut, Menu, Search, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getAdminAlertsAction } from "@/lib/admin/actions/admin-alerts.actions";

type HeaderProps = {
  onMenuClick?: () => void;
};

type TaskItem = {
  id: string;
  text: string;
  checked: boolean;
};

type NotificationItem = {
  id: string;
  text: string;
  time: string;
  read: boolean;
  href?: string;
};

const DEFAULT_TASKS: TaskItem[] = [
  { id: "1", text: "Confirmar RSVP do Casamento de Sofia", checked: false },
  { id: "2", text: "Rever faturas em atraso no painel Caixa", checked: false },
  { id: "3", text: "Aprovar design do menu corporativo", checked: false },
  { id: "4", text: "Responder ao novo lead no Quick Leads Hub", checked: false },
  { id: "5", text: "Rever projecções de margem trimestral", checked: false },
];

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [];

export default function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();

  // Dialog and panel states
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [modulesOpen, setModulesOpen] = useState(false);

  // Data states
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);

  // Refs for clicking outside
  const modulesRef = useRef<HTMLDivElement>(null);

  // Load profile avatar from localStorage and listen for updates
  useEffect(() => {
    function loadAvatar() {
      setProfileAvatar(localStorage.getItem("haxr_admin_avatar"));
    }
    loadAvatar();
    window.addEventListener("haxr_profile_updated", loadAvatar);
    return () => window.removeEventListener("haxr_profile_updated", loadAvatar);
  }, []);

  // Load and save Checklist tasks
  useEffect(() => {
    const stored = localStorage.getItem("haxr_admin_tasks");
    if (stored) {
      try {
        setTasks(JSON.parse(stored));
      } catch (e) {
        setTasks(DEFAULT_TASKS);
      }
    } else {
      setTasks(DEFAULT_TASKS);
      localStorage.setItem("haxr_admin_tasks", JSON.stringify(DEFAULT_TASKS));
    }
  }, []);

  const saveTasks = (newTasks: TaskItem[]) => {
    setTasks(newTasks);
    localStorage.setItem("haxr_admin_tasks", JSON.stringify(newTasks));
  };

  const toggleTask = (id: string) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, checked: !t.checked } : t));
    saveTasks(updated);
  };

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

  const markAllNotificationsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  const clearNotifications = () => {
    saveNotifications([]);
  };

  // Close modules dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modulesRef.current && !modulesRef.current.contains(event.target as Node)) {
        setModulesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Logout trigger
  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
    router.refresh();
  }

  // Active badge counts
  const pendingTasksCount = tasks.filter((t) => !t.checked).length;
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#0c0a09]/95 backdrop-blur-md border-b border-white/[0.03] px-4 md:px-8 h-16 flex items-center justify-between">
        {/* Left Side: Sidebar Toggle Menu button & Search bar */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onMenuClick}
            className="text-grey hover:text-white shrink-0 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Futuristic Search Bar */}
          <div className="hidden md:flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.02] border border-white/[0.04] text-white/40 focus-within:text-white/80 focus-within:border-admin-gold/30 focus-within:bg-white/[0.04] transition-all w-80">
            <Search className="w-4 h-4 shrink-0 text-grey-medium opacity-60" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Pesquisar no sistema..."
              className="bg-transparent border-none outline-none text-xs w-full placeholder:text-white/20 text-white/95 font-mono tracking-wide"
            />
          </div>
        </div>

        {/* Right Side: Quick Action shortcuts, Bell Badge notification, Flag, User profile avatar */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Mozambique Flag Selector */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.04] text-[10px] font-mono tracking-wider uppercase text-grey-medium">
            <span>🇲🇿</span>
            <span className="text-[9px] text-grey/60 font-semibold font-mono">MZ</span>
          </div>

          {/* Checklist Shortcut with Reactive Badge */}
          <button
            onClick={() => setChecklistOpen(true)}
            className="hidden sm:flex w-8 h-8 rounded-full bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] items-center justify-center text-grey-medium hover:text-white transition-colors relative"
            title="Checklist tarefas"
          >
            <CheckSquare className="w-4 h-4" strokeWidth={1.25} />
            {pendingTasksCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[8.5px] font-mono font-bold text-white flex items-center justify-center shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                {pendingTasksCount}
              </span>
            )}
          </button>

          {/* Grid Popover Module Selector */}
          <div className="relative" ref={modulesRef}>
            <button
              onClick={() => setModulesOpen(!modulesOpen)}
              className="hidden sm:flex w-8 h-8 rounded-full bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] items-center justify-center text-grey-medium hover:text-white transition-colors"
              title="Módulos Concierge"
            >
              <Grid className="w-4 h-4" strokeWidth={1.25} />
            </button>

            {modulesOpen && (
              <div className="absolute right-0 mt-3.5 w-64 rounded-xl border border-white/[0.06] bg-[#0c0a09] p-4 shadow-[0_12px_36px_rgba(0,0,0,0.8)] z-40 space-y-3.5">
                <p className="font-mono text-[8px] tracking-[0.25em] text-grey-medium uppercase opacity-55">
                  Módulos HAXR Suite
                </p>
                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    { name: "HAXR Signature", desc: "Gestão contratos digitais", link: "/admin/documents" },
                    { name: "HAXR Concierge AI", desc: "Atendimento e assistente virtual", link: "/" },
                    { name: "RSVP Engine", desc: "Confirmação convidados", link: "/admin/events" },
                    { name: "HAXR Invoices", desc: "Contabilidade e Caixa", link: "/admin/cash" },
                  ].map((mod) => (
                    <Link
                      key={mod.name}
                      href={mod.link}
                      onClick={() => setModulesOpen(false)}
                      className="p-2.5 rounded-lg border border-white/[0.02] hover:border-admin-gold/15 bg-white/[0.01] hover:bg-admin-gold/5 flex items-center justify-between group transition-all duration-300"
                    >
                      <div className="min-w-0">
                        <p className="text-[10px] font-mono text-white/95 uppercase tracking-wider group-hover:text-admin-gold transition-colors">{mod.name}</p>
                        <p className="text-[8.5px] text-grey/55 truncate mt-0.5">{mod.desc}</p>
                      </div>
                      <ExternalLink className="w-3 h-3 text-grey/40 group-hover:text-admin-gold transition-colors shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
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

          {/* User Profile Avatar - Real photo from localStorage */}
          <div className="flex items-center gap-3">
            <Link href="/admin/profile" className="relative group cursor-pointer" title="Ver Perfil">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-admin-gold/30 group-hover:border-admin-gold transition-colors duration-300 shadow-[0_0_10px_rgba(184,138,42,0.1)]">
                {profileAvatar ? (
                  <img
                    src={profileAvatar}
                    alt="Avatar Administrador"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#12100e] to-[#0c0a09] flex items-center justify-center">
                    <span className="text-[10px] font-mono text-admin-gold/60 font-bold">HS</span>
                  </div>
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#25d366] border-2 border-black" />
            </Link>

            {/* Logout Trigger button */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.2em] uppercase text-grey-medium hover:text-admin-gold transition-colors px-2 py-1.5"
              aria-label="Terminar sessão"
              title="Sair"
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={1.25} />
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* checklist / TASKS DRAWER (Slide-over panel)                   */}
      {/* ------------------------------------------------------------- */}
      {checklistOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 overflow-hidden">
            {/* Overlay background */}
            <div
              onClick={() => setChecklistOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
            />

            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <div className="pointer-events-auto w-screen max-w-md transform border-l border-white/[0.04] bg-[#0c0a09] shadow-[0_0_50px_rgba(0,0,0,0.9)] duration-300">
                <div className="flex h-full flex-col overflow-y-scroll py-6 scrollbar-none">
                  <div className="px-6 flex items-center justify-between border-b border-white/[0.03] pb-4">
                    <div>
                      <span className="font-mono text-[8px] tracking-[0.4em] uppercase text-admin-gold">
                        Gestor de Operações
                      </span>
                      <h2 className="font-serif text-xl font-light text-white mt-1">Checklist do Dia</h2>
                    </div>
                    <button
                      onClick={() => setChecklistOpen(false)}
                      className="rounded-full p-1 text-grey hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Tasks List */}
                  <div className="relative mt-6 flex-1 px-6 space-y-4">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => toggleTask(task.id)}
                        className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer flex items-start gap-3.5 ${
                          task.checked
                            ? "bg-white/[0.01] border-white/[0.02] text-grey/40"
                            : "bg-white/[0.02] border-white/[0.04] text-white hover:border-admin-gold/25"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={task.checked}
                          onChange={() => {}} // Controlled by div click
                          className="mt-0.5 h-3.5 w-3.5 rounded-sm border-white/20 bg-transparent text-admin-gold focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        />
                        <span className={`text-[11px] font-mono tracking-wide leading-relaxed ${task.checked ? "line-through" : ""}`}>
                          {task.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-white/[0.03] px-6 pt-5 flex items-center justify-between">
                    <span className="text-[9px] font-mono text-grey/40">
                      {tasks.filter((t) => t.checked).length} de {tasks.length} concluídas
                    </span>
                    <button
                      onClick={() => saveTasks(tasks.map(t => ({ ...t, checked: false })))}
                      className="font-mono text-[9.5px] tracking-wider uppercase text-admin-gold hover:opacity-85 transition-opacity"
                    >
                      Reiniciar lista
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                          onClick={() => setNotificationsOpen(false)}
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
                          className={`p-4 rounded-xl border flex flex-col justify-between transition-all duration-300 ${
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
                      <button
                        onClick={clearNotifications}
                        className="font-mono text-[9.5px] tracking-wider uppercase text-admin-gold hover:opacity-85 transition-opacity"
                      >
                        Limpar histórico
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
