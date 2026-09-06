/**
 * HAXR Edition Engine — Memories Domain Types & Repository Contracts
 */

export interface MemoryUploadIntent {
  photoId: string;
  slug: string;
  bucketName: string;
  storagePath: string;
  contentType: string;
  declaredFileSizeBytes: number;
  expiresAt: string;
  status: "pending" | "consumed" | "expired";
}

export interface MemoryRecord {
  id: string;
  invitationSlug: string;
  storagePath: string;
  originalFilename: string;
  contentType: string;
  fileSizeBytes: number;
  guestName: string | null;
  caption: string | null;
  challengeId: string | null;
  tableId: string | null;
  participantId: string | null;
  moderationStatus: "pending" | "approved" | "rejected";
  createdAt: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
}

export interface PublicMemoryItem {
  id: string;
  signedUrl: string;
  createdAt: string;
  contentType: string;
  kind: "image" | "video";
  caption: string | null;
  guestName: string | null;
  challengeId: string | null;
  tableId: string | null;
}

export interface MemoriesRepository {
  insert(record: MemoryRecord): Promise<void>;
  listPublic(slug: string): Promise<MemoryRecord[]>;
  updateModerationStatus(
    photoId: string,
    slug: string,
    status: "approved" | "rejected"
  ): Promise<boolean>;
  findById(photoId: string, slug: string): Promise<MemoryRecord | null>;
}
