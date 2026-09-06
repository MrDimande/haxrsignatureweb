import type { GuestGroup, GuestGroupFormData } from "@/lib/events/types";
import type { Tables } from "@/lib/supabase/database.types";
import { neonQuery, withNeonTransaction } from "@/lib/neon/server-db";

type GroupRow = Tables<"guest_groups">;
type NeonGroupJsonRow = { row: GroupRow };
type CountRow = { count: number };

function mapGroup(row: GroupRow): GuestGroup {
  return {
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listGroupsByEvent(eventId: string): Promise<GuestGroup[]> {
  const result = await neonQuery<NeonGroupJsonRow>(
    `
      SELECT to_jsonb(g) AS row
      FROM public.guest_groups g
      WHERE g.event_id = $1::uuid
      ORDER BY g.name
    `,
    [eventId],
  );
  return result.rows.map(({ row }) => mapGroup(row));
}

export async function createGroup(
  eventId: string,
  data: GuestGroupFormData,
): Promise<GuestGroup> {
  const result = await neonQuery<NeonGroupJsonRow>(
    `
      WITH saved AS (
        INSERT INTO public.guest_groups (event_id, name, notes)
        VALUES ($1::uuid, $2, $3)
        RETURNING *
      )
      SELECT to_jsonb(saved) AS row FROM saved
    `,
    [eventId, data.name.trim(), data.notes.trim()],
  );

  const row = result.rows[0]?.row;
  if (!row) throw new Error("Falha ao criar grupo.");
  return mapGroup(row);
}

export async function updateGroup(
  id: string,
  data: GuestGroupFormData,
): Promise<GuestGroup> {
  const result = await neonQuery<NeonGroupJsonRow>(
    `
      WITH saved AS (
        UPDATE public.guest_groups
        SET name = $2,
            notes = $3,
            updated_at = now()
        WHERE id = $1::uuid
        RETURNING *
      )
      SELECT to_jsonb(saved) AS row FROM saved
    `,
    [id, data.name.trim(), data.notes.trim()],
  );

  const row = result.rows[0]?.row;
  if (!row) throw new Error("Grupo não encontrado.");
  return mapGroup(row);
}

export async function deleteGroup(id: string): Promise<void> {
  await withNeonTransaction(async (client) => {
    await client.query(
      "UPDATE public.guests SET group_id = NULL WHERE group_id = $1::uuid",
      [id],
    );
    await client.query("DELETE FROM public.guest_groups WHERE id = $1::uuid", [id]);
  });
}

export async function countGuestsInGroup(groupId: string): Promise<number> {
  const result = await neonQuery<CountRow>(
    "SELECT count(*)::int AS count FROM public.guests WHERE group_id = $1::uuid",
    [groupId],
  );
  return result.rows[0]?.count ?? 0;
}
