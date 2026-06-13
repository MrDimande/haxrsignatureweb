import { formatCurrency } from "@/lib/calculations";
import { SERVICE_CATEGORY_LABELS } from "@/lib/admin/constants";
import * as businessesRepo from "@/lib/admin/repositories/businesses.repository";
import * as catalogRepo from "@/lib/admin/repositories/catalog.repository";
import * as signaturesRepo from "@/lib/admin/repositories/signatures.repository";
import AdminShell from "@/components/admin/AdminShell";
import SignatureManager from "@/components/admin/SignatureManager";

export default async function SettingsPage() {
  const [businesses, catalog, signatures] = await Promise.all([
    businessesRepo.listBusinesses(),
    catalogRepo.listCatalog(),
    signaturesRepo.listSignatures(),
  ]);

  return (
    <AdminShell
      title="Definições"
      subtitle="Empresas, catálogo e configuração"
    >
      <div className="space-y-8 max-w-4xl">
        <SignatureManager
          businesses={businesses}
          initialSignatures={signatures}
        />

        <section className="admin-card p-6">
          <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold mb-6">
            Perfis de Negócio
          </h2>
          <div className="space-y-4">
            {businesses.map((business) => (
              <div
                key={business.id}
                className="p-4 border border-grey-dark/80 rounded-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-serif text-lg text-white">{business.name}</p>
                    <p className="text-sm text-grey/60 mt-1">
                      Prefixo: {business.invoicePrefix || "(sem prefixo)"} · NUIT:{" "}
                      {business.nuit}
                    </p>
                    <p className="text-sm text-grey/60">{business.email}</p>
                  </div>
                  <div className="text-right text-xs text-grey/50 font-mono">
                    <p>Moeda: {business.defaultCurrency}</p>
                    <p>WhatsApp: {business.whatsapp}</p>
                  </div>
                </div>
                {business.bankAccounts[0] ? (
                  <div className="text-xs text-grey/40 mt-3 space-y-1">
                    <p>
                      {business.bankAccounts[0].bankName} · Conta:{" "}
                      {business.bankAccounts[0].accountNumber}
                    </p>
                    <p>NIB: {business.bankAccounts[0].nib}</p>
                    <p>Titular: {business.bankAccounts[0].accountName}</p>
                  </div>
                ) : null}
                {business.mobilePayments.length > 0 ? (
                  <div className="text-xs text-grey/40 mt-2 space-y-1">
                    {business.mobilePayments.map((payment) => (
                      <p key={payment.provider}>
                        {payment.provider}: {payment.number} · {payment.accountName}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section className="admin-card p-6">
          <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold mb-6">
            Catálogo de Serviços
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {catalog.map((service) => (
              <div
                key={service.id}
                className="p-4 border border-grey-dark/60 rounded-sm"
              >
                <p className="text-white text-sm">{service.name}</p>
                <p className="text-[10px] font-mono text-admin-gold/60 mt-1 uppercase tracking-wider">
                  {SERVICE_CATEGORY_LABELS[service.category]}
                </p>
                {service.description ? (
                  <p className="text-xs text-grey/50 mt-1">{service.description}</p>
                ) : null}
                <p className="text-admin-gold font-mono text-sm mt-2">
                  {formatCurrency(service.basePrice)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-card p-6">
          <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold mb-4">
            Sistema
          </h2>
          <ul className="text-sm text-grey/60 space-y-2">
            <li>· Base de dados: Supabase (PostgreSQL)</li>
            <li>· IVA padrão: 16%</li>
            <li>· Moedas suportadas: MZN, USD, ZAR</li>
            <li>· View analítica: document_analytics</li>
          </ul>
        </section>
      </div>
    </AdminShell>
  );
}
