"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminInput, AdminSelect, AdminTextarea } from "@/components/admin/AdminField";
import { saveClientAction } from "@/lib/admin/actions/clients.actions";
import { CLIENT_TYPE_LABELS } from "@/lib/admin/constants";
import type { Client, ClientFormData, ClientType } from "@/lib/admin/types";

const schema = z.object({
  fullName: z.string().min(2, "Nome obrigatório"),
  clientType: z.enum(["individual", "company"]),
  companyName: z.string().optional(),
  nuit: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type ClientFormProps = {
  client?: Client;
  onSaved: (client: Client) => void;
  onCancel?: () => void;
};

export default function ClientForm({ client, onSaved, onCancel }: ClientFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: client?.fullName ?? "",
      clientType: client?.clientType ?? "individual",
      companyName: client?.companyName ?? "",
      nuit: client?.nuit ?? "",
      email: client?.email ?? "",
      phone: client?.phone ?? "",
      address: client?.address ?? "",
    },
  });

  const clientType = watch("clientType");

  async function onSubmit(values: FormValues) {
    const data: ClientFormData = {
      fullName: values.fullName,
      clientType: values.clientType,
      companyName: values.companyName ?? "",
      nuit: values.nuit ?? "",
      email: values.email ?? "",
      phone: values.phone ?? "",
      address: values.address ?? "",
    };
    const result = await saveClientAction(data, client?.id);
    if (!result.success) return;
    onSaved(result.data);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <AdminSelect label="Tipo de Cliente" {...register("clientType")}>
        {(Object.entries(CLIENT_TYPE_LABELS) as [ClientType, string][]).map(
          ([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          )
        )}
      </AdminSelect>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <AdminInput
          label={clientType === "company" ? "Nome do Responsável" : "Nome Completo"}
          {...register("fullName")}
        />
        {errors.fullName ? (
          <p className="text-red-400 text-xs md:col-span-2 -mt-3">
            {errors.fullName.message}
          </p>
        ) : null}
        {clientType === "company" ? (
          <AdminInput label="Empresa" {...register("companyName")} />
        ) : (
          <AdminInput label="Empresa (opcional)" {...register("companyName")} />
        )}
        <AdminInput label="NUIT (opcional)" {...register("nuit")} />
        <AdminInput label="Email" type="email" {...register("email")} />
        <AdminInput label="Telefone" {...register("phone")} />
      </div>
      <AdminTextarea label="Morada" {...register("address")} />
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={isSubmitting} className="admin-btn-primary">
          {client ? "Actualizar Cliente" : "Guardar Cliente"}
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
