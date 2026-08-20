import { haxrMailboxes } from "@/lib/email/addresses";
import { DOCUMENT_CONTACT_CHANNEL_LABELS } from "@/lib/admin/constants";
import type { Business, DocumentContactChannel } from "@/lib/admin/types";
import type { DocumentContactProfile } from "./document-pdf-types";

export const HAXR_COMMERCIAL_PHONE = "+258 87 088 3428";
export const HAXR_LOCATION = "Maputo · Moçambique";

export interface ResolveDocumentContactProfileOptions {
  business: Business;
  contactChannel?: DocumentContactChannel | null;
}

export function resolveDocumentContactProfile({
  business,
  contactChannel,
}: ResolveDocumentContactProfileOptions): DocumentContactProfile {
  const isHaxr = business.id === "haxr-signature";

  if (!isHaxr) {
    return {
      label: business.name,
      email: business.email,
      phone: business.phone,
      formattedPhone: business.phone,
      location: business.address || HAXR_LOCATION,
      nuit: business.nuit,
      isHaxr: false,
      channel: "financeiro",
    };
  }

  const validChannel: DocumentContactChannel =
    contactChannel &&
    (contactChannel === "financeiro" ||
      contactChannel === "convites" ||
      contactChannel === "info" ||
      contactChannel === "geral")
      ? contactChannel
      : "financeiro";

  const email = haxrMailboxes[validChannel] ?? haxrMailboxes.financeiro;
  const labelSuffix = DOCUMENT_CONTACT_CHANNEL_LABELS[validChannel] ?? "Financeiro";

  return {
    label: `HAXR Signature · ${labelSuffix}`,
    email,
    phone: HAXR_COMMERCIAL_PHONE,
    formattedPhone: HAXR_COMMERCIAL_PHONE,
    location: HAXR_LOCATION,
    nuit: business.nuit || "150725161",
    isHaxr: true,
    channel: validChannel,
  };
}
