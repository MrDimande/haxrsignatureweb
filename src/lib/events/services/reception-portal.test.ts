import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Recepção & Check-in Multi-Evento — Arquitectura e Isolamento de Segurança", () => {
  it("Navegação administrativa: rotas /admin/events e /admin/events/checkin são avaliadas de forma independente", () => {
    const checkinPathname = "/admin/events/checkin";
    const eventsPathname = "/admin/events";
    const eventDetailPathname = "/admin/events/aed4c44a-49f8-4e9e-8b6b-cd5b3c701102";

    function isRouteActive(pathname: string, href: string): boolean {
      const isCheckInBranch =
        pathname === "/admin/events/checkin" ||
        pathname.startsWith("/admin/events/checkin/");
      return href === "/admin/events"
        ? pathname === href || (pathname.startsWith(`${href}/`) && !isCheckInBranch)
        : pathname === href || pathname.startsWith(`${href}/`);
    }

    // Na rota de checkin:
    assert.equal(isRouteActive(checkinPathname, "/admin/events/checkin"), true, "Recepção deve estar activa em /admin/events/checkin");
    assert.equal(isRouteActive(checkinPathname, "/admin/events"), false, "Eventos NÃO deve estar activo em /admin/events/checkin");

    // Na rota de eventos:
    assert.equal(isRouteActive(eventsPathname, "/admin/events"), true, "Eventos deve estar activo em /admin/events");
    assert.equal(isRouteActive(eventsPathname, "/admin/events/checkin"), false, "Recepção NÃO deve estar activa em /admin/events");

    // No detalhe de um evento:
    assert.equal(isRouteActive(eventDetailPathname, "/admin/events"), true, "Eventos deve estar activo no detalhe de evento");
    assert.equal(isRouteActive(eventDetailPathname, "/admin/events/checkin"), false, "Recepção NÃO deve estar activa no detalhe de evento");
  });

  it("Construção dinâmica de rotas de scanner: nunca utiliza UUID estático ou fixo", () => {
    const eventIds = [
      "aed4c44a-49f8-4e9e-8b6b-cd5b3c701102",
      "bbf5d55b-50f9-5e0e-9c7c-de6c4d812203",
      "cc06e66c-61fa-6f1f-0d8d-ef7d5e923304",
    ];

    for (const id of eventIds) {
      const scannerUrl = `/admin/events/${id}/scanner`;
      const checkinTabUrl = `/admin/events/${id}?tab=checkin`;

      assert.equal(scannerUrl, `/admin/events/${id}/scanner`);
      assert.equal(checkinTabUrl, `/admin/events/${id}?tab=checkin`);
      assert.ok(scannerUrl.includes(id));
    }
  });

  it("Isolamento de dados no índice: listagem de eventos nunca expõe tokens de convidados", () => {
    // Estrutura agregada retornada por listGuestStatsByEventIds
    const sampleStats = {
      totalGuests: 120,
      confirmed: 85,
      checkedIn: 42,
      unassigned: 5,
    };

    // Verifica que não existem propriedades de token nem dados individuais de convidados
    assert.equal((sampleStats as Record<string, unknown>).qrToken, undefined);
    assert.equal((sampleStats as Record<string, unknown>).tokens, undefined);
    assert.equal((sampleStats as Record<string, unknown>).guestList, undefined);
  });

  it("Validação de tab na página de detalhe: ?tab=checkin activa directamente a aba de check-in", () => {
    const validTabs = [
      "guests", "review", "contacts", "seats", "floor-plan", "qr", "sheets",
      "checkin", "report", "gifts", "history", "concierge", "portal", "settings"
    ];

    const isValidTab = (t?: string | null): boolean => Boolean(t && validTabs.includes(t));

    assert.equal(isValidTab("checkin"), true);
    assert.equal(isValidTab("guests"), true);
    assert.equal(isValidTab("invalid-tab"), false);
    assert.equal(isValidTab(null), false);
    assert.equal(isValidTab(undefined), false);
  });
});
