"use client";

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

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    padding: 40,
    color: "#1a1a1a",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#C9A227",
  },
  logo: {
    width: 140,
    height: 44,
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
    color: "#000000",
    marginBottom: 4,
  },
  muted: {
    fontSize: 8,
    color: "#666666",
    lineHeight: 1.4,
  },
  docTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#C9A227",
    marginBottom: 4,
  },
  docMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: "#999999",
    marginBottom: 6,
  },
  clientBox: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#fafafa",
    borderLeftWidth: 2,
    borderLeftColor: "#C9A227",
  },
  table: {
    marginTop: 8,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#000000",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    color: "#ffffff",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  colDesc: { width: "45%" },
  colQty: { width: "12%", textAlign: "center" },
  colPrice: { width: "20%", textAlign: "right" },
  colTotal: { width: "23%", textAlign: "right" },
  totalsBox: {
    marginLeft: "auto",
    width: 220,
    marginBottom: 20,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#C9A227",
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
  },
  notes: {
    marginBottom: 16,
    padding: 10,
    backgroundColor: "#fafafa",
  },
  terms: {
    marginBottom: 20,
  },
  termItem: {
    fontSize: 7.5,
    color: "#666666",
    marginBottom: 3,
    lineHeight: 1.4,
  },
  bank: {
    marginBottom: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: "#eeeeee",
  },
  signature: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBlock: {
    width: 180,
    alignItems: "center",
  },
  signatureImage: {
    height: 48,
    maxWidth: 160,
    objectFit: "contain",
    marginBottom: 4,
  },
  signatureLine: {
    width: 180,
    borderTopWidth: 1,
    borderTopColor: "#cccccc",
    paddingTop: 6,
    textAlign: "center",
    fontSize: 8,
    color: "#999999",
  },
  signatureName: {
    fontSize: 8,
    color: "#666666",
    textAlign: "center",
    marginTop: 2,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 7,
    color: "#aaaaaa",
    borderTopWidth: 1,
    borderTopColor: "#eeeeee",
    paddingTop: 8,
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
            <Text style={styles.muted}>NUIT: {business.nuit}</Text>
            <Text style={styles.muted}>{business.address}</Text>
            <Text style={styles.muted}>{business.phone}</Text>
            <Text style={styles.muted}>{business.email}</Text>
          </View>
        </View>

        <View style={styles.docMeta}>
          <View>
            <Text style={styles.docTitle}>
              {DOCUMENT_TYPE_LABELS[doc.documentType]}
            </Text>
            <Text style={styles.muted}>N.º {doc.documentNumber}</Text>
            <Text style={styles.muted}>
              Estado: {DOCUMENT_STATUS_LABELS[doc.status]}
            </Text>
          </View>
          <View style={{ textAlign: "right" }}>
            <Text style={styles.muted}>
              Data de emissão: {formatDateShort(doc.issueDate)}
            </Text>
            <Text style={styles.muted}>
              Validade: {formatDateShort(doc.expiryDate)}
            </Text>
            <Text style={styles.muted}>Moeda: {currency}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Cliente</Text>
        <View style={styles.clientBox}>
          <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 3 }}>
            {doc.clientName || "—"}
            {doc.companyName ? ` · ${doc.companyName}` : ""}
          </Text>
          {doc.clientNuit ? (
            <Text style={styles.muted}>NUIT: {doc.clientNuit}</Text>
          ) : null}
          {doc.clientAddress ? (
            <Text style={styles.muted}>{doc.clientAddress}</Text>
          ) : null}
          {doc.clientEmail ? (
            <Text style={styles.muted}>{doc.clientEmail}</Text>
          ) : null}
          {doc.clientPhone ? (
            <Text style={styles.muted}>{doc.clientPhone}</Text>
          ) : null}
        </View>

        {doc.event.eventType || doc.event.eventName ? (
          <>
            <Text style={styles.sectionTitle}>Evento</Text>
            <View style={styles.clientBox}>
              {doc.event.eventType ? (
                <Text style={styles.muted}>
                  {EVENT_TYPE_LABELS[doc.event.eventType]}
                </Text>
              ) : null}
              {doc.event.eventName ? (
                <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 3 }}>
                  {doc.event.eventName}
                </Text>
              ) : null}
              {doc.event.eventDate ? (
                <Text style={styles.muted}>
                  Data: {formatDateShort(doc.event.eventDate)}
                </Text>
              ) : null}
              {doc.event.eventLocation ? (
                <Text style={styles.muted}>{doc.event.eventLocation}</Text>
              ) : null}
            </View>
          </>
        ) : null}

        <Text style={styles.sectionTitle}>Serviços</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDesc]}>
              Descrição
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qtd.</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>
              Preço Unit.
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>
              Total
            </Text>
          </View>
          {doc.lineItems.map((item, i) => (
            <View key={item.id ?? i} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.description || "—"}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>
                {formatCurrency(item.unitPrice, currency)}
              </Text>
              <Text style={styles.colTotal}>
                {formatCurrency(item.total, currency)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text>Subtotal</Text>
            <Text>{formatCurrency(doc.totals.subtotal, currency)}</Text>
          </View>
          {doc.totals.includeVat ? (
            <View style={styles.totalRow}>
              <Text>IVA ({Math.round(VAT_RATE * 100)}%)</Text>
              <Text>{formatCurrency(doc.totals.vatAmount, currency)}</Text>
            </View>
          ) : null}
          <View style={styles.grandTotal}>
            <Text>Total</Text>
            <Text>{formatCurrency(doc.totals.grandTotal, currency)}</Text>
          </View>
        </View>

        {doc.notes ? (
          <View style={styles.notes}>
            <Text style={styles.sectionTitle}>Notas</Text>
            <Text style={styles.muted}>{doc.notes}</Text>
          </View>
        ) : null}

        {bank || business.mobilePayments.length > 0 ? (
          <View style={styles.bank}>
            <Text style={styles.sectionTitle}>Dados de Pagamento</Text>
            {bank ? (
              <>
                <Text style={styles.muted}>Banco: {bank.bankName}</Text>
                <Text style={styles.muted}>Titular: {bank.accountName}</Text>
                <Text style={styles.muted}>Conta: {bank.accountNumber}</Text>
                <Text style={styles.muted}>NIB: {bank.nib}</Text>
                {bank.swift ? (
                  <Text style={styles.muted}>SWIFT: {bank.swift}</Text>
                ) : null}
              </>
            ) : null}
            {business.mobilePayments.map((payment) => (
              <Text key={payment.provider} style={styles.muted}>
                {payment.provider}: {payment.number} · {payment.accountName}
              </Text>
            ))}
          </View>
        ) : null}

        <View style={styles.terms}>
          <Text style={styles.sectionTitle}>Termos e Condições</Text>
          {business.termsAndConditions.map((term) => (
            <Text key={term} style={styles.termItem}>
              • {term}
            </Text>
          ))}
        </View>

        <View style={styles.signature}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine}>
              <Text>Assinatura do Cliente</Text>
            </View>
          </View>
          <View style={styles.signatureBlock}>
            {doc.issuerSignatureImage ? (
              <Image src={doc.issuerSignatureImage} style={styles.signatureImage} />
            ) : null}
            <View style={styles.signatureLine}>
              <Text>{doc.issuerName || business.name}</Text>
            </View>
            {doc.issuerRole ? (
              <Text style={styles.signatureName}>{doc.issuerRole}</Text>
            ) : null}
          </View>
        </View>

        <Text style={styles.footer}>
          {business.name} · {business.email} · {business.phone}
        </Text>
      </Page>
    </Document>
  );
}
