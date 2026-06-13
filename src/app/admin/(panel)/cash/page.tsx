import AdminShell from "@/components/admin/AdminShell";
import CashPageClient from "@/app/admin/(panel)/cash/CashPageClient";
import PaymentsMigrationNotice from "@/components/admin/finance/PaymentsMigrationNotice";
import * as clientsRepo from "@/lib/admin/repositories/clients.repository";
import * as businessesRepo from "@/lib/admin/repositories/businesses.repository";
import * as eventsRepo from "@/lib/events/repositories/events.repository";
import { isPaymentsSchemaMissingError } from "@/lib/finance/payments-schema-guard";
import * as financeRepo from "@/lib/finance/repositories/overview.repository";

export default async function CashPage() {
  try {
    const [analytics, businesses, clients, events, openDocuments] =
      await Promise.all([
        financeRepo.getCashAnalytics(),
        businessesRepo.listBusinesses(),
        clientsRepo.listClients(),
        eventsRepo.listEvents(),
        financeRepo.listOpenCollectionDocuments(),
      ]);

    return (
      <AdminShell
        title="Caixa"
        subtitle="Controlo financeiro interno e análise editorial"
      >
        <CashPageClient
          analytics={analytics}
          businesses={businesses.map((b) => ({ id: b.id, name: b.name }))}
          clients={clients}
          events={events}
          openDocuments={openDocuments}
        />
      </AdminShell>
    );
  } catch (error) {
    if (isPaymentsSchemaMissingError(error)) {
      return (
        <AdminShell
          title="Caixa"
          subtitle="Controlo financeiro interno e análise editorial"
        >
          <PaymentsMigrationNotice />
        </AdminShell>
      );
    }
    throw error;
  }
}
