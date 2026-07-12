"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Mail, CheckCircle } from "lucide-react";
import { newsletterSignupSchema } from "@/lib/email/email-schemas";
import { submitNewsletterSignup } from "@/lib/marketing/submit";
import MarketingConsentField from "@/components/marketing/forms/MarketingConsentField";

type FormData = z.infer<typeof newsletterSignupSchema>;

const inputClass =
  "w-full bg-white border border-brand-champagne/80 focus:border-brand-gold text-brand-text-dark font-sans text-xs py-3.5 pl-10 pr-4 rounded-xl outline-none placeholder:text-brand-text-dark/40 transition-colors duration-300";

type NewsletterSignupFormProps = {
  variant?: "footer" | "section";
  className?: string;
};

export default function NewsletterSignupForm({
  variant = "section",
  className = "",
}: NewsletterSignupFormProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(newsletterSignupSchema),
    defaultValues: { gotcha: "", marketingConsent: undefined },
  });

  const onSubmit = async (data: FormData) => {
    setStatus("loading");
    setErrorMessage("");
    try {
      await submitNewsletterSignup(data);
      setStatus("success");
      reset({ gotcha: "", marketingConsent: undefined });
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Não foi possível subscrever."
      );
    }
  };

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-white border border-brand-gold/30 p-5 rounded-2xl flex items-start gap-4 ${className}`}
      >
        <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
        <div>
          <p className="font-serif text-sm font-semibold text-brand-text-dark">
            Obrigado. O seu contacto foi registado com sucesso.
          </p>
          <p className="font-sans text-[11px] text-brand-text-dark/60 mt-1 leading-relaxed">
            Em breve receberá inspiração editorial da HAXR Signature.
          </p>
        </div>
      </motion.div>
    );
  }

  const isFooter = variant === "footer";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={`space-y-4 ${className}`}
      noValidate
    >
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        className="absolute opacity-0 h-0 w-0 pointer-events-none"
        aria-hidden
        {...register("gotcha")}
      />

      <div className={isFooter ? "space-y-3" : "flex flex-col sm:flex-row gap-3"}>
        {!isFooter ? (
          <input
            type="text"
            placeholder="Nome"
            autoComplete="name"
            className={`${inputClass} pl-4`}
            {...register("name")}
          />
        ) : (
          <input
            type="text"
            placeholder="Nome"
            autoComplete="name"
            className="w-full bg-black/40 border border-white/15 focus:border-gold/50 text-white font-sans text-xs py-3 px-4 outline-none placeholder:text-white/35"
            {...register("name")}
          />
        )}
        <div className="relative flex-1">
          <input
            type="email"
            placeholder="Email"
            autoComplete="email"
            className={
              isFooter
                ? "w-full bg-black/40 border border-white/15 focus:border-gold/50 text-white font-sans text-xs py-3 pl-10 pr-4 outline-none placeholder:text-white/35"
                : inputClass
            }
            {...register("email")}
          />
          <Mail
            className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
              isFooter ? "text-white/35" : "text-brand-text-dark/35"
            }`}
          />
        </div>
        {isFooter ? null : (
          <button
            type="submit"
            disabled={status === "loading"}
            className="btn-editorial btn-editorial--solid py-3.5 px-6 font-mono text-[9px] tracking-widest uppercase font-bold rounded-xl shrink-0 disabled:opacity-50"
          >
            {status === "loading" ? "A enviar…" : "Receber inspiração"}
          </button>
        )}
      </div>

      {(errors.name || errors.email) && (
        <p className="text-gold/60 text-xs font-sans">
          {errors.name?.message ?? errors.email?.message}
        </p>
      )}

      <MarketingConsentField
        register={register}
        error={errors.marketingConsent?.message}
      />

      {isFooter ? (
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full border border-gold/40 text-gold font-mono text-[9px] tracking-[0.28em] uppercase py-3 hover:bg-gold/10 transition-colors disabled:opacity-50"
        >
          {status === "loading" ? "A enviar…" : "Receber inspiração"}
        </button>
      ) : null}

      {status === "error" ? (
        <p className="font-sans text-sm text-red-400/80">{errorMessage}</p>
      ) : null}
    </form>
  );
}
