"use client";

import { useState, useTransition } from "react";
import {
  createCreativeApprovalAction,
  createPortalContractAction,
  createPortalMessageAction,
} from "@/lib/portal/actions/portal-content.actions";
import type {
  PortalContract,
  PortalCreativeApproval,
  PortalTeamMessage,
} from "@/lib/portal/portal-premium.types";

type EventPortalContentPanelProps = {
  eventId: string;
  clientId: string;
  messages: PortalTeamMessage[];
  approvals: PortalCreativeApproval[];
  contracts: PortalContract[];
};

function formatWhen(value: string): string {
  return new Date(value).toLocaleString("pt-MZ", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Maputo",
  });
}

export default function EventPortalContentPanel({
  eventId,
  clientId,
  messages,
  approvals,
  contracts,
}: EventPortalContentPanelProps) {
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();

  const eventMessages = messages.filter(
    (message) => message.eventId === eventId || message.eventId === null
  );
  const eventApprovals = approvals.filter((approval) => approval.eventId === eventId);
  const eventContracts = contracts.filter(
    (contract) => contract.eventId === eventId || contract.eventId === null
  );

  function handleSubmit(form: HTMLFormElement, action: "message" | "approval" | "contract") {
    setFeedback("");
    const formData = new FormData(form);

    startTransition(async () => {
      let result:
        | { success: true }
        | { success: false; error: string };

      if (action === "message") {
        result = await createPortalMessageAction({
          clientId,
          eventId,
          body: String(formData.get("body") ?? ""),
          authorName: String(formData.get("authorName") ?? "").trim() || undefined,
          isPinned: formData.get("isPinned") === "on",
        });
      } else if (action === "approval") {
        result = await createCreativeApprovalAction({
          clientId,
          eventId,
          approvalType: String(formData.get("approvalType") ?? "invite") as
            | "invite"
            | "layout"
            | "delivery"
            | "other",
          title: String(formData.get("title") ?? ""),
          description: String(formData.get("description") ?? "").trim() || undefined,
          attachmentUrl: String(formData.get("attachmentUrl") ?? "").trim() || undefined,
        });
      } else {
        result = await createPortalContractAction({
          clientId,
          eventId,
          title: String(formData.get("title") ?? ""),
          description: String(formData.get("description") ?? "").trim() || undefined,
          fileUrl: String(formData.get("fileUrl") ?? "").trim() || undefined,
        });
      }

      if (!result.success) {
        setFeedback(result.error);
        return;
      }

      setFeedback("Conteúdo publicado no portal do cliente.");
      form.reset();
      window.location.reload();
    });
  }

  return (
    <section className="admin-card p-6 mb-8 border-white/10 space-y-8">
      <div>
        <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-admin-gold/80 mb-2">
          Portal cliente
        </p>
        <h3 className="font-serif text-xl font-light text-white/90">
          Mensagens, aprovações e contratos
        </h3>
        <p className="text-sm text-grey/50 mt-2">
          O que publicar aqui aparece no portal premium do cliente.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <form
          className="space-y-3 border border-white/5 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit(event.currentTarget, "message");
          }}
        >
          <p className="text-xs uppercase tracking-wider text-admin-gold">Nova mensagem</p>
          <input
            name="authorName"
            placeholder="Autor (opcional)"
            className="admin-input w-full text-sm"
          />
          <textarea
            name="body"
            required
            rows={4}
            placeholder="Mensagem para o cliente"
            className="admin-input w-full text-sm"
          />
          <label className="flex items-center gap-2 text-xs text-grey/60">
            <input type="checkbox" name="isPinned" />
            Fixar no topo
          </label>
          <button type="submit" disabled={isPending} className="admin-btn-primary text-xs w-full">
            Publicar mensagem
          </button>
          {eventMessages.length > 0 ? (
            <ul className="space-y-2 pt-2 border-t border-white/5">
              {eventMessages.slice(0, 3).map((message) => (
                <li key={message.id} className="text-xs text-grey/55">
                  {message.isPinned ? "📌 " : ""}
                  {message.body.slice(0, 80)}
                  {message.body.length > 80 ? "…" : ""} · {formatWhen(message.createdAt)}
                </li>
              ))}
            </ul>
          ) : null}
        </form>

        <form
          className="space-y-3 border border-white/5 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit(event.currentTarget, "approval");
          }}
        >
          <p className="text-xs uppercase tracking-wider text-admin-gold">Nova aprovação</p>
          <select name="approvalType" className="admin-input w-full text-sm" defaultValue="invite">
            <option value="invite">Convite</option>
            <option value="layout">Layout</option>
            <option value="delivery">Entrega</option>
            <option value="other">Outro</option>
          </select>
          <input
            name="title"
            required
            placeholder="Título (ex: Convite v2)"
            className="admin-input w-full text-sm"
          />
          <textarea
            name="description"
            rows={2}
            placeholder="Notas para o cliente"
            className="admin-input w-full text-sm"
          />
          <input
            name="attachmentUrl"
            placeholder="URL do ficheiro (opcional)"
            className="admin-input w-full text-sm"
          />
          <button type="submit" disabled={isPending} className="admin-btn-primary text-xs w-full">
            Pedir aprovação
          </button>
          {eventApprovals.length > 0 ? (
            <ul className="space-y-2 pt-2 border-t border-white/5">
              {eventApprovals.slice(0, 3).map((approval) => (
                <li key={approval.id} className="text-xs text-grey/55">
                  {approval.title} · {approval.status}
                </li>
              ))}
            </ul>
          ) : null}
        </form>

        <form
          className="space-y-3 border border-white/5 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit(event.currentTarget, "contract");
          }}
        >
          <p className="text-xs uppercase tracking-wider text-admin-gold">Novo contrato</p>
          <input
            name="title"
            required
            placeholder="Título do contrato"
            className="admin-input w-full text-sm"
          />
          <textarea
            name="description"
            rows={2}
            placeholder="Descrição (opcional)"
            className="admin-input w-full text-sm"
          />
          <input
            name="fileUrl"
            placeholder="URL do PDF (opcional)"
            className="admin-input w-full text-sm"
          />
          <button type="submit" disabled={isPending} className="admin-btn-primary text-xs w-full">
            Publicar contrato
          </button>
          {eventContracts.length > 0 ? (
            <ul className="space-y-2 pt-2 border-t border-white/5">
              {eventContracts.slice(0, 3).map((contract) => (
                <li key={contract.id} className="text-xs text-grey/55">
                  {contract.title} · {contract.status}
                </li>
              ))}
            </ul>
          ) : null}
        </form>
      </div>

      {feedback ? <p className="text-sm text-emerald-300">{feedback}</p> : null}
    </section>
  );
}
