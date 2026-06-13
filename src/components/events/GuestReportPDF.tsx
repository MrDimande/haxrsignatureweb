"use client";

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { CLIENT_TYPE_LABELS } from "@/lib/admin/constants";
import { GUEST_STATUS_LABELS } from "@/lib/events/constants";
import {
  eventReportHeader,
  formatGuestCheckIn,
  formatGuestSeat,
  type GuestEventReport,
} from "@/lib/events/export/report";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 8,
    padding: 36,
    color: "#1a1a1a",
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 15,
    marginBottom: 4,
    color: "#000000",
  },
  subtitle: {
    fontSize: 9,
    color: "#666666",
    marginBottom: 16,
    lineHeight: 1.4,
  },
  sectionTitle: {
    fontSize: 10,
    marginTop: 14,
    marginBottom: 6,
    color: "#C9A227",
    borderBottomWidth: 1,
    borderBottomColor: "#C9A227",
    paddingBottom: 3,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  statBox: {
    width: "23%",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    padding: 6,
    borderRadius: 2,
  },
  statLabel: { fontSize: 7, color: "#888888", marginBottom: 2 },
  statValue: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: "#dddddd",
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  cellName: { width: "22%" },
  cellContact: { width: "18%" },
  cellType: { width: "10%" },
  cellStatus: { width: "12%" },
  cellSeat: { width: "22%" },
  cellCheckin: { width: "16%" },
  headerText: { fontFamily: "Helvetica-Bold", fontSize: 7, color: "#555555" },
  cellText: { fontSize: 7.5, lineHeight: 1.3 },
  tableGroupTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginTop: 8,
    marginBottom: 4,
    color: "#333333",
  },
  seatRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingVertical: 3,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    fontSize: 7,
    color: "#999999",
    textAlign: "center",
  },
});

type GuestReportPDFProps = {
  report: GuestEventReport;
  generatedAt: string;
};

export default function GuestReportPDF({
  report,
  generatedAt,
}: GuestReportPDFProps) {
  const { event, guests, stats, tableGroups, unassignedGuests } = report;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Relatório de Convidados</Text>
        <Text style={styles.subtitle}>
          {eventReportHeader(event)}
          {"\n"}
          HAXR Signature · {generatedAt}
        </Text>

        <Text style={styles.sectionTitle}>Resumo</Text>
        <View style={styles.statsRow}>
          {[
            ["Convidados", stats.totalGuests],
            ["Confirmados", stats.confirmed],
            ["Check-in", stats.checkedIn],
            ["Com lugar", `${stats.assignedSeats}/${stats.totalSeats}`],
          ].map(([label, value]) => (
            <View key={label} style={styles.statBox}>
              <Text style={styles.statLabel}>{label}</Text>
              <Text style={styles.statValue}>{value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Lista completa</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerText, styles.cellName]}>Nome</Text>
          <Text style={[styles.headerText, styles.cellContact]}>Contacto</Text>
          <Text style={[styles.headerText, styles.cellType]}>Tipo</Text>
          <Text style={[styles.headerText, styles.cellStatus]}>Estado</Text>
          <Text style={[styles.headerText, styles.cellSeat]}>Lugar</Text>
          <Text style={[styles.headerText, styles.cellCheckin]}>Check-in</Text>
        </View>
        {guests.map((guest) => (
          <View key={guest.id} style={styles.tableRow}>
            <Text style={[styles.cellText, styles.cellName]}>{guest.name}</Text>
            <Text style={[styles.cellText, styles.cellContact]}>
              {guest.email || guest.phone || "—"}
            </Text>
            <Text style={[styles.cellText, styles.cellType]}>
              {CLIENT_TYPE_LABELS[guest.clientType]}
            </Text>
            <Text style={[styles.cellText, styles.cellStatus]}>
              {GUEST_STATUS_LABELS[guest.status]}
            </Text>
            <Text style={[styles.cellText, styles.cellSeat]}>
              {formatGuestSeat(guest)}
            </Text>
            <Text style={[styles.cellText, styles.cellCheckin]}>
              {formatGuestCheckIn(guest.checkedInAt)}
            </Text>
          </View>
        ))}

        <Text style={styles.footer}>
          Relatório gerado pela HAXR Signature · {guests.length} convidados
        </Text>
      </Page>

      {tableGroups.length ? (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>Distribuição por mesa</Text>
          {tableGroups.map((group) => (
            <View key={group.tableName} wrap={false}>
              <Text style={styles.tableGroupTitle}>Mesa {group.tableName}</Text>
              {group.seats.map((seat) => (
                <View key={`${group.tableName}-${seat.seatNumber}`} style={styles.seatRow}>
                  <Text style={styles.cellText}>
                    Lugar {seat.seatNumber}
                    {seat.label ? ` · ${seat.label}` : ""}
                  </Text>
                  <Text style={styles.cellText}>
                    {seat.guest
                      ? `${seat.guest.name} (${GUEST_STATUS_LABELS[seat.guest.status]})`
                      : "Vazio"}
                  </Text>
                </View>
              ))}
            </View>
          ))}

          {unassignedGuests.length ? (
            <View>
              <Text style={styles.tableGroupTitle}>Sem lugar atribuído</Text>
              {unassignedGuests.map((guest) => (
                <View key={guest.id} style={styles.seatRow}>
                  <Text style={styles.cellText}>{guest.name}</Text>
                  <Text style={styles.cellText}>
                    {GUEST_STATUS_LABELS[guest.status]}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <Text style={styles.footer}>HAXR Signature · Mapa de mesas</Text>
        </Page>
      ) : null}
    </Document>
  );
}
