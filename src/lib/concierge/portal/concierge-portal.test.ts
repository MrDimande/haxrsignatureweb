import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createConciergePortalRepository } from "./create-concierge-portal-repository";
import { createConciergeStorageProvider } from "./create-concierge-storage-provider";
import { createConciergeAIProvider } from "./create-concierge-ai-provider";
import { RuleBasedConciergeProvider } from "./concierge-ai-provider";
import { InMemoryConciergePortalRepository } from "./in-memory-concierge-portal-repository";

describe("concierge portal production-core", () => {
  it("repository factory returns memory when Supabase env is missing", () => {
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const repo = createConciergePortalRepository();
    assert.equal(repo.mode, "memory");
    assert.ok(repo instanceof InMemoryConciergePortalRepository);

    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
  });

  it("storage factory returns metadata_only when Supabase env is missing", () => {
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const storage = createConciergeStorageProvider();
    assert.equal(storage.mode, "metadata_only");

    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
  });

  it("AI provider factory always returns a provider", () => {
    const provider = createConciergeAIProvider();
    assert.ok(provider);
    assert.equal(typeof provider.classify, "function");
  });

  it("rule-based classify returns structured result without API key", async () => {
    const provider = new RuleBasedConciergeProvider();
    const result = await provider.classify({
      title: "Proposta de decoração",
      description: "Orçamento para casamento",
      source: "upload",
    });
    assert.equal(result.detectedType, "proposta");
    assert.ok(result.confidence > 0);
    assert.equal(result.provider, "rule_based");
  });

  it("in-memory repository creates and lists items", async () => {
    const repo = new InMemoryConciergePortalRepository();
    const item = await repo.createItem({
      eventId: "test-event",
      source: "manual_note",
      title: "Nota teste",
      type: "nota_operacional",
      status: "novo",
      uploadedBy: "Teste",
      manualText: "Confirmar horário",
    });
    const items = await repo.listItems("test-event");
    assert.ok(items.some((i) => i.id === item.id));
  });
});
