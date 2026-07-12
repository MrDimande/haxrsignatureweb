"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { supplierJoinSchema } from "@/lib/email/email-schemas";
import { submitSupplierJoin } from "@/lib/marketing/submit";
import MarketingConsentField from "@/components/marketing/forms/MarketingConsentField";

type FormData = z.infer<typeof supplierJoinSchema>;

const inputClass =
  "w-full bg-transparent border-b border-brand-champagne/70 focus:border-brand-gold text-brand-text-dark font-sans text-sm py-3 px-0 outline-none placeholder:text-brand-text-dark/45 transition-colors duration-500";

const labelClass =
  "block font-mono text-[8px] tracking-[0.4em] uppercase text-brand-gold mb-3";

const SUPPLIER_CATEGORIES = [
  "Fotografia",
  "Vídeo",
  "Flores & decoração",
  "Catering",
  "Música & DJ",
  "Local / venue",
  "Convites & papelaria",
  "Assessoria / planning",
  "Outro",
];

export default function SupplierJoinForm() {
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
    resolver: zodResolver(supplierJoinSchema),
    defaultValues: {
      gotcha: "",
      portfolioUrl: "",
      message: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setStatus("loading");
    setErrorMessage("");
    try {
      await submitSupplierJoin(data);
      setStatus("success");
      reset({ gotcha: "", portfolioUrl: "", message: "" });
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Não foi possível enviar a candidatura."
      );
    }
  };

  return (
    <div>
      <p className="font-mono text-[9px] tracking-[0.5em] uppercase text-grey mb-8">
        Candidatura de fornecedor
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          className="absolute opacity-0 h-0 w-0 pointer-events-none"
          aria-hidden
          {...register("gotcha")}
        />

        <p className="font-sans text-sm text-grey/80 leading-relaxed">
          Partilhe o perfil do vosso negócio. A equipa HAXR analisa cada candidatura
          com discrição e responde quando houver alinhamento com a nossa rede.
        </p>

        <div className="space-y-8">
          <div>
            <input
              type="text"
              placeholder="Nome do fornecedor / empresa"
              className={inputClass}
              {...register("supplierName")}
            />
            {errors.supplierName ? (
              <p className="text-gold/60 text-xs mt-2 font-sans">
                {errors.supplierName.message}
              </p>
            ) : null}
          </div>

          <div>
            <input
              type="text"
              placeholder="Nome do responsável"
              autoComplete="name"
              className={inputClass}
              {...register("responsibleName")}
            />
            {errors.responsibleName ? (
              <p className="text-gold/60 text-xs mt-2 font-sans">
                {errors.responsibleName.message}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <input
                type="email"
                placeholder="Email"
                autoComplete="email"
                className={inputClass}
                {...register("email")}
              />
              {errors.email ? (
                <p className="text-gold/60 text-xs mt-2 font-sans">{errors.email.message}</p>
              ) : null}
            </div>
            <div>
              <input
                type="tel"
                placeholder="Telefone / WhatsApp"
                autoComplete="tel"
                className={inputClass}
                {...register("phone")}
              />
              {errors.phone ? (
                <p className="text-gold/60 text-xs mt-2 font-sans">{errors.phone.message}</p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <select
                className={`${inputClass} appearance-none cursor-pointer`}
                {...register("category")}
              >
                <option value="" disabled className="bg-brand-ivory text-brand-text-dark">
                  Categoria
                </option>
                {SUPPLIER_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-brand-ivory text-brand-text-dark">
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category ? (
                <p className="text-gold/60 text-xs mt-2 font-sans">{errors.category.message}</p>
              ) : null}
            </div>
            <div>
              <input
                type="text"
                placeholder="Cidade"
                className={inputClass}
                {...register("city")}
              />
              {errors.city ? (
                <p className="text-gold/60 text-xs mt-2 font-sans">{errors.city.message}</p>
              ) : null}
            </div>
          </div>

          <div>
            <label htmlFor="supplier-portfolio" className={labelClass}>
              Portfólio / website{" "}
              <span className="text-grey/40 normal-case tracking-normal">(opcional)</span>
            </label>
            <input
              id="supplier-portfolio"
              type="url"
              placeholder="https://"
              className={inputClass}
              {...register("portfolioUrl")}
            />
            {errors.portfolioUrl ? (
              <p className="text-gold/60 text-xs mt-2 font-sans">
                {errors.portfolioUrl.message}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="supplier-message" className={labelClass}>
              Mensagem{" "}
              <span className="text-grey/40 normal-case tracking-normal">(opcional)</span>
            </label>
            <textarea
              id="supplier-message"
              placeholder="Conte-nos brevemente o vosso trabalho e tipo de eventos que acompanham."
              rows={4}
              className={`${inputClass} resize-none`}
              {...register("message")}
            />
          </div>

          <MarketingConsentField
            register={register}
            error={errors.marketingConsent?.message}
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="group inline-flex items-center gap-3 border border-gold-dim text-gold text-[11px] tracking-[0.3em] uppercase px-10 py-4 hover:border-gold hover:bg-gold/5 transition-all duration-700 disabled:opacity-50"
        >
          <span>{status === "loading" ? "A enviar…" : "Candidatar fornecedor"}</span>
          <span className="inline-block transition-transform duration-500 group-hover:translate-x-1">
            →
          </span>
        </button>

        <AnimatePresence>
          {status === "success" ? (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="font-serif text-sm font-light italic text-gold/75 leading-relaxed"
            >
              Recebemos a candidatura do fornecedor.
            </motion.p>
          ) : null}
          {status === "error" ? (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="font-sans text-sm text-red-400/70"
            >
              {errorMessage}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </form>
    </div>
  );
}
