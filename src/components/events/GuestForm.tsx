"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminInput, AdminSelect } from "@/components/admin/AdminField";
import { CLIENT_TYPE_LABELS } from "@/lib/admin/constants";
import { GUEST_LABEL_LABELS, GUEST_STATUS_LABELS, GUEST_STATUSES, GUEST_LABELS } from "@/lib/events/constants";
import { saveGuestAction } from "@/lib/events/actions/guests.actions";
import type { ClientType } from "@/lib/admin/types";
import type { EventGuest, EventSeat, GuestFormData, GuestLabel, GuestStatus } from "@/lib/events/types";

const schema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  clientType: z.enum(["individual", "company"]),
  status: z.enum(["invited", "confirmed", "checked_in", "declined"]),
  seatId: z.string().optional(),
  plusOnes: z.coerce.number().int().min(0).max(10),
  dietaryNotes: z.string().max(500).optional(),
  guestNotes: z.string().max(1000).optional(),
  label: z.enum(["none", "vip", "family", "wedding_party", "corporate", "other"]),
});

type FormValues = z.infer<typeof schema>;

type GuestFormProps = {
  eventId: string;
  guest?: EventGuest;
  seats: EventSeat[];
  onSaved: (guest: EventGuest) => void;
  onCancel?: () => void;
};

export default function GuestForm({
  eventId,
  guest,
  seats,
  onSaved,
  onCancel,
}: GuestFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: guest?.name ?? "",
      email: guest?.email ?? "",
      phone: guest?.phone ?? "",
      clientType: guest?.clientType ?? "individual",
      status: guest?.status ?? "invited",
      seatId: guest?.seatId ?? "",
      plusOnes: guest?.plusOnes ?? 0,
      dietaryNotes: guest?.dietaryNotes ?? "",
      guestNotes: guest?.guestNotes ?? "",
      label: guest?.label ?? "none",
    },
  });

  async function onSubmit(values: FormValues) {
    const data: GuestFormData = {
      name: values.name,
      email: values.email ?? "",
      phone: values.phone ?? "",
      clientType: values.clientType,
      status: values.status,
      seatId: values.seatId || null,
      plusOnes: values.plusOnes,
      dietaryNotes: values.dietaryNotes ?? "",
      guestNotes: values.guestNotes ?? "",
      label: values.label,
    };
    const result = await saveGuestAction(eventId, data, guest?.id);
    if (!result.success) return;
    onSaved(result.data);
  }

  const availableSeats = seats.filter(
    (seat) => !seat.guestId || seat.guestId === guest?.id
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <AdminInput label="Nome" {...register("name")} />
        <AdminSelect label="Tipo" {...register("clientType")}>
          {(Object.entries(CLIENT_TYPE_LABELS) as [ClientType, string][]).map(
            ([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            )
          )}
        </AdminSelect>
        <AdminInput label="Email" type="email" {...register("email")} />
        <AdminInput label="Telefone" {...register("phone")} />
        <AdminSelect label="Estado" {...register("status")}>
          {GUEST_STATUSES.map((status) => (
            <option key={status} value={status}>
              {GUEST_STATUS_LABELS[status as GuestStatus]}
            </option>
          ))}
        </AdminSelect>
        <AdminSelect label="Etiqueta" {...register("label")}>
          {GUEST_LABELS.map((label) => (
            <option key={label} value={label}>
              {GUEST_LABEL_LABELS[label as GuestLabel]}
            </option>
          ))}
        </AdminSelect>
        <AdminSelect label="Lugar (opcional)" {...register("seatId")}>
          <option value="">Sem lugar atribuído</option>
          {availableSeats.map((seat) => (
            <option key={seat.id} value={seat.id}>
              {seat.tableName} · Lugar {seat.seatNumber}
              {seat.label ? ` (${seat.label})` : ""}
            </option>
          ))}
        </AdminSelect>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <AdminInput
          label="Acompanhantes (+1)"
          type="number"
          min={0}
          max={10}
          {...register("plusOnes")}
        />
        <AdminInput
          label="Restrições alimentares"
          {...register("dietaryNotes")}
          placeholder="Vegetariano, sem glúten, alergias..."
        />
      </div>

      <label className="block">
        <span className="block font-mono text-[9px] tracking-[0.35em] uppercase text-grey/70 mb-2">
          Notas internas
        </span>
        <textarea
          {...register("guestNotes")}
          rows={3}
          placeholder="Observações da equipa ou dos noivos"
          className="w-full bg-black-soft border border-grey-dark/80 text-white/80 text-sm px-3 py-2.5 rounded-sm resize-y"
        />
      </label>

      {errors.name ? (
        <p className="text-red-400 text-xs">{errors.name.message}</p>
      ) : null}
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={isSubmitting} className="admin-btn-primary">
          {guest ? "Actualizar convidado" : "Adicionar convidado"}
        </button>
        {onCancel ? (
          <button type="button" onClick={onCancel} className="admin-btn-secondary">
            Cancelar
          </button>
        ) : null}
      </div>
    </form>
  );
}
