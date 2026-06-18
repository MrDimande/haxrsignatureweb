import { ADMIN_GOLD, DEFAULT_TERMS_BRAINYWRITE, DEFAULT_TERMS_HAXR } from "@/lib/admin/constants";
import { brandAssets } from "@/lib/assets";
import type { Business, BusinessId } from "@/lib/admin/types";
import { siteContact } from "@/lib/site-config";

const HAXR_PAYMENT_HOLDER = "Rabeca António Come";

export const businesses: Business[] = [
  {
    id: "haxr-signature",
    name: "HAXR Signature",
    logo: brandAssets.logoHorizontal,
    nuit: "150725161",
    phone: "+258 87 088 3428 · +258 82 088 3428",
    email: siteContact.email,
    whatsapp: "258870883428",
    address: siteContact.location,
    invoicePrefix: "",
    defaultCurrency: "MZN",
    theme: {
      primaryColor: ADMIN_GOLD,
      accentColor: "#c9a96e",
    },
    bankAccounts: [
      {
        bankName: "Millennium BIM",
        accountName: HAXR_PAYMENT_HOLDER,
        accountNumber: "1241076783",
        nib: "000100000124107678357",
      },
    ],
    mobilePayments: [
      {
        provider: "Emola",
        number: "+258 87 088 3428",
        accountName: HAXR_PAYMENT_HOLDER,
      },
      {
        provider: "M-Pesa",
        number: "+258 84 881 5853",
        accountName: HAXR_PAYMENT_HOLDER,
      },
    ],
    termsAndConditions: DEFAULT_TERMS_HAXR,
  },
  {
    id: "brainywrite",
    name: "BrainyWrite",
    logo: brandAssets.brainywriteLogo,
    nuit: "401234567",
    phone: "+258 84 000 0000",
    email: "contacto@brainywrite.co.mz",
    whatsapp: "258840000000",
    address: "Maputo, Moçambique",
    invoicePrefix: "BW",
    defaultCurrency: "MZN",
    theme: {
      primaryColor: ADMIN_GOLD,
      accentColor: "#4a90d9",
    },
    bankAccounts: [
      {
        bankName: "Millennium BIM",
        accountName: "BrainyWrite Lda",
        accountNumber: "9876543210987",
        nib: "00010000000098765432109",
        swift: "BIMOMZMX",
      },
    ],
    mobilePayments: [],
    termsAndConditions: DEFAULT_TERMS_BRAINYWRITE,
  },
];

export function getBusiness(id: string): Business {
  return businesses.find((b) => b.id === id) ?? businesses[0];
}

export function getBusinessById(id: BusinessId): Business {
  return getBusiness(id);
}
