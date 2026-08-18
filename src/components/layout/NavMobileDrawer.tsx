"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Heart, MessageCircle, Trash2, X } from "lucide-react";
import { navAccountLink, type NavGroup, type NavLink } from "@/lib/marketing/navigation";

interface FavoriteItem {
  id: string;
  title: string;
  category: string;
  image: string;
}

type NavMobileDrawerProps = {
  open: boolean;
  onClose: () => void;
  groups: readonly NavGroup[];
  directLinks: readonly NavLink[];
  cta: NavLink;
  favorites: FavoriteItem[];
  onRemoveFavorite: (id: string) => void;
  whatsAppShareHref: string;
};

export default function NavMobileDrawer({
  open,
  onClose,
  groups,
  directLinks,
  cta,
  favorites,
  onRemoveFavorite,
  whatsAppShareHref,
}: NavMobileDrawerProps) {
  const pathname = usePathname();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);

  useEffect(() => {
    if (!open) {
      setExpandedId(null);
      setShowFavorites(false);
    }
  }, [open]);

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
            <div className="flex items-center justify-between px-5 h-[4.25rem] border-b border-gold-dim shrink-0">
              <p className="font-mono text-[9px] tracking-[0.35em] uppercase text-white/50">
                Menu
              </p>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-white/70 hover:text-white transition-colors cursor-pointer"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5" strokeWidth={1.25} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-2">
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
                        expandedId === group.id ? "rotate-180" : ""
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
                        <div className="pb-3 space-y-1 pl-1">
                          {group.links.map((link) => (
                            <Link
                              key={`${group.id}-${link.label}`}
                              href={link.href}
                              onClick={onClose}
                              className={`block py-2 font-serif text-sm font-light transition-colors ${
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

            <div className="p-5 border-t border-gold-dim shrink-0 flex flex-col gap-3">
              <Link
                href={navAccountLink.href}
                onClick={onClose}
                className="w-full text-center font-sans text-[10px] font-semibold tracking-[0.2em] uppercase text-white hover:text-brand-gold border border-white/20 py-3.5 hover:border-brand-gold hover:bg-white/5 transition-all duration-300 rounded-sm"
              >
                {navAccountLink.label}
              </Link>
              <Link
                href={cta.href}
                onClick={onClose}
                className="btn-editorial btn-editorial--solid w-full text-center py-3.5"
              >
                {cta.label}
              </Link>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
