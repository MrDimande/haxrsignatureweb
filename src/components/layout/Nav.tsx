"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BrandLogo from "@/components/ui/BrandLogo";

const links = [
  { href: "#filosofia", label: "Filosofia" },
  { href: "#universo", label: "Universo" },
  { href: "#convites", label: "Convites" },
  { href: "#experiencias", label: "Experiências" },
  { href: "#metodo", label: "Método" },
  { href: "#gestao", label: "Gestão" },
  { href: "#arquivo", label: "Arquivo" },
  { href: "#contacto", label: "Contacto", accent: true },
];

export default function Nav() {
  const [visible, setVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0.1 }
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

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
          <div className="site-container flex items-center justify-between h-16">
            <a
              href="#hero"
              className="opacity-90 hover:opacity-100 transition-opacity duration-500 shrink-0"
              aria-label="HAXR Signature — início"
            >
              <BrandLogo variant="navbar" priority />
            </a>

            <div className="hidden lg:flex items-center gap-8">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={
                    link.accent
                      ? "font-sans text-[11px] tracking-[0.3em] uppercase text-gold/60 hover:text-gold transition-colors duration-500 border border-gold-dim px-4 py-1.5"
                      : "font-sans text-[11px] tracking-[0.3em] uppercase text-grey hover:text-white transition-colors duration-500"
                  }
                >
                  {link.label}
                </a>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="lg:hidden flex flex-col gap-1.5 p-2 pointer-events-auto"
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
            className="fixed inset-0 z-40 bg-black/98 flex flex-col items-center justify-center gap-10 lg:hidden"
          >
            {links.map((link, i) => (
              <motion.a
                key={link.href}
                href={link.href}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.5 }}
                onClick={() => setMenuOpen(false)}
                className={
                  link.accent
                    ? "font-sans text-sm tracking-[0.4em] uppercase text-gold/60 hover:text-gold transition-colors duration-500"
                    : "font-sans text-sm tracking-[0.4em] uppercase text-grey hover:text-white transition-colors duration-500"
                }
              >
                {link.label}
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
