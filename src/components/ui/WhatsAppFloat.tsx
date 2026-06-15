"use client";

import { MessageCircle } from "lucide-react";
import { siteConfig, siteContact } from "@/lib/site-config";

export default function WhatsAppFloat() {
  const href = siteConfig.contact.whatsappProposalUrl;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com a HAXR Signature no WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full border border-gold/35 bg-black/90 px-4 py-3 text-gold shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-all duration-500 hover:border-gold hover:bg-gold/10 hover:shadow-[0_12px_40px_rgba(201,169,110,0.12)] group"
    >
      <span className="hidden sm:inline font-mono text-[9px] tracking-[0.28em] uppercase text-gold/80 group-hover:text-gold">
        WhatsApp
      </span>
      <MessageCircle className="w-5 h-5 shrink-0" strokeWidth={1.25} />
    </a>
  );
}
