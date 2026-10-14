"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  Filter,
  MapPin,
  QrCode,
  Search,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { EVENT_TYPE_LABELS } from "@/lib/admin/constants";
import type { BusinessId } from "@/lib/admin/types";
import type { EventListGuestStats, ManagedEvent } from "@/lib/events/types";

type ReceptionEventsClientProps = {
  events: ManagedEvent[];
  guestStats: Record<string, EventListGuestStats>;
  businesses: { id: BusinessId; name: string }[];
};

type FilterTab = "active" | "today" | "all" | "completed";

function formatEventDate(date: string | null): string {
  if (!date) return "Data por confirmar";
  return new Date(date).toLocaleDateString("pt-MZ", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Maputo",
  });
}

function isTodayMaputo(date: string | null): boolean {
  if (!date) return false;
  const eventDateStr = new Date(date).toLocaleDateString("en-CA", {
    timeZone: "Africa/Maputo",
  });
  const todayStr = new Date().toLocaleDateString("en-CA", {
    timeZone: "Africa/Maputo",
  });
  return eventDateStr === todayStr;
}

export default function ReceptionEventsClient({
  events,
  guestStats,
  businesses,
}: ReceptionEventsClientProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("active");

  const businessMap = useMemo(() => {
    return new Map(businesses.map((b) => [b.id, b.name]));
  }, [businesses]);

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((ev) => {
      if (activeTab === "active" && !ev.isActive) return false;
      if (activeTab === "completed" && ev.isActive) return false;
      if (activeTab === "today") {
        if (!isTodayMaputo(ev.date)) return false;
      }

      if (!q) return true;
      const nameMatch = ev.name.toLowerCase().includes(q);
      const clientMatch = ev.clientName?.toLowerCase().includes(q) ?? false;
      const locationMatch = ev.location.toLowerCase().includes(q);
      const typeMatch = EVENT_TYPE_LABELS[ev.type]?.toLowerCase().includes(q) ?? false;
      return nameMatch || clientMatch || locationMatch || typeMatch;
    });
  }, [events, search, activeTab]);

  const totals = useMemo(() => {
    let totalConfirmed = 0;
    let totalCheckedIn = 0;
    let totalGuests = 0;

    for (const ev of events) {
      if (!ev.isActive) continue;
      const st = guestStats[ev.id];
      if (st) {
        totalConfirmed += st.confirmed;
        totalCheckedIn += st.checkedIn;
        totalGuests += st.totalGuests;
      }
    }

    const rate = totalConfirmed > 0 ? Math.round((totalCheckedIn / totalConfirmed) * 100) : 0;
    return { totalConfirmed, totalCheckedIn, totalGuests, rate };
  }, [events, guestStats]);

  const todayCount = useMemo(() => {
    return events.filter((e) => isTodayMaputo(e.date)).length;
  }, [events]);

  return (
    <AdminShell
      title="Recepção & Check-in"
      subtitle="Portal de controlo de acessos, leitura óptica QR e validação em tempo real"
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/admin/events"
            className="admin-btn-secondary inline-flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Todos os Eventos
          </Link>
        </div>
      }
    >
      <div className="mb-8 rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-[#061e16] via-[#0a271e] to-[#051811] p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[9px] uppercase tracking-[0.25em]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Controlo Unificado de Entradas</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-light text-white">
              Selecione o Evento para Iniciar a Validação
            </h2>
            <p className="text-xs sm:text-sm text-[#EBE4D5]/70 max-w-2xl leading-relaxed">
              Abra o <strong className="text-emerald-400 font-medium">Scanner da Recepção</strong> com 1 clique para leitura óptica dos passes digitais ou aceda ao <strong className="text-admin-gold font-medium">Painel de Check-in</strong> para concierges e chegadas sem passe.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 text-center">
              <p className="font-mono text-[8px] uppercase tracking-[0.25em] text-grey-medium/60 mb-1">
                Eventos Hoje
              </p>
              <p className="font-mono text-xl text-emerald-400 font-medium">
                {todayCount}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 text-center">
              <p className="font-mono text-[8px] uppercase tracking-[0.25em] text-grey-medium/60 mb-1">
                Confirmados
              </p>
              <p className="font-mono text-xl text-white font-medium">
                {totals.totalConfirmed}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 text-center">
              <p className="font-mono text-[8px] uppercase tracking-[0.25em] text-grey-medium/60 mb-1">
                Presentes
              </p>
              <p className="font-mono text-xl text-admin-gold font-medium">
                {totals.totalCheckedIn}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 text-center">
              <p className="font-mono text-[8px] uppercase tracking-[0.25em] text-grey-medium/60 mb-1">
                Taxa Geral
              </p>
              <p className="font-mono text-xl text-emerald-300 font-medium">
                {totals.rate}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "active" as const, label: "Activos", count: events.filter((e) => e.isActive).length },
            { id: "today" as const, label: "Hoje", count: todayCount },
            { id: "all" as const, label: "Todos", count: events.length },
            { id: "completed" as const, label: "Concluídos", count: events.filter((e) => !e.isActive).length },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 border font-mono text-[9px] tracking-[0.2em] uppercase transition-colors rounded-sm ${
                  active
                    ? "border-emerald-500/50 bg-emerald-950/40 text-emerald-300"
                    : "border-grey-dark/80 text-grey/60 hover:text-white hover:border-grey-dark"
                }`}
              >
                {tab.label}
                <span className="ml-2 text-grey/40">{tab.count}</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-grey-medium/50 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por evento, cliente, local..."
            className="admin-input w-full pl-9 text-xs"
          />
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="admin-card p-12 text-center">
          <QrCode className="w-10 h-10 text-grey/30 mx-auto mb-3" />
          <p className="font-serif text-lg text-white/80">Nenhum evento encontrado</p>
          <p className="text-xs text-grey-medium/70 mt-1 max-w-sm mx-auto">
            {search
              ? "Tente ajustar o termo de pesquisa ou seleccionar outro separador."
              : "Não existem eventos registados nesta categoria."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredEvents.map((ev) => {
            const stats = guestStats[ev.id] ?? {
              totalGuests: 0,
              confirmed: 0,
              checkedIn: 0,
              unassigned: 0,
            };
            const isToday = isTodayMaputo(ev.date);
            const attendancePct =
              stats.confirmed > 0
                ? Math.min(100, Math.round((stats.checkedIn / stats.confirmed) * 100))
                : 0;

            return (
              <div
                key={ev.id}
                className={`rounded-2xl border p-5 transition-all duration-300 flex flex-col justify-between ${
                  isToday
                    ? "border-emerald-500/40 bg-gradient-to-br from-[#0c231b] via-[#091a14] to-[#040e0b] shadow-[0_0_25px_rgba(16,185,129,0.12)]"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      {isToday && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-[9px] uppercase tracking-wider font-semibold animate-pulse">
                          ● Hoje
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-grey-light font-mono text-[9px] uppercase tracking-wider">
                        {EVENT_TYPE_LABELS[ev.type] ?? ev.type}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-grey/60">
                      {businessMap.get(ev.businessId) ?? ev.businessId}
                    </span>
                  </div>

                  <h3 className="font-serif text-lg sm:text-xl text-white font-normal mb-2 leading-snug">
                    {ev.name}
                  </h3>

                  <div className="space-y-1 text-xs text-grey-medium/80 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-admin-gold shrink-0" />
                      <span>{formatEventDate(ev.date)}</span>
                    </div>
                    {ev.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-grey/50 shrink-0" />
                        <span className="line-clamp-1">{ev.location}</span>
                      </div>
                    )}
                    {ev.clientName && (
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-grey/50 shrink-0" />
                        <span className="line-clamp-1">Cliente: {ev.clientName}</span>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-white/5 bg-black/30 p-3.5 mb-5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-grey-medium/70 uppercase tracking-wider text-[9px]">
                        Presenças Confirmadas
                      </span>
                      <span className="text-white font-medium">
                        <strong className="text-emerald-400">{stats.checkedIn}</strong> / {stats.confirmed} ({attendancePct}%)
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${attendancePct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-grey/50 pt-1">
                      <span>{stats.totalGuests} convidados na lista</span>
                      {stats.unassigned > 0 ? (
                        <span className="text-amber-400/80">{stats.unassigned} sem mesa</span>
                      ) : (
                        <span className="text-emerald-400/80">Mesas atribuídas</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <Link
                    href={`/admin/events/${ev.id}/scanner`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 hover:border-emerald-400 text-emerald-200 text-xs font-mono uppercase tracking-wider font-semibold transition-all duration-200 shadow-md group"
                  >
                    <Camera className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span>Abrir Scanner</span>
                  </Link>

                  <Link
                    href={`/admin/events/${ev.id}?tab=checkin`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-admin-gold/30 hover:border-admin-gold/60 bg-admin-gold/5 hover:bg-admin-gold/10 text-admin-gold text-xs font-mono uppercase tracking-wider transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Painel Check-in</span>
                  </Link>

                  <Link
                    href={`/admin/events/${ev.id}`}
                    className="inline-flex items-center justify-center px-3 py-2.5 rounded-xl border border-white/10 hover:border-white/25 text-grey-medium hover:text-white text-xs font-mono uppercase tracking-wider transition-colors"
                    title="Ver página completa do evento"
                  >
                    Detalhes
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
