"use client";

import { useMemo, useState } from "react";
import { Plus, Users } from "lucide-react";
import {
  deleteGuestGroupAction,
  saveGuestGroupAction,
} from "@/lib/events/actions/guest-groups.actions";
import type { EventGuest, GuestGroup } from "@/lib/events/types";

type GuestGroupPanelProps = {
  eventId: string;
  groups: GuestGroup[];
  guests: EventGuest[];
  onChanged: () => void;
};

export default function GuestGroupPanel({
  eventId,
  groups,
  guests,
  onChanged,
}: GuestGroupPanelProps) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groupsWithCounts = useMemo(
    () =>
      groups.map((group) => ({
        ...group,
        members: guests.filter((guest) => guest.groupId === group.id),
      })),
    [groups, guests]
  );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    const result = await saveGuestGroupAction(eventId, {
      name: name.trim(),
      notes: "",
    });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setName("");
    onChanged();
  }

  async function handleDelete(groupId: string, groupName: string) {
    if (
      !confirm(
        `Eliminar o grupo «${groupName}»? Os convidados mantêm-se, apenas perdem a ligação ao grupo.`
      )
    ) {
      return;
    }
    setBusy(true);
    const result = await deleteGuestGroupAction(eventId, groupId);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    onChanged();
  }

  return (
    <section className="admin-card p-6 space-y-5">
      <div>
        <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold mb-2">
          Grupos de convidados
        </p>
        <p className="text-sm text-grey/55">
          Famílias, mesas de reserva ou grupos de acompanhantes ligados à mesma
          reserva.
        </p>
      </div>

      <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
        <label className="block min-w-[220px] flex-1">
          <span className="block font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50 mb-2">
            Novo grupo
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Família Dimande"
            className="admin-input w-full"
          />
        </label>
        <button type="submit" disabled={busy || !name.trim()} className="admin-btn-primary h-[46px]">
          <Plus className="w-4 h-4" />
          Criar grupo
        </button>
      </form>

      {error ? <p className="text-sm text-red-400/80">{error}</p> : null}

      {groupsWithCounts.length ? (
        <div className="space-y-3">
          {groupsWithCounts.map((group) => (
            <div
              key={group.id}
              className="border border-grey-dark/70 rounded-sm p-4 bg-black-soft/30"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-admin-gold/70" />
                    <p className="text-white/90">{group.name}</p>
                    <span className="font-mono text-[8px] tracking-[0.2em] uppercase text-grey/45">
                      {group.members.length} convidado
                      {group.members.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  {group.members.length ? (
                    <p className="text-sm text-grey/55 mt-2">
                      {group.members.map((member) => member.name).join(" · ")}
                    </p>
                  ) : (
                    <p className="text-sm text-grey/45 mt-2 italic">
                      Sem convidados atribuídos
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(group.id, group.name)}
                  className="text-xs text-grey hover:text-red-400"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-grey/50 italic">
          Ainda não existem grupos. Crie um grupo ou importe a coluna «Grupo» no
          CSV / Google Sheets.
        </p>
      )}
    </section>
  );
}
