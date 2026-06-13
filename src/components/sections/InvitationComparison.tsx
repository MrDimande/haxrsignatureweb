"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { invitationComparison, type ComparisonLevel } from "@/lib/site-config";

function CellIcon({ level }: { level: ComparisonLevel }) {
  if (level === "included") {
    return <span className="text-gold/80 text-xs">✓</span>;
  }
  if (level === "optional") {
    return <span className="text-grey/40 text-[10px]">○</span>;
  }
  return <span className="text-grey/20 text-xs">—</span>;
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
          className="group inline-flex items-center gap-3 border border-grey-dark px-6 py-3 font-sans text-[10px] tracking-[0.3em] uppercase text-grey/70 transition-all duration-500 hover:border-gold-dim hover:text-gold/80"
        >
          <span>{open ? "Ocultar comparativo" : "Ver comparativo dos pacotes"}</span>
          <span className="font-mono text-gold/40 transition-transform duration-500 group-hover:text-gold/70">
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
              <p className="font-sans text-xs text-grey/60 mb-8 flex flex-wrap justify-center gap-x-6 gap-y-2">
                <span>
                  <span className="text-gold/70 mr-2">✓</span> Incluído
                </span>
                <span>
                  <span className="text-grey/50 mr-2">○</span> Opcional
                </span>
              </p>

              <div className="overflow-x-auto scrollbar-none site-bleed-x">
                <table className="w-full min-w-[640px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-grey-dark">
                      <th className="py-4 pr-4 font-mono text-[8px] tracking-[0.4em] uppercase text-grey/50 font-normal w-[40%]">
                        Serviço
                      </th>
                      <th className="py-4 px-3 font-mono text-[8px] tracking-[0.35em] uppercase text-grey/50 font-normal text-center">
                        Essencial
                      </th>
                      <th className="py-4 px-3 font-mono text-[8px] tracking-[0.35em] uppercase text-gold/60 font-normal text-center border-x border-gold-dim/30 bg-gold/[0.03]">
                        Signature
                      </th>
                      <th className="py-4 px-3 font-mono text-[8px] tracking-[0.35em] uppercase text-grey/50 font-normal text-center">
                        Royal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitationComparison.map((row) => (
                      <tr
                        key={row.service}
                        className="border-b border-grey-dark/60 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-3.5 pr-4 font-sans text-xs text-white/45">
                          {row.service}
                        </td>
                        <td className="py-3.5 text-center">
                          <CellIcon level={row.essencial} />
                        </td>
                        <td className="py-3.5 text-center border-x border-gold-dim/20 bg-gold/[0.02]">
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
