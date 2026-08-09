import SuppliersPageClient from "./SuppliersPageClient";
import { listSupplierBackoffice } from "@/lib/admin/repositories/suppliers.repository";
import type { SupplierBackofficeSnapshot } from "@/lib/admin/suppliers.types";

const emptySnapshot: SupplierBackofficeSnapshot = {
  applications: [],
  profiles: [],
  recentEvents: [],
};

export default async function SuppliersPage() {
  try {
    const snapshot = await listSupplierBackoffice();
    return <SuppliersPageClient initialSnapshot={snapshot} />;
  } catch (error) {
    console.error("[supplier-backoffice] initial load failed", error);
    return (
      <SuppliersPageClient
        initialSnapshot={emptySnapshot}
        initialError="Não foi possível carregar o backoffice de fornecedores. Confirme que a migration desta versão foi validada no ambiente actual."
      />
    );
  }
}
