export type SupplierApplicationInput = {
  applicantUserId: string | null;
  supplierName: string;
  responsibleName: string;
  email: string;
  phone: string;
  category: string;
  city: string;
  portfolioUrl: string | null;
  message: string | null;
};

type SupplierApplicationInsertResult = {
  data: { id: string; status: string } | null;
  error: { code?: string; message: string } | null;
};

export type SupplierApplicationClient = {
  from(table: "supplier_applications"): {
    insert(values: {
      applicant_user_id: string | null;
      supplier_name: string;
      responsible_name: string;
      email: string;
      phone: string;
      category: string;
      city: string;
      portfolio_url: string | null;
      message: string | null;
    }): {
      select(columns: string): {
        single(): Promise<SupplierApplicationInsertResult>;
      };
    };
  };
};

export type CreateSupplierApplicationResult =
  | { ok: true; id: string | null; duplicate: boolean; status: "pending" }
  | { ok: false; message: string };

export async function createSupplierApplication(
  client: SupplierApplicationClient,
  input: SupplierApplicationInput,
): Promise<CreateSupplierApplicationResult> {
  const { data, error } = await client
    .from("supplier_applications")
    .insert({
      applicant_user_id: input.applicantUserId,
      supplier_name: input.supplierName.trim(),
      responsible_name: input.responsibleName.trim(),
      email: input.email.trim().toLocaleLowerCase("pt-PT"),
      phone: input.phone.trim(),
      category: input.category.trim(),
      city: input.city.trim(),
      portfolio_url: input.portfolioUrl?.trim() || null,
      message: input.message?.trim() || null,
    })
    .select("id, status")
    .single();

  if (error?.code === "23505") {
    return { ok: true, id: null, duplicate: true, status: "pending" };
  }

  if (error || !data) {
    return {
      ok: false,
      message: "Não foi possível guardar a candidatura. Tente novamente.",
    };
  }

  return { ok: true, id: data.id, duplicate: false, status: "pending" };
}
