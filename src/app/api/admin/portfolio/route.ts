import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isValidSession } from "@/lib/admin/auth";
import { getCurrentAdminIdentity } from "@/lib/admin/admin-identity.server";
import {
  listPortfolioProjects,
  createPortfolioProject,
  getPortfolioAuditHistory,
} from "@/lib/portfolio/service";
import type { PortfolioProject } from "@/lib/portfolio/types";

async function checkAdmin(): Promise<{ valid: boolean; email: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) return { valid: false, email: "" };
    const valid = await isValidSession(token);
    if (!valid) return { valid: false, email: "" };

    const identity = await getCurrentAdminIdentity();
    return {
      valid: true,
      email: identity?.email || process.env.ADMIN_EMAIL || "admin@haxrsignature.com",
    };
  } catch {
    return { valid: false, email: "" };
  }
}

export async function GET(request: Request) {
  const admin = await checkAdmin();
  if (!admin.valid) {
    return NextResponse.json({ error: "Sessão administrativa inválida ou expirada." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const includeHistory = searchParams.get("history") === "true";

  try {
    const projects = await listPortfolioProjects({ includeDrafts: true });
    let auditLog = null;
    if (includeHistory) {
      auditLog = await getPortfolioAuditHistory(undefined, 50);
    }

    return NextResponse.json({ success: true, projects, auditLog });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao carregar projectos." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const admin = await checkAdmin();
  if (!admin.valid) {
    return NextResponse.json({ error: "Sessão administrativa inválida ou expirada." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as PortfolioProject;

    if (!body.title || body.title.trim().length < 2) {
      return NextResponse.json({ error: "O título do projecto é obrigatório (mínimo 2 caracteres)." }, { status: 400 });
    }

    if (!body.slug || !/^[a-z0-9-]+$/.test(body.slug)) {
      return NextResponse.json({ error: "O slug deve conter apenas letras minúsculas, números e hífens." }, { status: 400 });
    }

    if (!body.coverImage) {
      return NextResponse.json({ error: "A imagem de capa é obrigatória." }, { status: 400 });
    }

    const newProject: PortfolioProject = {
      ...body,
      id: body.id || `project-${Date.now()}`,
      slug: body.slug.trim().toLowerCase(),
      title: body.title.trim(),
      subtitle: body.subtitle || "",
      category: body.category || "casamentos-lobolos",
      categoryLabel: body.categoryLabel || "Casamentos & Lobolos",
      location: body.location || "Maputo · Moçambique",
      year: body.year || new Date().getFullYear().toString(),
      isReal: body.isReal !== false,
      projectType: body.projectType || (body.isReal ? "real" : "conceptual"),
      status: body.status || "draft",
      editorialReviewStatus: body.editorialReviewStatus || "pending_review",
      publicationAuthorized: Boolean(body.publicationAuthorized),
      clientConsentStatus: body.clientConsentStatus || "CONFIRMATION_PENDING",
      authorizationNotes: body.authorizationNotes || "",
      materialSource: body.materialSource || "",
      displayOrder: typeof body.displayOrder === "number" ? body.displayOrder : 0,
      isFeatured: Boolean(body.isFeatured),
      coverImage: body.coverImage,
      coverAspect: body.coverAspect || "landscape",
      services: Array.isArray(body.services) ? body.services : [],
      summary: body.summary || "",
      narrative: {
        vision: body.narrative?.vision || "",
        challenge: body.narrative?.challenge || "",
        signature: body.narrative?.signature || "",
        result: body.narrative?.result || "",
      },
      gallery: Array.isArray(body.gallery) ? body.gallery : [],
      details: Array.isArray(body.details) ? body.details : [],
      credits: Array.isArray(body.credits) ? body.credits : [],
      publishedAt: body.publishedAt || new Date().toISOString().split("T")[0],
      seo: {
        title: body.seo?.title || `${body.title} | HAXR Signature`,
        description: body.seo?.description || body.summary || "",
        keywords: body.seo?.keywords || [],
      },
    };

    // Trava de publicação segura no servidor
    if (newProject.status === "published") {
      if (
        newProject.editorialReviewStatus !== "approved" ||
        newProject.publicationAuthorized !== true ||
        newProject.clientConsentStatus !== "AUTHORIZED"
      ) {
        return NextResponse.json(
          {
            error:
              "PUBLICATION_BLOCKED: Não é permitido criar um projecto com status 'published' sem aprovação editorial ('approved'), consentimento confirmado ('AUTHORIZED') e autorização explícita ('publicationAuthorized: true').",
          },
          { status: 422 }
        );
      }
    }

    const created = await createPortfolioProject(newProject, admin.email);

    revalidatePath("/portfolio");
    revalidatePath(`/portfolio/${created.slug}`);
    revalidatePath("/sitemap.xml");

    return NextResponse.json({ success: true, project: created }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro ao criar projecto.";
    const status = msg.startsWith("PUBLICATION_BLOCKED") ? 422 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
