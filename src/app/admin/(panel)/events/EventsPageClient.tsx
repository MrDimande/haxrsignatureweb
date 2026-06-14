"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Plus } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import DataTable from "@/components/admin/DataTable";
import EventForm from "@/components/events/EventForm";
import { EVENT_TYPE_LABELS } from "@/lib/admin/constants";
import {
  EVENT_PIPELINE_LABELS,
  groupEventsByPipeline,
  type EventPipelineStatus,
} from "@/lib/events/pipeline";
import type { BusinessId, Client } from "@/lib/admin/types";
import type { EventListGuestStats, ManagedEvent } from "@/lib/events/types";

type EventsPageClientProps = {
  initialEvents: ManagedEvent[];
  guestStats: Record<string, EventListGuestStats>;
  businesses: { id: BusinessId; name: string }[];
  clients: Client[];
  defaultClientId?: string | null;
  openCreate?: boolean;
};

type TabFilter = EventPipelineStatus | "all";

const TABS: { id: TabFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "planning", label: EVENT_PIPELINE_LABELS.planning },
  { id: "active", label: EVENT_PIPELINE_LABELS.active },
  { id: "completed", label: EVENT_PIPELINE_LABELS.completed },
];

function formatDate(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("pt-MZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Maputo",
  });
}

export default function EventsPageClient({
  initialEvents,
  guestStats,
  businesses,
  clients,
  defaultClientId = null,
  openCreate = false,
}: EventsPageClientProps) {
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);
  const [creating, setCreating] = useState(openCreate);
  const [activeTab, setActiveTab] = useState<TabFilter>("all");

  const groups = useMemo(() => groupEventsByPipeline(events), [events]);

  const filteredEvents =
    activeTab === "all" ? events.filter((e) => e.isActive) : groups[activeTab];

  const tabCounts: Record<TabFilter, number> = {
    all: events.filter((e) => e.isActive).length,
    planning: groups.planning.length,
    active: groups.active.length,
    completed: groups.completed.length,
  };

  const columns = [
    {
      key: "name",
      header: "Evento",
      render: (row: ManagedEvent) => (
        <div>
          <p className="text-white/90">{row.name}</p>
          <p className="text-[10px] font-mono text-grey/40 mt-0.5">
            {EVENT_TYPE_LABELS[row.type]}
          </p>
        </div>
      ),
    },
    {
      key: "date",
      header: "Data",
      render: (row: ManagedEvent) => (
        <span className="text-sm text-grey font-mono">{formatDate(row.date)}</span>
      ),
    },
    {
      key: "client",
      header: "Cliente",
      render: (row: ManagedEvent) => (
        <span className="text-sm text-grey/70">
          {row.clientName || "—"}
        </span>
      ),
    },
    {
      key: "location",
      header: "Local",
      render: (row: ManagedEvent) => (
        <span className="text-sm text-grey/70 line-clamp-1">
          {row.location || "—"}
        </span>
      ),
    },
    {
      key: "guests",
      header: "Convidados",
      render: (row: ManagedEvent) => {
        const stats = guestStats[row.id];
        if (!stats || stats.totalGuests === 0) {
          return <span className="text-sm text-grey/45">—</span>;
        }

        return (
          <div className="space-y-1">
            <p className="text-sm text-white/80 font-mono">
              {stats.confirmed} confirmados · {stats.checkedIn} presentes
            </p>
            {stats.unassigned > 0 ? (
              <p className="text-[10px] font-mono tracking-[0.12em] uppercase text-amber-300/70">
                {stats.unassigned} sem lugar
              </p>
            ) : (
              <p className="text-[10px] font-mono text-grey/40">
                {stats.totalGuests} convidados
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "business",
      header: "Negócio",
      render: (row: ManagedEvent) => {
        const business = businesses.find((b) => b.id === row.businessId);
        return <span className="text-sm text-grey">{business?.name ?? row.businessId}</span>;
      },
    },
  ];

  return (
    <AdminShell
      title="Eventos"
      subtitle="Gestão de convidados, lugares e check-in"
      actions={
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="admin-btn-primary"
        >
          <Plus className="w-4 h-4" />
          Novo evento
        </button>
      }
    >
      {creating ? (
        <section className="admin-card p-6 mb-8">
          <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold mb-6">
            Novo evento
          </h2>
          <EventForm
            businesses={businesses}
            clients={clients}
            defaultClientId={defaultClientId}
            onSaved={(event) => {
              setEvents((prev) => [event, ...prev]);
              setCreating(false);
              router.push(`/admin/events/${event.id}`);
            }}
            onCancel={() => setCreating(false)}
          />
        </section>
      ) : null}

      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 border font-mono text-[9px] tracking-[0.2em] uppercase transition-colors ${
                active
                  ? "border-admin-gold/40 bg-admin-gold/10 text-admin-gold"
                  : "border-grey-dark/80 text-grey/55 hover:text-white hover:border-grey-dark"
              }`}
            >
              {tab.label}
              <span className="ml-2 text-grey/40">{tabCounts[tab.id]}</span>
            </button>
          );
        })}
      </div>

      <DataTable
        columns={columns}
        data={filteredEvents}
        keyExtractor={(row) => row.id}
        rowHref={(row) => `/admin/events/${row.id}`}
        emptyMessage={
          activeTab === "all"
            ? "Ainda não há eventos. Crie o primeiro evento."
            : `Nenhum evento em «${EVENT_PIPELINE_LABELS[activeTab as EventPipelineStatus]}».`
        }
      />

      {filteredEvents.length > 0 ? (
        <p className="mt-6 text-xs text-grey/45 font-mono tracking-[0.15em] uppercase flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5" />
          Clique num evento para gerir convidados e lugares
        </p>
      ) : null}
    </AdminShell>
  );
}
