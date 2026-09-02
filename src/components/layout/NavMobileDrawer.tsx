"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarCheck2,
  ChevronDown,
  Coins,
  Heart,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Search,
  Settings,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { navAccountLink, type NavGroup, type NavLink } from "@/lib/marketing/navigation";
import type { AppUserDisplay } from "@/lib/auth/app-user-display";

interface FavoriteItem {
  id: string;
  title: string;
  category: string;
  image: string;
}

type NavMobileDrawerProps = {
  open: boolean;
  onClose: () => void;
  onOpenSearch?: () => void;
  groups: readonly NavGroup[];
  directLinks: readonly NavLink[];
  favorites: FavoriteItem[];
  onRemoveFavorite: (id: string) => void;
  whatsAppShareHref: string;
  auth?: {
    isAuthenticated: boolean;
    userDisplay: AppUserDisplay | null;
    signOut: () => Promise<void>;
  };
};

export default function NavMobileDrawer({
  open,
  onClose,
  onOpenSearch,
  groups,
  directLinks,
  favorites,
  onRemoveFavorite,
  whatsAppShareHref,
  auth,
}: NavMobileDrawerProps) {
  const pathname = usePathname();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (!open) {
      setExpandedId(null);
      setShowFavorites(false);
    }
  }, [open]);

  const handleMobileSignOut = async () => {
    if (isSigningOut || !auth) return;
    setIsSigningOut(true);
    await auth.signOut();
    onClose();
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-[2px] lg:hidden"
            onClick={onClose}
            aria-hidden
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-brand-black border-l border-gold-dim flex flex-col lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
          >
            {/* ── Top Header ── */}
            <div className="flex items-center justify-between px-5 h-[4.25rem] border-b border-gold-dim shrink-0">
              {auth?.isAuthenticated && auth.userDisplay ? (
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-gold/70 bg-brand-black font-serif text-xs font-bold text-brand-gold">
                    {auth.userDisplay.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-serif text-xs text-white truncate font-medium">
                      {auth.userDisplay.name}
                    </p>
                    <p className="font-mono text-[8px] text-brand-gold uppercase tracking-wider">
                      {auth.userDisplay.roleLabel}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="font-mono text-[9px] tracking-[0.35em] uppercase text-white/50">
                  Menu
                </p>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-white/70 hover:text-white transition-colors cursor-pointer"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5" strokeWidth={1.25} />
              </button>
            </div>

            {/* ── Scrollable Body ── */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              {/* ── Search Bar ── */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSearch?.();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-white hover:border-brand-gold/40 transition-colors text-xs font-light"
              >
                <Search className="h-4 w-4 text-brand-gold shrink-0" strokeWidth={1.5} />
                <span>Pesquisar serviços, guias, fornecedores...</span>
              </button>

              {/* ── Authenticated User Quick Links (If logged in) ── */}
              {auth?.isAuthenticated && auth.userDisplay && (
                <div className="p-3 rounded-xl border border-brand-gold/25 bg-brand-gold/5 space-y-2">
                  <p className="font-mono text-[8px] font-bold uppercase tracking-widest text-brand-gold/80 px-1">
                    Área Privada
                  </p>
                  <Link
                    href="/app/dashboard"
                    onClick={onClose}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-white hover:bg-white/10 transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4 text-brand-gold" />
                    <span>Painel do Casamento</span>
                  </Link>
                  <Link
                    href="/tools/wedding-checklist"
                    onClick={onClose}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-light text-white/80 hover:bg-white/10 transition-colors"
                  >
                    <CalendarCheck2 className="h-3.5 w-3.5 text-brand-gold/70" />
                    <span>Checklist & Tarefas</span>
                  </Link>
                  <Link
                    href="/tools/budget-tracker"
                    onClick={onClose}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-light text-white/80 hover:bg-white/10 transition-colors"
                  >
                    <Coins className="h-3.5 w-3.5 text-brand-gold/70" />
                    <span>Orçamento & Sinais</span>
                  </Link>
                </div>
              )}

              {/* ── Main Nav Groups ── */}
              <div className="space-y-1">
                {groups.map((group) => (
                  <div key={group.id} className="border-b border-white/8 pb-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId((current) =>
                          current === group.id ? null : group.id
                        )
                      }
                      className="w-full flex items-center justify-between py-3 font-sans text-xs tracking-[0.28em] uppercase text-white/75 cursor-pointer"
                      aria-expanded={expandedId === group.id}
                    >
                      {group.label}
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-300 ${
                          expandedId === group.id ? "rotate-180 text-brand-gold" : ""
                        }`}
                        strokeWidth={1.25}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {expandedId === group.id ? (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pl-3 pb-3 space-y-1 border-l border-brand-gold/30 ml-1">
                            {group.links.map((link) => (
                              <Link
                                key={`${group.id}-${link.href}-${link.label}`}
                                href={link.href}
                                onClick={onClose}
                                className={`block py-1.5 font-serif text-sm font-light transition-colors ${
                                  pathname === link.href
                                    ? "text-brand-gold-light"
                                    : "text-white/60 hover:text-white"
                                }`}
                              >
                                {link.label}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                ))}

                {directLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onClose}
                    className={`block py-3 font-sans text-xs tracking-[0.28em] uppercase border-b border-white/8 transition-colors ${
                      pathname === link.href
                        ? "text-brand-gold-light"
                        : "text-white/75 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* ── Favorites Section ── */}
              <button
                type="button"
                onClick={() => setShowFavorites((value) => !value)}
                className="w-full flex items-center justify-between py-3 font-sans text-xs tracking-[0.28em] uppercase text-white/75 cursor-pointer"
                aria-expanded={showFavorites}
              >
                <span className="inline-flex items-center gap-2">
                  <Heart className="w-3.5 h-3.5" strokeWidth={1.25} />
                  Favoritos ({favorites.length})
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ${
                    showFavorites ? "rotate-180" : ""
                  }`}
                  strokeWidth={1.25}
                />
              </button>

              <AnimatePresence initial={false}>
                {showFavorites ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 pb-4">
                      {favorites.length === 0 ? (
                        <p className="font-sans text-xs text-white/45 font-light leading-relaxed">
                          Guarde serviços nos favoritos enquanto explora o site.
                        </p>
                      ) : (
                        favorites.map((item) => (
                          <div
                            key={item.id}
                            className="flex gap-3 p-3 rounded-sm border border-white/10 bg-white/5"
                          >
                            <div className="w-12 h-12 rounded-sm overflow-hidden bg-brand-champagne/20 shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.image}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-mono text-[8px] tracking-[0.2em] uppercase text-brand-gold/80 mb-0.5 truncate">
                                {item.category}
                              </p>
                              <p className="font-serif text-sm text-white/80 truncate">
                                {item.title}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => onRemoveFavorite(item.id)}
                              className="p-1 text-white/40 hover:text-red-400 cursor-pointer"
                              aria-label="Remover favorito"
                            >
                              <Trash2 className="w-4 h-4" strokeWidth={1.25} />
                            </button>
                          </div>
                        ))
                      )}

                      {favorites.length > 0 ? (
                        <a
                          href={whatsAppShareHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 font-mono text-[9px] tracking-[0.25em] uppercase text-brand-gold hover:text-brand-gold-light transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.25} />
                          Partilhar com a HAXR
                        </a>
                      ) : null}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {/* ── Footer / CTA / Sign Out ── */}
            <div className="p-5 border-t border-gold-dim shrink-0">
              {auth?.isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleMobileSignOut}
                  disabled={isSigningOut}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-rose-500/40 bg-rose-950/20 text-rose-300 font-sans text-xs font-medium hover:bg-rose-900/30 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{isSigningOut ? "A terminar sessão..." : "Terminar Sessão"}</span>
                </button>
              ) : (
                <Link
                  href={navAccountLink.href}
                  onClick={onClose}
                  className="btn-editorial btn-editorial--solid w-full text-center py-3.5 block"
                >
                  {navAccountLink.label}
                </Link>
              )}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
