import { isSupabaseConfigured } from "@/lib/supabase/server";
import { MockConciergeStorageProvider } from "./mock-concierge-storage-provider";
import { SupabaseConciergeStorageProvider } from "./supabase-concierge-storage-provider";
import type { ConciergeStorageProvider } from "./concierge-storage-provider";

export function createConciergeStorageProvider(): ConciergeStorageProvider {
  if (isSupabaseConfigured()) {
    return new SupabaseConciergeStorageProvider();
  }
  return new MockConciergeStorageProvider();
}

export function isConciergeStorageActive(): boolean {
  return isSupabaseConfigured();
}
