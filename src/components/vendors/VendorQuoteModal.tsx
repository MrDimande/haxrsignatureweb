"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Calendar,
  MessageCircle,
  Send,
  Users,
  X,
} from "lucide-react";
import type { PublicSupplierProfile } from "@/lib/vendors/marketplace";

type VendorQuoteModalProps = {
  supplier: PublicSupplierProfile;
  open: boolean;
  onClose: () => void;
};

const SERVICE_OPTIONS: Record<string, string[]> = {
  venues: ["Cerimónia + Recepção", "Apenas Recepção", "Almoço de Noivado", "Ensaio Fotográfico"],
  photographers: ["Cobertura Total (8h+)", "Cobertura Parcial (4h)", "Ensaio Pré-Casamento", "Álbum Impresso Premium"],
  videographers: ["Filme Cinematográfico Completo", "Highlights (3-5 min)", "Drone Aéreo", "Same Day Edit"],
  caterers: ["Menu Completo (Entrada + Prato + Sobremesa)", "Cocktail & Finger Food", "Estação de Bebidas", "Bolo de Casamento"],
  decor: ["Decoração Completa do Espaço", "Arranjos Florais (Mesas + Altar)", "Apenas Altar / Arco Cerimonial", "Iluminação Decorativa"],
  music: ["DJ + Som + Iluminação", "Banda ao Vivo", "Orquestra / Quarteto", "Karaoke + Animação"],
  beauty: ["Noiva (Maquilhagem + Cabelo)", "Noiva + Madrinhas", "Ensaio de Maquilhagem", "Tratamento Capilar Pré-Casamento"],
  stationery: ["Convites Impressos Premium", "Convites Digitais", "Kit Completo (Convite + Menu + Place Cards)", "Save the Date"],
  planning: ["Assessoria Completa (A-Z)", "Coordenação do Dia", "Consultoria de 3 Sessões", "Gestão de Fornecedores"],
  other: ["Serviço Personalizado", "Consultoria Inicial", "Pacote Completo"],
};

export default function VendorQuoteModal({
  supplier,
  open,
  onClose,
}: VendorQuoteModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [eventDate, setEventDate] = useState("");
  const [guestCount, setGuestCount] = useState("200");
  const [selectedService, setSelectedService] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const services = SERVICE_OPTIONS[supplier.category] ?? SERVICE_OPTIONS.other;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.showModal();
      document.body.style.overflow = "hidden";
    } else {
      dialog.close();
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  const buildWhatsAppMessage = () => {
    const lines = [
      `Olá ${supplier.name}!`,
      ``,
      `Encontrei o vosso perfil no directório da HAXR Signature e gostaria de solicitar uma proposta formal.`,
      ``,
      `📋 Detalhes do Evento:`,
      eventDate ? `📅 Data prevista: ${eventDate}` : "",
      guestCount ? `👥 Nº de convidados: ${guestCount}` : "",
      selectedService ? `🎯 Serviço pretendido: ${selectedService}` : "",
      message ? `\n💬 Nota adicional:\n${message}` : "",
      ``,
      `Agradeço desde já a vossa disponibilidade.`,
      `Proposta solicitada via HAXR Signature.`,
    ];
    return lines.filter(Boolean).join("\n");
  };

  const handleSubmit = () => {
    const whatsappMsg = buildWhatsAppMessage();
    const phoneNumber = (supplier.phone || "258870883428").replace(/\D/g, "");
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(whatsappMsg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setSent(true);
  };

  const handleClose = () => {
    setSent(false);
    setEventDate("");
    setGuestCount("200");
    setSelectedService("");
    setMessage("");
    onClose();
  };

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[90] m-0 h-full w-full max-h-full max-w-full bg-black/60 backdrop-blur-sm p-0 border-none outline-none open:flex items-center justify-center"
    >
      <div className="relative mx-auto w-full max-w-lg rounded-3xl border border-brand-champagne/50 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-champagne/30 px-6 py-5">
          <div>
            <p className="font-mono text-[8px] font-bold uppercase tracking-[0.25em] text-brand-gold">
              Solicitar Proposta Formal
            </p>
            <h2 className="mt-1 font-serif text-xl font-medium text-brand-text-dark">
              {supplier.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-champagne/40 bg-[#faf8f5] text-brand-text-dark/60 transition hover:bg-white hover:text-brand-text-dark cursor-pointer"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {sent ? (
          /* ── Estado de Sucesso ── */
          <div className="px-6 py-12 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Send className="h-7 w-7" />
            </div>
            <h3 className="font-serif text-2xl font-medium text-brand-text-dark">
              Proposta Enviada
            </h3>
            <p className="text-sm font-light text-brand-text-dark/65 leading-relaxed max-w-sm mx-auto">
              A sua mensagem foi aberta no WhatsApp. O fornecedor receberá os
              detalhes do seu evento e entrará em contacto brevemente.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-brand-black px-6 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-brand-gold cursor-pointer"
            >
              Fechar
            </button>
          </div>
        ) : (
          /* ── Formulário de Proposta ── */
          <div className="px-6 py-6 space-y-5">
            {/* Data do Evento */}
            <label className="block space-y-1.5">
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-brand-text-dark/70 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-brand-gold" />
                Data Prevista do Evento
              </span>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full rounded-xl border border-brand-champagne/45 bg-[#faf8f5] px-4 py-3 text-sm outline-none transition focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/15"
              />
            </label>

            {/* Número de Convidados */}
            <label className="block space-y-1.5">
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-brand-text-dark/70 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-brand-gold" />
                Número de Convidados
              </span>
              <input
                type="number"
                min="10"
                max="2000"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                placeholder="200"
                className="w-full rounded-xl border border-brand-champagne/45 bg-[#faf8f5] px-4 py-3 text-sm outline-none transition focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/15"
              />
            </label>

            {/* Tipo de Serviço */}
            <label className="block space-y-1.5">
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-brand-text-dark/70">
                Serviço Pretendido
              </span>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full appearance-none rounded-xl border border-brand-champagne/45 bg-[#faf8f5] px-4 py-3 text-sm outline-none transition focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/15"
              >
                <option value="">Selecionar serviço...</option>
                {services.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
            </label>

            {/* Mensagem Personalizada */}
            <label className="block space-y-1.5">
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-brand-text-dark/70">
                Mensagem Adicional (Opcional)
              </span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Ex: Gostaríamos de saber se têm disponibilidade para um casamento ao ar livre..."
                className="w-full resize-none rounded-xl border border-brand-champagne/45 bg-[#faf8f5] px-4 py-3 text-sm outline-none transition focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/15"
              />
            </label>

            {/* Botão de Envio */}
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-6 py-3.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white shadow-sm transition-colors cursor-pointer"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Enviar Proposta via WhatsApp</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>

            <p className="text-center font-mono text-[8px] text-brand-text-dark/40 uppercase tracking-wider">
              A proposta será enviada directamente para o WhatsApp do fornecedor
            </p>
          </div>
        )}
      </div>
    </dialog>
  );
}
