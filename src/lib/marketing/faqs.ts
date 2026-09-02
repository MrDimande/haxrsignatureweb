import { assessoriaFaqs, convidadosFaqs } from "@/lib/seo/service-faqs";
import { invitationFaqs } from "@/lib/site-config";

export type FaqSection = {
  id: string;
  title: string;
  links: { href: string; label: string }[];
  items: readonly { q: string; a: string }[];
};

export const plataformaFaqs = [
  {
    q: "O que é a Plataforma HAXR?",
    a: "É o ecossistema digital proprietário da HAXR Signature, convidados, fornecedores, documentos, Concierge e operação do evento. Não é um produto à parte: estende a assessoria com tecnologia discreta.",
  },
  {
    q: "Preciso de criar conta para usar as ferramentas?",
    a: "As ferramentas de planeamento estão disponíveis para exploração no site. A operação completa e persistência de dados activam-se com conta gratuita no painel em /dashboard.",
  },
  {
    q: "O HAXR Concierge substitui a equipa?",
    a: "Não. O Concierge organiza propostas, recibos e listas automaticamente, mas a equipa HAXR valida antes de aplicar, especialmente em orçamentos, fornecedores e convidados.",
  },
] as const;

export const geralFaqs = [
  {
    q: "A HAXR trabalha só em Maputo?",
    a: "A sede e a curadoria principal são em Maputo, mas acompanhamos celebrações em todo Moçambique e destinos selecionados, conforme o âmbito do projecto.",
  },
  {
    q: "Como pedir uma proposta?",
    a: "Use o formulário em /contacto, indique a data e o tipo de evento, ou fale connosco por WhatsApp. Respondemos com discrição e uma proposta personalizada.",
  },
  {
    q: "Posso submeter o meu casamento para o portfólio?",
    a: "Sim. Clientes e casais podem candidatar-se em /portfolio/submeter. A equipa editorial avalia cada história antes de publicação.",
  },
] as const;

export const faqSections: FaqSection[] = [
  {
    id: "assessoria",
    title: "Assessoria de Eventos",
    links: [{ href: "/assessoria-eventos", label: "Página de assessoria" }],
    items: assessoriaFaqs,
  },
  {
    id: "convites",
    title: "Convites & Identidade",
    links: [{ href: "/convites-identidade-visual", label: "Convites digitais" }],
    items: invitationFaqs,
  },
  {
    id: "convidados",
    title: "Gestão de Convidados",
    links: [{ href: "/gestao-convidados", label: "RSVP e operação" }],
    items: convidadosFaqs,
  },
  {
    id: "plataforma",
    title: "Plataforma & Concierge",
    links: [
      { href: "/plataforma-eventos", label: "Plataforma HAXR" },
      { href: "/tools/haxr-concierge", label: "HAXR Concierge" },
    ],
    items: plataformaFaqs,
  },
  {
    id: "geral",
    title: "Geral",
    links: [{ href: "/contacto", label: "Contacto" }],
    items: geralFaqs,
  },
];

export const allFaqs = faqSections.flatMap((section) => section.items);
