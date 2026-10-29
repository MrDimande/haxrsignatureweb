import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";
import {
  extractReviewObjectKeyFromUrl,
  isPortfolioPublicAssetUrl,
  promoteProjectAssetsToPublic,
} from "./portfolio-promotion";
import { resolvePublicPortfolioAsset } from "./portfolio-public-assets";
import type { PortfolioProject } from "./types";

describe("HAXR Signature — Promoção de Activos de Portfólio (REVIEW -> PUBLIC)", () => {
  const testSlug = "teste-celebracao-alta-costura";
  const mockReviewDir = path.join(process.cwd(), "storage", "portfolio", "review", testSlug);
  const mockPublicDir = path.join(process.cwd(), "public", "images", "portfolio", testSlug);

  const validPngBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );

  beforeEach(async () => {
    await mkdir(mockReviewDir, { recursive: true });
    await writeFile(path.join(mockReviewDir, "capa-teste.png"), validPngBuffer);
    await writeFile(path.join(mockReviewDir, "galeria-1.png"), validPngBuffer);
  });

  afterEach(async () => {
    if (existsSync(mockReviewDir)) {
      await rm(mockReviewDir, { recursive: true, force: true });
    }
    if (existsSync(mockPublicDir)) {
      await rm(mockPublicDir, { recursive: true, force: true });
    }
  });

  const baseProject: PortfolioProject = {
    id: "proj-test-100",
    slug: testSlug,
    title: "Celebração Privada de Teste",
    subtitle: "Rigor e Discrição",
    category: "celebracoes-privadas",
    categoryLabel: "Celebrações Privadas",
    location: "Maputo",
    year: "2026",
    isReal: true,
    status: "published",
    editorialReviewStatus: "approved",
    publicationAuthorized: true,
    clientConsentStatus: "AUTHORIZED",
    coverImage: `/api/admin/portfolio/asset?key=${encodeURIComponent(
      `storage/portfolio/review/${testSlug}/capa-teste.png`
    )}`,
    services: ["Assessoria Integral"],
    summary: "Resumo editorial de alta joalharia.",
    narrative: { vision: "V", challenge: "C", signature: "S", result: "R" },
    gallery: [
      {
        src: `/api/admin/portfolio/asset?key=${encodeURIComponent(
          `storage/portfolio/review/${testSlug}/galeria-1.png`
        )}`,
        alt: "Fotografia 1",
      },
    ],
    details: [],
    publishedAt: "2026-10-28",
    seo: { title: "Teste", description: "Desc" },
  };

  test("1. Rejeita promoção se os quatro gates editoriais não estiverem cumpridos", async () => {
    const unapprovedProject: PortfolioProject = {
      ...baseProject,
      editorialReviewStatus: "pending_review",
    };

    await assert.rejects(
      async () => {
        await promoteProjectAssetsToPublic(unapprovedProject);
      },
      {
        message: /PUBLICATION_BLOCKED/,
      }
    );

    const unauthorizedProject: PortfolioProject = {
      ...baseProject,
      publicationAuthorized: false,
    };

    await assert.rejects(
      async () => {
        await promoteProjectAssetsToPublic(unauthorizedProject);
      },
      {
        message: /PUBLICATION_BLOCKED/,
      }
    );

    const noConsentProject: PortfolioProject = {
      ...baseProject,
      clientConsentStatus: "CONFIRMATION_PENDING",
    };

    await assert.rejects(
      async () => {
        await promoteProjectAssetsToPublic(noConsentProject);
      },
      {
        message: /PUBLICATION_BLOCKED/,
      }
    );
  });

  test("2. Promove com sucesso fotografias de REVIEW para PUBLIC com preservação do original", async () => {
    const { updatedProject, summary } = await promoteProjectAssetsToPublic(baseProject);

    assert.equal(summary.promotedCount, 2);
    assert.equal(summary.reusedCount, 0);

    // As URLs no projecto devem agora ser públicas canónicas
    assert.ok(isPortfolioPublicAssetUrl(updatedProject.coverImage, testSlug));
    assert.ok(isPortfolioPublicAssetUrl(updatedProject.gallery[0].src, testSlug));

    // O original no directório de review continua intacto
    assert.ok(existsSync(path.join(mockReviewDir, "capa-teste.png")));
    assert.ok(existsSync(path.join(mockReviewDir, "galeria-1.png")));
  });

  test("3. Garante idempotência: repetição de operação reutiliza activos públicos existentes", async () => {
    const { updatedProject: firstPass } = await promoteProjectAssetsToPublic(baseProject);

    // Segunda passagem sobre o projecto já promovido
    const { updatedProject: secondPass, summary: secondSummary } =
      await promoteProjectAssetsToPublic(firstPass);

    assert.equal(secondSummary.promotedCount, 0);
    assert.equal(secondSummary.reusedCount, 2);
    assert.equal(secondPass.coverImage, firstPass.coverImage);
    assert.equal(secondPass.gallery[0].src, firstPass.gallery[0].src);
  });

  test("4. Falha de forma atómica e compensa activos parciais se um dos ficheiros estiver em falta", async () => {
    const corruptedProject: PortfolioProject = {
      ...baseProject,
      gallery: [
        {
          src: `/api/admin/portfolio/asset?key=${encodeURIComponent(
            `storage/portfolio/review/${testSlug}/ficheiro-inexistente.png`
          )}`,
          alt: "Inexistente",
        },
      ],
    };

    await assert.rejects(async () => {
      await promoteProjectAssetsToPublic(corruptedProject);
    });

    // Comprovação da compensação de falhas distribuídas: zero ficheiros órfãos no directório público
    const { readdir } = await import("node:fs/promises");
    const publicFiles = existsSync(mockPublicDir) ? await readdir(mockPublicDir) : [];
    assert.equal(publicFiles.length, 0, "O mecanismo de compensação deve purgar activos parciais do destino PUBLIC");
  });

  test("5. Comprova que a despublicação bloqueia imediatamente o acesso público às fotografias", async () => {
    const { updatedProject } = await promoteProjectAssetsToPublic(baseProject);

    // Extrair o assetId gerado da capa
    const coverAssetId = updatedProject.coverImage.split("/").pop()!;

    // Quando o projecto está publicado e aprovado, o asset público resolve com sucesso
    const resolvedWhenPublished = resolvePublicPortfolioAsset(
      updatedProject,
      testSlug,
      coverAssetId
    );
    assert.ok(resolvedWhenPublished !== null);
    assert.equal(resolvedWhenPublished?.objectKey, `portfolio/public/${testSlug}/${coverAssetId}`);

    // Ao despublicar o projecto (status = 'draft')
    const unpublishedProject: PortfolioProject = {
      ...updatedProject,
      status: "draft",
    };

    // O resolvedor público deve bloquear imediatamente (retornar null -> HTTP 404)
    const resolvedWhenDraft = resolvePublicPortfolioAsset(
      unpublishedProject,
      testSlug,
      coverAssetId
    );
    assert.equal(resolvedWhenDraft, null);
  });

  test("6. Extrai chaves e valida URLs de forma segura", () => {
    assert.equal(
      extractReviewObjectKeyFromUrl(
        "/api/admin/portfolio/asset?key=portfolio%2Freview%2Fslug%2Fimg.webp"
      ),
      "portfolio/review/slug/img.webp"
    );

    assert.equal(
      isPortfolioPublicAssetUrl(
        "/api/portfolio/assets/meu-slug/550e8400-e29b-41d4-a716-446655440000.webp",
        "meu-slug"
      ),
      true
    );

    assert.equal(
      isPortfolioPublicAssetUrl(
        "/api/portfolio/assets/outro-slug/550e8400-e29b-41d4-a716-446655440000.webp",
        "meu-slug"
      ),
      false
    );
  });
});
