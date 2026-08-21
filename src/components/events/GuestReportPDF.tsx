import React from "react";
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { CLIENT_TYPE_LABELS } from "@/lib/admin/constants";
import { GUEST_STATUS_LABELS } from "@/lib/events/constants";
import { HAXR_BRAND_ASSETS } from "@/lib/brand/brand-assets";
import {
  eventReportHeader,
  formatEventDate,
  formatGeneratedAtTimestamp,
  formatGuestSeat,
  resolveGuestCompanionInfo,
  type GuestEventReport,
} from "@/lib/events/export/report";

// ── Editorial Ivory Tokens ──
const colors = {
  pageBg: "#FDFCFB",
  cardBg: "#FAF7F2",
  cardSecondaryBg: "#F4EFEA",
  cardBorder: "#E8E2D8",
  borderHairline: "#EFEBE4",
  textPrimary: "#1A1A1A",
  textSecondary: "#4A4742",
  textMuted: "#7A756E",
  goldAccent: "#C9A227",
  goldDark: "#96781A",
  goldLightBg: "#FBF8F0",
  goldBorder: "#E5D5A5",

  // Status badges
  statusConfirmedBg: "#EDF5F0",
  statusConfirmedText: "#1B6A42",
  statusConfirmedBorder: "#C3DEC9",

  statusCheckedInBg: "#F8F4EA",
  statusCheckedInText: "#7A5C10",
  statusCheckedInBorder: "#E8DCB5",

  statusInvitedBg: "#F5F3EF",
  statusInvitedText: "#635F57",
  statusInvitedBorder: "#DDD8CE",

  statusDeclinedBg: "#F8F2F2",
  statusDeclinedText: "#7A3A3A",
  statusDeclinedBorder: "#E2C8C8",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 8,
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: 32,
    color: colors.textPrimary,
    backgroundColor: colors.pageBg,
  },

  // ── Running Header & Footer ──
  runningHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: colors.cardBorder,
    paddingBottom: 5,
    marginBottom: 10,
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
    bottom: 16,
    left: 32,
    right: 32,
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

  // ── Cover / Top Header ──
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: colors.goldAccent,
    paddingBottom: 8,
    marginBottom: 8,
  },
  logoContainer: {
    width: 130,
    height: 32,
    justifyContent: "center",
  },
  brandLogo: {
    width: 130,
    height: 30,
    objectFit: "contain",
  },
  documentMeta: {
    alignItems: "flex-end",
  },
  documentSuperTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 6,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: colors.goldDark,
    marginBottom: 1,
  },
  documentTitle: {
    fontFamily: "Times-Bold",
    fontSize: 13,
    letterSpacing: 0.5,
    color: colors.textPrimary,
    marginBottom: 1,
  },
  documentTimestamp: {
    fontSize: 6.5,
    color: colors.textMuted,
  },

  // ── Event Identity Strip ──
  eventInfoBlock: {
    backgroundColor: colors.cardBg,
    borderWidth: 0.5,
    borderColor: colors.cardBorder,
    borderRadius: 1,
    padding: 7,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eventName: {
    fontFamily: "Times-Bold",
    fontSize: 11,
    color: colors.textPrimary,
    marginBottom: 1,
  },
  eventMetaText: {
    fontSize: 7,
    color: colors.textSecondary,
  },
  eventDateBadge: {
    backgroundColor: colors.goldLightBg,
    borderWidth: 0.5,
    borderColor: colors.goldBorder,
    borderRadius: 1,
    paddingVertical: 3,
    paddingHorizontal: 7,
    alignItems: "flex-end",
  },
  eventDateText: {
    fontFamily: "Times-Bold",
    fontSize: 8,
    color: colors.goldDark,
  },

  // ── Executive Metrics Strip (2x4 Grid) ──
  metricsSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: "Times-Bold",
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.goldDark,
    marginBottom: 5,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  metricCard: {
    width: "23.6%",
    backgroundColor: colors.cardBg,
    borderWidth: 0.5,
    borderColor: colors.cardBorder,
    borderRadius: 1,
    padding: 4.5,
  },
  metricLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 5.5,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: colors.textMuted,
    marginBottom: 1.5,
  },
  metricValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
    color: colors.textPrimary,
  },
  metricSub: {
    fontSize: 5,
    color: colors.textMuted,
    marginTop: 0.5,
  },

  // ── RSVP Proportional Bar ──
  rsvpBarContainer: {
    backgroundColor: colors.cardBg,
    borderWidth: 0.5,
    borderColor: colors.cardBorder,
    borderRadius: 1,
    padding: 6,
    marginBottom: 8,
  },
  rsvpBarTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  rsvpBarTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 6,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: colors.textSecondary,
  },
  rsvpBarRate: {
    fontFamily: "Helvetica-Bold",
    fontSize: 6.5,
    color: colors.goldDark,
  },
  progressBarTrack: {
    height: 5,
    flexDirection: "row",
    backgroundColor: colors.cardSecondaryBg,
    borderRadius: 1,
    overflow: "hidden",
    marginBottom: 4,
  },
  barConfirmed: {
    backgroundColor: colors.statusConfirmedText,
    height: "100%",
  },
  barCheckedIn: {
    backgroundColor: colors.goldAccent,
    height: "100%",
  },
  barInvited: {
    backgroundColor: colors.cardBorder,
    height: "100%",
  },
  barDeclined: {
    backgroundColor: colors.statusDeclinedText,
    height: "100%",
  },
  rsvpLegendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 1,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  legendDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 5.5,
    color: colors.textSecondary,
  },

  // ── Guest Registry Table ──
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.cardSecondaryBg,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: colors.cardBorder,
    paddingVertical: 3,
    paddingHorizontal: 4,
    marginBottom: 1,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderHairline,
    paddingVertical: 2.5,
    paddingHorizontal: 4,
    alignItems: "center",
  },
  tableRowAlt: {
    backgroundColor: colors.cardBg,
  },

  colName: { width: "27%" },
  colStatus: { width: "14%" },
  colCompanion: { width: "21%" },
  colSeat: { width: "20%" },
  colContact: { width: "18%" },

  headerCellText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 5.5,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: colors.textSecondary,
  },
  cellGuestName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    color: colors.textPrimary,
  },
  cellGuestType: {
    fontSize: 5.5,
    color: colors.textMuted,
    marginTop: 0.5,
  },
  cellText: {
    fontSize: 6.5,
    color: colors.textSecondary,
  },
  cellTextMuted: {
    fontSize: 6.5,
    color: colors.textMuted,
    fontStyle: "italic",
  },

  // Badges
  statusBadge: {
    paddingVertical: 1,
    paddingHorizontal: 3.5,
    borderRadius: 1,
    borderWidth: 0.5,
    alignSelf: "flex-start",
  },
  statusBadgeText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 5.5,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },

  // ── Operations & Restrictions Section ──
  dietaryCard: {
    backgroundColor: colors.cardBg,
    borderWidth: 0.5,
    borderLeftWidth: 2,
    borderLeftColor: colors.goldAccent,
    borderColor: colors.cardBorder,
    borderRadius: 1,
    padding: 5,
    marginBottom: 4,
  },
  dietaryHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  dietaryGuestName: {
    fontFamily: "Times-Bold",
    fontSize: 7.5,
    color: colors.textPrimary,
  },
  dietaryLocation: {
    fontSize: 6,
    color: colors.goldDark,
  },
  dietaryText: {
    fontSize: 6.5,
    color: colors.statusDeclinedText,
    fontFamily: "Helvetica-Bold",
  },
  notesText: {
    fontSize: 6,
    color: colors.textSecondary,
    marginTop: 1,
  },

  // ── Seating Map Section ──
  tableBlock: {
    marginBottom: 8,
  },
  tableHeaderRow: {
    backgroundColor: colors.cardBg,
    borderWidth: 0.5,
    borderLeftWidth: 2,
    borderLeftColor: colors.goldAccent,
    borderColor: colors.cardBorder,
    borderRadius: 1,
    paddingVertical: 2.5,
    paddingHorizontal: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  tableNameText: {
    fontFamily: "Times-Bold",
    fontSize: 8,
    color: colors.textPrimary,
  },
  tableCapacityText: {
    fontSize: 6,
    color: colors.textMuted,
  },
  seatRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderHairline,
    paddingVertical: 2,
    paddingHorizontal: 5,
  },
  seatNumberText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 6,
    color: colors.textSecondary,
    width: "25%",
  },
  seatGuestText: {
    fontSize: 6.5,
    color: colors.textPrimary,
    width: "45%",
  },
  seatEmptyText: {
    fontSize: 6.5,
    color: colors.textMuted,
    fontStyle: "italic",
    width: "45%",
  },
  seatStatusCol: {
    width: "30%",
    alignItems: "flex-end",
  },

  // Empty state text
  emptyText: {
    fontSize: 7.5,
    color: colors.textMuted,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 10,
  },
});

