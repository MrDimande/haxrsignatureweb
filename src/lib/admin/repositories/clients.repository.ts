import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { asTableRow, asTableRows } from "@/lib/supabase/helpers";
import { clientToDbInsert, mapClient } from "@/lib/admin/db/mappers";
import type { Client, ClientFormData } from "@/lib/admin/types";
import type { Tables } from "@/lib/supabase/database.types";
import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import { neonQuery } from "@/lib/neon/server-db";

type ClientRow = Tables<"clients">;
type NeonClientRow = { row: ClientRow };
type NeonPortalTokenRow = { portal_token: string | null };

async function listClientsFromNeon(): Promise<Client[]> {
  const result = await neonQuery<NeonClientRow>(`
    SELECT to_jsonb(c) AS row
    FROM public.clients c
    ORDER BY c.client_name
  `);

  return result.rows.map(({ row }) => mapClient(row));
}

async function listClientsFromSupabase(): Promise<Client[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("client_name");

  if (error) throw new Error(error.message);
  return asTableRows<"clients">(data).map(mapClient);
}

export async function listClients(): Promise<Client[]> {
  if (shouldUseNeonServerDatabase()) {
    return listClientsFromNeon();
  }

  return listClientsFromSupabase();
}

async function getClientByIdFromNeon(id: string): Promise<Client | null> {
  const result = await neonQuery<NeonClientRow>(
    `
      SELECT to_jsonb(c) AS row
      FROM public.clients c
      WHERE c.id = $1
      LIMIT 1
    `,
    [id],
  );

  const row = result.rows[0]?.row;
  return row ? mapClient(row) : null;
}

async function getClientByIdFromSupabase(id: string): Promise<Client | null> {
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

export async function getClientById(id: string): Promise<Client | null> {
  if (shouldUseNeonServerDatabase()) {
    return getClientByIdFromNeon(id);
  }

  return getClientByIdFromSupabase(id);
}

async function upsertClientInNeon(
  data: ClientFormData,
  id?: string,
): Promise<Client> {
  const values = [
    data.fullName,
    data.clientType,
    data.companyName,
    data.nuit,
    data.email,
    data.phone,
    data.address,
  ];

  const result = id
    ? await neonQuery<NeonClientRow>(
        `
          WITH saved AS (
            INSERT INTO public.clients (
              id,
              client_name,
              client_type,
              company_name,
              nuit,
              email,
              phone,
              address
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (id) DO UPDATE SET
              client_name = EXCLUDED.client_name,
              client_type = EXCLUDED.client_type,
              company_name = EXCLUDED.company_name,
              nuit = EXCLUDED.nuit,
              email = EXCLUDED.email,
              phone = EXCLUDED.phone,
              address = EXCLUDED.address
            RETURNING *
          )
          SELECT to_jsonb(saved) AS row
          FROM saved
        `,
        [id, ...values],
      )
    : await neonQuery<NeonClientRow>(
        `
          WITH saved AS (
            INSERT INTO public.clients (
              client_name,
              client_type,
              company_name,
              nuit,
              email,
              phone,
              address
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
          )
          SELECT to_jsonb(saved) AS row
          FROM saved
        `,
        values,
      );

  const row = result.rows[0]?.row;
  if (!row) throw new Error("Falha ao guardar cliente.");
  return mapClient(row);
}

async function upsertClientInSupabase(
  data: ClientFormData,
  id?: string,
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

export async function upsertClient(
  data: ClientFormData,
  id?: string,
): Promise<Client> {
  if (shouldUseNeonServerDatabase()) {
    return upsertClientInNeon(data, id);
  }

  return upsertClientInSupabase(data, id);
}

async function deleteClientFromNeon(id: string): Promise<void> {
  await neonQuery("DELETE FROM public.clients WHERE id = $1", [id]);
}

async function deleteClientFromSupabase(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteClient(id: string): Promise<void> {
  if (shouldUseNeonServerDatabase()) {
    await deleteClientFromNeon(id);
    return;
  }

  await deleteClientFromSupabase(id);
}

function generatePortalToken(): string {
  return randomBytes(24).toString("base64url");
}

async function ensureClientPortalTokenInNeon(clientId: string): Promise<string> {
  const token = generatePortalToken();
  const result = await neonQuery<NeonPortalTokenRow>(
    `
      UPDATE public.clients
      SET portal_token = COALESCE(portal_token, $2)
      WHERE id = $1
      RETURNING portal_token
    `,
    [clientId, token],
  );

  const portalToken = result.rows[0]?.portal_token;
  if (!portalToken) {
    throw new Error("Cliente não encontrado.");
  }
  return portalToken;
}

async function ensureClientPortalTokenInSupabase(clientId: string): Promise<string> {
  const existing = await getClientByIdFromSupabase(clientId);
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

export async function ensureClientPortalToken(clientId: string): Promise<string> {
  if (shouldUseNeonServerDatabase()) {
    return ensureClientPortalTokenInNeon(clientId);
  }

  return ensureClientPortalTokenInSupabase(clientId);
}

async function getClientByPortalTokenFromNeon(
  token: string,
): Promise<Client | null> {
  const result = await neonQuery<NeonClientRow>(
    `
      SELECT to_jsonb(c) AS row
      FROM public.clients c
      WHERE c.portal_token = $1
      LIMIT 1
    `,
    [token],
  );

  const row = result.rows[0]?.row;
  return row ? mapClient(row) : null;
}

async function getClientByPortalTokenFromSupabase(
  token: string,
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

export async function getClientByPortalToken(
  token: string,
): Promise<Client | null> {
  if (shouldUseNeonServerDatabase()) {
    return getClientByPortalTokenFromNeon(token);
  }

  return getClientByPortalTokenFromSupabase(token);
}
