import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isValidSession } from "@/lib/admin/auth";
import { getCurrentAdminIdentity } from "@/lib/admin/admin-identity.server";
import {
  updatePortfolioProject,
  deletePortfolioProject,
} from "@/lib/portfolio/service";
import type { PortfolioProject } from "@/lib/portfolio/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

export async function PUT(request: Request, context: RouteContext) {
  const admin = await checkAdmin();
  if (!admin.valid) {
    return NextResponse.json({ error: "Sessão administrativa inválida ou expirada." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const updates = (await request.json()) as Partial<PortfolioProject>;

    if (updates.slug && !/^[a-z0-9-]+$/.test(updates.slug)) {
      return NextResponse.json({ error: "O slug deve conter apenas letras minúsculas, números e hífens." }, { status: 400 });
    }

    const updated = await updatePortfolioProject(id, updates, admin.email);

    revalidatePath("/portfolio");
    if (updated.slug) {
      revalidatePath(`/portfolio/${updated.slug}`);
    }
    revalidatePath("/sitemap.xml");

    return NextResponse.json({ success: true, project: updated });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro ao actualizar projecto.";
    const status = msg.startsWith("PUBLICATION_BLOCKED") ? 422 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const admin = await checkAdmin();
  if (!admin.valid) {
    return NextResponse.json({ error: "Sessão administrativa inválida ou expirada." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const success = await deletePortfolioProject(id, admin.email);
    if (!success) {
      return NextResponse.json({ error: "Projecto não encontrado para eliminação." }, { status: 404 });
    }

    revalidatePath("/portfolio");
    revalidatePath("/sitemap.xml");

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao eliminar projecto." },
      { status: 500 }
    );
  }
}
