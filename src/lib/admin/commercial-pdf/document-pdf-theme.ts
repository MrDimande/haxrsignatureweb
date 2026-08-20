import { StyleSheet } from "@react-pdf/renderer";
import type { DocumentPdfTemplate } from "@/lib/admin/types";
import type { DocumentPdfTheme, DocumentPdfThemeColors } from "./document-pdf-types";

export const THEME_COLORS: Record<DocumentPdfTemplate, DocumentPdfThemeColors> = {
  // 1. Editorial Ivory (Classic Luxury Warm Ivory)
  editorial_ivory: {
    pageBg: "#FCFAF7",
    textPrimary: "#1C1A17",
    textSecondary: "#5A554E",
    textMuted: "#8A847A",
    accentGold: "#B88A2A",
    accentGoldMuted: "#8C6A1E",
    accentChampagne: "#EAD8B8",
    cardBg: "#F7F1E8",
    cardBgAlt: "#FAF6F0",
    borderHairline: "#EAE4D9",
    borderStrong: "#B88A2A",
    tableHeaderBg: "#F2EBE0",
    tableRowAltBg: "#FAF6F0",
    badgeDraftBg: "#F2EBE0",
    badgeDraftText: "#7A756D",
    badgeDraftBorder: "#E5DEC9",
    badgeSentBg: "#F4EDE1",
    badgeSentText: "#8C6A1E",
    badgeSentBorder: "#EAD8B8",
    badgePaidBg: "#EAE4D9",
    badgePaidText: "#1C1A17",
    badgePaidBorder: "#DCD4C7",
    badgeCancelledBg: "#F7EBEB",
    badgeCancelledText: "#8C2A2A",
    badgeCancelledBorder: "#ECCECE",
  },

  // 2. Signature Noir (Digital-First Dark Luxury)
  signature_noir: {
    pageBg: "#0D0C0A",
    textPrimary: "#F5F0E8",
    textSecondary: "#C4BEB4",
    textMuted: "#888278",
    accentGold: "#C9A227",
    accentGoldMuted: "#A38018",
    accentChampagne: "#D4AF37",
    cardBg: "#141311",
    cardBgAlt: "#1C1A17",
    borderHairline: "#26231E",
    borderStrong: "#C9A227",
    tableHeaderBg: "#181714",
    tableRowAltBg: "#131210",
    badgeDraftBg: "#1C1A17",
    badgeDraftText: "#B0ABA0",
    badgeDraftBorder: "#33302A",
    badgeSentBg: "#2B2516",
    badgeSentText: "#D4AF37",
    badgeSentBorder: "#4A3E20",
    badgePaidBg: "#1E1C18",
    badgePaidText: "#F5F0E8",
    badgePaidBorder: "#4A3E20",
    badgeCancelledBg: "#2B1616",
    badgeCancelledText: "#E59898",
    badgeCancelledBorder: "#4A2020",
  },

  // 3. Executive (Formal Minimal Corporate with HAXR Geometry)
  executive: {
    pageBg: "#FFFFFF",
    textPrimary: "#111111",
    textSecondary: "#444444",
    textMuted: "#777777",
    accentGold: "#8C6A1E",
    accentGoldMuted: "#6B5014",
    accentChampagne: "#C9A227",
    cardBg: "#F8F8F8",
    cardBgAlt: "#F2F2F2",
    borderHairline: "#DDDDDD",
    borderStrong: "#8C6A1E",
    tableHeaderBg: "#EFEFEF",
    tableRowAltBg: "#F9F9F9",
    badgeDraftBg: "#EFEFEF",
    badgeDraftText: "#555555",
    badgeDraftBorder: "#D0D0D0",
    badgeSentBg: "#F4EFE6",
    badgeSentText: "#8C6A1E",
    badgeSentBorder: "#DECDB4",
    badgePaidBg: "#E8E8E8",
    badgePaidText: "#111111",
    badgePaidBorder: "#CCCCCC",
    badgeCancelledBg: "#F7EBEB",
    badgeCancelledText: "#8C2A2A",
    badgeCancelledBorder: "#ECCECE",
  },

  // 4. Atelier Blanc (Pure-White Luxury Stationery, Fashion-House Aesthetic)
  atelier_blanc: {
    pageBg: "#FFFFFF",
    textPrimary: "#141311",
    textSecondary: "#5C574F",
    textMuted: "#918B80",
    accentGold: "#A37B24",
    accentGoldMuted: "#7A5C1B",
    accentChampagne: "#D9C9A3",
    cardBg: "#FAFAF9",
    cardBgAlt: "#FFFFFF",
    borderHairline: "#E6E2D8",
    borderStrong: "#141311",
    tableHeaderBg: "#FFFFFF",
    tableRowAltBg: "#FAFAF9",
    badgeDraftBg: "#F5F5F3",
    badgeDraftText: "#666157",
    badgeDraftBorder: "#E2DED5",
    badgeSentBg: "#FAF6EE",
    badgeSentText: "#8C6A1E",
    badgeSentBorder: "#E8DFC8",
    badgePaidBg: "#F0EFEA",
    badgePaidText: "#141311",
    badgePaidBorder: "#D6D1C4",
    badgeCancelledBg: "#FAECEC",
    badgeCancelledText: "#993333",
    badgeCancelledBorder: "#F0D3D3",
  },

  // 5. Maison Signature (Architectural High Art-Direction, Alabaster/Champagne)
  maison_signature: {
    pageBg: "#FAF7F2",
    textPrimary: "#181614",
    textSecondary: "#544E46",
    textMuted: "#878074",
    accentGold: "#C59F45",
    accentGoldMuted: "#9E7B27",
    accentChampagne: "#E8D4A2",
    cardBg: "#F2EDE4",
    cardBgAlt: "#F7F3EC",
    borderHairline: "#DED6C8",
    borderStrong: "#C59F45",
    tableHeaderBg: "#EBE4D8",
    tableRowAltBg: "#F7F3EC",
    badgeDraftBg: "#EDE7DC",
    badgeDraftText: "#6E6659",
    badgeDraftBorder: "#DDD4C4",
    badgeSentBg: "#F2E8D2",
    badgeSentText: "#9E7B27",
    badgeSentBorder: "#E2D2B0",
    badgePaidBg: "#E4DCD0",
    badgePaidText: "#181614",
    badgePaidBorder: "#D2C6B4",
    badgeCancelledBg: "#F5E4E4",
    badgeCancelledText: "#8C2A2A",
    badgeCancelledBorder: "#E8C8C8",
  },
};

