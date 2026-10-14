"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import {
  Camera,
  CheckCircle2,
  Loader2,
  UserCheck,
  Copy,
  ExternalLink,
  MessageCircle,
  QrCode,
  Search,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { GUEST_STATUS_LABELS, GUEST_STATUS_STYLES } from "@/lib/events/constants";
import { buildCheckinUrl } from "@/lib/events/tokens";
import { checkInGuestAction } from "@/lib/events/actions/guests.actions";
import type { EventGuest, EventStats } from "@/lib/events/types";

type CheckInDashboardProps = {
  eventId?: string;
  guests: EventGuest[];
  stats: EventStats;
};

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-MZ", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Africa/Maputo",
  });
}

export default function CheckInDashboard({
  eventId,
  guests,
  stats,
}: CheckInDashboardProps) {
  const currentEventId = eventId || guests[0]?.eventId || "";

  // Pesquisa de convidados para recuperação do passe
  const [guestSearch, setGuestSearch] = useState("");
  const [selectedGuest, setSelectedGuest] = useState<EventGuest | null>(null);
  const [passQrDataUrl, setPassQrDataUrl] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const handleManualCheckIn = async (guest: EventGuest) => {
    if (guest.status === "checked_in") return;
    const confirmed = window.confirm(
      `Confirmar entrada manual de ${guest.name} (${1 + (guest.plusOnes ?? 0)} pax)?`
    );
    if (!confirmed) return;

    setCheckingInId(guest.id);
    setActionFeedback(null);
    try {
      const res = await checkInGuestAction(currentEventId, guest.id);
      if (res.success) {
        setActionFeedback(`Entrada confirmada: ${guest.name}`);
        setTimeout(() => setActionFeedback(null), 4000);
      } else {
        alert(res.error || "Erro ao registar entrada manual.");
      }
    } catch (err) {
      console.error("Check-in manual failed:", err);
      alert("Falha na ligação ao servidor.");
    } finally {
      setCheckingInId(null);
    }
  };

  // Geração do QR code para o convidado seleccionado no concierge
  useEffect(() => {
    if (selectedGuest && selectedGuest.qrToken) {
      const url = buildCheckinUrl(selectedGuest.eventId, selectedGuest.qrToken);
      QRCode.toDataURL(url, {
        width: 320,
        margin: 2,
        errorCorrectionLevel: "M",
        color: {
          dark: "#0A211A",
          light: "#FFFFFF",
        },
      })
        .then(setPassQrDataUrl)
        .catch((err) => {
          console.error("[CheckInDashboard] QR generation failed:", err);
        });
    } else {
      setPassQrDataUrl("");
    }
  }, [selectedGuest]);

  const recent = guests
    .filter((g) => g.checkedInAt)
    .sort(
      (a, b) =>
        new Date(b.checkedInAt!).getTime() - new Date(a.checkedInAt!).getTime()
    )
    .slice(0, 12);

  // Convidados confirmados para pesquisa e recuperação de passe
  const confirmedGuests = guests.filter(
    (g) => g.status === "confirmed" || g.status === "checked_in"
  );

  const filteredGuests = guestSearch.trim()
    ? confirmedGuests.filter((g) => {
        const query = guestSearch.toLowerCase().trim();
        return (
          g.name.toLowerCase().includes(query) ||
          (g.phone && g.phone.toLowerCase().includes(query)) ||
          (g.email && g.email.toLowerCase().includes(query))
        );
      })
    : confirmedGuests.slice(0, 10);

  const handleCopyPassUrl = (guest: EventGuest) => {
    const url = buildCheckinUrl(guest.eventId, guest.qrToken);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleOpenWhatsApp = (guest: EventGuest) => {
    const url = buildCheckinUrl(guest.eventId, guest.qrToken);
    const text = encodeURIComponent(
      `Olá ${guest.name}! Segue o vosso Passe Digital de Entrada oficial para o evento:\n${url}\n\nApresentem este passe na recepção à chegada.`
    );
    const phone = guest.phone ? guest.phone.replace(/\D/g, "") : "";
    const waUrl = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(waUrl, "_blank");
  };

  return (
    <div className="space-y-8">
      {/* Barra de acções de topo com botão de Scanner e Distinção de Modos */}
      <div className="space-y-4">
        {actionFeedback && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Painel 1: Leitura Óptica QR (Scanner) */}
          <div className="bg-gradient-to-br from-[#0c231b] to-[#040e0b] border border-emerald-500/40 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-[0.25em] text-emerald-400 mb-1">
                <Camera className="w-3.5 h-3.5" />
                <span>Modo Principal · Validação Óptica</span>
              </div>
              <h2 className="font-serif text-lg font-light text-white">
                Scanner da Recepção (Passe Digital QR)
              </h2>
              <p className="text-xs text-[#EBE4D5]/70 mt-1 leading-relaxed">
                Leitura instantânea do código QR através da câmara do telemóvel ou tablet. Valida autenticidade, mesa e previne duplicações.
              </p>
            </div>

            {currentEventId ? (
              <div className="mt-4 pt-3 border-t border-emerald-500/20">
                <Link
                  href={`/admin/events/${currentEventId}/scanner`}
                  className="inline-flex items-center justify-center gap-2 w-full px-5 py-2.5 rounded-xl bg-[#CBB994] text-[#0A211A] text-xs font-mono uppercase tracking-wider font-semibold hover:bg-[#DCD1B8] transition-colors shadow-md"
                >
                  <Camera className="w-4 h-4" />
                  Abrir Scanner da Recepção
                </Link>
              </div>
            ) : null}
          </div>

          {/* Painel 2: Modo de Entrada Manual (Concierge) */}
          <div className="bg-black-soft/90 border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-[0.25em] text-[#CBB994] mb-1">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Modo de Contingência · Entrada Manual</span>
              </div>
              <h2 className="font-serif text-lg font-light text-white">
                Registo Manual & Concierge
              </h2>
              <p className="text-xs text-grey-medium/70 mt-1 leading-relaxed">
                Para convidados sem telemóvel ou sem passe digital: utilize a pesquisa abaixo para localizar o nome do convidado e registar a entrada manual com 1 clique.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-grey-medium">
              <span>Pesquisa por nome / telefone</span>
              <span className="text-[#CBB994]">Acesso Directo Abaixo ↓</span>
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Convidados", value: stats.totalGuests },
          { label: "Confirmados", value: stats.confirmed },
          { label: "Check-in", value: stats.checkedIn },
          { label: "Lugares", value: `${stats.assignedSeats}/${stats.totalSeats}` },
        ].map((item) => (
          <div key={item.label} className="admin-stat-card">
            <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50 mb-2">
              {item.label}
            </p>
            <p className="font-serif text-2xl font-light text-white">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Concierge: Recuperação Segura de Passes para os 25 convidados existentes */}
      <section className="admin-card overflow-hidden">
        <div className="px-6 py-4 border-b border-grey-dark/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold">
              Recuperação & Emissão de Passe (Concierge)
            </h2>
            <p className="text-xs text-grey-medium/70 mt-0.5">
              Consulte e envie o passe oficial de qualquer convidado confirmado sem necessidade de novo RSVP.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-grey-medium/50 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={guestSearch}
              onChange={(e) => setGuestSearch(e.target.value)}
              placeholder="Pesquisar por nome ou contacto..."
              className="admin-input w-full pl-9 text-xs"
            />
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredGuests.map((guest) => {
              const partySize = 1 + (guest.plusOnes ?? 0);
              return (
                <div
                  key={guest.id}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col justify-between hover:border-gold/40 transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-serif text-base text-white/95 leading-tight">
                        {guest.name}
                      </p>
                      <span
                        className={`text-[8px] font-mono tracking-wider uppercase px-2 py-0.5 border rounded-sm shrink-0 ${GUEST_STATUS_STYLES[guest.status]}`}
                      >
                        {GUEST_STATUS_LABELS[guest.status]}
                      </span>
                    </div>

                    <p className="text-xs text-grey-medium/70">
                      {guest.phone || guest.email || "Sem contacto"}
                    </p>

                    <div className="inline-flex items-center gap-1.5 text-[11px] text-gold/80 mt-2">
                      <Users className="w-3 h-3" />
                      <span>{partySize} {partySize === 1 ? "lugar" : "lugares"}</span>
                      {guest.seat && (
                        <span className="text-grey-medium/50">· {guest.seat.tableName}</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                    {/* Botão de Check-in Manual Directo */}
                    {guest.status === "checked_in" ? (
                      <div className="w-full py-1.5 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono uppercase tracking-wider inline-flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Entrada Registada</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={checkingInId === guest.id}
                        onClick={() => handleManualCheckIn(guest)}
                        className="w-full py-1.5 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-200 text-xs font-mono uppercase tracking-wider font-semibold transition-colors inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {checkingInId === guest.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        <span>Check-in Manual</span>
                      </button>
                    )}

                    {/* Acções do Passe Digital QR */}
                    <div className="flex items-center gap-1.5 pt-1 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => setSelectedGuest(guest)}
                        className="flex-1 py-1 px-2.5 rounded-md bg-[#CBB994]/15 hover:bg-[#CBB994]/25 text-[#CBB994] text-[10px] font-mono uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-1"
                        title="Ver código QR do passe digital"
                      >
                        <QrCode className="w-3 h-3" />
                        Ver QR
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyPassUrl(guest)}
                        title="Copiar link do passe"
                        className="p-1 rounded-md border border-white/10 hover:border-gold/40 text-grey-medium/70 hover:text-white transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      {guest.phone && (
                        <button
                          type="button"
                          onClick={() => handleOpenWhatsApp(guest)}
                          title="Enviar via WhatsApp"
                          className="p-1 rounded-md border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 transition-colors"
                        >
                          <MessageCircle className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredGuests.length === 0 && (
            <p className="text-sm text-grey-medium/60 text-center py-8 italic">
              Nenhum convidado confirmado encontrado com esse filtro.
            </p>
          )}
        </div>
      </section>

      {/* Chegadas recentes */}
      <section className="admin-card overflow-hidden">
        <div className="px-6 py-4 border-b border-grey-dark/80">
          <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold">
            Chegadas recentes
          </h2>
        </div>
        {recent.length ? (
          <div className="divide-y divide-grey-dark/50">
            {recent.map((guest) => (
              <div
                key={guest.id}
                className="px-6 py-4 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-white/90">{guest.name}</p>
                  <p className="text-xs text-grey/50 mt-1">
                    {guest.seat
                      ? `${guest.seat.tableName} · Lugar ${guest.seat.seatNumber}`
                      : "Sem lugar atribuído"}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block text-[9px] font-mono tracking-[0.15em] uppercase px-2 py-1 border rounded-sm ${GUEST_STATUS_STYLES[guest.status]}`}
                  >
                    {GUEST_STATUS_LABELS[guest.status]}
                  </span>
                  <p className="text-[10px] text-grey/50 font-mono mt-2">
                    {formatTime(guest.checkedInAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-6 py-10 text-sm text-grey/60 text-center">
            Ainda não há check-ins registados.
          </p>
        )}
      </section>

      {/* Modal Concierge de Visualização de Passe */}
      {selectedGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-3xl border border-[#CBB994]/40 bg-[#0A211A] p-6 text-white shadow-2xl">
            <button
              type="button"
              onClick={() => setSelectedGuest(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-grey-medium hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 text-[8.5px] font-mono uppercase tracking-[0.3em] text-[#CBB994] mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Passe Digital Oficial</span>
              </div>
              <h3 className="font-serif text-2xl text-white">
                {selectedGuest.name}
              </h3>
              <p className="text-xs text-grey-medium/70 mt-1">
                Lotação: {1 + (selectedGuest.plusOnes ?? 0)} {(1 + (selectedGuest.plusOnes ?? 0)) === 1 ? "pessoa" : "pessoas"}
                {selectedGuest.plusOnes ? ` (1 titular + ${selectedGuest.plusOnes} acompanhantes)` : ""}
              </p>

              {/* QR Code */}
              <div className="my-5 flex justify-center">
                <div className="p-3 bg-white rounded-2xl shadow-lg">
                  {passQrDataUrl ? (
                    <img
                      src={passQrDataUrl}
                      alt={`Código QR de ${selectedGuest.name}`}
                      className="w-48 h-48 rounded-lg object-contain"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-xs text-black/60">
                      A gerar código...
                    </div>
                  )}
                </div>
              </div>

              {/* Link e acções */}
              <div className="space-y-2 mt-4">
                <button
                  type="button"
                  onClick={() => handleCopyPassUrl(selectedGuest)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#CBB994] text-[#0A211A] text-xs font-mono uppercase tracking-wider font-semibold hover:bg-[#DCD1B8] transition-colors inline-flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {copiedLink ? "Link Copiado!" : "Copiar Link do Passe"}
                </button>

                <div className="flex gap-2">
                  <a
                    href={buildCheckinUrl(selectedGuest.eventId, selectedGuest.qrToken)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl border border-white/20 text-xs font-mono uppercase tracking-wider hover:bg-white/10 transition-colors inline-flex items-center justify-center gap-1.5 text-white/90"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Abrir Passe
                  </a>
                  {selectedGuest.phone && (
                    <button
                      type="button"
                      onClick={() => handleOpenWhatsApp(selectedGuest)}
                      className="flex-1 py-2 px-3 rounded-xl border border-emerald-500/40 text-emerald-300 text-xs font-mono uppercase tracking-wider hover:bg-emerald-500/10 transition-colors inline-flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
