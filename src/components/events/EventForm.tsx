"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminInput, AdminSelect, AdminTextarea } from "@/components/admin/AdminField";
import { EVENT_TYPE_LABELS, EVENT_TYPES } from "@/lib/admin/constants";
import { saveEventAction } from "@/lib/events/actions/events.actions";
import type { BusinessId, EventType } from "@/lib/admin/types";
import type { EventFormData, ManagedEvent } from "@/lib/events/types";

const schema = z.object({
  businessId: z.enum(["haxr-signature", "brainywrite"]),
  name: z.string().min(2, "Nome obrigatório"),
  type: z.enum([
    "wedding",
    "birthday",
    "corporate",
    "baby_shower",
    "graduation",
    "other",
  ]),
  date: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type EventFormProps = {
  businesses: { id: BusinessId; name: string }[];
  event?: ManagedEvent;
  onSaved: (event: ManagedEvent) => void;
  onCancel?: () => void;
};

export default function EventForm({
  businesses,
  event,
  onSaved,
  onCancel,
}: EventFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      businessId: event?.businessId ?? "haxr-signature",
      name: event?.name ?? "",
      type: event?.type ?? "wedding",
      date: event?.date ?? "",
      location: event?.location ?? "",
      notes: event?.notes ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    const data: EventFormData = {
      businessId: values.businessId,
      name: values.name,
      type: values.type,
      date: values.date ?? "",
      location: values.location ?? "",
      notes: values.notes ?? "",
    };
    const result = await saveEventAction(data, event?.id);
    if (!result.success) return;
    onSaved(result.data);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <AdminSelect label="Negócio" {...register("businessId")}>
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </AdminSelect>
        <AdminSelect label="Tipo de evento" {...register("type")}>
          {EVENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {EVENT_TYPE_LABELS[type as EventType]}
            </option>
          ))}
        </AdminSelect>
        <AdminInput label="Nome do evento" {...register("name")} />
        <AdminInput label="Data" type="date" {...register("date")} />
        <AdminInput
          label="Local"
          className="md:col-span-2"
          {...register("location")}
        />
      </div>
      {errors.name ? (
        <p className="text-red-400 text-xs">{errors.name.message}</p>
      ) : null}
      <AdminTextarea label="Notas internas" {...register("notes")} />
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={isSubmitting} className="admin-btn-primary">
          {event ? "Actualizar evento" : "Criar evento"}
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
