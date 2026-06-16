"use client";

import { useMemo, useState } from "react";
import { GitMerge } from "lucide-react";
import { mergeGuestsAction } from "@/lib/events/actions/guests.actions";
import { buildDuplicateClusters } from "@/lib/events/deduplication";
import type { EventGuest } from "@/lib/events/types";

type GuestMergePanelProps = {
  eventId: string;
  guests: EventGuest[];
  onMerged: () => void;
};

export default function GuestMergePanel({
  eventId,
  guests,
  onMerged,
}: GuestMergePanelProps) {
  const clusters = useMemo(() => buildDuplicateClusters(guests), [guests]);
  const [primaryByCluster, setPrimaryByCluster] = useState<Record<string, string>>(
    {}
  );
  const [busyCluster, setBusyCluster] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!clusters.length) return null;

  function getPrimaryId(clusterKey: string, memberIds: string[]): string {
    return primaryByCluster[clusterKey] ?? memberIds[0] ?? "";
  }

  async function handleMerge(clusterKey: string, memberIds: string[]) {
    const primaryId = getPrimaryId(clusterKey, memberIds);
    const secondaryIds = memberIds.filter((id) => id !== primaryId);
    if (!secondaryIds.length) return;

    const primaryGuest = guests.find((g) => g.id === primaryId);
    const names = guests
      .filter((g) => memberIds.includes(g.id))
      .map((g) => g.name)
      .join(", ");

    if (
      !confirm(
        `Fundir estes registos num só?\n\n${names}\n\nPrincipal: ${primaryGuest?.name ?? "—"}`
      )
    ) {
      return;
    }

    setBusyCluster(clusterKey);
    setError(null);
    const result = await mergeGuestsAction(eventId, primaryId, secondaryIds);
    setBusyCluster(null);

    if (!result.success) {
      setError(result.error);
      return;
    }

    onMerged();
  }

  return (
    <section className="admin-card p-6 space-y-5 border-amber-500/15 bg-amber-500/5">
      <div>
        <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-amber-300/80 mb-2">
          Fundir duplicados
        </p>
        <p className="text-sm text-grey/55 leading-relaxed">
          Escolha o registo principal — email, telefone, lugar e estado mais
          avançado são preservados automaticamente.
        </p>
      </div>

      <div className="space-y-4">
        {clusters.map((cluster) => {
          const members = guests.filter((g) => cluster.guestIds.includes(g.id));
          const clusterKey = cluster.normalizedName;
          const primaryId = getPrimaryId(
            clusterKey,
            cluster.guestIds
          );

          return (
            <div
              key={clusterKey}
              className="border border-grey-dark/70 rounded-sm p-4 bg-black-soft/30"
            >
              <p className="font-serif text-lg text-white/90 mb-3">
                {cluster.displayName}
                <span className="ml-2 font-mono text-[8px] tracking-[0.2em] uppercase text-grey/45">
                  {members.length} registos
                </span>
              </p>

              <div className="space-y-2 mb-4">
                {members.map((guest) => (
                  <label
                    key={guest.id}
                    className="flex items-start gap-3 text-sm cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={`merge-primary-${clusterKey}`}
                      checked={primaryId === guest.id}
                      onChange={() =>
                        setPrimaryByCluster((prev) => ({
                          ...prev,
                          [clusterKey]: guest.id,
                        }))
                      }
                      className="mt-1"
                    />
                    <span>
                      <span className="text-white/85">{guest.name}</span>
                      <span className="block text-xs text-grey/50 mt-0.5">
                        {guest.email || guest.phone || "Sem contacto"}
                        {guest.seat
                          ? ` · ${guest.seat.tableName} · ${guest.seat.seatNumber}`
                          : " · Sem mesa"}
                      </span>
                    </span>
                  </label>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleMerge(clusterKey, cluster.guestIds)}
                disabled={busyCluster === clusterKey}
                className="admin-btn-secondary text-xs"
              >
                <GitMerge className="w-3.5 h-3.5" />
                {busyCluster === clusterKey
                  ? "A fundir..."
                  : "Fundir neste registo"}
              </button>
            </div>
          );
        })}
      </div>

      {error ? <p className="text-sm text-red-400/80">{error}</p> : null}
    </section>
  );
}