export type GuestReportPDFProps = {
  report: GuestEventReport;
  logoUrl?: string;
  generatedAt?: string;
};

export default function GuestReportPDF({
  report,
  logoUrl,
  generatedAt,
}: GuestReportPDFProps) {
  const { event, guests, stats, tableGroups, unassignedGuests } = report;
  const effectiveGeneratedAt = generatedAt || report.generatedAt;
  const resolvedLogo = logoUrl || HAXR_BRAND_ASSETS.horizontalGold;

  // Filtro de convidados com notas especiais ou restrições alimentares
  const operationalNotesGuests = guests.filter(
    (g) => (g.dietaryNotes && g.dietaryNotes.trim()) || (g.guestNotes && g.guestNotes.trim())
  );

  // Proporções para a barra de RSVP
  const total = Math.max(1, stats.primaryGuests);
  const pConfirmed = (stats.confirmed / total) * 100;
  const pCheckedIn = (stats.checkedIn / total) * 100;
  const pInvited = (stats.invited / total) * 100;
  const pDeclined = (stats.declined / total) * 100;

  function renderStatusBadge(status: string) {
    let bg = colors.statusInvitedBg;
    let text = colors.statusInvitedText;
    let border = colors.statusInvitedBorder;

    if (status === "confirmed") {
      bg = colors.statusConfirmedBg;
      text = colors.statusConfirmedText;
      border = colors.statusConfirmedBorder;
    } else if (status === "checked_in") {
      bg = colors.statusCheckedInBg;
      text = colors.statusCheckedInText;
      border = colors.statusCheckedInBorder;
    } else if (status === "declined") {
      bg = colors.statusDeclinedBg;
      text = colors.statusDeclinedText;
      border = colors.statusDeclinedBorder;
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: bg, borderColor: border }]}>
        <Text style={[styles.statusBadgeText, { color: text }]}>
          {GUEST_STATUS_LABELS[status as keyof typeof GUEST_STATUS_LABELS] || status}
        </Text>
      </View>
    );
  }

  return (
    <Document title={`HAXR Signature — Relatório de Convidados (${event.name})`}>
      {/* ─────────────────────────────────────────────────────────────
          PÁGINA 1: VISÃO EXECUTIVA & REGISTO DE CONVIDADOS
      ───────────────────────────────────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        {/* Top Brand Header */}
        <View style={styles.topHeader}>
          <View style={styles.logoContainer}>
            <Image src={resolvedLogo} style={styles.brandLogo} />
          </View>
          <View style={styles.documentMeta}>
            <Text style={styles.documentSuperTitle}>HAXR Signature · Event Operations</Text>
            <Text style={styles.documentTitle}>Relatório de Convidados</Text>
            <Text style={styles.documentTimestamp}>
              Emitido em {formatGeneratedAtTimestamp(effectiveGeneratedAt)}
            </Text>
          </View>
        </View>

        {/* Event Identity Banner */}
        <View style={styles.eventInfoBlock}>
          <View>
            <Text style={styles.eventName}>{event.name}</Text>
            <Text style={styles.eventMetaText}>
              {eventReportHeader(event)}
            </Text>
          </View>
          <View style={styles.eventDateBadge}>
            <Text style={styles.eventDateText}>{formatEventDate(event.date)}</Text>
          </View>
        </View>

        {/* Executive Metrics (8 Cards) */}
        <View style={styles.metricsSection}>
          <Text style={styles.sectionTitle}>Indicadores Operacionais de Banquete & Recepção</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Convidados Principais</Text>
              <Text style={styles.metricValue}>{stats.primaryGuests}</Text>
              <Text style={styles.metricSub}>Convites emitidos</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Confirmados (RSVP)</Text>
              <Text style={[styles.metricValue, { color: colors.statusConfirmedText }]}>
                {stats.confirmed}
              </Text>
              <Text style={styles.metricSub}>Presença assegurada</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Check-in Realizado</Text>
              <Text style={[styles.metricValue, { color: colors.goldDark }]}>
                {stats.checkedIn}
              </Text>
              <Text style={styles.metricSub}>Na recepção do evento</Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: colors.goldLightBg, borderColor: colors.goldBorder }]}>
              <Text style={[styles.metricLabel, { color: colors.goldDark }]}>Headcount Banquete</Text>
              <Text style={[styles.metricValue, { color: colors.goldDark }]}>
                {stats.expectedAttendance}
              </Text>
              <Text style={styles.metricSub}>Catering covers previstos</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Acompanhantes (+1)</Text>
              <Text style={styles.metricValue}>{stats.plusOnesTotal}</Text>
              <Text style={styles.metricSub}>Total de extras</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Pendentes</Text>
              <Text style={styles.metricValue}>{stats.invited}</Text>
              <Text style={styles.metricSub}>A aguardar resposta</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Recusados</Text>
              <Text style={[styles.metricValue, { color: colors.statusDeclinedText }]}>
                {stats.declined}
              </Text>
              <Text style={styles.metricSub}>Declinou presença</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Sem Lugar</Text>
              <Text style={styles.metricValue}>{stats.unassignedGuests}</Text>
              <Text style={styles.metricSub}>A aguardar mesa</Text>
            </View>
          </View>
        </View>

        {/* Factual RSVP Proportional Bar */}
        {stats.primaryGuests > 0 ? (
          <View style={styles.rsvpBarContainer}>
            <View style={styles.rsvpBarTitleRow}>
              <Text style={styles.rsvpBarTitle}>Distribuição Factual de Resposta</Text>
              <Text style={styles.rsvpBarRate}>{stats.responseRate}% Respondido</Text>
            </View>
            <View style={styles.progressBarTrack}>
              {pConfirmed > 0 ? <View style={[styles.barConfirmed, { width: `${pConfirmed}%` }]} /> : null}
              {pCheckedIn > 0 ? <View style={[styles.barCheckedIn, { width: `${pCheckedIn}%` }]} /> : null}
              {pInvited > 0 ? <View style={[styles.barInvited, { width: `${pInvited}%` }]} /> : null}
              {pDeclined > 0 ? <View style={[styles.barDeclined, { width: `${pDeclined}%` }]} /> : null}
            </View>
            <View style={styles.rsvpLegendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.statusConfirmedText }]} />
                <Text style={styles.legendText}>Confirmados: {stats.confirmed} ({Math.round(pConfirmed)}%)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.goldAccent }]} />
                <Text style={styles.legendText}>Check-in: {stats.checkedIn} ({Math.round(pCheckedIn)}%)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.cardBorder }]} />
                <Text style={styles.legendText}>Pendentes: {stats.invited} ({Math.round(pInvited)}%)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.statusDeclinedText }]} />
                <Text style={styles.legendText}>Recusados: {stats.declined} ({Math.round(pDeclined)}%)</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Guest Registry Table Header */}
        <Text style={styles.sectionTitle}>Registo de Convidados ({guests.length})</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCellText, styles.colName]}>Convidado Principal</Text>
          <Text style={[styles.headerCellText, styles.colStatus]}>Estado RSVP</Text>
          <Text style={[styles.headerCellText, styles.colCompanion]}>Acompanhantes</Text>
          <Text style={[styles.headerCellText, styles.colSeat]}>Mesa / Lugar</Text>
          <Text style={[styles.headerCellText, styles.colContact]}>Contacto</Text>
        </View>

        {/* Guest Table Rows */}
        {guests.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum convidado registado para este evento.</Text>
        ) : (
          guests.map((guest, index) => {
            const companion = resolveGuestCompanionInfo(guest);
            return (
              <View
                key={guest.id}
                style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}
                wrap={false}
              >
                <View style={styles.colName}>
                  <Text style={styles.cellGuestName}>{guest.name}</Text>
                  <Text style={styles.cellGuestType}>
                    {CLIENT_TYPE_LABELS[guest.clientType] || guest.clientType}
                  </Text>
                </View>
                <View style={styles.colStatus}>
                  {renderStatusBadge(guest.status)}
                </View>
                <View style={styles.colCompanion}>
                  <Text style={companion.hasNamedCompanions ? styles.cellText : (guest.plusOnes > 0 ? styles.cellText : styles.cellTextMuted)}>
                    {companion.formattedLabel}
                  </Text>
                </View>
                <View style={styles.colSeat}>
                  <Text style={guest.seat ? styles.cellText : styles.cellTextMuted}>
                    {formatGuestSeat(guest)}
                  </Text>
                </View>
                <View style={styles.colContact}>
                  <Text style={styles.cellText}>{guest.email || guest.phone || "—"}</Text>
                </View>
              </View>
            );
          })
        )}

        {/* Running Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerBrand}>HAXR Signature · Event Operations</Text>
          <Text style={styles.footerText}>{event.name} · {formatEventDate(event.date)}</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>

      {/* ─────────────────────────────────────────────────────────────
          SECÇÃO 2: OPERAÇÃO, RESTRIÇÕES ALIMENTARES & ALERGIAS
      ───────────────────────────────────────────────────────────── */}
      {operationalNotesGuests.length > 0 ? (
        <Page size="A4" style={styles.page}>
          <View style={styles.runningHeader} fixed>
            <Text style={styles.runningHeaderLeft}>HAXR Signature · Event Operations</Text>
            <Text style={styles.runningHeaderRight}>{event.name} · Operação & Restrições</Text>
          </View>

          <Text style={styles.sectionTitle}>
            Operação, Restrições Alimentares & Alergias ({operationalNotesGuests.length})
          </Text>

          {operationalNotesGuests.map((guest) => {
            const companion = resolveGuestCompanionInfo(guest);
            return (
              <View key={`diet-${guest.id}`} style={styles.dietaryCard} wrap={false}>
                <View style={styles.dietaryHeaderRow}>
                  <Text style={styles.dietaryGuestName}>
                    {guest.name}
                    {companion.count > 0 ? ` · ${companion.formattedLabel}` : ""}
                  </Text>
                  <Text style={styles.dietaryLocation}>{formatGuestSeat(guest)}</Text>
                </View>
                {guest.dietaryNotes ? (
                  <Text style={styles.dietaryText}>
                    Restrição Alimentar: {guest.dietaryNotes}
                  </Text>
                ) : null}
                {guest.guestNotes ? (
                  <Text style={styles.notesText}>
                    Nota Operacional: {guest.guestNotes}
                  </Text>
                ) : null}
              </View>
            );
          })}

          <View style={styles.footer} fixed>
            <Text style={styles.footerBrand}>HAXR Signature · Event Operations</Text>
            <Text style={styles.footerText}>{event.name} · Manifesto de Cozinha</Text>
            <Text
              style={styles.footerText}
              render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
            />
          </View>
        </Page>
      ) : null}

      {/* ─────────────────────────────────────────────────────────────
          SECÇÃO 3: DISTRIBUIÇÃO POR MESA (SEATING CHART)
      ───────────────────────────────────────────────────────────── */}
      {tableGroups.length > 0 ? (
        <Page size="A4" style={styles.page}>
          <View style={styles.runningHeader} fixed>
            <Text style={styles.runningHeaderLeft}>HAXR Signature · Event Operations</Text>
            <Text style={styles.runningHeaderRight}>{event.name} · Mapa de Mesas</Text>
          </View>

          <Text style={styles.sectionTitle}>Distribuição por Mesa ({tableGroups.length} Mesas)</Text>

          {tableGroups.map((group) => (
            <View key={`tbl-${group.tableName}`} style={styles.tableBlock}>
              <View style={styles.tableHeaderRow} wrap={false}>
                <Text style={styles.tableNameText}>Mesa {group.tableName}</Text>
                <Text style={styles.tableCapacityText}>
                  {group.assignedSeats} de {group.totalSeats} lugares ocupados
                </Text>
              </View>
              {group.seats.map((seat) => (
                <View key={`seat-${group.tableName}-${seat.seatNumber}`} style={styles.seatRow} wrap={false}>
                  <Text style={styles.seatNumberText}>
                    Lugar {seat.seatNumber}
                    {seat.label ? ` · ${seat.label}` : ""}
                  </Text>
                  {seat.guest ? (
                    <Text style={styles.seatGuestText}>
                      {seat.guest.name}
                      {seat.companionInfo && seat.companionInfo.count > 0
                        ? ` (+${seat.companionInfo.count})`
                        : ""}
                    </Text>
                  ) : (
                    <Text style={styles.seatEmptyText}>Disponível</Text>
                  )}
                  <View style={styles.seatStatusCol}>
                    {seat.guest ? renderStatusBadge(seat.guest.status) : null}
                  </View>
                </View>
              ))}
            </View>
          ))}

          {/* Sub-secção: Sem lugar atribuído */}
          {unassignedGuests.length > 0 ? (
            <View style={styles.tableBlock}>
              <View style={[styles.tableHeaderRow, { borderLeftColor: colors.statusDeclinedText }]} wrap={false}>
                <Text style={styles.tableNameText}>Sem Lugar Atribuído ({unassignedGuests.length})</Text>
                <Text style={styles.tableCapacityText}>A aguardar alocação</Text>
              </View>
              {unassignedGuests.map((guest) => {
                const companion = resolveGuestCompanionInfo(guest);
                return (
                  <View key={`unassigned-${guest.id}`} style={styles.seatRow} wrap={false}>
                    <Text style={styles.seatNumberText}>—</Text>
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
            <Text style={styles.footerBrand}>HAXR Signature · Event Operations</Text>
            <Text style={styles.footerText}>{event.name} · Mapa de Mesas</Text>
            <Text
              style={styles.footerText}
              render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
            />
          </View>
        </Page>
      ) : (
        <Page size="A4" style={styles.page}>
          <View style={styles.runningHeader} fixed>
            <Text style={styles.runningHeaderLeft}>HAXR Signature · Event Operations</Text>
            <Text style={styles.runningHeaderRight}>{event.name} · Mapa de Mesas</Text>
          </View>
          <Text style={styles.sectionTitle}>Distribuição por Mesa</Text>
          <Text style={styles.emptyText}>Lugares ainda não configurados.</Text>
          <View style={styles.footer} fixed>
            <Text style={styles.footerBrand}>HAXR Signature · Event Operations</Text>
            <Text style={styles.footerText}>{event.name}</Text>
            <Text
              style={styles.footerText}
              render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
            />
          </View>
        </Page>
      )}
    </Document>
  );
}

