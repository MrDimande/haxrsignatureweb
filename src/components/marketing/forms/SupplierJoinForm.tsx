"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { supplierJoinSchema } from "@/lib/email/email-schemas";
import { submitSupplierJoin } from "@/lib/marketing/submit";
import MarketingConsentField from "@/components/marketing/forms/MarketingConsentField";
import { SUPPLIER_CATEGORIES as MARKETPLACE_SUPPLIER_CATEGORIES } from "@/lib/vendors/marketplace";

type FormData = z.infer<typeof supplierJoinSchema>;

const inputClass =
  "w-full bg-transparent border-b border-brand-champagne/70 focus:border-brand-gold text-brand-text-dark font-sans text-sm py-3 px-0 outline-none placeholder:text-brand-text-dark/45 transition-colors duration-500";

const labelClass =
  "block font-mono text-[8px] tracking-[0.4em] uppercase text-brand-gold mb-3";

const SUPPLIER_CATEGORIES = MARKETPLACE_SUPPLIER_CATEGORIES.map(
  (category) => category.label,
);

export default function SupplierJoinForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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
    setSuccessMessage("");
    try {
      const result = await submitSupplierJoin(data);
      setSuccessMessage(
        result.message ??
          "Recebemos a candidatura. O perfil permanecerá privado durante a revisão.",
      );
      setStatus("success");
      reset();
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
        <p className="rounded-lg border border-brand-champagne/35 bg-brand-ivory/40 px-4 py-3 text-xs font-light leading-5 text-brand-text-dark/65">
          Para ligar esta candidatura à sua conta HAXR, crie a conta ou inicie sessão antes de enviar.
        </p>

        <div className="space-y-8">
          <div>
            <label htmlFor="supplier-name" className={labelClass}>
              Nome do fornecedor / empresa
            </label>
            <input
              id="supplier-name"
              type="text"
              placeholder="Nome do fornecedor / empresa"
              className={inputClass}
              aria-invalid={errors.supplierName ? true : undefined}
              aria-describedby={errors.supplierName ? "supplier-name-error" : undefined}
              {...register("supplierName")}
            />
            {errors.supplierName ? (
              <p id="supplier-name-error" className="text-gold/60 text-xs mt-2 font-sans" role="alert">
                {errors.supplierName.message}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="supplier-responsible-name" className={labelClass}>
              Nome do responsável
            </label>
            <input
              id="supplier-responsible-name"
              type="text"
              placeholder="Nome do responsável"
              autoComplete="name"
              className={inputClass}
              aria-invalid={errors.responsibleName ? true : undefined}
              aria-describedby={errors.responsibleName ? "supplier-responsible-name-error" : undefined}
              {...register("responsibleName")}
            />
            {errors.responsibleName ? (
              <p id="supplier-responsible-name-error" className="text-gold/60 text-xs mt-2 font-sans" role="alert">
                {errors.responsibleName.message}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label htmlFor="supplier-email" className={labelClass}>Email</label>
              <input
                id="supplier-email"
                type="email"
                placeholder="Email"
                autoComplete="email"
                className={inputClass}
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? "supplier-email-error" : undefined}
                {...register("email")}
              />
              {errors.email ? (
                <p id="supplier-email-error" className="text-gold/60 text-xs mt-2 font-sans" role="alert">{errors.email.message}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="supplier-phone" className={labelClass}>Telefone / WhatsApp</label>
              <input
                id="supplier-phone"
                type="tel"
                placeholder="Telefone / WhatsApp"
                autoComplete="tel"
                className={inputClass}
                aria-invalid={errors.phone ? true : undefined}
                aria-describedby={errors.phone ? "supplier-phone-error" : undefined}
                {...register("phone")}
              />
              {errors.phone ? (
                <p id="supplier-phone-error" className="text-gold/60 text-xs mt-2 font-sans" role="alert">{errors.phone.message}</p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label htmlFor="supplier-category" className={labelClass}>Categoria</label>
              <select
                id="supplier-category"
                className={`${inputClass} appearance-none cursor-pointer`}
                aria-invalid={errors.category ? true : undefined}
                aria-describedby={errors.category ? "supplier-category-error" : undefined}
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
                <p id="supplier-category-error" className="text-gold/60 text-xs mt-2 font-sans" role="alert">{errors.category.message}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="supplier-city" className={labelClass}>Cidade</label>
              <input
                id="supplier-city"
                type="text"
                placeholder="Cidade"
                className={inputClass}
                aria-invalid={errors.city ? true : undefined}
                aria-describedby={errors.city ? "supplier-city-error" : undefined}
                {...register("city")}
              />
              {errors.city ? (
                <p id="supplier-city-error" className="text-gold/60 text-xs mt-2 font-sans" role="alert">{errors.city.message}</p>
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
              aria-invalid={errors.portfolioUrl ? true : undefined}
              aria-describedby={errors.portfolioUrl ? "supplier-portfolio-error" : undefined}
              {...register("portfolioUrl")}
            />
            {errors.portfolioUrl ? (
              <p id="supplier-portfolio-error" className="text-gold/60 text-xs mt-2 font-sans" role="alert">
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
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-brand-gold/25 bg-brand-gold/5 p-4"
              role="status"
            >
              <p className="font-serif text-sm font-light italic leading-relaxed text-brand-gold">
                {successMessage}
              </p>
              <p className="mt-2 text-xs font-light leading-5 text-brand-text-dark/60">
                A candidatura não aparece no directório até ser aprovada.
              </p>
              <div className="mt-4 flex flex-wrap gap-4 font-mono text-[8px] font-bold uppercase tracking-[0.16em]">
                <Link href="/sign-up?from=%2Ffor-pros" className="text-brand-gold hover:underline">
                  Criar conta
                </Link>
                <Link href="/fornecedores" className="text-brand-text-dark/60 hover:text-brand-gold">
                  Ver directório
                </Link>
              </div>
            </motion.div>
          ) : null}
          {status === "error" ? (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="font-sans text-sm text-red-400/70"
              role="alert"
            >
              {errorMessage}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </form>
    </div>
  );
}
