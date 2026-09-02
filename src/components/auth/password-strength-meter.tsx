"use client";

import { useMemo } from "react";
import { Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type PasswordStrengthScore = 0 | 1 | 2 | 3 | 4;

export interface PasswordStrengthResult {
  score: PasswordStrengthScore;
  label: string;
  colorClass: string;
  hasMinLength: boolean;
  hasLetterAndNumber: boolean;
}

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return {
      score: 0,
      label: "",
      colorClass: "bg-zinc-200",
      hasMinLength: false,
      hasLetterAndNumber: false,
    };
  }

  const hasMinLength = password.length >= 8;
  const hasLetters = /[a-zA-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSymbols = /[^a-zA-Z0-9]/.test(password);
  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);

  const hasLetterAndNumber = hasLetters && hasNumbers;

  let score: PasswordStrengthScore = 1;

  if (!hasMinLength) {
    score = 1;
  } else {
    let passedCriteria = 0;
    if (hasLetterAndNumber) passedCriteria++;
    if (hasMixedCase) passedCriteria++;
    if (hasSymbols) passedCriteria++;
    if (password.length >= 10) passedCriteria++;

    if (passedCriteria >= 3) {
      score = 4;
    } else if (passedCriteria >= 2) {
      score = 3;
    } else if (passedCriteria >= 1) {
      score = 2;
    } else {
      score = 1;
    }
  }

  const labelMap: Record<PasswordStrengthScore, { label: string; colorClass: string }> = {
    0: { label: "", colorClass: "bg-zinc-200" },
    1: { label: "Muito fraca", colorClass: "bg-red-500" },
    2: { label: "Razoável", colorClass: "bg-amber-500" },
    3: { label: "Boa", colorClass: "bg-brand-gold" },
    4: { label: "Excelente", colorClass: "bg-emerald-600" },
  };

  return {
    score,
    label: labelMap[score].label,
    colorClass: labelMap[score].colorClass,
    hasMinLength,
    hasLetterAndNumber,
  };
}

type PasswordStrengthMeterProps = {
  password: string;
  showRequirements?: boolean;
};

export default function PasswordStrengthMeter({
  password,
  showRequirements = true,
}: PasswordStrengthMeterProps) {
  const result = useMemo(() => evaluatePasswordStrength(password), [password]);

  if (!password) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-2.5 pt-1 overflow-hidden"
      >
        {/* 4-bar strength meter */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-sans text-brand-text-dark/50 font-light">
              Segurança da palavra-passe:
            </span>
            <span
              className={`font-mono text-[10px] font-semibold uppercase tracking-wider ${
                result.score === 1
                  ? "text-red-600"
                  : result.score === 2
                    ? "text-amber-600"
                    : result.score === 3
                      ? "text-brand-gold"
                      : "text-emerald-600"
              }`}
            >
              {result.label}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
            {[1, 2, 3, 4].map((step) => {
              const active = result.score >= step;
              return (
                <div
                  key={step}
                  className="h-full rounded-full bg-brand-champagne/30 overflow-hidden"
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: active ? "100%" : "0%" }}
                    transition={{ duration: 0.3 }}
                    className={`h-full ${active ? result.colorClass : ""}`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Live validation checklist */}
        {showRequirements && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
            <div className="flex items-center gap-1.5 text-[11px] font-sans">
              {result.hasMinLength ? (
                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" strokeWidth={2.5} />
              ) : (
                <X className="h-3.5 w-3.5 text-zinc-400 shrink-0" strokeWidth={2} />
              )}
              <span
                className={
                  result.hasMinLength
                    ? "text-brand-text-dark/80 font-medium"
                    : "text-brand-text-dark/45 font-light"
                }
              >
                Mínimo 8 caracteres
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-sans">
              {result.hasLetterAndNumber ? (
                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" strokeWidth={2.5} />
              ) : (
                <X className="h-3.5 w-3.5 text-zinc-400 shrink-0" strokeWidth={2} />
              )}
              <span
                className={
                  result.hasLetterAndNumber
                    ? "text-brand-text-dark/80 font-medium"
                    : "text-brand-text-dark/45 font-light"
                }
              >
                Letras e números
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
