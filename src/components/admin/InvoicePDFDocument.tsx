import {
    DOCUMENT_STATUS_LABELS,
    DOCUMENT_TYPE_LABELS,
    EVENT_TYPE_LABELS,
    VAT_RATE,
} from "@/lib/admin/constants";
import type { Business, InvoiceDocument } from "@/lib/admin/types";
import { formatCurrency, formatDateShort } from "@/lib/calculations";
import {
    Document,
    Image,
    Page,
    StyleSheet,
    Text,
    View,
} from "@react-pdf/renderer";

/* ═══════════════════════════════════════════════════════════════════
   HAXR Signature — Premium Invoice / Receipt PDF Document
   Luxury haute-couture design with dark background, gold accents,
   editorial typography, and modern financial document aesthetics.
   ═══════════════════════════════════════════════════════════════════ */

const GOLD        = "#C9A227";
const GOLD_LIGHT  = "#E8D48B";
const GOLD_MUTED  = "#A08420";
const DARK_BG     = "#0A0908";
const DARK_CARD   = "#111110";
const DARK_BORDER = "#1E1D1A";
const TEXT_WHITE   = "#F5F0E8";
const TEXT_MUTED   = "#8A8578";
const TEXT_DIM     = "#5A574E";

const styles = StyleSheet.create({
  /* ---- Page ---- */
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    padding: 0,
    color: TEXT_WHITE,
    backgroundColor: DARK_BG,
  },

  /* ---- Top Gold Accent Bar ---- */
  accentBar: {
    height: 4,
    backgroundColor: GOLD,
  },

  /* ---- Inner content wrapper ---- */
  inner: {
    paddingHorizontal: 40,
    paddingTop: 28,
    paddingBottom: 80,
  },

  /* ---- Header ---- */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: DARK_BORDER,
  },
  logo: {
    width: 150,
    height: 48,
    objectFit: "contain",
    objectPosition: "left",
  },
  companyBlock: {
    maxWidth: 220,
    textAlign: "right",
  },
  companyName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: GOLD,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  companyMeta: {
    fontSize: 7.5,
    color: TEXT_MUTED,
    lineHeight: 1.5,
    letterSpacing: 0.3,
  },

  /* ---- Document Title Block ---- */
  docTitleBlock: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: DARK_BORDER,
  },
  docTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  docTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: TEXT_WHITE,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  docNumber: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: GOLD,
    letterSpacing: 0.5,
  },
  docStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 2,
    backgroundColor: GOLD,
    marginTop: 4,
  },
  docStatusText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: DARK_BG,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  docMetaRow: {
    flexDirection: "row",
    gap: 20,
    marginTop: 8,
  },
  docMetaItem: {
    fontSize: 7.5,
    color: TEXT_MUTED,
    letterSpacing: 0.3,
  },
  docMetaLabel: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: TEXT_DIM,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },

  /* ---- Two Column Info Panels ---- */
  infoPanels: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  infoPanel: {
    flex: 1,
    padding: 14,
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: DARK_BORDER,
    borderRadius: 3,
  },
  infoPanelTitle: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: GOLD_MUTED,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: DARK_BORDER,
  },
  infoPanelName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: TEXT_WHITE,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  infoPanelMuted: {
    fontSize: 7.5,
    color: TEXT_MUTED,
    lineHeight: 1.5,
    letterSpacing: 0.2,
  },

  /* ---- Services Table ---- */
  sectionTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 2.5,
    color: GOLD,
    marginBottom: 10,
  },
  table: {
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: DARK_CARD,
    borderBottomWidth: 1,
    borderBottomColor: GOLD_MUTED,
  },
  tableHeaderCell: {
    color: GOLD_LIGHT,
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: DARK_BORDER,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableRowAlt: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: DARK_BORDER,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#0D0C0A",
  },
  colDesc: { width: "45%" },
  colQty: { width: "12%", textAlign: "center" },
  colPrice: { width: "20%", textAlign: "right" },
  colTotal: { width: "23%", textAlign: "right" },
  cellText: {
    fontSize: 8.5,
    color: TEXT_WHITE,
    letterSpacing: 0.2,
  },
  cellTextMuted: {
    fontSize: 8.5,
    color: TEXT_MUTED,
    letterSpacing: 0.2,
  },

  /* ---- Totals ---- */
  totalsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 24,
  },
  totalsBox: {
    width: 240,
    padding: 14,
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: DARK_BORDER,
    borderRadius: 3,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  totalLabel: {
    fontSize: 8,
    color: TEXT_MUTED,
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 8,
    color: TEXT_WHITE,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.3,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: GOLD,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: GOLD,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  grandTotalValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: GOLD_LIGHT,
    letterSpacing: 0.5,
  },

  /* ---- Notes ---- */
  notesBox: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: DARK_CARD,
    borderLeftWidth: 2,
    borderLeftColor: GOLD_MUTED,
    borderRadius: 2,
  },
  notesText: {
    fontSize: 8,
    color: TEXT_MUTED,
    lineHeight: 1.5,
    letterSpacing: 0.2,
  },

  /* ---- Payment Info ---- */
  paymentBox: {
    marginBottom: 20,
    padding: 14,
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: DARK_BORDER,
    borderRadius: 3,
  },
  paymentRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  paymentLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: TEXT_DIM,
    width: 70,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  paymentValue: {
    fontSize: 8,
    color: TEXT_WHITE,
    letterSpacing: 0.3,
  },

  /* ---- Terms ---- */
  termsBox: {
    marginBottom: 24,
  },
  termItem: {
    fontSize: 6.5,
    color: TEXT_DIM,
    marginBottom: 3,
    lineHeight: 1.4,
    letterSpacing: 0.2,
  },

  /* ---- Signature ---- */
  signatureContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: DARK_BORDER,
  },
  signatureBlock: {
    width: 180,
    alignItems: "center",
  },
  signatureImage: {
    height: 48,
    maxWidth: 160,
    objectFit: "contain",
    marginBottom: 6,
  },
  signatureLine: {
    width: 180,
    borderTopWidth: 1,
    borderTopColor: TEXT_DIM,
    paddingTop: 8,
    textAlign: "center",
    fontSize: 7,
    color: TEXT_MUTED,
    letterSpacing: 0.5,
  },
  signatureName: {
    fontSize: 7,
    color: TEXT_DIM,
    textAlign: "center",
    marginTop: 2,
    letterSpacing: 0.3,
  },

  /* ---- Footer ---- */
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 40,
    backgroundColor: DARK_CARD,
    borderTopWidth: 1,
    borderTopColor: DARK_BORDER,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 6,
    color: TEXT_DIM,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  footerGold: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: GOLD_MUTED,
    letterSpacing: 2,
    textTransform: "uppercase",
  },

  /* ---- Decorative Gold Corner ---- */
  cornerTopLeft: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 24,
    height: 24,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: GOLD,
    borderLeftColor: GOLD,
  },
  cornerBottomRight: {
    position: "absolute",
    bottom: 50,
    right: 16,
    width: 24,
    height: 24,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomColor: GOLD,
    borderRightColor: GOLD,
  },
});

