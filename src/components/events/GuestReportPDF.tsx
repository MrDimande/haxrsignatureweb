import React from "react";
import {
  Document,
  Image,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import {
  eventReportHeader,
  formatEventDate,
  formatGeneratedAtTimestamp,
  formatGuestContact,
  formatGuestSeat,
  formatTableName,
  HUMAN_RSVP_LABELS,
  resolveGuestCompanionInfo,
  type GuestEventReport,
} from "@/lib/events/export/report";
import {
  buildOperationalConclusionData,
  buildPresentationTableCards,
  computeBalancedGuestRegistryPages,
  formatCoverEventType,
  resolveBrandPdfTokens,
  type BrandPdfTokens,
} from "@/lib/events/export/pdf-presentation";

export interface GuestReportPDFProps {
  report: GuestEventReport;
  logoUrl?: string;
  coverLogoUrl?: string;
  signatureMarkUrl?: string;
  businessName?: string;
}

export default function GuestReportPDF({
  report,
  logoUrl,
  coverLogoUrl,
  signatureMarkUrl,
  businessName,
}: GuestReportPDFProps) {
  const {
    event,
    guests,
    stats,
    readiness,
    dietaryGuests,
    messageGuests,
    tableGroups,
    unassignedGuests,
  } = report;

  const isSocial = readiness.isSocialEvent;
  const hasSeating = readiness.hasSeating;
  const isZeroGuests = guests.length === 0;
  const showExactSeat = readiness.shouldReportExactSeat && !isSocial;

  // Resolução rigorosa de identidade e tokens visuais por empresa
  const brandTokens = resolveBrandPdfTokens(
    businessName,
    event.businessId,
    logoUrl
  );
  const colors = brandTokens.colors;

  // Logótipos e Marca de Assinatura
  const resolvedHeroLogo = coverLogoUrl || logoUrl || brandTokens.heroLogoPath;
  const resolvedNavLogo = logoUrl || brandTokens.navLogoPath;
  const resolvedSignatureMark = signatureMarkUrl || brandTokens.signatureMarkPath;

  // Apenas exibe coluna de Entidade em eventos corporativos com dados reais
  const hasEntityData = !isSocial && guests.some((g) => Boolean(g.groupName && g.groupName.trim().length > 0));

  // Paginação balanceada determinística de convidados
  const guestRegistryPages = computeBalancedGuestRegistryPages(guests, 24, 32);

  // Cartões de apresentação de mesas com suporte a continuação elegante para mesas grandes
  const presentationTableCards = buildPresentationTableCards(tableGroups, {
    shouldReportExactSeat: showExactSeat,
  });

  // Dados factuais para conclusão operacional
  const conclusionData = buildOperationalConclusionData(report);

  const styles = StyleSheet.create({
    // ── Base Page ──
    page: {
      fontFamily: "Helvetica",
      fontSize: 8,
      paddingTop: 28,
      paddingBottom: 38,
      paddingHorizontal: 36,
      color: colors.textPrimary,
      backgroundColor: colors.pageBg,
    },

    // ── Standalone Luxury Cover Page ──
    coverPage: {
      fontFamily: "Helvetica",
      fontSize: 9,
      paddingTop: 54,
      paddingBottom: 54,
      paddingHorizontal: 48,
      color: colors.textPrimary,
      backgroundColor: colors.pageBg,
      justifyContent: "space-between",
    },
    coverTop: {
      alignItems: "flex-start",
    },
    coverHeroLogoContainer: {
      width: 140,
      height: 42,
      justifyContent: "center",
      marginBottom: 8,
    },
    coverHeroLogo: {
      width: 140,
      height: 40,
      objectFit: "contain",
      objectPosition: "left",
    },
    coverBrandLabel: {
      fontFamily: "Times-Bold",
      fontSize: 16,
      letterSpacing: 1.5,
      color: colors.goldDark,
      textTransform: "uppercase",
      marginBottom: 4,
    },
    coverEditionLabel: {
      fontFamily: "Helvetica-Bold",
      fontSize: 7.5,
      letterSpacing: 1.2,
      color: colors.textMuted,
      textTransform: "uppercase",
    },
    coverCenter: {
      marginTop: 36,
      marginBottom: 36,
    },
    coverPreTitle: {
      fontFamily: "Helvetica-Bold",
      fontSize: 7.5,
      letterSpacing: 1.8,
      textTransform: "uppercase",
      color: colors.goldDark,
      marginBottom: 6,
    },
    coverTitleMain: {
      fontFamily: "Times-Bold",
      fontSize: 28,
      letterSpacing: 0.5,
      color: colors.textPrimary,
      lineHeight: 1.15,
      marginBottom: 4,
    },
    coverTitleSub: {
      fontFamily: "Times-Roman",
      fontSize: 20,
      letterSpacing: 0.5,
      color: colors.goldDark,
      marginBottom: 20,
    },
    coverDivider: {
      width: 48,
      height: 1,
      backgroundColor: colors.goldAccent,
      marginBottom: 22,
    },
    coverEventName: {
      fontFamily: "Times-Bold",
      fontSize: 18,
      color: colors.textPrimary,
      marginBottom: 6,
      letterSpacing: 0.3,
    },
    coverEventType: {
      fontFamily: "Helvetica-Bold",
      fontSize: 8,
      letterSpacing: 1.4,
      color: colors.goldDark,
      textTransform: "uppercase",
      marginBottom: 6,
    },
    coverMetadataText: {
      fontFamily: "Helvetica",
      fontSize: 8.5,
      color: colors.textSecondary,
      marginBottom: 3,
      letterSpacing: 0.2,
    },
    coverBottom: {
      borderTopWidth: 0.5,
      borderTopColor: colors.cardBorder,
      paddingTop: 14,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
    },
    coverConfidentialNotice: {
      fontFamily: "Helvetica-Bold",
      fontSize: 6.5,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: colors.textMuted,
      marginBottom: 2,
    },
    coverTimestamp: {
      fontFamily: "Helvetica",
      fontSize: 6.5,
      color: colors.textMuted,
    },
    coverSignatureStamp: {
      fontFamily: "Times-Italic",
      fontSize: 8,
      color: colors.textPrimary,
    },

    // ── Running Header & Footer ──
    runningHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 0.5,
      borderBottomColor: colors.cardBorder,
      paddingBottom: 5,
      marginBottom: 14,
    },
    runningHeaderLeft: {
      fontFamily: "Helvetica-Bold",
      fontSize: 6.5,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      color: colors.goldDark,
    },
    runningHeaderRight: {
      fontSize: 7,
      color: colors.textMuted,
    },
    footer: {
      position: "absolute",
      bottom: 14,
      left: 36,
      right: 36,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderTopWidth: 0.5,
      borderTopColor: colors.cardBorder,
      paddingTop: 5,
    },
    footerText: {
      fontSize: 6.5,
      color: colors.textMuted,
    },
    footerBrand: {
      fontFamily: "Helvetica-Bold",
      fontSize: 6.5,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: colors.goldDark,
    },

    // ── Chapter & Section Headers ──
    chapterHeader: {
      marginBottom: 14,
    },
    chapterPreTitle: {
      fontFamily: "Helvetica-Bold",
      fontSize: 6.5,
      letterSpacing: 1.4,
      textTransform: "uppercase",
      color: colors.goldDark,
      marginBottom: 3,
    },
    chapterTitle: {
      fontFamily: "Times-Bold",
      fontSize: 16,
      letterSpacing: 0.4,
      color: colors.textPrimary,
      marginBottom: 3,
    },
    chapterSubtitle: {
      fontFamily: "Times-Roman",
      fontSize: 8.5,
      color: colors.textMuted,
      lineHeight: 1.3,
    },

    // ── Event Identity Strip (Internal Pages) ──
    eventIdentityStrip: {
      backgroundColor: colors.cardBg,
      borderWidth: 0.5,
      borderColor: colors.cardBorder,
      borderRadius: 1,
      paddingVertical: 5,
      paddingHorizontal: 8,
      marginBottom: 12,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    eventIdentityName: {
      fontFamily: "Times-Bold",
      fontSize: 10.5,
      color: colors.textPrimary,
      marginBottom: 1,
    },
    eventIdentityMeta: {
      fontSize: 7,
      color: colors.textSecondary,
    },
    eventDateBadge: {
      backgroundColor: colors.goldLightBg,
      borderWidth: 0.5,
      borderColor: colors.goldBorder,
      borderRadius: 1,
      paddingVertical: 2.5,
      paddingHorizontal: 6,
    },
    eventDateBadgeText: {
      fontFamily: "Helvetica-Bold",
      fontSize: 6.5,
      color: colors.goldDark,
    },

    // ── Executive Editorial Metric Grid ──
    editorialMetricGrid: {
      backgroundColor: colors.cardBg,
      borderWidth: 0.5,
      borderColor: colors.cardBorder,
      borderRadius: 1,
      paddingVertical: 8,
      paddingHorizontal: 6,
      marginBottom: 10,
    },
    primaryMetricsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingBottom: 8,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.borderHairline,
    },
    metricItem: {
      flex: 1,
      alignItems: "center",
    },
    metricDivider: {
      width: 0.5,
      height: 24,
      backgroundColor: colors.cardBorder,
    },
    metricLabel: {
      fontFamily: "Helvetica-Bold",
      fontSize: 6,
      letterSpacing: 0.8,
      color: colors.textMuted,
      textTransform: "uppercase",
      marginBottom: 2,
    },
    metricValue: {
      fontFamily: "Times-Bold",
      fontSize: 14,
      color: colors.textPrimary,
    },
    metricUnit: {
      fontFamily: "Helvetica",
      fontSize: 7,
      color: colors.textMuted,
    },

    secondaryMetricsRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      paddingTop: 8,
    },
    secondaryMetricItem: {
      alignItems: "center",
      paddingHorizontal: 4,
    },
    secondaryMetricLabel: {
      fontFamily: "Helvetica-Bold",
      fontSize: 5.5,
      letterSpacing: 0.6,
      color: colors.textMuted,
      textTransform: "uppercase",
      marginBottom: 1.5,
    },
    secondaryMetricValue: {
      fontFamily: "Helvetica-Bold",
      fontSize: 8.5,
      color: colors.textPrimary,
    },

    // ── Operational Status Area ──
    readinessCard: {
      backgroundColor: colors.cardBg,
      borderWidth: 0.5,
      borderColor: colors.cardBorder,
      borderRadius: 1,
      paddingVertical: 6,
      paddingHorizontal: 8,
      marginBottom: 12,
    },
    readinessHeader: {
      fontFamily: "Helvetica-Bold",
      fontSize: 6.5,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: colors.goldDark,
      marginBottom: 5,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.borderHairline,
      paddingBottom: 3,
    },
    readinessGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    readinessItem: {
      width: "48%",
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 2.5,
    },
    readinessItemLabel: {
      fontFamily: "Helvetica-Bold",
      fontSize: 6.5,
      color: colors.textSecondary,
      width: "35%",
    },
    readinessItemValue: {
      fontSize: 7,
      color: colors.textPrimary,
      width: "65%",
    },

    // ── Master Table ──
    tableHeader: {
      flexDirection: "row",
      backgroundColor: "#2E2A24",
      paddingVertical: 4,
      paddingHorizontal: 4,
      borderTopLeftRadius: 1,
      borderTopRightRadius: 1,
      marginBottom: 1,
    },
    headerCellText: {
      fontFamily: "Helvetica-Bold",
      fontSize: 6.5,
      letterSpacing: 0.4,
      color: "#FFFFFF",
      textTransform: "uppercase",
    },
    tableRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 3,
      paddingHorizontal: 4,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.borderHairline,
    },
    tableRowAlt: {
      backgroundColor: "#F9F7F4",
    },
    cellText: {
      fontSize: 7,
      color: colors.textPrimary,
    },
    cellTextMuted: {
      fontSize: 7,
      color: colors.textMuted,
    },
    cellGuestName: {
      fontFamily: "Helvetica-Bold",
      fontSize: 7.5,
      color: colors.textPrimary,
    },
    cellGuestType: {
      fontSize: 6.5,
      color: colors.textMuted,
    },
    cellContact: {
      fontSize: 6.5,
      color: colors.textSecondary,
    },

    // ── Badges ──
    badgeConfirmed: {
      backgroundColor: colors.statusConfirmedBg,
      borderWidth: 0.5,
      borderColor: colors.statusConfirmedBorder,
      borderRadius: 1,
      paddingVertical: 1,
      paddingHorizontal: 4,
      alignSelf: "flex-start",
    },
    badgeTextConfirmed: {
      fontFamily: "Helvetica-Bold",
      fontSize: 6,
      color: colors.statusConfirmedText,
      textTransform: "uppercase",
    },
    badgeCheckedIn: {
      backgroundColor: colors.statusCheckedInBg,
      borderWidth: 0.5,
      borderColor: colors.statusCheckedInBorder,
      borderRadius: 1,
      paddingVertical: 1,
      paddingHorizontal: 4,
      alignSelf: "flex-start",
    },
    badgeTextCheckedIn: {
      fontFamily: "Helvetica-Bold",
      fontSize: 6,
      color: colors.statusCheckedInText,
      textTransform: "uppercase",
    },
    badgeInvited: {
      backgroundColor: colors.statusInvitedBg,
      borderWidth: 0.5,
      borderColor: colors.statusInvitedBorder,
      borderRadius: 1,
      paddingVertical: 1,
      paddingHorizontal: 4,
      alignSelf: "flex-start",
    },
    badgeTextInvited: {
      fontFamily: "Helvetica-Bold",
      fontSize: 6,
      color: colors.statusInvitedText,
      textTransform: "uppercase",
    },
    badgeDeclined: {
      backgroundColor: colors.statusDeclinedBg,
      borderWidth: 0.5,
      borderColor: colors.statusDeclinedBorder,
      borderRadius: 1,
      paddingVertical: 1,
      paddingHorizontal: 4,
      alignSelf: "flex-start",
    },
    badgeTextDeclined: {
      fontFamily: "Helvetica-Bold",
      fontSize: 6,
      color: colors.statusDeclinedText,
      textTransform: "uppercase",
    },

    // ── Dietary Rows (Editorial Hairline) ──
    dietaryRow: {
      borderBottomWidth: 0.5,
      borderBottomColor: colors.cardBorder,
      paddingVertical: 5,
      paddingHorizontal: 2,
      marginBottom: 3,
    },
    dietaryHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 2,
    },
    dietaryGuestName: {
      fontFamily: "Times-Bold",
      fontSize: 9,
      color: colors.textPrimary,
    },
    dietaryLocation: {
      fontFamily: "Helvetica-Bold",
      fontSize: 7,
      color: colors.goldDark,
    },
    dietaryText: {
      fontSize: 7.5,
      color: colors.statusDeclinedText,
    },
    dietaryPrefix: {
      fontFamily: "Helvetica-Bold",
      fontSize: 7,
      color: colors.textSecondary,
    },

    // ── Seating Map Block ──
    tableBlock: {
      marginBottom: 8,
      borderWidth: 0.5,
      borderColor: colors.cardBorder,
      borderRadius: 1,
      overflow: "hidden",
    },
    tableHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.cardBg,
      paddingVertical: 4,
      paddingHorizontal: 6,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.cardBorder,
      borderLeftWidth: 2.5,
      borderLeftColor: colors.goldAccent,
    },
    tableNameText: {
      fontFamily: "Times-Bold",
      fontSize: 9,
      color: colors.textPrimary,
    },
    tableCapacityText: {
      fontSize: 6.5,
      color: colors.textMuted,
    },
    seatRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 3,
      paddingHorizontal: 6,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.borderHairline,
    },
    seatGuestText: {
      width: "55%",
      fontFamily: "Helvetica-Bold",
      fontSize: 7.5,
      color: colors.textPrimary,
    },
    seatStatusCol: {
      width: "45%",
      alignItems: "flex-end",
    },

    // ── Message Cards ──
    messageCard: {
      backgroundColor: colors.cardBg,
      borderWidth: 0.5,
      borderColor: colors.cardBorder,
      borderRadius: 1,
      paddingVertical: 6,
      paddingHorizontal: 8,
      marginBottom: 6,
    },
    messageHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 3,
    },
    messageGuestName: {
      fontFamily: "Times-Bold",
      fontSize: 9,
      color: colors.textPrimary,
    },
    messageContent: {
      fontFamily: "Times-Italic",
      fontSize: 8,
      lineHeight: 1.35,
      color: colors.textSecondary,
    },

    // ── Empty State ──
    emptyEditorialBlock: {
      borderWidth: 0.5,
      borderColor: colors.cardBorder,
      backgroundColor: colors.cardBg,
      borderRadius: 1,
      paddingVertical: 32,
      paddingHorizontal: 16,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 20,
    },
    emptyEditorialTitle: {
      fontFamily: "Times-Bold",
      fontSize: 11,
      letterSpacing: 1.5,
      textTransform: "uppercase",
      color: colors.textPrimary,
      marginBottom: 6,
    },
    emptyEditorialSubtitle: {
      fontSize: 8,
      color: colors.textMuted,
      textAlign: "center",
    },

    // ── Operational Closing Stamp ──
    closingSection: {
      marginTop: 18,
      paddingTop: 10,
      borderTopWidth: 0.5,
      borderTopColor: colors.cardBorder,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    closingBrand: {
      fontFamily: "Times-Bold",
      fontSize: 8,
      color: colors.goldDark,
      letterSpacing: 0.5,
    },
    closingNotice: {
      fontFamily: "Helvetica",
      fontSize: 6.5,
      color: colors.textMuted,
    },
    // ── Conclusão Operacional ──
    conclusionGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 14,
      gap: 8,
    },
    conclusionMetricCard: {
      flex: 1,
      backgroundColor: colors.cardBg,
      borderWidth: 0.5,
      borderColor: colors.cardBorder,
      borderTopWidth: 2,
      borderTopColor: colors.goldAccent,
      paddingVertical: 8,
      paddingHorizontal: 8,
    },
    conclusionMetricLabel: {
      fontFamily: "Helvetica-Bold",
      fontSize: 6,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: colors.goldDark,
      marginBottom: 3,
    },
    conclusionMetricValue: {
      fontFamily: "Times-Bold",
      fontSize: 13,
      color: colors.textPrimary,
      marginBottom: 1,
    },
    conclusionMetricHint: {
      fontFamily: "Helvetica",
      fontSize: 6,
      color: colors.textMuted,
    },
    conclusionSectionCard: {
      backgroundColor: colors.cardBg,
      borderWidth: 0.5,
      borderColor: colors.cardBorder,
      padding: 10,
      marginBottom: 8,
    },
    conclusionSectionHeader: {
      fontFamily: "Helvetica-Bold",
      fontSize: 7,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: colors.goldDark,
      marginBottom: 6,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.cardBorder,
      paddingBottom: 3,
    },
    conclusionStatementRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 5,
    },
    conclusionBullet: {
      fontFamily: "Times-Bold",
      fontSize: 7.5,
      color: colors.goldAccent,
      marginRight: 5,
      marginTop: -1,
    },
    conclusionStatementText: {
      flex: 1,
      fontFamily: "Helvetica",
      fontSize: 7.5,
      lineHeight: 1.4,
      color: colors.textPrimary,
    },
    plannerCommentaryCard: {
      backgroundColor: colors.goldLightBg,
      borderWidth: 0.5,
      borderColor: colors.goldBorder,
      borderLeftWidth: 2.5,
      borderLeftColor: colors.goldAccent,
      padding: 10,
      marginTop: 4,
      marginBottom: 8,
    },
    plannerCommentaryTitle: {
      fontFamily: "Helvetica-Bold",
      fontSize: 7,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: colors.goldDark,
      marginBottom: 4,
    },
    plannerCommentaryText: {
      fontFamily: "Helvetica-Oblique",
      fontSize: 7.5,
      lineHeight: 1.4,
      color: colors.textPrimary,
    },

    // ── True Back Cover (Signature Noir / Corporate) ──
    backCoverNoirPage: {
      backgroundColor: "#0C0C0D",
      paddingTop: 64,
      paddingBottom: 54,
      paddingHorizontal: 48,
      justifyContent: "space-between",
      alignItems: "center",
      fontFamily: "Helvetica",
    },
    backCoverCorporatePage: {
      backgroundColor: "#FAFBFC",
      paddingTop: 64,
      paddingBottom: 54,
      paddingHorizontal: 48,
      justifyContent: "space-between",
      alignItems: "center",
      fontFamily: "Helvetica",
    },
    backCoverTop: {
      alignItems: "center",
      width: "100%",
    },
    backCoverMarkContainer: {
      height: 48,
      justifyContent: "center",
      alignItems: "center",
    },
    backCoverMarkLogo: {
      height: 46,
      width: 140,
      objectFit: "contain",
    },
    backCoverCenter: {
      alignItems: "center",
      justifyContent: "center",
      marginVertical: "auto",
      width: "100%",
    },
    backCoverTagline: {
      fontFamily: "Times-Bold",
      fontSize: 18,
      letterSpacing: 2.5,
      color: colors.goldAccent,
      textTransform: "uppercase",
      textAlign: "center",
      marginBottom: 6,
    },
    backCoverSubTagline: {
      fontFamily: "Times-Roman",
      fontSize: 13,
      letterSpacing: 2,
      color: "#F6F4EE",
      textTransform: "uppercase",
      textAlign: "center",
      marginBottom: 16,
    },
    backCoverSignatureContainer: {
      alignItems: "center",
      justifyContent: "center",
      marginVertical: 12,
    },
    backCoverSignatureImage: {
      width: 220,
      height: 86,
      objectFit: "contain",
    },
    backCoverBottom: {
      alignItems: "center",
      width: "100%",
      borderTopWidth: 0.5,
      borderTopColor: "rgba(201, 162, 39, 0.25)",
      paddingTop: 14,
    },
    backCoverBrandLabel: {
      fontFamily: "Times-Bold",
      fontSize: 9.5,
      letterSpacing: 3,
      color: "#FFFFFF",
      textTransform: "uppercase",
      marginBottom: 5,
    },
    backCoverLink: {
      textDecoration: "none",
    },
    backCoverWebsite: {
      fontFamily: "Helvetica-Bold",
      fontSize: 7.5,
      letterSpacing: 1.8,
      color: colors.goldAccent,
      textTransform: "lowercase",
      marginBottom: 5,
    },
    backCoverSocialRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 5,
    },
    backCoverSocialText: {
      fontFamily: "Helvetica",
      fontSize: 7.5,
      color: "#C2BBB2",
      letterSpacing: 0.6,
    },
    backCoverSocialDot: {
      fontSize: 7.5,
      color: "rgba(201, 162, 39, 0.5)",
      marginHorizontal: 7,
    },
    backCoverContactRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 6,
    },
    backCoverContactText: {
      fontFamily: "Helvetica",
      fontSize: 7.5,
      color: "#9A948B",
      letterSpacing: 0.5,
    },
    backCoverContactDot: {
      fontSize: 7.5,
      color: colors.goldAccent,
      marginHorizontal: 6,
    },
    backCoverExperienceText: {
      fontFamily: "Helvetica-Bold",
      fontSize: 5.5,
      letterSpacing: 2.2,
      color: "rgba(201, 162, 39, 0.6)",
      textTransform: "uppercase",
      marginTop: 2,
    },

    // Corporate Back Cover Elements
    backCoverCorpTagline: {
      fontFamily: "Helvetica-Bold",
      fontSize: 14,
      letterSpacing: 1.5,
      color: colors.textPrimary,
      textTransform: "uppercase",
      textAlign: "center",
      marginBottom: 6,
    },
    backCoverCorpSubTagline: {
      fontFamily: "Helvetica",
      fontSize: 9,
      letterSpacing: 1,
      color: colors.textSecondary,
      textTransform: "uppercase",
      textAlign: "center",
      marginBottom: 14,
    },
    backCoverCorpBottom: {
      alignItems: "center",
      width: "100%",
      borderTopWidth: 0.5,
      borderTopColor: colors.cardBorder,
      paddingTop: 16,
    },
    backCoverCorpBrandName: {
      fontFamily: "Helvetica-Bold",
      fontSize: 8.5,
      letterSpacing: 2,
      color: colors.textPrimary,
      textTransform: "uppercase",
      marginBottom: 4,
    },
    backCoverCorpNotice: {
      fontFamily: "Helvetica",
      fontSize: 6.5,
      color: colors.textMuted,
      textAlign: "center",
    },
  });

  function renderStatusBadge(status: string) {
    let badgeStyle = styles.badgeInvited;
    let textStyle = styles.badgeTextInvited;
    const label = HUMAN_RSVP_LABELS[status] || status;

    if (status === "confirmed") {
      badgeStyle = styles.badgeConfirmed;
      textStyle = styles.badgeTextConfirmed;
    } else if (status === "checked_in") {
      badgeStyle = styles.badgeCheckedIn;
      textStyle = styles.badgeTextCheckedIn;
    } else if (status === "declined") {
      badgeStyle = styles.badgeDeclined;
      textStyle = styles.badgeTextDeclined;
    }

    return (
      <View style={badgeStyle}>
        <Text style={textStyle}>{label}</Text>
      </View>
    );
  }

  // Helper para renderizar linhas da tabela de convidados
  function renderGuestTableRow(guest: (typeof guests)[0], index: number) {
    const companion = resolveGuestCompanionInfo(guest);
    const contactStr = formatGuestContact(guest);

    return (
      <View
        key={guest.id}
        style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}
        wrap={false}
      >
        <View style={{ width: "5%" }}>
          <Text style={styles.cellTextMuted}>{index + 1}</Text>
        </View>
        <View
          style={
            hasEntityData
              ? hasSeating
                ? { width: "26%", paddingRight: 3 }
                : { width: "30%", paddingRight: 3 }
              : hasSeating
                ? { width: "35%", paddingRight: 4 }
                : { width: "43%", paddingRight: 4 }
          }
        >
          <Text style={styles.cellGuestName}>{guest.name}</Text>
        </View>
        {hasEntityData ? (
          <View style={{ width: hasSeating ? "16%" : "18%", paddingRight: 3 }}>
            <Text style={styles.cellGuestType}>{guest.groupName || "—"}</Text>
          </View>
        ) : null}
        <View style={{ width: hasEntityData ? (hasSeating ? "14%" : "16%") : (hasSeating ? "16%" : "18%") }}>
          {renderStatusBadge(guest.status)}
        </View>
        <View style={{ width: hasEntityData ? (hasSeating ? "13%" : "15%") : (hasSeating ? "16%" : "18%"), paddingRight: 3 }}>
          <Text style={companion.count > 0 ? styles.cellText : styles.cellTextMuted}>
            {companion.formattedLabel}
          </Text>
        </View>
        {hasSeating ? (
          <View style={{ width: hasEntityData ? "13%" : "14%", paddingRight: 3 }}>
            <Text style={guest.seat ? styles.cellText : styles.cellTextMuted}>
              {guest.seat
                ? (readiness.shouldReportExactSeat && !isSocial)
                  ? formatGuestSeat(guest)
                  : formatTableName(guest.seat.tableName)
                : "Por distribuir"}
            </Text>
          </View>
        ) : null}
        <View
          style={{
            width: hasSeating
              ? hasEntityData
                ? "13%"
                : "14%"
              : hasEntityData
                ? "16%"
                : "16%",
          }}
        >
          <Text style={styles.cellContact}>{contactStr}</Text>
        </View>
      </View>
    );
  }

  return (
    <Document
      title={`${brandTokens.runningHeaderBrand} · ${event.name}`}
      author={brandTokens.brandName}
      subject={`Livro Oficial de Operações de Convidados & Banquete — ${event.name}`}
      creator={`${brandTokens.brandName} Event Operations`}
    >
      {/* ═════════════════════════════════════════════════════════════════
          PÁGINA 1 · STANDALONE LUXURY COVER PAGE
          ═════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={styles.coverPage}>
        {/* Top: Hero Brand */}
        <View style={styles.coverTop}>
          {resolvedHeroLogo ? (
            <View style={styles.coverHeroLogoContainer}>
              <Image src={resolvedHeroLogo} style={styles.coverHeroLogo} />
            </View>
          ) : (
            <Text style={styles.coverBrandLabel}>{brandTokens.brandUpper}</Text>
          )}
          <Text style={styles.coverEditionLabel}>{brandTokens.coverEditionLabel}</Text>
        </View>

        {/* Center: Editorial Book Titles & Event Details */}
        <View style={styles.coverCenter}>
          <Text style={styles.coverPreTitle}>LIVRO DE OPERAÇÕES</Text>
          <Text style={styles.coverTitleMain}>GUEST OPERATIONS</Text>
          <Text style={styles.coverTitleSub}>MASTER BOOK</Text>
          <View style={styles.coverDivider} />

          <Text style={styles.coverEventName}>{event.name}</Text>
          <Text style={styles.coverEventType}>{formatCoverEventType(event)}</Text>
          <Text style={styles.coverMetadataText}>{formatEventDate(event.date)}</Text>
          {event.location ? (
            <Text style={styles.coverMetadataText}>{event.location}</Text>
          ) : null}
          {!isZeroGuests ? (
            <Text style={[styles.coverMetadataText, { marginTop: 4, color: colors.textMuted }]}>
              {stats.primaryGuests} convites emitidos · {stats.expectedAttendance} pessoas previstas
            </Text>
          ) : null}
        </View>

        {/* Bottom: Confidential Notice & Signature Stamp */}
        <View style={styles.coverBottom}>
          <View>
            <Text style={styles.coverConfidentialNotice}>
              Documento Operacional Confidencial
            </Text>
            <Text style={styles.coverTimestamp}>
              Emissão: {formatGeneratedAtTimestamp(report.generatedAt)}
            </Text>
          </View>
          <Text style={styles.coverSignatureStamp}>
            {brandTokens.signatureStamp}
          </Text>
        </View>
      </Page>

      {/* ═════════════════════════════════════════════════════════════════
          PÁGINA 2 · EXECUTIVE GUEST OVERVIEW
          ═════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.runningHeader} fixed>
          <Text style={styles.runningHeaderLeft}>{brandTokens.runningHeaderBrand}</Text>
          <Text style={styles.runningHeaderRight}>{event.name} · Sumário Executivo</Text>
        </View>

        {/* Chapter Header */}
        <View style={styles.chapterHeader}>
          <Text style={styles.chapterPreTitle}>02 · SUMÁRIO EXECUTIVO</Text>
          <Text style={styles.chapterTitle}>POSIÇÃO GERAL DE CONVIDADOS & BANQUETE</Text>
          <Text style={styles.chapterSubtitle}>
            Leitura consolidada da presença, headcount e prontidão operacional do evento.
          </Text>
        </View>

        {/* Event Identity Strip */}
        <View style={styles.eventIdentityStrip}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eventIdentityName}>{event.name}</Text>
            <Text style={styles.eventIdentityMeta}>{eventReportHeader(event)}</Text>
          </View>
          <View style={styles.eventDateBadge}>
            <Text style={styles.eventDateBadgeText}>{formatEventDate(event.date)}</Text>
          </View>
        </View>

        {!isZeroGuests ? (
          <>
            {/* Primary & Secondary Editorial Metrics */}
            <View style={styles.editorialMetricGrid}>
              <View style={styles.primaryMetricsRow}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>CONVITES</Text>
                  <Text style={styles.metricValue}>{stats.primaryGuests}</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>BANQUETE (PREVISTO)</Text>
                  <Text style={[styles.metricValue, { color: colors.goldDark }]}>
                    {stats.expectedAttendance} <Text style={styles.metricUnit}>pessoas</Text>
                  </Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>CONFIRMADOS</Text>
                  <Text style={styles.metricValue}>{stats.confirmed}</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>ACOMPANHANTES</Text>
                  <Text style={styles.metricValue}>+{stats.plusOnesTotal}</Text>
                </View>
              </View>

              <View style={styles.secondaryMetricsRow}>
                <View style={styles.secondaryMetricItem}>
                  <Text style={styles.secondaryMetricLabel}>PENDENTES</Text>
                  <Text style={styles.secondaryMetricValue}>{stats.invited}</Text>
                </View>
                <View style={styles.secondaryMetricItem}>
                  <Text style={styles.secondaryMetricLabel}>RECUSADOS</Text>
                  <Text style={styles.secondaryMetricValue}>{stats.declined}</Text>
                </View>
                <View style={styles.secondaryMetricItem}>
                  <Text style={styles.secondaryMetricLabel}>TAXA RESPOSTA</Text>
                  <Text style={styles.secondaryMetricValue}>{stats.responseRate}%</Text>
                </View>
                {hasSeating ? (
                  <View style={styles.secondaryMetricItem}>
                    <Text style={styles.secondaryMetricLabel}>MESAS</Text>
                    <Text style={styles.secondaryMetricValue}>
                      {stats.assignedGuests}/{stats.primaryGuests} ({stats.uniqueTables} Mesas)
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Operational Readiness Status */}
            <View style={styles.readinessCard}>
              <Text style={styles.readinessHeader}>PRONTIDÃO OPERACIONAL DO EVENTO</Text>
              <View style={styles.readinessGrid}>
                <View style={styles.readinessItem}>
                  <Text style={styles.readinessItemLabel}>RSVP:</Text>
                  <Text style={styles.readinessItemValue}>{readiness.operationalStatus.rsvp}</Text>
                </View>
                <View style={styles.readinessItem}>
                  <Text style={styles.readinessItemLabel}>MESAS:</Text>
                  <Text style={styles.readinessItemValue}>{readiness.operationalStatus.seating}</Text>
                </View>
                <View style={styles.readinessItem}>
                  <Text style={styles.readinessItemLabel}>COZINHA:</Text>
                  <Text style={styles.readinessItemValue}>{readiness.operationalStatus.kitchen}</Text>
                </View>
                <View style={styles.readinessItem}>
                  <Text style={styles.readinessItemLabel}>CHECK-IN:</Text>
                  <Text style={styles.readinessItemValue}>{readiness.operationalStatus.checkIn}</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          /* Estado Vazio Restrito e Editorial */
          <View style={styles.emptyEditorialBlock}>
            <Text style={styles.emptyEditorialTitle}>LISTA DE CONVIDADOS AINDA NÃO INICIADA</Text>
            <Text style={styles.emptyEditorialSubtitle}>
              Nenhum registo de convidados foi inserido até ao momento para este evento.
            </Text>
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text style={styles.footerBrand}>{brandTokens.runningFooterBrand}</Text>
          <Text style={styles.footerText}>{event.name} · {formatEventDate(event.date)}</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>

      {/* ═════════════════════════════════════════════════════════════════
          CAPÍTULO 03 · REGISTO MESTRE DE CONVIDADOS (PÁGINAS BALANCEADAS)
          ═════════════════════════════════════════════════════════════════ */}
      {!isZeroGuests
        ? guestRegistryPages.map((pageGuests, pageIdx) => {
            const isFirstRegistryPage = pageIdx === 0;
            const startNumber = guestRegistryPages
              .slice(0, pageIdx)
              .reduce((acc, p) => acc + p.length, 0);

            return (
              <Page key={`guest-page-${pageIdx}`} size="A4" style={styles.page}>
                <View style={styles.runningHeader} fixed>
                  <Text style={styles.runningHeaderLeft}>{brandTokens.runningHeaderBrand}</Text>
                  <Text style={styles.runningHeaderRight}>
                    {event.name} · Registo Mestre {pageIdx > 0 ? `(Continuação ${pageIdx + 1})` : ""}
                  </Text>
                </View>

                {isFirstRegistryPage ? (
                  <View style={styles.chapterHeader}>
                    <Text style={styles.chapterPreTitle}>03 · REGISTO MESTRE</Text>
                    <Text style={styles.chapterTitle}>LISTA GERAL DE CONVIDADOS ({guests.length})</Text>
                    <Text style={styles.chapterSubtitle}>
                      Registo operacional de convidados para recepção, protocolo e coordenação.
                    </Text>
                  </View>
                ) : null}

                {/* Table Header */}
                <View style={styles.tableHeader} fixed>
                  <Text style={[styles.headerCellText, { width: "5%" }]}>Nº</Text>
                  <Text
                    style={[
                      styles.headerCellText,
                      hasEntityData
                        ? hasSeating
                          ? { width: "26%" }
                          : { width: "30%" }
                        : hasSeating
                          ? { width: "35%" }
                          : { width: "43%" },
                    ]}
                  >
                    Convidado Principal
                  </Text>
                  {hasEntityData ? (
                    <Text style={[styles.headerCellText, { width: hasSeating ? "16%" : "18%" }]}>
                      Entidade
                    </Text>
                  ) : null}
                  <Text style={[styles.headerCellText, { width: hasEntityData ? (hasSeating ? "14%" : "16%") : (hasSeating ? "16%" : "18%") }]}>
                    Estado RSVP
                  </Text>
                  <Text style={[styles.headerCellText, { width: hasEntityData ? (hasSeating ? "13%" : "15%") : (hasSeating ? "16%" : "18%") }]}>
                    Acompanhantes
                  </Text>
                  {hasSeating ? (
                    <Text style={[styles.headerCellText, { width: hasEntityData ? "13%" : "14%" }]}>
                      {readiness.shouldReportExactSeat && !isSocial ? "Mesa / Lugar" : "Mesa"}
                    </Text>
                  ) : null}
                  <Text
                    style={[
                      styles.headerCellText,
                      {
                        width: hasSeating
                          ? hasEntityData
                            ? "13%"
                            : "14%"
                          : hasEntityData
                            ? "16%"
                            : "16%",
                      },
                    ]}
                  >
                    Contacto
                  </Text>
                </View>

                {/* Guest Rows for this page */}
                {pageGuests.map((guest, rowIdx) =>
                  renderGuestTableRow(guest, startNumber + rowIdx)
                )}

                <View style={styles.footer} fixed>
                  <Text style={styles.footerBrand}>{brandTokens.runningFooterBrand}</Text>
                  <Text style={styles.footerText}>{event.name} · Registo Mestre</Text>
                  <Text
                    style={styles.footerText}
                    render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
                  />
                </View>
              </Page>
            );
          })
        : null}

      {/* ═════════════════════════════════════════════════════════════════
          CAPÍTULO · DISTRIBUIÇÃO POR MESA (SEATING ARCHITECTURE)
          ═════════════════════════════════════════════════════════════════ */}
      {hasSeating ? (
        <Page size="A4" style={styles.page}>
          <View style={styles.runningHeader} fixed>
            <Text style={styles.runningHeaderLeft}>{brandTokens.runningHeaderBrand}</Text>
            <Text style={styles.runningHeaderRight}>{event.name} · Mapa de Mesas</Text>
          </View>

          <View style={styles.chapterHeader}>
            <Text style={styles.chapterPreTitle}>DISTRIBUIÇÃO DE MESAS</Text>
            <Text style={styles.chapterTitle}>
              SEATING ARCHITECTURE ({tableGroups.length} {tableGroups.length === 1 ? "Mesa" : "Mesas"})
            </Text>
            <Text style={styles.chapterSubtitle}>
              Distribuição de lugares e acomodação de convidados por mesa.
            </Text>
          </View>

          {presentationTableCards.map((card) => (
            <View key={card.cardKey} style={styles.tableBlock} break={card.isContinuation}>
              <View style={styles.tableHeaderRow} minPresenceAhead={40} wrap={false}>
                <Text style={styles.tableNameText}>{card.displayTitle}</Text>
                <Text style={styles.tableCapacityText}>{card.capacityText}</Text>
              </View>
              {card.seats.map((seat) => {
                const guest = seat.guest!;
                return (
                  <View key={`seat-${card.cardKey}-${seat.seatNumber}`} style={styles.seatRow} wrap={false}>
                    <Text style={styles.seatGuestText}>
                      {showExactSeat ? `Lugar ${String(seat.seatNumber).padStart(2, "0")}${seat.label ? ` (${seat.label})` : ""} · ` : ""}
                      {guest.name}
                      {seat.companionInfo && seat.companionInfo.count > 0
                        ? ` (${seat.companionInfo.formattedLabel})`
                        : ""}
                    </Text>
                    <View style={styles.seatStatusCol}>
                      {renderStatusBadge(guest.status)}
                    </View>
                  </View>
                );
              })}
            </View>
          ))}

          {unassignedGuests.length > 0 ? (
            <View style={styles.tableBlock}>
              <View style={[styles.tableHeaderRow, { borderLeftColor: colors.statusDeclinedText }]} wrap={false}>
                <Text style={styles.tableNameText}>
                  POR DISTRIBUIR ({unassignedGuests.length})
                </Text>
                <Text style={styles.tableCapacityText}>A aguardar alocação de mesa</Text>
              </View>
              {unassignedGuests.map((guest) => {
                const companion = resolveGuestCompanionInfo(guest);
                return (
                  <View key={`unassigned-${guest.id}`} style={styles.seatRow} wrap={false}>
                    <Text style={styles.seatGuestText}>
                      {guest.name}
                      {companion.count > 0 ? ` (${companion.formattedLabel})` : ""}
                    </Text>
                    <View style={styles.seatStatusCol}>
                      {renderStatusBadge(guest.status)}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}

          <View style={styles.footer} fixed>
            <Text style={styles.footerBrand}>{brandTokens.runningFooterBrand}</Text>
            <Text style={styles.footerText}>{event.name} · Mapa de Mesas</Text>
            <Text
              style={styles.footerText}
              render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
            />
          </View>
        </Page>
      ) : null}

      {/* ═════════════════════════════════════════════════════════════════
          CAPÍTULO · MANIFESTO DE COZINHA & RESTRIÇÕES ALIMENTARES
          ═════════════════════════════════════════════════════════════════ */}
      {readiness.hasDietaryRequirements ? (
        <Page size="A4" style={styles.page}>
          <View style={styles.runningHeader} fixed>
            <Text style={styles.runningHeaderLeft}>{brandTokens.runningHeaderBrand}</Text>
            <Text style={styles.runningHeaderRight}>{event.name} · Manifesto de Cozinha</Text>
          </View>

          <View style={styles.chapterHeader}>
            <Text style={styles.chapterPreTitle}>MANIFESTO DE COZINHA</Text>
            <Text style={styles.chapterTitle}>
              RESTRIÇÕES ALIMENTARES & ALERGIAS ({dietaryGuests.length})
            </Text>
            <Text style={styles.chapterSubtitle}>
              {dietaryGuests.length}{" "}
              {dietaryGuests.length === 1 ? "convidado requer" : "convidados requerem"} atenção
              específica da equipa de catering.
            </Text>
          </View>

          {dietaryGuests.map((guest) => {
            const companion = resolveGuestCompanionInfo(guest);
            return (
              <View key={`diet-${guest.id}`} style={styles.dietaryRow} wrap={false}>
                <View style={styles.dietaryHeaderRow}>
                  <Text style={styles.dietaryGuestName}>
                    {guest.name}
                    {companion.count > 0 ? ` · ${companion.formattedLabel}` : ""}
                  </Text>
                  {hasSeating ? (
                    <Text style={styles.dietaryLocation}>
                      {guest.seat
                        ? readiness.shouldReportExactSeat && !isSocial
                          ? formatGuestSeat(guest)
                          : formatTableName(guest.seat.tableName)
                        : "Por distribuir"}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.dietaryText}>
                  <Text style={styles.dietaryPrefix}>Restrição: </Text>
                  {guest.dietaryNotes}
                </Text>
              </View>
            );
          })}

          <View style={styles.footer} fixed>
            <Text style={styles.footerBrand}>{brandTokens.runningFooterBrand}</Text>
            <Text style={styles.footerText}>{event.name} · Cozinha</Text>
            <Text
              style={styles.footerText}
              render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
            />
          </View>
        </Page>
      ) : null}

      {/* ═════════════════════════════════════════════════════════════════
          CAPÍTULO · MENSAGENS DOS CONVIDADOS & VOTOS
          ═════════════════════════════════════════════════════════════════ */}
      {readiness.hasGuestMessages ? (
        <Page size="A4" style={styles.page}>
          <View style={styles.runningHeader} fixed>
            <Text style={styles.runningHeaderLeft}>{brandTokens.runningHeaderBrand}</Text>
            <Text style={styles.runningHeaderRight}>{event.name} · Mensagens & Votos</Text>
          </View>

          <View style={styles.chapterHeader}>
            <Text style={styles.chapterPreTitle}>MENSAGENS & VOTOS</Text>
            <Text style={styles.chapterTitle}>
              VOTOS DOS CONVIDADOS ({messageGuests.length})
            </Text>
            <Text style={styles.chapterSubtitle}>
              Votos e mensagens afectivas enviadas pelos convidados no convite digital.
            </Text>
          </View>

          {messageGuests.map(({ guest, message }) => {
            const companion = resolveGuestCompanionInfo(guest);
            return (
              <View key={`msg-${guest.id}`} style={styles.messageCard} wrap={false}>
                <View style={styles.messageHeaderRow}>
                  <Text style={styles.messageGuestName}>
                    {guest.name}
                    {companion.count > 0 ? ` · ${companion.formattedLabel}` : ""}
                  </Text>
                </View>
                <Text style={styles.messageContent}>{`"${message}"`}</Text>
              </View>
            );
          })}

          <View style={styles.closingSection}>
            <Text style={styles.closingBrand}>{brandTokens.runningFooterBrand}</Text>
            <Text style={styles.closingNotice}>
              Documento oficial de coordenação e apoio ao evento.
            </Text>
          </View>

          <View style={styles.footer} fixed>
            <Text style={styles.footerBrand}>{brandTokens.runningFooterBrand}</Text>
            <Text style={styles.footerText}>{event.name} · Mensagens & Votos</Text>
            <Text
              style={styles.footerText}
              render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
            />
          </View>
        </Page>
      ) : null}

      {/* ═════════════════════════════════════════════════════════════════
          CAPÍTULO · CONCLUSÃO OPERACIONAL
          ═════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.runningHeader} fixed>
          <Text style={styles.runningHeaderLeft}>{brandTokens.runningHeaderBrand}</Text>
          <Text style={styles.runningHeaderRight}>{event.name} · Conclusão Operacional</Text>
        </View>

        <View style={styles.chapterHeader}>
          <Text style={styles.chapterPreTitle}>CONCLUSÃO OPERACIONAL</Text>
          <Text style={styles.chapterTitle}>SÍNTESE & LEITURA OPERACIONAL</Text>
          <Text style={styles.chapterSubtitle}>
            Síntese e leitura factual do estado operacional do evento à data desta edição.
          </Text>
        </View>

        {/* Quadro de Métricas Chave */}
        <View style={styles.conclusionGrid} wrap={false}>
          <View style={styles.conclusionMetricCard}>
            <Text style={styles.conclusionMetricLabel}>Universo Elegível</Text>
            <Text style={styles.conclusionMetricValue}>{stats.primaryGuests}</Text>
            <Text style={styles.conclusionMetricHint}>Convidados principais</Text>
          </View>
          <View style={styles.conclusionMetricCard}>
            <Text style={styles.conclusionMetricLabel}>Presenças Previstas</Text>
            <Text style={styles.conclusionMetricValue}>{stats.expectedAttendance}</Text>
            <Text style={styles.conclusionMetricHint}>Com {stats.attendingPlusOnes} acompanhantes</Text>
          </View>
          <View style={styles.conclusionMetricCard}>
            <Text style={styles.conclusionMetricLabel}>Taxa de Resposta</Text>
            <Text style={styles.conclusionMetricValue}>{stats.responseRate}%</Text>
            <Text style={styles.conclusionMetricHint}>{stats.confirmed + stats.checkedIn} confirmados</Text>
          </View>
          <View style={styles.conclusionMetricCard}>
            <Text style={styles.conclusionMetricLabel}>Acomodação</Text>
            <Text style={styles.conclusionMetricValue}>
              {readiness.hasSeating
                ? (stats.unassignedGuests === 0 ? "100%" : `${stats.assignedGuests}/${stats.primaryGuests}`)
                : "—"}
            </Text>
            <Text style={styles.conclusionMetricHint}>
              {readiness.hasSeating
                ? `${tableGroups.length} mesas configuradas`
                : "Distribuição não iniciada"}
            </Text>
          </View>
        </View>

        {/* Leitura Factual do Estado Operacional */}
        <View style={styles.conclusionSectionCard} wrap={false}>
          <Text style={styles.conclusionSectionHeader}>Leitura Factual do Evento</Text>

          <View style={styles.conclusionStatementRow}>
            <Text style={styles.conclusionBullet}>•</Text>
            <Text style={styles.conclusionStatementText}>{conclusionData.attendanceStatement}</Text>
          </View>

          <View style={styles.conclusionStatementRow}>
            <Text style={styles.conclusionBullet}>•</Text>
            <Text style={styles.conclusionStatementText}>{conclusionData.rsvpStatement}</Text>
          </View>

          <View style={styles.conclusionStatementRow}>
            <Text style={styles.conclusionBullet}>•</Text>
            <Text style={styles.conclusionStatementText}>{conclusionData.seatingStatement}</Text>
          </View>

          <View style={styles.conclusionStatementRow}>
            <Text style={styles.conclusionBullet}>•</Text>
            <Text style={styles.conclusionStatementText}>{conclusionData.dietaryStatement}</Text>
          </View>

          <View style={styles.conclusionStatementRow}>
            <Text style={styles.conclusionBullet}>•</Text>
            <Text style={styles.conclusionStatementText}>{conclusionData.checkInStatement}</Text>
          </View>
        </View>

        {/* Comentário de Planeamento / Notas do Planner (se existentes) */}
        {conclusionData.plannerNotes ? (
          <View style={styles.plannerCommentaryCard} wrap={false}>
            <Text style={styles.plannerCommentaryTitle}>
              {brandTokens.isHaxr ? "HAXR PLANNER COMMENTARY" : "NOTAS DE COORDENAÇÃO & PLANEAMENTO"}
            </Text>
            <Text style={styles.plannerCommentaryText}>{conclusionData.plannerNotes}</Text>
          </View>
        ) : null}

        <View style={styles.closingSection}>
          <Text style={styles.closingBrand}>{brandTokens.runningFooterBrand}</Text>
          <Text style={styles.closingNotice}>
            Documento emitido com integridade operacional e curadoria técnica.
          </Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerBrand}>{brandTokens.runningFooterBrand}</Text>
          <Text style={styles.footerText}>{event.name} · Conclusão Operacional</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>

      {/* ═════════════════════════════════════════════════════════════════
          TRUE BACK COVER / A CONTRA-CAPA
          ═════════════════════════════════════════════════════════════════ */}
      <Page
        size="A4"
        style={brandTokens.isHaxr ? styles.backCoverNoirPage : styles.backCoverCorporatePage}
      >
        {/* Top: Brand Mark */}
        <View style={styles.backCoverTop}>
          <View style={styles.backCoverMarkContainer}>
            {resolvedHeroLogo ? (
              <Image src={resolvedHeroLogo} style={styles.backCoverMarkLogo} />
            ) : null}
          </View>
        </View>

        {/* Center: Main Statement & Signature Mark */}
        <View style={styles.backCoverCenter}>
          {brandTokens.isHaxr ? (
            <>
              <Text style={styles.backCoverTagline}>{brandTokens.backCover.tagline}</Text>
              <Text style={styles.backCoverSubTagline}>{brandTokens.backCover.subTagline}</Text>
              {resolvedSignatureMark ? (
                <View style={styles.backCoverSignatureContainer}>
                  <Image
                    src={resolvedSignatureMark}
                    style={styles.backCoverSignatureImage}
                  />
                </View>
              ) : null}
            </>
          ) : (
            <>
              <Text style={styles.backCoverCorpTagline}>{brandTokens.backCover.tagline}</Text>
              <Text style={styles.backCoverCorpSubTagline}>{brandTokens.backCover.subTagline}</Text>
            </>
          )}
        </View>

        {/* Bottom: Signature Closure & Verified Contact Channels */}
        {brandTokens.isHaxr ? (
          <View style={styles.backCoverBottom}>
            <Text style={styles.backCoverBrandLabel}>{brandTokens.brandUpper}</Text>

            {/* Canonical Website */}
            {brandTokens.backCover.websiteUrl ? (
              <Link src={brandTokens.backCover.websiteUrl} style={styles.backCoverLink}>
                <Text style={styles.backCoverWebsite}>{brandTokens.backCover.website}</Text>
              </Link>
            ) : (
              <Text style={styles.backCoverWebsite}>{brandTokens.backCover.website}</Text>
            )}

            {/* Social Channels (Instagram & Facebook) */}
            <View style={styles.backCoverSocialRow}>
              {brandTokens.backCover.instagram ? (
                brandTokens.backCover.instagramUrl ? (
                  <Link src={brandTokens.backCover.instagramUrl} style={styles.backCoverLink}>
                    <Text style={styles.backCoverSocialText}>
                      Instagram · {brandTokens.backCover.instagram}
                    </Text>
                  </Link>
                ) : (
                  <Text style={styles.backCoverSocialText}>
                    Instagram · {brandTokens.backCover.instagram}
                  </Text>
                )
              ) : null}

              {brandTokens.backCover.instagram && brandTokens.backCover.facebook ? (
                <Text style={styles.backCoverSocialDot}>·</Text>
              ) : null}

              {brandTokens.backCover.facebook ? (
                brandTokens.backCover.facebookUrl ? (
                  <Link src={brandTokens.backCover.facebookUrl} style={styles.backCoverLink}>
                    <Text style={styles.backCoverSocialText}>
                      Facebook · {brandTokens.backCover.facebook}
                    </Text>
                  </Link>
                ) : (
                  <Text style={styles.backCoverSocialText}>
                    Facebook · {brandTokens.backCover.facebook}
                  </Text>
                )
              ) : null}
            </View>

            {/* Quiet Contact Details */}
            {brandTokens.backCover.phone || brandTokens.backCover.email ? (
              <View style={styles.backCoverContactRow}>
                {brandTokens.backCover.phone ? (
                  <Text style={styles.backCoverContactText}>{brandTokens.backCover.phone}</Text>
                ) : null}
                {brandTokens.backCover.phone && brandTokens.backCover.email ? (
                  <Text style={styles.backCoverContactDot}>·</Text>
                ) : null}
                {brandTokens.backCover.email ? (
                  <Text style={styles.backCoverContactText}>{brandTokens.backCover.email}</Text>
                ) : null}
              </View>
            ) : null}

            {/* Micro-label for digital discovery */}
            {brandTokens.backCover.qrLabel ? (
              <Text style={styles.backCoverExperienceText}>
                {brandTokens.backCover.qrLabel}
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.backCoverCorpBottom}>
            <Text style={styles.backCoverCorpBrandName}>{brandTokens.brandUpper}</Text>
            <Text style={styles.backCoverCorpNotice}>
              Documento operacional gerado para coordenação e apoio ao evento.
            </Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
