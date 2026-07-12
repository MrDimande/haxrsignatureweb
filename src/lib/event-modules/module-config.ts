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
}

export interface AppNavGroup {
  groupName: string;
  items: AppNavItem[];
}

/** Build sidebar navigation for an event. TODO: filter by role when RBAC exists. */
export function buildAppNavigation(eventId: string = DEFAULT_EVENT_ID): AppNavGroup[] {
  const e = eventId;
  return [
    {
      groupName: "Overview",
      items: [
        { label: "Dashboard", href: "/app/dashboard", iconName: "layers", ready: true },
        { label: "Eventos", href: "/app/events", iconName: "calendar", ready: false },
        { label: "HAXR Concierge", href: "/app/concierge", iconName: "sparkles", ready: true },
      ],
    },
    {
      groupName: "Planeamento",
      items: [
        { label: "Checklist", href: eventModulePath(e, "checklist"), iconName: "clipboard", ready: true },
        { label: "Timeline", href: eventModulePath(e, "timeline"), iconName: "clock", ready: false },
        { label: "Moodboard", href: eventModulePath(e, "moodboard"), iconName: "palette", ready: false },
        { label: "Documentos", href: eventModulePath(e, "documents"), iconName: "file", ready: true },
      ],
    },
    {
      groupName: "Experiência",
      items: [
        { label: "Convidados", href: eventModulePath(e, "guests"), iconName: "users", ready: true },
        { label: "RSVP", href: eventModulePath(e, "rsvp"), iconName: "check", ready: true },
        { label: "Convites Digitais", href: eventModulePath(e, "invitations"), iconName: "mail", ready: false },
        { label: "Seating", href: eventModulePath(e, "seating"), iconName: "briefcase", ready: false },
        { label: "QR Check-in", href: eventModulePath(e, "check-in"), iconName: "qr", ready: false },
        { label: "Photo Wall", href: eventModulePath(e, "photo-wall"), iconName: "images", ready: false },
      ],
    },
    {
      groupName: "Operação",
      items: [
        { label: "Fornecedores", href: eventModulePath(e, "vendors"), iconName: "briefcase", ready: true },
        { label: "Contratos", href: eventModulePath(e, "contracts"), iconName: "signature", ready: false },
        { label: "Orçamento", href: eventModulePath(e, "budget"), iconName: "wallet", ready: true },
        { label: "Pagamentos", href: eventModulePath(e, "payments"), iconName: "card", ready: false },
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
