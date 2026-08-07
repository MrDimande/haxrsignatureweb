import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";

export type PortalNavLink = {
  id: string;
  label: string;
  href: string;
};

export const portalTopNavLinks: readonly PortalNavLink[] = [
  { id: "insights", label: "Inspiração", href: "/insights" },
  { id: "tools", label: "Ferramentas", href: "/plataforma-eventos" },
  { id: "portfolio", label: "Eventos Reais", href: "/portfolio" },
  { id: "services", label: "Serviços", href: "/assessoria-eventos" },
  { id: "platform", label: "Plataforma", href: "/plataforma-eventos" },
  { id: "portal", label: "Portal", href: "/area-cliente" },
] as const;

export type PlanningCardData = {
  id: string;
  title: string;
  status: string;
  metric: string;
  metricLabel: string;
  progress: number;
  href: string;
  icon: LucideIcon;
};

export const portalPlanningCards: readonly PlanningCardData[] = [
  {
    id: "budget",
    title: "Orçamento",
    status: "62% executado",
    metric: "485.000 MT",
    metricLabel: "de 780.000 MT",
    progress: 62,
    href: "/tools/budget-tracker",
    icon: Wallet,
  },
  {
    id: "guests",
    title: "Lista de Convidados",
    status: "23 pendentes RSVP",
    metric: "48",
    metricLabel: "convidados · 12 famílias",
    progress: 52,
    href: "/tools/guest-list",
    icon: Users,
  },
  {
    id: "checklist",
    title: "Checklist",
    status: "3 tarefas urgentes",
    metric: "8",
    metricLabel: "tarefas activas",
    progress: 38,
    href: "/tools/wedding-checklist",
    icon: ClipboardList,
  },
] as const;

export type VendorCardData = {
  id: string;
  name: string;
  category: string;
  location: string;
  styleTags: string[];
  imageGradient: string;
  href: string;
};

export const portalVendorSamples: readonly VendorCardData[] = [];

export const assistantPromoContent = {
  label: "HAXR Concierge",
  headline: "Envie documentos. O Concierge organiza.",
  description:
    "Carregue propostas, recibos, listas de convidados e referências visuais. A IA extrai os dados — a equipa HAXR valida antes de actualizar o painel.",
  bullets: [
    "Propostas → Fornecedores",
    "Recibos → Orçamento",
    "Listas → Convidados & RSVP",
    "Imagens → Moodboard",
  ],
  ctaLabel: "Iniciar o meu projecto",
  ctaHref: "/contacto",
  secondaryLabel: "Saber mais",
  secondaryHref: "/#haxr-concierge",
  icon: Sparkles,
} as const;

export const portalDashboardPreview = {
  eventName: "Casamento · Outubro 2026",
  greeting: "Bem-vindos ao painel do vosso evento",
  conciergePending: 3,
} as const;
