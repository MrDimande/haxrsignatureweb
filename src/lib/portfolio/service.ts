import {
  PORTFOLIO_CATEGORIES,
  type PortfolioCategory,
  type PortfolioCategoryId,
  type PortfolioProject,
  isPortfolioProjectPubliclyEligible,
} from "./types";
import {
  getPublishedPortfolioProjects,
  getPortfolioProjectBySlug,
  getNextPortfolioProject,
} from "./catalog";
import {
  listProjectsFromDb,
  getProjectBySlugFromDb,
  createProjectInDb,
  updateProjectInDb,
  deleteProjectFromDb,
  archiveProjectInDb,
} from "./portfolio.repository";

export type PortfolioListOptions = {
  category?: PortfolioCategoryId;
  includeDrafts?: boolean;
};

export async function getPortfolioCategories(): Promise<readonly PortfolioCategory[]> {
  return PORTFOLIO_CATEGORIES;
}

export async function listPortfolioProjects(
  options?: PortfolioListOptions
): Promise<readonly PortfolioProject[]> {
  const { category = "todos", includeDrafts = false } = options || {};
  const isProduction =
    process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

  try {
    if (process.env.DATABASE_URL) {
      return await listProjectsFromDb({ category, includeDrafts });
    }
  } catch (error) {
    console.error(
      "[CRITICAL_PORTFOLIO_DB_FAILURE] Falha de comunicação com Neon PostgreSQL ao listar projectos:",
      error instanceof Error ? error.message : error
    );
    // Em produção na Vercel, NUNCA expor fallback estático para evitar vazamento de dados não autorizados ou rascunhos
    if (isProduction) {
      return [];
    }
  }

  // Em produção, se o banco não estiver configurado, fail-safe (nunca vazar catálogo mock)
  if (isProduction) {
    return [];
  }

  // Em ambiente offline/desenvolvimento: rascunhos nunca são servidos do catálogo estático
  if (includeDrafts) {
    return [];
  }

  // Apenas projectos estritamente autorizados e aprovados do catálogo
  const verifiedPublished = getPublishedPortfolioProjects().filter(isPortfolioProjectPubliclyEligible);

  if (category === "todos") {
    return verifiedPublished;
  }

  return verifiedPublished.filter((project) => project.category === category);
}

export async function getPortfolioProject(
  slug: string,
  options?: { allowDrafts?: boolean }
): Promise<PortfolioProject | null> {
  const isProduction =
    process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

  try {
    if (process.env.DATABASE_URL) {
      const dbProject = await getProjectBySlugFromDb(slug, options);
      // Se a base de dados respondeu, o seu resultado é a única fonte canónica da verdade
      return dbProject;
    }
  } catch (error) {
    console.error(
      `[CRITICAL_PORTFOLIO_DB_FAILURE] Falha de comunicação com Neon PostgreSQL ao procurar slug "${slug}":`,
      error instanceof Error ? error.message : error
    );
    if (isProduction) {
      return null;
    }
  }

  if (isProduction) {
    return null;
  }

  // Em ambiente offline de testes:
  const project = getPortfolioProjectBySlug(slug);
  if (!project) return null;

  if (
    !isPortfolioProjectPubliclyEligible(project)
  ) {
    if (!options?.allowDrafts) {
      return null;
    }
  }

  return project;
}

export async function getNextProjectInCollection(
  currentSlug: string
): Promise<PortfolioProject | null> {
  try {
    const all = await listPortfolioProjects({ includeDrafts: false });
    const currentIndex = all.findIndex((p) => p.slug === currentSlug);
    if (currentIndex === -1 || all.length <= 1) return null;

    const nextIndex = (currentIndex + 1) % all.length;
    return all[nextIndex];
  } catch {
    const next = getNextPortfolioProject(currentSlug);
    return next || null;
  }
}

export async function createPortfolioProject(
  project: PortfolioProject,
  actorEmail?: string
): Promise<PortfolioProject> {
  if (process.env.DATABASE_URL) {
    return await createProjectInDb(project, actorEmail);
  }
  throw new Error("DATABASE_URL não configurada para persistência.");
}

export async function updatePortfolioProject(
  id: string,
  updates: Partial<PortfolioProject>,
  actorEmail?: string
): Promise<PortfolioProject> {
  if (process.env.DATABASE_URL) {
    return await updateProjectInDb(id, updates, actorEmail);
  }
  throw new Error("DATABASE_URL não configurada para persistência.");
}

export async function deletePortfolioProject(
  id: string,
  actorEmail?: string
): Promise<boolean> {
  if (process.env.DATABASE_URL) {
    return await deleteProjectFromDb(id, actorEmail);
  }
  throw new Error("DATABASE_URL não configurada para persistência.");
}

export async function archivePortfolioProject(
  id: string,
  actorEmail?: string
): Promise<PortfolioProject> {
  if (process.env.DATABASE_URL) {
    return await archiveProjectInDb(id, actorEmail);
  }
  throw new Error("DATABASE_URL não configurada para persistência.");
}

export async function getPortfolioAuditHistory(
  projectId?: string,
  limit?: number
) {
  const { listPortfolioAuditLog } = await import("./portfolio.repository");
  return listPortfolioAuditLog(projectId, limit);
}

