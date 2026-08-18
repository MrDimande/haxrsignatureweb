export type FerramentaTier = "core" | "planeamento" | "operacao" | "comercial";

export type FerramentaItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  image: string;
  tier: FerramentaTier;
  includedIn: string;
  cta: string;
};

export const ferramentasCatalog: readonly FerramentaItem[] = [
  {
    id: "concierge",
    title: "HAXR Concierge",
    description:
      "Encaminhe propostas, recibos e inspiração — a equipa classifica e aplica nos módulos certos.",
    href: "/tools/haxr-concierge",
    image: "/images/tools/concierge-bg.png",
    tier: "core",
    includedIn: "Assessoria e Plataforma HAXR",
    cta: "Conhecer Concierge",
  },
  {
    id: "guest-list",
    title: "Lista & RSVP",
    description: "Lista de convidados, grupos, confirmações e exportação para a equipa.",
    href: "/tools/guest-list",
    image: "/images/tools/guest-list-bg.png",
    tier: "core",
    includedIn: "Pacotes Signature e Royal",
    cta: "Explorar lista",
  },
  {
    id: "vendor-manager",
    title: "Gestor de Fornecedores",
    description: "Contratos, contactos, sinais e pagamentos — tudo num só painel.",
    href: "/tools/vendor-manager",
    image: "/images/tools/vendor-manager-bg.png",
    tier: "planeamento",
    includedIn: "Assessoria e Plataforma HAXR",
    cta: "Gerir fornecedores",
  },
  {
    id: "budget-tracker",
    title: "Orçamento",
    description: "Despesas, parcelas e controlo financeiro do evento em meticais.",
    href: "/tools/budget-tracker",
    image: "/images/tools/budget-tracker-bg.png",
    tier: "planeamento",
    includedIn: "Assessoria completa",
    cta: "Organizar orçamento",
  },
  {
    id: "wedding-checklist",
    title: "Checklist",
    description: "Cronograma personalizado por data do casamento — tarefas e lembretes.",
    href: "/tools/wedding-checklist",
    image: "/images/tools/concierge-bg.png",
    tier: "planeamento",
    includedIn: "Plataforma HAXR",
    cta: "Ver checklist",
  },
  {
    id: "vision-boards",
    title: "Vision Boards",
    description: "Moodboards partilháveis com a equipa HAXR e fornecedores curados.",
    href: "/tools/vision-boards",
    image: "/images/tools/concierge-bg.png",
    tier: "planeamento",
    includedIn: "Assessoria e Signature",
    cta: "Criar moodboard",
  },
  {
    id: "rsvp-service",
    title: "RSVP Digital",
    description: "Confirmações elegantes integradas no convite — página comercial do serviço.",
    href: "/gestao-convidados",
    image: "/images/tools/guest-list-bg.png",
    tier: "operacao",
    includedIn: "Todos os pacotes de convite",
    cta: "Saber mais",
  },
  {
    id: "find-seat",
    title: "Find Your Seat",
    description: "O convidado encontra mesa e lugar na recepção com discrição.",
    href: "/gestao-convidados",
    image: "/images/tools/guest-list-bg.png",
    tier: "operacao",
    includedIn: "Pacote Royal e assessoria",
    cta: "Saber mais",
  },
  {
    id: "checkin",
    title: "Check-in QR",
    description: "Registo de presença em tempo real no dia do evento.",
    href: "/gestao-convidados",
    image: "/images/tools/guest-list-bg.png",
    tier: "operacao",
    includedIn: "Pacote Royal e operações premium",
    cta: "Saber mais",
  },
  {
    id: "cash-registry",
    title: "Lista de Presentes",
    description: "Fundo de lua de mel e prendas digitais com elegância.",
    href: "/tools/cash-registry/setup",
    image: "/images/tools/budget-tracker-bg.png",
    tier: "comercial",
    includedIn: "Add-on ou pacote Royal",
    cta: "Configurar lista",
  },
  {
    id: "wedding-website",
    title: "Website do Casamento",
    description: "Página editorial com história, RSVP e detalhes do evento.",
    href: "/tools/wedding-website/setup",
    image: "/images/tools/concierge-bg.png",
    tier: "comercial",
    includedIn: "Pacotes Signature e Royal",
    cta: "Pré-visualizar",
  },
  {
    id: "dashboard",
    title: "Painel do Evento",
    description: "Indicadores, convidados e operação no ecossistema HAXR.",
    href: "/dashboard",
    image: "/images/tools/vendor-manager-bg.png",
    tier: "core",
    includedIn: "Clientes HAXR activos",
    cta: "Entrar",
  },
] as const;

export const ferramentasHubCopy = {
  label: "Plataforma HAXR",
  headline: "Ferramentas digitais para cada etapa do vosso evento.",
  description:
    "Incluídas nos nossos serviços — pensadas para tranquilidade, clareza e operação premium em Maputo.",
} as const;
