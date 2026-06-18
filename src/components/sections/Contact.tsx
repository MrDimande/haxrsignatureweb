"use client";

import { useEffect, useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AtSign,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  type LucideIcon,
} from "lucide-react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import SplitText from "@/components/ui/SplitText";
import { submitContactForm } from "@/lib/contact/submit";
import { contactFormSchema } from "@/lib/contact/validation";
import { portfolioCopy, siteContact } from "@/lib/site-config";

type FormData = z.infer<typeof contactFormSchema>;

const inputClass =
  "w-full bg-transparent border-b border-grey/30 focus:border-gold/50 text-white font-sans text-sm py-3 px-0 outline-none placeholder:text-grey/40 transition-colors duration-500";

const labelClass =
  "block font-mono text-[8px] tracking-[0.4em] uppercase text-gold/50 mb-3";

const PROJECT_TYPES: Record<string, string> = {
  "convite-digital": "convite-digital",
  "identidade-visual": "identidade-visual",
  assessoria: "assessoria",
  coordenacao: "coordenacao",
  experiencias: "experiencias",
  privado: "privado",
  social: "social",
  corporativo: "corporativo",
  outro: "outro",
};

const PACKAGE_LABELS: Record<string, string> = {
  essencial: "Essencial",
  signature: "Signature",
  royal: "Royal",
};

const iconClass = "w-[17px] h-[17px] text-gold/75 stroke-[1.25]";

type ContactChannel = {
  icon: LucideIcon;
  label: string;
  value: string;
  href: string;
  external?: boolean;
};

function buildContactChannels(): { title: string; items: ContactChannel[] }[] {
  return [
    {
      title: "Redes",
      items: [
        {
          icon: AtSign,
          label: "Instagram",
          value: siteContact.instagram.handle,
          href: siteContact.instagram.href,
          external: true,
        },
      ],
    },
    {
      title: "Comunicação",
      items: [
        {
          icon: MessageCircle,
          label: "WhatsApp",
          value: siteContact.whatsapp.display,
          href: siteContact.whatsapp.href,
          external: true,
        },
        {
          icon: Mail,
          label: "Email",
          value: siteContact.email,
          href: `mailto:${siteContact.email}`,
        },
        ...siteContact.phones.map((phone) => ({
          icon: Phone,
          label: "Telefone",
          value: phone.display,
          href: `tel:${phone.tel}`,
        })),
      ],
    },
    {
      title: "Localização",
      items: [
        {
          icon: MapPin,
          label: "Escritório",
          value: siteContact.location,
          href: siteContact.mapsHref,
          external: true,
        },
      ],
    },
  ];
}

function ContactChannelRow({ item }: { item: ContactChannel }) {
  const Icon = item.icon;

  return (
    <a
      href={item.href}
      target={item.external ? "_blank" : undefined}
      rel={item.external ? "noopener noreferrer" : undefined}
      className="group flex items-start gap-5 py-5 border-b border-grey-dark/80 last:border-b-0 transition-colors duration-500 hover:border-gold-dim/40"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-grey-dark group-hover:border-gold-dim/50 transition-colors duration-500">
        <Icon className={iconClass} aria-hidden />
      </span>
      <span className="min-w-0 pt-1">
        <span className="block font-mono text-[8px] tracking-[0.4em] uppercase text-grey/50 mb-1.5">
          {item.label}
        </span>
        <span className="block font-sans text-sm text-white/70 group-hover:text-gold/80 transition-colors duration-500 leading-relaxed">
          {item.value}
        </span>
      </span>
    </a>
  );
}

