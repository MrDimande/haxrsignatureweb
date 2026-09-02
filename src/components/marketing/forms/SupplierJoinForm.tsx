"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  Crown,
  Mail,
  MapPin,
  Phone,
  Send,
  ShieldCheck,
  User,
} from "lucide-react";
import { supplierJoinSchema } from "@/lib/email/email-schemas";
import { submitSupplierJoin } from "@/lib/marketing/submit";
import MarketingConsentField from "@/components/marketing/forms/MarketingConsentField";
import { SUPPLIER_CATEGORIES as MARKETPLACE_SUPPLIER_CATEGORIES } from "@/lib/vendors/marketplace";
import { MOZAMBIQUE_LOCATIONS } from "@/lib/vendors/mozambique-locations";

type FormData = z.infer<typeof supplierJoinSchema>;

const inputClass =
  "w-full rounded-xl border border-brand-champagne/45 bg-[#faf8f5] px-4 py-3 text-sm text-brand-text-dark outline-none transition focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/15 placeholder:text-brand-text-dark/40";

const labelClass =
  "block font-mono text-[8px] font-bold tracking-[0.25em] uppercase text-brand-gold mb-2";

const SUPPLIER_CATEGORIES = MARKETPLACE_SUPPLIER_CATEGORIES.map(
  (category) => category.label,
);

