import type {
  Business,
  Currency,
  DocumentContactChannel,
  DocumentPdfTemplate,
  DocumentStatus,
  DocumentType,
  EventType,
  InvoiceDocument,
} from "@/lib/admin/types";

export interface DocumentContactProfile {
  label: string;
  email: string;
  phone: string;
  formattedPhone: string;
  location: string;
  nuit: string;
  isHaxr: boolean;
  channel: DocumentContactChannel;
}

export interface CommercialPdfProps {
  document: InvoiceDocument;
  business: Business;
  origin?: string;
}

export interface DocumentPdfThemeColors {
  pageBg: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentGold: string;
  accentGoldMuted: string;
  accentChampagne: string;
  cardBg: string;
  cardBgAlt: string;
  borderHairline: string;
  borderStrong: string;
  tableHeaderBg: string;
  tableRowAltBg: string;
  badgeDraftBg: string;
  badgeDraftText: string;
  badgeDraftBorder: string;
  badgeSentBg: string;
  badgeSentText: string;
  badgeSentBorder: string;
  badgePaidBg: string;
  badgePaidText: string;
  badgePaidBorder: string;
  badgeCancelledBg: string;
  badgeCancelledText: string;
  badgeCancelledBorder: string;
}

export interface DocumentPdfTheme {
  template: DocumentPdfTemplate;
  colors: DocumentPdfThemeColors;
  fonts: {
    title: string;
    body: string;
    mono: string;
  };
}
