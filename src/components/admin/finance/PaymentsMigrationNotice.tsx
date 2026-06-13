import Link from "next/link";
import { Database } from "lucide-react";

type PaymentsMigrationNoticeProps = {
  migrationFile?: string;
};

export default function PaymentsMigrationNotice({
  migrationFile = "008_payments.sql",
}: PaymentsMigrationNoticeProps) {
  return (
    <div className="admin-card max-w-2xl p-8 space-y-5 border-amber-500/20 bg-amber-500/5">
      <div className="flex items-start gap-4">
        <Database className="w-5 h-5 text-amber-300/80 shrink-0 mt-0.5" />
        <div className="space-y-3">
          <p className="font-serif text-xl font-light text-white/90">
            Módulo de pagamentos por activar
          </p>
          <p className="text-sm text-grey/65 leading-relaxed">
            Execute as migrations{" "}
            <code className="text-admin-gold/90">008_payments.sql</code> e{" "}
            <code className="text-admin-gold/90">009_finance_extras.sql</code>{" "}
            no Supabase para activar pagamentos, despesas, metas e exportação
            completa.
          </p>
          <p className="text-xs text-grey/45 italic">
            Até lá, a caixa continua a funcionar com base nos documentos
            marcados como «Pago».
          </p>
          <Link
            href="/admin/settings"
            className="inline-flex font-mono text-[9px] tracking-[0.25em] uppercase text-admin-gold hover:opacity-80"
          >
            Ver definições →
          </Link>
        </div>
      </div>
    </div>
  );
}