type InvoicePDFDocumentProps = {
  document: InvoiceDocument;
  business: Business;
  logoUrl?: string;
};

export default function InvoicePDFDocument({
  document: doc,
  business,
  logoUrl,
}: InvoicePDFDocumentProps) {
  const currency = doc.totals.currency;
  const bank = business.bankAccounts[0];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── Top Gold Accent Bar ── */}
        <View style={styles.accentBar} />

        {/* ── Decorative Corners ── */}
        <View style={styles.cornerTopLeft} />
        <View style={styles.cornerBottomRight} />

        <View style={styles.inner}>
          {/* ── Header: Logo + Company Info ── */}
          <View style={styles.header}>
            <View>
              {logoUrl ? (
                <Image src={logoUrl} style={styles.logo} />
              ) : (
                <Text style={styles.companyName}>{business.name}</Text>
              )}
            </View>
            <View style={styles.companyBlock}>
              <Text style={styles.companyName}>{business.name}</Text>
              <Text style={styles.companyMeta}>NUIT: {business.nuit}</Text>
              <Text style={styles.companyMeta}>{business.address}</Text>
              <Text style={styles.companyMeta}>{business.phone}</Text>
              <Text style={styles.companyMeta}>{business.email}</Text>
            </View>
          </View>

          {/* ── Document Title Block ── */}
          <View style={styles.docTitleBlock}>
            <View style={styles.docTitleRow}>
              <View>
                <Text style={styles.docTitle}>
                  {DOCUMENT_TYPE_LABELS[doc.documentType]}
                </Text>
                <Text style={styles.docNumber}>
                  N.º {doc.documentNumber}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <View style={styles.docStatusBadge}>
                  <Text style={styles.docStatusText}>
                    {DOCUMENT_STATUS_LABELS[doc.status]}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.docMetaRow}>
              <View>
                <Text style={styles.docMetaLabel}>Data de Emissão</Text>
                <Text style={styles.docMetaItem}>
                  {formatDateShort(doc.issueDate)}
                </Text>
              </View>
              <View>
                <Text style={styles.docMetaLabel}>Validade</Text>
                <Text style={styles.docMetaItem}>
                  {formatDateShort(doc.expiryDate)}
                </Text>
              </View>
              <View>
                <Text style={styles.docMetaLabel}>Moeda</Text>
                <Text style={styles.docMetaItem}>{currency}</Text>
              </View>
            </View>
          </View>

          {/* ── Client + Event Info Panels ── */}
          <View style={styles.infoPanels}>
            {/* Client Panel */}
            <View style={styles.infoPanel}>
              <Text style={styles.infoPanelTitle}>Cliente</Text>
              <Text style={styles.infoPanelName}>
                {doc.clientName || "—"}
                {doc.companyName ? ` · ${doc.companyName}` : ""}
              </Text>
              {doc.clientNuit ? (
                <Text style={styles.infoPanelMuted}>
                  NUIT: {doc.clientNuit}
                </Text>
              ) : null}
              {doc.clientAddress ? (
                <Text style={styles.infoPanelMuted}>{doc.clientAddress}</Text>
              ) : null}
              {doc.clientEmail ? (
                <Text style={styles.infoPanelMuted}>{doc.clientEmail}</Text>
              ) : null}
              {doc.clientPhone ? (
                <Text style={styles.infoPanelMuted}>{doc.clientPhone}</Text>
              ) : null}
            </View>

            {/* Event Panel (if applicable) */}
            {doc.event.eventType || doc.event.eventName ? (
              <View style={styles.infoPanel}>
                <Text style={styles.infoPanelTitle}>Evento</Text>
                {doc.event.eventName ? (
                  <Text style={styles.infoPanelName}>
                    {doc.event.eventName}
                  </Text>
                ) : null}
                {doc.event.eventType ? (
                  <Text style={styles.infoPanelMuted}>
                    {EVENT_TYPE_LABELS[doc.event.eventType]}
                  </Text>
                ) : null}
                {doc.event.eventDate ? (
                  <Text style={styles.infoPanelMuted}>
                    Data: {formatDateShort(doc.event.eventDate)}
                  </Text>
                ) : null}
                {doc.event.eventLocation ? (
                  <Text style={styles.infoPanelMuted}>
                    {doc.event.eventLocation}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>

          {/* ── Services Table ── */}
          <Text style={styles.sectionTitle}>Serviços</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colDesc]}>
                Descrição
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colQty]}>
                Qtd.
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colPrice]}>
                Preço Unit.
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colTotal]}>
                Total
              </Text>
            </View>
            {doc.lineItems.map((item, i) => (
              <View
                key={item.id ?? i}
                style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
              >
                <Text style={[styles.cellText, styles.colDesc]}>
                  {item.description || "—"}
                </Text>
                <Text style={[styles.cellTextMuted, styles.colQty]}>
                  {item.quantity}
                </Text>
                <Text style={[styles.cellTextMuted, styles.colPrice]}>
                  {formatCurrency(item.unitPrice, currency)}
                </Text>
                <Text style={[styles.cellText, styles.colTotal]}>
                  {formatCurrency(item.total, currency)}
                </Text>
              </View>
            ))}
          </View>

          {/* ── Totals Box ── */}
          <View style={styles.totalsContainer}>
            <View style={styles.totalsBox}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(doc.totals.subtotal, currency)}
                </Text>
              </View>
              {doc.totals.includeVat ? (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>
                    IVA ({Math.round(VAT_RATE * 100)}%)
                  </Text>
                  <Text style={styles.totalValue}>
                    {formatCurrency(doc.totals.vatAmount, currency)}
                  </Text>
                </View>
              ) : null}
              <View style={styles.grandTotalRow}>
                <Text style={styles.grandTotalLabel}>Total</Text>
                <Text style={styles.grandTotalValue}>
                  {formatCurrency(doc.totals.grandTotal, currency)}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Notes ── */}
          {doc.notes ? (
            <View style={styles.notesBox}>
              <Text style={styles.sectionTitle}>Notas</Text>
              <Text style={styles.notesText}>{doc.notes}</Text>
            </View>
          ) : null}

          {/* ── Payment Details ── */}
          {bank || business.mobilePayments.length > 0 ? (
            <View style={styles.paymentBox}>
              <Text style={styles.sectionTitle}>Dados de Pagamento</Text>
              {bank ? (
                <View style={{ marginBottom: 6 }}>
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Banco</Text>
                    <Text style={styles.paymentValue}>{bank.bankName}</Text>
                  </View>
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Titular</Text>
                    <Text style={styles.paymentValue}>{bank.accountName}</Text>
                  </View>
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Conta</Text>
                    <Text style={styles.paymentValue}>{bank.accountNumber}</Text>
                  </View>
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>NIB</Text>
                    <Text style={styles.paymentValue}>{bank.nib}</Text>
                  </View>
                  {bank.swift ? (
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentLabel}>SWIFT</Text>
                      <Text style={styles.paymentValue}>{bank.swift}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
              {business.mobilePayments.map((payment) => (
                <View key={payment.provider} style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>{payment.provider}</Text>
                  <Text style={styles.paymentValue}>
                    {payment.number} · {payment.accountName}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* ── Terms & Conditions ── */}
          <View style={styles.termsBox}>
            <Text style={styles.sectionTitle}>Termos e Condições</Text>
            {business.termsAndConditions.map((term) => (
              <Text key={term} style={styles.termItem}>
                ·  {term}
              </Text>
            ))}
          </View>

          {/* ── Signature ── */}
          <View style={styles.signatureContainer}>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine}>
                <Text>Assinatura do Cliente</Text>
              </View>
            </View>
            <View style={styles.signatureBlock}>
              {doc.issuerSignatureImage ? (
                <Image
                  src={doc.issuerSignatureImage}
                  style={styles.signatureImage}
                />
              ) : null}
              <View style={styles.signatureLine}>
                <Text>{doc.issuerName || business.name}</Text>
              </View>
              {doc.issuerRole ? (
                <Text style={styles.signatureName}>{doc.issuerRole}</Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {business.name} · {business.email} · {business.phone}
          </Text>
          <Text style={styles.footerGold}>Documento Oficial</Text>
        </View>
      </Page>
    </Document>
  );
}
