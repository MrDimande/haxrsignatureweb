import { isPrivateStorageConfigured } from "@/lib/storage/private-storage";
import { MockConciergeStorageProvider } from "./mock-concierge-storage-provider";
import { UniversalConciergeStorageProvider } from "./universal-concierge-storage-provider";
import type { ConciergeStorageProvider } from "./concierge-storage-provider";

export function createConciergeStorageProvider(): ConciergeStorageProvider {
  if (isPrivateStorageConfigured()) {
    return new UniversalConciergeStorageProvider();
  }
  return new MockConciergeStorageProvider();
}

export function isConciergeStorageActive(): boolean {
  return isPrivateStorageConfigured();
}
