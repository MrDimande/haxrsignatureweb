"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { NavGroup } from "@/lib/marketing/navigation";

export type NavVariant = "hero" | "dark";

type NavMegaMenuProps = {
  groups: readonly NavGroup[];
  variant: NavVariant;
};

export default function NavMegaMenu({ groups, variant }: NavMegaMenuProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isHero = variant === "hero";

  const triggerClass = (id: string) => {
    const open = openId === id;
    if (isHero) {
      return `inline-flex items-center gap-1 font-sans text-[11px] font-semibold tracking-[0.22em] uppercase transition-colors duration-500 cursor-pointer ${
        open ? "text-brand-gold-light" : "text-white/88 hover:text-white"
      }`;
    }
    return `inline-flex items-center gap-1 font-sans text-[11px] font-semibold tracking-[0.22em] uppercase transition-colors duration-500 cursor-pointer ${
      open ? "text-brand-gold-light" : "text-white/75 hover:text-white"
    }`;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpenId(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenId(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={containerRef} className="hidden lg:flex items-center gap-5 xl:gap-6">
      {groups.map((group) => (
        <div
          key={group.id}
          className="relative"
          onMouseEnter={() => setOpenId(group.id)}
          onMouseLeave={() => setOpenId(null)}
        >
          <button
            type="button"
            className={triggerClass(group.id)}
            aria-expanded={openId === group.id}
            aria-haspopup="true"
            onClick={() =>
              setOpenId((current) => (current === group.id ? null : group.id))
            }
          >
            {group.label}
            <ChevronDown
              className={`w-3 h-3 transition-transform duration-300 ${
                openId === group.id ? "rotate-180" : ""
              }`}
              strokeWidth={1.5}
            />
          </button>

          {openId === group.id ? (
            <div className="absolute left-0 top-full pt-3 z-50" role="menu">
              <div className="min-w-[16rem] rounded-sm border border-brand-champagne/50 bg-white shadow-[0_20px_56px_rgba(8,7,6,0.18)] py-2">
                {group.links.map((link) => (
                  <Link
                    key={`${group.id}-${link.href}-${link.label}`}
                    href={link.href}
                    role="menuitem"
                    className="block px-4 py-3 transition-colors duration-300 hover:bg-brand-champagne/25"
                    onClick={() => setOpenId(null)}
                  >
                    <span className="block font-serif text-sm font-medium text-brand-text-dark mb-0.5">
                      {link.label}
                    </span>
                    {link.description ? (
                      <span className="block font-sans text-xs text-brand-text-dark/70 leading-relaxed">
                        {link.description}
                      </span>
                    ) : null}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
