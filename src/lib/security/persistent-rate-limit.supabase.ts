import { createAdminClient } from "@/lib/supabase/server";

export async function invokePersistentRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<unknown> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("check_api_rate_limit", {
    p_bucket_key: key,
    p_max_requests: maxRequests,
    p_window_seconds: windowSeconds,
  } as never);

  if (error) throw new Error(error.message);
  return data;
}
