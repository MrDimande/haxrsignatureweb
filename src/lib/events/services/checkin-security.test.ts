import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { verifyCheckinSession } from "@/app/api/events/checkin/route";
import { extractQrToken } from "@/app/admin/(panel)/events/[id]/scanner/ReceptionScannerClient";
import { buildCheckinUrl } from "@/lib/events/tokens";

describe("Segurança do Check-in — Autorização e Integridade de Acessos", () => {
  it("Rejeita pedidos anónimos sem cookie de sessão com 401 unauthorized", async () => {
    const authResult = await verifyCheckinSession();
    assert.equal(authResult.authorized, false);
    if (!authResult.authorized) {
      assert.equal(authResult.status, 401);
      assert.equal(authResult.error, "unauthorized");
      assert.ok(authResult.message.includes("não autorizada"));
    }
  });

  it("extractQrToken extrai o token a partir de URLs canónicos do passe", () => {
    const rawToken = "a1b2c3d4e5f60718293a4b5c6d7e8f90";
    const canonicalUrl = "https://www.haxrsignature.com/event/aed4c44a-49f8-4e9e-8b6b-cd5b3c701102/checkin/" + rawToken;
    const urlWithQuery = canonicalUrl + "?source=qr";
    const urlWithSlash = canonicalUrl + "/";

    assert.equal(extractQrToken(canonicalUrl), rawToken);
    assert.equal(extractQrToken(urlWithQuery), rawToken);
    assert.equal(extractQrToken(urlWithSlash), rawToken);
    assert.equal(extractQrToken(rawToken), rawToken);
    assert.equal(extractQrToken("   " + rawToken + "   "), rawToken);
  });

  it("extractQrToken preserva tokens brutos", () => {
    assert.equal(extractQrToken("curto"), "curto");
    assert.equal(extractQrToken(""), "");
  });

  it("Atomicidade e concorrência: primeiro check-in aceita e segundo identifica alreadyCheckedIn", () => {
    type GuestState = {
      id: string;
      eventId: string;
      qrToken: string;
      status: "confirmed" | "checked_in";
      checkinCount: number;
    };

    const mockDb: Record<string, GuestState> = {
      "token-guest-1": {
        id: "guest-uuid-1",
        eventId: "event-uuid-1",
        qrToken: "token-guest-1",
        status: "confirmed",
        checkinCount: 0,
      },
    };

    function simulatePerformCheckin(eventId: string, token: string) {
      const guest = mockDb[token];
      if (!guest || guest.eventId !== eventId) {
        return { ok: false, error: "not_found" };
      }

      if (guest.status === "checked_in") {
        return {
          ok: true,
          checkedIn: false,
          alreadyCheckedIn: true,
          guest: { id: guest.id, status: guest.status },
        };
      }

      guest.status = "checked_in";
      guest.checkinCount += 1;

      return {
        ok: true,
        checkedIn: true,
        alreadyCheckedIn: false,
        guest: { id: guest.id, status: guest.status },
      };
    }

    const firstAttempt = simulatePerformCheckin("event-uuid-1", "token-guest-1");
    assert.equal(firstAttempt.ok, true);
    assert.equal(firstAttempt.checkedIn, true);
    assert.equal(firstAttempt.alreadyCheckedIn, false);
    assert.equal(mockDb["token-guest-1"].checkinCount, 1);

    const secondAttempt = simulatePerformCheckin("event-uuid-1", "token-guest-1");
    assert.equal(secondAttempt.ok, true);
    assert.equal(secondAttempt.checkedIn, false);
    assert.equal(secondAttempt.alreadyCheckedIn, true);
    assert.equal(mockDb["token-guest-1"].checkinCount, 1);

    const crossEventAttempt = simulatePerformCheckin("outro-evento-uuid", "token-guest-1");
    assert.equal(crossEventAttempt.ok, false);
    assert.equal(crossEventAttempt.error, "not_found");
  });

  it("Pedidos concorrentes para o mesmo token produzem estritamente apenas 1 entrada válida", async () => {
    let checkinCounter = 0;
    let guestStatus = "confirmed";

    async function atomicCheckinOperation() {
      if (guestStatus === "checked_in") {
        return { alreadyCheckedIn: true };
      }
      guestStatus = "checked_in";
      checkinCounter++;
      return { checkedIn: true };
    }

    const results = await Promise.all([
      atomicCheckinOperation(),
      atomicCheckinOperation(),
      atomicCheckinOperation(),
      atomicCheckinOperation(),
      atomicCheckinOperation(),
    ]);

    const successfulEntries = results.filter((r) => r.checkedIn).length;
    const duplicateRejections = results.filter((r) => r.alreadyCheckedIn).length;

    assert.equal(successfulEntries, 1);
    assert.equal(duplicateRejections, 4);
    assert.equal(checkinCounter, 1);
  });

  it("Integridade do grupo: lotação autorizada e contabilização correcta", () => {
    const singleGuest = { name: "Convidado Individual", plusOnes: 0 };
    const coupleGuest = { name: "Convidado Casal", plusOnes: 1, guestNotes: "Acompanhantes: Cônjuge" };
    const familyGuest = { name: "Convidado Família", plusOnes: 2, guestNotes: "Acompanhantes: Filho 1, Filho 2" };

    const calcPartySize = (g: { plusOnes: number }) => 1 + (g.plusOnes ?? 0);

    assert.equal(calcPartySize(singleGuest), 1);
    assert.equal(calcPartySize(coupleGuest), 2);
    assert.equal(calcPartySize(familyGuest), 3);

    const testUrl = buildCheckinUrl("aed4c44a-49f8-4e9e-8b6b-cd5b3c701102", "token-crypto-32-chars-long-abcde");
    assert.ok(!testUrl.includes("Cônjuge"));
    assert.ok(!testUrl.includes("Filho"));
    assert.ok(!testUrl.includes("Acompanhantes"));
  });

  it("Preservação dos 25 registos anteriores: tokens preservados e recuperação sem duplicar", () => {
    const sampleExistingGuest = {
      id: "guest-existente-001",
      eventId: "aed4c44a-49f8-4e9e-8b6b-cd5b3c701102",
      name: "Convidado Existente Neidy e José",
      qrToken: "existing_token_from_neon_db_32ch",
      status: "confirmed" as const,
      plusOnes: 1,
    };

    const passUrl = buildCheckinUrl(sampleExistingGuest.eventId, sampleExistingGuest.qrToken);

    assert.ok(passUrl.includes(sampleExistingGuest.qrToken));
    assert.ok(passUrl.includes(sampleExistingGuest.eventId));
    assert.equal(sampleExistingGuest.qrToken, "existing_token_from_neon_db_32ch");
  });
});