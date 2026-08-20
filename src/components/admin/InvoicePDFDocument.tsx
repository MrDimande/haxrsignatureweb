import React from "react";
import {
  Document,
  Image,
  Page,
  Text,
  View,
} from "@react-pdf/renderer";
import { VAT_RATE } from "@/lib/admin/constants";
import type { Business, InvoiceDocument } from "@/lib/admin/types";
import { resolveDocumentContactProfile } from "@/lib/admin/commercial-pdf/document-pdf-contact";
import { resolveCommercialPaymentDetails } from "@/lib/admin/commercial-pdf/document-pdf-payment";
import {
  formatDocumentCategory,
  formatDocumentStatusLabel,
  formatDocumentTypeLabel,
  formatEventTypeLabel,
  formatPdfCurrency,
  formatPdfDate,
  resolveDocumentDateMeta,
} from "@/lib/admin/commercial-pdf/document-pdf-formatters";
import {
  createCommercialPdfStyles,
  getDocumentPdfTheme,
} from "@/lib/admin/commercial-pdf/document-pdf-theme";
import { resolveDocumentTerms } from "@/lib/admin/commercial-pdf/document-pdf-terms";

export type InvoicePDFDocumentProps = {
  document: InvoiceDocument;
  business: Business;
  logoUrl?: string;
  watermarkUrl?: string;
};

