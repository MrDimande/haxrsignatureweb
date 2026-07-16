"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { InvitationCampaign } from "@/lib/campaigns/types";

type Props = {
  events: { id: string; name: string }[];
  selectedEventId: string;
  campaigns: InvitationCampaign[];
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  ready: "Pronta",
  scheduled: "Agendada",
  sending_manual: "Envio manual",
  sending_twilio: "Envio Twilio",
  paused: "Pausada",
  completed: "Concluída",
  cancelled: "Cancelada",
};

export default function CampaignsPageClient({
  events,
  selectedEventId,
  campaigns,
}: Props) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="admin-card p-4 flex flex-wrap items-center gap-3">
        <label className="font-mono text-[9px] tracking-[0.3em] uppercase text-grey/50">
          Evento
        </label>
        <select
          className="admin-input max-w-md"
          value={selectedEventId}
          onChange={(e) => {
            const id = e.target.value;
            router.push(
              id
                ? `/admin/invitations/campaigns?eventId=${id}`
                : "/admin/invitations/campaigns"
            );
          }}
        >
          <option value="">Seleccionar evento</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </select>
        <Link
          href="/admin/invitations"
          className="ml-auto text-[10px] font-mono uppercase tracking-[0.2em] text-grey/50 hover:text-admin-gold"
        >
          ← Convites
        </Link>
      </div>

      {!selectedEventId ? (
        <p className="text-sm text-grey/60">
          Seleccione um evento para listar campanhas.
        </p>
      ) : campaigns.length === 0 ? (
        <div className="admin-card p-8 text-center">
          <p className="text-sm text-grey/60 mb-4">
            Ainda não há campanhas neste evento.
          </p>
          <Link
            href={`/admin/invitations/campaigns/new?eventId=${selectedEventId}`}
            className="admin-btn-primary inline-flex"
          >
            Criar primeira campanha
          </Link>
        </div>
      ) : (
        <div className="admin-card overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-[9px] font-mono uppercase tracking-[0.25em] text-grey/40">
                <th className="px-4 py-3">Campanha</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Convite</th>
                <th className="px-4 py-3">Modo</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr
                  key={campaign.id}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/invitations/campaigns/${campaign.id}?eventId=${selectedEventId}`}
                      className="text-sm text-white/90 hover:text-admin-gold"
                    >
                      {campaign.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-grey/70">
                    {STATUS_LABELS[campaign.status] ?? campaign.status}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-grey/50">
                    {campaign.invitationRegistryKey || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-admin-gold/70">
                    {campaign.sendModeSnapshot}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
