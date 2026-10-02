import { randomBytes } from "node:crypto";
import { mapClient } from "@/lib/admin/db/mappers";
import type { Client, ClientFormData } from "@/lib/admin/types";
import { neonQuery } from "@/lib/neon/server-db";
import type { Tables } from "@/lib/supabase/database.types";

type ClientRow = Tables<"clients">;
type NeonClientRow = { row: ClientRow };
type NeonPortalTokenRow = { portal_token: string | null };

export async function listClients(): Promise<Client[]> {
  const result = await neonQuery<NeonClientRow>(
    `SELECT to_jsonb(c) AS row FROM public.clients c ORDER BY c.client_name`,
  );
  return result.rows.map(({ row }) => mapClient(row));
}

export async function getClientById(id: string): Promise<Client | null> {
  const result = await neonQuery<NeonClientRow>(
    `SELECT to_jsonb(c) AS row
     FROM public.clients c
     WHERE c.id = $1
     LIMIT 1`,
    [id],
  );
  const row = result.rows[0]?.row;
  return row ? mapClient(row) : null;
}

export async function upsertClient(
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
        `WITH saved AS (
           INSERT INTO public.clients (
             id, client_name, client_type, company_name, nuit, email, phone, address
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
         ) SELECT to_jsonb(saved) AS row FROM saved`,
        [id, ...values],
      )
    : await neonQuery<NeonClientRow>(
        `WITH saved AS (
           INSERT INTO public.clients (
             client_name, client_type, company_name, nuit, email, phone, address
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *
         ) SELECT to_jsonb(saved) AS row FROM saved`,
        values,
      );
  const row = result.rows[0]?.row;
  if (!row) throw new Error("Falha ao guardar cliente.");
  return mapClient(row);
}

export async function deleteClient(id: string): Promise<void> {
  await neonQuery("DELETE FROM public.clients WHERE id = $1", [id]);
}

function generatePortalToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function ensureClientPortalToken(clientId: string): Promise<string> {
  const token = generatePortalToken();
  const result = await neonQuery<NeonPortalTokenRow>(
    `UPDATE public.clients
     SET portal_token = COALESCE(portal_token, $2)
     WHERE id = $1
     RETURNING portal_token`,
    [clientId, token],
  );
  const portalToken = result.rows[0]?.portal_token;
  if (!portalToken) throw new Error("Cliente não encontrado.");
  return portalToken;
}

export async function getClientByPortalToken(
  token: string,
): Promise<Client | null> {
  const result = await neonQuery<NeonClientRow>(
    `SELECT to_jsonb(c) AS row
     FROM public.clients c
     WHERE c.portal_token = $1
     LIMIT 1`,
    [token],
  );
  const row = result.rows[0]?.row;
  return row ? mapClient(row) : null;
}
