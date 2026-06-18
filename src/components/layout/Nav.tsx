"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import BrandLogo from "@/components/ui/BrandLogo";
import { primaryNav } from "@/lib/marketing/navigation";

export default function Nav() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [visible, setVisible] = useState(!isHome);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isHome) {
      setVisible(true);
      return;
    }

    const hero = document.getElementById("hero");
    if (!hero) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0.1 }
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, [isHome, pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <motion.nav
        initial={false}
        animate={{
          y: visible ? 0 : -80,
          opacity: visible ? 1 : 0,
        }}
        transition={{ duration: 0.7, ease: [0.25, 0, 0.1, 1] }}
        className="fixed top-0 left-0 w-full z-50 pointer-events-none"
      >
        <div
          className={`bg-black/95 backdrop-blur-sm border-b border-gold-dim transition-opacity duration-700 ${visible ? "pointer-events-auto" : ""}`}
        >
          <div className="site-container flex items-center justify-between h-[4.25rem] md:h-[4.5rem]">
            <Link
              href="/"
              className="opacity-95 hover:opacity-100 transition-opacity duration-500 shrink-0 py-1"
              aria-label="HAXR Signature — início"
            >
              <BrandLogo variant="navbar" priority />
            </Link>

            <div className="hidden xl:flex items-center gap-6">
              {primaryNav.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    link.accent
                      ? "font-sans text-[10px] tracking-[0.28em] uppercase text-gold/60 hover:text-gold transition-colors duration-500 border border-gold-dim px-3 py-1.5"
                      : `font-sans text-[10px] tracking-[0.28em] uppercase transition-colors duration-500 ${
                          pathname === link.href
                            ? "text-white"
                            : "text-grey hover:text-white"
                        }`
                  }
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="xl:hidden flex flex-col gap-1.5 p-2 pointer-events-auto"
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menuOpen}
            >
              <span
                className={`block w-5 h-px bg-white transition-all duration-500 origin-center ${menuOpen ? "rotate-45 translate-y-[3.5px]" : ""}`}
              />
              <span
                className={`block w-5 h-px bg-white transition-all duration-500 ${menuOpen ? "opacity-0" : ""}`}
              />
              <span
                className={`block w-5 h-px bg-white transition-all duration-500 origin-center ${menuOpen ? "-rotate-45 -translate-y-[3.5px]" : ""}`}
              />
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-40 bg-black/98 flex flex-col items-center justify-center gap-8 xl:hidden overflow-y-auto py-24"
          >
            {primaryNav.map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.5 }}
              >
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={
                    link.accent
                      ? "font-sans text-sm tracking-[0.35em] uppercase text-gold/60 hover:text-gold transition-colors duration-500"
                      : "font-sans text-sm tracking-[0.35em] uppercase text-grey hover:text-white transition-colors duration-500"
                  }
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
