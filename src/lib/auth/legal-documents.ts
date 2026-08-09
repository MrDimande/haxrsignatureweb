import { portfolioCopy } from "@/lib/site-config";

export const AUTH_LEGAL_DOCUMENT_IDS = ["terms", "privacy"] as const;

export type AuthLegalDocumentId = (typeof AUTH_LEGAL_DOCUMENT_IDS)[number];

export type AuthLegalDocument = {
  id: AuthLegalDocumentId;
  label: string;
  headline: string;
  paragraphs: readonly string[];
};

export function getAuthLegalDocument(id: AuthLegalDocumentId): AuthLegalDocument {
  const content =
    id === "terms"
      ? portfolioCopy.termosDeServico
      : portfolioCopy.politicaPrivacidade;

  return {
    id,
    label: content.label,
    headline: content.headline,
    paragraphs: content.paragraphs,
  };
}