function DirectContact() {
  const groups = buildContactChannels();

  return (
    <aside className="lg:sticky lg:top-28">
      <p className="font-mono text-[9px] tracking-[0.5em] uppercase text-grey mb-8">
        Contacto directo
      </p>
      <p className="font-serif text-sm font-light italic text-white/40 leading-relaxed mb-10">
        Prefere falar connosco antes de enviar o formulário? Estamos disponíveis
        pelos canais abaixo.
      </p>
      <div className="space-y-10">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="font-mono text-[8px] tracking-[0.45em] uppercase text-gold/40 mb-1 border-l border-gold-dim pl-4">
              {group.title}
            </p>
            <div>
              {group.items.map((item) => (
                <ContactChannelRow key={`${group.title}-${item.href}`} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

function ContactForm() {
  const searchParams = useSearchParams();
  const tipoParam = searchParams?.get("tipo");
  const pacoteParam = searchParams?.get("pacote");
  const defaultType =
    tipoParam && PROJECT_TYPES[tipoParam] ? PROJECT_TYPES[tipoParam] : "";
  const packageLabel = pacoteParam ? PACKAGE_LABELS[pacoteParam] : null;

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      projectType: defaultType,
      gotcha: "",
      marketingOptIn: false,
      intent: "",
      message: "",
    },
  });

  useEffect(() => {
    if (defaultType) {
      setValue("projectType", defaultType);
    }
  }, [defaultType, setValue]);

  useEffect(() => {
    if (defaultType || packageLabel) {
      document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [defaultType, packageLabel]);

  const onSubmit = async (data: FormData) => {
    setStatus("loading");

    try {
      await submitContactForm(data, { packageLabel });
      setStatus("success");
      reset({
        projectType: defaultType || "",
        gotcha: "",
        marketingOptIn: false,
        intent: "",
        message: "",
      });
    } catch {
      setStatus("error");
    }
  };

  const {
    formIntro,
    intentLabel,
    intentPlaceholder,
    messageLabel,
    messagePlaceholder,
    submitLabel,
    submitLoading,
    successMessage,
    errorMessage,
  } = portfolioCopy.contacto;

  return (
    <div>
      <p className="font-mono text-[9px] tracking-[0.5em] uppercase text-grey mb-8">
        Partilhar a sua história
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          className="absolute opacity-0 h-0 w-0 pointer-events-none"
          aria-hidden="true"
          title="Spam prevention"
          {...register("gotcha")}
        />

        <p className="font-sans text-sm text-grey/80 leading-relaxed">
          {formIntro}
        </p>

        {packageLabel && (
          <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-gold/50 border-l border-gold-dim pl-4">
            Pacote de interesse · {packageLabel}
          </p>
        )}

        <div className="space-y-8">
          <div>
            <label htmlFor="contact-name" className="sr-only">
              Nome
            </label>
            <input
              id="contact-name"
              type="text"
              placeholder="Nome"
              autoComplete="name"
              className={inputClass}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-gold/60 text-xs mt-2 font-sans">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="contact-email" className="sr-only">
              Email
            </label>
            <input
              id="contact-email"
              type="email"
              placeholder="Email"
              autoComplete="email"
              className={inputClass}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-gold/60 text-xs mt-2 font-sans">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="contact-type" className="sr-only">
              Tipo de projecto
            </label>
            <select
              id="contact-type"
              defaultValue={defaultType}
              className={`${inputClass} appearance-none cursor-pointer`}
              {...register("projectType")}
            >
              <option value="" disabled className="bg-black">
                Tipo de projecto
              </option>
              <option value="convite-digital" className="bg-black text-white">
                Convite digital
              </option>
              <option value="identidade-visual" className="bg-black text-white">
                Identidade visual
              </option>
              <option value="assessoria" className="bg-black text-white">
                Assessoria de eventos
              </option>
              <option value="coordenacao" className="bg-black text-white">
                Coordenação no dia
              </option>
              <option value="experiencias" className="bg-black text-white">
                Experiências personalizadas
              </option>
              <option value="privado" className="bg-black text-white">
                Privado
              </option>
              <option value="social" className="bg-black text-white">
                Social de alto perfil
              </option>
              <option value="corporativo" className="bg-black text-white">
                Corporativo estratégico
              </option>
              <option value="outro" className="bg-black text-white">
                Outro
              </option>
            </select>
            {errors.projectType && (
              <p className="text-gold/60 text-xs mt-2 font-sans">
                {errors.projectType.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="contact-intent" className={labelClass}>
              {intentLabel} <span className="text-gold/80">*</span>
            </label>
            <textarea
              id="contact-intent"
              placeholder={intentPlaceholder}
              rows={5}
              className={`${inputClass} resize-none`}
              {...register("intent")}
            />
            {errors.intent && (
              <p className="text-gold/60 text-xs mt-2 font-sans">
                {errors.intent.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="contact-message" className={labelClass}>
              {messageLabel}{" "}
              <span className="text-grey/40 normal-case tracking-normal">
                (opcional)
              </span>
            </label>
            <textarea
              id="contact-message"
              placeholder={messagePlaceholder}
              rows={3}
              className={`${inputClass} resize-none`}
              {...register("message")}
            />
            {errors.message && (
              <p className="text-gold/60 text-xs mt-2 font-sans">
                {errors.message.message}
              </p>
            )}
          </div>

          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0 accent-[#c9a962] bg-transparent border border-grey/40"
                {...register("marketingOptIn")}
              />
              <span className="font-sans text-xs text-grey/70 leading-relaxed group-hover:text-grey transition-colors">
                Quero receber inspiração editorial e novidades da HAXR
                Signature por email.
              </span>
            </label>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={status === "loading"}
            className="group inline-flex items-center gap-3 border border-gold-dim text-gold text-[11px] tracking-[0.3em] uppercase px-10 py-4 hover:border-gold hover:bg-gold/5 transition-all duration-700 disabled:opacity-50"
          >
            <span>{status === "loading" ? submitLoading : submitLabel}</span>
            <span className="inline-block transition-transform duration-500 group-hover:translate-x-1">
              →
            </span>
          </button>
        </div>

        <AnimatePresence>
          {status === "success" && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="font-serif text-sm font-light italic text-gold/75 leading-relaxed"
            >
              {successMessage}
            </motion.p>
          )}
          {status === "error" && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="font-sans text-sm text-red-400/70"
            >
              {errorMessage}
            </motion.p>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}

export default function Contact() {
  return (
    <section id="contacto" className="relative py-32 md:py-44">
      <div className="site-container">
        <div className="max-w-3xl mb-16 md:mb-20">
          <RevealOnScroll>
            <h2 className="section-label mb-10">Contacto</h2>
          </RevealOnScroll>

          <SplitText
            as="h3"
            className="font-serif text-2xl md:text-4xl font-light leading-relaxed text-white/90 mb-8"
          >
            {portfolioCopy.contacto.headline}
          </SplitText>

          <div className="space-y-4">
            {portfolioCopy.contacto.paragraphs.map((paragraph, i) => (
              <RevealOnScroll key={paragraph} delay={0.08 + i * 0.05}>
                <p
                  className={`font-sans text-sm leading-relaxed ${
                    i === portfolioCopy.contacto.paragraphs.length - 1
                      ? "font-serif text-lg font-light italic text-white/50"
                      : "text-grey"
                  }`}
                >
                  {paragraph}
                </p>
              </RevealOnScroll>
            ))}
          </div>
        </div>

        <RevealOnScroll delay={0.1}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20 items-start border-t border-grey-dark pt-16 md:pt-20">
            <div className="lg:col-span-7 lg:pr-8 lg:border-r lg:border-grey-dark/80">
              <Suspense fallback={null}>
                <ContactForm />
              </Suspense>
            </div>
            <div className="lg:col-span-5 lg:pl-4">
              <DirectContact />
            </div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll className="mt-24">
          <div className="line-gold" />
        </RevealOnScroll>
      </div>
    </section>
  );
}
