import * as clientsRepo from "@/lib/admin/repositories/clients.repository";
import * as eventsRepo from "@/lib/events/repositories/events.repository";
import * as inquiriesRepo from "@/lib/contact/inquiries.repository";
import { assertInquiryCanConvert } from "@/lib/contact/constants";
import type { ContactInquiry } from "@/lib/contact/types";
import type { Client, EventType } from "@/lib/admin/types";
import type { ManagedEvent } from "@/lib/events/types";

function mapProjectTypeToEventType(projectType: string): EventType {
  const normalized = projectType.toLowerCase();
  if (normalized.includes("wedding") || normalized.includes("casamento")) {
    return "wedding";
  }
  if (normalized.includes("corporate") || normalized.includes("corporat")) {
    return "corporate";
  }
  if (normalized.includes("birthday") || normalized.includes("anivers")) {
    return "birthday";
  }
  if (normalized.includes("baby")) {
    return "baby_shower";
  }
  if (normalized.includes("graduation") || normalized.includes("formatura")) {
    return "graduation";
  }
  return "other";
}

export type ConvertLeadResult = {
  inquiry: ContactInquiry;
  client: Client;
  event: ManagedEvent;
};

export async function convertLeadToClientAndEvent(
  inquiryId: string
): Promise<ConvertLeadResult> {
  const inquiry = await inquiriesRepo.getInquiryById(inquiryId);
  if (!inquiry) {
    throw new Error("Lead não encontrado.");
  }
  assertInquiryCanConvert(inquiry);

  const client = await clientsRepo.upsertClient({
    fullName: inquiry.name.trim(),
    clientType: "individual",
    companyName: "",
    nuit: "",
    email: inquiry.email.trim(),
    phone: "",
    address: "",
  });

  const eventName = inquiry.packageLabel?.trim()
    ? `${inquiry.name.trim()} — ${inquiry.packageLabel.trim()}`
    : `${inquiry.name.trim()} — ${inquiry.projectType}`;

  const event = await eventsRepo.createEvent({
    businessId: "haxr-signature",
    clientId: client.id,
    name: eventName,
    type: mapProjectTypeToEventType(inquiry.projectType),
    date: "",
    location: "",
    notes: [
      `Origem: lead website (${inquiry.source || "contacto"})`,
      inquiry.intent ? `Intenção: ${inquiry.intent}` : null,
      inquiry.message ? `Mensagem: ${inquiry.message}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
  });

  const updatedInquiry = await inquiriesRepo.updateInquiryStatus(
    inquiryId,
    "converted"
  );

  return {
    inquiry: updatedInquiry,
    client,
    event,
  };
}