export default function SupplierJoinForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
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
          "Recebemos a vossa candidatura. A equipa de curadoria HAXR analisará o portfólio com discrição e entrará em contacto.",
      );
      setStatus("success");
      reset();
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Não foi possível enviar a candidatura.",
      );
    }
  };

  return (
    <div className="rounded-3xl border border-brand-champagne/50 bg-white p-6 sm:p-10 shadow-2xl space-y-6">
      <div>
        <div className="flex items-center gap-2 text-brand-gold mb-1">
          <Crown className="h-4 w-4" />
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.3em]">
            Candidatura Oficial
          </span>
        </div>
        <h3 className="font-serif text-2xl sm:text-3xl font-light text-brand-text-dark">
          Junte o seu Atelier à Curadoria HAXR
        </h3>
        <p className="font-sans text-xs sm:text-sm font-light text-brand-text-dark/65 mt-2 leading-relaxed">
          Partilhe os dados do seu negócio. Apenas profissionais reais e avaliados pela equipa
          são publicados aos casais de Moçambique.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          className="absolute opacity-0 h-0 w-0 pointer-events-none"
          aria-hidden
          {...register("gotcha")}
        />

        <div className="space-y-5">
          {/* Nome do Fornecedor / Empresa */}
          <div>
            <label htmlFor="supplier-name" className={labelClass}>
              Nome do Atelier / Fornecedor / Empresa
            </label>
            <input
              id="supplier-name"
              type="text"
              placeholder="Ex: Evelyn Eventos / Atelier de Fotografia"
              className={inputClass}
              aria-invalid={errors.supplierName ? true : undefined}
              {...register("supplierName")}
            />
            {errors.supplierName && (
              <p className="text-red-500 text-xs mt-1.5 font-sans" role="alert">
                {errors.supplierName.message}
              </p>
            )}
          </div>

          {/* Nome do Responsável */}
          <div>
            <label htmlFor="supplier-responsible-name" className={labelClass}>
              Nome do Responsável / Director Artístico
            </label>
            <input
              id="supplier-responsible-name"
              type="text"
              placeholder="Ex: Dra. Ana Paula Silva"
              autoComplete="name"
              className={inputClass}
              aria-invalid={errors.responsibleName ? true : undefined}
              {...register("responsibleName")}
            />
            {errors.responsibleName && (
              <p className="text-red-500 text-xs mt-1.5 font-sans" role="alert">
                {errors.responsibleName.message}
              </p>
            )}
          </div>

          {/* Email e Telefone / WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="supplier-email" className={labelClass}>
                Email Profissional
              </label>
              <input
                id="supplier-email"
                type="email"
                placeholder="contacto@atelier.co.mz"
                autoComplete="email"
                className={inputClass}
                aria-invalid={errors.email ? true : undefined}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1.5 font-sans" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="supplier-phone" className={labelClass}>
                WhatsApp / Telefone Directo
              </label>
              <input
                id="supplier-phone"
                type="tel"
                placeholder="+258 84 / 87 ..."
                autoComplete="tel"
                className={inputClass}
                aria-invalid={errors.phone ? true : undefined}
                {...register("phone")}
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1.5 font-sans" role="alert">
                  {errors.phone.message}
                </p>
              )}
            </div>
          </div>

          {/* Categoria e Localização em Moçambique */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="supplier-category" className={labelClass}>
                Categoria Principal
              </label>
              <select
                id="supplier-category"
                className={`${inputClass} appearance-none cursor-pointer`}
                aria-invalid={errors.category ? true : undefined}
                {...register("category")}
              >
                <option value="">Selecionar categoria...</option>
                {SUPPLIER_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-red-500 text-xs mt-1.5 font-sans" role="alert">
                  {errors.category.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="supplier-city" className={labelClass}>
                Localização / Província / Distrito
              </label>
              <select
                id="supplier-city"
                className={`${inputClass} appearance-none cursor-pointer`}
                aria-invalid={errors.city ? true : undefined}
                {...register("city")}
              >
                <option value="">Selecionar localização...</option>
                {MOZAMBIQUE_LOCATIONS.map((group) => (
                  <optgroup key={group.province} label={group.province}>
                    {group.locations.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc} ({group.province})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {errors.city && (
                <p className="text-red-500 text-xs mt-1.5 font-sans" role="alert">
                  {errors.city.message}
                </p>
              )}
            </div>
          </div>

          {/* Portfólio / Instagram URL */}
          <div>
            <label htmlFor="supplier-portfolio" className={labelClass}>
              Link do Instagram ou Website Oficial
            </label>
            <input
              id="supplier-portfolio"
              type="url"
              placeholder="https://instagram.com/o_vosso_atelier"
              className={inputClass}
              aria-invalid={errors.portfolioUrl ? true : undefined}
              {...register("portfolioUrl")}
            />
            {errors.portfolioUrl && (
              <p className="text-red-500 text-xs mt-1.5 font-sans" role="alert">
                {errors.portfolioUrl.message}
              </p>
            )}
          </div>

          {/* Mensagem & Proposta de Valor */}
          <div>
            <label htmlFor="supplier-message" className={labelClass}>
              Apresentação & Especialidades{" "}
              <span className="text-brand-text-dark/40 font-normal lowercase">(opcional)</span>
            </label>
            <textarea
              id="supplier-message"
              placeholder="Conte-nos sobre a vossa trajetória, capacidade de atendimento e estilo estético em casamentos."
              rows={3}
              className={`${inputClass} resize-none`}
              {...register("message")}
            />
          </div>

          <MarketingConsentField
            register={register}
            error={errors.marketingConsent?.message}
          />
        </div>

        {/* Botão de Submissão */}
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl bg-brand-black hover:bg-brand-gold px-8 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-all shadow-md disabled:opacity-50 cursor-pointer"
        >
          <span>{status === "loading" ? "A enviar candidatura…" : "Submeter Candidatura VIP"}</span>
          <ArrowRight className="h-4 w-4" />
        </button>

        <AnimatePresence>
          {status === "success" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border border-emerald-500/30 bg-emerald-50/80 p-5 space-y-3"
              role="status"
            >
              <div className="flex items-center gap-2 text-emerald-800">
                <Check className="h-5 w-5" />
                <h4 className="font-serif text-base font-medium">Candidatura Recebida com Sucesso</h4>
              </div>
              <p className="text-xs font-light text-emerald-900/80 leading-relaxed">
                {successMessage}
              </p>
              <div className="pt-1 flex items-center gap-4 text-[9px] font-mono font-bold uppercase tracking-wider">
                <Link href="/fornecedores" className="text-brand-gold hover:text-brand-black">
                  Ver Directório Atual →
                </Link>
              </div>
            </motion.div>
          )}

          {status === "error" && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-3"
              role="alert"
            >
              {errorMessage}
            </motion.p>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
