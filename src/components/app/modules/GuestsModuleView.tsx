"use client";

import type { GuestModuleData } from "@/lib/event-modules/types";
import { RSVP_STATUS_STYLES } from "@/lib/event-modules/presentation";
import {
  EventContextBar,
  ModuleEmptyState,
  ModuleHeader,
  ModulePanel,
  ModuleShell,
  ModuleStatGrid,
} from "@/components/app/modules/ModuleShell";

export default function GuestsModuleView({ data }: { data: GuestModuleData }) {
  const { summary, guests } = data;

  return (
    <ModuleShell>
      <ModuleHeader
        label="Gestão de Convidados"
        title="Convidados & Grupos"
        description="Consultar lista de convidados, grupos, contactos, acompanhantes, RSVP, mesas e preparação para check-in."
      />

      <EventContextBar context={data.context} />

      <ModuleStatGrid
        stats={[
          { label: "Total convidados", value: summary.total },
          { label: "Confirmados", value: summary.confirmed },
          { label: "Pendentes", value: summary.pending },
          { label: "Recusados", value: summary.declined },
          { label: "Acompanhantes", value: summary.plusOnes },
          {
            label: "Mesas atribuídas",
            value: `${summary.tablesAssigned}/${summary.tablesTotal}`,
          },
        ]}
      />

      <ModulePanel title="Lista de Convidados">
        {guests.length === 0 ? (
          <ModuleEmptyState
            title="Ainda não há convidados"
            description="Quando a equipa HAXR ou o vosso planeamento adicionar convidados, a lista aparecerá aqui com RSVP, mesas e check-in."
          />
        ) : null}
        <div className={`overflow-x-auto ${guests.length === 0 ? "hidden" : ""}`}>
          <table className="w-full min-w-[880px] text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                <th className="pb-3 pr-4 font-semibold">Nome</th>
                <th className="pb-3 pr-4 font-semibold">Grupo</th>
                <th className="pb-3 pr-4 font-semibold">Telefone</th>
                <th className="pb-3 pr-4 font-semibold">RSVP</th>
                <th className="pb-3 pr-4 font-semibold">Acompanhantes</th>
                <th className="pb-3 pr-4 font-semibold">Mesa</th>
                <th className="pb-3 pr-4 font-semibold">Convite</th>
                <th className="pb-3 pr-4 font-semibold">Check-in</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {guests.map((guest) => (
                <tr key={guest.id} className="text-zinc-300">
                  <td className="py-3 pr-4 font-medium text-white">{guest.name}</td>
                  <td className="py-3 pr-4">{guest.group}</td>
                  <td className="py-3 pr-4 font-mono text-[10px]">{guest.phone}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded-full border px-2 py-0.5 font-mono text-[8px] font-bold uppercase ${RSVP_STATUS_STYLES[guest.rsvpStatus]}`}
                    >
                      {guest.rsvpStatus.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-center">{guest.plusOnes}</td>
                  <td className="py-3 pr-4">{guest.table ?? "—"}</td>
                  <td className="py-3 pr-4">{guest.inviteSent ? "Sim" : "Não"}</td>
                  <td className="py-3 pr-4">{guest.checkedIn ? "Sim" : "Não"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.importSummary.lastImportLabel ? (
          <p className="mt-4 font-mono text-[9px] text-zinc-500">
            Última importação: {data.importSummary.lastImportLabel} ·{" "}
            {data.importSummary.importedCount} registos
          </p>
        ) : null}
      </ModulePanel>
    </ModuleShell>
  );
}
