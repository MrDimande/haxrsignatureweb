export type PortfolioCategoryId =
  | "todos"
  | "casamentos-lobolos"
  | "corporativos"
  | "celebracoes-privadas"
  | "identidade-cerimonial"
  | "convites-digitais";

export type PortfolioCategory = {
  id: PortfolioCategoryId;
  label: string;
  description: string;
};

export const PORTFOLIO_CATEGORIES: readonly PortfolioCategory[] = [
  {
    id: "todos",
    label: "Todos os Projectos",
    description: "A colecção completa de celebrações e experiências assinadas pela HAXR.",
  },
  {
    id: "casamentos-lobolos",
    label: "Casamentos & Lobolos",
    description: "Casamentos contemporâneos e cerimónias tradicionais com identidade e protocolo.",
  },
  {
    id: "corporativos",
    label: "Eventos Corporativos & Institucionais",
    description: "Galas, lançamentos e experiências institucionais de alto padrão executivo.",
  },
  {
    id: "celebracoes-privadas",
    label: "Celebrações Privadas",
    description: "Aniversários e recepções íntimas conduzidas com rigor e discrição.",
  },
  {
    id: "identidade-cerimonial",
    label: "Identidade Cerimonial",
    description: "Direcção criativa, styling de espaços, sinalética e papelaria de alta-costura.",
  },
  {
    id: "convites-digitais",
    label: "Convites & Experiências Digitais",
    description: "Web-Convites interactivos, Save the Date, RSVP e gestão de convidados.",
  },
] as const;

export type ProjectType = "real" | "conceptual" | "demonstracao";

export type EditorialReviewStatus = "draft" | "pending_review" | "approved";

export type ClientConsentStatus = "AUTHORIZED" | "CONFIRMATION_PENDING" | "INTERNAL_ONLY";

export type PortfolioGalleryImage = {
  src: string;
  alt: string;
  caption?: string;
  authorCredit?: string;
  aspectRatio?: "portrait" | "landscape" | "square";
  order?: number;
};

export type PortfolioCredit = {
  role: string;
  name: string;
  link?: string;
};

export type PortfolioDetail = {
  label: string;
  value: string;
};

export type PortfolioProject = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: PortfolioCategoryId;
  categoryLabel: string;
  location: string;
  year: string;
  guestCount?: string;
  isReal: boolean;
  projectType?: ProjectType;
  status: "published" | "draft" | "archived";
  editorialReviewStatus?: EditorialReviewStatus;
  publicationAuthorized?: boolean;
  clientConsentStatus?: ClientConsentStatus;
  authorizationNotes?: string;
  materialSource?: string;
  displayOrder?: number;
  isFeatured?: boolean;
  coverImage: string;
  coverAspect?: "portrait" | "landscape" | "square";
  services: string[];
  summary: string;
  narrative: {
    vision: string;
    challenge: string;
    signature: string;
    result: string;
  };
  gallery: PortfolioGalleryImage[];
  details: PortfolioDetail[];
  credits?: PortfolioCredit[];
  demoUrl?: string;
  demoLabel?: string;
  publishedAt: string;
  seo: {
    title: string;
    description: string;
    keywords?: string[];
  };
};

/** A fronteira canónica para qualquer superfície pública, metadados ou sitemap. */
export function isPortfolioProjectPubliclyEligible(
  project: Pick<
    PortfolioProject,
    "status" | "editorialReviewStatus" | "publicationAuthorized" | "clientConsentStatus"
  >,
): boolean {
  return (
    project.status === "published" &&
    project.editorialReviewStatus === "approved" &&
    project.publicationAuthorized === true &&
    project.clientConsentStatus === "AUTHORIZED"
  );
}

export type PortfolioAuditAction =
  | "create"
  | "update"
  | "publish"
  | "unpublish"
  | "archive"
  | "delete";

export type PortfolioAuditLogEntry = {
  id: string;
  projectId: string;
  actorEmail: string;
  action: PortfolioAuditAction;
  details: Record<string, unknown>;
  createdAt: string;
};