export default function InvoicePDFDocument({
  document: doc,
  business,
  logoUrl,
  watermarkUrl,
}: InvoicePDFDocumentProps) {
  const watermarkSrc =
    watermarkUrl ||
    (doc.pdfTemplate === "maison_signature"
      ? "/images/brand/haxr-mark-gold.png"
      : undefined);
  const theme = getDocumentPdfTheme(doc.pdfTemplate);
  const styles = createCommercialPdfStyles(theme);
  const currency = doc.totals.currency;

  const contactProfile = resolveDocumentContactProfile({
    business,
    contactChannel: doc.contactChannel,
  });

  const paymentDetails = resolveCommercialPaymentDetails(business);
  const primaryBank = paymentDetails.bankAccounts[0];

  const dateMeta = resolveDocumentDateMeta(doc);

  const terms = resolveDocumentTerms({
    documentType: doc.documentType,
    businessId: business.id,
    businessTerms: business.termsAndConditions,
  });

  const hasEvent = Boolean(
    doc.event.eventType ||
      doc.event.eventName ||
      doc.event.eventDate ||
      doc.event.eventLocation
  );

  const statusBadgeStyle = (() => {
    switch (doc.status) {
      case "draft":
        return {
          backgroundColor: theme.colors.badgeDraftBg,
          color: theme.colors.badgeDraftText,
          borderColor: theme.colors.badgeDraftBorder,
        };
      case "sent":
        return {
          backgroundColor: theme.colors.badgeSentBg,
          color: theme.colors.badgeSentText,
          borderColor: theme.colors.badgeSentBorder,
        };
      case "paid":
        return {
          backgroundColor: theme.colors.badgePaidBg,
          color: theme.colors.badgePaidText,
          borderColor: theme.colors.badgePaidBorder,
        };
      case "cancelled":
        return {
          backgroundColor: theme.colors.badgeCancelledBg,
          color: theme.colors.badgeCancelledText,
          borderColor: theme.colors.badgeCancelledBorder,
        };
      default:
        return {
          backgroundColor: theme.colors.badgeDraftBg,
          color: theme.colors.badgeDraftText,
          borderColor: theme.colors.badgeDraftBorder,
        };
    }
  })();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── Running Header on Continuation Pages ── */}
        <View style={styles.runningHeader} fixed>
          <Text
            style={styles.runningHeaderBrand}
            render={({ pageNumber }) =>
              pageNumber > 1 ? contactProfile.label : ""
            }
          />
          <Text
            style={styles.runningHeaderDoc}
            render={({ pageNumber }) =>
              pageNumber > 1
                ? `${formatDocumentTypeLabel(doc.documentType)} N.º ${doc.documentNumber}`
                : ""
            }
          />
        </View>

        {/* ── Top Header: Brand Logo & Document Metadata ── */}
        <View style={styles.headerRow}>
          <View style={styles.brandContainer}>
            {logoUrl ? (
              <Image src={logoUrl} style={styles.logoImage} />
            ) : (
              <Text style={styles.brandName}>{business.name}</Text>
            )}
            <Text style={styles.brandMeta}>
              NUIT: {contactProfile.nuit} · {contactProfile.location}
            </Text>
            <Text style={styles.contactMeta}>
              {contactProfile.email} · {contactProfile.phone}
            </Text>
          </View>

          <View style={styles.docMetaContainer}>
            <Text style={styles.docCategoryTag}>
              {formatDocumentCategory(doc.documentType, contactProfile.isHaxr)}
            </Text>
            <Text style={styles.docTypeTitle}>
              {formatDocumentTypeLabel(doc.documentType)}
            </Text>
            <Text style={styles.docNumberText}>N.º {doc.documentNumber}</Text>

            <View style={styles.datesRow}>
              <Text style={styles.dateItem}>
                {dateMeta.issueDateLabel}: {dateMeta.issueDateFormatted}
              </Text>
              {dateMeta.secondaryDateLabel && dateMeta.secondaryDateFormatted ? (
                <Text style={styles.dateItem}>
                  {dateMeta.secondaryDateLabel}: {dateMeta.secondaryDateFormatted}
                </Text>
              ) : null}
              <Text style={styles.dateItem}>Moeda: {dateMeta.currency}</Text>
            </View>

            <View style={styles.badgeContainer}>
              <Text style={[styles.statusBadge, statusBadgeStyle]}>
                {formatDocumentStatusLabel(doc.status)}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Client & Event Info Panels (Protected against split) ── */}
        <View style={styles.panelsRow} wrap={false}>
          {/* Client Panel */}
          <View style={styles.panelCard}>
            <Text style={styles.panelLabel}>Cliente</Text>
            <Text style={styles.panelValuePrimary}>
              {doc.clientName || "—"}
            </Text>
            {doc.clientType === "company" && doc.companyName ? (
              <Text style={styles.panelValueSecondary}>{doc.companyName}</Text>
            ) : null}
            {doc.clientNuit ? (
              <Text style={styles.panelValueSecondary}>
                NUIT: {doc.clientNuit}
              </Text>
            ) : null}
            {doc.clientAddress ? (
              <Text style={styles.panelValueSecondary}>
                {doc.clientAddress}
              </Text>
            ) : null}
            {doc.clientEmail ? (
              <Text style={styles.panelValueSecondary}>
                {doc.clientEmail}
              </Text>
            ) : null}
            {doc.clientPhone ? (
              <Text style={styles.panelValueSecondary}>
                {doc.clientPhone}
              </Text>
            ) : null}
          </View>

          {/* Event Panel (if present) */}
          {hasEvent ? (
            <View style={styles.panelCard}>
              <Text style={styles.panelLabel}>Evento</Text>
              {doc.event.eventName ? (
                <Text style={styles.panelValuePrimary}>
                  {doc.event.eventName}
                </Text>
              ) : null}
              {doc.event.eventType ? (
                <Text style={styles.panelValueSecondary}>
                  {formatEventTypeLabel(doc.event.eventType)}
                </Text>
              ) : null}
              {doc.event.eventDate ? (
                <Text style={styles.panelValueSecondary}>
                  Data: {formatPdfDate(doc.event.eventDate)}
                </Text>
              ) : null}
              {doc.event.eventLocation ? (
                <Text style={styles.panelValueSecondary}>
                  {doc.event.eventLocation}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* ── Services Table ── */}
        <View style={styles.table}>
          <View style={styles.tableHeaderRow} fixed>
            <Text style={[styles.th, styles.colDesc]}>Descrição</Text>
            <Text style={[styles.th, styles.colQty]}>Qtd.</Text>
            <Text style={[styles.th, styles.colPrice]}>Preço</Text>
            <Text style={[styles.th, styles.colTotal]}>Total</Text>
          </View>
          {doc.lineItems.map((item, i) => (
            <View
              key={item.id ?? i}
              style={[
                styles.tableRow,
                i % 2 !== 0 ? styles.tableRowAlt : {},
              ]}
              wrap={false}
            >
              <Text style={[styles.td, styles.colDesc]}>
                {item.description || "—"}
              </Text>
              <Text style={[styles.td, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.td, styles.colPrice]}>
                {formatPdfCurrency(item.unitPrice, currency)}
              </Text>
              <Text style={[styles.tdBold, styles.colTotal]}>
                {formatPdfCurrency(item.total, currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Totals Box (Protected against split) ── */}
        <View style={styles.totalsWrapper} wrap={false}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>
                {formatPdfCurrency(doc.totals.subtotal, currency)}
              </Text>
            </View>
            {doc.totals.includeVat ? (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>
                  IVA ({Math.round(VAT_RATE * 100)}%)
                </Text>
                <Text style={styles.totalsValue}>
                  {formatPdfCurrency(doc.totals.vatAmount, currency)}
                </Text>
              </View>
            ) : null}
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>
                {formatPdfCurrency(doc.totals.grandTotal, currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Intentional Closing Group (Resilient internal pagination) ── */}
        <View style={styles.closureGroup}>
          {doc.pdfTemplate === "maison_signature" && watermarkSrc ? (
            <Image src={watermarkSrc} style={styles.maisonWatermark} />
          ) : null}

          {/* Payment Details & Notes (Moves to Page 2 when space is insufficient) */}
          {(primaryBank || paymentDetails.mobilePayments.length > 0 || doc.notes) && (
            <View style={styles.paymentNotesRow} wrap={false}>
              {primaryBank || paymentDetails.mobilePayments.length > 0 ? (
                <View style={styles.paymentBox} wrap={false}>
                  <Text style={styles.sectionMiniHeader}>
                    Dados para Pagamento
                  </Text>
                  {primaryBank ? (
                    <View style={{ marginBottom: 3 }}>
                      <Text style={styles.paymentItemBold}>
                        {primaryBank.bankName}
                      </Text>
                      <Text style={styles.paymentItem}>
                        Titular: {primaryBank.accountName}
                      </Text>
                      <Text style={styles.paymentItem}>
                        Conta: {primaryBank.accountNumber}
                      </Text>
                      <Text style={styles.paymentItem}>
                        NIB: {primaryBank.nib}
                      </Text>
                      {primaryBank.swift ? (
                        <Text style={styles.paymentItem}>
                          SWIFT: {primaryBank.swift}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                  {paymentDetails.mobilePayments.map((payment) => (
                    <Text key={payment.provider} style={styles.paymentItem}>
                      {payment.provider}: {payment.number} · {payment.accountName}
                    </Text>
                  ))}
                </View>
              ) : null}

              {doc.notes ? (
                <View style={styles.notesBox}>
                  <Text style={styles.sectionMiniHeader}>Observações</Text>
                  <Text style={styles.notesText}>{doc.notes}</Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Commercial Terms (Splits cleanly between items when genuinely necessary) */}
          {terms.length > 0 && (
            <View style={styles.termsBlock}>
              <Text style={styles.termsHeader}>Condições Comerciais</Text>
              {terms.map((term, index) => (
                <Text key={index} style={styles.termItem} wrap={false}>
                  · {term}
                </Text>
              ))}
            </View>
          )}

          {/* Signatures Block (Strictly Atomic) */}
          <View style={styles.signaturesRow} wrap={false}>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureImageContainer} />
              <View style={styles.signatureLine}>
                <Text style={styles.signatureRole}>Assinatura do Cliente</Text>
              </View>
            </View>

            <View style={styles.signatureBlock}>
              <View style={styles.signatureImageContainer}>
                {doc.issuerSignatureImage ? (
                  <Image
                    src={doc.issuerSignatureImage}
                    style={styles.signatureImage}
                  />
                ) : null}
              </View>
              <View style={styles.signatureLine}>
                <Text style={styles.signatureName}>
                  {doc.issuerName || business.name}
                </Text>
                {doc.issuerRole ? (
                  <Text style={styles.signatureRole}>{doc.issuerRole}</Text>
                ) : null}
              </View>
            </View>
          </View>
        </View>

        {/* ── Fixed Running Footer ── */}
        <View style={styles.runningFooter} fixed>
          <Text style={styles.runningFooterText}>
            {contactProfile.label} · {contactProfile.email} · {contactProfile.phone}
          </Text>
          <Text
            style={styles.runningFooterPage}
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
