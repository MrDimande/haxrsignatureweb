"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export type AuthRole = "couple" | "vendor";

type AuthRoleToggleProps = {
  currentRole: AuthRole;
  onRoleChange?: (role: AuthRole) => void;
  vendorHref?: string;
  className?: string;
};

export default function AuthRoleToggle({
  currentRole,
  onRoleChange,
  vendorHref = "/for-pros",
  className = "",
}: AuthRoleToggleProps) {
  return (
    <div
      role="group"
      aria-label="Tipo de conta"
      className={`relative inline-flex items-center rounded-full bg-brand-champagne/25 p-1 border border-brand-champagne/40 backdrop-blur-xs ${className}`}
    >
      {/* Option 1: Casal (Active) */}
      <button
        type="button"
        onClick={() => onRoleChange?.("couple")}
        className={`relative z-10 rounded-full px-5 py-2 font-sans text-xs font-medium transition-colors duration-200 cursor-pointer ${
          currentRole === "couple"
            ? "text-brand-text-dark font-semibold shadow-xs"
            : "text-brand-text-dark/60 hover:text-brand-text-dark"
        }`}
      >
        {currentRole === "couple" && (
          <motion.div
            layoutId="auth-role-pill"
            className="absolute inset-0 z-[-1] rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-brand-champagne/50"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
        Sou Casal
      </button>

      {/* Option 2: Fornecedor (Links to vendor page or triggers change) */}
      {vendorHref ? (
        <Link
          href={vendorHref}
          className={`relative z-10 rounded-full px-5 py-2 font-sans text-xs font-medium transition-colors duration-200 ${
            currentRole === "vendor"
              ? "text-brand-text-dark font-semibold shadow-xs"
              : "text-brand-text-dark/60 hover:text-brand-text-dark"
          }`}
        >
          {currentRole === "vendor" && (
            <motion.div
              layoutId="auth-role-pill"
              className="absolute inset-0 z-[-1] rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-brand-champagne/50"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          Sou Fornecedor
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => onRoleChange?.("vendor")}
          className={`relative z-10 rounded-full px-5 py-2 font-sans text-xs font-medium transition-colors duration-200 cursor-pointer ${
            currentRole === "vendor"
              ? "text-brand-text-dark font-semibold shadow-xs"
              : "text-brand-text-dark/60 hover:text-brand-text-dark"
          }`}
        >
          {currentRole === "vendor" && (
            <motion.div
              layoutId="auth-role-pill"
              className="absolute inset-0 z-[-1] rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-brand-champagne/50"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          Sou Fornecedor
        </button>
      )}
    </div>
  );
}