export function getDocumentPdfTheme(
  template: DocumentPdfTemplate = "editorial_ivory"
): DocumentPdfTheme {
  const validTemplate =
    template === "signature_noir" ||
    template === "executive" ||
    template === "atelier_blanc" ||
    template === "maison_signature" ||
    template === "editorial_ivory"
      ? template
      : "editorial_ivory";

  const colors = THEME_COLORS[validTemplate];
  return {
    template: validTemplate,
    colors,
    fonts: {
      title:
        validTemplate === "executive"
          ? "Helvetica-Bold"
          : validTemplate === "maison_signature"
            ? "Times-Bold"
            : validTemplate === "atelier_blanc"
              ? "Times-Bold"
              : "Times-Bold",
      body: "Helvetica",
      mono: "Courier",
    },
  };
}

export function createCommercialPdfStyles(theme: DocumentPdfTheme) {
  const { colors, fonts, template } = theme;
  const isAtelier = template === "atelier_blanc";
  const isMaison = template === "maison_signature";
  const isExecutive = template === "executive";

  return StyleSheet.create({
    page: {
      fontFamily: fonts.body,
      fontSize: 8.5,
      paddingHorizontal: 36,
      paddingTop: 32,
      paddingBottom: 44,
      color: colors.textPrimary,
      backgroundColor: colors.pageBg,
      position: "relative",
    },

    // Running Header (continuation pages)
    runningHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingBottom: 8,
      marginBottom: 14,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.borderHairline,
    },
    runningHeaderBrand: {
      fontFamily: fonts.title,
      fontSize: 7,
      letterSpacing: 1.1,
      color: colors.accentGold,
      textTransform: "uppercase",
    },
    runningHeaderDoc: {
      fontFamily: fonts.body,
      fontSize: 7,
      letterSpacing: 0.6,
      color: colors.textSecondary,
      textTransform: "uppercase",
    },

    // Top Header: Brand Mark & Document Metadata
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      paddingBottom: isAtelier ? 16 : 18,
      marginBottom: isAtelier ? 14 : 16,
      borderBottomWidth: isAtelier ? 0.75 : 0.5,
      borderBottomColor: isAtelier ? colors.textPrimary : colors.borderHairline,
    },
    brandContainer: {
      flex: 1,
      paddingRight: 16,
    },
    logoImage: {
      maxWidth: isMaison ? 150 : 175,
      maxHeight: isMaison ? 56 : 46,
      objectFit: "contain",
      objectPosition: "left",
      marginBottom: 6,
    },
    brandName: {
      fontFamily: fonts.title,
      fontSize: 16,
      letterSpacing: 0.8,
      color: colors.textPrimary,
      marginBottom: 3,
    },
    brandMeta: {
      fontFamily: fonts.body,
      fontSize: 7.5,
      color: colors.textSecondary,
      lineHeight: 1.35,
    },
    contactMeta: {
      fontFamily: fonts.body,
      fontSize: 7.5,
      color: colors.accentGold,
      marginTop: 2,
    },

    // Document Meta (Right aligned)
    docMetaContainer: {
      alignItems: "flex-end",
      justifyContent: "flex-start",
    },
    docCategoryTag: {
      fontFamily: fonts.body,
      fontSize: 6.5,
      letterSpacing: 1.2,
      color: colors.accentGold,
      textTransform: "uppercase",
      marginBottom: 2,
    },
    docTypeTitle: {
      fontFamily: fonts.title,
      fontSize: isMaison ? 23 : 21,
      color: colors.textPrimary,
      letterSpacing: 0.4,
      marginBottom: 2,
    },
    docNumberText: {
      fontFamily: fonts.mono,
      fontSize: 8.5,
      color: colors.textSecondary,
      letterSpacing: 0.8,
      marginBottom: 5,
    },
    datesRow: {
      alignItems: "flex-end",
      gap: 1.5,
    },
    dateItem: {
      fontSize: 7.5,
      color: colors.textSecondary,
    },
    badgeContainer: {
      marginTop: 5,
    },
    statusBadge: {
      fontSize: 6.5,
      fontFamily: fonts.body,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 1,
      borderWidth: 0.5,
    },

    // Client & Event Panels
    panelsRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: isAtelier ? 14 : 16,
    },
    panelCard: {
      flex: 1,
      padding: isAtelier ? 8 : 10,
      backgroundColor: isAtelier ? "transparent" : colors.cardBg,
      borderWidth: isAtelier ? 0 : 0.5,
      borderLeftWidth: isAtelier ? 1.5 : 0.5,
      borderColor: isAtelier ? colors.accentGold : colors.borderHairline,
      borderRadius: 1,
    },
    panelLabel: {
      fontFamily: fonts.title,
      fontSize: 6.5,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      color: colors.accentGold,
      marginBottom: 4,
    },
    panelValuePrimary: {
      fontFamily: fonts.title,
      fontSize: 9.5,
      color: colors.textPrimary,
      marginBottom: 2,
    },
    panelValueSecondary: {
      fontSize: 7.5,
      color: colors.textSecondary,
      lineHeight: 1.35,
    },

    // Services Table
    table: {
      marginBottom: 14,
    },
    tableHeaderRow: {
      flexDirection: "row",
      backgroundColor: colors.tableHeaderBg,
      borderBottomWidth: isAtelier ? 1 : 0.5,
      borderBottomColor: isAtelier ? colors.textPrimary : colors.borderStrong,
      paddingVertical: 4.5,
      paddingHorizontal: isAtelier ? 2 : 6,
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 0.5,
      borderBottomColor: colors.borderHairline,
      paddingVertical: 5,
      paddingHorizontal: isAtelier ? 2 : 6,
      alignItems: "center",
    },
    tableRowAlt: {
      backgroundColor: isAtelier ? "transparent" : colors.tableRowAltBg,
    },
    th: {
      fontFamily: fonts.title,
      fontSize: 7,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: colors.accentGold,
    },
    td: {
      fontSize: 8,
      color: colors.textPrimary,
      lineHeight: 1.3,
    },
    tdBold: {
      fontSize: 8,
      fontFamily: fonts.title,
      color: colors.textPrimary,
      lineHeight: 1.3,
    },
    colDesc: {
      flex: 5,
      paddingRight: 8,
    },
    colQty: {
      flex: 1,
      textAlign: "center",
    },
    colPrice: {
      flex: 2,
      textAlign: "right",
      paddingRight: 4,
    },
    colTotal: {
      flex: 2.2,
      textAlign: "right",
    },

    // Totals Section
    totalsWrapper: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginBottom: 14,
    },
    totalsBox: {
      width: 210,
      padding: isAtelier ? 6 : 8,
      backgroundColor: isAtelier ? "transparent" : colors.cardBg,
      borderWidth: isAtelier ? 0 : 0.5,
      borderColor: colors.borderHairline,
      borderRadius: 1,
    },
    totalsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 2,
    },
    totalsLabel: {
      fontSize: 7.5,
      color: colors.textSecondary,
    },
    totalsValue: {
      fontSize: 7.5,
      color: colors.textPrimary,
    },
    grandTotalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      borderTopWidth: 0.75,
      borderTopColor: colors.accentGold,
      marginTop: 4,
      paddingTop: 4,
    },
    grandTotalLabel: {
      fontFamily: fonts.title,
      fontSize: isMaison ? 10.5 : 9.5,
      color: colors.textPrimary,
    },
    grandTotalValue: {
      fontFamily: fonts.title,
      fontSize: isMaison ? 10.5 : 9.5,
      color: colors.accentGold,
    },

    // Intentional Closure Group: Payment Details & Notes & Terms & Signatures
    closureGroup: {
      marginTop: 4,
      position: "relative",
    },
    maisonWatermark: {
      position: "absolute",
      right: 8,
      top: 4,
      width: 76,
      height: 76,
      opacity: 0.07,
    },

    // Payment Details & Notes Row
    paymentNotesRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 12,
    },
    paymentBox: {
      flex: 1,
      padding: isAtelier ? 7 : 9,
      backgroundColor: isAtelier ? "transparent" : colors.cardBg,
      borderWidth: isAtelier ? 0 : 0.5,
      borderLeftWidth: isAtelier ? 1.5 : 0.5,
      borderColor: isAtelier ? colors.accentGold : colors.borderHairline,
      borderRadius: 1,
    },
    notesBox: {
      flex: 1,
      padding: isAtelier ? 7 : 9,
      backgroundColor: isAtelier ? "transparent" : colors.cardBg,
      borderWidth: isAtelier ? 0 : 0.5,
      borderLeftWidth: isAtelier ? 1.5 : 0.5,
      borderColor: isAtelier ? colors.accentGold : colors.borderHairline,
      borderRadius: 1,
    },
    sectionMiniHeader: {
      fontFamily: fonts.title,
      fontSize: 6.5,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: colors.accentGold,
      marginBottom: 3,
    },
    paymentItemBold: {
      fontFamily: fonts.title,
      fontSize: 7.5,
      color: colors.textPrimary,
      marginBottom: 1.5,
    },
    paymentItem: {
      fontSize: 7,
      color: colors.textSecondary,
      lineHeight: 1.35,
    },
    notesText: {
      fontSize: 7,
      color: colors.textSecondary,
      lineHeight: 1.35,
    },

    // Terms & Conditions Block
    termsBlock: {
      padding: isAtelier ? 6 : 8,
      backgroundColor: isAtelier ? "transparent" : colors.cardBg,
      borderWidth: isAtelier ? 0 : 0.5,
      borderColor: colors.borderHairline,
      borderRadius: 1,
      marginBottom: 14,
    },
    termsHeader: {
      fontFamily: fonts.title,
      fontSize: 6.5,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: colors.accentGold,
      marginBottom: 3,
    },
    termItem: {
      fontSize: 6.8,
      color: colors.textSecondary,
      lineHeight: 1.35,
      marginBottom: 1.5,
    },

    // Signatures Row
    signaturesRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 24,
      paddingTop: 10,
      borderTopWidth: isAtelier ? 0.5 : 0.5,
      borderTopColor: colors.borderHairline,
      marginBottom: 6,
    },
    signatureBlock: {
      flex: 1,
      alignItems: "center",
    },
    signatureImageContainer: {
      height: 38,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 2,
    },
    signatureImage: {
      maxHeight: 36,
      maxWidth: 140,
      objectFit: "contain",
    },
    signatureLine: {
      width: "100%",
      borderTopWidth: 0.5,
      borderTopColor: colors.borderHairline,
      paddingTop: 3,
      alignItems: "center",
    },
    signatureName: {
      fontFamily: fonts.title,
      fontSize: 7.5,
      color: colors.textPrimary,
      textAlign: "center",
    },
    signatureRole: {
      fontSize: 6.5,
      color: colors.textSecondary,
      marginTop: 1,
      textAlign: "center",
    },

    // Running Footer
    runningFooter: {
      position: "absolute",
      bottom: 20,
      left: 36,
      right: 36,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderTopWidth: 0.5,
      borderTopColor: colors.borderHairline,
      paddingTop: 5,
    },
    runningFooterText: {
      fontSize: 6.5,
      color: colors.textMuted,
      letterSpacing: 0.4,
    },
    runningFooterPage: {
      fontSize: 6.5,
      color: colors.textMuted,
      letterSpacing: 0.4,
    },
  });
}
