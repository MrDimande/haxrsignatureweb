import { DEFAULT_DASHBOARD_EVENT_ID } from "@/lib/dashboard/mock-dashboard-data";

export const DEFAULT_EVENT_ID = DEFAULT_DASHBOARD_EVENT_ID;
export const DEFAULT_EVENT_SLUG = "jessica-samuel";

export function eventModulePath(eventId: string, module: string): string {
  return `/app/events/${eventId}/${module}`;
}

export const BUILT_EVENT_MODULES = [
  "guests",
  "rsvp",
  "budget",
  "vendors",
  "documents",
  "checklist",
] as const;

export const PLANNED_EVENT_MODULES = [
  "timeline",
  "moodboard",
  "invitations",
  "seating",
  "check-in",
  "photo-wall",
  "contracts",
  "payments",
] as const;

export interface AppNavItem {
  label: string;
  href: string;
  iconName: string;
  ready: boolean;
  disabled?: boolean;
}

export interface AppNavGroup {
  groupName: string;
  items: AppNavItem[];
}

/** Build sidebar navigation for an event. TODO: filter by role when RBAC exists. */
export function buildAppNavigation(eventId: string | null = DEFAULT_EVENT_ID): AppNavGroup[] {
  const eventReady = Boolean(eventId?.trim());
  const eventHref = (module: string) =>
    eventReady ? eventModulePath(eventId as string, module) : "/app/dashboard";
  const eventItem = (
    label: string,
    module: string,
    iconName: string,
    ready: boolean,
  ): AppNavItem => ({
    label,
    href: eventHref(module),
    iconName,
    ready,
    disabled: !eventReady,
  });

  return [
    {
      groupName: "Overview",
      items: [
        { label: "Dashboard", href: "/app/dashboard", iconName: "layers", ready: true },
        { label: "Eventos", href: "/app/events", iconName: "calendar", ready: false },
        { label: "HAXR Concierge", href: "/app/concierge", iconName: "concierge", ready: true },
      ],
    },
    {
      groupName: "Planeamento",
      items: [
        eventItem("Checklist", "checklist", "clipboard", true),
        eventItem("Timeline", "timeline", "clock", false),
        eventItem("Moodboard", "moodboard", "palette", false),
        eventItem("Documentos", "documents", "file", true),
      ],
    },
    {
      groupName: "Experiência",
      items: [
        eventItem("Convidados", "guests", "users", true),
        eventItem("RSVP", "rsvp", "check", true),
        eventItem("Convites Digitais", "invitations", "mail", false),
        eventItem("Seating", "seating", "briefcase", false),
        eventItem("QR Check-in", "check-in", "qr", false),
        eventItem("Photo Wall", "photo-wall", "images", false),
      ],
    },
    {
      groupName: "Operação",
      items: [
        eventItem("Fornecedores", "vendors", "briefcase", true),
        eventItem("Contratos", "contracts", "signature", false),
        eventItem("Orçamento", "budget", "wallet", true),
        eventItem("Pagamentos", "payments", "card", false),
      ],
    },
    {
      groupName: "Gestão",
      items: [
        { label: "Relatórios", href: "/app/reports", iconName: "chart", ready: false },
        { label: "Definições", href: "/app/settings", iconName: "settings", ready: false },
      ],
    },
  ];
}
