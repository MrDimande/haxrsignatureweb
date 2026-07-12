"use client";

import type { RSVPModuleData } from "@/lib/event-modules/types";
import { RSVP_STATUS_STYLES } from "@/lib/event-modules/presentation";
import { formatPercentage } from "@/lib/formatters";
import {
  EventContextBar,
  ModuleHeader,
  ModulePanel,
  ModuleShell,
  ModuleStatGrid,
} from "@/components/app/modules/ModuleShell";

export default function RSVPModuleView({ data }: { data: RSVPModuleData }) {
  const { stats, settings, recentResponses } = data;

  return (
    <ModuleShell>
      <ModuleHeader
        label="RSVP Digital"
        title="Confirmações de Presença"
        description="Acompanhe respostas RSVP, taxa de resposta e configurações do convite digital."
        primaryAction={{ label: "Configurar RSVP", onClick: () => {} }}
        secondaryAction={{ label: "Copiar link", onClick: () => {} }}
      />

      <EventContextBar context={data.context} />

      <ModuleStatGrid
        stats={[
          { label: "RSVP activos", value: stats.activeInvites },
          { label: "Confirmados", value: stats.confirmed },
          { label: "Pendentes", value: stats.pending },
          { label: "Recusados", value: stats.declined },
          { label: "Taxa de resposta", value: formatPercentage(stats.responseRate) },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ModulePanel title="Link Público RSVP">
          <p className="mb-3 font-sans text-xs text-zinc-400">
            Partilhe este link com os convidados para confirmarem presença.
          </p>
          <div className="rounded-xl border border-brand-champagne/20 bg-black/30 p-4 font-mono text-[11px] text-brand-gold break-all">
            {settings.publicUrl}
          </div>
        </ModulePanel>

        <ModulePanel title="Configurações RSVP">
          <ul className="space-y-2 text-xs text-zinc-300">
            <li>Permitir acompanhante: {settings.allowPlusOne ? "Sim" : "Não"}</li>
            <li>Restrições alimentares: {settings.askDietaryRestrictions ? "Sim" : "Não"}</li>
            <li>Pedir telefone: {settings.askPhoneNumber ? "Sim" : "Não"}</li>
            <li>Data de encerramento: {settings.closingDate}</li>
          </ul>
          <p className="mt-4 rounded-xl border border-white/5 bg-white/5 p-3 text-xs font-light italic text-zinc-400">
            &ldquo;{settings.customConfirmationMessage}&rdquo;
          </p>
        </ModulePanel>
      </div>

      <ModulePanel title="Respostas Recentes">
        <div className="divide-y divide-white/5">
          {recentResponses.map((row) => (
            <div key={row.id} className="flex items-center justify-between gap-4 py-3 text-xs">
              <div>
                <p className="font-medium text-white">{row.guestName}</p>
                {row.dietaryNotes ? (
                  <p className="text-[10px] text-zinc-500">{row.dietaryNotes}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-zinc-500">+{row.plusOnes}</span>
                <span
                  className={`rounded-full border px-2 py-0.5 font-mono text-[8px] font-bold uppercase ${RSVP_STATUS_STYLES[row.status]}`}
                >
                  {row.status}
                </span>
                <span className="font-mono text-[9px] text-zinc-500">{row.respondedLabel}</span>
              </div>
            </div>
          ))}
        </div>
      </ModulePanel>
    </ModuleShell>
  );
}
