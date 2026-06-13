"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AdminInput } from "@/components/admin/AdminField";
import { assignSeatAction } from "@/lib/events/actions/guests.actions";
import {
  deleteSeatAction,
  generateTableSeatsAction,
} from "@/lib/events/actions/seats.actions";
import type { EventGuest, EventSeat } from "@/lib/events/types";

export { default as GuestManagement } from "@/components/events/GuestManagement";

type SeatAssignmentProps = {
  eventId: string;
  seats: EventSeat[];
  guests: EventGuest[];
  onChanged: () => void;
};

export default function SeatAssignment({
  eventId,
  seats,
  guests,
  onChanged,
}: SeatAssignmentProps) {
  const [tableName, setTableName] = useState("Mesa 1");
  const [seatCount, setSeatCount] = useState(8);
  const [creating, setCreating] = useState(false);

  const tables = [...new Set(seats.map((s) => s.tableName))].sort();

  async function handleGenerateTable() {
    setCreating(true);
    await generateTableSeatsAction(eventId, tableName.trim(), seatCount);
    setCreating(false);
    onChanged();
  }

  async function handleDeleteSeat(seatId: string) {
    if (!confirm("Eliminar este lugar?")) return;
    await deleteSeatAction(eventId, seatId);
    onChanged();
  }

  async function handleAssign(guestId: string, seatId: string) {
    await assignSeatAction(eventId, guestId, seatId || null);
    onChanged();
  }

  return (
    <div className="space-y-8">
      <section className="admin-card p-6 space-y-5">
        <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold">
          Criar mesa
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <AdminInput
            label="Nome da mesa"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
          />
          <AdminInput
            label="Número de lugares"
            type="number"
            min={1}
            max={30}
            value={seatCount}
            onChange={(e) => setSeatCount(Number(e.target.value))}
          />
          <button
            type="button"
            onClick={handleGenerateTable}
            disabled={creating || !tableName.trim()}
            className="admin-btn-primary h-[46px]"
          >
            <Plus className="w-4 h-4" />
            Gerar lugares
          </button>
        </div>
      </section>

      {tables.map((table) => {
        const tableSeats = seats.filter((s) => s.tableName === table);
        return (
          <section key={table} className="admin-card p-6 space-y-4">
            <h3 className="font-serif text-lg font-light text-white">{table}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {tableSeats.map((seat) => (
                <div
                  key={seat.id}
                  className="border border-grey-dark/80 rounded-sm p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-grey/60">
                      Lugar {seat.seatNumber}
                      {seat.label ? ` · ${seat.label}` : ""}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleDeleteSeat(seat.id)}
                      className="text-grey hover:text-red-400 p-1"
                      aria-label="Eliminar lugar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <select
                    value={seat.guestId ?? ""}
                    onChange={(e) => {
                      const guestId = e.target.value;
                      if (guestId) handleAssign(guestId, seat.id);
                      else if (seat.guestId) handleAssign(seat.guestId, "");
                    }}
                    className="w-full bg-black-soft border border-grey-dark/80 text-white text-sm px-3 py-2 rounded-sm"
                  >
                    <option value="">Livre</option>
                    {guests.map((guest) => (
                      <option key={guest.id} value={guest.id}>
                        {guest.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {!tables.length ? (
        <div className="admin-card p-10 text-center">
          <p className="text-sm text-grey/60">
            Ainda não há mesas. Crie a primeira mesa acima.
          </p>
        </div>
      ) : null}
    </div>
  );
}
