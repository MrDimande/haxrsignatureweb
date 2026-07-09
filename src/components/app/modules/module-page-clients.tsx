"use client";

import BudgetModuleView from "@/components/app/modules/BudgetModuleView";
import ChecklistModuleView from "@/components/app/modules/ChecklistModuleView";
import ConciergeModuleView from "@/components/app/modules/ConciergeModuleView";
import DocumentsModuleView from "@/components/app/modules/DocumentsModuleView";
import GuestsModuleView from "@/components/app/modules/GuestsModuleView";
import ModulePageClient from "@/components/app/modules/ModulePageClient";
import RSVPModuleView from "@/components/app/modules/RSVPModuleView";
import VendorsModuleView from "@/components/app/modules/VendorsModuleView";
import type {
  BudgetModuleData,
  ChecklistModuleData,
  ConciergeModuleData,
  DocumentModuleData,
  GuestModuleData,
  ModuleDataResult,
  RSVPModuleData,
  VendorModuleData,
} from "@/lib/event-modules/types";

type BaseProps<T> = {
  eventId: string;
  initialResult: ModuleDataResult<T>;
};

export function GuestsModulePageClient(props: BaseProps<GuestModuleData>) {
  return (
    <ModulePageClient eventId={props.eventId} modulePath="guests" initialResult={props.initialResult}>
      {(data) => <GuestsModuleView data={data} />}
    </ModulePageClient>
  );
}

export function RSVPModulePageClient(props: BaseProps<RSVPModuleData>) {
  return (
    <ModulePageClient eventId={props.eventId} modulePath="rsvp" initialResult={props.initialResult}>
      {(data) => <RSVPModuleView data={data} />}
    </ModulePageClient>
  );
}

export function BudgetModulePageClient(props: BaseProps<BudgetModuleData>) {
  return (
    <ModulePageClient
      eventId={props.eventId}
      modulePath="budget"
      apiPath={`/api/events/${encodeURIComponent(props.eventId)}/payments`}
      initialResult={props.initialResult}
    >
      {(data) => <BudgetModuleView data={data} />}
    </ModulePageClient>
  );
}

export function VendorsModulePageClient(props: BaseProps<VendorModuleData>) {
  return (
    <ModulePageClient eventId={props.eventId} modulePath="vendors" initialResult={props.initialResult}>
      {(data) => <VendorsModuleView data={data} />}
    </ModulePageClient>
  );
}

export function DocumentsModulePageClient(props: BaseProps<DocumentModuleData>) {
  return (
    <ModulePageClient eventId={props.eventId} modulePath="documents" initialResult={props.initialResult}>
      {(data) => <DocumentsModuleView data={data} />}
    </ModulePageClient>
  );
}

export function ChecklistModulePageClient(props: BaseProps<ChecklistModuleData>) {
  return (
    <ModulePageClient eventId={props.eventId} modulePath="checklist" initialResult={props.initialResult}>
      {(data) => <ChecklistModuleView data={data} />}
    </ModulePageClient>
  );
}

export function ConciergeModulePageClient(props: BaseProps<ConciergeModuleData>) {
  return (
    <ModulePageClient
      eventId={props.eventId}
      modulePath="concierge"
      apiPath="/api/concierge"
      initialResult={props.initialResult}
    >
      {(data) => <ConciergeModuleView data={data} />}
    </ModulePageClient>
  );
}
