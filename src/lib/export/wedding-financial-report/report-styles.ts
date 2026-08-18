import { StyleSheet } from "@react-pdf/renderer";

export const PDF_COLORS = {
  charcoal: "#1C1A17",
  charcoalLight: "#2C2925",
  gold: "#B88A2A",
  goldLight: "#D4AF37",
  goldMuted: "#8C6A1E",
  champagne: "#EAD8B8",
  warmIvory: "#F7F1E8",
  warmWhite: "#FCFAF7",
  slate: "#7A756D",
  slateDim: "#A5A096",
  hairline: "#EAE4D9",
  cardBg: "#F9F6F0",
  success: "#2D6A4F",
  warning: "#9A6B1F",
  danger: "#9E2A2B",
};

export const styles = StyleSheet.create({
  // Page Styles
  page: {
    fontFamily: "Helvetica",
    fontSize: 8.5,
    paddingHorizontal: 40,
    paddingTop: 36,
    paddingBottom: 48,
    color: PDF_COLORS.charcoal,
    backgroundColor: PDF_COLORS.warmWhite,
    position: "relative",
  },
  coverPage: {
    fontFamily: "Helvetica",
    fontSize: 9,
    paddingHorizontal: 48,
    paddingTop: 54,
    paddingBottom: 54,
    color: PDF_COLORS.charcoal,
    backgroundColor: PDF_COLORS.warmWhite,
    justifyContent: "space-between",
  },

  // Running Header
  runningHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
    marginBottom: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: PDF_COLORS.hairline,
  },
  runningHeaderBrand: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    letterSpacing: 1.5,
    color: PDF_COLORS.goldMuted,
    textTransform: "uppercase",
  },
  runningHeaderDoc: {
    fontFamily: "Helvetica",
    fontSize: 7,
    letterSpacing: 0.8,
    color: PDF_COLORS.slate,
    textTransform: "uppercase",
  },

  // Running Footer
  runningFooter: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: PDF_COLORS.hairline,
  },
  runningFooterText: {
    fontFamily: "Helvetica",
    fontSize: 6.5,
    color: PDF_COLORS.slateDim,
    letterSpacing: 0.5,
  },
  runningFooterPage: {
    fontFamily: "Helvetica",
    fontSize: 6.5,
    color: PDF_COLORS.slate,
  },

  // Cover Page Elements
  coverTop: {
    alignItems: "flex-start",
  },
  coverBrandLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    letterSpacing: 2.2,
    color: PDF_COLORS.gold,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  coverEditionLabel: {
    fontFamily: "Helvetica",
    fontSize: 7.5,
    letterSpacing: 1.2,
    color: PDF_COLORS.slate,
    textTransform: "uppercase",
  },
  coverCenter: {
    marginTop: 60,
    marginBottom: 60,
  },
  coverTitleMain: {
    fontFamily: "Times-Bold",
    fontSize: 34,
    letterSpacing: 0.5,
    color: PDF_COLORS.charcoal,
    lineHeight: 1.15,
    marginBottom: 6,
  },
  coverTitleSub: {
    fontFamily: "Times-Roman",
    fontSize: 26,
    color: PDF_COLORS.gold,
    letterSpacing: 0.5,
    marginBottom: 32,
  },
  coverDivider: {
    width: 48,
    height: 1,
    backgroundColor: PDF_COLORS.gold,
    marginBottom: 32,
  },
  coverCoupleName: {
    fontFamily: "Times-Bold",
    fontSize: 20,
    color: PDF_COLORS.charcoal,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  coverMetadataText: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: PDF_COLORS.slate,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  coverBottom: {
    borderTopWidth: 0.5,
    borderTopColor: PDF_COLORS.hairline,
    paddingTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  coverConfidentialNotice: {
    fontFamily: "Helvetica",
    fontSize: 7,
    color: PDF_COLORS.slateDim,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  coverSignatureStamp: {
    fontFamily: "Times-Roman",
    fontSize: 8,
    color: PDF_COLORS.charcoal,
    fontStyle: "italic",
  },

  // Section Header
  sectionHeader: {
    marginBottom: 18,
  },
  sectionPreTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    letterSpacing: 1.8,
    color: PDF_COLORS.gold,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  sectionTitle: {
    fontFamily: "Times-Bold",
    fontSize: 18,
    letterSpacing: 0.3,
    color: PDF_COLORS.charcoal,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontFamily: "Times-Roman",
    fontSize: 9.5,
    color: PDF_COLORS.slate,
    lineHeight: 1.35,
  },

  // Primary Metrics Row (KPIs)
  kpiRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: PDF_COLORS.cardBg,
    borderWidth: 0.5,
    borderColor: PDF_COLORS.hairline,
    padding: 12,
    minHeight: 64,
    justifyContent: "space-between",
  },
  kpiCardHighlighted: {
    flex: 1,
    backgroundColor: "#F4EDE1",
    borderWidth: 0.5,
    borderColor: PDF_COLORS.champagne,
    padding: 12,
    minHeight: 64,
    justifyContent: "space-between",
  },
  kpiLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 6.5,
    letterSpacing: 1,
    color: PDF_COLORS.slate,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  kpiValue: {
    fontFamily: "Times-Bold",
    fontSize: 16,
    color: PDF_COLORS.charcoal,
    letterSpacing: -0.2,
  },
  kpiValueGold: {
    fontFamily: "Times-Bold",
    fontSize: 16,
    color: PDF_COLORS.goldMuted,
    letterSpacing: -0.2,
  },
  kpiSubtext: {
    fontFamily: "Helvetica",
    fontSize: 6.5,
    color: PDF_COLORS.slateDim,
    marginTop: 3,
  },

  // Metadata Panel
  metaGrid: {
    flexDirection: "row",
    backgroundColor: PDF_COLORS.cardBg,
    borderWidth: 0.5,
    borderColor: PDF_COLORS.hairline,
    padding: 12,
    marginBottom: 20,
  },
  metaCol: {
    flex: 1,
    paddingHorizontal: 8,
  },
  metaColDivider: {
    borderRightWidth: 0.5,
    borderRightColor: PDF_COLORS.hairline,
  },
  metaLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 6.5,
    letterSpacing: 0.8,
    color: PDF_COLORS.slateDim,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  metaValue: {
    fontFamily: "Helvetica",
    fontSize: 8,
    color: PDF_COLORS.charcoal,
  },

  // Table Styles
  table: {
    width: "100%",
    marginBottom: 16,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#F2EBE0",
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.gold,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: PDF_COLORS.hairline,
    paddingVertical: 5.5,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  tableRowAlternate: {
    backgroundColor: "#FAF7F2",
  },
  th: {
    fontFamily: "Helvetica-Bold",
    fontSize: 6.5,
    letterSpacing: 0.8,
    color: PDF_COLORS.charcoal,
    textTransform: "uppercase",
  },
  td: {
    fontFamily: "Helvetica",
    fontSize: 7.5,
    color: PDF_COLORS.charcoal,
  },
  tdMuted: {
    fontFamily: "Helvetica",
    fontSize: 7.5,
    color: PDF_COLORS.slate,
  },
  tdBold: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    color: PDF_COLORS.charcoal,
  },
  tdGold: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    color: PDF_COLORS.goldMuted,
  },
  tdRight: {
    textAlign: "right",
  },
  tdCenter: {
    textAlign: "center",
  },

  // Status Badge
  statusBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 2,
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    textAlign: "center",
  },
  statusPaid: {
    backgroundColor: "#E8F5E9",
    color: "#2E7D32",
  },
  statusPartial: {
    backgroundColor: "#FFF8E1",
    color: "#F57F17",
  },
  statusPending: {
    backgroundColor: "#EDE7F6",
    color: "#512DA8",
  },
  statusPlanned: {
    backgroundColor: "#ECEFF1",
    color: "#546E7A",
  },

  // Bar Chart Primitives
  barRow: {
    marginBottom: 10,
  },
  barLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  barCategoryName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    color: PDF_COLORS.charcoal,
  },
  barCategoryValues: {
    fontFamily: "Helvetica",
    fontSize: 7,
    color: PDF_COLORS.slate,
  },
  barTrack: {
    height: 5,
    backgroundColor: "#ECE6DC",
    borderRadius: 1,
    overflow: "hidden",
    flexDirection: "row",
  },
  barFillPaid: {
    height: "100%",
    backgroundColor: PDF_COLORS.gold,
  },
  barFillOutstanding: {
    height: "100%",
    backgroundColor: PDF_COLORS.champagne,
  },

  // Empty State Box
  emptyState: {
    padding: 24,
    backgroundColor: PDF_COLORS.cardBg,
    borderWidth: 0.5,
    borderColor: PDF_COLORS.hairline,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 12,
  },
  emptyStateTitle: {
    fontFamily: "Times-Bold",
    fontSize: 10,
    color: PDF_COLORS.charcoal,
    marginBottom: 4,
  },
  emptyStateText: {
    fontFamily: "Helvetica",
    fontSize: 7.5,
    color: PDF_COLORS.slate,
    textAlign: "center",
    lineHeight: 1.3,
  },

  // Closing Page
  closingContainer: {
    paddingTop: 40,
    paddingBottom: 20,
  },
  closingStatementBox: {
    backgroundColor: PDF_COLORS.cardBg,
    borderWidth: 0.5,
    borderColor: PDF_COLORS.hairline,
    padding: 20,
    marginBottom: 32,
  },
  closingStatementText: {
    fontFamily: "Times-Roman",
    fontSize: 10,
    color: PDF_COLORS.charcoalLight,
    lineHeight: 1.5,
    fontStyle: "italic",
    textAlign: "justify",
  },
  closingSignaturesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 40,
  },
  closingSignatureBlock: {
    width: "45%",
    borderTopWidth: 0.5,
    borderTopColor: PDF_COLORS.charcoal,
    paddingTop: 8,
  },
  closingSignatureTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    color: PDF_COLORS.charcoal,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  closingSignatureSub: {
    fontFamily: "Helvetica",
    fontSize: 6.5,
    color: PDF_COLORS.slate,
  },
});
