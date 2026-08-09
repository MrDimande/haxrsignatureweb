"use client";

import { useState, Suspense, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  X,
} from "lucide-react";
import { resolveAppNavIcon } from "@/components/app/AppNavIcons";
import HaxrLogo from "@/components/brand/HaxrLogo";
import OnboardingSyncController from "@/components/app/OnboardingSyncController";
import { signOutFromSupabase } from "@/lib/auth/sign-in-auth";
import type { AppUserDisplay } from "@/lib/auth/app-user-display";
import { useAppEvent } from "@/hooks/use-app-event";
import { buildAppNavigation } from "@/lib/event-modules/module-config";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type AppShellProps = {
  children: ReactNode;
  userDisplay: AppUserDisplay;
  initialEventId?: string | null;
};

function UserSummary({ userDisplay }: { userDisplay: AppUserDisplay }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-gold/60 bg-black font-serif text-[10px] font-bold text-brand-gold shadow-[0_0_0_3px_rgba(184,138,42,0.08)]">
        {userDisplay.initials}
      </div>
      <div className="min-w-0 text-left">
        <p className="truncate font-semibold text-white">{userDisplay.name}</p>
        <p className="truncate font-mono text-[9px] text-zinc-500">
          {userDisplay.roleLabel} · {userDisplay.email}
        </p>
      </div>
    </div>
  );
}

