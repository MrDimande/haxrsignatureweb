"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { invitationComparison, type ComparisonLevel } from "@/lib/site-config";

function CellIcon({ level }: { level: ComparisonLevel }) {
  if (level === "included") {
    return <span className="text-brand-gold text-xs">✓</span>;
  }
  if (level === "optional") {
    return <span className="text-brand-text-dark/30 text-[10px]">○</span>;
  }
  return <span className="text-brand-text-dark/15 text-xs">—</span>;
}

export default function InvitationComparison() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-20 md:mb-28">
      <div className="flex justify-center mb-8">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="group inline-flex items-center gap-3 border border-brand-champagne/80 px-6 py-3 font-sans text-[10px] tracking-[0.3em] uppercase text-brand-text-dark/70 transition-all duration-500 hover:border-brand-gold/60 hover:text-brand-gold bg-white/70 shadow-sm rounded-full"
        >
          <span>{open ? "Ocultar comparativo" : "Ver comparativo dos pacotes"}</span>
          <span className="font-mono text-brand-gold/60 transition-transform duration-500 group-hover:text-brand-gold">
            {open ? "—" : "+"}
          </span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.25, 0, 0.1, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-2 pb-4">
              <p className="font-sans text-xs text-brand-text-dark/60 mb-8 flex flex-wrap justify-center gap-x-6 gap-y-2">
                <span>
                  <span className="text-brand-gold mr-2">✓</span> Incluído
                </span>
                <span>
                  <span className="text-brand-text-dark/30 mr-2">○</span> Opcional
                </span>
              </p>

              <div className="overflow-x-auto scrollbar-none site-bleed-x">
                <table className="w-full min-w-[640px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-brand-champagne/45">
                      <th className="py-4 pr-4 font-mono text-[8px] tracking-[0.4em] uppercase text-brand-text-dark/50 font-normal w-[40%]">
                        Serviço
                      </th>
                      <th className="py-4 px-3 font-mono text-[8px] tracking-[0.35em] uppercase text-brand-text-dark/50 font-normal text-center">
                        Essencial
                      </th>
                      <th className="py-4 px-3 font-mono text-[8px] tracking-[0.35em] uppercase text-brand-gold font-medium text-center border-x border-brand-gold/20 bg-brand-gold/[0.04]">
                        Signature
                      </th>
                      <th className="py-4 px-3 font-mono text-[8px] tracking-[0.35em] uppercase text-brand-text-dark/50 font-normal text-center">
                        Royal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitationComparison.map((row) => (
                      <tr
                        key={row.service}
                        className="border-b border-brand-champagne/45 hover:bg-brand-champagne/10 transition-colors group/row"
                      >
                        <td className="py-3.5 pr-4 font-sans text-xs text-brand-text-dark/70 group-hover/row:text-brand-text-dark transition-colors font-light">
                          {row.service}
                        </td>
                        <td className="py-3.5 text-center">
                          <CellIcon level={row.essencial} />
                        </td>
                        <td className="py-3.5 text-center border-x border-brand-gold/20 bg-brand-gold/[0.03]">
                          <CellIcon level={row.signature} />
                        </td>
                        <td className="py-3.5 text-center">
                          <CellIcon level={row.royal} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
