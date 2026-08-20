import type { Business } from "@/lib/admin/types";

export interface DocumentMobilePayment {
  provider: string;
  number: string;
  accountName: string;
}

export interface DocumentPaymentDetails {
  bankAccounts: Business["bankAccounts"];
  mobilePayments: DocumentMobilePayment[];
}

/**
 * Resolves commercial document payment presentation.
 * HAXR commercial documents display Bank Transfer and e-Mola only (M-Pesa is excluded).
 * Non-HAXR businesses retain their own payment presentation.
 */
export function resolveCommercialPaymentDetails(
  business: Business
): DocumentPaymentDetails {
  const isHaxr = business.id === "haxr-signature";

  const mobilePayments: DocumentMobilePayment[] = (
    business.mobilePayments || []
  )
    .filter((p) => {
      if (isHaxr) {
        // Exclude M-Pesa from HAXR commercial documents
        return p.provider.toLowerCase() !== "m-pesa";
      }
      return true;
    })
    .map((p) => {
      if (isHaxr && p.provider.toLowerCase() === "emola") {
        return {
          ...p,
          provider: "e-Mola",
        };
      }
      return p;
    });

  return {
    bankAccounts: business.bankAccounts || [],
    mobilePayments,
  };
}
