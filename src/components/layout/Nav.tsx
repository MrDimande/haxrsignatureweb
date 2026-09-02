"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { Heart, MessageCircle, Search, Trash2, X } from "lucide-react";
import BrandLogo from "@/components/ui/BrandLogo";
import NavMegaMenu, { type NavVariant } from "@/components/layout/NavMegaMenu";
import NavMobileDrawer from "@/components/layout/NavMobileDrawer";
import NavSearchModal from "@/components/layout/NavSearchModal";
import NavUserMenu from "@/components/layout/NavUserMenu";
import { useNavAuth } from "@/hooks/use-nav-auth";
import {
  navAccountLink,
  navDirectLinks,
  navGroups,
} from "@/lib/marketing/navigation";

interface FavoriteItem {
  id: string;
  title: string;
  category: string;
  image: string;
}

export default function Nav() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  // ── Reading Progress Indicator (Barra Sutil Dourada 1.5px) ──
  const { scrollYProgress } = useScroll();
  const readingProgress = useSpring(scrollYProgress, {
    stiffness: 280,
    damping: 30,
    restDelta: 0.001,
  });

  // ── Dynamic Authentication State ──
  const { isAuthenticated, userDisplay, signOut } = useNavAuth();

  const navVariant: NavVariant =
    isHome && !scrolled ? "hero" : "dark";

  useEffect(() => {
    const handleOpenSearch = () => setSearchOpen(true);
    window.addEventListener("open-haxr-search", handleOpenSearch);
    return () => window.removeEventListener("open-haxr-search", handleOpenSearch);
  }, []);

  useEffect(() => {
    const loadFavorites = () => {
      try {
        const stored = localStorage.getItem("haxr-favorites");
        setFavorites(stored ? JSON.parse(stored) : []);
      } catch {
        setFavorites([]);
      }
    };

    loadFavorites();
    window.addEventListener("haxr-favorites-updated", loadFavorites);
    window.addEventListener("storage", loadFavorites);
    return () => {
      window.removeEventListener("haxr-favorites-updated", loadFavorites);
      window.removeEventListener("storage", loadFavorites);
    };
  }, []);

  useEffect(() => {
    if (!isHome) {
      setScrolled(true);
      return;
    }

    const onScroll = () => {
      setScrolled(window.scrollY > 48);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome, pathname]);

  useEffect(() => {
    document.body.style.overflow =
      menuOpen || favoritesOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, favoritesOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const removeFavorite = (id: string) => {
    const updated = favorites.filter((item) => item.id !== id);
    localStorage.setItem("haxr-favorites", JSON.stringify(updated));
    setFavorites(updated);
    window.dispatchEvent(new Event("haxr-favorites-updated"));
  };

  const getWhatsAppShareLink = () => {
    const itemsList = favorites
      .map((item) => `- ${item.title} (${item.category})`)
      .join("\n");
    const message = `Olá HAXR Signature! Estive a explorar o vosso site e guardei os seguintes serviços nos meus favoritos:\n\n${itemsList}\n\nGostaria de falar com um consultor para obter mais informações e uma proposta personalizada.`;
    return `https://wa.me/258870883428?text=${encodeURIComponent(message)}`;
  };

  const directLinkClass = (href: string) => {
    const active = pathname === href;
    return active
      ? "text-white"
      : "text-white/80 hover:text-white";
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-700 ${
          navVariant === "hero" ? "nav-home-hero" : "nav-home-scrolled"
        }`}
      >
        <div className="site-container-wide flex items-center justify-between h-[4.25rem] md:h-[4.5rem] gap-4">
          <Link
            href="/"
            className="opacity-95 hover:opacity-100 transition-opacity duration-500 shrink-0 py-1"
            aria-label="HAXR Signature — início"
          >
            <BrandLogo variant="navbar" priority />
          </Link>

          {/* ── Grupo de Navegação & Ações alinhado à Direita (Padrão Loverly) ── */}
          <div className="hidden lg:flex items-center gap-5 xl:gap-6 shrink-0">
            <NavMegaMenu groups={navGroups} variant={navVariant} />

            {navDirectLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-sans text-[11px] font-semibold tracking-[0.22em] uppercase transition-colors duration-500 whitespace-nowrap ${directLinkClass(link.href)}`}
              >
                {link.label}
              </Link>
            ))}

            {/* ── Botão de Pesquisa (Substitui Favoritos — Padrão Loverly) ── */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="relative p-2 text-white/80 hover:text-brand-gold transition-colors duration-300 cursor-pointer"
              aria-label="Pesquisar na HAXR Signature"
              title="Pesquisar (Cmd+K)"
            >
              <Search
                className="h-4 w-4 text-white/85 hover:text-brand-gold transition-colors"
                strokeWidth={1.5}
              />
            </button>

            {/* ── Dynamic User Account Avatar or Sign-in CTA ── */}
            {isAuthenticated && userDisplay ? (
              <NavUserMenu userDisplay={userDisplay} onSignOut={signOut} />
            ) : (
              <Link
                href={navAccountLink.href}
                className="font-sans text-[11px] font-semibold tracking-[0.2em] uppercase text-brand-black bg-brand-gold border border-brand-gold px-5 py-2.5 hover:bg-brand-gold-light hover:border-brand-gold-light transition-colors duration-500 whitespace-nowrap"
              >
                {navAccountLink.label}
              </Link>
            )}
          </div>

          <div className="lg:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="p-2 text-white/80 hover:text-brand-gold transition-colors cursor-pointer"
              aria-label="Pesquisar"
            >
              <Search className="h-4 w-4" strokeWidth={1.5} />
            </button>

            {isAuthenticated && userDisplay ? (
              <Link
                href="/app/dashboard"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-brand-gold/70 bg-brand-black font-serif text-[10px] font-bold text-brand-gold"
                aria-label="Painel do Casamento"
              >
                {userDisplay.initials}
              </Link>
            ) : null}

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex flex-col gap-1.5 p-2 cursor-pointer"
              aria-label="Abrir menu"
              aria-expanded={menuOpen}
            >
              <span className="block w-5 h-px bg-white transition-all duration-500" />
              <span className="block w-5 h-px bg-white transition-all duration-500" />
              <span className="block w-3 h-px ml-auto bg-white/80 transition-all duration-500" />
            </button>
          </div>
        </div>

        {/* ── Barra Sutil de Leitura Dourada (Reading Progress Indicator) ── */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-brand-gold/60 via-brand-gold-light to-brand-gold origin-left z-30 shadow-[0_0_10px_rgba(184,138,42,0.7)] pointer-events-none"
          style={{ scaleX: readingProgress }}
        />
      </nav>

      {/* ── Search Modal Global (Command Palette / Spotlight) ── */}
      <NavSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      <NavMobileDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onOpenSearch={() => setSearchOpen(true)}
        groups={navGroups}
        directLinks={navDirectLinks}
        favorites={favorites}
        onRemoveFavorite={removeFavorite}
        whatsAppShareHref={getWhatsAppShareLink()}
        auth={{
          isAuthenticated,
          userDisplay,
          signOut,
        }}
      />

      <AnimatePresence>
        {favoritesOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setFavoritesOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs cursor-pointer"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] bg-brand-ivory text-brand-text-dark z-50 shadow-2xl flex flex-col justify-between"
            >
              <div className="p-6 border-b border-brand-champagne/45 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-brand-gold fill-brand-gold" strokeWidth={1.25} />
                  <h3 className="font-serif text-lg font-light text-brand-text-dark tracking-wide">
                    Os Meus Favoritos ({favorites.length})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setFavoritesOpen(false)}
                  className="p-2 hover:bg-brand-champagne/20 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-brand-text-dark/60" strokeWidth={1.25} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {favorites.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <Heart className="w-12 h-12 text-brand-champagne mb-4 stroke-[1]" />
                    <p className="font-serif text-base text-brand-text-dark/60 font-light mb-2">
                      Sem favoritos ainda
                    </p>
                    <p className="font-sans text-xs text-brand-text-dark/45 font-light max-w-[240px]">
                      Explore os nossos serviços e clique no coração para guardar os seus favoritos aqui.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {favorites.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-4 p-3 bg-brand-champagne/15 border border-brand-champagne/30 rounded-xl relative group"
                      >
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-brand-champagne/20">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.image}
                            alt={item.title}
                            className="object-cover w-full h-full"
                          />
                        </div>

                        <div className="flex-1 min-w-0 pr-6 flex flex-col justify-center">
                          <p className="font-mono text-[8px] tracking-[0.25em] uppercase text-brand-gold font-semibold mb-1 truncate">
                            {item.category}
                          </p>
                          <h4 className="font-serif text-sm font-light text-brand-text-dark truncate">
                            {item.title}
                          </h4>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFavorite(item.id)}
                          className="absolute right-3 top-3 p-1.5 text-brand-text-dark/40 hover:text-red-500 rounded-full hover:bg-brand-champagne/25 transition-colors cursor-pointer"
                          aria-label="Remover favorito"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.25} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {favorites.length > 0 ? (
                <div className="p-6 border-t border-brand-champagne/45 bg-brand-champagne/10">
                  <a
                    href={getWhatsAppShareLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-editorial btn-editorial--solid w-full flex items-center justify-center gap-3 py-4 text-center"
                  >
                    <MessageCircle className="w-4.5 h-4.5 stroke-[1.25]" />
                    <span>Partilhar com a HAXR</span>
                  </a>
                </div>
              ) : null}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
