import { neonQuery } from "@/lib/neon/server-db";
import type {
  PortfolioProject,
  PortfolioCategoryId,
  ProjectType,
  EditorialReviewStatus,
  ClientConsentStatus,
  PortfolioAuditAction,
  PortfolioAuditLogEntry,
} from "./types";

type DbPortfolioRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  category_label: string;
  location: string;
  year: string;
  guest_count: string | null;
  is_real: boolean;
  project_type?: string;
  status: "published" | "draft" | "archived";
  editorial_review_status?: string;
  publication_authorized?: boolean;
  client_consent_status?: string;
  authorization_notes?: string | null;
  material_source?: string | null;
  display_order?: number;
  is_featured: boolean;
  cover_image: string;
  cover_aspect: "portrait" | "landscape" | "square";
  services: unknown;
  summary: string;
  narrative: unknown;
  gallery: unknown;
  details: unknown;
  credits: unknown;
  demo_url: string | null;
  demo_label: string | null;
  published_at: string | Date;
  seo: unknown;
  created_at: string | Date;
  updated_at: string | Date;
};

type DbAuditRow = {
  id: string;
  project_id: string;
  actor_email: string;
  action: string;
  details: unknown;
  created_at: string | Date;
};

function parseJsonField<T>(field: unknown, fallback: T): T {
  if (!field) return fallback;
  if (typeof field === "object") return field as T;
  if (typeof field === "string") {
    try {
      return JSON.parse(field) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function mapRowToProject(row: DbPortfolioRow): PortfolioProject {
  const publishedAtStr =
    row.published_at instanceof Date
      ? row.published_at.toISOString().split("T")[0]
      : typeof row.published_at === "string"
      ? row.published_at.split("T")[0]
      : new Date().toISOString().split("T")[0];

  const projectType: ProjectType =
    row.project_type === "conceptual" ||
    row.project_type === "demonstracao" ||
    row.project_type === "real"
      ? (row.project_type as ProjectType)
      : row.is_real
      ? "real"
      : "conceptual";

  const editorialReviewStatus: EditorialReviewStatus =
    row.editorial_review_status === "draft" ||
    row.editorial_review_status === "pending_review" ||
    row.editorial_review_status === "approved"
      ? (row.editorial_review_status as EditorialReviewStatus)
      : "pending_review";

  const clientConsentStatus: ClientConsentStatus =
    row.client_consent_status === "AUTHORIZED" ||
    row.client_consent_status === "CONFIRMATION_PENDING" ||
    row.client_consent_status === "INTERNAL_ONLY"
      ? (row.client_consent_status as ClientConsentStatus)
      : "CONFIRMATION_PENDING";

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle || "",
    category: row.category as PortfolioCategoryId,
    categoryLabel: row.category_label || row.category,
    location: row.location || "",
    year: row.year || "",
    guestCount: row.guest_count || undefined,
    isReal: row.is_real,
    projectType,
    status: row.status,
    editorialReviewStatus,
    publicationAuthorized: row.publication_authorized === true,
    clientConsentStatus,
    authorizationNotes: row.authorization_notes || undefined,
    materialSource: row.material_source || undefined,
    displayOrder: row.display_order ?? 0,
    isFeatured: row.is_featured,
    coverImage: row.cover_image,
    coverAspect: row.cover_aspect || "landscape",
    services: parseJsonField<string[]>(row.services, []),
    summary: row.summary || "",
    narrative: parseJsonField(row.narrative, {
      vision: "",
      challenge: "",
      signature: "",
      result: "",
    }),
    gallery: parseJsonField(row.gallery, []),
    details: parseJsonField(row.details, []),
    credits: parseJsonField(row.credits, []),
    demoUrl: row.demo_url || undefined,
    demoLabel: row.demo_label || undefined,
    publishedAt: publishedAtStr,
    seo: parseJsonField(row.seo, {
      title: row.title,
      description: row.summary || "",
    }),
  };
}

/**
 * Compatibilidade sem efeitos laterais: leituras públicas nunca semeiam a base
 * de dados. A carga editorial deve ocorrer por migration/operador autorizado.
 */
export async function ensurePortfolioSeeded(): Promise<void> {
  return;
}

async function insertProject(p: PortfolioProject): Promise<void> {
  await neonQuery(
    `INSERT INTO public.portfolio_projects (
      id, slug, title, subtitle, category, category_label, location, year,
      guest_count, is_real, project_type, status, editorial_review_status,
      publication_authorized, client_consent_status, authorization_notes,
      material_source, display_order, is_featured, cover_image, cover_aspect,
      services, summary, narrative, gallery, details, credits, demo_url, demo_label,
      published_at, seo, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8,
      $9, $10, $11, $12, $13,
      $14, $15, $16,
      $17, $18, $19, $20, $21,
      $22, $23, $24, $25, $26, $27, $28, $29,
      $30, $31, now()
    )
    ON CONFLICT (slug) DO NOTHING;`,
    [
      p.id,
      p.slug,
      p.title,
      p.subtitle,
      p.category,
      p.categoryLabel,
      p.location,
      p.year,
      p.guestCount || null,
      p.isReal,
      p.projectType || (p.isReal ? "real" : "conceptual"),
      p.status || "draft",
      p.editorialReviewStatus || "pending_review",
      p.publicationAuthorized === true,
      p.clientConsentStatus || "CONFIRMATION_PENDING",
      p.authorizationNotes || null,
      p.materialSource || null,
      p.displayOrder || 0,
      Boolean(p.isFeatured),
      p.coverImage,
      p.coverAspect || "landscape",
      JSON.stringify(p.services),
      p.summary,
      JSON.stringify(p.narrative),
      JSON.stringify(p.gallery),
      JSON.stringify(p.details),
      JSON.stringify(p.credits || []),
      p.demoUrl || null,
      p.demoLabel || null,
      p.publishedAt || new Date().toISOString(),
      JSON.stringify(p.seo),
    ]
  );
}

export async function listProjectsFromDb(options?: {
  category?: PortfolioCategoryId;
  includeDrafts?: boolean;
}): Promise<PortfolioProject[]> {
  await ensurePortfolioSeeded();

  const { category = "todos", includeDrafts = false } = options || {};

  let query = `SELECT * FROM public.portfolio_projects`;
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (!includeDrafts) {
    params.push("published");
    conditions.push(`status = $${params.length}`);
    params.push(true);
    conditions.push(`publication_authorized = $${params.length}`);
    params.push("approved");
    conditions.push(`editorial_review_status = $${params.length}`);
    params.push("AUTHORIZED");
    conditions.push(`client_consent_status = $${params.length}`);
  }

  if (category !== "todos") {
    params.push(category);
    conditions.push(`category = $${params.length}`);
  }

  if (conditions.length > 0) {
    query += ` WHERE ` + conditions.join(" AND ");
  }

  query += ` ORDER BY is_featured DESC, display_order ASC, published_at DESC, created_at DESC;`;

  const result = await neonQuery<DbPortfolioRow>(query, params);
  return result.rows.map(mapRowToProject);
}

export async function getProjectBySlugFromDb(
  slug: string,
  options?: { allowDrafts?: boolean }
): Promise<PortfolioProject | null> {
  await ensurePortfolioSeeded();

  const allowDrafts = Boolean(options?.allowDrafts);
  let query = `SELECT * FROM public.portfolio_projects WHERE slug = $1`;
  const params: unknown[] = [slug];

  if (!allowDrafts) {
    query += ` AND status = 'published' AND publication_authorized = true AND editorial_review_status = 'approved' AND client_consent_status = 'AUTHORIZED'`;
  }

  query += ` LIMIT 1;`;

  const result = await neonQuery<DbPortfolioRow>(query, params);
  if (result.rows.length === 0) return null;

  return mapRowToProject(result.rows[0]);
}

export async function createProjectInDb(
  project: PortfolioProject,
  actorEmail: string = "admin@haxrsignature.com"
): Promise<PortfolioProject> {
  await ensurePortfolioSeeded();

  // Valores predefinidos de segurança estrita
  const secureProject: PortfolioProject = {
    ...project,
    status: project.status || "draft",
    editorialReviewStatus: project.editorialReviewStatus || "pending_review",
    publicationAuthorized: Boolean(project.publicationAuthorized),
    clientConsentStatus: project.clientConsentStatus || "CONFIRMATION_PENDING",
  };

  // Trava de publicação segura (Publication Gate)
  if (secureProject.status === "published") {
    if (
      secureProject.editorialReviewStatus !== "approved" ||
      secureProject.publicationAuthorized !== true ||
      secureProject.clientConsentStatus !== "AUTHORIZED"
    ) {
      throw new Error(
        "PUBLICATION_BLOCKED: Não é permitido criar um projecto com status 'published' sem aprovação editorial ('approved'), consentimento confirmado ('AUTHORIZED') e autorização explícita ('publicationAuthorized: true')."
      );
    }
  }

  await insertProject(secureProject);

  await recordPortfolioAudit({
    projectId: secureProject.id,
    actorEmail,
    action: "create",
    details: {
      slug: secureProject.slug,
      title: secureProject.title,
      status: secureProject.status,
      projectType: secureProject.projectType,
    },
  });

  return secureProject;
}

export async function updateProjectInDb(
  id: string,
  updates: Partial<PortfolioProject>,
  actorEmail: string = "admin@haxrsignature.com"
): Promise<PortfolioProject> {
  await ensurePortfolioSeeded();

  const existingRes = await neonQuery<DbPortfolioRow>(
    `SELECT * FROM public.portfolio_projects WHERE id = $1 LIMIT 1;`,
    [id]
  );

  if (existingRes.rows.length === 0) {
    throw new Error(`Projecto com id "${id}" não encontrado para actualização.`);
  }

  const current = mapRowToProject(existingRes.rows[0]);
  const merged: PortfolioProject = {
    ...current,
    ...updates,
    narrative: {
      ...current.narrative,
      ...(updates.narrative || {}),
    },
    seo: {
      ...current.seo,
      ...(updates.seo || {}),
    },
  };

  // Trava de publicação segura (Publication Gate)
  if (merged.status === "published") {
    if (
      merged.editorialReviewStatus !== "approved" ||
      merged.publicationAuthorized !== true ||
      merged.clientConsentStatus !== "AUTHORIZED"
    ) {
      throw new Error(
        "PUBLICATION_BLOCKED: Não é permitido publicar um projecto sem aprovação editorial ('approved'), consentimento confirmado ('AUTHORIZED') e autorização explícita de publicação ('publicationAuthorized: true')."
      );
    }
  }

  await neonQuery(
    `UPDATE public.portfolio_projects SET
      slug = $2,
      title = $3,
      subtitle = $4,
      category = $5,
      category_label = $6,
      location = $7,
      year = $8,
      guest_count = $9,
      is_real = $10,
      project_type = $11,
      status = $12,
      editorial_review_status = $13,
      publication_authorized = $14,
      client_consent_status = $15,
      authorization_notes = $16,
      material_source = $17,
      display_order = $18,
      is_featured = $19,
      cover_image = $20,
      cover_aspect = $21,
      services = $22,
      summary = $23,
      narrative = $24,
      gallery = $25,
      details = $26,
      credits = $27,
      demo_url = $28,
      demo_label = $29,
      published_at = $30,
      seo = $31,
      updated_at = now()
    WHERE id = $1;`,
    [
      id,
      merged.slug,
      merged.title,
      merged.subtitle,
      merged.category,
      merged.categoryLabel,
      merged.location,
      merged.year,
      merged.guestCount || null,
      merged.isReal,
      merged.projectType || "real",
      merged.status,
      merged.editorialReviewStatus || "pending_review",
      merged.publicationAuthorized === true,
      merged.clientConsentStatus || "CONFIRMATION_PENDING",
      merged.authorizationNotes || null,
      merged.materialSource || null,
      merged.displayOrder || 0,
      Boolean(merged.isFeatured),
      merged.coverImage,
      merged.coverAspect || "landscape",
      JSON.stringify(merged.services),
      merged.summary,
      JSON.stringify(merged.narrative),
      JSON.stringify(merged.gallery),
      JSON.stringify(merged.details),
      JSON.stringify(merged.credits || []),
      merged.demoUrl || null,
      merged.demoLabel || null,
      merged.publishedAt || new Date().toISOString(),
      JSON.stringify(merged.seo),
    ]
  );

  const action: PortfolioAuditAction =
    updates.status && updates.status !== current.status
      ? updates.status === "published"
        ? "publish"
        : updates.status === "archived"
        ? "archive"
        : "unpublish"
      : "update";

  await recordPortfolioAudit({
    projectId: id,
    actorEmail,
    action,
    details: {
      changedKeys: Object.keys(updates),
      previousStatus: current.status,
      newStatus: merged.status,
    },
  });

  return merged;
}

export async function deleteProjectFromDb(
  id: string,
  actorEmail: string = "admin@haxrsignature.com"
): Promise<boolean> {
  await ensurePortfolioSeeded();

  await recordPortfolioAudit({
    projectId: id,
    actorEmail,
    action: "delete",
    details: { deletedAt: new Date().toISOString() },
  });

  const res = await neonQuery(
    `DELETE FROM public.portfolio_projects WHERE id = $1;`,
    [id]
  );
  return (res.rowCount ?? 0) > 0;
}

export async function archiveProjectInDb(
  id: string,
  actorEmail: string = "admin@haxrsignature.com"
): Promise<PortfolioProject> {
  return updateProjectInDb(id, { status: "archived" }, actorEmail);
}

export async function recordPortfolioAudit(entry: {
  projectId: string;
  actorEmail: string;
  action: PortfolioAuditAction;
  details?: Record<string, unknown>;
}): Promise<void> {
  try {
    await neonQuery(
      `INSERT INTO public.portfolio_project_audit_log (
        project_id, actor_email, action, details, created_at
      ) VALUES ($1, $2, $3, $4, now());`,
      [
        entry.projectId,
        entry.actorEmail,
        entry.action,
        JSON.stringify(entry.details || {}),
      ]
    );
  } catch (error) {
    console.warn(
      "[PortfolioRepository] Falha ao registar entrada de auditoria:",
      error instanceof Error ? error.message : error
    );
  }
}

export async function listPortfolioAuditLog(
  projectId?: string,
  limit: number = 50
): Promise<PortfolioAuditLogEntry[]> {
  try {
    let query = `SELECT * FROM public.portfolio_project_audit_log`;
    const params: unknown[] = [];

    if (projectId) {
      params.push(projectId);
      query += ` WHERE project_id = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1};`;
    params.push(limit);

    const res = await neonQuery<DbAuditRow>(query, params);
    return res.rows.map((r) => ({
      id: r.id,
      projectId: r.project_id,
      actorEmail: r.actor_email,
      action: r.action as PortfolioAuditAction,
      details: parseJsonField<Record<string, unknown>>(r.details, {}),
      createdAt:
        r.created_at instanceof Date
          ? r.created_at.toISOString()
          : String(r.created_at),
    }));
  } catch (error) {
    console.warn(
      "[PortfolioRepository] Falha ao listar log de auditoria:",
      error instanceof Error ? error.message : error
    );
    return [];
  }
}
