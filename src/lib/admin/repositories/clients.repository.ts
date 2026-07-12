import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { asTableRow, asTableRows } from "@/lib/supabase/helpers";
import { clientToDbInsert, mapClient } from "@/lib/admin/db/mappers";
import type { Client, ClientFormData } from "@/lib/admin/types";

export async function listClients(): Promise<Client[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("client_name");

  if (error) throw new Error(error.message);
  return asTableRows<"clients">(data).map(mapClient);
}

export async function getClientById(id: string): Promise<Client | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  const row = asTableRow<"clients">(data);
  return row ? mapClient(row) : null;
}

export async function upsertClient(
  data: ClientFormData,
  id?: string
): Promise<Client> {
  const supabase = createAdminClient();
  const payload = clientToDbInsert(data, id);

  const { data: saved, error } = await supabase
    .from("clients")
    .upsert(payload as never)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  const row = asTableRow<"clients">(saved);
  if (!row) throw new Error("Falha ao guardar cliente.");
  return mapClient(row);
}

export async function deleteClient(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

function generatePortalToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function ensureClientPortalToken(clientId: string): Promise<string> {
  const existing = await getClientById(clientId);
  if (!existing) {
    throw new Error("Cliente não encontrado.");
  }
  if (existing.portalToken) {
    return existing.portalToken;
  }

  const supabase = createAdminClient();
  const token = generatePortalToken();
  const { data, error } = await supabase
    .from("clients")
    .update({ portal_token: token } as never)
    .eq("id", clientId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  const row = asTableRow<"clients">(data);
  if (!row?.portal_token) {
    throw new Error("Falha ao gerar link do portal.");
  }
  return row.portal_token;
}

export async function getClientByPortalToken(
  token: string
): Promise<Client | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("portal_token", token)
    .maybeSingle();

  if (error) throw new Error(error.message);
  const row = asTableRow<"clients">(data);
  return row ? mapClient(row) : null;
}
