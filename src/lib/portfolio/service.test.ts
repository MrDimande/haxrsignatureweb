import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  listPortfolioProjects,
  getPortfolioProject,
  getPortfolioCategories,
  getNextProjectInCollection,
} from "./service";
import { PORTFOLIO_PROJECTS } from "./catalog";

describe("HAXR Signature — The Signature Collection Portfolio Service", () => {
  test("deve listar apenas projectos publicados por defeito para a interface pública", async () => {
    const publicProjects = await listPortfolioProjects();
    assert.ok(publicProjects.length > 0, "Deve conter projectos publicados");
    for (const p of publicProjects) {
      assert.equal(p.status, "published", `Projecto ${p.id} deve ter status published`);
    }
  });

  test("não expõe rascunhos do catálogo estático, mesmo quando o chamador pede visão administrativa", async () => {
    const all = await listPortfolioProjects({ includeDrafts: true });
    assert.deepEqual(all, []);
  });

  test("deve retornar as categorias oficiais do atelier", async () => {
    const categories = await getPortfolioCategories();
    assert.ok(categories.length >= 6, "Deve ter pelo menos 6 categorias oficiais");

    const categoryIds = categories.map((c) => c.id);
    assert.ok(categoryIds.includes("todos"));
    assert.ok(categoryIds.includes("casamentos-lobolos"));
    assert.ok(categoryIds.includes("corporativos"));
    assert.ok(categoryIds.includes("celebracoes-privadas"));
    assert.ok(categoryIds.includes("identidade-cerimonial"));
    assert.ok(categoryIds.includes("convites-digitais"));
  });

  test("deve filtrar projectos por categoria correctamente", async () => {
    const publicWeddings = await listPortfolioProjects({ category: "casamentos-lobolos" });
    assert.deepEqual(publicWeddings, [], "Conteúdo sem as quatro aprovações não é público");

    const publicCeremonial = await listPortfolioProjects({
      category: "identidade-cerimonial",
    });
    assert.ok(publicCeremonial.length > 0, "Deve haver identidade cerimonial publicada");
    for (const p of publicCeremonial) {
      assert.equal(p.category, "identidade-cerimonial");
      assert.equal(p.status, "published");
    }
  });

  test("deve encontrar projecto publicado com integridade total de metadados", async () => {
    const project = await getPortfolioProject("identidade-cerimonial-legado");
    assert.ok(project, "Projecto Identidade Cerimonial deve existir publicamente");
    assert.equal(project.title, "Colecção de Identidade Cerimonial");
    assert.equal(project.location, "Maputo · Moçambique");
    assert.ok(project.narrative.vision.length > 20, "Deve ter visão descrita");
    assert.ok(project.narrative.challenge.length > 20, "Deve ter desafio descrito");
    assert.ok(project.narrative.signature.length > 20, "Deve ter assinatura descrita");
    assert.ok(project.narrative.result.length > 20, "Deve ter resultado descrito");
    assert.ok(project.gallery.length > 0, "Deve ter galeria fotográfica");
    assert.ok(project.services.length > 0, "Deve listar serviços efectivamente realizados");
  });

  test("deve blindar projectos preventivamente em revisão contra acesso público", async () => {
    // Casamento Vânia & Fabião está em pending_review
    const publicView = await getPortfolioProject("casamento-vania-fabiao");
    assert.equal(
      publicView,
      null,
      "Projecto com autorização pendente NÃO pode ser exposto publicamente"
    );

    // O administrador com allowDrafts deve conseguir aceder
    const adminView = await getPortfolioProject("casamento-vania-fabiao", {
      allowDrafts: true,
    });
    assert.ok(adminView, "Administrador deve conseguir pré-visualizar projecto em revisão");
    assert.equal(adminView.status, "draft");
    assert.equal(adminView.clientConsentStatus, "CONFIRMATION_PENDING");
  });

  test("deve retornar null para slug inexistente sem causar excepção", async () => {
    const nonExistent = await getPortfolioProject("projecto-inexistente-12345");
    assert.equal(nonExistent, null);
  });

  test("não oferece rotação quando existe apenas um projecto autorizado", async () => {
    const next = await getNextProjectInCollection("identidade-cerimonial-legado");
    assert.equal(next, null);
  });

  test("todos os projectos do catálogo devem ter estrutura estrita de alta-costura", () => {
    for (const p of PORTFOLIO_PROJECTS) {
      assert.ok(p.id, "ID é obrigatório");
      assert.ok(p.slug, "Slug é obrigatório");
      assert.ok(p.title, "Título é obrigatório");
      assert.ok(p.coverImage, "Imagem de capa é obrigatória");
      assert.ok(p.category, "Categoria é obrigatória");
      assert.ok(p.seo.title, "Título SEO é obrigatório");
      assert.ok(p.seo.description, "Descrição SEO é obrigatória");
    }
  });

  test("deve criar, actualizar, arquivar e eliminar um projecto no repositório persistente", async (t) => {
    if (process.env.HAXR_PORTFOLIO_INTEGRATION_TESTS !== "1") {
      t.skip("Teste de integração requer HAXR_PORTFOLIO_INTEGRATION_TESTS=1 e uma base descartável autorizada.");
      return;
    }
    const testId = `test-editorial-${Date.now()}`;
    const testSlug = `teste-editorial-${Date.now()}`;

    const newProject = {
      id: testId,
      slug: testSlug,
      title: "Projecto de Teste QA",
      subtitle: "Validação de persistência editorial",
      category: "casamentos-lobolos" as const,
      categoryLabel: "Casamentos & Lobolos",
      location: "Maputo · Moçambique",
      year: "2026",
      isReal: true,
      status: "draft" as const,
      editorialReviewStatus: "pending_review" as const,
      publicationAuthorized: false,
      clientConsentStatus: "CONFIRMATION_PENDING" as const,
      isFeatured: false,
      coverImage: "/images/casamento-vania-fabiao-evelyn-eventos.webp",
      coverAspect: "landscape" as const,
      services: ["Assessoria Integral", "Direcção Criativa"],
      summary: "Projecto de validação de persistência em base de dados.",
      narrative: {
        vision: "Visão de teste editorial.",
        challenge: "Desafio de teste editorial.",
        signature: "Assinatura HAXR de teste.",
        result: "Resultado verificado com sucesso.",
      },
      gallery: [],
      details: [],
      credits: [],
      publishedAt: "2026-10-26",
      seo: {
        title: "Projecto de Teste QA | HAXR Signature",
        description: "Validação de persistência editorial.",
      },
    };

    // 1. Criar como rascunho
    const created = await (await import("./service")).createPortfolioProject(newProject);
    assert.equal(created.id, testId);
    assert.equal(created.status, "draft");

    // 2. Verificar que existe nos rascunhos mas NÃO no público
    const publicList = await listPortfolioProjects();
    assert.ok(!publicList.some((p) => p.id === testId), "Rascunho não deve aparecer na listagem pública");

    const adminList = await listPortfolioProjects({ includeDrafts: true });
    assert.ok(adminList.some((p) => p.id === testId), "Rascunho deve aparecer na listagem do admin");

    // 3. Teste de trava de publicação (Publication Gate): Tentar publicar sem autorização DEVE falhar
    await assert.rejects(
      async () => {
        await (await import("./service")).updatePortfolioProject(testId, {
          status: "published",
        });
      },
      /PUBLICATION_BLOCKED/,
      "Deve bloquear publicação sem aprovação e consentimento explícito"
    );

    // 4. Actualizar satisfazendo todas as condições e publicar com sucesso
    const updated = await (await import("./service")).updatePortfolioProject(testId, {
      title: "Projecto de Teste QA (Autorizado e Publicado)",
      status: "published",
      editorialReviewStatus: "approved",
      publicationAuthorized: true,
      clientConsentStatus: "AUTHORIZED",
    });
    assert.equal(updated.title, "Projecto de Teste QA (Autorizado e Publicado)");
    assert.equal(updated.status, "published");

    // 5. Arquivar
    const archived = await (await import("./service")).archivePortfolioProject(testId);
    assert.equal(archived.status, "archived");

    // 6. Eliminar
    const deleted = await (await import("./service")).deletePortfolioProject(testId);
    assert.equal(deleted, true);

    const postDeleteList = await listPortfolioProjects({ includeDrafts: true });
    assert.ok(!postDeleteList.some((p) => p.id === testId), "Projecto eliminado não deve constar no repositório");
  });
});