export default function AppShell({ children, userDisplay, initialEventId }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { eventName: activeEvent, eventId, isResolved: eventResolved } =
    useAppEvent(initialEventId);
  const pathname = usePathname();
  const router = useRouter();

  const navigationGroups = buildAppNavigation(eventResolved ? eventId : null);

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    if (signingOut) return;

    setSigningOut(true);
    const supabase = createSupabaseBrowserClient();
    await signOutFromSupabase(supabase);
    router.replace("/sign-in");
    router.refresh();
  };

  const settingsLink = (
    <Link
      href="/app/settings"
      onClick={handleLinkClick}
      className="text-zinc-400 transition-colors hover:text-white"
      aria-label="Definições da conta"
    >
      <Settings className="h-4 w-4" />
    </Link>
  );

  const signOutButton = (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={signingOut}
      className="text-zinc-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      aria-label="Sair"
      title="Sair"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );

  return (
    <div className="haxr-app-shell flex min-h-screen overflow-x-hidden bg-[#0c0a09] font-sans text-zinc-100 antialiased">
      <Suspense fallback={null}>
        <OnboardingSyncController />
      </Suspense>
      <aside className="haxr-app-sidebar scrollbar-none sticky top-0 z-40 hidden h-screen w-[272px] shrink-0 select-none flex-col overflow-y-auto border-r border-brand-champagne/10 bg-[#0c0a09] lg:flex">
        <div className="flex flex-col justify-center border-b border-brand-champagne/10 p-6">
          <HaxrLogo
            variant="full"
            tone="dark"
            size="sm"
            subtitle="Wedding Dashboard"
            link
            href="/app/dashboard"
            className="items-start"
          />
        </div>

        <nav className="flex-1 space-y-8 p-5">
          {navigationGroups.map((group) => (
            <div key={group.groupName} className="space-y-2">
              <p className="pl-3 font-mono text-[8px] font-semibold uppercase tracking-[0.25em] text-brand-gold/60">
                {group.groupName}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = resolveAppNavIcon(item.iconName);
                  const isDisabled = item.disabled === true;
                  const isActive =
                    !isDisabled &&
                    (pathname === item.href ||
                      (item.href !== "/app/dashboard" &&
                        (pathname?.startsWith(`${item.href}/`) ?? false)));

                  return (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        aria-disabled={isDisabled || undefined}
                        tabIndex={isDisabled ? -1 : undefined}
                        title={isDisabled ? "A preparar o evento..." : undefined}
                        onClick={(event) => {
                          if (isDisabled) {
                            event.preventDefault();
                            return;
                          }
                          handleLinkClick();
                        }}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 font-sans text-xs transition-all duration-300 ${
                          isActive
                            ? "border border-brand-gold/35 bg-brand-gold/[0.12] font-medium text-brand-ivory shadow-[inset_3px_0_0_#b88a2a]"
                            : isDisabled
                              ? "cursor-wait text-zinc-600"
                            : item.ready
                              ? "text-zinc-400 hover:bg-white/5 hover:text-white"
                              : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 shrink-0 ${isActive ? "text-brand-gold" : "text-zinc-400/80"}`}
                          strokeWidth={1.5}
                        />
                        <span>{item.label}</span>
                        {!item.ready ? (
                          <span className="ml-auto font-mono text-[7px] uppercase text-zinc-600">
                            breve
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="flex items-center justify-between gap-3 border-t border-brand-champagne/10 bg-black/30 p-4 text-xs">
          <UserSummary userDisplay={userDisplay} />
          <div className="flex items-center gap-3">
            {settingsLink}
            {signOutButton}
          </div>
        </div>
      </aside>

      <div className="relative flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="haxr-app-header sticky top-0 z-35 flex h-[72px] items-center justify-between border-b border-brand-champagne/10 bg-[#0c0a09] bg-opacity-90 px-4 backdrop-blur-md sm:px-6 md:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="cursor-pointer p-2 text-zinc-400 hover:text-white lg:hidden"
              aria-label="Abrir Menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="relative flex items-center gap-2">
              <div className="flex cursor-pointer select-none items-center gap-2 rounded-full border border-brand-champagne/20 bg-white/5 py-1.5 pl-3.5 pr-2.5 text-[11px] text-white transition-colors hover:border-brand-gold/50 md:text-xs">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-gold" />
                <span className="max-w-[7rem] truncate font-serif font-medium sm:max-w-none">
                  {activeEvent}
                </span>
                <ChevronDown className="h-3 w-3 text-zinc-400" />
              </div>

              <span className="hidden items-center rounded-full border border-brand-gold/30 bg-brand-gold/10 px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest text-brand-gold sm:inline-flex">
                Evento em planeamento
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            <div className="hidden w-[180px] items-center rounded-lg border border-brand-champagne/10 bg-white/5 px-3 py-1.5 text-xs md:flex lg:w-[220px]">
              <Search className="mr-2 h-3.5 w-3.5 shrink-0 text-zinc-500" />
              <input
                type="text"
                placeholder="Procurar no painel..."
                className="w-full border-0 bg-transparent text-zinc-200 outline-none placeholder-zinc-500"
              />
            </div>

            <button
              type="button"
              className="relative cursor-pointer rounded-lg border border-brand-champagne/10 bg-white/5 p-2 text-zinc-400 hover:text-white active:scale-95"
              aria-label="Notificações"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-brand-gold" />
            </button>

            <Link
              href="/app/concierge"
              aria-label="Adicionar ficheiro"
              className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand-gold p-2 font-mono text-[9px] font-bold uppercase tracking-widest text-white shadow-md shadow-brand-gold/10 transition-colors hover:bg-brand-gold-light sm:px-4 sm:py-2 md:text-[10px]"
            >
              <Plus className="h-4 w-4 sm:h-3 sm:w-3" aria-hidden />
              <span className="hidden sm:inline">Adicionar Ficheiro</span>
            </Link>
          </div>
        </header>

        <main className="haxr-app-main flex-1 p-4 sm:p-6 md:p-8 xl:p-10">{children}</main>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-50 flex select-none justify-start bg-black/80 lg:hidden"
          >
            <motion.div
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="scrollbar-none flex h-full w-[260px] flex-col justify-between overflow-y-auto border-r border-brand-champagne/10 bg-[#0c0a09]"
            >
              <div>
                <div className="flex items-center justify-between border-b border-brand-champagne/10 p-6">
                  <HaxrLogo
                    variant="full"
                    tone="dark"
                    size="sm"
                    subtitle="Wedding Dashboard"
                    link
                    href="/app/dashboard"
                    className="items-start"
                  />
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="cursor-pointer rounded-full border border-white/10 p-2 text-zinc-400 hover:text-white"
                    aria-label="Fechar Menu"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <nav className="space-y-6 p-5">
                  {navigationGroups.map((group) => (
                    <div key={group.groupName} className="space-y-1.5">
                      <p className="pl-3 font-mono text-[8px] font-semibold uppercase tracking-[0.25em] text-brand-gold/60">
                        {group.groupName}
                      </p>
                      <ul className="space-y-0.5">
                        {group.items.map((item) => {
                          const Icon = resolveAppNavIcon(item.iconName);
                          const isDisabled = item.disabled === true;
                          const isActive =
                            !isDisabled &&
                            (pathname === item.href ||
                              (item.href !== "/app/dashboard" &&
                                (pathname?.startsWith(`${item.href}/`) ?? false)));

                          return (
                            <li key={item.label}>
                              <Link
                                href={item.href}
                                aria-disabled={isDisabled || undefined}
                                tabIndex={isDisabled ? -1 : undefined}
                                title={isDisabled ? "A preparar o evento..." : undefined}
                                onClick={(event) => {
                                  if (isDisabled) {
                                    event.preventDefault();
                                    return;
                                  }
                                  handleLinkClick();
                                }}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2 font-sans text-xs transition-all duration-300 ${
                                  isActive
                                    ? "border border-brand-gold/35 bg-brand-gold/[0.12] font-medium text-brand-ivory shadow-[inset_3px_0_0_#b88a2a]"
                                    : isDisabled
                                      ? "cursor-wait text-zinc-600"
                                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                                }`}
                              >
                                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                                <span>{item.label}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </nav>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-brand-champagne/10 bg-black/35 p-4 text-xs">
                <UserSummary userDisplay={userDisplay} />
                <div className="flex items-center gap-3">
                  {settingsLink}
                  {signOutButton}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
