"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { quoteRequestSchema } from "@/lib/email/email-schemas";
import { submitQuoteRequest } from "@/lib/marketing/submit";
import MarketingConsentField from "@/components/marketing/forms/MarketingConsentField";
import { portfolioCopy } from "@/lib/site-config";

type FormData = z.infer<typeof quoteRequestSchema>;

const inputClass =
  "w-full bg-transparent border-b border-brand-champagne/70 focus:border-brand-gold text-brand-text-dark font-sans text-sm py-3 px-0 outline-none placeholder:text-brand-text-dark/45 transition-colors duration-500";

const labelClass =
  "block font-mono text-[8px] tracking-[0.4em] uppercase text-brand-gold mb-3";

const PACKAGE_LABELS: Record<string, string> = {
  essencial: "Essencial",
  signature: "Signature",
  royal: "Royal",
};

export default function QuoteRequestForm() {
  const searchParams = useSearchParams();
  const tipoParam = searchParams?.get("tipo");
  const pacoteParam = searchParams?.get("pacote");
  const packageLabel = pacoteParam ? PACKAGE_LABELS[pacoteParam] : null;

  const defaultEventType =
    tipoParam === "corporativo"
      ? "corporativo"
      : tipoParam === "assessoria" || tipoParam === "convite-digital"
        ? tipoParam
        : "";

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(quoteRequestSchema),
    defaultValues: {
      gotcha: "",
      eventType: defaultEventType,
      eventDate: "",
      estimatedGuests: "",
      serviceInterest: "",
      message: "",
      packageLabel: packageLabel ?? null,
    },
  });

  useEffect(() => {
    if (defaultEventType) setValue("eventType", defaultEventType);
  }, [defaultEventType, setValue]);

  const onSubmit = async (data: FormData) => {
    setStatus("loading");
    setErrorMessage("");
    try {
      await submitQuoteRequest({ ...data, packageLabel: packageLabel ?? data.packageLabel });
      setStatus("success");
      reset({
        gotcha: "",
        eventType: defaultEventType,
        eventDate: "",
        estimatedGuests: "",
        serviceInterest: "",
        message: "",
        packageLabel: packageLabel ?? null,
      });
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Não foi possível enviar o pedido."
      );
    }
  };

  const { formIntro, messageLabel, messagePlaceholder } = portfolioCopy.contacto;

  return (
    <div>
      <p className="font-mono text-[9px] tracking-[0.5em] uppercase text-grey mb-8">
        Pedido de orçamento
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

        <p className="font-sans text-sm text-grey/80 leading-relaxed">{formIntro}</p>

        {packageLabel ? (
          <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-gold/50 border-l border-gold-dim pl-4">
            Pacote de interesse · {packageLabel}
          </p>
        ) : null}

        <div className="space-y-8">
          <div>
            <label htmlFor="quote-name" className="sr-only">
              Nome
            </label>
            <input
              id="quote-name"
              type="text"
              placeholder="Nome completo"
              autoComplete="name"
              className={inputClass}
              {...register("name")}
            />
            {errors.name ? (
              <p className="text-gold/60 text-xs mt-2 font-sans">{errors.name.message}</p>
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
                {...register("eventType")}
              >
                <option value="" disabled className="bg-brand-ivory text-brand-text-dark">
                  Tipo de evento
                </option>
                <option value="convite-digital">Casamento / convite digital</option>
                <option value="identidade-visual">Identidade visual</option>
                <option value="assessoria">Assessoria de eventos</option>
                <option value="coordenacao">Coordenação no dia</option>
                <option value="corporativo">Corporativo</option>
                <option value="privado">Celebração privada</option>
                <option value="social">Social de alto perfil</option>
                <option value="outro">Outro</option>
              </select>
              {errors.eventType ? (
                <p className="text-gold/60 text-xs mt-2 font-sans">{errors.eventType.message}</p>
              ) : null}
            </div>
            <div>
              <input
                type="text"
                placeholder="Data prevista (opcional)"
                className={inputClass}
                {...register("eventDate")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
            <div>
              <input
                type="text"
                placeholder="Convidados estimados (opcional)"
                className={inputClass}
                {...register("estimatedGuests")}
              />
            </div>
          </div>

          <div>
            <input
              type="text"
              placeholder="Serviço de maior interesse (opcional)"
              className={inputClass}
              {...register("serviceInterest")}
            />
          </div>

          <div>
            <label htmlFor="quote-message" className={labelClass}>
              {messageLabel}{" "}
              <span className="text-grey/40 normal-case tracking-normal">(opcional)</span>
            </label>
            <textarea
              id="quote-message"
              placeholder={messagePlaceholder}
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
          <span>{status === "loading" ? "A enviar…" : "Pedir orçamento"}</span>
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
              Recebemos o seu pedido. A equipa HAXR entrará em contacto brevemente.
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
