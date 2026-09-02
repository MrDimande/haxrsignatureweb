"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarCheck2,
  ChevronDown,
  Coins,
  Heart,
  LayoutDashboard,
  LogOut,
  Settings,
  UserCheck2,
  Users,
} from "lucide-react";
import type { AppUserDisplay } from "@/lib/auth/app-user-display";

type NavUserMenuProps = {
  userDisplay: AppUserDisplay;
  onSignOut: () => Promise<void>;
};

export default function NavUserMenu({ userDisplay, onSignOut }: NavUserMenuProps) {
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleSignOutClick = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    await onSignOut();
  };

  return (
    <div ref={menuRef} className="relative">
      {/* ── Avatar Button Trigger ── */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Menu da conta"
        className="group flex items-center gap-2 p-1 rounded-full transition-all duration-300 hover:ring-2 hover:ring-brand-gold/40 cursor-pointer"
      >
        <div className="relative flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full border border-brand-gold/70 bg-brand-black font-serif text-xs font-bold text-brand-gold shadow-[0_0_12px_rgba(184,138,42,0.25)] group-hover:border-brand-gold-light transition-colors">
          <span>{userDisplay.initials}</span>
          <span className="absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-brand-black" />
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-white/70 transition-transform duration-300 group-hover:text-white ${
            open ? "rotate-180 text-brand-gold" : ""
          }`}
          strokeWidth={1.5}
        />
      </button>

      {/* ── Dropdown Menu ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2.5 w-72 md:w-80 rounded-2xl border border-brand-champagne/45 bg-[#faf8f5] shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden z-50 divide-y divide-brand-champagne/25"
          >
            {/* ── User Profile Header ── */}
            <div className="p-4 bg-white/80">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brand-gold/60 bg-brand-black font-serif text-sm font-bold text-brand-gold">
                  {userDisplay.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-serif text-sm font-medium text-brand-text-dark truncate">
                      {userDisplay.name}
                    </p>
                  </div>
                  <p className="font-mono text-[9px] text-brand-text-dark/50 truncate">
                    {userDisplay.email}
                  </p>
                  <span className="inline-block mt-1 rounded-full border border-brand-champagne/60 bg-brand-champagne/20 px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider text-brand-gold">
                    {userDisplay.roleLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Main Links ── */}
            <div className="p-2 space-y-0.5">
              <Link
                href="/app/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-sans text-xs font-light text-brand-text-dark hover:bg-white hover:text-brand-gold hover:shadow-2xs transition-all group"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-champagne/25 text-brand-gold group-hover:bg-brand-gold group-hover:text-brand-black transition-colors">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="font-medium text-brand-text-dark block">Painel do Casamento</span>
                  <span className="text-[10px] text-brand-text-dark/50 block">Aceder ao dashboard privado</span>
                </div>
              </Link>

              <Link
                href="/tools/wedding-checklist"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2 rounded-xl font-sans text-xs font-light text-brand-text-dark/80 hover:bg-white hover:text-brand-gold transition-all group"
              >
                <CalendarCheck2 className="h-4 w-4 text-brand-gold/80 group-hover:text-brand-gold" />
                <span>Checklist & Tarefas</span>
              </Link>

              <Link
                href="/tools/budget-tracker"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2 rounded-xl font-sans text-xs font-light text-brand-text-dark/80 hover:bg-white hover:text-brand-gold transition-all group"
              >
                <Coins className="h-4 w-4 text-brand-gold/80 group-hover:text-brand-gold" />
                <span>Orçamento & Sinais</span>
              </Link>

              <Link
                href="/tools/guest-list"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2 rounded-xl font-sans text-xs font-light text-brand-text-dark/80 hover:bg-white hover:text-brand-gold transition-all group"
              >
                <Users className="h-4 w-4 text-brand-gold/80 group-hover:text-brand-gold" />
                <span>Lista de Convidados & RSVP</span>
              </Link>

              <Link
                href="/app/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2 rounded-xl font-sans text-xs font-light text-brand-text-dark/80 hover:bg-white hover:text-brand-gold transition-all group"
              >
                <Settings className="h-4 w-4 text-brand-gold/80 group-hover:text-brand-gold" />
                <span>Definições da Conta</span>
              </Link>
            </div>

            {/* ── Sign Out ── */}
            <div className="p-2">
              <button
                type="button"
                onClick={handleSignOutClick}
                disabled={isSigningOut}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl font-sans text-xs font-light text-rose-600 hover:bg-rose-50/80 transition-colors cursor-pointer disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
                <span>{isSigningOut ? "A terminar sessão..." : "Terminar Sessão"}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
