"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  changeCampaignSenderAction,
  exportCampaignAction,
  manualRecipientAction,
  previewCampaignAction,
  updateCampaignMessageAction,
} from "@/lib/campaigns/actions/campaigns.actions";
import { SENDER_KIND_LABELS } from "@/lib/campaigns/sender-profiles";
import type {
  InvitationCampaign,
  ManualRecipientOps,
  SenderProfile,
} from "@/lib/campaigns/types";
import { Copy, ExternalLink, Check } from "lucide-react";

type SendModeStatus = {
  mode: string;
  manualAllowed: boolean;
  automaticBlocked: true;
  automaticBlockReason: string;
};

type Props = {
  campaign: InvitationCampaign;
  recipients: ManualRecipientOps[];
  senders: SenderProfile[];
  sendMode: SendModeStatus;
};

export default function CampaignDetailClient({
  campaign: initialCampaign,
  recipients: initialRecipients,
  senders,
  sendMode,
}: Props) {
  const [campaign, setCampaign] = useState(initialCampaign);
  const [recipients, setRecipients] = useState(initialRecipients);
  const [messageTemplate, setMessageTemplate] = useState(
    initialCampaign.messageTemplate
  );
  const [senderProfileId, setSenderProfileId] = useState(
    initialCampaign.senderProfileId ?? ""
  );
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const markedCount = useMemo(
    () => recipients.filter((r) => r.status === "marked_sent").length,
    [recipients]
  );

  async function handleUpdateMessage() {
    setBusy(true);
    setError(null);
    const result = await updateCampaignMessageAction({
      eventId: campaign.eventId,
      campaignId: campaign.id,
      messageTemplate,
    });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setCampaign(result.data);
    setInfo("Mensagem actualizada e destinatários re-renderizados.");
    const preview = await previewCampaignAction({
      eventId: campaign.eventId,
      campaignId: campaign.id,
    });
    if (preview.success) setRecipients(preview.data);
  }

  async function handleChangeSender() {
    if (!senderProfileId) return;
    setBusy(true);
    setError(null);
    const result = await changeCampaignSenderAction({
      eventId: campaign.eventId,
      campaignId: campaign.id,
      senderProfileId,
    });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setCampaign(result.data);
    setInfo("Sender actualizado.");
    const preview = await previewCampaignAction({
      eventId: campaign.eventId,
      campaignId: campaign.id,
    });
    if (preview.success) setRecipients(preview.data);
  }

  async function handlePreviewAll() {
    setBusy(true);
    setError(null);
    const result = await previewCampaignAction({
      eventId: campaign.eventId,
      campaignId: campaign.id,
    });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setRecipients(result.data);
    setInfo(`${result.data.length} previews personalizados gerados.`);
  }

  async function handleManual(
    recipientId: string,
    action: "copy" | "open" | "mark_sent",
    waMeUrl: string | null,
    message: string
  ) {
    setError(null);
    if (action === "copy") {
      try {
        await navigator.clipboard.writeText(message);
      } catch {
        setError("Não foi possível copiar para a área de transferência.");
      }
    }
    if (action === "open" && waMeUrl) {
      window.open(waMeUrl, "_blank", "noopener,noreferrer");
    }

    const result = await manualRecipientAction({
      eventId: campaign.eventId,
      campaignId: campaign.id,
      recipientId,
      action,
    });
    if (!result.success) {
      setError(result.error);
      return;
    }
    setRecipients((prev) =>
      prev.map((row) => (row.recipientId === recipientId ? result.data : row))
    );
  }

  async function handleExport() {
    setBusy(true);
    setError(null);
    const result = await exportCampaignAction({
      eventId: campaign.eventId,
      campaignId: campaign.id,
    });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    const blob = new Blob([result.data], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `campanha-${campaign.id.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setInfo("Export CSV gerado (sem chamada a provider).");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center">
        <Link
          href={`/admin/invitations/campaigns?eventId=${campaign.eventId}`}
          className="text-[10px] font-mono uppercase tracking-[0.2em] text-grey/50 hover:text-admin-gold"
        >
          ← Campanhas
        </Link>
        <span className="text-[10px] font-mono text-grey/40">
          {markedCount}/{recipients.length} marcados como enviados
        </span>
        <span className="ml-auto text-[10px] font-mono text-admin-gold/80">
          modo {sendMode.mode}
        </span>
      </div>

      {error ? (
        <div className="admin-card p-4 border border-red-500/30 text-sm text-red-300">
          {error}
        </div>
      ) : null}
      {info ? (
        <div className="admin-card p-4 border border-admin-gold/20 text-sm text-admin-gold/90">
          {info}
        </div>
      ) : null}

      <section className="admin-card p-6 space-y-4">
        <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold">
          Sender · Mensagem
        </h2>
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <select
            className="admin-input"
            value={senderProfileId}
            onChange={(e) => setSenderProfileId(e.target.value)}
          >
            {senders.map((sender) => (
              <option key={sender.id} value={sender.id}>
                {sender.publicName} · {SENDER_KIND_LABELS[sender.senderKind]} ·{" "}
                {sender.maskedNumber}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="admin-btn-secondary"
            disabled={busy || !senderProfileId}
            onClick={handleChangeSender}
          >
            Mudar sender
          </button>
        </div>
        <textarea
          className="admin-input min-h-[140px] font-mono text-xs"
          value={messageTemplate}
          onChange={(e) => setMessageTemplate(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="admin-btn-secondary"
            disabled={busy}
            onClick={handleUpdateMessage}
          >
            Guardar mensagem
          </button>
          <button
            type="button"
            className="admin-btn-secondary"
            disabled={busy}
            onClick={handlePreviewAll}
          >
            Gerar previews
          </button>
          <button
            type="button"
            className="admin-btn-primary"
            disabled={busy}
            onClick={handleExport}
          >
            Export campanha
          </button>
        </div>
        {!sendMode.manualAllowed ? (
          <p className="text-xs text-amber-300/80">
            Operações copy/open/marcar enviado exigem{" "}
            <code>HAXR_WHATSAPP_SEND_MODE=manual</code>. Actual: {sendMode.mode}.
          </p>
        ) : (
          <p className="text-xs text-grey/50">
            Modo manual: nenhuma chamada real a provider. Use wa.me + marcar
            enviado.
          </p>
        )}
      </section>

      <section className="admin-card overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5">
          <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold">
            Destinatários · mensagem por guest
          </h2>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {recipients.map((row) => (
            <div key={row.recipientId} className="p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm text-white/90">{row.guestName}</p>
                <span className="text-[10px] font-mono text-grey/40">
                  {row.phoneMasked || "sem número"}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-admin-gold/60">
                  {row.status}
                </span>
              </div>
              <pre className="whitespace-pre-wrap text-xs text-grey/70 bg-black/30 rounded-lg p-3 font-mono">
                {row.renderedMessage}
              </pre>
              <p className="text-[10px] font-mono text-grey/40 break-all">
                {row.invitationUrl}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="admin-btn-secondary text-[10px]"
                  disabled={!sendMode.manualAllowed}
                  onClick={() =>
                    handleManual(
                      row.recipientId,
                      "copy",
                      row.waMeUrl,
                      row.renderedMessage
                    )
                  }
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copiar
                </button>
                <button
                  type="button"
                  className="admin-btn-secondary text-[10px]"
                  disabled={!sendMode.manualAllowed || !row.waMeUrl}
                  onClick={() =>
                    handleManual(
                      row.recipientId,
                      "open",
                      row.waMeUrl,
                      row.renderedMessage
                    )
                  }
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Abrir wa.me
                </button>
                <button
                  type="button"
                  className="admin-btn-primary text-[10px]"
                  disabled={!sendMode.manualAllowed}
                  onClick={() =>
                    handleManual(
                      row.recipientId,
                      "mark_sent",
                      row.waMeUrl,
                      row.renderedMessage
                    )
                  }
                >
                  <Check className="w-3.5 h-3.5" />
                  Marcar enviado
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
