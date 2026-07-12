import type { ConciergeStorageProvider, ConciergeStorageUploadInput, ConciergeStorageUploadResult } from "./concierge-storage-provider";

export class MockConciergeStorageProvider implements ConciergeStorageProvider {
  readonly mode = "metadata_only" as const;

  async uploadFile(_input: ConciergeStorageUploadInput): Promise<ConciergeStorageUploadResult> {
    throw new Error(
      "Armazenamento permanente em preparação. O ficheiro foi registado apenas com metadados."
    );
  }

  async getSignedUrl(_path: string): Promise<string | null> {
    return null;
  }

  async deleteFile(_path: string): Promise<void> {
    // noop
  }
}
