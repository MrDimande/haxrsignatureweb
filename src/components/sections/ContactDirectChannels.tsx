"use client";

import {
  AtSign,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  type LucideIcon,
} from "lucide-react";
import { siteContact } from "@/lib/site-config";

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
        <span className="block font-mono text-[8px] tracking-[0.4em] uppercase text-brand-text-dark/50 mb-1.5">
          {item.label}
        </span>
        <span className="block font-sans text-sm text-brand-text-dark/85 group-hover:text-brand-gold transition-colors duration-500 leading-relaxed">
          {item.value}
        </span>
      </span>
    </a>
  );
}

export default function ContactDirectChannels() {
  const groups = buildContactChannels();

  return (
    <aside className="lg:sticky lg:top-28">
      <p className="font-mono text-[9px] tracking-[0.5em] uppercase text-brand-text-dark/70 mb-8">
        Contacto directo
      </p>
      <p className="font-serif text-sm font-light italic text-brand-text-dark/65 leading-relaxed mb-10">
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
