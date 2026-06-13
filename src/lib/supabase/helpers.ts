import type { Tables } from "@/lib/supabase/database.types";

export function asTableRows<T extends keyof import("@/lib/supabase/database.types").Database["public"]["Tables"]>(
  data: unknown
): Tables<T>[] {
  return (data ?? []) as Tables<T>[];
}

export function asTableRow<T extends keyof import("@/lib/supabase/database.types").Database["public"]["Tables"]>(
  data: unknown
): Tables<T> | null {
  return (data ?? null) as Tables<T> | null;
}
