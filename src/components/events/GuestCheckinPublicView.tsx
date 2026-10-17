"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { CheckCircle2, ShieldCheck, Users } from "lucide-react";
import EventPublicShell from "@/components/events/EventPublicShell";
import { GUEST_STATUS_LABELS } from "@/lib/events/constants";
import type { CheckinLookup } from "@/lib/events/types";

type GuestCheckinPublicViewProps = {
  eventId: string;
  token: string;
  initial: CheckinLookup;
};

export default function GuestCheckinPublicView({
  eventId,
  token,
  initial,
}: GuestCheckinPublicViewProps) {
  const [lookup] = useState(initial);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const isCheckedIn =
    lookup.alreadyCheckedIn ||
    lookup.checkedIn ||
    lookup.guest?.status === "checked_in";

  useEffect(() => {
    if (typeof window !== "undefined" && token) {
      const passUrl = window.location.href;
      QRCode.toDataURL(passUrl, {
        width: 320,
        margin: 2,
        errorCorrectionLevel: "M",
        color: {
          dark: "#0A211A",
          light: "#FFFFFF",
        },
      })
        .then(setQrDataUrl)
        .catch((err) => {
          console.error("[GuestCheckinPublicView] QR generation failed:", err);
        });
    }
  }, [token]);

  if (!lookup.ok || !lookup.guest || !lookup.event) {
    return (
      <EventPublicShell title="Convite não encontrado">
        <div className="text-center py-4">
          <p className="font-serif text-xl text-white/85">Link inválido</p>
          <p className="text-sm text-grey/55 mt-3 leading-relaxed">
            Verifique o código ou dirija-se à recepção do evento.
          </p>
        </div>
      </EventPublicShell>
    );
  }

  const plusOnes = lookup.guest.plusOnes ?? 0;
  const partySize = 1 + plusOnes;

  return (
    <EventPublicShell
      title="Passe Digital"
      subtitle="Apresente este código à equipa na recepção para registar a sua entrada."
      eventName={lookup.event.name}
      eventType={lookup.event.type}
      eventDate={lookup.event.date}
      eventLocation={lookup.event.location}
      footer="Recepção · HAXR Signature"
    >
      <div className="space-y-6 text-center">
        <div>
          <div className="inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.25em] uppercase text-gold/80 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-gold" />
            <span>Passe Oficial de Entrada</span>
          </div>
          <p className="font-serif text-2xl font-light text-white/90">
            {lookup.guest.name}
          </p>
          <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-grey/45 mt-2">
            {GUEST_STATUS_LABELS[lookup.guest.status]}
          </p>
        </div>

        {/* Lotação autorizada / Grupo */}
        <div className="rounded-xl bg-white/[0.03] border border-white/10 px-4 py-3 text-center">
          <div className="inline-flex items-center gap-1.5 text-gold text-xs font-serif">
            <Users className="w-3.5 h-3.5" />
            <span>Lotação: {partySize} {partySize === 1 ? "Pessoa" : "Pessoas"}</span>
          </div>
          {plusOnes > 0 ? (
            <p className="text-[11px] text-grey/65 italic mt-1">
              1 Titular + {plusOnes} {plusOnes === 1 ? "Acompanhante" : "Acompanhantes"}
            </p>
          ) : (
            <p className="text-[11px] text-grey/50 italic mt-1">
              Passe individual intransmissível
            </p>
          )}
        </div>

        {/* Lugar atribuído */}
        {lookup.seat ? (
          <div className="py-4 border-y border-grey-dark/50">
            <p className="font-serif text-3xl font-light text-gold/90">
              {lookup.seat.tableName}
            </p>
            <p className="font-mono text-sm tracking-[0.25em] uppercase text-white/70 mt-2">
              Lugar {lookup.seat.label || lookup.seat.seatNumber}
            </p>
          </div>
        ) : (
          <p className="text-sm text-grey/55 italic">
            Lugar a confirmar na recepção
          </p>
        )}

        {/* Estado da entrada e QR Code */}
        {isCheckedIn ? (
          <div className="flex flex-col items-center gap-3 py-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/20">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            <p className="font-serif text-xl text-emerald-300">
              Entrada Registada
            </p>
            <p className="text-sm text-grey/55">Bem-vindo ao evento.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-3">
            {qrDataUrl ? (
              <div className="rounded-2xl bg-white p-3.5 shadow-lg">
                <img
                  src={qrDataUrl}
                  alt={`Código QR de entrada de ${lookup.guest.name}`}
                  className="w-48 h-48 rounded-lg object-contain"
                />
              </div>
            ) : (
              <div className="w-48 h-48 rounded-2xl border border-white/10 flex items-center justify-center text-xs text-grey/40">
                A carregar código QR...
              </div>
            )}
            <p className="text-xs text-grey/60 max-w-xs mt-2 leading-relaxed">
              Mostre este ecrã ao controlador da equipa HAXR à porta do evento.
            </p>
          </div>
        )}
      </div>
    </EventPublicShell>
  );
}
