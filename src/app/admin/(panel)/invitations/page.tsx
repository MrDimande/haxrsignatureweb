import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { getCampaignSendModeStatus } from "@/lib/campaigns/admin-campaigns.service";
import { Mail, Megaphone, Plus } from "lucide-react";

export default function InvitationsHubPage() {
  const sendMode = getCampaignSendModeStatus();

  return (
    <AdminShell
      title="Convites"
      subtitle="Campanhas WhatsApp, senders e modo manual fail-closed"
      actions={
        <Link href="/admin/invitations/campaigns/new" className="admin-btn-primary">
          <Plus className="w-4 h-4" />
          Nova campanha
        </Link>
      }
    >
      <section className="grid gap-4 md:grid-cols-2 mb-8">
        <Link
          href="/admin/invitations/campaigns"
          className="admin-card p-6 hover:border-admin-gold/40 transition-colors group"
        >
          <div className="flex items-center gap-3 mb-3">
            <Megaphone className="w-5 h-5 text-admin-gold" />
            <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-admin-gold">
              Campanhas
            </h2>
          </div>
          <p className="text-sm text-grey/70 leading-relaxed">
            Criar lotes de convites, pré-visualizar mensagens personalizadas e
            operar envio manual via wa.me.
          </p>
          <p className="mt-4 text-[10px] font-mono uppercase tracking-[0.2em] text-admin-gold/70 group-hover:text-admin-gold">
            Abrir campanhas →
          </p>
        </Link>

        <div className="admin-card p-6">
          <div className="flex items-center gap-3 mb-3">
            <Mail className="w-5 h-5 text-admin-gold" />
            <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-admin-gold">
              Modo de envio
            </h2>
          </div>
          <p className="text-sm text-white/85 font-mono">
            HAXR_WHATSAPP_SEND_MODE ={" "}
            <span className="text-admin-gold">{sendMode.mode}</span>
          </p>
          <p className="mt-3 text-sm text-grey/65 leading-relaxed">
            {sendMode.manualAllowed
              ? "Modo manual: sender HAXR Signature +258 87 088 3428 · wa.me + marcar enviado. Sem Twilio."
              : sendMode.automaticBlockReason}
          </p>
          <p className="mt-3 text-[10px] font-mono text-grey/40 uppercase tracking-[0.15em]">
            {sendMode.twilioSandboxReady
              ? "Twilio Sandbox: gate aberto (LIVE_SEND controla API real)"
              : "Provider automático: fail-closed até twilio_sandbox + secrets"}
          </p>
        </div>
      </section>

      <section className="admin-card p-6">
        <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold mb-4">
          Senders permitidos
        </h2>
        <ul className="space-y-2 text-sm text-grey/75">
          <li>• HAXR Signature (+258 87 088 3428) — manual wa.me</li>
          <li>• Número empresarial verificado do cliente</li>
          <li>• Twilio Sandbox / número dedicado (automático)</li>
        </ul>
        <p className="mt-4 text-xs text-grey/45">
          Nunca tokens plaintext. Nunca registar +258 87 088 3428 na Twilio.
          Production: segundo número dedicado.
        </p>
      </section>
    </AdminShell>
  );
}
